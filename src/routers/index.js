const express = require('express');
const auth = require('../middleware/auth.js')
const indexControllers = require('../controllers/index.js')

const router = express.Router();

router.get('/',auth.auth,indexControllers.getLogin)

router.post('/', indexControllers.postLogin)

router.get('/signup', auth.signupAuth, indexControllers.getSignup)

router.post('/signup', indexControllers.postSignup)

router.post('/forgotPassword', indexControllers.postForgotPassword)

router.get('/forgotPassword',indexControllers.getForgotPassword)

router.get('/image',auth.auth, indexControllers.getImage)

router.get('/logout',auth.auth,indexControllers.getLogout)

router.get('/forgotPassword/token', indexControllers.getForgotPasswordToken)

router.post('/forgotPassword/token', indexControllers.postForgotPasswordToken)

router.get('/resetPassword',auth.auth, indexControllers.getResetPassword)

router.post('/resetPassword',auth.auth, indexControllers.postResetPassword)






module.exports = router