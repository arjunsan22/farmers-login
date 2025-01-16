const User = require("../../models/userModel");
const bcrypt=require('bcrypt')
const env=require('dotenv').config()
const mongoose=require('bcrypt')

const loadLogin=async (req,res) => {
    try {
        if(req.session.admin){
            return res.redirect('/admin')
        }
        else{
            res.render('adminlogin',{message:null})
        }
    } catch (error) {
        
    }
}

const verifyadmin=async(req,res)=>{
    try {
        const{email,password}=req.body;
        const admin=await User.findOne({email,isAdmin:true});
        console.log('Session ID of admin:', req.sessionID); 
        if(admin){
            const passwordMatch=await bcrypt.compare(password,admin.password)
            if(passwordMatch){
                req.session.admin=true;
                return res.redirect('/admin')
            }else{
                return res.redirect('/admin/login')
            }
        }
else{
    return res.redirect('/admin/login')
}

    } catch (error) {
        console.log("login error",error)
        return res.redirect('/pageerror')
    }
}

const loadDashboard=async (req,res) => {
             
    if(req.session.admin){
            try {
                 res.render('dashboard')
            } catch (error) {
                res.redirect('/pageerror')
            }
        }
}

const errorPage=async (req,res) => {
    try {
        res.render('error')
    } catch (error) {
    console.log(error)
    }
}

const  Logout=async (req,res) => {
    try {
        req.session.destroy((err)=>{
            if(err){
            console.log("error faced in logout-destory session")
        return res.redirect('/error')    
        }

                    res.redirect('/admin/login')
        
        
        })
    } catch (error) {
    console.log("error during logout")
    res.redirect('/error')
    }
}

const blockUser=async(req,res)=>{
    try {
        let id=req.query.id
        await User.updateOne({_id:id},{$set:{isBlocked:true}})
        res.redirect('/admin/users')
    } catch (error) {
        res.redirect('/error')
    }
}

const unblockUser=async (req,res) => {
try {
    let id=req.query.id;
    await User.updateOne({_id:id},{$set:{isBlocked:false}})
    res.redirect('/admin/users')

} catch (error) {
    res.redirect('/error')
}    
}

module.exports={
    loadLogin,
    verifyadmin,
    loadDashboard,
    errorPage,
    Logout,
    blockUser,
    unblockUser,
    
}