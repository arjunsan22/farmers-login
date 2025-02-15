// const User = require("../../models/userModel");
const Product=require('../../models/productModel')
const Category=require('../../models/categoryModel');
const { findOne } = require('../../models/userModel');

const loadcategoryPage=async (req,res) => {
    try {
        let page=Math.max(parseInt(req.query.page) || 1, 1);
        const limit=4;
        const skip=(page - 1)*limit;

        const categoryData=await Category.find({})
        .sort({createdAt:-1})
        .skip(skip)
        .limit(limit);

        const totalCategories=await Category.countDocuments()
        const totalPages=Math.ceil(totalCategories/limit)

         res.render('category',{
            cat:categoryData,
            currentPage:page,
            totalPages:totalPages,
            totalCategories:totalCategories
         })
         
    } catch (error) {
        console.error(error);
        res.redirect('/error')
    }
}


const addCategory=async (req,res) => {
  
    const {name,description}=req.body;
    
    try {
        const existingCategory = await Category.findOne({ 
            name: { $regex: new RegExp(`^${name}$`, 'i') } 
        });
        if(existingCategory){
        return res.status(400).json({error:"Category Already Exists"})
    }
    const newCategory=new Category({ name,description })    
    await newCategory.save();
return res.status(200).json({ message: "Category Added Successfully" });
    // res.redirect('/admin/category');
    } catch (error) {
        return res.status(500).json({error:"Internal Server Error"})
  
    }
}

const listedCategory=async (req,res) => {
    try {

        let id =req.query.id;
        console.log("id of :",id)
       let result= await Category.updateOne({_id:id},{$set:{isListed:true}});
console.log(result)
       res.redirect('/admin/category')


    } catch (error) {
        res.redirect('/error')
    }    
    }


    
    const unlistedCategory=async (req,res) => {
        try {
            let id =req.query.id;
            
         let result=   await Category.updateOne({_id:id},{$set:{isListed:false}});
         console.log(result)  
         res.redirect('/admin/category')
    
            
        } catch (error) {
            res.redirect('/error')
        
        }

        }
        const editCategory=async (req,res) => {
            try {
                let id =req.query.id;
             let category =   await Category.findOne({_id:id})
             console.log(category)  
             res.render('Editcategory',{category:category})
        
                
            } catch (error) {
                res.redirect('/error')
            
            }    
            }
    




const updateCategory=async (req,res) => {

    try {
        const id=req.params.id;
        const {categoryname ,description}=req.body
        
    //     console.log("Category ID:", id);
    // console.log("New Category Name:", categoryname);

const existingCategory=await Category.findOne({name:categoryname})
        if(existingCategory){
            return res.status(400).json({error:"category exists,please choose another name"})
        }
const updateCategory=await Category.findByIdAndUpdate(id,{name: categoryname ,description:description}, { new: true })

if(updateCategory){
    res.redirect('/admin/category')
}
else{
    res.status(404).json({error:"Category not found"})
}


    } catch (error) {
        console.error("Error during update:", error);
        res.status(500).json({error:"Internal Server Error"})
    }
}


const addOffer = async (req, res) => {
    try {
        const percentage = Number(req.body.percentage);
        const categoryId = req.body.categoryId;

        if (isNaN(percentage) || percentage <= 0 || percentage > 100) {
            return res.status(400).json({ status: false, message: "Invalid percentage value" });
        }

        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(400).json({ status: false, message: "Category not found" });
        }

        const products = await Product.find({ category: category._id });

        if (products.length === 0) {
            return res.json({ status: false, message: "No products found in this category" });
        }

        const hasProductOffer = products.some(product => product.productOffer > percentage);

        if (hasProductOffer) {
            return res.json({ status: false, message: "Product within this category already have product offers otherwise only takes higher percentage" });
        }
console.log(hasProductOffer)
       let r= await Category.updateOne({ _id: categoryId }, { $set: { categoryOffer: percentage } });
console.log("checked:",r)
        for (const product of products) {
            if (product.mainPrice) {
                console.log("Processing product:", product.productname);
                console.log("Before Update - Sale Price:", product.salePrice);

                product.productOffer = 0;
                product.salePrice = Math.floor(product.mainPrice * (1 - percentage / 100));

                console.log("After Update - Sale Price:", product.salePrice);

                await product.save();
                console.log("Product saved successfully:", product.productname);
            }
        }

        res.json({ status: true });
    } catch (error) {
        console.error("Error in addOffer:", error);
        res.status(500).json({ status: false, message: "Internal Server Error" });
    }
};


const removeOffer = async (req, res) => {
    try {
        const categoryId = req.body.categoryId;
        const category = await Category.findById(categoryId);

        if (!category) {
            return res.status(404).json({ status: false, message: "Category not found" });
        }

        const percentage = category.categoryOffer;
        const products = await Product.find({ category: category._id });

        if (products.length > 0) {
            for (const product of products) {
                // Reset salePrice to mainPrice when removing the offer
                product.salePrice = product.mainPrice;
                product.productOffer = 0;
                await product.save();
            }
        }

        // Reset category offer
        category.categoryOffer = 0;
        await category.save();

        res.json({ status: true });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ status: false, message: "Internal Server Error" });
    }
};


module.exports={
    loadcategoryPage,
    addCategory,
    listedCategory,
    unlistedCategory,
    editCategory,
    updateCategory,
    addOffer,
    removeOffer
}