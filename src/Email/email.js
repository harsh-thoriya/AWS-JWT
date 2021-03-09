const nodemailer = require("nodemailer")

const sendMail = (To,Subject,Text)=>{

    let mailTransporter = nodemailer.createTransport({ 
        service: 'gmail', 
        auth: { 
            user: process.env.EMAIL, 
            pass: process.env.PASSWORD
        } 
    }); 
      
    let mailDetails = { 
        from: process.env.EMAIL, 
        to: To, 
        subject: Subject, 
        text: Text
    }; 
      
    mailTransporter.sendMail(mailDetails, function(err, data) { 
        if(err) { 
            console.log(err); 
        } else { 
            console.log('Email sent successfully'); 
        } 
    }); 

}

module.exports = sendMail

