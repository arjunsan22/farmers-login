const { default: mongoose } = require("mongoose")
const env=require('dotenv').config();
const dbConnect=()=>{
    try{
    const conn=mongoose.connect(process.env.MONGODB_URL)
console.log('successfully database connected')    
}
    catch(error){
      console.log('database error')
    }

}
module.exports=dbConnect;