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
            const totalUsers = await User.countDocuments({ isBlocked: false, isAdmin: false });
            const totalProducts = await Product.countDocuments({ isblocked: false });
            
            // Get all orders and total products sold using aggregation
            const orders = await Order.find({
                Status: { $in: ["pending", "delivered", "processing", "shipping"] }
            });

            const totalProductsAgg = await Order.aggregate([
                {
                    $match: {
                        Status: { $in: ["pending", "delivered", "processing", "shipping"] }
                    }
                },
                {
                    $unwind: "$orderedItems"
                },
                {
                    $group: {
                        _id: null,
                        totalQuantity: { $sum: "$orderedItems.quantity" }
                    }
                }
            ]);

            const totalOrders = orders.length;
            const totalProductsSold = totalProductsAgg[0]?.totalQuantity || 0;

            const totalRevenue = orders.reduce((acc, order) => {
                return acc + (order.finalAmount || 0);
            }, 0);

            const monthlyData = await Order.aggregate([
                {
                    $match: {
                        Status: { $in: ["pending", "delivered", "processing", "shipping"] },
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

            // Coupon statistics
            const coupons = await Coupon.find();
            const activeCoupons = coupons.filter(coupon => 
                coupon.isActive && 
                new Date() >= coupon.startOn && 
                new Date() <= coupon.expireOn
            ).length;

            // Calculate discount statistics
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
                    discountStats.discountByType["Coupon Discount"].count++;
                    discountStats.discountByType["Coupon Discount"].totalAmount += order.discount;
                }
            });
    //new////////////////////////// Calculate Average Order Value (AOV)////////////////////////////////new////////////////////////
            const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;

            // Get Best Selling Products (Top 10)
            const bestSellingProducts = await Order.aggregate([
                {
                    $match: {
                        Status: { $in: ["pending", "delivered", "processing", "shipping"] }
                    }
                },
                { $unwind: "$orderedItems" },
                {
                    $group: {
                        _id: "$orderedItems.product", // Changed from productId to product
                        totalQuantity: { $sum: "$orderedItems.quantity" },
                        totalRevenue: { $sum: { $multiply: ["$orderedItems.price", "$orderedItems.quantity"] } }
                    }
                },
                {
                    $lookup: {
                        from: "products",
                        localField: "_id",
                        foreignField: "_id",
                        as: "productDetails"
                    }
                },
                { $unwind: "$productDetails" },
                {
                    $project: {
                        productName: "$productDetails.productname",
                        totalQuantity: 1,
                        totalRevenue: 1,
                        category: "$productDetails.category"
                    }
                },
                { $sort: { totalQuantity: -1 } },
                { $limit: 10 }
            ]);
            
            // Get Best Selling Categories (Top 10)
            const bestSellingCategories = await Order.aggregate([
                {
                    $match: {
                        Status: { $in: ["pending", "delivered", "processing", "shipping"] }
                    }
                },
                { $unwind: "$orderedItems" },
                {
                    $lookup: {
                        from: "products",
                        localField: "orderedItems.product", // Changed from productId to product
                        foreignField: "_id",
                        as: "product"
                    }
                },
                { $unwind: "$product" },
                {
                    $lookup: {
                        from: "categories",
                        localField: "product.category",
                        foreignField: "_id",
                        as: "category"
                    }
                },
                { $unwind: "$category" },
                {
                    $group: {
                        _id: "$category._id",
                        categoryName: { $first: "$category.name" },
                        totalQuantity: { $sum: "$orderedItems.quantity" },
                        totalRevenue: { $sum: { $multiply: ["$orderedItems.price", "$orderedItems.quantity"] } }
                    }
                },
                { $sort: { totalQuantity: -1 } },
                { $limit: 10 }
            ]);
            console.log(bestSellingProducts)
   console.log(bestSellingCategories)
            // Get Sales Data with Time Filter
            const getSalesData = async (timeFrame) => {
                const now = new Date();
                let startDate;
                
                switch(timeFrame) {
                    case 'yearly':
                        startDate = new Date(now.getFullYear(), 0, 1);
                        break;
                    case 'monthly':
                        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                        break;
                    case 'weekly':
                        startDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
                        break;
                    default:
                        startDate = new Date(now - 30 * 24 * 60 * 60 * 1000);
                }
            
                return await Order.aggregate([
                    {
                        $match: {
                            Status: { $in: ["pending", "delivered", "processing", "shipping"] },
                            createdOn: { $gte: startDate } // This matches your schema field name
                        }
                    },
                    {
                        $group: {
                            _id: {
                                $dateToString: { 
                                    format: timeFrame === 'yearly' ? "%Y-%m" : "%Y-%m-%d", 
                                    date: "$createdOn" // This matches your schema field name
                                }
                            },
                            totalSales: { $sum: "$finalAmount" },
                            orderCount: { $sum: 1 }
                        }
                    },
                    { $sort: { "_id": 1 } }
                ]);
            };
            // Get sales data for different time frames
            const yearlySales = await getSalesData('yearly');
            const monthlySales = await getSalesData('monthly');
            const weeklySales = await getSalesData('weekly');

            
            // Calculate growth metrics
            const calculateGrowth = (currentPeriod, previousPeriod) => {
                if (!previousPeriod || previousPeriod === 0) return 0;
                return ((currentPeriod - previousPeriod) / previousPeriod) * 100;
            };

            const currentMonthSales = monthlySales[monthlySales.length - 1]?.totalSales || 0;
            const previousMonthSales = monthlySales[monthlySales.length - 2]?.totalSales || 0;
            const monthOverMonthGrowth = calculateGrowth(currentMonthSales, previousMonthSales);



            res.render('dashboard', {
                totalUsers,
                totalProducts,
                totalOrders,
                totalProductsSold,
                totalRevenue,
                monthlyStats,
                orderStatusData,
                discountStats,
                activeCoupons,
                // New data
                aov,
                bestSellingProducts,
                bestSellingCategories,
                yearlySales,
                monthlySales,
                weeklySales,
                monthOverMonthGrowth
            });
        } catch (error) {
            console.error('Dashboard Error:', error);
            res.redirect('/admin/error');
        }
    } else {
        res.redirect('/admin/login');
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

    // Header
    doc.fontSize(24)
        .font('Helvetica-Bold')
        .text('Sales Report', { align: 'center' });
    doc.moveDown();

    // Report Information
    doc.fontSize(12)
        .font('Helvetica')
        .text(`Report Type: ${reportType.charAt(0).toUpperCase() + reportType.slice(1)}`, { align: 'left' })
        .text(`Generated On: ${new Date().toLocaleString()}`)
        .text(`Period: ${startDateTime.toLocaleDateString()} to ${endDateTime.toLocaleDateString()}`);
    doc.moveDown();

    // Summary Section
    doc.fontSize(16)
        .font('Helvetica-Bold')
        .text('Summary', { underline: true });
    doc.moveDown();

    // Create a summary table
    const summaryTableTop = doc.y;
    const summaryTableLeft = 50;
    const colWidth = 150;
    const rowHeight = 30;

    // Draw summary table
    doc.lineWidth(1)
        .rect(summaryTableLeft, summaryTableTop, colWidth * 2, rowHeight * 4)
        .stroke();

    // Add vertical line
    doc.moveTo(summaryTableLeft + colWidth, summaryTableTop)
        .lineTo(summaryTableLeft + colWidth, summaryTableTop + rowHeight * 4)
        .stroke();

    // Add horizontal lines and data
    let currentY = summaryTableTop;
    const summaryData = [
        ['Total Orders:', totalOrders],
        ['Total Revenue:', `₹${totalRevenue.toLocaleString()}`],
        ['Total Discounts:', `₹${totalDiscount.toLocaleString()}`],
        ['Average Order Value:', `₹${(totalRevenue / totalOrders).toFixed(2)}`]
    ];

    summaryData.forEach((row, index) => {
        // Draw horizontal line
        if (index > 0) {
            doc.moveTo(summaryTableLeft, currentY)
                .lineTo(summaryTableLeft + colWidth * 2, currentY)
                .stroke();
        }

        // Add text
        doc.fontSize(10)
            .font('Helvetica-Bold')
            .text(row[0], summaryTableLeft + 10, currentY + 10)
            .font('Helvetica')
            .text(row[1].toString(), summaryTableLeft + colWidth + 10, currentY + 10);

        currentY += rowHeight;
    });

    doc.moveDown(2);

    // Order Status Breakdown
    doc.fontSize(16)
        .font('Helvetica-Bold')
        .text('Order Status Breakdown', { underline: true });
    doc.moveDown();

    // Create status table
    const statusTableTop = doc.y;
    const statusData = Object.entries(ordersByStatus);
    
    // Draw status table
    doc.lineWidth(1)
        .rect(summaryTableLeft, statusTableTop, colWidth * 2, rowHeight * (statusData.length + 1))
        .stroke();

    // Add header
    doc.fontSize(10)
        .font('Helvetica-Bold')
        .text('Status', summaryTableLeft + 10, statusTableTop + 10)
        .text('Count', summaryTableLeft + colWidth + 10, statusTableTop + 10);

    // Add vertical line
    doc.moveTo(summaryTableLeft + colWidth, statusTableTop)
        .lineTo(summaryTableLeft + colWidth, statusTableTop + rowHeight * (statusData.length + 1))
        .stroke();

    // Add status data
    let statusY = statusTableTop + rowHeight;
    statusData.forEach((row, index) => {
        doc.moveTo(summaryTableLeft, statusY)
            .lineTo(summaryTableLeft + colWidth * 2, statusY)
            .stroke();

        doc.fontSize(10)
            .font('Helvetica')
            .text(row[0].charAt(0).toUpperCase() + row[0].slice(1), summaryTableLeft + 10, statusY + 10)
            .text(row[1].toString(), summaryTableLeft + colWidth + 10, statusY + 10);

        statusY += rowHeight;
    });

    doc.moveDown(2);

  // Daily Revenue Breakdown
  doc.fontSize(16)
  .font('Helvetica-Bold')
  .text('Daily Revenue Breakdown', { underline: true });
doc.moveDown();

// Table configuration
const tableConfig = {
  startX: 50,
  width: 480,
  rowHeight: 30,
  headerHeight: 35,
  fontSize: 9,
  headerFontSize: 10,
  columns: [
      { header: 'Date', width: 120, align: 'left' },
      { header: 'Revenue', width: 120, align: 'right' },
      { header: 'Discounts', width: 120, align: 'right' },
      { header: 'Orders', width: 120, align: 'right' }
  ]
};

const dailyData = Object.entries(dailyRevenue);
const tableHeight = tableConfig.headerHeight + (dailyData.length * tableConfig.rowHeight);

// Check if new page is needed
if (doc.y + tableHeight > doc.page.height - 50) {
  doc.addPage();
}

const tableTop = doc.y;

// Draw table outline
doc.lineWidth(1)
  .rect(tableConfig.startX, tableTop, tableConfig.width, tableHeight)
  .stroke();

// Draw headers
let currentX = tableConfig.startX;
doc.fontSize(tableConfig.headerFontSize)
  .font('Helvetica-Bold');

tableConfig.columns.forEach((column, index) => {
  // Draw header cell
  doc.text(
      column.header,
      currentX + 10,
      tableTop + (tableConfig.headerHeight - tableConfig.headerFontSize) / 2,
      { width: column.width - 20 }
  );

  currentX += column.width;

  // Draw vertical lines
  if (index < tableConfig.columns.length - 1) {
      doc.moveTo(currentX, tableTop)
          .lineTo(currentX, tableTop + tableHeight)
          .stroke();
  }
});

// Draw header separator line
doc.moveTo(tableConfig.startX, tableTop + tableConfig.headerHeight)
  .lineTo(tableConfig.startX + tableConfig.width, tableTop + tableConfig.headerHeight)
  .stroke();

// Add data rows
doc.font('Helvetica')
  .fontSize(tableConfig.fontSize);

dailyData.forEach(([ date, stats ], rowIndex) => {
  const rowY = tableTop + tableConfig.headerHeight + (rowIndex * tableConfig.rowHeight);
  
  // Draw horizontal line for each row (except last)
  if (rowIndex < dailyData.length - 1) {
      doc.moveTo(tableConfig.startX, rowY + tableConfig.rowHeight)
          .lineTo(tableConfig.startX + tableConfig.width, rowY + tableConfig.rowHeight)
          .stroke();
  }

  // Add row data
  let xPos = tableConfig.startX;
  
  // Date
  doc.text(date, xPos + 10, rowY + (tableConfig.rowHeight - tableConfig.fontSize) / 2);
  xPos += tableConfig.columns[0].width;

  // Revenue
  doc.text(
      `₹${stats.revenue.toLocaleString()}`,
      xPos + 10,
      rowY + (tableConfig.rowHeight - tableConfig.fontSize) / 2,
      { width: tableConfig.columns[1].width - 20, align: 'right' }
  );
  xPos += tableConfig.columns[1].width;

  // Discounts
  doc.text(
      `₹${stats.discount.toLocaleString()}`,
      xPos + 10,
      rowY + (tableConfig.rowHeight - tableConfig.fontSize) / 2,
      { width: tableConfig.columns[2].width - 20, align: 'right' }
  );
  xPos += tableConfig.columns[2].width;

  // Orders
  doc.text(
      stats.orders.toString(),
      xPos + 10,
      rowY + (tableConfig.rowHeight - tableConfig.fontSize) / 2,
      { width: tableConfig.columns[3].width - 20, align: 'right' }
  );
});

doc.moveDown(2);

// Footer
doc.fontSize(8)
  .font('Helvetica')
  .text('End of Report', { align: 'center' });

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
    generateSalesReport,
    
    
}   