const path = require('path');
const bcrypt = require('bcryptjs')
const express = require('express');
const jsonWebTokens = require('jsonwebtoken')
const CryptoJs = require('crypto-js')
const userModel = require('../Models/users.js');
const auth = require('../middleware/auth.js')
const Cryptr = require('cryptr');

const router = express.Router();

const cryptr = new Cryptr('myTotalySecretKey');

const basePath = path.join(__dirname,'..','..')
const pathToPublic = path.join(__dirname,'..','..','public','html')

router.get('/',auth,(req,res,next)=>{
    res.redirect('/image')
})

router.get('/signup',async (req, res, next) => {
        try {
            const decryptedToken = cryptr.decrypt(req.cookies.token);
            const decoded = jsonWebTokens.verify(decryptedToken,'abcd')
            
            const user = await userModel.findOne({ _id: decoded._id, 'jwts.token': req.cookies.token })

            if (!user) {
                throw new Error()
            }

            req.token = decryptedToken
            req.user = user
            return next()
        } catch (e) {
            return res.sendFile(pathToPublic+'/signup.html')
        }
    },(req,res,next)=>{
            res.redirect('/image')
    })

let generateToken = async function(user){

    const token = jsonWebTokens.sign({_id:user._id.toString() },"abcd",{expiresIn:'1d'})
    const encryptedToken = cryptr.encrypt(token).toString();
    
    user.jwts = user.jwts.concat({encryptedToken})
    
    user = await userModel.updateOne({_id: user._id},{$push: {jwts:{token : encryptedToken}}})
    return encryptedToken
}

router.post('/',async (req,res,next)=>{
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
})

router.post('/signup',async (req,res,next)=>{

    const user = new userModel(req.body)
    await user.save()

    res.redirect('/')
})

router.get('/image',auth,(req,res,next)=>{
        res.sendFile(pathToPublic+'/image.html') 
})

router.get('/logout',auth,async (req,res,next)=>{
    console.log(req.user)
    try {
        req.user.jwts = req.user.jwts.filter((token) => {
            return token.token !== req.token
        })
        console.log(req.user)
        await req.user.save()

        res.redirect('/')
    } catch (e) {
        res.status(500).send('Error occured during database operation')
    }

})

module.exports = router