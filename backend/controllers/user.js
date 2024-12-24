const { catchAsyncError } = require("../middleware/catchAsyncError");
const Seller = require("../models/Seller");
const User = require("../models/User");
const ErrorHandler = require("../utils/errorHandler");
const { sendVerificationEmail } = require("../utils/nodemailer");
const { generateVerificationToken } = require("../utils/token");
const jwt = require("jsonwebtoken");
const Category = require("../models/Category");
const Product = require("../models/Product");
const Containers = require("../models/BidContainer");
const mongoose = require('mongoose');
const Order = require("../models/Order");
const crypto = require('crypto');
const {sendEmail} = require('../utils/nodemailer'); 
const {sendContactUsEmail} = require('../utils/nodemailer'); 

exports.registration = catchAsyncError(async (req, res, next) => {
  const { username, email, password, confirmPassword } = req.body;

  if (!username || !email || !password || !confirmPassword) {
    return next(new ErrorHandler("All fields are required", 400));
  }
  if (password !== confirmPassword) {
    return next(new ErrorHandler("Passwords do not match", 400));
  }
  let user = await User.findOne({ $or: [{ username }, { email }] });
  if (user) {
    return next(new ErrorHandler("User already exists", 409));
  }

  user = new User({
    username,
    email,
    password,
  });
  await user.save();
  res.status(201).json({
    success: true,
    message: "Account has been created successfully",
  });
});

// Controller to handle verifying reset code and updating password
exports.verifyResetCodeAndUpdatePassword = async (req, res) => {
  const { email, resetCode, newPassword, confirmNewPassword  } = req.body;
    const user = await User.findOne({ email });
    if (!user || user.resetCode !== resetCode) {
      return res.status(400).json({ message: 'Invalid reset code or email.' });
    }
    if (user.resetCodeExpires < Date.now()) {
      return res.status(400).json({ message: 'Reset code has expired.' });
    }
    user.password = newPassword; 
    user.resetCode = undefined;
    user.resetCodeExpires = undefined;
    await user.save();
    res.status(200).json({ message: 'Password has been reset successfully.' });
};
exports.sendResetCode = async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User with this email does not exist.' });
    }
    const resetCode = Math.floor(1000 + Math.random() * 9000).toString();
    user.resetCode = resetCode;
    user.resetCodeExpires = Date.now() + 10 * 60 * 1000; // Expires in 10 minutes
    await user.save();

    const message = `Your password reset code is ${resetCode}. It will expire in 10 minutes.`;
    await sendEmail({
      to: user.email,
      subject: 'Password Reset Code',
      text: message,
    });
    res.status(200).json({ message: 'Reset code sent to your email.' });
};

exports.sendContactUsEmail = async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ message: 'All fields are required.' });
  }
  await sendContactUsEmail({
    to: 'premium.tech9990@gmail.com',
    subject: `Contact Us Message from ${name}`,
    text: message,
  });
    res.status(200).json({ message: ' Email Sent Successfully.' });
  
};

exports.sellerRegistration = catchAsyncError(async (req, res, next) => {
  const {
    username,
    email,
    password,
    companyName,
    companyDescription,
    address,
    phoneNumber,
    confirmPassword,
  } = req.body;

  // Check if any required field is empty
  if (
    !username ||
    !email ||
    !password ||
    !confirmPassword ||
    !companyName ||
    !companyDescription ||
    !address
  ) {
    return next(new ErrorHandler("All fields are required", 400));
  }

  // Check if the passwords match
  if (password !== confirmPassword) {
    return next(new ErrorHandler("Passwords do not match", 400));
  }

  let existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new ErrorHandler("Email already in use", 409));
  }

  // Check if the username already exists
  existingUser = await User.findOne({ username });
  if (existingUser) {
    return next(new ErrorHandler("Username already in use", 409));
  }

  // Check if the seller already exists
  existingUser = await User.findOne({ $or: [{ username }, { email }] });
  if (existingUser) {
    return next(new ErrorHandler("Seller already exists", 409));
  }

  // Create a new user
  const user = new User({
    username,
    email,
    password,
    isSeller: true,
    role: "seller",
  });

  // Generate verification token
  const verificationToken = generateVerificationToken();
  // Save verification token to user
  user.verificationToken = verificationToken;
  user.verificationTokenExpires = Date.now() + 3600000; // Token expires in 1 hour

  // Save the user to the database
  await user.save();

  // Create a new seller
