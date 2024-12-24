const BidContainer = require("../models/BidContainer"); 
const Bid = require("../models/Bid"); 
const User = require("../models/User"); 
const Seller = require("../models/Seller");
const Category = require("../models/Category");
const getDataUri = require("../utils/dataUri");
const cloudinary = require("cloudinary");
const { catchAsyncError } = require("../middleware/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");

exports.createBidContainer = catchAsyncError(async (req, res, next) => {
  console.log("req.files:", req.files); 
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: 'No files uploaded' });
  }
  const imagePromises = req.files.map(async (file) => {
    const dataUri = getDataUri(file);
    const result = await cloudinary.v2.uploader.upload(dataUri.content);
    return { public_id: result.public_id, url: result.secure_url };
  });
  const images = await Promise.all(imagePromises);
  try {
    const {
      title,
      description,
      startingPrice,
      category,
      endTime,
    } = req.body;
    const newBidContainer = new BidContainer({
      title,
      description,
      startingPrice,
      category,
      images,
      endTime,
      seller: req.user._id
    });

    await newBidContainer.save();

    await Seller.findOneAndUpdate(
    { user: req.user._id },
    { $push: { containers: newBidContainer._id } }, 
    { new: true } 
    );

    res.status(201).json({ success: true, message: 'Bid container created successfully', data: newBidContainer });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
  });

  exports.getContainerById = async (req, res, next) => {
  try {
    const containerId = req.params.id;
    const container = await BidContainer.findById(containerId)
      .populate({
        path: 'seller',
        populate: {
          path: 'sellerInfo',
        },
      })
      .populate('category');

    if (!container) {
      return next(new ErrorHandler("No Container found with that ID", 404));
    }
    res.status(200).json({
      success: true,
      data: container,
      singalData: { container },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

exports.getAllContainers = catchAsyncError(async (req, res, next) => {
  const containers = await BidContainer.find({})
    .populate({
      path: "category", 
    })
    .populate({
      path: "seller",
      populate: { path: "sellerInfo" },
    });
  res.status(200).json({
    success: true,
    data: containers,
  });
  });

exports.updateBidContainer = async (req, res, next) => {
  try {
    const { title, description, startingPrice, endTime } = req.body;
    console.log("updateBidContainer controller feteched data- req.body:",req.body)

    console.log("updateBidContainer controller feteched data:",{ title, description, startingPrice, endTime })
    let bidContainer = await BidContainer.findById(req.params.id);
    if (!bidContainer) {
      return next(new ErrorHandler("container not found", 404));    }

    let uploadedImages = [];
  if (req.files && req.files.length > 0) {
    const imagePromises = req.files.map(async (file) => {
      const fileUri = getDataUri(file);
      const mycloud = await cloudinary.v2.uploader.upload(fileUri.content);
      return { public_id: mycloud.public_id, url: mycloud.url };
    });
    uploadedImages = await Promise.all(imagePromises);
  }
    bidContainer.title = title || bidContainer.title;
    bidContainer.description = description || bidContainer.description;
    bidContainer.startingPrice = startingPrice || bidContainer.startingPrice;
    bidContainer.endTime = endTime || bidContainer.endTime;
    if (uploadedImages.length > 0) {
    bidContainer.images = uploadedImages;
    }
    await bidContainer.save();
  
    res.status(200).json({ success: true, message: 'Bid container updated successfully', bidContainer });
   } catch (error) {
      res.status(500).json({ message: 'Server Error', error: error.message });
   }
  };

// Delete a bid container by ID
exports.deleteBidContainer = async (req, res,next) => {
  try {
    const bidContainer = await BidContainer.findByIdAndDelete(req.params.id);
    if (!bidContainer) {
      return next(new ErrorHandler("Bid container not found", 404))
    }
    await Bid.deleteMany({ bidContainer: req.params.id }); // Delete all associated bids
    res.status(200).json({ success: true, message: 'Bid container deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Place a bid on a bid container
exports.placeBid = catchAsyncError(async (req, res, next) => {
    const { amount } = req.body;
    const bidContainerId = req.params.id;
    console.log("bidContainerId in place bid:", bidContainerId);
    console.log("amount in place bid:", amount);
    const bidContainer = await BidContainer.findById(bidContainerId);
    console.log("bidContainer:", bidContainer);

    if (!bidContainer) {
      return next(new ErrorHandler("Bid container not found", 404))
    }
    if (Date.now() > bidContainer.endTime) {
      return next(new ErrorHandler("Bidding period has ended", 404))
    }
    if (amount <= bidContainer.startingPrice) {
      return next(new ErrorHandler("Bid amount must be higher than the starting price", 404))
    }

    const highestBid = await Bid.findOne({ bidContainer: bidContainerId })
      .sort({ amount: -1 }) 
      .select('amount'); 
    const currentHighestBid = highestBid ? highestBid.amount : bidContainer.startingPrice;
    if (amount <= currentHighestBid) {
      return next(new ErrorHandler(`Bid amount must be higher than the current highest bid of $${currentHighestBid}`, 404))
    }

    const newBid = new Bid({
      amount,
      user: req.user._id, 
      bidContainer: bidContainerId,
    });
    console.log("newBid:", newBid);
    await newBid.save();
    bidContainer.highestBid = newBid.amount;
    await bidContainer.save();

    res.status(201).json({
      success: true,
      message: 'Bid placed successfully',
      data: {
        bid: newBid,
        containerId: bidContainerId,
        highestBid: newBid.amount, 
    }});
 
});


// Fetch bids for a specific container
exports.fetchBids = catchAsyncError(async (req, res, next) => {
  const  id  = req.params.id;
  const containerId = id;
  console.log("id fromm params:",id)

  try {
    // Find bids associated with the given container ID
    const bids = await Bid.find({ bidContainer : id })
      .populate('user', 'username') 
      .sort({ createdAt: -1 }); 
console.log("Fetch Bids data:",bids)
const highestBid = bids.length > 0 ? Math.max(...bids.map(bid => bid.amount)) : 0;
console.log("highestBid:",highestBid)


    if (!bids) {
      return next(new ErrorHandler("No bids found for this container", 404))
    }
    res.status(200).json({  success: true,message: 'Bid Fetched successfully', data: { bids, highestBid ,containerId} });
  } catch (error) {
    console.error(error);
    return next(new ErrorHandler("Server error while fetching bids.", 500))

  }
});
