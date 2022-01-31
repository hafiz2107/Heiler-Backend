const db = require('../config/database')
const collection = require('../config/collections')
var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library')
const dotenv = require('dotenv')
dotenv.config();

// Creating a new Client
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

module.exports = {
    // Function To Register New User
    registerUser: async (req, res) => {
        // Hashing THe password
        let passwordHash = await bcrypt.hash(req.body.password, 10)
        // Inserting new User to the DB
        db.get().collection(collection.USER_DETAILS).insertOne({ ...req.body, password: passwordHash, picture: 'https://cdn3.iconfinder.com/data/icons/avatars-round-flat/33/avat-01-512.png' }).then((result) => {
            res.status(200).json(result)
        }).catch((err) => {
            res.status(404).json(err)
        })
    },
    // Function to authenticate user
    authenticateUser: async (req, res) => {

        let user = await db.get().collection(collection.USER_DETAILS).findOne({ email: req.body.email })

        // Checking if there is a user
        if (user) {
            bcrypt.compare(req.body.password, user.password, function (err, response) {
                if (response) {
                    const token = jwt.sign({ username: req.body.username, email: req.body.email, password: req.body.password }, 'secret', { expiresIn: "24hr" });
                    if (token) {
                        res.status(200).json({
                            message: 'Auth successful',
                        })
                    } else {
                        // If there is any error in token generation
                        res.status(400).json({ message: "Auth Error" })
                    }
                } else {
                    //The password of the user doesn't Match
                    res.status(200).json({ message: "Wrong Password" })
                }
            })
        } else {
            // user Not found error 
            res.status(200).json({ message: "No user found" })
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