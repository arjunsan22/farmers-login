const Order=require('../../models/orderModel')
const User = require("../../models/userModel");
const Product = require('../../models/productModel');
const Wallet = require('../../models/walletModel');

const getOrderHistory = async (req, res) => {
    try {
      const userId = req.session.user; 
   const userData=await User.findById(userId)
  
      
  
     
      const orders = await Order.find({ userId }).populate('orderedItems.product').populate('address').sort({ createdOn: -1 })
      console.log("orders details :",orders)
  

      res.render('order-history', { orders ,user:userData});
    } catch (error) {
      console.error('Error fetching order history:', error);
      res.status(500).send('Something went wrong while fetching the order history');
    }
  };


  const cancelOrder = async (req, res) => {
    try {
        const orderId = req.params.orderId;

  
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).send('Order not found');
        }

        order.Status = 'cancelled';
        await order.save();

       
        for (const item of order.orderedItems) {
            const product = await Product.findById(item.product);
            if (product) {
                product.quantity += item.quantity;
                await product.save();
            }
        }

        //for wallet//
        if (order.paymentMethod === 'wallet') {
            const wallet = await Wallet.findOne({ userId: order.userId });
            if (wallet) {
              wallet.balance += order.finalAmount;
              wallet.transactions.push({
                amount: order.finalAmount,
                type: 'credit',
                description: 'Order cancellation refund',
              });
              await wallet.save();
            }
          }      

        res.redirect('/order-history');
    } catch (error) {
        console.error('Error cancelling order:', error);
        res.status(500).send('Error cancelling order');
    }
};



const returnOrder = async (req, res) => {
  try {
      const orderId = req.params.orderId;
      const { returnReason } = req.body;

      const order = await Order.findById(orderId);
      if (!order) {
          return res.status(404).send('Order not found');
      }

   
      order.Status = 'return request';
      order.orderedItems.forEach(item => {
          item.returnReason = returnReason;
      });
      await order.save();

     
      for (const item of order.orderedItems) {
          const product = await Product.findById(item.product);
          if (product) {
              product.quantity += item.quantity;
              await product.save();
          }
      }
  // final amount back to the user's wallet //
  if (order.paymentMethod === 'wallet') {
    const wallet = await Wallet.findOne({ userId: order.userId });
    if (wallet) {
      wallet.balance += order.finalAmount;
      wallet.transactions.push({
        amount: order.finalAmount,
        type: 'credit',
        description: 'Order return refund',
      });
      await wallet.save();
    }
  }


      res.redirect('/order-history');
  } catch (error) {
      console.error('Error processing return request:', error);
      res.status(500).send('Error processing return request');
  }
};



module.exports={

    getOrderHistory,
    cancelOrder,
    returnOrder
}