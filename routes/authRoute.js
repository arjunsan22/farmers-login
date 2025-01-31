const express=require('express');
const userController = require('../controller/user/userCtrl');
const passport = require('passport');
const router=express.Router()
const usermiddle=require('../middlewares/usermiddleware')
const Product = require('../models/productModel');
const User=require('../models/userModel')
const profileController=require('../controller/user/profileController')
const cartController=require('../controller/user/cartController')
const checkoutController=require('../controller/user/checkoutController')
const couponController = require('../controller/user/couponController');
const orderController=require('../controller/user/orderController')
const wishlistController=require('../controller/user/wishlistController')
const walletController = require('../controller/user/walletController');
const reviewController = require('../controller/user/reviewController');

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



router.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login?error=blocked', failureMessage: true }), async (req, res) => {
    console.log("hit callball")
    
    try {
        
        const products = await Product.find({}).populate('category'); 

        console.log("Session ID of google account:", req.sessionID);
        console.log("Details of user :", req.user);

        req.session.user = req.user._id;
        res.redirect('/');             
    }catch (err) {
    console.error(err);
    return res.redirect('/error'); 
    }
});





router.get('/login',userController.loadloginpage)
router.post('/login',userController.verifyLogin)

router.get('/productDetails/:id', userController.loadProductDetails); //in here i change /:id



//user profile forgot password and otp verification done !//

router.get('/forgot-password',profileController.loadforgotpassword)
router.post('/forgotEmailCheck',profileController.forgotEmailCheck)
router.post('/password-forgot-verifyotp',profileController.forgotPasswordVerifyOTP)
router.get('/reset-password',profileController.loadResetPassword)
router.post('/password-forgot-resendotp',profileController.forgotPasswordResendOTP)
//resetpassword done!
router.post('/resetPassword',profileController.resetPassword)

//user profile//

router.get('/userProfile',usermiddle.isLogout,profileController.loadProfilePage)

router.get('/profile/edit',usermiddle.isLogout,profileController.editProfile);

router.post('/profile/update',profileController.updateProfile);

// router.post('/profile/uploadPicture',upload.single('profilePicture'),profileController.uploadProfilePicture)


router.get('/useraddress',usermiddle.isLogout,profileController.loadUserAddressPage)
router.get('/addUserAddress',usermiddle.isLogout,profileController.loadaddUserAddressPage)
router.post('/addNewAddress',profileController.addUserAddress)

router.get('/useraddress-Edit/:addressId',usermiddle.isLogout,profileController.loadEditAddress);

router.post('/updateAddress-Edit/:addressId',profileController.updateAddress)
//delete address//
router.get('/useraddress-Delete/:addressId', profileController.deleteAddress);
// useraddress-Delete


//shop page//

router.get('/shop',userController.loadShopPage)
//mainSeach//

router.get('/mainSearchshop',userController.mainSearch)

//cart pages and add to cart
// Cart Routes
router.post('/add-to-cart',cartController.addToCart);

router.get('/cart', cartController.getCart);

router.post('/updateQuantity', cartController.updateQuantity);
router.post('/removeFromCart', cartController.removeFromCart);
// router.post('/cancel-cart-item', auth.isLogin, cartController.cancelItem);

//checkout//
router.get('/checkout',usermiddle.isLogout,checkoutController.loadCheckoutPage)
router.get('/loadCheckoutUserAddressPage',usermiddle.isLogout,checkoutController.loadCheckoutUserAddress)        
router.post('/addNewCheckoutAddress',checkoutController.addNewCheckoutAddress)
router.get('/EditCheckoutAddress/:addressId',usermiddle.isLogout,checkoutController.loadEditCheckoutAddressPage)
router.post('/updateCheckoutAddress/:addressId',checkoutController.updateCheckoutAddress)


//place order//
router.post('/process-order', checkoutController.Orderplacement)
router.get('/order-success/:orderId',checkoutController.orderSuccess)

//razorpay//

// Razorpay routes
router.post('/create-razorpay-order', checkoutController.createRazorpayOrder);
router.post('/verify-razorpay-payment', checkoutController.verifyRazorpayPayment);



//order-management://
router.get('/order-history',orderController.getOrderHistory);


router.post('/orders/cancel/:orderId', orderController.cancelOrder);
router.post('/orders/return/:orderId', orderController.returnOrder); 

//change email//
router.get('/changeEmail',usermiddle.isLogout,profileController.loadchangeEmail)
router.post('/changeEmail',profileController.changeEmail)//worked
router.post('/verifyEmailOTP',profileController.verifyEmailOTP)
router.post('/verifyEmailResend-OTP',profileController.verifyEmailResendOTP)
router.get('/reset-email',usermiddle.isLogout,profileController.loadResetEmail)
router.post('/resetEmail',profileController.resetEmail)


//password change//

router.get('/changePassword',profileController.loadchangePasswordpage)
router.post('/verify-email-password', profileController.verfyChangePassword);
router.post('/changePassword-OTP',profileController.verfyingChangePasswordOTP)
router.get('/addnew-password',profileController.loadAddNewPasswordPage)
router.post('/addNewPassword',profileController.addNewPassword)
//resend//
router.post('/changePasswordResendbutton-OTP',profileController.changePasswordResendbuttonOTP)

//wishlist management//
router.post('/wishlist/add', wishlistController.addToWishlist);
router.post('/wishlist/remove', wishlistController.removeFromWishlist);

//get page//

router.get('/wishlist', wishlistController.getWishlist);




///coupon management user//
router.post('/applyCoupon', couponController.applyCoupon);

router.post('/removeCoupon', couponController.removeCoupon);


//wallet management//

router.get('/wallet', walletController.getWallet);
router.post('/wallet/add', walletController.addFunds);


//review management//
router.post('/products/:id/review', reviewController.addReview);
router.post('/reviews/remove/:id', reviewController.removeReview);

//logout
router.get('/logout',userController.LoGout)




module.exports=router;


