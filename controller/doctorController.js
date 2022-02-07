const db = require('../config/database')
const collection = require('../config/collections')
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library')
const dotenv = require('dotenv')
const nodemailer = require("nodemailer");
const ObjectId = require('mongodb').ObjectId
const sendMailToDoctor = require('../utils/nodeMailer');

dotenv.config();


const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

module.exports = {
    // Function for Doctor Login
    authenticateDoctor: async (req, res) => {
        let doctor = await db.get().collection(collection.DOCTOR_DETAILS).findOne({ email: req.body.email })
        // Checking if there is a doctor
        if (doctor) {
            bcrypt.compare(req.body.password, doctor.password, function (err, response) {
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
                    //The password of the doctor doesn't Match
                    res.status(400).json({ message: "Wrong Password" })
                }
            })
        } else {
            // doctor Not found error 
            res.status(400).json({ message: "No doctor found" })
        }

    },
    // Checking a doctor exists with the same email
    checkDoctorEmail: async (req, res) => {
        const { email } = req.body
        db.get().collection(collection.DOCTOR_DETAILS).findOne({ email: email }).then((result) => {
            if (result) {
                res.status(204).json({ message: "Email already exists !" })
            } else {
                res.status(200).json({ message: "Email is valid" })
            }
        })
    },

    sendOTP: async (req, res) => {
        let options = await sendMailToDoctor(req.body)

        options.transporter.sendMail(options.mailOptions, async function (err, info) {
            if (err) {
                res.status(201).json({ message: "There is Some error in Sending The Email" });
                return;
            }

            // inserting doctor to a temporary collection
            // Hashing THe password And OTP

            req.body.password = await bcrypt.hash(req.body.password, 10)
            options.OTP = await bcrypt.hash(options.OTP, 10)

            let checkForEmailInAuthDoctor = await db.get().collection(collection.AUTH_DOCTOR).findOne({ email: req.body.email })
            if (checkForEmailInAuthDoctor) {
                db.get().collection(collection.AUTH_DOCTOR).updateOne({ email: req.body.email }, { $set: { otp: options.OTP, password: req.body.password } }).then((response) => {
                    res.status(200).json(checkForEmailInAuthDoctor._id)
                })
            } else {
                // Inserting new Doctor to the temp DB
                db.get().collection(collection.AUTH_DOCTOR).insertOne({ ...req.body, picture: 'https://cdn3.iconfinder.com/data/icons/avatars-round-flat/33/avat-01-512.png', otp: options.OTP }).then((result) => {
                    res.status(200).json(result.insertedId)
                }).catch((err) => {
                    res.status(400).json(err)
                })
            }
        });
    },

    verifyOtp: async (req, res) => {
        const { doctorId, inputOtp } = req.body;
        let doctor = await db.get().collection(collection.AUTH_DOCTOR).findOne({ _id: ObjectId(doctorId) })
        // Comparing The OTP In database and OTP Input
        bcrypt.compare(inputOtp, doctor.otp, function (err, response) {
            if (response) {
                // OTP is Correct
                db.get().collection(collection.DOCTOR_DETAILS).insertOne({ ...doctor }).then((result) => {
                    db.get().collection(collection.AUTH_DOCTOR).deleteOne({ _id: doctor._id }).then((deletedResponse) => {
                        res.status(200).json({ message: "OTP Verification Successfull" })
                    })
                })
            } else {
                // OTP Is incorrect
                res.status(400).json({ message: "OTP Incorrect" })
            }
        })
    },
}