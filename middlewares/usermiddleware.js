
const isLogin = (req, res, next) => {
    if (req.session.user) {
      return res.redirect('/') }
    else{
        next();
    }
  };
  
  
  
  
  
  const isLogout = (req, res, next) => {
    if (!req.session.user) {
      return res.redirect('/login');
    }
    next();
  };
  



  
  module.exports = {
    isLogin,
    isLogout,
  };
  