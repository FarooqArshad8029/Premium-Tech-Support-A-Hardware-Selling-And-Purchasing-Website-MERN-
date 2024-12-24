const mongoose = require("mongoose");
const bcrypt = require('bcrypt');
const crypto = require('crypto'); // Add this if you're generating tokens
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      select: false,
      required: true,
    },
    isSeller: {
      type: Boolean,
      default: false,
    },
    role: {
        type: String,
        enum: ["admin", "user", "seller"],
        default: "user"
    },
    sellerInfo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
    },
    refreshToken: {
        type: String,
        default: null
    },
    verificationToken: String, // Field to store verification token
    verificationTokenExpires: Date, // Field to store token expiration
    resetCode: String, // Field to store reset pin code
    resetCodeExpires: Date, // Field to store reset pin code expiration
  },
  {
    timestamps: true,
  }
);

userSchema.pre('save', async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

userSchema.methods.comparePassword = async function(password){
    return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateVerificationToken = function() {
  const token = crypto.randomBytes(20).toString('hex');
  this.verificationToken = token;
  this.verificationTokenExpires = Date.now() + 3600000; // Token expires in 1 hour
  return token;
};

userSchema.methods.generateResetCode = function() {
  const code = Math.floor(1000 + Math.random() * 9000).toString(); // Generate a 4-digit reset code
  this.resetCode = code;
  this.resetCodeExpires = Date.now() + 10 * 60 * 1000; // Code expires in 10 minutes
  return code;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
