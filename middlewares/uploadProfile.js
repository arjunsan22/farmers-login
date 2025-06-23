const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

// Storage for profile images and certificates
const profileStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        let folder = 'profile-images';
        if (file.fieldname === 'certificate') {
            folder = 'certificates';
        }
        return {
            folder: folder,
            allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
            public_id: Date.now() + '-' + file.originalname.split('.')[0]
        };
    }
});
const upload = multer({ storage: profileStorage });

// Storage for product images
const productStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'product-images',
        allowed_formats: ['jpg', 'jpeg', 'png'],
        transformation: [{ width: 440, height: 400, crop: 'limit' }]
    }
});
const uploadProductImages = multer({ storage: productStorage });

module.exports = {
    upload,
    uploadProductImages
};