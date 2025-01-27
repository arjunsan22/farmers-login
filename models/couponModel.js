const mongoose=require('mongoose')
const {Schema}=mongoose;

const coupenSchema=new mongoose.Schema({

    couponCode: {
        type: String,
        required: true,
        unique: true, // To ensure uniqueness of coupon codes
      },
      couponType: {
        type: String,
        required: true, // For example, "Discount", "Cashback", etc.
      },
      description: {
        type: String,
        required: false, // Optional description of the coupon
      },
      offerPrice: {
        type: Number,
        required: true, // Discount or offer amount
      },
      minimumPrice: {
        type: Number,
        required: true, // Minimum purchase value to apply the coupon
      },
      usageLimit: {
        type: Number,
        required: true, // Max number of times the coupon can be used
        default: 1,
      },
      startOn: {
        type: Date,
        required: true, // Starting date of the coupon validity
      },
      expireOn: {
        type: Date,
        required: true, // Expiry or ending date of the coupon validity
      },
      isActive: {
        type: Boolean,
        default: true, // Status of the coupon (active/deactivated)
      },
      createdOn: {
        type: Date,
        default: Date.now, // Date when the coupon was created
        required: true,
      },
userId:[{
    type:mongoose.Schema.Types.ObjectId,
    ref:"User"


}]

})

module.exports=mongoose.model('Coupon',coupenSchema)
