const User=require('../../models/userModel')
const nodemailer=require('nodemailer')
const env=require('dotenv').config()
const bcrypt=require('bcrypt')
const session = require('express-session');
const Product=require('../../models/productModel')
const Category=require('../../models/categoryModel');
const express = require('express');
const Address=require('../../models/addressModel');

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



//profile page//

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



//email changing//




const loadchangeEmail=async (req,res) => {
    try{
        res.render('changeEmail')
       
}
catch(error){
    console.error(error);
    res.redirect('/pagenotfound');
}

}







//checking email for otp//

const changeEmail=async (req,res) => {
    try{
    
const{email}=req.body;
const userExists=await User.findOne({email});
if(userExists){
    const otp=generateOTP();
const emailSent=await sendVerificationEmail(email,otp);
if(emailSent){
    req.session.userOtp=otp;
    req.session.userData=req.body
    req.session.email=email;
    res.render('changeEmail-OTP')
    console.log("OTP sent successfully",otp);
    console.log("Email sent to:",email);

}
else{
   res.json({success:false,message:"Error in sending email"})
}

}else{
    res.render('changeEmail',{message:"Email not found"})
}

    }catch(error){
        console.log(error)
        res.redirect('/pagenotfound');

}
}

// const verifyEmailOTP=async (req,res) => {
//     try{
//         const {otp}=req.body;
   
//     const userOtp=req.session.userOtp;
//     console.log("OTP from session:", req.session.userOtp);

//     if(otp && otp===userOtp){
//         res.json({success:true,redirectUrl:'/reset-email'}) //change
//     }else{
//         res.json({success:false,message:"Invalid OTP not maching"})
//         res.render('forgotPassword-OTP',{message:"Invalid OTP"})
//     }

      
//     }
//     catch(error){
  
//     res.status(500).json({success:false,message:"Internal server error"})
//     console.error(error);

//     }
// }
const verifyEmailOTP = async (req, res) => {
    try {
        const { otp } = req.body;
        const userOtp = req.session.userOtp;

        console.log("OTP from session:", userOtp);
        console.log("OTP provided by user:", otp);

        // Compare OTPs as strings
        if (otp && otp.toString() === userOtp.toString()) {
            res.json({ success: true, redirectUrl: '/reset-email' });
        } else {
            res.json({ success: false, message: "Invalid OTP. Please try again." });
        }
    } catch (error) {
        console.error("Error verifying OTP:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};








const verifyEmailResendOTP=async (req,res) => {

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

const loadResetEmail=async (req,res) => {
    try{
        res.render('newEmail')
    }
    catch(error){
        console.error(error);
        res.redirect('/pagenotfound');
    }
}




const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const resetEmail = async (req, res) => {
    try {
        const { newEmail } = req.body;
        const email = req.session.email;

        if (!email) {
            return res.render('resetEmail', { message: "Session expired. Please try again.", error: null });
        }

        if (!isValidEmail(newEmail)) {
            return res.render('resetEmail', { message: "Invalid email format. Please enter a valid email.", error: null });
        }

        const result = await User.updateOne({ email: email }, { $set: { email: newEmail } });

        if (result.nModified === 0) {
            return res.render('resetEmail', { message: "Email update failed. Please try again.", error: null });
        }

        console.log("Email updated successfully", result);
        res.render('login', { message: "Email updated successfully", error: null });
    } catch (error) {
        console.error(error);
        res.redirect('/pagenotfound');
    }
};



//password change//

const loadchangePasswordpage=async (req,res) => {
    try{
        res.render('changePassword')
    }
    catch(error){
        console.error(error);
        res.redirect('/pagenotfound');
    }
}



const verfyChangePassword=async (req,res) => {

try{
    const { email } = req.body;
    const userExists = await User.findOne({ email });

    if (userExists) {
        const otp = generateOTP();
        const emailSent = await sendVerificationEmail(email, otp);

  if (emailSent) {
     req.session.userOtp = otp;
        req.session.userData = req.body;
     req.session.email = email;
     console.log("OTP sent successfully:", otp);
     res.render('changePassword-OTP');
    
    } else {
    res.json({ success: false, message: "Error in sending email" });       
    
    }
    } else {
        res.render('changePassword', { message: "Email not found. Please check your details." });
    }             

}catch(error){

console.error(error);
res.redirect('/pagenotfound');
}


}


const verfyingChangePasswordOTP=async (req,res) => {
    try {
        const { otp } = req.body;
        const userOtp = req.session.userOtp;

        console.log("OTP from session:", userOtp);
        console.log("OTP provided by user:", otp);

        // Compare OTPs as strings
        if (otp && otp.toString() === userOtp.toString()) {
            res.json({ success: true, redirectUrl: '/addnew-password' }); //addnew-password redirect url //
        } else {
            res.json({ success: false, message: "Invalid OTP. Please try again." });
        }
    } catch (error) {
        console.error("Error verifying OTP:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};



const loadAddNewPasswordPage=async (req,res) => {
    try{
        res.render('addNewPassword')
    }
    catch(error){
        console.error(error);
        res.redirect('/pagenotfound');
    }
}

const addNewPassword=async (req,res) => {
    try {
        const { newPass1, newPass2 } = req.body;
        const email = req.session.email;

        if (newPass1 === newPass2) {
            const passwordHash = await securePassword(newPass1);
            let result = await User.updateOne(

                { email: email },
                { $set: { password: passwordHash } }
            )
            console.log("Password reset successfully", result);
            res.render('login', { message: "Password reset successfully", error: null });

        } else {
            res.render('addNewPassword', { message: "Password not matching", error: null })
        }
    } catch (error) {
        res.redirect('/pagenotfound');
    }
}

const changePasswordResendbuttonOTP=async (req,res) => {
    try {
        const otp = generateOTP();
        req.session.userOtp = otp;
        const email = req.session.email;
        console.log("Resent OTP  to mail:", email);
        const emailSent = await sendVerificationEmail(email, otp);
        if (emailSent) {
            console.log("OTP resent successfully :", otp);
            res.status(200).json({ success: true, message: "OTP resent successfully" })
        }
    } catch (error) {
        console.error("Error resending Otp", error)
        res.status(500).json({ success: false, message: "Internal Server Error,Try Again" })
    }
}

module.exports = {


    loadforgotpassword,
    forgotEmailCheck,
    forgotPasswordVerifyOTP,
    loadResetPassword,
    forgotPasswordResendOTP,
    resetPassword,
    loadProfilePage,
    loadchangeEmail,
    changeEmail,
    verifyEmailOTP,
    verifyEmailResendOTP,
    loadResetEmail,
    resetEmail,
    loadchangePasswordpage,
    verfyChangePassword,
    verfyingChangePasswordOTP,
    loadAddNewPasswordPage,
    addNewPassword,
    changePasswordResendbuttonOTP
}