const { catchAsyncError } = require("../middleware/catchAsyncError");
const Category = require("../models/Category");
const getDataUri = require("../utils/dataUri");
const cloudinary = require("cloudinary").v2;
const ErrorHandler = require("../utils/errorHandler");

exports.createCategory = catchAsyncError(async (req, res, next) => {
  const { name } = req.body;
  if (!req.file) {
    return next(new ErrorHandler("Please upload an image", 400));
  }
  // Convert uploaded image to data URI
  const dataUri = getDataUri(req.file);
  const result = await cloudinary.uploader.upload(dataUri.content);

  // Check if category with the same name already exists
  const existingCategory = await Category.findOne({ name });
  if (existingCategory) {
    return next(new ErrorHandler("Category already exists", 400));
  }

  // Create new category with image URL from Cloudinary
  const category = new Category({
    name,
    image: {
      public_id: result.public_id,
      url: result.secure_url,
    },
  });

  // Save category to database
  await category.save();

  // Return success response
  return res.status(201).json({
    success: true,
    message: "Category created successfully",
    category,
  });
});

exports.getAllCategory = catchAsyncError(async (req, res, next) => {
  const category = await Category.find();

  res.status(200).json({
    success: true,
    category,
  });
});

exports.getCategoryById = catchAsyncError(async (req, res, next) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    return next(new ErrorHandler("Category not found", 404));
  }
  res.status(200).json({
    success: true,
    singleData: category,
  });
});

exports.updateCategory = catchAsyncError(async (req, res, next) => {
  let category = await Category.findById(req.params.id);
  if (!category) {
    return next(new ErrorHandler("Category not found", 404));
  }

  // Store the public ID of the previous image, if it exists
  let previousPublicId = null;
  if (category.image) {
    previousPublicId = category.image.public_id;
  }

  // If a new image is uploaded, update image URL
  if (req.file) {
    const dataUri = getDataUri(req.file);
    const result = await cloudinary.uploader.upload(dataUri.content);
    category.image = {
      public_id: result.public_id,
      url: result.secure_url,
    };
  }

  // Update category name if provided in request body
  if (req.body.name) {
    category.name = req.body.name;
  }

  // Save the updated category
  await category.save();

  // Delete the previous image from Cloudinary, if it exists
  if (previousPublicId) {
    await cloudinary.uploader.destroy(previousPublicId);
  }

  // Return the updated category in the response
  res.status(200).json({
    success: true,
    message: "Category updated successfully",
    category
  });
});




exports.deleteCategory = catchAsyncError(async (req, res, next) => {
  const categoryId = req.params.id;
  const category = await Category.findByIdAndDelete(categoryId);

  if (!category) {
    return next(new ErrorHandler("Category not found", 404));
  }

  // Delete category from Cloudinary
  await cloudinary.uploader.destroy(category.image.public_id);

  res.status(200).json({
    success: true,
    message: "Category deleted successfully",
  });
});
