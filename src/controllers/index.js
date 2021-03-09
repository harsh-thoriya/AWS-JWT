require('dotenv/config')
const path = require('path');
const bcrypt = require('bcryptjs')
const express = require('express');
const jsonWebTokens = require('jsonwebtoken')
const userModel = require('../Models/users.js');
const auth = require('../middleware/auth.js')
const Cryptr = require('cryptr');
const AWS = require('aws-sdk')
//const nodemailer = require('nodemailer')
const index = require('../controllers/index.js')
const sendMail = require('../Email/email.js')

const basePath = path.join(__dirname,'..','..')
const pathToPublic = path.join(__dirname,'..','..','public','html')

const cryptr = new Cryptr(process.env.SECRET_STRING);

let generateToken = async function(user){

    const token = jsonWebTokens.sign({_id:user._id.toString() },"abcd",{expiresIn:'30m'})
    const encryptedToken = cryptr.encrypt(token).toString();
    
    user.jwts = user.jwts.concat({encryptedToken})
    
    user = await userModel.updateOne({_id: user._id},{$push: {jwts:{token : encryptedToken}}})
    return encryptedToken
}


const getSignup = (req,res,next) => res.redirect('/image')

const postSignup = async (req,res,next) => {

    try{
        const S3 = new AWS.S3({
        accessKeyId : 'ASIARLOHTBV6YHNIR6GF',
        secretAccessKey: 'EP0JOex/PpZwcv5jwl3OmFEQxqBal9UdUi4HqD0E',
        sessionToken: 'FwoGZXIvYXdzEEIaDAXkCEk3A5vIUhWFpiLGAejWzXgMV3IqfzUjW6u3ElEVwoTmPQ2wtKtUn8buFYrkfaKSlA6tlWOXUBEPCA6MqI+SYucdEJWCKf72xcM6dka0T2WkvHM+KyAt3iGUZJRcpO6MC1agUNyA00AinpuZQKMAl5r6w+bVnMnT4xxP/G7BG062MeN1PAVb3+WHcvBeT51AyoDDZiC+zF63uMICUlx1wjUoPbtAvJS6v3gcg8EUsExmD3Q+iFchdTp8pWF/V7e9voVV0SrXpc8JDsE47DinrMw4/iiD4JyCBjIt6pmMPBY5tju+xsmupTgzxozQyDZROAQaEwgzxtGiVT+XkWmyg7CR6Gna60nv'
        })
        
        const params = {
            Bucket: 'prcts3',
            Key : req.body.username+'_profile_pic.jpg',
            Body: req.file.buffer
        }
    
        S3.upload(params, async (err,data)=>{
            if(err){
                return res.send("Can not post picture , please try again with a different one ...",err)
            }
            else{
                const user = new userModel({
                    username : req.body.username,
                    email: req.body.email,
                    password : req.body.password,
                    imageURL : data.Location
                })
                await user.save()

                sendMail(user.email,"Sign Up Confirmed","Congratulations! You can now login")
            
                res.redirect('/')
            }
        })
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
    try{
        const user = await userModel.findOne({email:email})
    
        const token = await generateToken(user)

        sendMail(req.body.email,"Forgot Password Link",'http://127.0.0.1:3000/forgotPassword/token?jwt='+token)
    
        res.send("Link for resetting password shared with you in email you registered with. Check your mail.")
    }
    catch(e){
        res.send("error while signing up , try again after some time")
    }    
}

const getImage = (req,res,next) => res.render('image.ejs',{imageURL : req.user.imageURL}) 

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


module.exports = {getSignup,getForgotPassword,getForgotPasswordToken,getImage,getLogout,getResetPassword,
                  getLogin,postForgotPassword,postForgotPasswordToken,postLogin,postResetPassword,postSignup}


