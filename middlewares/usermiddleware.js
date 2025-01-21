const User=require('../models/userModel')

const isLogin = (req, res, next) => {
    if (req.session.user) {
      return res.redirect('/') }
    else{
        next();
    }
  };
  
  
  const isLogout = (req, res, next) => {
    try {
      if (!req.session.user) {
        console.log("No session found. Redirecting to login.");
        return res.redirect('/login');
      }
  
      // Check if the user is blocked directly from session data
      if (req.session.user.isBlocked) {
        console.log("User is blocked by admin.");
        req.session.destroy(() => {
          return res.redirect('/login',{message});
        });
      } else {
        console.log("User is valid. Proceeding to next middleware.");
        next();
      }
    } catch (error) {
      console.error("Error in isLogout middleware:", error.message);
      res.status(500).send("Internal Server Error");
    }
  };
  
  



  
  module.exports = {
    isLogin,
    isLogout,
  };
  