const Product = require('../../models/productModel');
const User=require('../../models/userModel')
 const Order = require('../../models/orderModel');
const Address=require('../../models/addressModel')
const Cart = require('../../models/cartModel');
// Render Checkout Page
const loadCheckoutPage = async (req, res) => {
    try {
      const userId = req.session.user;
      console.log("user session in checkout page :",userId)
      const user = await User.findById(userId);

  const userAddress=await Address.findOne({userId})

  const cart = await Cart.findOne({ userId })
  .populate({
      path: 'items.productId',
      model: 'Product',
      select: 'productname salePrice'
  });

if (!cart || !cart.items.length) {
  return res.redirect('/cart');
}
const products = cart.items.map(item => ({
  _id: item.productId._id,
  productname: item.productId.productname,
  salePrice: item.productId.salePrice,
  quantity: item.quantity,
  totalPrice: item.productId.salePrice * item.quantity
}));

 // Calculate cart total
 const cartTotal = products.reduce((sum, item) => sum + item.totalPrice, 0);

  
     // checking   the user has any addresses//
   
     const addresses = userAddress
     ? userAddress.address.map((addr) => ({
         _id: addr._id,
         addressType: addr.addressType,  // Ensure addressType is being passed
         name: addr.name,  // Make sure name is included
         city: addr.city,
         StreetMark: addr.StreetMark,
         state: addr.state,
         pincode: addr.pincode,
         Phone: addr.Phone,
         SecondPhone: addr.SecondPhone,
         Houseno: addr.Houseno,
       }))
     : [];
   
     // If no addresses, pass an empty array//
  
      res.render('checkout', {
        products,
        user,
        addresses,
        cartTotal

      });
    } catch (error) {
      console.error(error);
      res.status(500).send('Server Error');
    }
  };

  const loadCheckoutUserAddress = async (req, res) => {
    try {
      const userId = req.session.user;
      console.log("Session data:", req.session);
      console.log("User ID from session:", userId);
  
    
      const userData = await User.findById(userId);
      console.log("Found user data:", userData ? "Yes" : "No");
  
      if (!userData) {
        console.log("No user found with ID:", userId);
        return res.redirect('/login');
      }
  
      res.render('checkoutUserAddress', {
        user: userData
      });
    } catch (error) {
      console.error("Error in loadCheckoutUserAddressPage:", error);
      res.status(500).send('Server Error');
    }
  
  }
  
const addNewCheckoutAddress = async (req, res) => {
  try {
    const userId = req.session.user;

    const { addressType, name, city, StreetMark, state, pincode, Phone, SecondPhone, Houseno } = req.body;

    // finding the user already has an address //
    let userAddress = await Address.findOne({ userId });

    if (!userAddress) {
        // if no address existss, create a new address//
        userAddress = new Address({
            userId: userId,
            address: [
                {
                    addressType,
                      name,
                     city,
                    StreetMark,
                    state,
                    pincode,
                    Phone,
                    SecondPhone,
                    Houseno,
                },
            ],
        });
    } else {
        // if address exists, push the new address into the array//
        userAddress.address.push({
              addressType,
             name,
            city,
             StreetMark,
            state,
            pincode,
            Phone,
            SecondPhone,
            Houseno,
        });
    }

    await userAddress.save();

          res.redirect('/checkout');

  } catch (error) {
    console.error("error in adding address",error);
    res.redirect('/pagenotfound');
  }


  };

const loadEditCheckoutAddressPage=async (req,res) => {
  
  try {
    const userId = req.session.user;
    const userData =await User.findById(userId) // Assuming session contains the user ID
    const index = req.params.index;
// console.log("index: ", index)
// console.log("userid: ", userId)
    const userAddress = await Address.findOne({ userId });
    // console.log("address: ",userAddress)
    if (userAddress && userAddress.address[index]) {
        const addressToEdit = userAddress.address[index];
        res.render('editUserCheckoutAddress', { address: addressToEdit, index ,user:userData});
    } else {
        res.status(404).send('Address not found');
    }
} catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
}

  
}

