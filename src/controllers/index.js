require('dotenv/config')
const path = require('path')
const bcrypt = require('bcryptjs')
const express = require('express')
const jsonWebTokens = require('jsonwebtoken')
const userModel = require('../Models/users.js')
const auth = require('../middleware/auth.js')
const Cryptr = require('cryptr')
const AWS = require('aws-sdk')
const index = require('../controllers/index.js')
const sendMail = require('../Email/email.js')

const basePath = path.join(__dirname,'..','..')
const pathToPublic = path.join(basePath,'public','html')

const cryptr = new Cryptr(process.env.SECRET_STRING)

let generateToken = async function(user){

    const token = jsonWebTokens.sign({_id:user._id.toString() },"abcd",{expiresIn:'30m'})
    const encryptedToken = cryptr.encrypt(token).toString()
    
    user.jwts = user.jwts.concat({encryptedToken})
    
    user = await userModel.updateOne({_id: user._id},{$push: {jwts:{token : encryptedToken}}})
    return encryptedToken
}


const getSignup = (req,res,next) => res.redirect('/image')

const postSignup = async (req,res,next) => {

    try{
        const S3 = new AWS.S3({
        accessKeyId : 'ASIARLOHTBV6QQMJ32U5',
        secretAccessKey: 'V3OV57tQbQZb9EwURkRKhZZlamz4AsYIcRkgCHjB',
        sessionToken: 'FwoGZXIvYXdzENX//////////wEaDALA8+jzyL4sZ6g4HiLGAYBuJqFRHLpj+ry5AbZ6Q+Dvw3aqU21aU9LO8uYEH5PFxFKekGQG1Q9Mfu6Z3PlgSFod/SoDXW0HoUMvU8mEn0jZA+sB3Q3Xjv3mzEq5Cap3/0sLf0EyZYS0zSswZ70CXTqdVDXzrKB4FhG/XCW0dHNOj7xhodTIlKg636CM608enW9Zyib91fchi4zhPowChSco3z97FaRakspcWTd4Iwb4xaz4Nflj3j5CP2hRGAFvJ6EeMhp/1YKjF+FG+ueWMQOfXKYH/yjPk72CBjIttq30PZHvx6MB49hrhl9ZEvpgCbpXdxvXi9z3ydxOp+fhSLrl038KUbIsvxOC'
        })
        
        const params = {
            Bucket: 'prcts3',
            Key : req.body.username+'_profile_pic.jpg',
            Body: req.file.buffer,
            ContentType: 'image/jpg'
        }
        //console.log("Buffer :::: ",req.file.buffer)
        //console.log("String Buffer :::: ",req.file.buffer.toString())
        S3.upload(params, async (err,data)=>{
            if(err){
                console.log(err)
                return res.send("Can not post picture , please try again with a different one ...")
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
        
        if(user){

            
            const token = jsonWebTokens.sign({_id:user._id.toString() },"abcd",{expiresIn:'30m'})
            const encryptedToken = cryptr.encrypt(token).toString()
            
            user.jwts = []
            user.jwts = user.jwts.concat({encryptedToken})
            
            user = await userModel.updateOne({_id: user._id},{$push: {jwts:{token : encryptedToken}}})

            sendMail(req.body.email,"Forgot Password Link",'http://127.0.0.1:3000/forgotPassword/token?jwt='+encryptedToken)
    
        }
        return res.send("Link for resetting password shared with you in your email if registered. Check your mail.")
        
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
        res.clearCookie("token")
        res.redirect('/')
    } catch (e) {
        res.status(500).send('Error occured during database operation')
    }
}

const getForgotPasswordToken = async (req,res,next) => {
    //console.log(req.query.jwt)
    try {
        const decryptedToken = cryptr.decrypt(req.query.jwt)
        const decoded = jsonWebTokens.verify(decryptedToken,'abcd')
        const user = await userModel.findOne({ _id: decoded._id, 'jwts.token': req.query.jwt })

        if (!user) {
            //console.log("inside if")
            throw new Error()
        }
        
        //req.token = req.cookies.token
        req.user = user
        res.cookie('temptoken',req.query.jwt,{httpOnly:true})
        res.sendFile(pathToPublic+'/forgotpasswordform.html')
    } catch (e) {
        res.send("Invalid URL")
    }
}

const postForgotPasswordToken = async (req,res,next) => {
    //console.log(req.cookies.token)
    try {
        const decryptedToken = cryptr.decrypt(req.cookies.temptoken)
        const decoded = jsonWebTokens.verify(decryptedToken,'abcd')
        const user = await userModel.updateOne({ _id: decoded._id},{$set : {password : req.body.newPassword},$unset : {jwts : []}})
        res.clearCookie("temptoken")
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