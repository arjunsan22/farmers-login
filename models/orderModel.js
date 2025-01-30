const mongoose=require('mongoose')


const {v4:uuidv4}=require('uuid')
const orderSchema= new mongoose.Schema({
  orderId:{
    type:String, 
    default:()=>uuidv4(),
    unique:true
   },
   userId:{
    type: mongoose.Schema.Types.ObjectId,
    ref:"User",
    required:true
   },
   orderedItems:[{
    product:{
        type: mongoose.Schema.Types.ObjectId, 
        ref:"Product",
        required:true
    },
    quantity:{
        type:Number,
        required:true
    },
    price:{
        type:Number,
        default:0
    },

    returnReason:{
        type:String
    }

   }],
   totalPrice:{
    type:Number,
    default:0
   },
   discount:{
    type:Number,
    default:0
   },
   finalAmount:{
    type:Number,

   },
   address:{
    type: mongoose.Schema.Types.ObjectId,
    ref:"Address",
    required:true
   },
   invoiceDate:{
    type:Date
   },
   Status:{
   type:String,
   default:"pending",
   enum:["pending","delivered","processing","shipping","cancelled","return request","returned"]
    },
    createdOn:{
        type:Date,
        default:Date.now,
        required:true
    },
    couponApplied:{
        type:Boolean,
        default:false
    },
    paymentMethod:{
        type:String,
        required:true
    }

    })




module.exports=mongoose.model('Order', orderSchema)
