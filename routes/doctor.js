const express = require('express')
const router = express.Router()
const doctorController = require('../controller/doctorController')

router.post('/login', doctorController.authenticateDoctor)
router.post('/sendOtp', doctorController.sendOTP)
router.post('/checkemail', doctorController.checkDoctorEmail);
router.post('/verifyotp',doctorController.verifyOtp)
router.post('/googlelogin', doctorController.authenticateGoogleDoctor)


module.exports = router
