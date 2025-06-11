const mongoose = require('mongoose'); // Erase if already required
const {Schema}=mongoose;
// Declare the Schema of the Mongo model
var productSchema = new mongoose.Schema({
    productname:{
        type:String,
        required:true,
      
    },

    description:{
        type:String,
        // required:true,
    },
    
    tag:{
        type:String,
        // required:true,
    },

    category:{
        type:Schema.Types.ObjectId, 
        ref:"Category",
        required:true
    },
    mainPrice:{
        type:Number,
        required:true,
    },
    salePrice:{
        type:Number,
        required:true,
        default:0
    },
    productOffer:{
        type:Number,
    
        default:0
    },
    quantity:{
        type:Number,
        default:true
    },
    productImage:{
        type:[String],
        // required:true
    },
      unit: {
        type: String,
        enum: ["kg", "g", "litre", "ml", "piece"],
        
    },

     // ✅ New field: quantity step size
    unitStep: {
        type: Number,
        default: 1
    },

    isblocked:{
        type:Boolean,
        default:false
    },
    status:{
        type:String,
        enum:["available","out of stock","discountinue"],
        required:true,
        default:"available"
    },
    reviews: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        rating: { type: Number, required: false, min: 1, max: 5 },
        comment: { type: String, required: false },
        createdOn: { type: Date, default: Date.now }
    }],
    
    createdOn: {
        type: Date,
        default: Date.now,
      },

    },{timestamps:true})

    module.exports=mongoose.model('Product',productSchema)
    