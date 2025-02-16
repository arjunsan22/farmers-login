const mongoose=require('mongoose')
const dbConnect= () => {
    try{
    const conn=mongoose.connect(process.env.MONGODB_URL)
    console.log('database connection successfull')   
}
    catch(error){
        console.log('database connection error finded')
    }


}

module.exports=dbConnect