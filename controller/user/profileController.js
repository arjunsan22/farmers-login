const User=require('../../models/userModel')
const nodemailer=require('nodemailer')
const env=require('dotenv').config()
const bcrypt=require('bcrypt')
const session = require('express-session');
const Product=require('../../models/productModel')
const Category=require('../../models/categoryModel');
const express = require('express');


function generateOTP(){
    const digits='0123456789';
    let otp='';
    for(let i=0;i<6;i++){
        otp+=digits[Math.floor(Math.random()*10)];
    }  
    return otp;         
} 


const sendVerificationEmail=async (email,otp) => {

try {
    const transporter=nodemailer.createTransport({
        service:'gmail',
        port:587,
        secure:false,  
        requireTLS:true,                                              
         
        auth:{
            user:process.env.NODEMAILER_EMAIL,
            pass:process.env.NODEMAILER_PASSWORD
        }
    })
    const mailOptions={
        from:process.env.NODEMAILER_EMAIL,
        to:email,
        subject:'OTP for password reset',
        text:`Your OTP for password reset is ${otp}`,
        html:`<p>Your OTP : <b>${otp}</b></p>`
    }
    const info=await transporter.sendMail(mailOptions);
    console.log("Email sent",info.messageId);
    return true;
    
} catch (error) {
    
console.error("Error in sending email",error);
return false;
}


}


const securePassword=async (password) => {
    try {
        const passwordHash=await bcrypt.hash(password,10);
        return passwordHash;
    } catch (error) {
        console.error("Error hashing password:", error);
        return null;
    }
}

const loadforgotpassword=async (req,res) => {
    try{
        res.render('forgotPassword')
    }
    catch(error){
        console.error(error);
        res.redirect('/pagenotfound');
    }
}

const forgotEmailCheck=async (req,res) => {
    try{
        const {email}=req.body;         
        const findUser=await User.findOne({email}); 
           if(findUser){
            const otp=generateOTP();
            const emailSent=await sendVerificationEmail(email,otp);

            if(emailSent){
                req.session.userOtp=otp;
                req.session.email=email;
                res.render('forgotPassword-OTP')
                console.log("OTP sent successfully",otp);

            }else{
              res.json({success:false,message:"Error in sending email"})
           }
    }
    else{
        res.render("forgotPassword",{message:"Email not found"})
    }
}
    catch(error){
        console.error(error);
        res.redirect('/pagenotfound');
    }

}

const forgotPasswordVerifyOTP=async (req,res) => {
    try{
        const {otp}=req.body;
       
        const userOtp=req.session.userOtp;
        console.log("OTP from session:", req.session.userOtp);

        if(otp && otp===userOtp){
            res.json({success:true,redirectUrl:'/reset-password'})
        }else{
            res.json({success:false,message:"Invalid OTP not maching"})
            res.render('forgotPassword-OTP',{message:"Invalid OTP"})
        }
    }
    catch(error){
        res.status(500).json({success:false,message:"Internal server error"})
        console.error(error);
    }
}


const loadResetPassword=async (req,res) => {
    try{
        res.render('resetPassword')
    }
    catch(error){
        console.error(error);
        res.redirect('/pagenotfound');
    }
}


const forgotPasswordResendOTP=async(req,res) => {
    try {
        const otp=generateOTP();
        req.session.userOtp=otp;
        const email=req.session.email;
        console.log("Resent OTP  to mail:",email);
        const emailSent=await sendVerificationEmail(email,otp);
        if(emailSent){
            console.log("OTP resent successfully :",otp);
            res.status(200).json({success:true,message:"OTP resent successfully"})
        }
    } catch (error) {
        console.error("Error resending Otp",error)
        res.status(500).json({success:false,message:"Internal Server Error,Try Again"})
    }

}

const resetPassword=async (req,res) => {
    try {
        const { newPass1, newPass2 }=req.body;
        const email=req.session.email;
        if( newPass1===newPass2 ){
const passwordHash=await securePassword(newPass1);
let result=await User.updateOne(

{email:email},
{$set:{password:passwordHash}}
)
console.log("Password reset successfully",result);
// const error=req.query.error || null;
res.render('login', { message: "Password reset successfully",error:null });

}else{
    res.render('resetPassword',{message:"Password not matching",error:null})
}
    } catch (error) {
        res.redirect('/pagenotfound');
    }
}


const loadProfilePage=async (req,res) => {
    try{
        const userId=req.session.user;
        const userData=await User.findById(userId);
        res.render('userProfile',{user:userData})
    
    }
    catch(error){
        console.error("error for retrieve profile data",error);
        res.redirect('/pagenotfound');
    }
}

// const loadchangeEmail=async (req,res) => {
//     try{
//         res.render('changeEmail')
//         // const userId=req.session.user;
//         // const userData=await User.findById(userId);
// }
// catch(error){
//     console.error(error);
//     res.redirect('/pagenotfound');
// }
// }

// const changeEmail=async (req,res) => {
//     try{
    
// const{email}=req.body;
// const userExists=await User.findOne({email});
// if(userExists){
//     const otp=generateOTP();
// }

//     }catch(error){

//     }
// }

module.exports = {


    loadforgotpassword,
    forgotEmailCheck,
    forgotPasswordVerifyOTP,
    loadResetPassword,
    forgotPasswordResendOTP,
    resetPassword,
    loadProfilePage,
    // loadchangeEmail,
    // changeEmail
}