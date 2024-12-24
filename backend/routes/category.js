const express = require("express");
const { isAuthenticated, authorizeRole } = require("../middleware/auth");
const { singleUpload } = require("../middleware/multer");
const {
  createCategory,
  getAllCategory,
  getCategoryById,
  updateCategory,
  deleteCategory,
} = require("../controllers/category");

const router = express.Router();

// Create a new category
router
  .route("/category/create")
  .post(
    isAuthenticated,
    authorizeRole(["admin", "seller"]),
    singleUpload,
    createCategory
  );

// Get all categories
router
  .route("/categories")
  .get(getAllCategory);

// Get category by ID
router
  .route("/category/:id")
  .get(isAuthenticated, authorizeRole(["admin", "seller"]), getCategoryById);

// Update category by ID
router
  .route("/category/:id/update")
  .put(
    isAuthenticated,
    authorizeRole(["admin", "seller"]),
    singleUpload,
    updateCategory
  );

// Delete category by ID
router
  .route("/category/:id/delete")
  .delete(isAuthenticated, authorizeRole(["admin", "seller"]), deleteCategory);

module.exports = router;
