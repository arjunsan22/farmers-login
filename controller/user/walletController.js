const User=require('../../models/userModel')
const Wallet = require('../../models/walletModel');


const getWallet = async (req, res) => {
    try {
      const userId = req.session.user;
       const userData=await User.findById(userId)
      console.log("wallet page:", userId);
  
      let wallet = await Wallet.findOne({ userId }).populate('userId');
      if (!wallet) {
        // Create a new wallet for the user if it doesn't exist
        wallet = new Wallet({ userId, balance: 0, transactions: [] });
        await wallet.save();
      }
  
      res.render('wallet', { wallet ,user:userData});
    } catch (error) {
      console.error('Error fetching wallet:', error);
      res.status(500).render('wallet', { errorMessage: 'Server error', wallet: null });
    }
  };

  const addFunds = async (req, res) => {
    try {
      const userId = req.session.user;
      const { amount, description } = req.body;
      let wallet = await Wallet.findOne({ userId });
      if (!wallet) {
        wallet = new Wallet({ userId, balance: 0, transactions: [] });
      }
      wallet.balance += parseFloat(amount);
      wallet.transactions.push({ amount: parseFloat(amount), type: 'credit', description });
      await wallet.save();
      res.redirect('/wallet');
    } catch (error) {
      console.error('Error adding funds:', error);
      res.status(500).redirect('/wallet');
    }
  };

  module.exports = {
    getWallet,
    addFunds,
  };