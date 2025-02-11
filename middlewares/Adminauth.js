
const isLogin = async (req, res, next) => {
    try {
        if (req.session.user_id) {
 next();
        } else {
        res.redirect('/admin/login');    
        }
    } catch (error) {
        console.log("Error in isLogout:", error.message);
    }
};

module.exports = {
    
    isLogin
};
