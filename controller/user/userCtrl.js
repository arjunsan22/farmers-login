const User = require("../../models/userModel");
const Product=require('../../models/productModel')
const Category=require('../../models/categoryModel')
const nodemailer=require('nodemailer')
const bcrypt=require('bcrypt')
const env=require('dotenv').config()


const loadhomepage = async (req, res) => {
  try {
    console.log("Session User:", req.session.user); // the session user id//
    const userId = req.session.user;

    
 const categories=await Category.find({isListed:true})

let productData=await Product.find(
  {isblocked:false,
    
    category:{$in:categories.map(category=>category._id)}
    ,quantity:{$gt:0}
  
  })
  //console.log(productData);

productData.sort((a,b)=>new Date(b.createdOn)-new Date(a.createdOn));

    if (userId) {
      const userData = await User.findOne({ _id: userId }); // Use the ID directly
     if (userData) {
        res.locals.user = userData; // Set user data in locals
       
        return res.render('home', { user: userData , products:productData, categories: categories, });
      
      
      } else {
        console.log("User data not found that ID:", userId);
        return res.render('home', { user: null ,products:productData, categories: categories});
      }
    } else {
      return res.render('home', { user: null ,products:productData, categories: categories});
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
      
        const { firstname , lastname, email,phone , password,confirmpassword } = req.body;
        
      if(password!==confirmpassword){
       return res.render("signup",{message:"PASSWORD IS NOT MATCHING"})
     
      }

      
      const otp=generateOtp();
 
    const emailSent=await sendVerificationEmail(email,otp); 

    if(!emailSent){
     return res.json("email-error")
    }

req.session.userOtp=otp;
req.session.userData={email,password,firstname,lastname,phone};
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
      })
      await saveUserData.save();
      req.session.user=saveUserData._id;
      res.json({success:true,redirectUrl:'/'})
    }
    else{
      res.status(400).json({success:false,message:"Invalid OTP,Please try again"})
    }

  } catch (error) {
    
    console.error('error in verifying otp',error)
  res.status(500).json({success:false,message:"An error occured"})
  }
}




// const resendOTP=async (req,res) => {

//   try {
//     const {email}=req.session.userData;
//     if(!email){
//       return res.status(400).json({ success:false,message:"Email not found in session" })


//     }
//     const otp=generateOtp();
//     req.session.userOtp=otp;

//     const emailSent=await sendVerificationEmail(email,otp)
    
//     if(emailSent){
//       console.log("Resent OTP: ",otp)
//       res.status(200).json({success:true,message:"OTP Resend Successfylly"})

//     }
//     else{
//           res.status(500).json({success:false,message:"OTP Resend failed, Try again"})

//     }

//   } catch (error) {
    
//     console.log("Error resending Otp",error)
//     res.status(500).json({success:false,message:"Internal Server Error,Try Again"})

//   }
// }


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
    req.session.destroy((error) => {
      if (error) {
        console.error('Error destroying session:', error);
        return res.redirect('/pagenotfound'); 
      }
    return  res.redirect('/login'); 
    });
  } catch (error) {
    console.error('Error in LoGout:', error.message);
    res.status(500).send('Internal Server Error'); 
  }
};



const loadProductDetails = async (req, res) => {
  try {
    console.log("detail page:", req.session.user);
    const productId = req.params.id;

    // Check if user is logged in
    const userId = req.session.user;
    let userData = null;

    if (userId) {
      userData = await User.findOne({ _id: userId });
      res.locals.user = userData; // Set user data in locals
    }

    const product = await Product.findById(productId).populate('category');
    const relatedProducts = await Product.find({
      productname: { $regex: product.productname.split(' ')[0], $options: 'i' },
      _id: { $ne: productId },
    });

    if (product && !product.isblocked) {
      res.render('productDetails', { product, relatedProducts, user: userData });
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
    
    // Get filter parameters
    const category = req.query.category || '';
    const sortBy = req.query.sortBy || '';
    
    // Base filter conditions
    let filter = {
      isblocked: false,
      quantity: { $gt: 0 }
    };

    // Apply category filter if selected
    if (category) {
      const categoryData = await Category.findOne({ name: category });
      if (categoryData) {
        filter.category = categoryData._id;
      }
    }

    // Define sort options
    let sortOption = {};
    switch (sortBy) {
      case 'priceLowToHigh':
        sortOption.salePrice = 1;
        break;
      case 'priceHighToLow':
        sortOption.salePrice = -1;
        break;
      case 'newArrivals':
        sortOption.createdOn = -1;
        break;
      case 'aToZ':
        sortOption.productname = 1;
        break;
      case 'zToA':
        sortOption.productname = -1;
        break;
      default:
        sortOption.createdOn = -1; // Default sort by newest
    }

    // Pagination setup
    const page = parseInt(req.query.page) || 1;
    const limit = 9;
    const skip = (page - 1) * limit;

    // Get total products count
    const totalProducts = await Product.countDocuments(filter);

    // Fetch filtered and sorted products
    const productData = await Product.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

    // Get all categories for filter options
    const categories = await Category.find({ isListed: true });
    const categoriesWithIds = categories.map(cat => ({
      _id: cat._id,
      name: cat.name
    }));

    const totalPages = Math.ceil(totalProducts / limit);

    res.render('ShopPage', {
      user: userData,
      products: productData,
      category: categoriesWithIds,
      currentPage: page,
      totalPages: totalPages,
      selectedCategory: category,
      selectedSort: sortBy
    });

  } catch (error) {
    console.error('Error loading shop page:', error);
    if (error.name === 'CastError' || error.name === 'ValidationError') {
      res.status(400).render('pagenotfound', { message: 'Invalid request parameters' });
    } else {
      res.status(500).render('pagenotfound', { message: 'Internal server error' });
    }
  }
};

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
  
};
