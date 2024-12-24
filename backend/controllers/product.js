const { catchAsyncError } = require("../middleware/catchAsyncError");
const Product = require("../models/Product");
const getDataUri = require("../utils/dataUri");
const cloudinary = require("cloudinary");
const ErrorHandler = require("../utils/errorHandler");
const Seller = require("../models/Seller");
const Category = require("../models/Category");
exports.createProduct = catchAsyncError(async (req, res, next) => {
  const imagePromises = req.files.map(async (file) => {
    const dataUri = getDataUri(file);
    const result = await cloudinary.v2.uploader.upload(dataUri.content);
    return { public_id: result.public_id, url: result.secure_url };
  });

  const images = await Promise.all(imagePromises);

  // Create new product
  const {
    name,
    description,
    price,
    category,
    quantity,
    brand,
    color,
    size,
    weight,
    dimensions,
  } = req.body;

  const userId = req.user._id; // Assuming user ID is stored in the request object

  const product = new Product({
    name,
    description,
    price,
    category,
    quantity,
    images,
    brand,
    color,
    size,
    weight,
    dimensions,
    seller: userId, // Assign the authenticated user's ID as the seller ID
  });

  await product.save();

  // Update seller's products array
  await Seller.findOneAndUpdate(
    { user: req.user._id }, // Find the seller by user ID
    { $push: { products: product._id } }, // Push the newly created product's ID to the products array
    { new: true } // Return the updated seller document
  );

  res.status(201).json({
    success: true,
    message: "Product created successfully",
    product,
  });
});

exports.getAllProducts = catchAsyncError(async (req, res, next) => {
  const products = await Product.find({})
    .populate({
      path: "category", // Populate the category field
    })
    .populate({
      path: "seller",
      populate: { path: "sellerInfo" },
    });

  res.status(200).json({
    success: true,
    data: products,
  });
});

exports.getAllSellersProfilesAndProducts = catchAsyncError(
  async (req, res, next) => {
    // Find all sellers and populate their products
    const sellers = await Seller.find({}).populate("products").populate("user");

    res.status(200).json({
      success: true,
      data: sellers,
    });
  }
);

exports.getProductById = catchAsyncError(async (req, res, next) => {
  const prodId = req.params.id;
  const product = await Product.findById(prodId)
    .populate({
      path: 'seller',
      populate: {
        path: 'sellerInfo',
      },
    })
    .populate('category');
  if (!product) {
    return next(new ErrorHandler("No product found with that ID", 404));
  }
  res.status(200).json({
    success: true,
    singalData: product,
  });
});



exports.updateProduct = catchAsyncError(async (req, res, next) => {
  const productId = req.params.id;
  const {
    name,
    description,
    price,
    category,
    quantity,
    brand,
    color,
    size,
    weight,
    dimensions,
  } = req.body;
  let product = await Product.findById(productId);

  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }

  let uploadedImages = [];
  if (req.files && req.files.length > 0) {
    const imagePromises = req.files.map(async (file) => {
      const fileUri = getDataUri(file);
      const mycloud = await cloudinary.v2.uploader.upload(fileUri.content);
      return { public_id: mycloud.public_id, url: mycloud.url };
    });
    uploadedImages = await Promise.all(imagePromises);
  }

  product.name = name || product.name;
  product.description = description || product.description;
  product.price = price || product.price;
  product.category = category || product.category;
  product.quantity = quantity || product.quantity;
  product.brand = brand || product.brand;
  product.color = color || product.color;
  product.size = size || product.size;
  product.weight = weight || product.weight;
  product.dimensions = dimensions || product.dimensions;

  // Update images if new images were uploaded
  if (uploadedImages.length > 0) {
    product.images = uploadedImages;
  }
  await product.save();

  res.status(200).json({
    success: true,
    message: "Product updated successfully",
    product,
  });
});

exports.deleteProduct = catchAsyncError(async (req, res, next) => {
  const productId = req.params.id;
  const product = await Product.findOneAndDelete({ _id: productId });

  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }

  // Delete images from Cloudinary
  const imagePublicIds = product.images.map((image) => image.public_id);
  if (imagePublicIds.length > 0) {
    await Promise.all(
      imagePublicIds.map(async (publicId) => {
        await cloudinary.v2.uploader.destroy(publicId);
      })
    );
  }

  res.status(200).json({
    success: true,
    message: "Product deleted successfully",
  });
});

exports.getSellerProducts = catchAsyncError(async (req, res, next) => {
  const sellerId = req.params.sellerId; // Assuming the seller's ID is passed as a URL parameter

  // Find all products associated with the specified seller
  const products = await Product.find({ seller: sellerId });

  res.status(200).json({
    success: true,
    count: products.length,
    data: products,
  });
});

exports.createProductReview = catchAsyncError(async (req, res, next) => {
  
  const { rating, comment } = req.body;
  const { id } = req.params;
  
  const review = {
    user: req.user._id,
    name: req.user.username,
    rating: Number(rating),
    comment,
  };

  
  const product = await Product.findById(id);

  
  const isReviewed = product.reviews.find(
    (rev) => rev.user.toString() === req.user._id.toString()
  );

  
  if (isReviewed) {
    
    product.reviews.forEach((rev) => {
      if (rev.user.toString() === req.user._id.toString()) {
        rev.rating = rating;
        rev.comment = comment;
      }
    });
  } else {
    
    product.reviews.push(review);
    product.noOfReviews = product.reviews.length;
  }

  
  let avg = 0;
  product.reviews.forEach((rev) => {
    avg += rev.rating;
  });
  product.ratings = avg / product.reviews.length;

  
  await product.save({
    validateBeforeSave: false,
  });

  
  res.status(200).json({
    success: true,
    message: "Review added Successfully",
  });
});


exports.getAllRevirews = catchAsyncError(async (req, res, next) => {
  const { productId } = req.params;
  const product = await Product.findById(productId).populate('reviews.user');
  if (!product) {
      return next(new ErrorHandler("product not found", 404))
  }
  res.status(200).json({
      success: true,
      reviews: product.reviews
  })
})


// Controller method to get products by category
exports.getProductsByCategory = catchAsyncError(async (req, res, next) => {
  const { categoryId } = req.params;

  // Validate category existence
  const category = await Category.findById(categoryId);
  if (!category) {
    return next(new ErrorHandler('Category not found', 404));
  }

  // Find products in the specified category
  const products = await Product.find({ category: categoryId }).populate('category seller');

  res.status(200).json({
    success: true,
    categoryProductData: products,
    categoryName: category.name,
  });
});