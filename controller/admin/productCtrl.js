const User = require("../../models/userModel");
const Product=require('../../models/productModel')
const Category=require('../../models/categoryModel')
const fs=require('fs')
const path=require('path')
const sharp=require('sharp')


const loadproductaddPage=async (req,res) => {
 
    try {
        const category=await Category.find({isListed:true})
        console.log(" The category :", category)
        res.render('Addproduct',{category});
        
    } catch (error) {
        
        res.redirect('/error')
    }   
}
//                          //
const addProducts=async (req,res) => {
    try {
        const products=req.body;
        const productExists=await Product.findOne({
            productname:products.productName //check here correctly mongooes name//
          // productname: { $regex: new RegExp(`^${products.productName}$`, 'i') 
        })
if(!productExists){
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
    
    const categoryId=await Category.findOne({name:products.category})

    if(!categoryId){
        return res.status(400).join("Invalid category name")
    }

    const newProduct=new Product({
        productname:products.productName,
        description:products.description,
        category:categoryId._id,
        offer:products.offer,
        mainPrice:products.regularPrice,
        salePrice:products.salePrice,

        
        
        //saleprice
        createdOn:new Date(),
        quantity:products.quantity,
        tag:products.tag,
        productImage:images,      
        status:'available'     


    })
await newProduct.save();

return res.redirect('/admin/addproducts?success=true')

    }
    else{
        return res.status(400).json("Product already exists , Please try with another name")
    }
    } catch (error) {
        console.error("Error saving product",error)
return res.redirect('/admin/error')        
    }
    
}
//              //
const loadProductPage=async (req,res) => {
    try {
        const search =req.query.search || "";
        const page=req.query.page || 1;
        const limit=4;

        const productData=await Product.find({

            $or:[
                {productname:{$regex:new RegExp(".*"+search+".*","i")}}
            ]
        }).limit(limit*1).skip((page-1)*limit).populate('category').exec();
        
        const count = await Product.find({
            $or:[
                {productname:{$regex:new RegExp(".*"+search+".*","i")}}

            ]
        }).countDocuments();

        const category= await Category.find({isListed:true})

        if(category){
            res.render('product',{
               data:productData ,
               currentPage:page,
               totalPages:Math.ceil(count / limit),
                cat:category,
            })
        }else{
            res.render('error')
        }
  } 
  catch (error) {
          res.redirect('/error')
        console.log(error)
    }
}

//              //
const BlockProduct=async (req,res) => {
    try {
        let id=req.query.id;
        await Product.updateOne({_id:id},{$set:{isblocked:true}})
    res.redirect('/admin/products')
    } catch (error) {
    res.redirect('/admin/error')        
    }
}
//                  //
const UnblockProduct=async (req,res) => {
    try {
        let id=req.query.id;
        await Product.updateOne({_id:id},{$set:{isblocked:false}})
    res.redirect('/admin/products')
        } catch (error) {
            res.redirect('/admin/error')  
        }
}
//              //
const  EditProducts= async (req, res) => {
    try {
        const id = req.query.id;

        const product = await Product.findOne({ _id: id }).populate('category');
        const category = await Category.find({});
          console.log('Product:', product);
        console.log('Product Category:', product.category);
        res.render('Editproduct', {
            product: product,
            category: category
        });
    } catch (error) {
        console.error(error);

        res.redirect('/admin/error');
    }
};



const updateProduct = async (req, res) => {
    try {
        const id = req.params.id;
  console.log("this is coming id:",id)
        const data = req.body;
 // Ensure that category is an ObjectId (if you're sending category name, look it up)
//  const category = await Category.findOne({ name: data.category });

//  if (!category) {
     
//     return res.status(400).json({ error: "Category not found" });
 
//     }
       const existingProduct = await Product.findOne({
            productname: data.productName,
            _id: { $ne: id }
        });

        if (existingProduct) {
            return res.status(400).json({ error: "Product with this name already exists. Please try another name." });
        }

        const images = [];
        if (req.files && req.files.length > 0) {
            for (let i = 0; i < req.files.length; i++) {
                images.push(req.files[i].filename);
            }
        }

        const updateFields = {
            productname: data.productName,
            description: data.description,
            category: data.category,
            mainPrice: data.regularPrice,
            salePrice:data.salePrice,
            quantity: data.quantity,
            tag: data.tag
        };

        if (images.length > 0) {
            updateFields.$push = { productImage: { $each: images } };
        }

        let result=await Product.findByIdAndUpdate(id, updateFields, { new: true });
        console.log(result)
        res.redirect('/admin/products');
    } catch (error) {
        console.error(error);
        res.redirect('/admin/error');
    }
};

const deleteSingleImage=async (req,res) => {

    try {
        const {imageNameToServer,productIdToServer}=req.body
        
        console.log('controller: Image Name:', imageNameToServer);  // Debug
        console.log('controller: Product ID:', productIdToServer);
        const product=await Product.findByIdAndUpdate(productIdToServer,{$pull:{productImage:imageNameToServer}});
        const imagePath=path.join("public","uploads","product-images",imageNameToServer)

        if(fs.existsSync(imagePath)){
            await fs.unlinkSync(imagePath)
            console.log(`Image ${imageNameToServer} deleted successfully`)

        }else{
            console.log(`Image ${imageNameToServer} not found`)
        }
  res.send({status:true});

    } catch (error) {
    
        res.redirect('/admin/error')
    }
}

const addProductOffer = async (req, res) => {
    try {
        const { productId, percentage } = req.body;

        const findProduct = await Product.findOne({ _id: productId });
        const findCategory = await Category.findOne({ _id: findProduct.category });

        // Checking if the category offer is greater than the product offer //
        if (findCategory.categoryOffer) {
            return res.json({ status: false, message: "This product's category already has a category offer! At a time only one offer is allowed " });
        }

        findProduct.salePrice = findProduct.salePrice - Math.floor(findProduct.mainPrice * (percentage / 100));

        // Update the product offer////
        findProduct.productOffer = parseInt(percentage);
        await findProduct.save();

        // Reset category offer to 0///
        findCategory.categoryOffer = 0;
        await findCategory.save();

        // Send success response
        return res.json({ status: true });

    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({ status: false, message: "Internal Server Error" });
    }
};


const removeProductOffer = async (req, res) => {
    try {
        const { productId } = req.body;
        const findProduct = await Product.findOne({ _id: productId });

        if (!findProduct) {
            return res.status(404).json({ status: false, message: "Product not found" });
        }

        //checking salePrice and regularPrice are valid numbers//
        const regularPrice = findProduct.mainPrice || 0;
        const percentage = findProduct.productOffer || 0;

        findProduct.salePrice = regularPrice;

        findProduct.productOffer = 0;

        await findProduct.save();
        res.json({ status: true });

    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ status: false, message: "Internal Server Error" });
    }
};



module.exports={
    
    loadproductaddPage,
    addProducts,
    loadProductPage,
    BlockProduct,
    UnblockProduct,
    EditProducts,
    updateProduct,
    deleteSingleImage,
    addProductOffer,
    removeProductOffer

}