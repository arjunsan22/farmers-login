const mongoose=require('mongoose')
const {Schema}=mongoose;

const blogSchema=new mongoose.Schema({

name:{
    type:String,
    required:true,
},
picture:{
    type:String,
    required:true
},
description:{
    type:String,
    required:true
},
pictureGallery:{
    type:[String]
},
createdAt: {
    type: Date,
    default: Date.now
  },
updatedAt: {
    type: Date,
    default: Date.now, 
}

})

module.exports=mongoose.model('Blog',blogSchema)
