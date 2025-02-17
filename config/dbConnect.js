const mongoose=require('mongoose')
const dbConnect= () => {
    try{
        const clientOptions = {
            serverApi: {version: '1', strict: false, deprecationErrors: true},
          };
    const conn=mongoose.connect(process.env.MONGODB_URL,clientOptions)
   
    console.log('database connection successfull')   
}
    catch(error){
        console.log('database connection error finded')
    }


}

module.exports=dbConnect