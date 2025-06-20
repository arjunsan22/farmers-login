const User = require("../../models/userModel");
const Product=require('../../models/productModel')
const Category=require('../../models/categoryModel')
const nodemailer=require('nodemailer')
const bcrypt=require('bcrypt')
const env=require('dotenv').config()
const Order=require('../../models/orderModel')
const Blog = require('../../models/blogModel');
const Wallet = require('../../models/walletModel');
const Coupon=require('../../models/couponModel')

const loadhomepage = async (req, res) => {
  try {
    console.log("Session User:", req.session.user); // the session user id//
    const userId = req.session.user;

    // Fetch active coupons
    const currentDate = new Date();
    const activeCoupons = await Coupon.find({
      isActive: true,
      expireOn: { $gt: currentDate },
      startOn: { $lte: currentDate }
    }).sort({ offerPrice: -1 }); // Sort by highest discount first
    
 const categories=await Category.find({isListed:true})

let productData = await Product.find({
    isblocked: false,
    $or: [
        { 'adminApproval.status': 'approved' },  // User products that are approved
        { 'adminApproval': null }     ,           // Admin products
     { userId: null }    
      ],
    category: {
        $in: categories.map(category => category._id)
    }
}).populate('category');
  //console.log(productData);

productData.sort((a,b)=>new Date(b.createdOn)-new Date(a.createdOn));

  // Calculate average ratings for each product
  const productsWithRatings = productData.map(product => {
    const totalRating = product.reviews && product.reviews.length > 0 
        ? product.reviews.reduce((acc, review) => acc + review.rating, 0) 
        : 0; // Default to 0 if no reviews

    const averageRating = product.reviews && product.reviews.length > 0 
        ? (totalRating / product.reviews.length).toFixed(1) 
        : 0; // Default to 0 if no reviews

    return { 
        ...product.toObject(), 
        averageRating: parseFloat(averageRating), // Convert back to number if needed
        reviewCount: product.reviews.length // Include review count
        ,categoryOffer:product.category?.categoryOffer || 0
    };
});    

    if (userId) {
      const userData = await User.findOne({ _id: userId });
      const referralSuccess = req.session.referralSuccess;
       // Use the ID directly
     if (userData) {
        res.locals.user = userData; // Set user data in locals
       
        return res.render('home', { user: userData , products:productsWithRatings, categories: categories,referralSuccess:referralSuccess, coupons: activeCoupons });
      
      
      } else {
        console.log("User data not found that ID:", userId);
        return res.render('home', { user: null ,products:productsWithRatings, categories: categories,coupons: activeCoupons});
      }
    } else {
      return res.render('home', { user: null ,products:productsWithRatings, categories: categories,coupons: activeCoupons});
    }
    
    
  } catch (error) {
    console.log("Error loading homepage:", error);
    res.status(500).send("Internal Server Error");
  }
}

//error page //
const pagenotfound = async (req, res) => {
  try {
    res.render("pagenotfound");
  } catch (error) {
    res.redirect("/pagenotfound");
  }
};

//for signup//
const loadSignup = async (req, res) => {
  try {
    res.render("signup");
  } catch (error) {
    res.status(500).send("server error");
  }
};


function generateOtp(){
   return Math.floor(10000 + Math.random()*900000).toString();
}

