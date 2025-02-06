const Product = require('../../models/productModel');
const User=require('../../models/userModel')
 const Order = require('../../models/orderModel');
const Address=require('../../models/addressModel')
const Cart = require('../../models/cartModel');
const Coupon=require('../../models/couponModel')
const Wallet = require('../../models/walletModel');
const razorpayInstance = require('../../config/razorpayConfig');
const crypto = require('crypto');

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

 let finalTotal = cartTotal;
      if (req.session.couponApplied) {
        finalTotal = req.session.couponApplied.finalTotal;
      }
console.log(finalTotal)
    // for checking  if a discounted total exists in the session //from an applied coupon//


      res.render('checkout', {
        products,
        user,
        userAddress,
        cartTotal,
        availableCoupons,
        razorpayKeyId: process.env.RAZORPAY_KEY_ID,
        finalTotal,
        session: req.session
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
    const userId = req.session.user;
    if (!userId) {
      return res.status(401).send('Unauthorized: User not logged in');
    }

    const { products, quantities, address, paymentMethod, razorpay_payment_id } = req.body;
    console.log('Req.body=',req.body)

    console.log("Received products:", products);
    console.log("Received quantities:", quantities);

    if (!Array.isArray(products) || !Array.isArray(quantities) || products.length !== quantities.length) {
      return res.status(400).json({ success: false, message: 'Invalid products or quantities' });
    }

    let totalPrice = 0;
    const orderedItems = [];

    for (let i = 0; i < products.length; i++) {
      const productId = products[i];
      const quantity = quantities[i];

      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).send(`Product with ID ${productId} not found`);
      }

      if (product.quantity < quantity) {
        return res.status(400).send(`Insufficient stock for product: ${product.productname}`);
      }

      product.quantity -= quantity;
      await product.save();

      const itemTotalPrice = product.salePrice * quantity;
      totalPrice += itemTotalPrice;

      orderedItems.push({
        product: productId,
        quantity,
        price: product.salePrice,
      });
    }

    const discount =  req.session.couponApplied ? req.session.couponApplied.discount : 0;
    const finalAmount = totalPrice - discount;
    console.log("discount",discount)
console.log("finalAmount",finalAmount)

if (paymentMethod === 'cod' && finalAmount > 1000) {
  return res.status(400).json({ 
    success: false, 
    message: 'Cash on Delivery is not available for orders above ₹1,000. Please choose a different payment method.',
    status: 'cod_restricted'
  });
}

    if (paymentMethod === 'wallet') {
      const wallet = await Wallet.findOne({ userId });
      console.log("wallet",wallet.balance)
      if (!wallet || wallet.balance < finalAmount) {
        return res.status(400).json({ success: false, message: 'Insufficient wallet balance' });
      }

      wallet.balance -= finalAmount;
      wallet.transactions.push({
        amount: finalAmount,
        type: 'debit',
        description: 'Order payment',
      });
      await wallet.save();
    } else if (paymentMethod === 'razorpay') {
      const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
      hmac.update(`${req.body.razorpay_order_id}|${razorpay_payment_id}`);
      const generatedSignature = hmac.digest('hex');

      if (generatedSignature !== req.body.razorpay_signature) {
        return res.status(400).json({ success: false, message: 'Payment verification failed' });
      }
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

    const savedOrder = await order.save();
    await Cart.updateOne({ userId }, { $set: { items: [] } });

    req.session.couponApplied = null;
    res.json({ success: true, orderId: savedOrder._id });
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

//rasorpay integration//

const createRazorpayOrder = async (req, res) => {
  try {
    const { amount, currency } = req.body;
    const options = {
      amount: amount * 100, // amount in the smallest currency unit
      currency,
      receipt: `receipt_${Date.now()}`,
    };
    const order = await razorpayInstance.orders.create(options);
    res.json(order);
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).send('Something went wrong while creating the Razorpay order');
  }
};

const verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    
    
    const generatedSignature = hmac.digest('hex');

    if (generatedSignature === razorpay_signature) {
      res.json({ success: true, message: 'Payment verified successfully' });
    } else {
      res.status(400).json({ success: false, message: 'Payment verification failed' });
    }
  } catch (error) {
    console.error('Error verifying Razorpay payment:', error);
    res.status(500).send('Something went wrong while verifying the Razorpay payment');
  }
};



module.exports={
    loadCheckoutPage,
    loadCheckoutUserAddress,
    addNewCheckoutAddress,
    loadEditCheckoutAddressPage,
    updateCheckoutAddress,
    Orderplacement,
    orderSuccess,
    createRazorpayOrder,
    verifyRazorpayPayment,
}