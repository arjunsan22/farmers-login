const Product= require('../../models/productModel');
const Category= require('../../models/categoryModel');
const User = require('../../models/userModel');
const path = require('path');
const sharp = require('sharp');
const PriceChart = require('../../models/chartModel'); // Add this at the top if not already


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
       

    const images=[];
   
    
    if (req.files && req.files.length > 0) {
        for (let i = 0; i < req.files.length; i++) {
            const originalImagePath = req.files[i].path; // input path//
            const resizedImagePath = path.join('public/uploads/product-images', `resized-${req.files[i].filename}`); // output path//
    
            // resize the image and save itin a different file//
            await sharp(originalImagePath)
                .resize({ width: 440, height: 400 })
                .toFile(resizedImagePath);
    
            images.push(`resized-${req.files[i].filename}`); // Save resized filename
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
        const { productName, description, tag, category, regularPrice, salePrice, quantity, unit, unitStep } = req.body;
        const categoryDoc = await Category.findById(category);
        if (!categoryDoc) {
            return res.status(400).json({ error: "Invalid category selected." });
        }

        const chart = await PriceChart.findOne({
            category: categoryDoc.name,
            product: productName
        });

        if (chart && Number(salePrice) > chart.minPrice) {
            return res.status(400).json({
                error: `Maximum price for ${categoryDoc.name} - ${productName} is ₹${chart.minPrice} ,so you cannot set a price higher than this.`
            });
        }

        await Product.findOneAndUpdate(
            { _id: id, userId: req.session.user },
            {
                productname: productName,
                description,
                tag,
                category: categoryDoc._id,
                mainPrice: regularPrice,
                salePrice,
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

module.exports = {
    listProducts,
    loadAddProductPage,
    addProduct,
    editProduct,
    toggleBlockProduct,
};