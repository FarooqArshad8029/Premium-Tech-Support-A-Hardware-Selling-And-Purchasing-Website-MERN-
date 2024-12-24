const express = require("express");
const { isAuthenticated, authorizeRole } = require("../middleware/auth");
const {
  createBidContainer,
  updateBidContainer,
  deleteBidContainer,
  getContainerById,
  getAllContainers,
  placeBid,
  fetchBids,
} = require("../controllers/container");
const { multipleUpload } = require('../middleware/multer');
const router = express.Router();

router
  .route("/container/create")
  .post(
    isAuthenticated,
    authorizeRole(["admin", "seller"]),
    multipleUpload,
    createBidContainer
  );

router.route('/containers').get(getAllContainers);

router
.route('/container/:id')
.get(getContainerById);

router
  .route("/container/:id/update")
  .put(
    isAuthenticated,
    authorizeRole(["admin", "seller"]),
    multipleUpload,
    updateBidContainer
  );

router
  .route("/container/:id/delete")
  .delete(
    isAuthenticated,
    authorizeRole(["admin", "seller"]),
    deleteBidContainer
  );

router
  .route("/container/:id/place-bid")
  .post(isAuthenticated, placeBid);

  router
  .route("/container/:id/fetch-bids")
  .get(isAuthenticated, fetchBids);

module.exports = router;
