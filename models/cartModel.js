const mongoose=require('mongoose')
const {Schema}=mongoose;

const cartSchema= new mongoose.Schema({
   userId:{
    type:Schema.Types.ObjectId, 
    ref:"User",
    required:true
   },
   items:[{
    productId:{
        type:Schema.Types.ObjectId, 
        ref:"Product",
        required:true
    },
        quantity:{
            type:Number,
            default:1
        },
        price:{
            type:Number,
            required:true,
        },
        totalPrice:{
            type:Number,
            required:true,
        },
        Status:{
            type:String,
            default:'placed'
        },
        cancellation:{
            type:String,
            default:'none',
            // required:true,
        }


   }]

    },{timestamps:true})
module.exports=mongoose.model('Cart', cartSchema)