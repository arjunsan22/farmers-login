const User=require('../../models/userModel')
const Wallet = require('../../models/walletModel');


// const getWallet = async (req, res) => {
//     try {
//       const userId = req.session.user;
//        const userData=await User.findById(userId)
     
//        const totalTransactions = wallet.transactions.length;

//        const page = parseInt(req.query.page) || 1; 
//        const limit = 4; 
//        const skip = (page - 1) * limit; 
//        const totalPages = Math.ceil(totalTransactions / limit); 
    
//       let wallet = await Wallet.findOne({ userId }).sort({}).populate('userId').skip(skip)
//       .limit(limit);
//       if (!wallet) {
//         // Create a new wallet for the user if it doesn't exist//
//         wallet = new Wallet({ userId, balance: 0, transactions: [] });
//         await wallet.save();
//       }else {
        
//         wallet.transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
//     }
  
//       res.render('wallet', { wallet ,user:userData,currentPage: page,totalPages});
//     } catch (error) {
//       console.error('Error fetching wallet:', error);
//       res.status(500).render('wallet', { errorMessage: 'Server error', wallet: null });
//     }
//   };


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

  const addFunds = async (req, res) => {
    try {
      const userId = req.session.user;
      const { amount, description } = req.body;

      let wallet = await Wallet.findOne({ userId });
      if (!wallet) {
        wallet = new Wallet({ userId, balance: 0, transactions: [] });
      }
      if(amount > 20000){ 
        return res.status(400).json({ success: false, message: 'You can add only 20000 rupees at a time' });        
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