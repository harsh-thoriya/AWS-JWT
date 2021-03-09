require('dotenv/config')
const path = require('path');
const bcrypt = require('bcryptjs')
const express = require('express');
const jsonWebTokens = require('jsonwebtoken')
const userModel = require('../Models/users.js');
const auth = require('../middleware/auth.js')
const Cryptr = require('cryptr');
const AWS = require('aws-sdk')
const nodemailer = require('nodemailer')
const index = require('../controllers/index.js')

const basePath = path.join(__dirname,'..','..')
const pathToPublic = path.join(__dirname,'..','..','public','html')

const cryptr = new Cryptr('myTotalySecretKey');

let generateToken = async function(user){

    const token = jsonWebTokens.sign({_id:user._id.toString() },"abcd",{expiresIn:'30m'})
    const encryptedToken = cryptr.encrypt(token).toString();
    
    user.jwts = user.jwts.concat({encryptedToken})
    
    user = await userModel.updateOne({_id: user._id},{$push: {jwts:{token : encryptedToken}}})
    return encryptedToken
}


const getSignup = (req,res,next) => res.redirect('/image')

const postSignup = async (req,res,next) => {
    //console.log(req.file)
    try{
        const user = new userModel({
            username : req.body.username,
            email: req.body.email,
            password : req.body.password
        })
        await user.save()

        let mailTransporter = nodemailer.createTransport({ 
            service: 'gmail', 
            auth: { 
                user: process.env.EMAIL, 
                pass: process.env.PASSWORD
            } 
        }); 
          
        let mailDetails = { 
            from: process.env.EMAIL, 
            to: user.email, 
            subject: 'Sign Up Confirmed', 
            text: 'Congratulations! You can now login'
        }; 
          
        mailTransporter.sendMail(mailDetails, function(err, data) { 
            if(err) { 
                console.log(err); 
            } else { 
                console.log('Email sent successfully'); 
            } 
        }); 
    
        res.redirect('/')
    }
    catch(e){
        res.send("error while signing up , try again after some time")
    }    
}

const getLogin = (req,res,next) => res.redirect('/image')

const postLogin = async (req,res,next) => {
    try {
        const user = await userModel.findOne({username: req.body.username,password:req.body.password})
        if (!user) {
            throw new Error()
        }
        const token = await generateToken(user)
        res.cookie('token',token,{httpOnly:true})
        res.redirect('/image')
    } catch (e) {
        res.status(400).redirect('/')
    }
}

const getForgotPassword = (req,res,next) => res.sendFile(pathToPublic+'/forgotpassword.html')

const postForgotPassword = async (req,res,next) => {
    
    const email = req.body.email

    const user = await userModel.findOne({email:email})
    
    const token = await generateToken(user)

    try{

        let mailTransporter = nodemailer.createTransport({ 
            service: 'gmail', 
            auth: { 
                user: 'userdummy.dum@gmail.com', 
                pass: '123$567*90'
            } 
        }); 
          
        let mailDetails = { 
            from: 'userdummy.dum@gmail.com', 
            to: req.body.email, 
            subject: 'Forgot Password Link', 
            text: 'http://127.0.0.1:3000/forgotPassword/token?jwt='+token
        }; 
          
        mailTransporter.sendMail(mailDetails, function(err, data) { 
            if(err) { 
                console.log(err); 
            } else { 
                console.log('Link for resetting password shared with you in email you registered with. Check your mail.'); 
            } 
        }); 
    
        res.send("Link for resetting password shared with you in email you registered with. Check your mail.")
    }
    catch(e){
        res.send("error while signing up , try again after some time")
    }    
}

const getImage = (req,res,next) => res.sendFile(pathToPublic+'/image.html') 

const getLogout = async (req,res,next) => {
    //console.log(req.user)
    try {
        req.user.jwts = req.user.jwts.filter((token) => {
            return token.token !== req.token
        })
        //console.log(req.user)
        await req.user.save()
        res.clearCookie("token");
        res.redirect('/')
    } catch (e) {
        res.status(500).send('Error occured during database operation')
    }
}

const getForgotPasswordToken = async (req,res,next) => {
    //console.log(req.query.jwt)
    try {
        const decryptedToken = cryptr.decrypt(req.query.jwt);
        const decoded = jsonWebTokens.verify(decryptedToken,'abcd')
        const user = await userModel.findOne({ _id: decoded._id, 'jwts.token': req.query.jwt })

        if (!user) {
            //console.log("inside if")
            throw new Error()
        }
        
        //req.token = req.cookies.token
        req.user = user
        res.cookie('token',req.query.jwt,{httpOnly:true})
        res.sendFile(pathToPublic+'/forgotpasswordform.html')
    } catch (e) {
        res.send("Invalid URL")
    }
}

const postForgotPasswordToken = async (req,res,next) => {
    //console.log(req.cookies.token)
    try {
        const decryptedToken = cryptr.decrypt(req.cookies.token);
        const decoded = jsonWebTokens.verify(decryptedToken,'abcd')
        const user = await userModel.updateOne({ _id: decoded._id},{$set : {password : req.body.newPassword},$unset : {jwts : []}})
        res.clearCookie("token");
        res.send("Successfully updated password. Now you can login with your new password")
    } catch (e) {
        res.send("Invalid URL")
    }
}

const getResetPassword = (req,res,next) => res.sendFile(pathToPublic+'/resetpassword.html')

const postResetPassword = async (req,res,next)=>{
    const user = await userModel.findOne({_id:req.user._id, password : req.body.currentPassword})
    if(!user){
        return res.send("incorrect password")
    }
    const updatedUsers = await userModel.updateOne({_id:user._id},{password: req.body.newPassword})
    
    res.clearCookie("token")
    res.send("password updated , now login again")
}


module.exports = {getSignup,getForgotPassword,getForgotPasswordToken,getImage,getLogout,getResetPassword,getLogin,
                    postForgotPassword,postForgotPasswordToken,postLogin,postResetPassword,postSignup}


