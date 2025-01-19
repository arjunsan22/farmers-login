const User = require("../../models/userModel");
const Product=require('../../models/productModel')
const Category=require('../../models/categoryModel')
const bcrypt=require('bcrypt')
const env=require('dotenv').config()
const Cart=require('../../models/cartModel')

//add to cart //

const addToCart = async(req,res)=>{

    try {
        const userId = req.session.user
        const { productId, quantity } = req.body;

        // Get product details
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        let cart = await Cart.findOne({ userId: userId });
        
        if (!cart) {
            // Create new cart if doesn't exist
            cart = new Cart({
                userId: userId,
                items: []
            });
        }

        // Calculate prices
        const price = product.price;
        const totalPrice = price * quantity;

        // Check if product already exists in cart
        const existingItemIndex = cart.items.findIndex(
            item => item.productId.toString() === productId
        );

        if (existingItemIndex > -1) {
            // Update existing item
            cart.items[existingItemIndex].quantity += quantity;
            cart.items[existingItemIndex].totalPrice = 
                cart.items[existingItemIndex].price * cart.items[existingItemIndex].quantity;
        } else {
            // Add new item
            cart.items.push({
                productId: productId,
                quantity: quantity,
                price: price,
                totalPrice: totalPrice,
                Status: 'placed',
                cancellation: 'none'
            });
        }

        await cart.save();
        res.json({ success: true, message: 'Product added to cart' });

    } catch (error) {
        console.error('Add to cart error:', error);
        res.status(500).json({ success: false, message: 'Failed to add to cart' });
    }

    

}

const getCart=async(req,res)=>{
    try {
        const userId = req.session.user;
        const userData=await User.findById(userId)
        const cart = await Cart.findOne({ userId: userData })
            .populate('items.productId');

        const cartItems = cart ? cart.items : [];
        const cartTotal = cartItems.reduce((total, item) => total + item.totalPrice, 0);

        res.render('userCart', {
            cartItems,
            cartTotal,
            cart
        });

    } catch (error) {
        console.error('Get cart error:', error);
        res.status(500).render('error', { message: 'Failed to load cart' });
    }


}

module.exports={
   
    addToCart,
    getCart

}