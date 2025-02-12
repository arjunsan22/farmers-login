const Coupon = require('../../models/couponModel');
const Cart = require('../../models/cartModel');

const applyCoupon = async (req, res) => {
    try {
        const { couponCode } = req.body;
        const userId = req.session.user;

      
        if (!userId) {
            return res.status(401).json({ success: false, message: "User not authenticated." });
        }

       
        const cart = await Cart.findOne({ userId });
        if (!cart) {
            return res.status(400).json({ success: false, message: "Cart not found." });
        }

        if (cart.items.length === 0) {
            return res.status(400).json({ success: false, message: "Your cart is empty." });
        }

        const coupon = await Coupon.findOne({ couponCode, isActive: true });
        if (!coupon) {
            return res.status(404).json({ success: false, message: "Invalid or expired coupon." });
        }
    console.log("coupen:",coupon)
        
        const now = new Date();
        if (now < coupon.startOn || now > coupon.expireOn) {
            return res.status(400).json({ success: false, message: "Coupon not valid at this time." });
        }


       
        const cartTotal = cart.items.reduce((sum, item) => sum + item.totalPrice, 0);
    console.log("cartTotal :",cartTotal)
       
        if (cartTotal < coupon.minimumPrice) {
            return res.status(400).json({
                success: false,
                message: `Minimum purchase of ₹${coupon.minimumPrice} is required.`,
            });
        }

        // checking the usage count of the user to send limit message//
        const userUsage = coupon.userUsage.find(usage => usage.userId.toString() === userId.toString());
        if (userUsage && userUsage.usageCount >= coupon.usageLimit) {
            return res.status(400).json({
                success: false,
                message: `The coupon usage limit is ${coupon.usageLimit}. You have already used the coupon ${userUsage.usageCount} times.`,
            });
        }

        const discount = Math.min(coupon.offerPrice, cartTotal);
        const finalCartTotal = cartTotal - discount;
        console.log("finalCartTotal :",finalCartTotal)
      
        req.session.couponApplied = {
            code: couponCode,
            discount: discount,
            originalTotal: cartTotal,
            finalTotal: finalCartTotal
        };

       // updating the usage count of the user by 1 and check user only applyed coupon one time//
       if (userUsage && userUsage.usageCount === 1) {
        userUsage.usageCount += 1;
    } else {
        coupon.userUsage.push({ userId, usageCount: 1 });
    }
    console.log("count of coupon applyed :",userUsage)
    
    await coupon.save();

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
////////////////////////////////REMOVE COUPON//////////////////////////////////////////
const removeCoupon = async (req, res) => {
    try {
        const { couponCode } = req.body;
        const userId = req.session.user;
console.log("for remove coupon code:",couponCode)
        if (!userId) {
            return res.status(401).json({ success: false, message: "User not authenticated." });
        }

        const coupon = await Coupon.findOne({ couponCode, isActive: true });
        if (!coupon) {
            return res.status(404).json({ success: false, message: "Invalid or expired coupon." });
        }

        const userUsage = coupon.userUsage.find(usage => usage.userId.toString() === userId.toString());
        if (userUsage && userUsage.usageCount > 0) {
            userUsage.usageCount -= 1;
        }

        await coupon.save();
console.log("after remove coupon",userUsage)
req.session.couponApplied = null;
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