const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const priceChartSchema = new Schema({
    category: { type: String, required: true },
    product: { type: String, required: true },
    minPrice: { type: Number, required: true }
});

module.exports = mongoose.model('PriceChart', priceChartSchema);