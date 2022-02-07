const db = require('../config/database')
const collection = require('../config/collections')
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library')
const dotenv = require('dotenv')
const nodemailer = require("nodemailer");
const ObjectId = require('mongodb').ObjectId
const sendMailToUser = require('../utils/nodeMailer');

dotenv.config();



// Creating a new Client
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

module.exports = {
    // Function To Register New User
    sendOTP: async (req, res) => {
        let options = await sendMailToUser(req.body)

        options.transporter.sendMail(options.mailOptions, async function (err, info) {
            if (err) {
                res.status(201).json({ message: "There is Some error in Sending The Email" });
                return;
            }

            // inserting user to a temporary collection
            // Hashing THe password And OTP

            req.body.password = await bcrypt.hash(req.body.password, 10)
            options.OTP = await bcrypt.hash(options.OTP, 10)

            let checkForEmailInAuthUser = await db.get().collection(collection.AUTH_USER).findOne({ email: req.body.email })
            if (checkForEmailInAuthUser) {
                db.get().collection(collection.AUTH_USER).updateOne({ email: req.body.email }, { $set: { otp: options.OTP, password: req.body.password } }).then((response) => {
                    res.status(200).json(checkForEmailInAuthUser._id)
                })
            } else {
                // Inserting new User to the temp DB
                db.get().collection(collection.AUTH_USER).insertOne({ ...req.body, picture: 'https://cdn3.iconfinder.com/data/icons/avatars-round-flat/33/avat-01-512.png', otp: options.OTP }).then((result) => {
                    res.status(200).json(result.insertedId)
                }).catch((err) => {
                    res.status(400).json(err)
                })
            }
        });
    },
    verifyOtp: async (req, res) => {
        const { userId, inputOtp } = req.body;
        let user = await db.get().collection(collection.AUTH_USER).findOne({ _id: ObjectId(userId) })
        // Comparing The OTP In database and OTP Input
        bcrypt.compare(inputOtp, user.otp, function (err, response) {
            if (response) {
                // OTP is Correct
                db.get().collection(collection.USER_DETAILS).insertOne({ ...user }).then((result) => {
                    db.get().collection(collection.AUTH_USER).deleteOne({ _id: user._id }).then((deletedResponse) => {
                        res.status(200).json({ message: "OTP Verification Successfull" })
                    })
                })
            } else {
                // OTP Is incorrect
                res.status(400).json({ message: "OTP Incorrect" })
            }
        })
    },
    // Function to authenticate user on login
    authenticateUser: async (req, res) => {
        let user = await db.get().collection(collection.USER_DETAILS).findOne({ email: req.body.email })
        // Checking if there is a user
        if (user) {
            bcrypt.compare(req.body.password, user.password, function (err, response) {
                if (response) {
                    const token = jwt.sign({ email: req.body.email, password: req.body.password }, process.env.JWT_SECRET, { expiresIn: 300 });

                    if (token) {
                        res.status(200).json({
                            message: 'Auth successfull',
                            token,
                        })
                    } else {
                        // If there is any error in token generation
                        res.status(400).json({ message: "Auth Error" })
                    }
                } else {
                    //The password of the user doesn't Match
                    res.status(400).json({ message: "Wrong Password" })
                }
            })
        } else {
            // user Not found error 
            res.status(400).json({ message: "No user found" })
        }

    },
    authenticateGoogleUser: async (req, res) => {
        const { token } = req.body
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const { name, email, picture } = ticket.getPayload();
        // Finding User of same EmailID
        const user = await db.get().collection(collection.USER_DETAILS).findOne({ email: email })
        if (user) {
            // If user with same mail id is found
            // Then The response is send
            res.status(201).json({ message: "Successfully Logged in" });
        } else {
            // If there is no user with that email id then the user is signed Up;
            db.get().collection(collection.USER_DETAILS).insertOne({ username: name, email: email, picture: picture }).then((result) => {
                res.status(200).json({ message: "Signed Up successfully" })
            }).catch((err) => {
                console.log(("@authenticateGoogle User || the Error in inserting new user is : ", err));
                res.status(400).json({ message: "Some Error in signup" })
            })
        }
    },

    // Checking a user exists with the same email
    checkUserEmail: async (req, res) => {
        const { email } = req.body
        db.get().collection(collection.USER_DETAILS).findOne({ email: email }).then((result) => {
            if (result) {
                res.status(204).json({ message: "Email already exists !" })
            } else {
                res.status(200).json({ message: "Email is valid" })
            }
        })
    }
} 