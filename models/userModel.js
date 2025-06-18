const mongoose = require('mongoose'); // Erase if already required
const {Schema}=mongoose;
// Declare the Schema of the Mongo model
var userSchema = new mongoose.Schema({
    firstname:{
        type:String,
        required:true,
        
       
    },
    lastname:{
        type:String,
        required:true,
     
    },
    email:{
        type:String,
        required:true,
        // unique:true,
    },
    phone:{
        type:Number,
        required:false,
        unique:true,
        sparse:true, //because phone no is set as null
        default:null,

    },
    password:{
        type:String,
        required:false,
    },
    // userModel.js
    userImage: { 
        type: String,
        default: "" },

    googleId:{
        type:String,
        unique:false,
    },
    isBlocked:{
        type:Boolean,
        default:false

    },
    isAdmin:{
        type:Boolean,
        default:false
    },
    farmName: { 
        type: String 
    },
        location: {
             type: String
   },
    district: {
        type: String 
    },

    yearsOfExperience: { 
        type: Number
    },
    certificate: { 
        type: String 
    }, // file path for uploaded certificate
isFarmerApplyed: { type: Boolean, default: false },

    isVerified: { 
        type: Boolean, 
        default: false
    },

    cart:[{
        type:Schema.Types.ObjectId,
        ref:"Cart",
    }],
    wallet:{
        type:Number,
        default:0,

    },
    wishlist:[{
        type:Schema.Types.ObjectId,
        ref:"Wishlist"
    }],
    orderHistory:[{
        type:Schema.Types.ObjectId,
        ref:"Order"
    }],
    createdOn:{
        type:Date,
        default:Date.now,
    },
    referralCode:{
        type:String,
        unique: true,
        sparse: true
    },
    redeemed:{
        type:Boolean,
        default: false,
    },
    redeemedUsers:[{
        type:Schema.Types.ObjectId,
        ref:"User"
    }],
    referredBy:{
        type:Schema.Types.ObjectId,
        ref:"User",
        default: null
    },
    searchHistory:[{
        category:{
            type:Schema.Types.ObjectId,
            ref:"Category",
        },
       
        searchOn:{
            type:Date,
            defaut:Date.now
        }
         
    }]

},{timestamps:true});

//Export the model
module.exports = mongoose.model('User', userSchema);