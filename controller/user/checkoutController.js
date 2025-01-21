const Product = require('../../models/productModel');
const User=require('../../models/userModel')
const Order = require('../../models/orderModel');
const Address=require('../../models/addressModel')

// Render Checkout Page

const loadCheckoutPage = async (req, res) => {
    try {
      const userId = req.session.user;
      const user = await User.findById(userId);
      
  const userAddress=await Address.findOne({userId})

      const productId = req.query.productId;
      const quantity = req.query.quantity || 1;
      const product = await Product.findById(productId);
  
      if (!product) {
        return res.status(404).send('Product not found');
      }
     // checking   the user has any addresses//
   
     const addresses = userAddress
     ? userAddress.address.map((addr) => ({
         _id: addr._id,
         addressType: addr.addressType,  // Ensure addressType is being passed
         name: addr.name,  // Make sure name is included
         city: addr.city,
         StreetMark: addr.StreetMark,
         state: addr.state,
         pincode: addr.pincode,
         Phone: addr.Phone,
         SecondPhone: addr.SecondPhone,
         Houseno: addr.Houseno,
       }))
     : [];
   
     // If no addresses, pass an empty array//
  
      res.render('checkout', {
        product,
        quantity,
        user,
        addresses,

      });
    } catch (error) {
      console.error(error);
      res.status(500).send('Server Error');
    }
  };
  
module.exports={
    loadCheckoutPage,
}