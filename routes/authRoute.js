const express=require('express');
const userController = require('../controller/user/userCtrl');
const passport = require('passport');
const router=express.Router()
const usermiddle=require('../middlewares/usermiddleware')
const Product = require('../models/productModel');
const User=require('../models/userModel')



router.get('/pagenotfound',userController.pagenotfound)

router.get('/',userController.loadhomepage);


router.get('/signup',usermiddle.isLogin,userController.loadSignup)

router.post('/signup',userController.Signup)

router.post('/verifyotp',userController.verifyOTP)

router.post('/resendotp',userController.resendOTP)

router.get('/auth/google',passport.authenticate('google',{scope:['profile','email'],
    accessType: 'offline',
    prompt: 'consent',
}))



router.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login?error=blocked' }), async (req, res) => {
    console.log("hit callball")
    
    try {
        
        const products = await Product.find({}).populate('category'); 

        console.log("Session ID of google account:", req.sessionID);
        console.log("Details of user :", req.user);

        res.render('home', { user: req.user, products: products });
             }
              catch (err) {
             console.error(err);
        return res.redirect('/error'); 
    }
});





router.get('/login',userController.loadloginpage)
router.post('/login',userController.verifyLogin)

router.get('/productDetails/:id', userController.loadProductDetails); //in here i change /:id


//logout
router.get('/logout',userController.LoGout)


module.exports=router;