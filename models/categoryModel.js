const mongoose=require('mongoose')
const {Schema}=mongoose;

const categorySchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
        unique:true,
        trim:true
    },
   
    isListed:{
        type:Boolean,
        default:0
    },
    categoryOffer:{
        type:Number,
        default:0,
    },
    createdAt:{
        type:Date,
        default:Date.now
    }
    })
    module.exports=mongoose.model('Category',categorySchema)