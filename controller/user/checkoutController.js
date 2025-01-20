const Product = require('../../models/productModel');
const User=require('../../models/userModel')
const Order = require('../../models/orderModel');
const Address=require('../../models/addressModel')

// Render Checkout Page

const loadCheckoutPage = async (req, res) => {
    try {
      const userId = req.session.user;
      const user = await User.findById(userId);
  
      const productId = req.query.productId;
      const quantity = req.query.quantity || 1;
      const product = await Product.findById(productId);
  
      if (!product) {
        return res.status(404).send('Product not found');
      }
  
      res.render('checkout', {
        product,
        quantity,
        user
      });
    } catch (error) {
      console.error(error);
      res.status(500).send('Server Error');
    }
  };
module.exports={
    loadCheckoutPage,
}