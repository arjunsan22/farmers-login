const User = require("../../models/userModel");
const bcrypt=require('bcrypt')
const env=require('dotenv').config()
const mongoose=require('mongoose')
const Coupon = require('../../models/couponModel');
const Product=require('../../models/productModel')
const Order=require('../../models/orderModel')  
const Chart = require('chart.js');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');


const loadLogin=async (req,res) => {
    try {
        if(req.session.admin){
            return res.redirect('/admin')
        }
        else{
            res.render('adminlogin',{message:null})
        }
    } catch (error) {
        
    }
}

const verifyadmin=async(req,res)=>{
    try {
        const{email,password}=req.body;
        const admin=await User.findOne({email,isAdmin:true});
        console.log('Session ID of admin:', req.sessionID); 
        if(admin){
            const passwordMatch=await bcrypt.compare(password,admin.password)
            if(passwordMatch){
                req.session.admin=true;
                return res.redirect('/admin')
            }else{
                return res.redirect('/admin/login')
            }
        }
else{
    return res.redirect('/admin/login')
}

    } catch (error) {
        console.log("login error",error)
        return res.redirect('/pageerror')
    }
}


const loadDashboard = async (req, res) => {
    if (req.session.admin) {
        try {
           
            // Fetch total users
            const totalUsers = await User.countDocuments({ isBlocked: false ,isAdmin:false});
            
            // Fetch total products
            const totalProducts = await Product.countDocuments({ isblocked: false });
          
            
            // Fetch total orders and calculate revenue
            const orders = await Order.find({
                Status: { $in: ["pending","delivered","processing","shipping"] }
            });
            const totalOrders = orders.length;
          
            
            const totalRevenue = orders.reduce((acc, order) => {
                return acc + (order.finalAmount || 0);
            }, 0);
           
            const monthlyData = await Order.aggregate([
                {
                    $match: {
                        Status: { $in: ["pending","delivered","processing","shipping"] },
                        createdOn: { $gte: new Date(new Date().getFullYear(), 0, 1) }
                    }
                },
                {
                    $group: {
                        _id: { $month: "$createdOn" },
                        total: { $sum: "$finalAmount" }
                    }
                },
                { $sort: { _id: 1 } }
            ]);
            const orderStatusData = await Order.aggregate([
                {
                    $group: {
                        _id: "$Status",
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]);


            // Format monthly data for chart
            const monthlyStats = Array(12).fill(0);
            monthlyData.forEach(item => {
                monthlyStats[item._id - 1] = item.total;
            });

//coupon statistics//

const coupons = await Coupon.find();
const activeCoupons = coupons.filter(coupon => 
    coupon.isActive && 
    new Date() >= coupon.startOn && 
    new Date() <= coupon.expireOn
).length;

// Calculate discount statistics using the discount field from orders
const ordersWithDiscounts = await Order.find({
    Status: { $in: ["pending", "delivered", "processing", "shipping"] },
    discount: { $gt: 0 } 
});

const discountStats = {
    totalDiscount: 0,
    ordersWithDiscount: 0,
    discountByType: {
        "Coupon Discount": {
            count: 0,
            totalAmount: 0
        }
    }
};

ordersWithDiscounts.forEach(order => {
    if (order.discount && order.discount > 0) {
        discountStats.totalDiscount += order.discount;
        discountStats.ordersWithDiscount++;
        
        // Since we don't have coupon types, we'll use a single category
        discountStats.discountByType["Coupon Discount"].count++;
        discountStats.discountByType["Coupon Discount"].totalAmount += order.discount;
    }
});





            res.render('dashboard', {
                totalUsers,
                totalProducts,
                totalOrders,
                totalRevenue,
                monthlyStats,
                orderStatusData,
                discountStats,
    activeCoupons
            });
        } catch (error) {
            console.error('Dashboard Error:', error);
            res.redirect('/admin/error');
        }
    }
}




const errorPage=async (req,res) => {
    try {
        res.render('error')
    } catch (error) {
    console.log(error)
    }
}

const  Logout=async (req,res) => {
    try {
        req.session.destroy((err)=>{
            if(err){
            console.log("error faced in logout-destory session")
        return res.redirect('/error')    
        }

                    res.redirect('/admin/login')
        
        
        })
    } catch (error) {
    console.log("error during logout")
    res.redirect('/error')
    }
}

const blockUser=async(req,res)=>{
    try {
        let id=req.query.id
        await User.updateOne({_id:id},{$set:{isBlocked:true}})
        res.redirect('/admin/users')
    } catch (error) {
        res.redirect('/error')
    }
}

const unblockUser=async (req,res) => {
try {
    let id=req.query.id;
    await User.updateOne({_id:id},{$set:{isBlocked:false}})
    res.redirect('/admin/users')

} catch (error) {
    res.redirect('/error')
}    
}

//coupons//
const getCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.find();
        res.render('Coupons', { coupons });
    } catch (error) {
        console.error('Error fetching coupons:', error);
        res.redirect('/admin/error')
    }

};

