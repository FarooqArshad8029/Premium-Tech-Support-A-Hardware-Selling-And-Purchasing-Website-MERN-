const express = require('express');
const {registration, sellerRegistration, verifyEmailToken, login, refresh_Token, getMyprofile, logout, getUserById, deleteUserById, getAllUsers, banSellerAccount, updateProfile, changePassword, getAdminAnalytics, getSellerDetailsbyId,getBannedSellers ,updateUserProfile , sendResetCode, verifyResetCodeAndUpdatePassword,sendContactUsEmail} = require('../controllers/user');
const { isAuthenticated, authorizeRole } = require('../middleware/auth');

const router = express.Router();

router.route('/register').post(registration);
router.route('/seller-register').post(sellerRegistration);
router.route('/verify-email').get(verifyEmailToken); // Route for verifying email
router.route('/login').post(login);
router.route('/send-reset-code').post(sendResetCode);
router.route('/verify-reset-code').post(verifyResetCodeAndUpdatePassword);
router.route('/refresh-token').post(refresh_Token);
router.route('/contactUs').post( isAuthenticated ,sendContactUsEmail);

// router.route('/contactUs', sendContactUsEmail);
router.route('/me').get( isAuthenticated ,getMyprofile);
router.route('/change-password').post(isAuthenticated, changePassword);
router.route('/user/update').put(isAuthenticated, updateProfile);
router.route('/user/profile/update').put(isAuthenticated, updateUserProfile);
router.route('/logout').get(logout);
router.route('/users').get(isAuthenticated, authorizeRole(["admin"]), getAllUsers);
router.route('/user/:userId').get(getUserById).delete(isAuthenticated, authorizeRole(["admin"]), deleteUserById);
router.route('/ban-seller/:sellerId').put(isAuthenticated, authorizeRole(["admin"]), banSellerAccount);
router.route('/admin/analytics').get(isAuthenticated, authorizeRole(["admin"]), getAdminAnalytics);
router.route('/seller/:id').get(getSellerDetailsbyId);
router.route('/banned-sellers').get(getBannedSellers);
module.exports = router;
