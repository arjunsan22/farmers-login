const Razorpay = require('razorpay');

const razorpayInstance = new Razorpay({
  key_id: 'rzp_test_kxo1XvMZehC0sR',
  key_secret: 'CaEGSnuaRMZIhqUPiqS0D7Az',
});

module.exports = razorpayInstance;