const express=require('express');
const adminController = require('../controller/admin/adminCtrl');
const router=express.Router()
const middle=require('../middlewares/Adminauth')
const customerController = require('../controller/admin/customerController');
const categoryContoller=require('../controller/admin/categoryCtrl')
const productContoller=require('../controller/admin/productCtrl') 
const multer=require('multer')
const path = require('path');
const orderController=require('../controller/admin/adminOrderController')
const blogController = require('../controller/admin/blogController');
const farmerController = require('../controller/admin/farmerController');
//multer setupp//for easy i store admin//
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/product-images');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const uploads = multer({ storage: storage });
// Configure multer for blog images
const blogStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/blog-images');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const blogUploads = multer({ storage: blogStorage });

//routes -admin
router.get('/login',adminController.loadLogin)

router.get('/error',adminController.errorPage)


router.post('/login',adminController.verifyadmin)
router.get('/',middle.isLogin,adminController.loadDashboard)//dashboard//


//user/custoomer management//
router.get('/users',middle.isLogin,customerController.customerInfo)
router.get('/blockCustomer',adminController.blockUser)
router.get('/unblockCustomer',adminController.unblockUser)

//category management//
router.get('/category',categoryContoller.loadcategoryPage)
router.post('/addCategory',categoryContoller.addCategory)
router.get('/listCategory',categoryContoller.listedCategory)

router.get('/unlistCategory',categoryContoller.unlistedCategory)

router.get('/editCategory',middle.isLogin,categoryContoller.editCategory)// to get category page//
router.post('/modifyCategory/:id',categoryContoller.updateCategory) //edit category//


router.post('/addCategoryOffer',categoryContoller.addOffer)
router.post('/removeCategoryOffer',categoryContoller.removeOffer)


//product management//
router.get('/products',middle.isLogin,productContoller.loadProductPage)
router.get('/addproducts',middle.isLogin,productContoller.loadproductaddPage)
router.post('/addProducts',uploads.array("images",4),productContoller.addProducts);

router.get('/productBlock',productContoller.BlockProduct)
router.get('/productUnblock',productContoller.UnblockProduct)
router.get('/productEdits',middle.isLogin,productContoller.EditProducts)

router.post('/productEdits/:id',uploads.array("images",4),productContoller.updateProduct)
router.post('/deleteImage',productContoller.deleteSingleImage)

router.post('/addProductOffer',productContoller.addProductOffer)

router.post('/removeProductOffer',productContoller.removeProductOffer)

//order management//

router.get('/orders',middle.isLogin,orderController.getAllOrders)
router.post('/orders/update-status/:orderId',orderController.updateStatus)




//coupon management//

router.get('/coupons',middle.isLogin,adminController.getCoupons);
router.get('/addCoupons',middle.isLogin,adminController.getaddCoupon);
router.post('/addCoupon', adminController.addCoupon);
router.post('/couponStatus/:couponId', adminController.couponStatus);


//sales reports//

router.post('/generate-report', adminController.generateSalesReport);


//farmers list route

router.get('/farmerList',farmerController.farmerList)
router.post('/farmer/:id/approve', farmerController.approveFarmer);
router.post('/farmer/:id/reject', farmerController.rejectFarmer);
//price chart
router.post('/price-chart/add', farmerController.addOrUpdatePrice);
router.post('/price-chart/:id/edit', farmerController.editPrice);
//users product approve
router.get('/product-approvals', farmerController.loadProductApprovals);
router.post('/product/approve/:id', farmerController.approveProduct);
router.post('/product/reject/:id', farmerController.rejectProduct);
router.post('/product/update-price/:id', farmerController.updateProductPrice);

// Blog routes
router.get('/add-blog',middle.isLogin, blogController.loadAddBlogPage);
router.post('/add-blog', blogUploads.fields([{ name: 'picture', maxCount: 1 },{ name: 'pictureGallery', maxCount: 5 }
]), blogController.addBlog);
router.get('/blogs',middle.isLogin, blogController.loadBlogs);
router.post('/delete-blog/:id', blogController.deleteBlog);

//logout//
router.get('/logout',adminController.Logout)

module.exports=router