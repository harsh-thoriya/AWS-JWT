const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const schema = mongoose.Schema

const userSchema = new schema({
    username:{
        type:String,
        required:true,
        unique: true
    },
    email:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    imageURL:{
        type:String
    },
    jwts:[{
        token: {
            type: String
        }
    }]
})

module.exports = mongoose.model('user', userSchema);