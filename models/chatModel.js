const mongoose = require('mongoose');
const { Schema } = mongoose;

const messageSchema = new Schema({
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true },
    sentAt: { type: Date, default: Date.now }
});

const chatSchema = new Schema({
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    buyer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    seller: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    messages: [messageSchema]
}, { timestamps: true });

module.exports = mongoose.model('Chat', chatSchema);