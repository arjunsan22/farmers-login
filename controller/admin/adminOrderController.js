const User = require("../../models/userModel");
const Order=require('../../models/orderModel')



const getAllOrders = async (req, res) => {
    try {
        const { search, dateRange, sort, page = 1, limit = 10 } = req.query;

        let query = {search, dateRange, sort};
        let sortOption = { createdOn: -1 }; // Default sort: Newest First
    
        if (search) {
            const searchRegex = new RegExp(search, 'i');
            query = {
                $or: [
                    { orderId: searchRegex },
                    { 'userId.firstname': searchRegex },
                    { 'userId.lastname': searchRegex }
                ]
            };
        }

        if (dateRange) {
            const [startDate, endDate] = dateRange.split(' - ').map(date => new Date(date));
            query.createdOn = { $gte: startDate, $lte: endDate };
        }

        if (sort) {
            const [field, order] = sort.split('_');
            sortOption = { [field]: order === 'asc' ? 1 : -1 };
        }

        const orders = await Order.find().find(query)
        .populate('userId')
        .populate('orderedItems.product')
            .populate('address')
            .sort(sortOption)
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

            const totalOrders = await Order.countDocuments(query);
            const totalPages = Math.ceil(totalOrders / limit);
    
          res.render('Orders', { orders, totalPages, currentPage: parseInt(page),limit: parseInt(limit) });
    } catch (error) {
       
        console.error('Error fetching orders:', error);
        res.status(500).send('Error fetching orders');
    }
};

const updateStatus = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const { Status } = req.body;
        console.log(Status)
        const updateData = { Status };
if(Status==="delivered"){
    updateData.deliveryDate=new Date();
}
console.log(updateData)
        const updatedOrder = await Order.findByIdAndUpdate(orderId, updateData, { new: true });
        if (!updatedOrder) {
            return res.status(404).send('Order not found');
        }
        res.redirect('/admin/orders');  
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).send('Error updating order status');
    }
    
}

//update order status//
module.exports={
    getAllOrders,
    updateStatus,
}
