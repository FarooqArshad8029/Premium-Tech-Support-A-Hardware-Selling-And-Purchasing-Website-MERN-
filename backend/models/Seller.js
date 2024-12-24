const mongoose = require("mongoose");

// Define schema for seller information
const sellerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    
    companyName: {
      type: String,
      required: true,
    },
    companyDescription: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    website: String,
    products: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    containers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "BidContainer",
      },
    ],
    orders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
      },
    ],
    
    isVerified: {
      type: Boolean,
      default: false,
    },
    isBanned: {
        type: Boolean,
        default: false,
      },
  },
  { timestamps: true }
);

const Seller = mongoose.model("Seller", sellerSchema);

module.exports = Seller;