const seller = new Seller({
    user: user._id,
    companyName,
    companyDescription,
    address,
    phoneNumber,
  });

  // Save the seller to the database
  await seller.save();

  // Update user's sellerInfo
  user.sellerInfo = seller._id;
  await user.save();

  // Send verification email
  await sendVerificationEmail(email, verificationToken);

  res.status(201).json({
    success: true,
    message:
      "Seller registered successfully and Please Check your Email for Verification",
  });
});

exports.verifyEmailToken = catchAsyncError(async (req, res, next) => {
  const { token } = req.query;

  // Verify the token
  if (!token) {
    return next(new ErrorHandler("Token is Missing", 400));
  }

  // Find user by verification token
  const user = await User.findOne({
    verificationToken: token,
    verificationTokenExpires: { $gt: Date.now() },
  });
  if (!user) {
    return next(new ErrorHandler("Invalid or expired token", 400));
  }

  // Update isVerified field of the associated seller
  const seller = await Seller.findOneAndUpdate(
    { user: user._id },
    { isVerified: true },
    { new: true }
  );
  if (!seller) {
    return next(new ErrorHandler("Seller not found", 404));
  }

  // Clear verification token fields
  user.verificationToken = undefined;
  user.verificationTokenExpires = undefined;
  await user.save();

  res
    .status(200)
    .json({ success: true, message: "Email verification successful" });
});

exports.login = catchAsyncError(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email) {
    return next(new ErrorHandler("Please enter the email", 400));
  }

  if (!password) {
    return next(new ErrorHandler("Please enter the password", 400));
  }

  const user = await User.findOne({ email }).select("+password").populate('sellerInfo');

  if (!user) {
    return next(new ErrorHandler("Incorrect email or password", 401));
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return next(new ErrorHandler("Incorrect email or password", 401));
  }

  if (user.isSeller && user.sellerInfo && user.sellerInfo.isBanned) {
    return next(new ErrorHandler("Your seller account is banned", 403));
  }

  // Create token data
  const tokenData = {
    _id: user._id,
    email: user.email,
  };

  // JWT Token
  const accessToken = jwt.sign(tokenData, process.env.JWT_SECRET, {
    expiresIn: "15d",
  });

  // Refresh Token
  const refreshToken = jwt.sign(tokenData, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "30d",
  });

  // Save refreshToken in the user model
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  const accessTokenOptions = {
    expires: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // Set the cookie expiration time to 15 days from now
    // httpOnly: true, // Make the cookie accessible only through HTTP(S) requests, not JavaScript
    // secure: true, // Send the cookie only over secure (HTTPS) connections
    // sameSite: "none", // Allow cross-site requests to include the cookie (required for third-party authentication)
  };
  const refreshTokenOptions = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    // httpOnly: true,
    // secure: true,
    // sameSite: "none",
  };

  res.cookie("access_token", accessToken, accessTokenOptions);
  res.cookie("refresh_token", refreshToken, refreshTokenOptions);

  return res.status(200).json({
    message: "Login successfully",
    user,
    accessToken,
    refreshToken,
  });
});

exports.refresh_Token = catchAsyncError(async (req, res, next) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return next(new ErrorHandler("Refresh Token is required", 400));
  }

  const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  const user = await User.findById(decoded._id);

  if (!user || user.refreshToken !== refreshToken) {
    return next(new ErrorHandler("Invalid Refresh Token", 400));
  }

  const newToken = jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "15d" }
  );

  res.status(200).json({
    success: true,
    accessToken: newToken,
  });
});

