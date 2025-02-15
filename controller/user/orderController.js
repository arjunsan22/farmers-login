const Order=require('../../models/orderModel')
const User = require("../../models/userModel");
const Product = require('../../models/productModel');
const Wallet = require('../../models/walletModel');
const Cart = require('../../models/cartModel');
const razorpayInstance = require('../../config/razorpayConfig');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');


const getOrderHistory = async (req, res) => {
    try {
      const userId = req.session.user; 
   const userData=await User.findById(userId)
  
   const page = parseInt(req.query.page) || 1; 
   const limit = 4; 
   const skip = (page - 1) * limit; 
   const totalOrders = await Order.countDocuments({ userId }); 
   const totalPages  = Math.ceil(totalOrders / limit); 

     
      const orders = await Order.find({ userId }).populate('orderedItems.product')
      .populate('address')
      .sort({ createdOn: -1 })
      .skip(skip)
      .limit(limit)
      console.log("Image paths:", orders.map(order => 
        order.orderedItems.map(item => item.product.productImage)
      ));
      // console.log("orders details :",orders)
  
      res.render('order-history', { orders ,user:userData,currentPage: page, totalPages ,razorpayKeyId:process.env.RAZORPAY_KEY_ID  });

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

        //for wallet and razorpays//
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
          }else if (order.paymentMethod === 'razorpay') {
            const wallet = await Wallet.findOne({ userId: order.userId });
            if (wallet) {
              wallet.balance += order.finalAmount;
              wallet.transactions.push({
                amount: order.finalAmount,
                type: 'credit',
                description: ' Order cancellation refund',
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
      const { returnReason} = req.body;
console.log("returnReason :",returnReason)

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
  // final amount back to the user's wallet also rasorpay //
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
  else if (order.paymentMethod === 'razorpay') {
    const wallet = await Wallet.findOne({ userId: order.userId });
    if (wallet) {
      wallet.balance += order.finalAmount;
      wallet.transactions.push({
        amount: order.finalAmount,
        type: 'credit',
        description: ' Order return refund',
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


const downloadInvoice = async (req, res) => {
  try {
      const orderId = req.params.orderId;
      const order = await Order.findById(orderId)
          .populate('orderedItems.product')
          .populate('address')
          .populate('userId');

      if (!order) {
          return res.status(404).send('Order not found');
      }

      // Create a new PDF document with better margins
      const doc = new PDFDocument({
          size: 'A4',
          margin: 40
      });

      const invoiceName = `invoice-${order.orderId}.pdf`;
      const publicPath = path.join(__dirname, '..', '..', 'public');
      const invoicesDir = path.join(publicPath, 'invoices');
      const invoicePath = path.join(invoicesDir, invoiceName);

      if (!fs.existsSync(invoicesDir)) {
          fs.mkdirSync(invoicesDir, { recursive: true });
      }

      const writeStream = fs.createWriteStream(invoicePath);
      writeStream.on('error', (error) => {
          console.error('Error writing to file:', error);
          return res.status(500).send('Error generating invoice');
      });

      doc.pipe(writeStream);

      // Flipkart-style header with blue background
      doc.rect(0, 0, doc.page.width, 150)
         .fill('#2874F0');

      // White text for header
      doc.fillColor('#FFFFFF')
         .fontSize(30)
         .font('Helvetica-Bold')
         .text('INVOICE', 40, 40)
         .fontSize(12)
         .font('Helvetica')
         .text('Order ID: ' + order.orderId.slice(-5), 40, 80)
         .text('Order Date: ' + order.createdOn.toLocaleDateString(), 40, 100);

      // Company logo section (right side of header)
      doc.fontSize(16)
         .font('Helvetica')
         .text('FARMERS LOGIN', 400, 40)
         .fontSize(10)
         .font('Helvetica')
         .text('www.farmerslogin.com', 400, 65)
         .text('farmerslogin@gmail.com', 400, 80)
         .text('Customer Care: +91 1234567890', 400, 95);

      // Order Status Banner
      doc.rect(0, 150, doc.page.width, 30)
         .fill('#47BD4A');
      doc.fillColor('#FFFFFF')
         .fontSize(12)
         .font('Helvetica-Bold')
         .text('Order Status: Delivered', 40, 158);

      // Shipping & Billing Information
      doc.fillColor('#2874F0')
         .fontSize(14)
         .text('SHIPPING DETAILS', 40, 200)
         .fillColor('#000000')
         .fontSize(10)
         .font('Helvetica');

      // Modern address box
      doc.rect(40, 220, 250, 100)
         .lineWidth(1)
         .stroke('#E4E4E4');
      
      doc.font('Helvetica')
         .fontSize(10)
         .fillColor('#000000')
         .text(order.address.name, 50, 230)
         .text(order.address.Houseno + ', ' + order.address.StreetMark, 50, 250)
         .text(order.address.city + ', ' + order.address.state, 50, 270)
         .text('PIN: ' + order.address.pincode, 50, 290)
         .text('Phone: ' + order.address.Phone, 50, 310);

      // Items Table Header
      doc.rect(40, 350, doc.page.width - 80, 30)
         .fill('#F1F3F6');
      
      doc.fillColor('#2874F0')
         .fontSize(10)
         .font('Helvetica-Bold')
         .text('ITEM', 50, 360)
         .text('QTY', 300, 360)
         .text('PRICE', 400, 360)
         .text('TOTAL', 500, 360);

      // Items Table Content
      let yPosition = 390;
      order.orderedItems.forEach((item, index) => {
          // Alternate row colors
          if (index % 2 === 0) {
              doc.rect(40, yPosition - 5, doc.page.width - 80, 25)
                 .fill('#FAFAFA');
          }

          doc.fillColor('#000000')
             .fontSize(10)
             .font('Helvetica')
             .text(item.product.productname, 50, yPosition)
             .text(item.quantity.toString(), 300, yPosition)
             .text('₹' + item.price.toLocaleString(), 400, yPosition)
             .text('₹' + (item.price * item.quantity).toLocaleString(), 500, yPosition);

          yPosition += 25;
      });

      // Price Summary Box
      const summaryY = yPosition + 20;
      doc.rect(350, summaryY, 200, 120)
         .fill('#F1F3F6');

      doc.fontSize(12)
         .font('Helvetica')
         .fillColor('#000000')
         .text('Price Summary', 360, summaryY + 10)
         .fontSize(10)
         .text('Subtotal:', 360, summaryY + 35)
         .text('₹' + order.totalPrice.toLocaleString(), 480, summaryY + 35)
         .text('Discount:', 360, summaryY + 55)
         .text('₹' + order.discount.toLocaleString(), 480, summaryY + 55)
         .font('Helvetica-Bold')
         .fontSize(12)
         .text('Final Amount:', 360, summaryY + 85)
         .fillColor('#47BD4A')
         .text('₹' + order.finalAmount.toLocaleString(), 480, summaryY + 85);

      // Footer
      const footerY = doc.page.height - 100;
      doc.rect(0, footerY, doc.page.width, 100)
         .fill('#2874F0');

      doc.fillColor('#FFFFFF')
         .fontSize(12)
         .font('Helvetica-Bold')
         .text('Thank you for shopping with Farmers Login!', 40, footerY + 20)
         .fontSize(10)
         .font('Helvetica')
         .text('For any assistance, please contact our 24x7 Customer Care', 40, footerY + 40)
         .text('Email:farmerslogin@gmail.com | Phone: +91 8590924576', 40, footerY + 60);

      // Finalize PDF
      doc.end();

      // Handle file download
      writeStream.on('finish', () => {
          res.download(invoicePath, invoiceName, (err) => {
              if (err && !res.headersSent) {
                  console.error('Error downloading invoice:', err);
                  res.status(500).send('Error downloading invoice');
              }
              fs.unlink(invoicePath, (unlinkErr) => {
                  if (unlinkErr) console.error('Error deleting invoice file:', unlinkErr);
              });
          });
      });

  } catch (error) {
      console.error('Error generating invoice:', error);
      if (!res.headersSent) {
          res.status(500).send('Error generating invoice');
      }
  }
};


const createRazorpayOrderFromHistory = async (req, res) => {
  try {

    const orderId = req.params.orderId;
    const order = await Order.findById(orderId);

    //checking quantity
      
      if (!order) {
          return res.status(404).json({ error: 'Order not found' });
      }


      // Create Razorpay order
      const razorpayOrder = await razorpayInstance.orders.create({
        amount: Math.round(order.finalAmount * 100) , // Convert to paise
          currency: 'INR',
          receipt: order.orderId
      });
      console.log("razorpay order created:", razorpayOrder);

      res.json({
          orderId: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency
      });
  } catch (error) {
      console.error('Error creating Razorpay order:', error);
      res.status(500).json({ error: 'Failed to create order' });
  }
};


const verifyPayment = async (req, res) => {
  try {
    console.log("verify payment : ",req.body)  
    const { payment, order: orderId } = req.body;
      
    // Create signature hash to verify payment
    const secret = process.env.RAZORPAY_KEY_SECRET;
    const shasum = crypto.createHmac('sha256', secret);
    shasum.update(`${payment.razorpay_order_id}|${payment.razorpay_payment_id}`);
    const digest = shasum.digest('hex');

    // Verify signature
    if (digest === payment.razorpay_signature) {
      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({ success: false, error: 'Order not found' });
      }

      // Update product quantities in inventory
      try {
        for (const item of order.orderedItems) {
          const product = await Product.findById(item.product._id);
          if (!product) {
            throw new Error(`Product ${item.product._id} not found`);
          }
          
          // Check if enough quantity is available
          if (product.quantity < item.quantity) {
            throw new Error(`Insufficient quantity for product ${product.productname}`);
          }
          
          // Decrease the product quantity
          product.quantity -= item.quantity;
          await product.save();
        }
//update cart to empty//
const cart = await Cart.findOne({ userId: order.userId });
if (cart) {
  cart.items = [];
  await cart.save();
}



        // Update order status and payment details
        order.Status = 'pending';
        order.paymentMethod = 'razorpay';
        order.paymentStatus = 'completed';
        order.razorpayPaymentId = payment.razorpay_payment_id;
        order.razorpayOrderId = payment.razorpay_order_id;
        order.razorpaySignature = payment.razorpay_signature;
        
        // Save the order
        await order.save();

        return res.json({ success: true });
      } catch (error) {
        // If there's an error updating quantities, log it and return error
        console.error('Error updating product quantities:', error);
        return res.status(400).json({ 
          success: false, 
          error: error.message || 'Failed to update product quantities'
        });
      }
    } else {
  
      return res.json({ success: false, error: 'Invalid signature' });
    }
  }
  
  catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ success: false, error: 'Payment verification failed' });
  }
};


module.exports={

    getOrderHistory,
    cancelOrder,
    returnOrder,
    downloadInvoice,
    createRazorpayOrderFromHistory,
    verifyPayment
}