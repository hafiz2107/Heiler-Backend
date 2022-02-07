const nodemailer = require("nodemailer");


async function sendMail(details) {

    let OTP = Math.floor(1000 + Math.random() * 9000).toString()
    let emailBody = ` <div>
    <div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2">
        <div style="margin:50px auto;width:70%;padding:20px 0">
            <div style="border-bottom:1px solid #eee">
                <a href="#" style="font-size:1.4em;color: #00466a;text-decoration:none;font-weight:600">Heiler</a>
            </div>
            <p style="font-size:1.1em">Hi,</p>
            <p>Thank you for choosing Heiler. Use the following OTP to complete your Sign Up procedures. OTP is valid for 5 minutes</p>
            <h2 style="background: #00C9B5;margin: 0 auto;width: max-content;padding: 0 10px;color: #fff;border-radius: 4px;">${OTP}</h2>
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

    return { transporter, mailOptions, OTP }
}

module.exports = sendMail