const updateCheckoutAddress=async (req,res) => {

  try {
    const userId = req.session.user;
    const index = req.params.index;
// console.log("update process user check : ", userId)
    const updatedData = {
        addressType: req.body.addressType,
        name: req.body.name,
        city: req.body.city,
        StreetMark: req.body.StreetMark,
        state: req.body.state,
        pincode: req.body.pincode,
        Phone: req.body.Phone,
        SecondPhone: req.body.SecondPhone,
        Houseno: req.body.Houseno,
    };

    const userAddress = await Address.findOne({ userId });
    if (userAddress && userAddress.address[index]) {
        userAddress.address[index] = updatedData; // Update the specific address
        await userAddress.save();
        res.redirect('/checkout');
    } else {
        res.status(404).send('Address not found');
    }
} catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
}
}

//order placement//

// const Orderplacement = async (req, res) => {
//   try {
//     // Extract userId from session
//     const userId = req.session.user; // Use the correct session key based on your setup

//     // Validate user session
//     if (!userId) {
//       return res.status(401).send('Unauthorized: User not logged in');
//     }

//     const { products, quantities, address, paymentMethod } = req.body;

//     // Update product stock
//     for (let i = 0; i < products.length; i++) {
//       const productId = products[i];
//       const quantity = quantities[i];

//       // Decrease product stock
//       const product = await Product.findById(productId);
//       if (!product) {
//         return res.status(404).send(`Product with ID ${productId} not found`);
//       }

//       if (product.quantity < quantity) {
//         return res.status(400).send(`Insufficient stock for product: ${product.productname}`);
//       }

//       product.quantity -= quantity; // Decrement the stock
//       if (product.quantity < 0) {
//         product.quantity = 0; // Optional: Set to zero instead of allowing negatives
//       }
//       await product.save();
//     }

//     // Create an order object
//     const order = new Order({
//       userId,
//       products: products.map((productId, index) => ({
//         productId,
//         quantity: quantities[index],
//       })),
//       address,
//       paymentMethod,
      
//       status: 'Confirmed',
//     });

//     // Save the order in the database
//     const savedOrder = await order.save();

//     // Clear user's cart after successful order placement
//     await Cart.updateOne(
//       { userId },
//       { $set: { items: [] } }
//     );

//     // Redirect to success page with order ID
//     res.redirect(`/order-success/${savedOrder._id}`);
//   } catch (error) {
//     console.error('Error placing order:', error);
//     res.status(500).send('Something went wrong while placing the order');
//   }
// };



// const Orderplacement = async (req, res) => {
//   try {
//     // Extract userId from session
//     const userId = req.session.user; // Use the correct session key based on your setup

//     // Validate user session
//     if (!userId) {
//       return res.status(401).send('Unauthorized: User not logged in');
//     }

//     const { products, quantities, address, paymentMethod } = req.body;

//     console.log("order address",address)
//     // Update product stock and calculate total price
//     let totalPrice = 0;
//     const orderedItems = [];

//     for (let i = 0; i < products.length; i++) {
//       const productId = products[i];
//       const quantity = quantities[i];

//       // Decrease product stock
//       const product = await Product.findById(productId);
//       if (!product) {
//         return res.status(404).send(`Product with ID ${productId} not found`);
//       }

//       if (product.quantity < quantity) {
//         return res.status(400).send(`Insufficient stock for product: ${product.productname}`);
//       }

//       product.quantity -= quantity; // Decrement the stock
//       if (product.quantity < 0) {
//         product.quantity = 0; // Optional: Set to zero instead of allowing negatives
//       }
//       await product.save();

//       // Calculate total price
//       const itemTotalPrice = product.salePrice * quantity;
//       totalPrice += itemTotalPrice;

//       // Add to ordered items
//       orderedItems.push({
//         product: productId,
//         quantity,
//         price: product.salePrice,
//       });
//     }

