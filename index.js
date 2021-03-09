const mongoose = require('mongoose')
const express = require('express')
const path = require('path')
const multer = require('multer')
const bodyParser = require('body-parser')
const indexRouter = require('./src/routers/index.js')
const cookieParser = require('cookie-parser')
const jsonWebToken = require('jsonwebtoken')
const AWS = require('aws-sdk')
const uuid = require('uuid')

mongoose.connect('mongodb://localhost/AWS&JWT')

const app = express()
app.listen(3000,()=>{
    console.log("server is up on port 3000")
})

app.set('view engine', 'ejs');
app.set('views', 'views');

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json());
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public','html')));

const storage = multer.memoryStorage({
    destination: function(req, file, callback) {
        callback(null, '')
    }
})
  
const filefilter = (req,file,callback)=>{
  if(file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg'){
    callback(null,true)
  }
  else{
    callback(null,false)
  }
}
  
app.use(multer({storage : storage, filefilter : filefilter}).single('profilePic'))

app.use(indexRouter)
