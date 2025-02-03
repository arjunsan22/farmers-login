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
    userImage:{
        type:String,
    },
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
    referalCode:{
        type:String
    },
    redeemed:{
        type:Boolean,
        default: false,
    },
    redeeemedUsers:[{
        type:Schema.Types.ObjectId,
        ref:"User"
    }],
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