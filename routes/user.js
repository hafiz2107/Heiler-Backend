const express = require('express')
const router = express.Router()
const controller = require('../controller/userController')
const checkAuth = require('../middlewares/authUser')

router.post('/registeruser', controller.registerUser)
router.post('/login', controller.authenticateUser)
router.post('/googlelogin', controller.authenticateGoogleUser)
router.post('/checkemail',controller.checkUserEmail);

module.exports = router