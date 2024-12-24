// utils/tokens.js

const crypto = require('crypto');

// Function to generate a random verification token
exports.generateVerificationToken = () => {
    return crypto.randomBytes(20).toString('hex');
};
