const User = require("../../models/userModel");
const PriceChart = require("../../models/chartModel"); // <-- import your price chart model
const Category = require('../../models/categoryModel');
const Product = require('../../models/productModel'); // Add this line

const farmerList = async (req, res) => {
    try {
        const farmers = await User.find({ isFarmerApplyed: true });
        const charts = await PriceChart.find({}); // <-- fetch all price charts
      const categories = await Category.find({});
        res.render('adminApproval', { farmers, charts,categories }); // <-- pass charts to EJS
    } catch (error) {
        console.log(error.message);
        res.redirect('/error');
    }
};

const approveFarmer = async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.params.id, { isVerified: true });
        res.redirect('/admin/farmerList');
    } catch (error) {
        console.log(error.message);
        res.redirect('/error');
    }
};

const rejectFarmer = async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.params.id, { isVerified: false });
        res.redirect('/admin/farmerList');
    } catch (error) {
        console.log(error.message);
        res.redirect('/error');
    }
};
//chart
const addOrUpdatePrice = async (req, res) => {
    const { category, product, minPrice } = req.body;
    await PriceChart.findOneAndUpdate(
        { category, product },
        { minPrice },
        { upsert: true }
    );
    res.redirect('/admin/farmerList');
};
//PriceChart
const editPrice = async (req, res) => {
    const { category, product, minPrice } = req.body;
    await PriceChart.findByIdAndUpdate(req.params.id, { category, product, minPrice });
    res.redirect('/admin/farmerList');
};

const loadProductApprovals = async (req, res) => {
    try {
        // Only get products that have a userId (farmer products) and pending status
        const pendingProducts = await Product.find({
            'adminApproval.status': 'pending',
            'userId': { $exists: true, $ne: null } // Add this line
        }).populate('category').populate('userId', 'firstname lastname farmName');

        const approvedProducts = await Product.find({
            'adminApproval.status': 'approved',
            'userId': { $exists: true, $ne: null } // Add this line
        }).populate('category').populate('userId', 'firstname lastname farmName');


        res.render('productApprovals', { pendingProducts, approvedProducts });
    } catch (error) {
        console.error(error);
        res.redirect('/admin/error');
    }
};


// Approve product
const approveProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { adminPrice } = req.body;

        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Update product status and admin price
        product.adminApproval.status = 'approved';
        product.adminApproval.reviewedAt = new Date();

        if (!product.adminPrice) {
            product.adminPrice = product.salePrice;
        }
        await product.save();

        res.status(200).json({ 
            success: true, 
            message: 'Product approved successfully!',
            product
        });
    } catch (error) {
        console.error('Error in approveProduct:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Reject product
const rejectProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { message } = req.body;

        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        product.adminApproval.status = 'rejected';
        product.adminApproval.message = message || 'Product did not meet our requirements';
        product.adminApproval.reviewedAt = new Date();
        
        await product.save();

        res.status(200).json({ 
            success: true, 
            message: 'Product rejected successfully!',
            product
        });
    } catch (error) {
        console.error('Error in rejectProduct:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Update product price
const updateProductPrice = async (req, res) => {
    try {
        const { id } = req.params;
        const { adminPrice } = req.body;

        if (!adminPrice || isNaN(adminPrice) || adminPrice < 0) {
            return res.status(400).json({ 
                error: 'Please provide a valid price' 
            });
        }


        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Ensure admin price is not less than farmer's price
        if (Number(adminPrice) < product.salePrice) {
            return res.status(400).json({ 
                error: 'Admin price cannot be less than farmer\'s price' 
            });
        }

        product.adminCommission = (adminPrice - product.salePrice)
        product.adminPrice = adminPrice;
        console.log('adminprice :',adminPrice)
        console.log('old saleprice :',product.salePrice)
        product.salePrice = adminPrice; // Update sale price to admin price
        console.log('saleprice uppdated :',product.salePrice)
        await product.save();

        res.status(200).json({
            success: true, 
            message: 'Price updated successfully',
            product
        });
    } catch (error) {
        console.error('Error in updateProductPrice:', error);
        res.status(500).json({ error: 'Server error' });
    }
};


module.exports = {
    farmerList,
    approveFarmer,
    rejectFarmer,
    addOrUpdatePrice,
    editPrice,
    loadProductApprovals,
    approveProduct,
    rejectProduct,
    updateProductPrice,
  
};