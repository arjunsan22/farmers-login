const mongoose=require('mongoose')
const dbConnect= () => {
    try{
    const conn=mongoose.connect('mongodb://localhost:27017/farmers_login')
    console.log('database connection successfull')   
}
    catch(error){
        console.log('database connection error finded')
    }


}

module.exports=dbConnect