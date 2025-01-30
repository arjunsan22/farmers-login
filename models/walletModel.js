const mongoose = require('mongoose');
const { Schema } = mongoose;

const walletSchema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  balance: {
    type: Number,
    default: 0,
  },
  transactions: [
    {
      amount: Number,
      type: { type: String, enum: ['credit', 'debit'] },
      date: { type: Date, default: Date.now },
      description: String,
    },
  ],
});

module.exports = mongoose.model('Wallet', walletSchema);