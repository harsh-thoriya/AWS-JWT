const express = require('express');
const auth = require('../middleware/auth.js')
const AWS = require('aws-sdk')
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

//const S3 = new AWS.S3({
//    accessKeyId : process.env.ACCESS_KEY_ID,
//    secretAccessKey: process.env.SECRET_ACCESS_KEY
//})

//router.post('/upload',(req,res)=>{
//    const params = {
//        Bucket: 'prcts3',
//        Key : 'random111.jpg',
//        Body: req.file.buffer
//    }
//
//    S3.upload(params,(err,data)=>{
//        if(err){
//            return res.send(err)
//        }
//        else{
//            console.log(data)
//            res.send("aaaaaaaaaa")
//        }
//    })
//})
//


module.exports = router