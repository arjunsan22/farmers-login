const Coupon = require('../../models/couponModel');
const Cart = require('../../models/cartModel');

const applyCoupon = async (req, res) => {
    try {
        const { couponCode } = req.body;
        const userId = req.session.user;

        // Check if user ID exists in session
        if (!userId) {
            return res.status(401).json({ success: false, message: "User not authenticated." });
        }

        // Fetch the cart for the user
        const cart = await Cart.findOne({ userId });
        if (!cart) {
            return res.status(400).json({ success: false, message: "Cart not found." });
        }

        if (cart.items.length === 0) {
            return res.status(400).json({ success: false, message: "Your cart is empty." });
        }

        // Fetch the coupon
        const coupon = await Coupon.findOne({ couponCode, isActive: true });
        if (!coupon) {
            return res.status(404).json({ success: false, message: "Invalid or expired coupon." });
        }
console.log("coupen:",coupon)
        // Validate coupon date
        const now = new Date();
        if (now < coupon.startOn || now > coupon.expireOn) {
            return res.status(400).json({ success: false, message: "Coupon not valid at this time." });
        }

        // Calculate cart total
        const cartTotal = cart.items.reduce((sum, item) => sum + item.totalPrice, 0);
console.log("cartTotal :",cartTotal)
        // Check if cart total meets coupon's minimum purchase requirement
        if (cartTotal < coupon.minimumPrice) {
            return res.status(400).json({
                success: false,
                message: `Minimum purchase of ₹${coupon.minimumPrice} is required.`,
            });
        }

        // Calculate discount and final total
        const discount = Math.min(coupon.offerPrice, cartTotal);
        const finalCartTotal = cartTotal - discount;
        console.log("finalCartTotal :",finalCartTotal)
        // Update session with discounted total
        req.session.discount = discount;

        // Send response to the frontend
        return res.status(200).json({
            success: true,
            originalTotal: cartTotal,
            finalTotal: finalCartTotal,
            discount,
            message: `Coupon applied successfully! ₹${discount.toFixed(2)} off.`,
        });
    } catch (error) {
        console.error("Error in applying coupon:", error);
        res.status(500).json({ success: false, message: "Server error while applying coupon." });
    }
};

const removeCoupon = async (req, res) => {
    try {
        // Clear the session discount
        req.session.discount = null;
        return res.status(200).json({
            success: true,
            message: "Coupon removed successfully!",
        });
    } catch (error) {
        console.error("Error in removing coupon:", error);
        res.status(500).json({ success: false, message: "Server error while removing coupon." });
    }
};

module.exports = {
    applyCoupon,
    removeCoupon
};