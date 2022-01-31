const db = require('../config/database')
const collection = require('../config/collections')
var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');

module.exports = {
    // Function To Register New User
    registerUser: async (req, res) => {
        // Hashing THe password
        let passwordHash = await bcrypt.hash(req.body.password, 10)
        // Inserting new User to the DB
        db.get().collection(collection.USER_DETAILS).insertOne({ ...req.body, password: passwordHash }).then((result) => {
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
                    const token = jwt.sign({ email: req.body.email, password: req.body.password }, 'secret', { expiresIn: "24hr" });
                    if (token) {
                        res.status(200).json({
                            message: 'Auth successful',
                        })
                    } else {
                        // If there is any error in token generation
                        res.status(400).json({ message: "Auth Error" })
                    }
                } else {
                    // Checking the password of the user
                    res.status(200).json({ message: "Wrong Password" })
                }
            })
        } else {
            // user Not found error 
            res.status(200).json({ message: "No user found" })
        }

    }
}