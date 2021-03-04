const mongoose = require('mongoose')
const express = require('express')
const path = require('path')
const multer = require('multer')
const bodyParser = require('body-parser')
const indexRouter = require('./src/routers/index.js')
const cookieParser = require('cookie-parser')
const jsonWebToken = require('jsonwebtoken')
//const jsonwt = require('express-jwt')

mongoose.connect('mongodb://localhost/AWS&JWT')

const app = express()
app.listen(3000,()=>{
    console.log("server is up on port 3000")
})


app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.use(cookieParser())
//app.use(jsonwt({secret:'abcd',algorithms:['HS256'],getToken: req => req.cookies.token}))
app.use(express.static(path.join(__dirname, 'public','html')));
app.use(indexRouter)
