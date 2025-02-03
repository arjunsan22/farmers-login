const mongoose=require('mongoose')
const {Schema}=mongoose;

const categorySchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
        unique:true,
        trim:true
    },

    description:{
    type:String,
    
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
    },{timestamps:true})
    module.exports=mongoose.model('Category',categorySchema)