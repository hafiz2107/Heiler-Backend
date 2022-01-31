const express = require('express')
const app = express()
const morgan = require('morgan')
var cors = require('cors')
const db = require('./config/database')
var bodyParser = require('body-parser')

const userRouter = require('./routes/user')
const doctorRouter = require('./routes/doctor')
const adminRouter = require('./routes/admin')
require('dotenv').config()

var corsOptions = {
    origin: '*',
}
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())
app.use(cors(corsOptions))


db.connect((err) => {
    if (err) {
        console.log("Database Connection Error : ", err)
    } else {
        console.log("Database Connected Succesfully")
    }
})

app.use(morgan('dev'))
app.use('/user', userRouter);
app.use('/doctor', doctorRouter);
app.use('/admin', adminRouter);




app.listen(process.env.PORT, console.log(`Server listening on port ${process.env.PORT}`))