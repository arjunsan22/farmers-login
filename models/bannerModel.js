const mongoose=require('mongoose')
const {Schema}=mongoose;

const bannerSchema=new mongoose.Schema({

image:{
    type:String,
    required:true,

},

title:{
    type:String,
    required:true,
},
description:{
    type:String,
    required:true,
},
link:{
    type:String,
},
startDate:{
    type:Date,
    equired:true
},
endDate:{
    type:Date,
    required:true
}


})

module.exports=mongoose.model('Banner',bannerSchema)