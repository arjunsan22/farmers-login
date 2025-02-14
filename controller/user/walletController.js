const User=require('../../models/userModel')
const Wallet = require('../../models/walletModel');
const Razorpay = require('razorpay');
const razorpay = new Razorpay({
  key_id:process.env.RAZORPAY_KEY_ID  || 'YOUR_RAZORPAY_KEY_ID',
  key_secret:process.env.RAZORPAY_KEY_SECRET || 'YOUR_RAZORPAY_KEY_SECRET'
});


const getWallet = async (req, res) => {
  try {
      const userId = req.session.user;
      const userData = await User.findById(userId);
      
      // First find the wallet
      let wallet = await Wallet.findOne({ userId }).populate('userId');
      
      if (!wallet) {
          // Create a new wallet for the user if it doesn't exist
          wallet = new Wallet({ userId, balance: 0, transactions: [] });
          await wallet.save();
      }

      // Get total transactions count
      const totalTransactions = wallet.transactions.length;
      
      // Pagination
      const page = parseInt(req.query.page) || 1;
      const limit = 4;
      const skip = (page - 1) * limit;
      const totalPages = Math.ceil(totalTransactions / limit);

      // Slice the transactions array for pagination
      wallet.transactions = wallet.transactions
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(skip, skip + limit);

      res.render('wallet', { 
          wallet,
          user: userData,
          currentPage: page,
          totalPages
      });
  } catch (error) {
      console.error('Error fetching wallet:', error);
      res.status(500).render('wallet', { errorMessage: 'Server error', wallet: null });
  }
};

const createRazorpayOrder = async (req, res) => {
  try {
    console.log("createRazorpayOrder working");
    const { amount } = req.body;
    console.log("amount", amount);
    const options = {
      amount: amount * 100, // amount in the smallest currency unit
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
    };
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({ error: 'Failed to create Razorpay order' });
  }
};

const verifyRazorpayPayment = async (req, res) => {
  try {
    console.log("verifyRazorpayPayment working");
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, amount, description } = req.body;
    const userId = req.session.user;
    console.log("amount", amount);
    console.log("description", description);

    // Verify the payment signature
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'YOUR_RAZORPAY_KEY_SECRET');
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const generatedSignature = hmac.digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    // Update the wallet balance and transactions
    let wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      wallet = new Wallet({ userId, balance: 0, transactions: [] });
    }
    wallet.balance += parseFloat(amount);
    wallet.transactions.push({ amount: parseFloat(amount), type: 'credit', description });
    await wallet.save();

    res.json({ success: true });
    console.log(wallet.balance);
  } catch (error) {
    console.error('Error verifying Razorpay payment:', error);
    res.status(500).json({ error: 'Failed to verify Razorpay payment' });
  }
};


module.exports = {
  getWallet,
  createRazorpayOrder,
  verifyRazorpayPayment,
};