const Wishlist = require('../../models/wishlistModel');
const Product = require('../../models/productModel');
const User=require('../../models/userModel')


const getWishlist = async (req, res) => {
    try {
      const userId = req.session.user;
      if(!userId){
        res.render('login',{message:"Login Required"})
      }
      const userData=await User.findById(userId)

      const wishlist = await Wishlist.findOne({ userId }).populate('products.productId');
      res.render('wishlist', { wishlist,user:userData });
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      res.status(500).send('Something went wrong while fetching the wishlist');
    }
  };

const addToWishlist = async (req, res) => {
  try {
    const userId = req.session.user;
    
    if (!userId) {
        return res.status(401).json({ success: false, message: 'User not logged in' });
      }
    const { productId } = req.body;

    let wishlist = await Wishlist.findOne({ userId });

    if (!wishlist) {
      wishlist = new Wishlist({ userId, products: [] });
    }

    const productExists = wishlist.products.some(product => product.productId.toString() === productId);

    if (!productExists) {
      wishlist.products.push({ productId });
      await wishlist.save();
    }

    res.status(200).json({ success: true, message: 'Product added to wishlist' });
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    res.status(500).json({ success: false, message: 'Error adding to wishlist' });
  }
};

const removeFromWishlist = async (req, res) => {
  try {
    const userId = req.session.user;
    const { productId } = req.body;


    const wishlist = await Wishlist.findOne({ userId });

    if (wishlist) {
      wishlist.products = wishlist.products.filter(product => product.productId.toString() !== productId);
      await wishlist.save();
    }

    res.status(200).json({ success: true, message: 'Product removed from wishlist' });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    res.status(500).json({ success: false, message: 'Error removing from wishlist' });
  }
};

module.exports = {
  addToWishlist,
  removeFromWishlist,
  getWishlist
};