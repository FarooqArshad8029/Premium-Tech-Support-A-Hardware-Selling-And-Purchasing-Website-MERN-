const express = require('express');
const {  updateCodOrderStatus, getOrdersBySeller, getOrdersByLocalUser, createOrder, adminGetAllOrders } = require('../controllers/order');
const { isAuthenticated, authorizeRole } = require('../middleware/auth');

const router  = express.Router();

router.route('/orders/create').post(isAuthenticated ,createOrder);
router.route('/orders/:orderId').put(isAuthenticated, authorizeRole(["admin","seller"]), updateCodOrderStatus);
router.route('/seller/orders').get(isAuthenticated, authorizeRole(["seller"]), getOrdersBySeller);
router.route('/admin/orders').get(isAuthenticated, authorizeRole(["admin"]), adminGetAllOrders);
router.route('/localuserorders').get(isAuthenticated, getOrdersByLocalUser);
module.exports = router;