const getaddCoupon=async (req, res) => {
    try {
       
        res.render('addCoupon');
    } catch (error) {
        console.error('Error fetching coupons:', error);
      res.redirect('/admin/error')
    }

};


const addCoupon = async (req, res) => {
    try {
        const { couponCode, couponType, description, offerPrice, minimumPrice, usageLimit, startOn, expireOn, isActive } = req.body;
        const newCoupon = new Coupon({
            couponCode,
            couponType,
            description,
            offerPrice,
            minimumPrice,
            usageLimit,
            startOn,
            expireOn,
            isActive
        });
        await newCoupon.save();
        res.redirect('/admin/coupons');
    }  catch (error) {
        console.error('Error adding coupon:', error);
        if (error.code === 11000) { // Duplicate key error code
            res.render('addCoupon', { errorMessage: 'Coupon code already exists. Please use a different code.' });
        } else {
            res.status(500).send('Error adding coupon');
        }
    }

};



const couponStatus = async (req, res) => {
    try {
        const couponId = req.params.couponId;
        const coupon = await Coupon.findById(couponId);
        if (!coupon) {
            return res.status(404).send('Coupon not found');
        }
        coupon.isActive = !coupon.isActive;
        await coupon.save();
        res.redirect('/admin/coupons');
    } catch (error) {
        console.error('Error toggling coupon status:', error);
        res.status(500).send('Error toggling coupon status');
    }
};


