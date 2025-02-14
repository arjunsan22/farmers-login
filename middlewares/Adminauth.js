const isLogin = async (req, res, next) => {
    try {
      console.log("Checking admin login status");
      if (req.session.admin) {
        console.log("Admin is logged in");
        next();
      } else {
        console.log("Admin is not logged in, redirecting to login page");
        res.redirect('/admin/login');
      }
    } catch (error) {
      console.log("Error in isLogin:", error.message);
      res.redirect('/admin/login');
    }
  };
  
  module.exports = {
    isLogin,
  };