exports.getMyprofile = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id).populate({
    path: "sellerInfo",
    populate: [
      { path: "products", populate: { path: "category seller" } },
      { path: "orders", populate: { path: "products.product user seller" } },
      { path: "containers", populate: { path: "category seller" } }, 

    ],
  });
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }
  res.status(200).json({
    success: true,
    user,
  });
});

exports.logout = catchAsyncError(async (req, res, next) => {
  // Clear cookies and send response
  res
    .status(200)
    .clearCookie("access_token", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    })
    .clearCookie("refresh_token", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    })
    .json({
      success: true,
      message: "Logout Successfully",
    });
});

exports.getAllUsers = catchAsyncError(async (req, res, next) => {
  const user = await User.find({}).populate("sellerInfo");

  res.status(200).json({
    success: true,
    data: user,
  });
});

exports.getUserById = catchAsyncError(async (req, res, next) => {
  const { userId } = req.params;
  const user = await User.findById(userId).populate("sellerInfo");
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }
  res.status(200).json({
    success: true,
    user,
  });
});

// Delete user by ID
exports.deleteUserById = catchAsyncError(async (req, res, next) => {
  const { userId } = req.params;
  const deletedUser = await User.findByIdAndDelete(userId);
  if (!deletedUser) {
    return next(new ErrorHandler("User not found", 404));
  }

  // Delete associated seller info
  await Seller.findOneAndDelete({ user: userId });

  res.status(200).json({
    success: true,
    message: "User and associated seller info deleted successfully",
  });
});

// Controller to ban a seller account by admin
// exports.banSellerAccount = catchAsyncError(async (req, res, next) => {
//   const { sellerId } = req.params;

//   // Find the seller by ID
//   const seller = await Seller.findById(sellerId);
//   if (!seller) {
//     return next(new ErrorHandler("Seller not found", 404));
//   }

//   // Check if the seller account is already banned
//   if (seller.isBanned) {
//     return next(new ErrorHandler("Seller account is already banned", 400));
//   }

//   // Update the isBanned field to true
//   seller.isBanned = true;
//   await seller.save();

//   res.status(200).json({
//     success: true,
//     message: "Seller account banned successfully",
//   });
// });




// Controller to ban a seller account by admin
exports.banSellerAccount = async (req, res, next) => {
  const { sellerId } = req.params;

  try {
    // Find the seller by ID
    const seller = await Seller.findById(sellerId);
    if (!seller) {
      return res.status(404).json({ success: false, message: 'Seller not found' });
    }

    // Check if the seller account is already banned
    if (seller.isBanned) {
      return res.status(400).json({ success: false, message: 'Seller account is already banned' });
    }

    // Set isBanned flag to true
    seller.isBanned = true;
    await seller.save();

    // Begin a session to ensure atomicity
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Remove all associated products
      await Product.deleteMany({ _id: { $in: seller.products } }, { session });

      // Remove all associated orders
      await Order.deleteMany({ seller: seller._id }, { session });

      await session.commitTransaction();
      session.endSession();

      return res.status(200).json({ success: true, message: 'Seller account banned successfully' });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.updateProfile = catchAsyncError(async (req, res, next) => {
  const userId = req.user._id; // Assuming user ID is stored in the request object
  const {
    username,
    email,
    companyName,
    companyDescription,
    address,
    phoneNumber,
    website,
  } = req.body;

  // Check if the username already exists
  if (username) {
    const existingUser = await User.findOne({ username: username });
    if (existingUser && existingUser._id.toString() !== userId.toString()) {
      return next(new ErrorHandler("Username already exists", 400));
    }
  }

  // Check if the email already exists
  if (email) {
    const existingEmail = await User.findOne({ email: email });
    if (existingEmail && existingEmail._id.toString() !== userId.toString()) {
      return next(new ErrorHandler("Email already exists", 400));
    }
  }

  // Update user information
  let user = await User.findById(userId);
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  if (username) {
    user.username = username;
  }
  if (email) {
    user.email = email;
  }

  await user.save();

  // Update seller information
  let seller = await Seller.findOne({ user: userId });
  if (!seller) {
    return next(new ErrorHandler("Seller not found", 404));
  }

  if (companyName) {
    seller.companyName = companyName;
  }
  if (companyDescription) {
    seller.companyDescription = companyDescription;
  }
  if (address) {
    seller.address = address;
  }
  if (phoneNumber) {
    seller.phoneNumber = phoneNumber;
  }
  if (website) {
    seller.website = website;
  }

  await seller.save();

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    user,
    seller,
  });
});


