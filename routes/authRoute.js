const express=require('express');
const userController = require('../controller/userCtrl');
const router=express.Router()

router.get('/',userController.loadhomepage);




module.exports=router;