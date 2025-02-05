const User = require("../../models/userModel");
// const bcrypt=require('bcrypt')
// const env=require('dotenv').config()
// const mongoose=require('bcrypt')
 

const customerInfo =async (req,res) => {
    try {
        
        let search="";
        if(req.query.search){
            search=req.query.search
        }

        let page=1;
        
        if(req.query.page){
            page=req.query.page
        }

        const limit=3;
        const userData =await User.find({
            isAdmin:false,
            $or:[
                {name:{$regex:".*"+search+".*"}},
                {email:{$regex:".*"+search+".*"}}
            ]
        })
        .sort({createdOn:-1})
         .limit(limit*1)
         .skip((page-1)*limit)
         .exec()

         const count = await User.find({
            isAdmin:false,
            $or:[
                {name:{$regex:".*"+search+".*"}},
                {email:{$regex:".*"+search+".*"}}
            ]

         }).countDocuments();
         res.render('customer',{data:userData,
            totalPages: Math.ceil(count / limit),
            currentPage: page
         })


    } catch (error) {
        console.log("error found in customers listing..",error)
    }
}



module.exports={
    customerInfo
}