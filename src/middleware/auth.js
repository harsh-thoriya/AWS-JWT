const jsonWebTokens = require('jsonwebtoken')
const path = require('path')
const pathToPublic = path.join(__dirname,'..','..','public','html')
const userModel = require('../Models/users.js');
const Cryptr = require('cryptr');

const cryptr = new Cryptr('myTotalySecretKey');

const auth = async (req, res, next) => {
    try {
        const decryptedToken = cryptr.decrypt(req.cookies.token);
        const decoded = jsonWebTokens.verify(decryptedToken,'abcd')
        const user = await userModel.findOne({ _id: decoded._id, 'jwts.token': req.cookies.token })

        if (!user) {
            throw new Error()
        }
        
        req.token = req.cookies.token
        req.user = user
        //console.log("just before next1")
        return next()
    } catch (e) {
        //console.log("just before next2")
        return res.sendFile(pathToPublic+'/login.html')
    }
}

module.exports = auth