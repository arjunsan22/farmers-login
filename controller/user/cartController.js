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
    const userId = await User.findById(user); // Ensure `userId` is correct

    try {
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const cart = await Cart.findOne({ userId });

        if (cart) {
            // Check if the product already exists in the cart
            const existingItem = cart.items.find(item => item.productId.toString() === productId);

            if (existingItem) {
                existingItem.quantity += parseInt(quantity, 10); // Ensure `quantity` is treated as a number
                existingItem.totalPrice = existingItem.quantity * product.salePrice;
            } else {
                cart.items.push({
                    productId,
                    quantity: parseInt(quantity, 10), // Convert to number
                    price: product.salePrice,
                    totalPrice: parseInt(quantity, 10) * product.salePrice
                });
            }

            await cart.save();
        } else {
            // Create a new cart
            const newCart = new Cart({
                userId,
                items: [{
                    productId,
                    quantity: parseInt(quantity, 10), // Convert to number
                    price: product.salePrice,
                    totalPrice: parseInt(quantity, 10) * product.salePrice
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
        if(!user){
            res.redirect('/login',{message:"Login required to see cart "})
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
            totalPrice: item.totalPrice
        }));

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

        if (action === 'increase') {
            if (cartItem.quantity >= product.quantity) {
                return res.status(400).json({ message: 'Out of Stock' });
            }
            cartItem.quantity += 1;
        } else if (action === 'decrease' && cartItem.quantity > 1) {
            cartItem.quantity -= 1;
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