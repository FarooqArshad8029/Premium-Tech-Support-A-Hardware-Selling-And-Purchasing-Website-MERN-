const mongoose = require("mongoose");

// Define schema for product
const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: String,
    price: {
      type: Number,
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
    quantity: {
      type: Number,
      default: 0,
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
    reviews: [
      {
        user: {
          type: mongoose.Schema.ObjectId,
          ref: "User",
        },
        name: {
          type: String,
        },
        rating: {
          type: Number,
        },
        comment: {
          type: String,
        },
      },
    ],

    brand: String,
    color: String,
    size: String,
    weight: Number,
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    noOfReviews: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
