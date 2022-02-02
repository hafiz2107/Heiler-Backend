const db = require('../config/database')
const collection = require('../config/collections')
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv')
const nodemailer = require("nodemailer");
const ObjectId = require('mongodb').ObjectId

async function sendMail(details, res) {

    let OTP = Math.floor(1000 + Math.random() * 9000).toString()
    let emailBody = ` <div>
    <div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2">
        <div style="margin:50px auto;width:70%;padding:20px 0">
            <div style="border-bottom:1px solid #eee">
                <a href="#" style="font-size:1.4em;color: #00466a;text-decoration:none;font-weight:600">Heiler</a>
            </div>
            <p style="font-size:1.1em">Hi,</p>
            <p>Thank you for choosing Heiler. Use the following OTP to complete your Sign Up procedures. OTP is valid for 5 minutes</p>
            <h2 style="background: #00466a;margin: 0 auto;width: max-content;padding: 0 10px;color: #fff;border-radius: 4px;">${OTP}</h2>
            <p style="font-size:0.9em;">Regards,<br />Heiler</p>
            <hr style="border:none;border-top:1px solid #eee" />
            <div style="float:right;padding:8px 0;color:#aaa;font-size:0.8em;line-height:1;font-weight:300">
                <p>Heiler Inc</p>
            </div>
        </div>
    </div>
</div>`
    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.MAIL_AUTH_USER,
            pass: process.env.MAIL_AUTH_PASS,
        },
    });

    let mailOptions = {
        from: process.env.MAIL_AUTH_USER, // sender address
        to: details.email, // list of receivers
        subject: "Your One Time Password For Heielier is : ", // Subject line
        text: "Heiler OTP", // plain text body
        html: emailBody,
    }
    // Sending Email With OTP To the user
    transporter.sendMail(mailOptions, function (err, info) {
        if (err) {
            res.status(201).json({ message: "There is Some error in Sending The Email" });
            return;
        }

        const sendResponse = async () => {
            // inserting user to a temporary collection
            // Hashing THe password And OTP

            details.password = await bcrypt.hash(details.password, 10)
            OTP = await bcrypt.hash(OTP, 10)

            let checkForEmailInAuthUser = await db.get().collection(collection.AUTH_USER).findOne({ email: details.email })
            if (checkForEmailInAuthUser) {
                db.get().collection(collection.AUTH_USER).updateOne({ email: details.email }, { $set: { otp: OTP, password: details.password } }).then((response) => {
                    res.status(200).json(checkForEmailInAuthUser._id)
                })
            } else {
                // Inserting new User to the temp DB
                db.get().collection(collection.AUTH_USER).insertOne({ ...details, picture: 'https://cdn3.iconfinder.com/data/icons/avatars-round-flat/33/avat-01-512.png', otp: OTP }).then((result) => {
                    res.status(200).json(result.insertedId)
                }).catch((err) => {
                    res.status(202).json(err)
                })
            }



        }

        sendResponse()

    });


}

module.exports = sendMail