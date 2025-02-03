const mongoose = require('mongoose'); // Erase if already required
const {Schema}=mongoose;                    

var addressSchema = new mongoose.Schema({
    userId:{
        type:Schema.Types.ObjectId,
        required:true,
        ref:"User"
    },
  
        name:{
            type:String,
            required:true,

        },
        city:{
            type:String,
            required:true
        },
        StreetMark:{
            type:String,
           
        },
        state:{
            type:String,
            required:true
        },
        pincode:{
            type:Number,
            required:true
        },
        Phone:{
            type:String,
            required:true
        },
        SecondPhone:{
            type:String,
            required:true
        },
        Houseno:{
            type:String,
            required:true
        },
        is_blocked:{
            default:false,
            type:Boolean
        },
  

    
    },{timestamps:true})
    module.exports=mongoose.model('Address',addressSchema)