const generateSalesReport = async (req, res) => {
    try {
        console.log('Starting report generation...');
        const { reportType, startDate, endDate, format } = req.body;
        console.log('Received request body:', req.body);
        console.log('Headers:', req.headers);

        // Validate required fields
        if (!reportType || !format) {
            console.log('Missing required fields:', { reportType, format });
            return res.status(400).json({ 
                error: 'Missing required fields',
                details: { reportType, format }
            });
        }

        let startDateTime, endDateTime;

        // Calculate date range based on report type
        try {
            console.log('Calculating date range for type:', reportType);
            switch (reportType) {
                case 'daily':
                    startDateTime = new Date();
                    startDateTime.setHours(0, 0, 0, 0);
                    endDateTime = new Date();
                    endDateTime.setHours(23, 59, 59, 999);
                    break;
                case 'weekly':
                    startDateTime = new Date();
                    startDateTime.setDate(startDateTime.getDate() - 7);
                    endDateTime = new Date();
                    break;
                case 'yearly':
                    startDateTime = new Date();
                    startDateTime.setFullYear(startDateTime.getFullYear() - 1);
                    endDateTime = new Date();
                    break;
                case 'custom':
                    if (!startDate || !endDate) {
                        console.log('Missing dates for custom range:', { startDate, endDate });
                        return res.status(400).json({ 
                            error: 'Start date and end date are required for custom range' 
                        });
                    }
                    startDateTime = new Date(startDate);
                    endDateTime = new Date(endDate);
                    endDateTime.setHours(23, 59, 59, 999);
                    break;
                default:
                    console.log('Invalid report type:', reportType);
                    return res.status(400).json({ error: 'Invalid report type' });
            }
            console.log('Calculated date range:', { startDateTime, endDateTime });
        } catch (error) {
            console.error('Date calculation error:', error);
            return res.status(400).json({ 
                error: 'Invalid date format',
                details: error.message 
            });
        }

        // Fetch orders within date range
        console.log('Fetching orders...');
        const orders = await Order.find({
            createdOn: { $gte: startDateTime, $lte: endDateTime },
            Status: { $in: ["delivered", "processing", "shipping", "pending"] }
        }).populate('userId', 'firstname lastname email');

        console.log('Found orders:', orders.length);

        if (!orders || orders.length === 0) {
            console.log('No orders found in date range');
            return res.status(404).json({ 
                error: 'No orders found for the selected date range' 
            });
        }

        // Calculate statistics
        console.log('Calculating statistics...');
        let totalRevenue = 0;
        let totalDiscount = 0;
        let totalOrders = orders.length;
        let ordersByStatus = {};
        let dailyRevenue = {};

        orders.forEach(order => {
            totalRevenue += order.finalAmount || 0;
            totalDiscount += order.discount || 0;
            ordersByStatus[order.Status] = (ordersByStatus[order.Status] || 0) + 1;
            
            const dateKey = order.createdOn.toISOString().split('T')[0];
            if (!dailyRevenue[dateKey]) {
                dailyRevenue[dateKey] = {
                    revenue: 0,
                    discount: 0,
                    orders: 0
                };
            }
            dailyRevenue[dateKey].revenue += order.finalAmount || 0;
            dailyRevenue[dateKey].discount += order.discount || 0;
            dailyRevenue[dateKey].orders += 1;
        });

        console.log('Statistics calculated:', { 
            totalRevenue, 
            totalDiscount, 
            totalOrders,
            ordersByStatus
        });

        try {
            if (format === 'pdf') {
                console.log('Generating PDF report...');
                const doc = new PDFDocument();
                const chunks = [];

                doc.on('data', chunk => chunks.push(chunk));
                doc.on('end', () => {
                    console.log('PDF generation completed');
                    const result = Buffer.concat(chunks);
                    res.setHeader('Content-Type', 'application/pdf');
                    res.setHeader('Content-Disposition', `attachment; filename=sales-report-${reportType}.pdf`);
                    res.send(result);
                });

                // Add content to PDF
                doc.fontSize(20).text('Sales Report', { align: 'center' });
                doc.moveDown();
                doc.fontSize(12).text(`Report Period: ${reportType}`);
                doc.text(`Date Range: ${startDateTime.toLocaleDateString()} to ${endDateTime.toLocaleDateString()}`);
                doc.moveDown();

                doc.fontSize(14).text('Summary');
                doc.fontSize(12).text(`Total Orders: ${totalOrders}`);
                doc.text(`Total Revenue: ₹${totalRevenue.toLocaleString()}`);
                doc.text(`Total Discounts: ₹${totalDiscount.toLocaleString()}`);
                doc.moveDown();

                doc.fontSize(14).text('Daily Breakdown');
                Object.entries(dailyRevenue).forEach(([date, stats]) => {
                    doc.fontSize(12).text(`Date: ${date}`);
                    doc.text(`Revenue: ₹${stats.revenue.toLocaleString()}`);
                    doc.text(`Discounts: ₹${stats.discount.toLocaleString()}`);
                    doc.text(`Orders: ${stats.orders}`);
                    doc.moveDown();
                });
                doc.end();
            } else {
                console.log('Generating Excel report...');
                const workbook = new ExcelJS.Workbook();
                const worksheet = workbook.addWorksheet('Sales Report');

                worksheet.columns = [
                    { header: 'Date', key: 'date', width: 15 },
                    { header: 'Order ID', key: 'orderId', width: 15 },
                    { header: 'Customer', key: 'customer', width: 20 },
                    { header: 'Status', key: 'status', width: 15 },
                    { header: 'Amount', key: 'amount', width: 15 },
                    { header: 'Discount', key: 'discount', width: 15 },
                    { header: 'Final Amount', key: 'finalAmount', width: 15 }
                ];

                orders.forEach(order => {
                    worksheet.addRow({
                        date: order.createdOn.toLocaleDateString(),
                        orderId: order.orderId,
                        customer: order.userId ? `${order.userId.firstname} ${order.userId.lastname}` : 'N/A',
                        status: order.Status,
                        amount: order.totalPrice,
                        discount: order.discount,
                        finalAmount: order.finalAmount
                    });
                });

                worksheet.addRow([]);
                worksheet.addRow(['Total Orders', totalOrders]);
                worksheet.addRow(['Total Revenue', totalRevenue]);
                worksheet.addRow(['Total Discounts', totalDiscount]);

                console.log('Excel generation completed');
                const buffer = await workbook.xlsx.writeBuffer();
                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                res.setHeader('Content-Disposition', `attachment; filename=sales-report-${reportType}.xlsx`);
                res.send(buffer);
            }
        } catch (error) {
            console.error('File generation error:', error);
            return res.status(500).json({ 
                error: 'Error generating report file',
                details: error.message 
            });
        }
    } catch (error) {
        console.error('Report generation error:', error);
        res.status(500).json({ 
            error: 'Error generating report',
            details: error.message 
        });
    }
};
        
module.exports={
    loadLogin,
    verifyadmin,
    loadDashboard,
    errorPage,
    Logout,
    blockUser,
    unblockUser,
    getCoupons,
    getaddCoupon,
    addCoupon,
    couponStatus,
    generateSalesReport
    
}   