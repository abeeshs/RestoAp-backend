const httpStatus = require('http-status');
const { MenuItem } = require('../models');
const menuItem = require('../models/menuitem.model');
const { orderService, stripeService, razorpayService, storeService, tableService } = require('../services');
const catchAsync = require('../utils/catchAsync');
/**
 * Get all order by user
 * GET/order/allOrders
 */
const getAllOrder = catchAsync(async (req, res) => {
  const { _id } = req.userData;
  console.log(_id);
  const orders = await orderService.getOrdersByUserId(_id);
  res.status(httpStatus.OK).json(orders);
});
const ApiError = require('../utils/ApiError');
const instance = require('../config/razorpay-config');

/**
 * Get current order of user by userID
 * GET/order/current-order/:{{storeId}}
 */

const getCurrentOrder = catchAsync(async (req, res) => {
  const { _id } = req.userData;
  const { storeId } = req.params;
  let { status } = req.query;
  if (!status) status = { $ne: 'completed' };
  const order = await orderService.getNotCompletedOrderByUserId(_id, storeId, status);
  console.log({ order });
  res.status(httpStatus.OK).send(order);
});

/**
 * Create Order
 * POST /customer/orderr
 */
const createOrder = catchAsync(async (req, res, next) => {
  const user = req.userData;
  const {
    body: { storeId, tableId, items, addons, orderType },
  } = req;


  // check if store exist or not;
  const getStore = async () => storeService.getStoreDetailsUsingId(storeId);

  // get kot number and order number
  const getStoreKotAndBillNumber = async () => orderService.getOrderAndKotNumber(storeId);

  // check if table exist or not;
  const getTable = async () => tableService.getTableById(tableId);

  const [store, table, KotAndBillNumber] = await Promise.all([getStore(), getTable(), getStoreKotAndBillNumber()]);
  if (!table || !store) return next(new ApiError(404, 'invalid data'));

  const liveOrder = await orderService.getCurrentOrderByUserId(user._id, storeId);

  let order;
  if (!liveOrder) {
    // Create new order
    order = await orderService.createOrder(
      {
        user,
        orderType,
        store,
        table,
        items,
        addons,
        KotAndBillNumber,
      },
      next
    );
  } else {
    order = await orderService.addSubOrders({ mainOrder: liveOrder, user, store, items, addons, orderType }, next);
  }
  res.status(httpStatus.CREATED).send(order);
});

/**
 * Update order status
 * PATCH /order/waiter/:orderId
 */
const updateOrderStatus = catchAsync(async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;
  const order = await orderService.updateOrderStatus({ orderId, status });
  res.send(order);
});

/**
 * Update all item status
 * PATCH /order/status
 */
const updateAllItemStatus = catchAsync(async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;
  const order = await orderService.udpateallItemsStatus({ orderId, status });
  res.send(order);
});

/**
 * Update order items status
 * PATCH /order/kitchen/:orderId/:productId
 */
const updateOrderItemStatus = catchAsync(async (req, res) => {
  const { orderId, productId } = req.params;
  const { status } = req.body;
  const order = await orderService.updateOrderItemsStatus({ orderId, itemId: productId, status });
  res.send(order);
});

/**
 * Create Order
 * POST /customer/order/{{storeid}}
 */
const orderPayment = catchAsync(async (req, res, next) => {
  const { orderId } = req.params;
  const { _id } = req.userData;

  // Create new order
  const order = await orderService.getOrderByOrderId(orderId);

  if (!order) throw new ApiError(404, 'invalid order id');

  // Create stripe customer
  const createCustomer = async () =>
    stripeService.stripeCustomer.createStripeCustomer({
      id: _id,
      orderid: order._id,
      storeid: order.storeId,
    });

  const getStore = async () => storeService.getStoreDetailsUsingId(order.storeId);

  const [customer, store] = await Promise.all([createCustomer(), getStore()]);

  if (!store) return next(new ApiError(400, 'Invalid order data'));

  console.log({ store });

  if (!store.submerchantPaymentGatewayId) {
    return next(new ApiError(400, 'Online payment unavailable. Pay at counter.'));
  }

  // With Stripe client data, create a Stripe session.
  const session = await stripeService.stripeCheckout.createCheckoutSession({
    customer,
    order,
    destinationAccId: store.submerchantPaymentGatewayId,
  });

  // Respond by sending a session
  res.status(httpStatus.CREATED).send({ session });
});

// const orderPayment = catchAsync(async (req, res, next) => {
//   const { orderId } = req.params;
//   const { _id } = req.userData;
//   /**
//    * TODO: Update to get destination account from order data
//    */
//   const { destinationAccId } = req.body;

//   // Get order data
//   const order = await orderService.getOrderByOrderId(orderId);
//   const { totalAmount: amount } = order;

//   // Create razorpay order
//   const razorpayOrder = await razorpayService.order.createOrder(
//     {
//       amount,
//       account: destinationAccId,
//       orderId,
//       customerId: _id,
//     },
//     next
//   );

//   // Update order with razorpay order id
//   await orderService.updateOrderbyId(orderId, { razorpayOrder: razorpayOrder.id });

//   res.send(razorpayOrder);
// });

module.exports = {
  createOrder,
  updateOrderStatus,
  updateOrderItemStatus,
  updateAllItemStatus,
  getAllOrder,
  getCurrentOrder,
  orderPayment,
};
