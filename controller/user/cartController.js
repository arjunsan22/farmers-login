const User = require("../../models/userModel");
const Product = require('../../models/productModel');
const Category = require('../../models/categoryModel');
const bcrypt = require('bcrypt');
const env = require('dotenv').config();
const Cart = require('../../models/cartModel');

// Add to cart

const addToCart = async (req, res) => {
    const { productId, quantity } = req.body;
    const user = req.session.user; // Assuming user ID is stored in session
const userId=await User.findById(user)
    try {
        const product = await Product.findById(productId)

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const cart = await Cart.findOne({ userId });

        if (cart) {
            // Check if the product already exists in the cart
            const existingItem = cart.items.find(item => item.productId.toString() === productId);

            if (existingItem) {
                existingItem.quantity += quantity;
                existingItem.totalPrice = existingItem.quantity * product.salePrice;
            } else {
                cart.items.push({
                    productId,
                    quantity,
                    price: product.salePrice,
                    totalPrice: quantity * product.salePrice
                });
            }

            await cart.save();
        } else {
            // Create a new cart
            const newCart = new Cart({
                userId,
                items: [{
                    productId,
                    quantity,
                    price: product.salePrice,
                    totalPrice: quantity * product.salePrice
                }]
            });

            await newCart.save();
        }

        res.status(200).json({ success: true, message: 'Product added to cart successfully!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};


// Get cart items
const getCart = async (req, res) => {
    const userId = req.session.user;
const user=await User.findById(userId)
    try {
        const cart = await Cart.findOne({ userId }).populate('items.productId').populate({
            path: 'items.productId',
            populate: { path: 'category' }
        });;

        if (!cart) {
            return res.status(200).render('userCart', { cartItems: [], cartTotal: 0 });
        }

        const cartItems = cart.items.map(item => ({
            productname: item.productId.productname,
            salePrice: item.productId.salePrice,
            category: item.productId.category,
            productImage: item.productId.productImage,
            product: item.productId, // Ensure this is populated correctly
            quantity: item.quantity,
            totalPrice: item.totalPrice
        }));

        console.log("Cart Items:", cartItems); // Debugging output

        const cartTotal = cart.items.reduce((acc, item) => acc + item.totalPrice, 0);

        res.render('userCart', { cartItems, cartTotal ,user});
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};


module.exports = {
    addToCart,
    getCart
}