const User=require('../models/userModel')


const loadhomepage=(req,res)=>{
    try {
        res.render('home')
    } catch (error) {
        console.log(error)
    }
}



module.exports={
    loadhomepage
}