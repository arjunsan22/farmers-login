const User=require('../../models/userModel')
const nodemailer=require('nodemailer')
const env=require('dotenv').config()
const bcrypt=require('bcrypt')
const session = require('express-session');
const Product=require('../../models/productModel')
const Category=require('../../models/categoryModel');
const express = require('express');
const Address=require('../../models/addressModel');
const sharp = require('sharp'); // For image processing
const path = require('path');



//profile page//

const loadProfilePage=async (req,res) => {
    try{
        const userId=req.session.user;
        console.log("user session in product page :",userId)
        const userData=await User.findById(userId);
        const addressData=await Address.findOne({userId:userId});
        res.render('userProfile',{user:userData,userAddress:addressData,currentYear: new Date()})
    
    }
    catch(error){
        console.error("error for retrieve profile data",error);
        res.redirect('/pagenotfound');
    }
}


const editProfile=async (req,res) => {
  
  try{
      const userId = req.session.user;
    const user = await User.findById(userId);
    res.render('editProfile', { user });
  } catch (error) {
    console.error('Error loading edit profile page:', error.message);
    res.status(500).send('Server Error');
  }

}

// const updateProfile = async (req, res) => {
//     try {
//         const { firstname, lastname, phone } = req.body;
//         const userId = req.session.user;
//         const userData=await User.findById(userId);
  

//         const updatedUser = await User.findByIdAndUpdate(
//           userData ,
//             { firstname, lastname, phone },
//             { new: true } // This option returns the updated document
//         );

//         if (!updatedUser) {
//             return res.status(404).send('User not found.');
//         }

//         // Redirect to the user profile page after updating
//         res.redirect('/userProfile');
//     } catch (error) {
//         console.error('Error updating profile:', error);
//         res.render('pagenotfound')
//     }
// };


const updateProfile = async (req, res) => {
    try {
        const { firstname, lastname, phone } = req.body;
        const userId = req.session.user;

        // Prepare update data
        let updateData = { firstname, lastname, phone };

        // If a new profile image is uploaded, add its path
if (req.files && req.files['userImage'] && req.files['userImage'][0]) {
    updateData.userImage = req.files['userImage'][0].path; // Cloudinary URL
}

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).send('User not found.');
        }

        res.redirect('/userProfile');
    } catch (error) {
        console.error('Error updating profile:', error);
        res.render('pagenotfound');
    }
};

//farmers creating //

const registerFarmer = async (req, res) => {
    try {
        const userId = req.session.user;
        const { farmName, district, yearsOfExperience, location } = req.body;

        let updateData = {
            farmName,
            district,
            yearsOfExperience,
            location,
            isFarmerApplyed: true, // optional: add a flag
            isVerified: false // admin will verify later
        };

        // Handle certificate upload
       if (req.files && req.files['certificate'] && req.files['certificate'][0]) {
    updateData.certificate = req.files['certificate'][0].path; // Cloudinary URL
}

        await User.findByIdAndUpdate(userId, updateData, { new: true });
        res.redirect('/userProfile');
    } catch (error) {
        console.error('Error registering farmer:', error);
        res.render('pagenotfound');
    }
};

//address management//

const loadUserAddressPage=async (req,res) => {
   
    try {
        const userId = req.session.user;
        const userData =await User.findById(userId)
        const addressData = await Address.find({ userId: userId ,is_blocked:false});
        console.log(addressData)
        res.render('userAddressPage', { user:userData,userAddress: addressData || [] });
    } catch (error) {
        console.error("Error loading user address page:", error);
        res.redirect('/pagenotfound');
    }
}


//addAddress//

const  loadaddUserAddressPage=async (req,res) => {
    try{
        const userId = req.session.user;
        const userData =await User.findById(userId)
        
        res.render('addAddressPage',{
            user:userData
        })
    }catch(error){
        console.error("Error loading add address page:", error);
        res.redirect('/pagenotfound');
    }
}

const addUserAddress=async (req,res) => {

    try {
        const userId = req.session.user;

        const {  name, city, StreetMark, state, pincode, Phone, SecondPhone, Houseno } = req.body;

        // Find if the user already has an address entry
        let userAddress = await Address.findOne({ userId });

    
            // If no address entry exists, create a new one
            userAddress = new Address({
                userId: userId,
                          name,
                         city,
                        StreetMark,
                        state,
                        pincode,
                        Phone,
                        SecondPhone,
                        Houseno,
                    
                
            });
    
    

        await userAddress.save();

              res.redirect('/userAddress');

    } catch (error) {

        console.error('Error adding address:', error);
        res.redirect('/pagenotfound'); 


    }




}

//next edit address//

