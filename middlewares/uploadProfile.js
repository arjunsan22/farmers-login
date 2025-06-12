
// const multer = require('multer');
// const path = require('path');
// const fs = require('fs');

// // Profile image storage
// const profileImagePath = 'public/uploads/profile-images/';
// if (!fs.existsSync(profileImagePath)){
//     fs.mkdirSync(profileImagePath, { recursive: true });
// }
// const profileStorage = multer.diskStorage({
//     destination: function(req, file, cb) {
//         cb(null, profileImagePath);
//     },
//     filename: function(req, file, cb) {
//         cb(null, Date.now() + path.extname(file.originalname));
//     }
// });
// const upload = multer({ storage: profileStorage });

// // Certificate storage
// const certificatePath = 'public/uploads/certificates/';
// if (!fs.existsSync(certificatePath)){
//     fs.mkdirSync(certificatePath, { recursive: true });
// }
// const certificateStorage = multer.diskStorage({
//     destination: function(req, file, cb) {
//         cb(null, certificatePath);
//     },
//     filename: function(req, file, cb) {
//         cb(null, Date.now() + path.extname(file.originalname));
//     }
// });
// const uploadCertificate = multer({ storage: certificateStorage });

// module.exports = {
//     upload,
//     uploadCertificate,
// };
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        let uploadPath;
        if (file.fieldname === 'userImage') {
            uploadPath = 'public/uploads/profile-images/';
        } else if (file.fieldname === 'certificate') {
            uploadPath = 'public/uploads/certificates/';
        }
        if (!fs.existsSync(uploadPath)){
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: function(req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

module.exports = upload;