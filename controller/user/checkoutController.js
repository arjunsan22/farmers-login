const Product = require('../../models/productModel');
const User=require('../../models/userModel')
 const Order = require('../../models/orderModel');
const Address=require('../../models/addressModel')
const Cart = require('../../models/cartModel');
const Coupon=require('../../models/couponModel')
const Wallet = require('../../models/walletModel');

// Render Checkout Page
const loadCheckoutPage = async (req, res) => {
    try {
      const userId = req.session.user;
      console.log("user session in checkout page :",userId)
      const user = await User.findById(userId);

  const userAddress=await Address.find({userId})

  console.log("address : ",userAddress)

  const cart = await Cart.findOne({ userId })
  .populate({
      path: 'items.productId',
      model: 'Product',
      select: 'productname salePrice'
  });

if (!cart || !cart.items.length) {
  return res.redirect('/cart');
}
const products = cart.items.map(item => ({
  _id: item.productId._id,
  productname: item.productId.productname,
  salePrice: item.productId.salePrice,
  quantity: item.quantity,
  totalPrice: item.productId.salePrice * item.quantity
}));

 // Calculate cart total
 const cartTotal = products.reduce((sum, item) => sum + item.totalPrice, 0);

 const availableCoupons = await Coupon.find({ isActive: true });



    // for checking  if a discounted total exists in the session //from an applied coupon//


      res.render('checkout', {
        products,
        user,
        userAddress,
        cartTotal,
        availableCoupons,
      

      });
    } catch (error) {
      console.error(error);
     
      res.status(500).send('Server Error');
    }
  };

  const loadCheckoutUserAddress = async (req, res) => {
    try {
      const userId = req.session.user;
      console.log("Session data:", req.session);
      console.log("User ID from session:", userId);
  
    
      const userData = await User.findById(userId);
      console.log("Found user data:", userData ? "Yes" : "No");
  
      if (!userData) {
        console.log("No user found with ID:", userId);
        return res.redirect('/login');
      }
  
      res.render('checkoutUserAddress', {
        user: userData
      });
    } catch (error) {
      console.error("Error in loadCheckoutUserAddressPage:", error);
      res.status(500).send('Server Error');
    }
  
  }
  
const addNewCheckoutAddress = async (req, res) => {
  try {
    const userId = req.session.user;

    const {  name, city, StreetMark, state, pincode, Phone, SecondPhone, Houseno } = req.body;

    // finding the user already has an address //
        let userAddress = await Address.findOne({ userId });
    
        
                // If no address entry exists, create a new one
                userAddress = new Address({
                    userId: userId,
                              name,
                             city,
                            StreetMark,
                            state,
                            pincode,
                            Phone,
                            SecondPhone,
                            Houseno,
                        
                    
                });
        
        
    
            await userAddress.save();
    
                  res.redirect('/checkout');
    
        } catch (error) {
    console.error("error in adding address",error);
    res.redirect('/pagenotfound');
  }


  };

const loadEditCheckoutAddressPage=async (req,res) => {
  
   try {
          const userId = req.session.user;
          const userData =await User.findById(userId) 
          const {addressId}=req.params// Assuming session contains the user ID
          const userAddress = await Address.findById( addressId );
          // console.log(userAddress)
          res.render('editUserCheckoutAddress',{userAddress,user:userData})
      } catch (error) {
          console.error(error);
          res.status(500).send('Internal Server Error');
      }

  
}

const updateCheckoutAddress=async (req,res) => {

   try {
          const userId = req.session.user;
          
          const {addressId} = req.params
          const userAddress = await Address.findById(addressId);
          userAddress.name=req.body.name,
          userAddress.city= req.body.city,
          userAddress.StreetMark= req.body.StreetMark,
          userAddress.state= req.body.state,
          userAddress.pincode= req.body.pincode,
          userAddress.Phone=req.body.Phone,
          userAddress.SecondPhone= req.body.SecondPhone,
          userAddress.Houseno= req.body.Houseno,
            await userAddress.save()
           res.redirect('/checkout')
      
      } catch (error) {
          console.error(error);
          res.status(500).send('Internal Server Error');
      }
}


const Orderplacement = async (req, res) => {
  try {
    // Extract userId from session
    const userId = req.session.user; // Use the correct session key based on your setup

    // Validate user session
    if (!userId) {
      return res.status(401).send('Unauthorized: User not logged in');
    }

    const { products, quantities, address, paymentMethod } = req.body;

    // console.log("order address", address);

    console.log("Received products:", products);
    console.log("Received quantities:", quantities);

    // Validate request body
    if (!Array.isArray(products) || !Array.isArray(quantities) || products.length !== quantities.length) {
      return res.status(400).json({ success: false, message: 'Invalid products or quantities' });
    }

 
    // Update product stock and calculate total price
    let totalPrice = 0;
    const orderedItems = [];

    for (let i = 0; i < products.length; i++) {
      const productId = products[i];
      const quantity = quantities[i];

      // Decrease product stock
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).send(`Product with ID ${productId} not found`);
      }

      if (product.quantity < quantity) {
        return res.status(400).send(`Insufficient stock for product: ${product.productname}`);
      }

      product.quantity -= quantity; // Decrement the stock
      if (product.quantity < 0) {
        product.quantity = 0; // Optional: Set to zero instead of allowing negatives
      }
      await product.save();

      // Calculate total price
      const itemTotalPrice = product.salePrice * quantity;
      totalPrice += itemTotalPrice;

      // Add to ordered items
      orderedItems.push({
        product: productId,
        quantity,
        price: product.salePrice,
      });
    }

    const discount = req.session.discount || 0;
    const finalAmount = totalPrice - discount;

 // Handle wallet payment
    if (paymentMethod === 'wallet') {
      const wallet = await Wallet.findOne({ userId });
      if (!wallet || wallet.balance < finalAmount) {
        return res.status(400).json({ success: false, message: 'Insufficient wallet balance' });
      }

      // Deduct the final amount from the wallet
      wallet.balance -= finalAmount;
      wallet.transactions.push({
        amount: finalAmount,
        type: 'debit',
        description: 'Order payment',
      });
      await wallet.save();
    }
    
    const order = new Order({
      userId,
      orderedItems,
      totalPrice,
      discount,
      finalAmount,
      address,
      paymentMethod,
      status: 'Confirmed',
    });

    // Save the order in the database
    const savedOrder = await order.save();

    console.log("savedOrder details :",savedOrder)
    // Clear user's cart after successful order placement
    await Cart.updateOne(
      { userId },
      { $set: { items: [] } }
    );

    req.session.discount = null;
    // Redirect to success page with order ID
    res.redirect(`/order-success/${savedOrder._id}`);
  } catch (error) {
    console.error('Error placing order:', error);
    res.status(500).send('Something went wrong while placing the order');
  }
};


const orderSuccess = async (req, res) => {
  try {
    
    const userId=req.session.user;
    const userData=await User.findById(userId)
    const orderId = req.params.orderId;

    // Find the order by ID to display its details
    const order = await Order.findById(orderId).populate('orderedItems.product').populate('address');

    if (!order) {
      return res.status(404).send('Order not found');
    }

    // Render the success page with order details
    res.render('order-success', {
      order,
      user:userData
    });
  } catch (error) {
    console.error('Error displaying order success page:', error);
    res.status(500).send('Something went wrong while displaying the order success page');
  }

};



module.exports={
    loadCheckoutPage,
    loadCheckoutUserAddress,
    addNewCheckoutAddress,
    loadEditCheckoutAddressPage,
    updateCheckoutAddress,
    Orderplacement,
    orderSuccess
}