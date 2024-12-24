const ErrorHandler = require("../utils/errorHandler");
const jwt = require("jsonwebtoken");
const { catchAsyncError } = require("./catchAsyncError");
const User = require("../models/User");

exports.isAuthenticated = catchAsyncError(async (req, res, next) => {
  const { access_token } = req.cookies;
  if (!access_token) {
    return next(new ErrorHandler("Not logged in", 401));
  }

  const decoded = jwt.verify(access_token, process.env.JWT_SECRET);
  req.user = await User.findById(decoded._id);
  next();
});

exports.authorizeRole = (authorizedRoles) => {
    return (req, res, next) => {
      if (!req.user) {
        return next(new ErrorHandler("Not logged in", 401));
      }
  
      if (!authorizedRoles.includes(req.user.role)) {
        return next(new ErrorHandler("Unauthorized", 403));
      }
  
      next();
    };
  };
