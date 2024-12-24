const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  bidContainer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BidContainer',
    required: true,
  }
}, { timestamps: true });

module.exports = mongoose.model('Bid', bidSchema);
