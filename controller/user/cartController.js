const User = require("../../models/userModel");
const Product = require('../../models/productModel');
const Category = require('../../models/categoryModel');
const bcrypt = require('bcrypt');
const env = require('dotenv').config();
const Cart = require('../../models/cartModel');

// Add to cart//

const addToCart = async (req, res) => {
    const { productId, quantity } = req.body;
    const user = req.session.user;
    const userId = await User.findById(user); 

    try {
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        const cart = await Cart.findOne({ userId });

        if (cart) {

            const existingItem = cart.items.find(item => item.productId.toString() === productId);

            if (existingItem) {
                const newQuantity = existingItem.quantity + parseFloat(quantity);
                if (newQuantity > product.quantity) {
                    return res.status(400).json({ success: false, message: 'Exceeds available stock' });
                }
                existingItem.quantity = newQuantity; // update quantity//
                existingItem.totalPrice = existingItem.quantity * product.salePrice;
            } else {
                if (parseFloat(quantity) > product.quantity) {
                    return res.status(400).json({ success: false, message: 'Exceeds available stock' });
                }
                cart.items.push({
                    productId,
                    quantity: parseFloat(quantity), 
                    price: product.salePrice,
                    unit: product.unit,
                    unitStep: product.unitStep,
                    totalPrice: parseFloat(quantity) * product.salePrice                });
            }

            await cart.save();
        } else {
    if (parseFloat(quantity) > product.quantity) {
                return res.status(400).json({ success: false, message: 'Exceeds available stock' });
            }
            // Create a new cart
            const newCart = new Cart({
                userId,
                items: [{
                     productId,
            quantity: parseFloat(quantity),
                      price: product.salePrice,
                    unit: product.unit,
                    unitStep: product.unitStep,
            totalPrice: parseFloat(quantity) * product.salePrice
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
    const user = await User.findById(userId);

    try {
        if(!user){
           return res.render('login',{message:"Login required to see cart "})
        }
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
            unit: item.productId.unit,
            unitStep: item.productId.unitStep,
            totalPrice: item.totalPrice
        }))

      //  console.log("Cart Items:", cartItems); // Debugging output

        const cartTotal = cart.items.reduce((acc, item) => acc + item.totalPrice, 0);

        res.render('userCart', { cartItems, cartTotal ,user});
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};





const updateQuantity = async (req, res) => {
    const { productId, action } = req.body;
    const userId = req.session.user;

    try {
        const cart = await Cart.findOne({ userId });
        if (!cart) return res.status(404).json({ message: 'Cart not found' });

        const cartItem = cart.items.find(item => item.productId.toString() === productId);
        if (!cartItem) return res.status(404).json({ message: 'Product not found in cart' });

        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ message: 'Product not found' });

      const step = cartItem.unitStep || 0.5;
if (action === 'increase') {
    if (cartItem.quantity + step > product.quantity) {
        return res.status(400).json({ message: 'Out of Stock' });
    }
    cartItem.quantity = parseFloat((cartItem.quantity + step).toFixed(2));
} else if (action === 'decrease') {
    if (cartItem.quantity - step >= step) {
        cartItem.quantity = parseFloat((cartItem.quantity - step).toFixed(2));
    }
}
        cartItem.totalPrice = cartItem.quantity * cartItem.price;
        await cart.save();
        const cartTotal = cart.items.reduce((acc, item) => acc + item.totalPrice, 0);
        res.status(200).json({ message: 'Cart updated', cartTotal, cartItem });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const removeFromCart = async (req, res) => {
    const { productId } = req.body;
    const userId = req.session.user;

    try {
        const cart = await Cart.findOne({ userId });
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        cart.items = cart.items.filter(item => item.productId.toString() !== productId);
        await cart.save();

        const cartTotal = cart.items.reduce((acc, item) => acc + item.totalPrice, 0);
        res.status(200).json({ message: 'Product removed from cart', cartTotal });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    addToCart,
    getCart,
    updateQuantity,
    removeFromCart
}