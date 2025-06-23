const Product= require('../../models/productModel');
const Category= require('../../models/categoryModel');
const User = require('../../models/userModel');
const path = require('path');
const sharp = require('sharp');
const PriceChart = require('../../models/chartModel'); // Add this at the top if not already
const Order = require('../../models/orderModel'); // Assuming you have an Order model

const listProducts = async (req, res) => {
    try {
        const userId = req.session.user;
        const userData = await User.findById(userId);
        const products = await Product.find({ 
            userId: userId
        }).populate('category');

        // Group products by approval status
        const approvedProducts = products.filter(p => p.adminApproval.status === 'approved');
        const pendingProducts = products.filter(p => p.adminApproval.status === 'pending');
        const rejectedProducts = products.filter(p => p.adminApproval.status === 'rejected');

        const categories = await Category.find({});

        res.render('myProducts', { 
            products: products,
            approvedProducts,
            pendingProducts,
            rejectedProducts,
            user: userData,
            categories 
        });
    } catch (error) {
        console.error(error);
        res.redirect('/pagenotfound');
    }
};

const loadAddProductPage = async (req, res) => {
    try{
    const userId = req.session.user;
    const userData = await User.findById(userId);
    const categories = await Category.find({});
    res.render('addUserProduct', { categories,user:userData });
    }
    catch (error) {
        console.error(error);
        res.redirect('/pagenotfound');
    }
};


const addProduct=async (req,res) => {
    try {
        const products=req.body;
       

   const images = [];
if (req.files && req.files.length > 0) {
    for (let i = 0; i < req.files.length; i++) {
        images.push(req.files[i].path); // Cloudinary URL
    }
}
    
         const categoryId = await Category.findById(products.category);
        if (!categoryId) {
            return res.status(400).json({ error: "Invalid category" });
        }

        // 2. Find the minimum price from the chart
        const chart = await PriceChart.findOne({
            category: categoryId.name,
            product: products.productName
        });

        if (chart && Number(products.salePrice) > chart.minPrice) {
            // If price is less than minimum, show error
            return res.status(400).json({error:`Maximum price for ${categoryId.name} - ${products.productName} is ₹${chart.minPrice} ,so you cannot set a price higher than this.`});
        }

    const newProduct=new Product({
        productname:products.productName,
        description:products.description,
        category:categoryId._id,
        mainPrice:products.regularPrice,
        salePrice:products.salePrice,
        usersPrice:products.salePrice, // Assuming usersPrice is same as salePrice
        unit:products.unit,
        unitStep:products.unitStep, 
        userId: req.session.user,
        //saleprice
        createdOn:new Date(),
        quantity:products.quantity,
        tag:products.tag,
        productImage:images,      
        status:'available'     ,
        adminApproval: {
                status: 'pending',
                message: null
            }

    })
await newProduct.save();

 return res.status(200).json({
            success: true,
            message: 'Product submitted successfully and waiting for admin approval'
        });    
    } catch (error) {
        console.error("Error saving product",error)
return res.redirect('/pagenotfound');        
    }
    
}

const editProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { productName, description, tag, category, quantity, unit, unitStep } = req.body;
        const categoryDoc = await Category.findById(category);
        if (!categoryDoc) {
            return res.status(400).json({ error: "Invalid category selected." });
        }

        const chart = await PriceChart.findOne({
            category: categoryDoc.name,
            product: productName
        });

        await Product.findOneAndUpdate(
            { _id: id, userId: req.session.user },
            {
                productname: productName,
                description,
                tag,
                category: categoryDoc._id,
                quantity,
                unit,
                unitStep
            }
        );
        res.status(200).json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
};

const toggleBlockProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findOne({ _id: id, userId: req.session.user });
        if (!product) return res.redirect('/my-products');
        product.isblocked = !product.isblocked;
        await product.save();
        res.redirect('/my-products');
    } catch (error) {
        console.error(error);
        res.redirect('/pagenotfound');
    }
};

const getFarmerOrders = async (req, res) => {
    try {
        const userId = req.session.user;
        const userData = await User.findById(userId);

        const { search, dateRange, sort, page = 1, limit = 10 } = req.query;

        let query = {
            // Find orders containing products owned by this farmer
            'orderedItems.product': {
                $in: await Product.find({ userId: userId }).distinct('_id')
            }
        };

        let sortOption = { createdOn: -1 };

        if (search) {
            const searchRegex = new RegExp(search, 'i');
            query.$or = [
                { orderId: searchRegex },
                { 'userId.firstname': searchRegex },
                { 'userId.lastname': searchRegex }
            ];
        }

        if (dateRange) {
            const [startDate, endDate] = dateRange.split(' - ').map(date => new Date(date));
            query.createdOn = { $gte: startDate, $lte: endDate };
        }

        if (sort) {
            const [field, order] = sort.split('_');
            sortOption = { [field]: order === 'asc' ? 1 : -1 };
        }

        const orders = await Order.find(query)
            .populate('userId', 'firstname lastname email phone')
            .populate('orderedItems.product')
            .populate('address')
            .sort(sortOption)
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const totalOrders = await Order.countDocuments(query);
        const totalPages = Math.ceil(totalOrders / limit);

        res.render('farmerOrders', { 
            orders, 
            totalPages, 
            currentPage: parseInt(page), 
            limit: parseInt(limit) ,
            user: userData,
        });
    } catch (error) {
        console.error('Error fetching farmer orders:', error);
        res.status(500).send('Error fetching orders');
    }
};

const updateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { Status } = req.body;
        const userId = req.session.user;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Verify this farmer owns the products in this order
        const productIds = order.orderedItems.map(item => item.product.toString());
        const ownedProducts = await Product.find({
            _id: { $in: productIds },
            userId: userId
        });

        if (ownedProducts.length === 0) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        // Define valid status progressions for farmer/user
       // In userProductController.js
const statusProgression = {
    'pending': ['processing', 'shipping'],     // Allow both transitions
    'processing': ['shipping', 'delivered'],   // More flexible progression
    'shipping': ['delivered'],
     'delivered': ['return request'],           // Changed to match enum value
    'return request': ['returned'],           // Changed to match enum value
    'returned': [],
    'cancelled': [],
    'payment_pending': []
};

        // Check if the status update is valid
        const validNextStatuses = statusProgression[order.Status] || [];
        if (!validNextStatuses.includes(Status)) {
            return res.status(400).json({
                error: `Invalid status update. Cannot change from ${order.Status} to ${Status}`
            });
        }

        const updateData = { Status };
        if (Status === 'delivered') {
            updateData.deliveryDate = new Date();
        }

        await Order.findByIdAndUpdate(orderId, updateData, { new: true });
        
        res.status(200).json({ 
            success: true,
            message: `Order status updated to ${Status}`
        });

    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ 
            error: 'Error updating order status',
            details: error.message 
        });
    }
};


const getPriceChart = async (req, res) => {
    try {
        const priceChart = await PriceChart.find({}).sort({ category: 1, product: 1 });
        
        res.json({
            success: true,
            priceChart
        });
    } catch (error) {
        console.error('Error fetching price chart:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch price chart'
        });
    }
};


module.exports = {
    listProducts,
    loadAddProductPage,
    addProduct,
    editProduct,
    toggleBlockProduct,
    getFarmerOrders,
    updateOrderStatus,
    getPriceChart

};