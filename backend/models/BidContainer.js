const mongoose = require('mongoose');

const bidContainerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },
  startingPrice: {
    type: Number,
    required: true,
  },
  images: [
    {
      public_id: {
        type: String,
      },
      url: {
        type: String,
      },
    },
  ],
  endTime: {
    type: Date,
    required: true,
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Seller',
    required: true,
  },
  bids: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bid', // Ensure it points to the Bid model
  }],
  
}, { timestamps: true });

module.exports = mongoose.model('BidContainer', bidContainerSchema);
