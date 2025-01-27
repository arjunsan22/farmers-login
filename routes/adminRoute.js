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


//routes -admin
router.get('/login',adminController.loadLogin)

router.get('/error',adminController.errorPage)


router.post('/login',adminController.verifyadmin)
router.get('/',adminController.loadDashboard)//dashboard//


//user/custoomer management//
router.get('/users',customerController.customerInfo)
router.get('/blockCustomer',adminController.blockUser)
router.get('/unblockCustomer',adminController.unblockUser)

//category management//
router.get('/category',categoryContoller.loadcategoryPage)
router.post('/addCategory',categoryContoller.addCategory)
router.get('/listCategory',categoryContoller.listedCategory)

router.get('/unlistCategory',categoryContoller.unlistedCategory)

router.get('/editCategory',categoryContoller.editCategory)// to get category page//
router.post('/modifyCategory/:id',categoryContoller.updateCategory) //edit category//

router.post('/addCategoryOffer',categoryContoller.addOffer)
router.post('/removeCategoryOffer',categoryContoller.removeOffer)



//product management//
router.get('/products',productContoller.loadProductPage)
router.get('/addproducts',productContoller.loadproductaddPage)
router.post('/addProducts',uploads.array("images",4),productContoller.addProducts);
router.get('/productBlock',productContoller.BlockProduct)
router.get('/productUnblock',productContoller.UnblockProduct)
router.get('/productEdits',productContoller.EditProducts)

router.post('/productEdits/:id',uploads.array("images",4),productContoller.updateProduct)
router.post('/deleteImage',productContoller.deleteSingleImage)

router.post('/addProductOffer',productContoller.addProductOffer)

router.post('/removeProductOffer',productContoller.removeProductOffer)

//order management//

router.get('/orders',orderController.getAllOrders)
router.post('/orders/update-status/:orderId',orderController.updateStatus)




//coupon management//

router.get('/coupons', adminController.getCoupons);
router.get('/addCoupons', adminController.getaddCoupon);
router.post('/addCoupon', adminController.addCoupon);



router.get('/logout',adminController.Logout)

module.exports=router