const express = require('express');
const { createProduct, getAllProducts, getProductById, updateProduct, deleteProduct, getSellerProducts, getAllSellersProfilesAndProducts, createProductReview, getAllRevirews, getProductsByCategory } = require('../controllers/product');

const { isAuthenticated, authorizeRole } = require('../middleware/auth');
const { multipleUpload } = require('../middleware/multer');

const router = express.Router();

router.route('/product/create').post(isAuthenticated,authorizeRole(["admin", "seller"]),multipleUpload ,createProduct);
router.route('/product').get(getAllProducts);
router.route('/product/:id').get(getProductById).put(isAuthenticated,authorizeRole(["admin", "seller"]),multipleUpload , updateProduct).delete(isAuthenticated,authorizeRole(["admin", "seller"]) , deleteProduct);
router.route('/product/:id/review').put(isAuthenticated, createProductReview);
router.route('/product/:productId/reviews')
.get(getAllRevirews);
router.route('/seller/:sellerId/products').get(getSellerProducts);
router.route('/seller/products').get(getAllSellersProfilesAndProducts);
router.route('/products/category/:categoryId').get(getProductsByCategory);
module.exports = router;