async function sendVerificationEmail(email,otp) {
  try {
    //to send otp to user//
    const transporter= nodemailer.createTransport({
      service:'gmail',
      port:587,
      secure:false,
      requireTLS:true,
      auth:{
        user:process.env.NODEMAILER_EMAIL,
        pass:process.env.NODEMAILER_PASSWORD
      }

    })
    const info=await transporter.sendMail({
      from:process.env.NODEMAILER_EMAIL,
      to:email,
      subject:"Verify your accound",
      text:` Your OTP is ${otp} `,
      html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
        <h2 style="color:rgb(244, 156, 61);">Hello Are You Try To Sign Up </h2>
        <p>Thank you for registering with us!</p>
        <p><strong>Your One-Time Password (OTP):</strong></p>
        <p style="font-size: 24px; font-weight: bold; color: #ff0000;">${otp}</p>
        <p>Please use this OTP within the next <strong>10 minutes</strong> to complete your account setup.</p>
        <p>If you did not request this email, please ignore it.</p>
        <br>
        <p style="font-size: 14px; color: #555;">Best Regards,</p>
        <p style="font-size: 14px; color: #555;"><strong>Your farmers login </strong></p>
      </div>
      `,
    })
    return info.accepted.length > 0
    
  } catch (error) {
    console.error('Error sending email',error)
    return false;
  }
  

}



const Signup = async (req, res) => {
   
    try {
      
        const { firstname , lastname, email,phone , password,confirmpassword,referralCode } = req.body;
        
      if(password!==confirmpassword){
       return res.render("signup",{message:"PASSWORD IS NOT MATCHING"})
     
      }

      const existingEmail = await User.findOne({ email: email });
    if (existingEmail) {
        return res.render("signup", { message: "Email already exists" });
    }

    const existingPhone = await User.findOne({ phone: phone });
    if (existingPhone) {
        return res.render("signup", { message: "Phone number already exists" });
    }

      
      const otp=generateOtp();
    const emailSent=await sendVerificationEmail(email,otp); 

    
    if(!emailSent){
     return res.json("email-error")
    }

req.session.userOtp=otp;
req.session.userData={email,password,firstname,lastname,phone,referralCode};
res.render('verifyotp')

console.log("OTP Sent : ",otp);


    } catch (error) {
      console.error("error found");
      res.redirect('/pagenotfound')
    }
  };

const securePassword=async (password) => {
  try {
    const passwordHash=await bcrypt.hash(password,10)
    return passwordHash;

  } catch (error) {
    console.error("Error in hashing password:", error);
    throw new Error("Password hashing failed");
  }
}

const verifyOTP=async(req,res)=>{
  try {

    const {otp}=req.body;
    console.log(otp)

    if(otp===req.session.userOtp){
      const user=req.session.userData;
      const passwordHash=await securePassword(user.password)

      const saveUserData=new User({
        firstname:user.firstname,
        lastname:user.lastname,
        email:user.email,
        phone:user.phone,
        password:passwordHash,
        referralCode:await generateReferralCode()
      })
      await saveUserData.save();

 // Handle referral code if provided//
 if (user.referralCode) {
  const referralSuccess = await handleReferral(saveUserData, user.referralCode);
  if (referralSuccess) {
      req.session.referralSuccess = true;
  }
}

      req.session.user=saveUserData._id;
      res.json({success:true,
        redirectUrl:'/',
        referralSuccess: req.session.referralSuccess || false })
    }
    else{
      res.status(400).json({success:false,message:"Invalid OTP,Please try again"})
    }

  } catch (error) {
    
    console.error('error in verifying otp',error)
  res.status(500).json({success:false,message:"An error occured"})
  }
}


const generateReferralCode = async () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let referralCode;
  let isUnique = false;

  while (!isUnique) {
      referralCode = '';
      for (let i = 0; i < 8; i++) {
          referralCode += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      
      const existingUser = await User.findOne({ referralCode });
      if (!existingUser) {
          isUnique = true;
      }
  }
  return referralCode;
};

const handleReferral = async (newUser, referralCode) => {
  try {
      if (!referralCode) {
          console.log("No referral code provided");
          return false;
      }

      // Convert to uppercase and trim to ensure consistent matching
      const normalizedCode = referralCode.trim().toUpperCase();
      
      const referrer = await User.findOne({ referralCode: normalizedCode });
      console.log("Searching for referral code:", normalizedCode);
      console.log("Referrer found:", referrer);

      if (!referrer) {
          console.log("No user found with this referral code");
          return false;
      }

      // Prevent self-referral
      if (referrer._id.toString() === newUser._id.toString()) {
          console.log("Self-referral attempted");
          return false;
      }

      if (referrer.redeemedUsers.includes(newUser._id)) {
          console.log("User already redeemed this referral");
          return false;
      }

      // Create or find referrer's wallet
      let referrerWallet = await Wallet.findOne({ userId: referrer._id });
      if (!referrerWallet) {
          console.log("Creating new wallet for referrer");
          referrerWallet = new Wallet({ userId: referrer._id });
      }

      // Add transaction for referrer
      referrerWallet.transactions.push({
          amount: 200,
          type: 'credit',
          description: `Referral bonus for inviting ${newUser.firstname} ${newUser.lastname}`
      });
      referrerWallet.balance += 200;
      
      const savedReferrerWallet = await referrerWallet.save();
      console.log("Referrer wallet updated:", savedReferrerWallet);

      // Update referrer document
      referrer.wallet = (referrer.wallet || 0) + 200;
      referrer.redeemedUsers.push(newUser._id);
      await referrer.save();
      console.log("Referrer document updated");

      // Create or find new user's wallet
      let newUserWallet = await Wallet.findOne({ userId: newUser._id });
      if (!newUserWallet) {
          console.log("Creating new wallet for new user");
          newUserWallet = new Wallet({ userId: newUser._id });
      }

      // Add transaction for new user
      newUserWallet.transactions.push({
          amount: 200,
          type: 'credit',
          description: 'Welcome bonus for using referral code'
      });
      newUserWallet.balance += 200;
      
      const savedNewUserWallet = await newUserWallet.save();
      console.log("New user wallet updated:", savedNewUserWallet);

      // Update new user document
      newUser.wallet = (newUser.wallet || 0) + 200;
      newUser.referredBy = referrer._id;
      await newUser.save();
      console.log("New user document updated");

      return true;

  } catch (error) {
      console.error("Error in handleReferral:", error);
      return false;
  }
};

const resendOTP = async (req, res) => {
  try {
    const { email } = req.session.userData;
    if (!email) {
      console.log("Email not found in session");
      return res.status(400).json({ success: false, message: "Email not found in session" });
    }

    const otp = generateOtp();
    req.session.userOtp = otp;

    const emailSent = await sendVerificationEmail(email, otp);

    if (emailSent) {
      console.log("Resent OTP: ", otp);  // Log OTP for debugging purposes
      res.status(200).json({ success: true, message: "OTP Resent Successfully" });
    } else {
      console.error("Failed to send OTP");
      res.status(500).json({ success: false, message: "OTP Resend failed, Try again" });
    }

  } catch (error) {
    console.error("Error resending OTP:", error);
    res.status(500).json({ success: false, message: "Internal Server Error, Try Again" });
  }
};



const loadloginpage=async (req,res) => {
 
    try {
      
      if(!req.session.user){
        return res.render('login',{ error: req.query.error || null})
      }
      else{
        res.redirect('/')
      }

    } catch (error) {
      res.redirect('/pagenotfound')
    }
}

const verifyLogin=async (req,res) => {

  try {
    const {email,password}=req.body;
    const findUser=await User.findOne({isAdmin:0,email:email});
    
    if (!email || !password) {
      return res.render('login', { message: "EMAIL AND PASSWORD ARE REQUIRED", error: null });
    }
    
    if(!findUser){
      return res.render('login',{message:"USER NOT FOUND", error: null})

    }
    if(findUser.isBlocked){
      return res.render('login',{message:"USER IS BLOCKED BY ADMIN", error: 'blocked'})
    }

const passwordMatch=await bcrypt.compare(password,findUser.password)

if(!passwordMatch){
  return res.render('login',{message:"INVALID CREDENTIALS", error: null })
}

req.session.user=findUser._id
console.log("matched",req.session.user)
res.redirect('/')

  } catch (error) {
    console.error('LOGIN ERROR',error)
    res.render('login',{message:"LOGIN FAILED ,PLEASE TRY AGAIN", error: null})
  }
}

//logout//
const LoGout = async (req, res) => {
  try {
    req.session.user=null
    return  res.redirect('/login'); 
    
  } catch (error) {
    console.error('Error in LoGout:', error.message);
    res.status(500).send('Internal Server Error'); 
  }
};



const loadProductDetails = async (req, res) => {
  try {
    const productId = req.params.id;

    // Check if user is logged in
    const userId = req.session.user;
    let userData = null;
    let hasPurchased = false;


    if (userId) {
      userData = await User.findOne({ _id: userId });
      res.locals.user = userData; 
      
     // Check if the user has purchased the product
     const userOrders = await Order.find({ userId: userId, 'orderedItems.product': productId });
     hasPurchased = userOrders.length > 0;
   }
  
     const product = await Product.findOne({
            _id: productId,
            isblocked: false,
            $or: [
                { 'adminApproval.status': 'approved' },  // User products that are approved
                { 'adminApproval': null },               // Admin products
                { userId: null }                         // Admin products (if they don't have userId)
            ]
        })
        .populate('category', 'categoryOffer name')
        .populate('reviews.userId', 'firstname lastname userImage')
        .populate('userId', 'farmName location district yearsOfExperience isVerified'); 


        if (!product) {
            return res.status(404).render('error', { 
                message: 'Product not found or not approved' 
            });
        }

   const relatedProducts = await Product.find({
            productname: { $regex: product.productname.split(' ')[0], $options: 'i' },
            _id: { $ne: productId },
            isblocked: false,
            $or: [
                { 'adminApproval.status': 'approved' },
                { 'adminApproval': null },
                { userId: null }
            ]
        })
        .populate('category', 'categoryOffer name')
        .populate('reviews.userId', 'firstname lastname userImage');

const categoryOffer=product?.category?.categoryOffer || 0;
    if (product && !product.isblocked) {
      res.render('productDetails', { product, relatedProducts, user: userData,categoryOffer,hasPurchased });
    } else {
      res.status(404).send('Product not found');
    }
  } catch (error) {
    console.error('Error loading product details:', error);
    res.status(500).send('Server error');
  }
};


//        //   shop page and filters        
   //      //
   const loadShopPage = async (req, res) => {
    try {
      const userId = req.session.user;
      const userData = await User.findById(userId);
      
      const category = req.query.category || '';
      const sortBy = req.query.sortBy || '';
      const searchTerm = req.query.search || ''; 
     
      let filter = {
            isblocked: false,
            $or: [
                { 'adminApproval.status': 'approved' },  // For user products
                { 'adminApproval': null },               // For admin products
                { userId: null }                         // For admin products (if they don't have userId)
            ]
        };
  
      // Apply category filter if selected
    if (category) {
        const categoryData = await Category.findOne({ 
          name: category,
          isListed: true // Only get listed categories
        });
        if (categoryData) {
          filter.category = categoryData._id;
        }
      }
  
      if (searchTerm) {
        filter.productname = { $regex: searchTerm, $options: 'i' }; 
      }
  
      const page = parseInt(req.query.page) || 1;
      const limit = 9;
      const skip = (page - 1) * limit;
  
      // Get all products with their orders count
      const productsWithOrders = await Order.aggregate([
        { $unwind: "$orderedItems" },
        {
          $group: {
            _id: "$orderedItems.product",
            orderCount: { $sum: 1 }
          }
        }
      ]);
  
      // Create a map of product IDs to order counts
      const orderCountMap = new Map(
        productsWithOrders.map(item => [item._id.toString(), item.orderCount])
      );
  
      // Get products with populate and ensure category is listed
      let productData = await Product.find(filter)
        .populate({
          path: 'category',
          match: { isListed: true }, // Only populate listed categories
          select: 'categoryOffer name isListed'
        })
        .populate('reviews')
        .skip(skip)
        .limit(limit);


      // Filter out products with unlisted categories
      productData = productData.filter(product => product.category !== null);


      // Calculate average ratings and add order counts
      const productsWithRatings = productData.map(product => {
        const totalRating = product.reviews.reduce((acc, review) => acc + review.rating, 0);
        const averageRating = product.reviews.length > 0 
          ? (totalRating / product.reviews.length).toFixed(1) 
          : 0;
        
        return {
          ...product.toObject(),
          averageRating: parseFloat(averageRating),
          reviewCount: product.reviews.length,
          orderCount: orderCountMap.get(product._id.toString()) || 0
          ,categoryOffer:product.category?.categoryOffer || 0
        };
      });
  
      // Apply sorting
      let sortedProducts = [...productsWithRatings];
      switch (sortBy) {
        case 'popularity':
          sortedProducts.sort((a, b) => b.orderCount - a.orderCount);
          break;
        case 'topRated':
          sortedProducts.sort((a, b) => b.averageRating - a.averageRating);
          break;
        case 'priceLowToHigh':
          sortedProducts.sort((a, b) => a.salePrice - b.salePrice);
          break;
        case 'priceHighToLow':
          sortedProducts.sort((a, b) => b.salePrice - a.salePrice);
          break;
        case 'newArrivals':
          sortedProducts.sort((a, b) => new Date(b.createdOn) - new Date(a.createdOn));
          break;
        case 'aToZ':
          sortedProducts.sort((a, b) => a.productname.localeCompare(b.productname));
          break;
        case 'zToA':
          sortedProducts.sort((a, b) => b.productname.localeCompare(a.productname));
          break;
        default: // Featured - combination of price and recency
          sortedProducts.sort((a, b) => {
            const recencyScore = (new Date(b.createdOn) - new Date(a.createdOn)) / (1000 * 60 * 60 * 24); // Days
            const priceScore = (b.salePrice - a.salePrice) * 0.1; // Weight price less
            return recencyScore + priceScore;
          });
      }
      const totalProducts = await Product.countDocuments({
        ...filter,
        category: { $in: await Category.find({ isListed: true }).distinct('_id') }
      });
       const totalPages = Math.ceil(totalProducts / limit);
      const categories = await Category.find({ isListed: true });
  
      res.render('ShopPage', {
        user: userData,
        products: sortedProducts,
        category: categories,
        currentPage: page,
        totalPages: totalPages,
        selectedCategory: category,
        selectedSort: sortBy,
        searchTerm: searchTerm
      });
  
    } catch (error) {
      console.error('Error loading shop page:', error);
      if (error.name === 'CastError' || error.name === 'ValidationError') {
        res.status(400).render('pagenotfound', { message: 'Invalid request params' });
      } else {
        res.status(500).render('pagenotfound', { message: 'Internal Server Error' });
      }
    }
  };
//main search/////////////////////////////////////////////

const mainSearch = async (req, res) => {
  try {
    const userId = req.session.user;
    const userData = await User.findById(userId);

    const searchTerm = req.query.search || '';
    const selectedCategory = req.query.category || '';
    const sortBy = req.query.sortBy || '';

    let filter = {
      isblocked: false,
      'adminApproval.status': 'approved',
      quantity: { $gt: 0 }
    };

    // Apply search term filter if provided
    if (searchTerm) {
      const categoryData = await Category.findOne({ name: { $regex: searchTerm, $options: 'i' } });
      if (categoryData) {
        filter.category = categoryData._id;
      } else {
        filter.productname = { $regex: searchTerm, $options: 'i' };
      }
    }

    const page = parseInt(req.query.page) || 1;
    const limit = 9;
    const skip = (page - 1) * limit;

    // Get all products with their orders count
    const productsWithOrders = await Order.aggregate([
      { $unwind: "$orderedItems" },
      {
        $group: {
          _id: "$orderedItems.product",
          orderCount: { $sum: 1 }
        }
      }
    ]);

    // Create a map of product IDs to order counts
    const orderCountMap = new Map(
      productsWithOrders.map(item => [item._id.toString(), item.orderCount])
    );

    // Get products with populate for reviews
    const productData = await Product.find(filter)
      .populate('reviews')
      .skip(skip)
      .limit(limit);

    // Calculate average ratings and add order counts
    const productsWithRatings = productData.map(product => {
      const totalRating = product.reviews.reduce((acc, review) => acc + review.rating, 0);
      const averageRating = product.reviews.length > 0 
        ? (totalRating / product.reviews.length).toFixed(1) 
        : 0;
      
      return {
        ...product.toObject(),
        averageRating: parseFloat(averageRating),
        reviewCount: product.reviews.length,
        orderCount: orderCountMap.get(product._id.toString()) || 0
      };
    });

    // Apply sorting
    let sortedProducts = [...productsWithRatings];
    switch (sortBy) {
      case 'popularity':
        sortedProducts.sort((a, b) => b.orderCount - a.orderCount);
        break;
      case 'topRated':
        sortedProducts.sort((a, b) => b.averageRating - a.averageRating);
        break;
      case 'priceLowToHigh':
        sortedProducts.sort((a, b) => a.salePrice - b.salePrice);
        break;
      case 'priceHighToLow':
        sortedProducts.sort((a, b) => b.salePrice - a.salePrice);
        break;
      case 'newArrivals':
        sortedProducts.sort((a, b) => new Date(b.createdOn) - new Date(a.createdOn));
        break;
      case 'aToZ':
        sortedProducts.sort((a, b) => a.productname.localeCompare(b.productname));
        break;
      case 'zToA':
        sortedProducts.sort((a, b) => b.productname.localeCompare(a.productname));
        break;
      default: // Featured - combination of price and recency
        sortedProducts.sort((a, b) => {
          const recencyScore = (new Date(b.createdOn) - new Date(a.createdOn)) / (1000 * 60 * 60 * 24); // Days
          const priceScore = (b.salePrice - a.salePrice) * 0.1; // Weight price less
          return recencyScore + priceScore;
        });
    }

    const totalProducts = await Product.countDocuments(filter);
    const totalPages = Math.ceil(totalProducts / limit);
    const categories = await Category.find({ isListed: true });

    res.render('ShopPage', {
      user: userData,
      products: sortedProducts,
      category: categories,
      currentPage: page,
      totalPages: totalPages,
      searchTerm: searchTerm,
      selectedCategory: selectedCategory,
      selectedSort: sortBy
    });

  } catch (error) {
    console.error('Error loading shop page:', error);
    if (error.name === 'CastError' || error.name === 'ValidationError') {
      res.status(400).render('pagenotfound', { message: 'Invalid request params' });
    } else {
      res.status(500).render('pagenotfound', { message: 'Internal Server Error' });
    }
  }
};

const loadBlogPage=async (req, res) => {  
  try {
      const blogs = await Blog.find().sort({ createdAt: -1 });
      res.render('userBlogs', { blogs });
  } catch (error) {
      console.error(error);
      res.status(500).send('Server Error');
  }
}

const loadBlogDetailsPage=async (req, res) => {
  try {
      const blog = await Blog.findById(req.params.id);
      if (!blog) {
          return res.status(404).send('Blog not found');
      }
      res.render('userBlogDetail', { blog });
  } catch (error) {
      console.error(error);
      res.status(500).send('Server Error');
  }

}


const contacts=async (req, res) => {
  try {
    res.render('contact');
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
}

module.exports = {
  loadhomepage,
  pagenotfound,
  loadSignup,
  Signup,
  verifyOTP,
  resendOTP,
  loadloginpage,
  verifyLogin,
  LoGout,
  loadProductDetails,
  loadShopPage,
  mainSearch,
  loadBlogPage,
  loadBlogDetailsPage,
  contacts
};
