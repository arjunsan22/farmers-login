const User = require("../../models/userModel");
const bcrypt=require('bcrypt')
const env=require('dotenv').config()
const mongoose=require('bcrypt')
const Coupon = require('../../models/couponModel');

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

//coupons//
const getCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.find();
        res.render('Coupons', { coupons });
    } catch (error) {
        console.error('Error fetching coupons:', error);
        res.redirect('/admin/error')
    }

};

const getaddCoupon=async (req, res) => {
    try {
       
        res.render('addCoupon');
    } catch (error) {
        console.error('Error fetching coupons:', error);
      res.redirect('/admin/error')
    }

};


const addCoupon = async (req, res) => {
    try {
        const { couponCode, couponType, description, offerPrice, minimumPrice, usageLimit, startOn, expireOn, isActive } = req.body;
        const newCoupon = new Coupon({
            couponCode,
            couponType,
            description,
            offerPrice,
            minimumPrice,
            usageLimit,
            startOn,
            expireOn,
            isActive
        });
        await newCoupon.save();
        res.redirect('/admin/coupons');
    }  catch (error) {
        console.error('Error adding coupon:', error);
        if (error.code === 11000) { // Duplicate key error code
            res.render('addCoupon', { errorMessage: 'Coupon code already exists. Please use a different code.' });
        } else {
            res.status(500).send('Error adding coupon');
        }
    }

};



const couponStatus = async (req, res) => {
    try {
        const couponId = req.params.couponId;
        const coupon = await Coupon.findById(couponId);
        if (!coupon) {
            return res.status(404).send('Coupon not found');
        }
        coupon.isActive = !coupon.isActive;
        await coupon.save();
        res.redirect('/admin/coupons');
    } catch (error) {
        console.error('Error toggling coupon status:', error);
        res.status(500).send('Error toggling coupon status');
    }
};



module.exports={
    loadLogin,
    verifyadmin,
    loadDashboard,
    errorPage,
    Logout,
    blockUser,
    unblockUser,
    getCoupons,
    getaddCoupon,
    addCoupon,
    couponStatus,
  
    
}