const mongoose=require('mongoose')
const {Schema}=mongoose;

const blogSchema=new mongoose.Schema({

name:{
    type:String,
    required:true,
},
picture:{
    type:String,

},
description:{
    type:String,
},
deseases:{
    type:String,

},
remedies:{
    type:String,
},
cultivationTime:{
    type:String,
},
pictureGallery:{
    type:[String]
},
cultivationClimate:{
    type:String,
    
},
cultivationSoil:{
    type:String,
    
},
categoryName:{
    type:String,
    
},
pestisides:{
    type:String,
    
},
howToPlant:{
    type:String,
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
