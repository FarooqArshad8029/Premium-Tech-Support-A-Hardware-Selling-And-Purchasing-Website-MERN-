const { catchAsyncError } = require("../middleware/catchAsyncError");
const Order = require("../models/Order");
const Product = require("../models/Product");
const Seller = require("../models/Seller");
const User = require("../models/User");

const ErrorHandler = require("../utils/errorHandler");

const stripe = require("stripe")(
  "sk_test_51OwuJi08Cuw4xRsEWJWYgpo2yxMsCMPwvJ9wSTO9qdDKkooYlhFgvkHgna2ewWKDKUW9bw4WHxdr7hXp746AtZoE004uEka5so"
);

exports.createOrder = catchAsyncError(async (req, res, next) => {
  const { products, totalPrice, shippingInfo, paymentMethod } = req.body;
  const userId = req.user._id;

  const adjustProductStock = async (products) => {
    for (const product of products) {
      const productDoc = await Product.findById(product._id);
      if (!productDoc) {
        throw new Error(`Product with ID ${product._id} not found`);
      }

      if (productDoc.quantity < product.quantity) {
        throw new Error(`Insufficient stock for product ${productDoc.name}`);
      }

      // productDoc.quantity -= product.quantity;
      // await productDoc.save();
    }
  };

  try {
    if (paymentMethod === "COD") {
      // Adjust stock for COD payment method
      await adjustProductStock(products);

      // Create a single order for the local user
      const localUserOrder = new Order({
        user: userId,
        products: products.map((product) => ({
          product: product._id,
          quantity: product.quantity,
        })),
        totalPrice,
        status: "Pending",
        shippingInfo,
        paymentMethod: "COD",
        localUserReceipt: true,
      });
      await localUserOrder.save();

      // Group products by seller
      const productsBySeller = {};
      products.forEach((product) => {
        const sellerId = product.seller.toString();
        if (!productsBySeller[sellerId]) {
          productsBySeller[sellerId] = [];
        }
        productsBySeller[sellerId].push(product);
      });

      // Create separate orders for each seller
      const orders = [];
      for (const sellerId in productsBySeller) {
        const sellerProducts = productsBySeller[sellerId];
        const sellerOrder = new Order({
          user: userId,
          seller: sellerId,
          products: sellerProducts.map((product) => ({
            product: product._id,
            quantity: product.quantity,
          })),
          totalPrice: sellerProducts.reduce(
            (total, product) => total + product.price ,
            0
          ),
          status: "Pending",
          shippingInfo,
          paymentMethod: "COD",
        });
        await sellerOrder.save();
        orders.push(sellerOrder);

        // Update seller's orders array
        await Seller.findOneAndUpdate(
          { user: sellerId },
          { $push: { orders: sellerOrder._id } },
          { new: true }
        );
      }

      res.status(201).json({
        success: true,
        message: "COD orders created successfully",
        localUserOrder,
        orders,
      });
    } else if (paymentMethod === "Stripe") {
      // Create a new Stripe checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: products.map((product) => ({
          price_data: {
            currency: "usd",
            product_data: {
              name: product.name,
              images: [product.images[0].url],
            },
            unit_amount: product.price * 100,
          },
          quantity: product.quantity,
        })),
        mode: "payment",
        success_url: "http://localhost:5173/success",
        cancel_url: "http://localhost:5173/cancel",
      });

      // Adjust stock for Stripe payment method
      await adjustProductStock(products);

      // Create a single order for the local user
      const localUserOrder = new Order({
        user: userId,
        products: products.map((product) => ({
          product: product._id,
          quantity: product.quantity,
        })),
        totalPrice,
        status: "Pending",
        shippingInfo,
        paymentMethod: "Stripe",
        localUserReceipt: true,
      });
      await localUserOrder.save();

      // Group products by seller
      const productsBySeller = {};
      products.forEach((product) => {
        const sellerId = product.seller.toString();
        if (!productsBySeller[sellerId]) {
          productsBySeller[sellerId] = [];
        }
        productsBySeller[sellerId].push(product);
      });

      // Create separate orders for each seller
      const orders = [];
      for (const sellerId in productsBySeller) {
        const sellerProducts = productsBySeller[sellerId];
        const sellerOrder = new Order({
          user: userId,
          seller: sellerId,
          products: sellerProducts.map((product) => ({
            product: product._id,
            quantity: product.quantity,
          })),
          totalPrice: sellerProducts.reduce(
            (total, product) => total + product.price * product.quantity,
            0
          ),
          status: "Pending",
          shippingInfo,
          paymentMethod: "Stripe",
        });
        await sellerOrder.save();
        orders.push(sellerOrder);

        // Update seller's orders array
        await Seller.findOneAndUpdate(
          { user: sellerId },
          { $push: { orders: sellerOrder._id } },
          { new: true }
        );
      }

      res.status(200).json({
        success: true,
        localUserOrder,
        orders,
        stripeCheckoutSession: session.url,
      });
    } else {
      // Invalid payment method
      return res.status(400).json({
        success: false,
        message: "Invalid payment method",
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});



// Update COD order status
// exports.updateCodOrderStatus = catchAsyncError(async (req, res, next) => {
//   const { orderId } = req.params;
//   const { status } = req.body;

//   // Find the order by ID
//   const order = await Order.findById(orderId);
//   if (!order) {
//     return next(new ErrorHandler("Order not found", 404));
//   }

//   // Update the status of the COD order
//   order.status = status;
//   await order.save();

//   res.status(200).json({
//     success: true,
//     message: "COD order status updated successfully",
//     order,
//   });
// });

exports.updateCodOrderStatus = catchAsyncError(async (req, res, next) => {
  const { orderId } = req.params;
  const { status, products } = req.body;

  // Find the order by ID
  const order = await Order.findById(orderId);
  if (!order) {
    return next(new ErrorHandler("Order not found", 404));
  }

  // Check if the status is being changed to "Delivered" for the first time
  const wasStatusComplete = order.status === 'Delivered';

  // Update the status of the order
  order.status = status;
  await order.save();

  // If the new status is "Complete" and it wasn't "Delivered" before, adjust the product quantity
  if (status === 'Delivered' && !wasStatusComplete) {
    for (const item of products) {
      const product = await Product.findById(item._id);
      if (product) {
        product.quantity -= item.quantity;
        await product.save();
      }
    }
  }

  res.status(200).json({
    success: true,
    message: "Order status updated successfully",
    order,
  });
});


// exports.updateCodOrderStatus = catchAsyncError(async (req, res, next) => {
//   const { orderId } = req.params;
//   const { status, products } = req.body;

//   // Find the order by ID
//   const order = await Order.findById(orderId);
//   if (!order) {
//     return next(new ErrorHandler("Order not found", 404));
//   }

//   // Check if the status is being changed to "Delivered" for the first time
//   const wasStatusDelivered = order.status === 'Delivered';

//   // Update the status of the order
//   order.status = status;
//   await order.save();

//   // If the new status is "Delivered" and it wasn't "Delivered" before, adjust the product quantity
//   if (status === 'Delivered' && !wasStatusDelivered) {
//     for (const item of products) {
//       if (item && item.product && item.product._id) {
//         const product = await Product.findById(item.product._id);
//         if (product) {
//           product.quantity -= item.quantity;
//           await product.save();
//         }
//       } 
//     }
//   }

//   // Check if all related seller orders for this local user's order are delivered
//   const localUserOrderId = order.localUserReceipt ? order._id : order.localUserReceipt;
//   const relatedSellerOrders = await Order.find({ localUserReceipt: localUserOrderId });
//   const allSellerOrdersDelivered = relatedSellerOrders.every(o => o.status === 'Delivered');

//   if (allSellerOrdersDelivered) {
//     // Find the local user's order and update its status to "Delivered"
//     const localUserOrder = await Order.findById(localUserOrderId);
//     if (localUserOrder) {
//       localUserOrder.status = 'Delivered';
//       await localUserOrder.save();
//     }
//   }

//   res.status(200).json({
//     success: true,
//     message: "Order status updated successfully",
//     order,
//   });
// });

exports.getOrdersBySeller = catchAsyncError(async (req, res, next) => {
  const userId = req.user._id; // Assuming userId is passed as a route parameter
  const seller = await User.findById(userId).populate("sellerInfo");
  if (!seller || !seller.isSeller) {
    return next(
      new ErrorHandler(`User with id ${userId} is not a Seller`, 403)
    );
  }
  const sellerId = seller.sellerInfo.user;
  const orders = await Order.find({ seller: sellerId })
    .populate("products")
    .populate("user");
  res.status(200).json({
    success: true,
    data: orders,
  });
});

// exports.getOrdersByLocalUser = catchAsyncError(async (req, res, next) => {
//     const userId = req.user._id;

//     // Find the user by ID
//     const user = await User.findById(userId);
//     if (!user) {
//         return next(new ErrorHandler("User not found", 404));
//     }

//     // Retrieve orders where localUserReceipt is true and user ID matches
//     const orders = await Order.find({ user: userId, localUserReceipt: true }).populate("products user");

//     res.status(200).json({
//         success: true,
//         data: orders
//     });
// });

exports.getOrdersByLocalUser = catchAsyncError(async (req, res, next) => {
  const userId = req.user._id;

  // Find the user by ID
  const user = await User.findById(userId);
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  // Retrieve orders where localUserReceipt is true and user ID matches
  const orders = await Order.find({ user: userId, localUserReceipt: true })
    
    .populate("user", "username email")
    .populate({
      path: "products.product",
      populate: [
        { path: "seller" },
  
      ],
    });
  
  res.status(200).json({
    success: true,
    data: orders,
  });
});



exports.adminGetAllOrders = catchAsyncError(async (req, res, next) => {
  const orders = await Order.find({localUserReceipt: false})
    .populate("user") // Populate user with selected fields
    .populate("seller") // Populate seller with selected fields
    .populate("products.product"); // Populate product within products

  res.status(200).json({
    success: true,
    adminOrdersData: orders,
  });
});
