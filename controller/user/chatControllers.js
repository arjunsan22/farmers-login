const Chat = require('../../models/chatModel');
const Order = require('../../models/orderModel');
const Product = require('../../models/productModel');
const User = require('../../models/userModel');

const getChatPage = async (req, res) => {
    try {
        const userId = req.session.user;
        const userData = await User.findById(userId)
        // Find all chats where user is buyer or seller
        const chats = await Chat.find({ $or: [{ buyer: userId }, { seller: userId }] })
            .populate('buyer', 'firstname lastname userImage')
            .populate('seller', 'firstname lastname userImage')
            .populate('orderId');
        res.render('userChat', { chats, userId ,user:userData});
    } catch (err) {
        res.status(500).send('Error loading chat page');
    }
};

const getOrCreateChat = async (req, res) => {
    try {
        const userId = req.session.user;
        const { orderId } = req.params;

        const order = await Order.findById(orderId).populate({
            path: 'orderedItems.product',
            populate: { path: 'userId' }
        });

        if (!order) return res.status(404).send('Order not found');

        // Assume first product's seller is the seller (for multi-product orders, you may need to adjust)
        const seller = order.orderedItems[0].product.userId._id;
        const buyer = order.userId;

        let chat = await Chat.findOne({ orderId, buyer, seller });
        if (!chat) {
            chat = new Chat({ orderId, buyer, seller, messages: [] });
            await chat.save();
        }
        res.redirect(`/chat/${chat._id}`);
    } catch (err) {
        res.status(500).send('Error creating chat');
    }
};

const getChatById = async (req, res) => {
    try {
        const chatId = req.params.chatId;
        const userId = req.session.user;
        const userData= await User.findById(userId)
        const chat = await Chat.findById(chatId)
            .populate('buyer', 'firstname lastname userImage')
            .populate('seller', 'firstname lastname userImage')
            .populate('orderId')
            .populate('messages.sender', 'firstname lastname');
        if (!chat) return res.status(404).send('Chat not found');
        res.render('userChatRoom', { chat, userId, user:userData });
    } catch (err) {
        res.status(500).send('Error loading chat');
    }
};

const postMessage = async (req, res) => {
    try {
        const chatId = req.params.chatId;
        const userId = req.session.user;
        const { text } = req.body;
        console.log('Message received:', text);
        const chat = await Chat.findById(chatId);
        if (!chat) return res.status(404).send('Chat not found');
        chat.messages.push({ sender: userId, text });
        await chat.save();
        res.status(200).json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false });
    }
};


module.exports={
getChatPage,
getOrCreateChat,
getChatById,    
postMessage
}