const express = require('express')
const router = express.Router()
const controller = require('../controller/userController')
const checkAuth = require('../middlewares/authUser')

router.post('/registeruser', controller.registerUser)
router.post('/login', controller.authenticateUser)

module.exports = router