exports.updateUserProfile = catchAsyncError(async (req, res, next) => {
  const userId = req.user._id; // Assuming user ID is stored in the request object
  const {
    username,
    email,
  } = req.body;

  // Check if the username already exists
  if (username) {
    const existingUser = await User.findOne({ username: username });
    if (existingUser && existingUser._id.toString() !== userId.toString()) {
      return next(new ErrorHandler("Username already exists", 400));
    }
  }

  // Check if the email already exists
  if (email) {
    const existingEmail = await User.findOne({ email: email });
    if (existingEmail && existingEmail._id.toString() !== userId.toString()) {
      return next(new ErrorHandler("Email already exists", 400));
    }
  }

  // Update user information
  let user = await User.findById(userId);
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  if (username) {
    user.username = username;
  }
  if (email) {
    user.email = email;
  }

  await user.save();

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    user
  });
});



exports.changePassword = catchAsyncError(async (req, res, next) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;

  // Check if oldPassword, newPassword, and confirmPassword are provided
  if (!oldPassword || !newPassword || !confirmPassword) {
    return next(new ErrorHandler("Please enter all fields", 400));
  }

  // Check if newPassword and confirmPassword match
  if (newPassword !== confirmPassword) {
    return next(
      new ErrorHandler("New password and confirm password do not match", 400)
    );
  }

  const user = await User.findById(req.user._id).select("+password");

  // Check if the old password matches the user's current password
  const isMatch = await user.comparePassword(oldPassword);
  if (!isMatch) {
    return next(new ErrorHandler("Incorrect old password", 400));
  }

  // Update the user's password
  user.password = newPassword;
  await user.save();

  res.status(200).json({
    success: true,
    message: "Password changed successfully",
  });
});

// get admin analytics

exports.getAdminAnalytics = catchAsyncError(async (req, res, next) => {
  const totalProducts = await Product.countDocuments();
  const totalUsers = await User.countDocuments();
  const totalCategories = await Category.countDocuments();
  const totalBannedSellers = await Seller.countDocuments({ isBanned: true });

  res.status(200).json({
    totalProducts,
    totalUsers,
    totalCategories,
    totalBannedSellers,
  });
});

exports.getSellerDetailsbyId = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  // Find the seller by ID and populate their associated user and products
  const seller = await Seller.findById(id).populate({
    path: 'user',
    populate: {
      path: 'sellerInfo',
    },
  }).populate({
    path: 'products',
    populate: [
      { path: 'category' },
      { path: 'seller' } 
    ]
  });
  if (!seller) {
    return next(new ErrorHandler("Seller Not Found", 404));
  }
  res.status(200).json({ success: true, seller });
});

exports.getBannedSellers = catchAsyncError(async (req, res, next) => {

  const bannedSellers = await Seller.find({ isBanned: true }).populate({
    path: 'user',
    populate: {
      path: 'sellerInfo',
    },
  }).populate({
    path: 'products',
    populate: [
      { path: 'category' },
      { path: 'seller' } 
    ]
  });
  if (!bannedSellers || bannedSellers.length === 0) {
    return next(new ErrorHandler("No banned sellers found", 404));
  }

  res.status(200).json({
    success: true,
    bannedSellers,
  });
});