const loadEditAddress=async (req,res) => {
    try {
        const userId = req.session.user;
        const userData =await User.findById(userId) 
        const {addressId}=req.params// Assuming session contains the user ID
        const userAddress = await Address.findById( addressId );
        // console.log(userAddress)
        res.render('editAddressPage',{userAddress,user:userData})
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
}
//edit or update address//
const updateAddress=async (req,res) => {
    try {
        const userId = req.session.user;
        
        const {addressId} = req.params
        const userAddress = await Address.findById(addressId);
        userAddress.name=req.body.name,
        userAddress.city= req.body.city,
        userAddress.StreetMark= req.body.StreetMark,
        userAddress.state= req.body.state,
        userAddress.pincode= req.body.pincode,
        userAddress.Phone=req.body.Phone,
        userAddress.SecondPhone= req.body.SecondPhone,
        userAddress.Houseno= req.body.Houseno,
          await userAddress.save()
         res.redirect('/userAddress')
    
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
}

const deleteAddress=async (req,res) => {
    try {
        const userId = req.session.user;
        const {addressId} = req.params;
        const userAddress = await Address.findById(addressId);
          userAddress.is_blocked=true
          await userAddress.save()
          res.redirect('/userAddress') 
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }

}


//otp and others//


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

            }else {
                res.render("forgotPassword", { 
                    message: "Error in sending email. Please try again." 
                });
            }
        } else {
            res.render("forgotPassword", { 
                message: "Email not found. Please check your email address." 
            });
        }
    } catch (error) {
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
        }
            else {
                res.json({ success: false, message: "Invalid OTP. Please try again." });
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
            res.status(200).json({success:true,message:"Otp Resent Successfully"})
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
const changeEmail = async (req, res) => {
    try {
        const { email } = req.body;
        const userId = req.session.user;
        
        // First check if the entered email matches the logged-in user's email
        const currentUser = await User.findById(userId);
        if (!currentUser) {
            return res.render('changeEmail', { message: "User not found" });
        }

        if (currentUser.email !== email) {
            return res.render('changeEmail', { message: "Please enter your current email address" });
        }

        // Check if email exists in system
        const userExists = await User.findOne({ email });
        if (userExists) {
            const otp = generateOTP();
            const emailSent = await sendVerificationEmail(email, otp);
            if (emailSent) {
                req.session.userOtp = otp;
                req.session.userData = req.body;
                req.session.email = email;
                res.render('changeEmail-OTP');
                console.log("OTP sent successfully", otp);
                console.log("Email sent to:", email);
            } else {
                res.json({ success: false, message: "Error in sending email" });
            }
        } else {
            res.render('changeEmail', { message: "Email not found" });
        }
    } catch (error) {
        console.log(error);
        res.redirect('/pagenotfound');
    }
}

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
        const userId = req.session.user;
        const userData = await User.findById(userId);
        res.render('changePassword',{user:userData})
    }
    catch(error){
        console.error(error);
        res.redirect('/pagenotfound');
    }
}



// const verfyChangePassword=async (req,res) => {

// try{
//     const { email } = req.body;
//     const userExists = await User.findOne({ email });

//     if (userExists) {
//         const otp = generateOTP();
//         const emailSent = await sendVerificationEmail(email, otp);

//   if (emailSent) {
//      req.session.userOtp = otp;
//         req.session.userData = req.body;
//      req.session.email = email;
//      console.log("OTP sent successfully:", otp);
//      res.render('changePassword-OTP');
    
//     } else {
//     res.json({ success: false, message: "Error in sending email" });       
    
//     }
//     } else {
//         res.render('changePassword', { message: "Email not found. Please check your details." });
//     }             

// }catch(error){

// console.error(error);
// res.redirect('/pagenotfound');
// }


// }

const verfyChangePassword = async (req, res) => {
    try {
        const { email } = req.body;
        const userId = req.session.user;
        const currentUser = await User.findById(userId);
        if (!currentUser) {
            return res.render('changePassword', { message: "User not found" });
        }
        if (currentUser.email !== email) {
            return res.render('changePassword', { message: "Please enter your current email address" });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            const otp = generateOTP();
            const emailSent = await sendVerificationEmail(email, otp);
            if (emailSent) {
                req.session.userOtp = otp;
                req.session.userData = req.body;
                req.session.email = email;
                res.render('changePassword-OTP',{user:currentUser});
                console.log("OTP sent successfully", otp);
                console.log("Email sent to:", email);
            } else {
                res.json({ success: false, message: "Error in sending email" });
            }
        } else {
            res.render('changePassword', { message: "Email not found" });
        }
    } catch (error) {
        console.log(error);
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
        const userId = req.session.user;
        const currentUser = await User.findById(userId);

        res.render('addNewPassword',{user:currentUser})
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
    changePasswordResendbuttonOTP,
    loadUserAddressPage,
    loadaddUserAddressPage,
    addUserAddress,
        registerFarmer,
    loadEditAddress,
    updateAddress,
    deleteAddress,
    editProfile,
    updateProfile,
    // uploadProfilePicture
}