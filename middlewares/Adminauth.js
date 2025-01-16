// const isLogin = async (req, res, next) => {
//     try {
//         if (req.session.user_id) {
//             next(); 
//         } else {
//             res.redirect('/admin/login'); // **********************Redirect to the login page if not logged in
//         }
//     } catch (error) {
//         console.log("Error in isLogin:", error.message);
//     }
// };

const isLogout = async (req, res, next) => {
    try {
        if (req.session.user_id) {
            res.redirect('/'); // ************************Redirect to the home page if already logged in
        } else {
            next(); }
    } catch (error) {
        console.log("Error in isLogout:", error.message);
    }
};

module.exports = {
    // isLogin,
    isLogout
};
