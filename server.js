const express = require('express')
const app = express()
const morgan = require('morgan')
var cors = require('cors')
const db = require('./config/database')

const userRouter = require('./routes/user')
const doctorRouter = require('./routes/doctor')
const adminRouter = require('./routes/admin')
require('dotenv').config()

var corsOptions = {
    origin: 'http://localhost:3000',
}

app.use(cors(corsOptions))

db.connect((err) => {
    if (err) {
        console.log("Database Connection Error : ", err)
    } else {
        console.log("Database Connected Succesfully")
    }
})

app.use(morgan('dev'))
app.use('/', userRouter);
app.use('/doctor', doctorRouter);
app.use('/admin', adminRouter);




app.listen(process.env.PORT, console.log(`Server listening on port ${process.env.PORT}`))