//     // Calculate discount and final amount (if applicable)
//     const discount = 0; // Replace with actual discount calculation if applicable
//     const finalAmount = totalPrice - discount;

//     // Find the address by ID
//     const selectedAddress = await Address.findById(address);
//     if (!selectedAddress) {
//       return res.status(404).send('Address not found');
//     }

//     // Create an order object
//     const order = new Order({
//       userId,
//       orderedItems,
//       totalPrice,
//       discount,
//       finalAmount,
//       address: selectedAddress._id,
//       paymentMethod,
//       status: 'Confirmed',
//     });

//     // Save the order in the database
//     const savedOrder = await order.save();

//     // Clear user's cart after successful order placement
//     await Cart.updateOne(
//       { userId },
//       { $set: { items: [] } }
//     );

//     // Redirect to success page with order ID
//     res.redirect(`/order-success/${savedOrder._id}`);
//   } catch (error) {
//     console.error('Error placing order:', error);
//     res.status(500).send('Something went wrong while placing the order');
//   }
// };


const Orderplacement = async (req, res) => {
  try {
    // Extract userId from session
    const userId = req.session.user; // Use the correct session key based on your setup

    // Validate user session
    if (!userId) {
      return res.status(401).send('Unauthorized: User not logged in');
    }

    const { products, quantities, address, paymentMethod } = req.body;

    console.log("order address", address);
    // Update product stock and calculate total price
    let totalPrice = 0;
    const orderedItems = [];

    for (let i = 0; i < products.length; i++) {
      const productId = products[i];
      const quantity = quantities[i];

      // Decrease product stock
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).send(`Product with ID ${productId} not found`);
      }

      if (product.quantity < quantity) {
        return res.status(400).send(`Insufficient stock for product: ${product.productname}`);
      }

      product.quantity -= quantity; // Decrement the stock
      if (product.quantity < 0) {
        product.quantity = 0; // Optional: Set to zero instead of allowing negatives
      }
      await product.save();

      // Calculate total price
      const itemTotalPrice = product.salePrice * quantity;
      totalPrice += itemTotalPrice;

      // Add to ordered items
      orderedItems.push({
        product: productId,
        quantity,
        price: product.salePrice,
      });
    }

    // Calculate discount and final amount (if applicable)
    const discount = 0; // Replace with actual discount calculation if applicable
    const finalAmount = totalPrice - discount;

    // Find the address by ID
    const selectedAddress = await Address.findOne({ "address._id": address });
    if (!selectedAddress) {
      return res.status(404).send('Address not found');
    }

    const addressDetails = selectedAddress.address.id(address);

    // Create an order object
    const order = new Order({
      userId,
      orderedItems,
      totalPrice,
      discount,
      finalAmount,
      address: addressDetails,
      paymentMethod,
      status: 'Confirmed',
    });

    // Save the order in the database
    const savedOrder = await order.save();

    // Clear user's cart after successful order placement
    await Cart.updateOne(
      { userId },
      { $set: { items: [] } }
    );

    // Redirect to success page with order ID
    res.redirect(`/order-success/${savedOrder._id}`);
  } catch (error) {
    console.error('Error placing order:', error);
    res.status(500).send('Something went wrong while placing the order');
  }
};


const orderSuccess = async (req, res) => {
  try {
    const orderId = req.params.orderId;

    // Find the order by ID to display its details
    const order = await Order.findById(orderId).populate('orderedItems.product').populate('address');

    if (!order) {
      return res.status(404).send('Order not found');
    }

    // Render the success page with order details
    res.render('order-success', {
      order,
    });
  } catch (error) {
    console.error('Error displaying order success page:', error);
    res.status(500).send('Something went wrong while displaying the order success page');
  }

};



module.exports={
    loadCheckoutPage,
    loadCheckoutUserAddress,
    addNewCheckoutAddress,
    loadEditCheckoutAddressPage,
    updateCheckoutAddress,
    Orderplacement,
    orderSuccess
}