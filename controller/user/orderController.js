const Order=require('../../models/orderModel')
const User = require("../../models/userModel");
const Product = require('../../models/productModel');


const getOrderHistory = async (req, res) => {
    try {
      const userId = req.session.user; 
   const userData=await User.findById(userId)
  
      
  
      // Fetch the user's order shistory
      const orders = await Order.find({ userId }).populate('orderedItems.product').populate('address').sort({ createdOn: -1 })
      console.log("orders details :",orders)
  
      // Render the order history page with the fetched orders
      res.render('order-history', { orders ,user:userData});
    } catch (error) {
      console.error('Error fetching order history:', error);
      res.status(500).send('Something went wrong while fetching the order history');
    }
  };



module.exports={

    getOrderHistory
}