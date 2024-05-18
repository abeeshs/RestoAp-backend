const { getMenuItemFromArrayofId } = require('./menuitem.service');
const { Order } = require('../models');
const ApiError = require('../utils/ApiError');
const { getAddOnsFromArrayOfId } = require('./addons.service');
const { getTableById } = require('./table.service');
const { razorpayService } = require('.');
const mongoose = require('mongoose');

/**
 * Fetch all orders which is not completed by userId and storeId
 *
 */
const getNotCompletedOrderByUserId = async (userId, storeId, status = 'open') => {
  return Order.find({ customerId: userId, storeId: storeId, orderStatus: status });
};
/**
 * Find the totalAmount of product
 */
const findProductTotalAmount = async ({ orderItems, productIds, items, storeId }, next) => {
  // If no product IDs are provided, return default values.
  if (!productIds?.length) {
    return { productTotalAmount: 0, totalDiscount: 0, totalAmountWithTax: 0 };
  }

  // Retrieve menu item data from the database using the provided IDs.
  const products = await getMenuItemFromArrayofId(productIds);

  // If no matching menu items are found in the database, throw an error.
  if (!products.length) {
    throw next(new ApiError(400, 'Menu items not found. Please choose different ones.'));
  }

  // Initialize variables to track total amount with tax and total discount.
  let totalAmountWithTax = 0;
  let totalDiscount = 0;

  // Calculate the total amount for menu items using reduce.
  const productTotalAmount = items.reduce((sum, item, index) => {
    // Find the selected menu item based on item ID.
    const product = products.find((data) => item?.itemId == data?._id);

    // If the menu item is not available in the selected store, throw an error.
    if (product.storeId[0].toString() !== storeId.toString()) {
      throw next(new ApiError(400, `${product.name} is not available in the store.`));
    }

    // If the item is not found, skip it.
    if (!item) return sum;

    // Initialize an empty object in the orderItems array for this item.
    orderItems[index] = {};

    // Populate order item data for this item.
    orderItems[index].name = product.name;
    orderItems[index].itemId = product._id;
    orderItems[index].quantity = item.quantity || 1;
    orderItems[index].note = item.note || '';

    // Check if there is a variant selected for this item.
    const variantName = item.variant || null;

    // If a variant is selected, find and assign its details.
    if (variantName) {
      const variant = product.variants.find((data) => data.name === variantName);

      // If the variant is not found, throw an error.
      if (!variant) {
        throw next(new ApiError(400, `${product.name} does not have ${variantName} variant`));
      }

      // Assign variant details to the order item.
      orderItems[index].variant = {
        variantName,
        price: variant.offerPrice || variant.price,
      };

      // Update the menu item's price with the variant price.
      product.price = variant.price;
      product.offerPrice = variant.offerPrice;
    }

    // Assign base and final prices for the item.
    orderItems[index].basePrice = product.price;
    const itemDiscount = product.price - product.offerPrice || 0;
    const total = product.offerPrice || product.price;
    const quantity = orderItems[index].quantity;
    orderItems[index].itemTotalDiscount = itemDiscount * quantity;
    orderItems[index].finalPrice = total * quantity;
    orderItems[index].isVeg = product.foodCategory === 'Veg';
    orderItems[index].kitchen = product.kitchen;
    orderItems[index].categoryDetails = { category: product.categoryName };

    // Calculate total discount and total amount with tax.
    totalDiscount += orderItems[index].itemTotalDiscount;
    if (product.taxInclude) {
      totalAmountWithTax += orderItems[index].finalPrice;
    }

    // Accumulate the final price to the sum
    return sum + orderItems[index].finalPrice;
  }, 0);

  return { productTotalAmount, totalDiscount, totalAmountWithTax };
};

/**
 * find addons total amount
 */
const findAddOnsTotalAmount = async ({ addonsData, addons, addonsIds }, next) => {
  if (!addons?.length) return 0;
  const addonsDataFromdb = await getAddOnsFromArrayOfId(addonsIds);
  if (!addonsDataFromdb.length) throw next(new ApiError(400, 'addons not found. Pick a different one.'));
  const addOnsTotalAmount = addonsDataFromdb.reduce((sum, addon, index) => {
    const item = addons.find((data) => data?.addonId == addon.id);
    if (!item) return sum;
    addonsData[index] = {};
    addonsData[index].addonId = addon._id;
    addonsData[index].quantity = item.quantity || 1;
    addonsData[index].note = item.note || '';
    addonsData[index].name = addon.name;
    const variantName = item.variant || null;
    if (variantName) {
      variant = addon.variants.find((data) => data.name === variantName);
      if (!variant) throw next(new ApiError(400, `${addon.name} does not have ${variantName} variant`));
      addonsData[index].variant = {
        variantName,
        price: variant.price,
      };
      addon.price = variant.price;
    }
    addonsData[index].basePrice = addon.price;
    addonsData[index].finalPrice = addon.price * addonsData[index].quantity;
    return sum + addonsData[index].finalPrice;
  }, 0);
  return addOnsTotalAmount;
};

const calculateAdditionalCharge = (amount, diningCategoryAdditionalCharge = 0) => {
  const percentage = diningCategoryAdditionalCharge / 100;
  return amount * percentage;
};

const calculateTax = (amount, taxIncludedItemAmount = 0, taxRate = 0) => {
  const percentage = taxRate / 100;
  const amountWithoutTaxIncludedItem = amount - taxIncludedItemAmount;
  return amountWithoutTaxIncludedItem * percentage;
};

const calculateParcelCharge = (amount, parcelCharge = 0, orderType, mainOrderParcelCharge) => {
  if (orderType !== 'take_away') {
    return 0;
  }
  const percentage = parcelCharge / 100;
  const newSuborderParcelCharge = amount * percentage;
  return newSuborderParcelCharge + mainOrderParcelCharge;
};

const calculateTotalOrderAmount = (amount, parcelCharge = 0, tax = 0, additionalCharge = 0) => {
  return amount + parcelCharge + tax + additionalCharge;
};

/**
 * Create Order
 */
const createOrder = async (
  { user, store, table, items, addons, isSelfOrder = true, orderType = 'dining', KotAndBillNumber },
  next
) => {
  const productIds = items?.map((data) => data?.itemId);
  const addonsIds = addons?.map((data) => data?.addonId);
  const orderItems = [];
  const addonsData = [];

  // ========execute both processes in parallel=========
  const [totalMenuitemsAmount] = await Promise.all([
    findProductTotalAmount({ orderItems, productIds, items, storeId: store._id }, next),
  ]);

  if (!orderItems.length) throw next(new ApiError(400, 'Product not exist.'));

  // =========create sub order=============
  const kotNumber = 'KOT' + (KotAndBillNumber[0].kotNo / 10000).toFixed(4).split('.')[1];

  const suborder = {
    kotNumber,
    addons: addonsData,
    orderItems,
    orderType,
    createdAt: new Date(Date.now()),
    totalMenuitemsAmount: totalMenuitemsAmount.productTotalAmount,
    totalAppliedDiscount: totalMenuitemsAmount.totalDiscount,
    subordersTotalPrice: totalMenuitemsAmount.productTotalAmount,
    isSelfOrder,
  };

  // Destructure the dineCategory.
  const { dineCategory } = table;

  const diningCategoryAdditionalCharge = dineCategory.additionalCharge;

  const additionalCharge = calculateAdditionalCharge(suborder.subordersTotalPrice, diningCategoryAdditionalCharge);
  const taxRate = store.taxRate;
  const tax = calculateTax(suborder.subordersTotalPrice, totalMenuitemsAmount.totalAmountWithTax, taxRate);
  const parcelChargeInPercentage = store.parcelCharge;
  const parcelCharge = calculateParcelCharge(suborder.subordersTotalPrice, parcelChargeInPercentage, orderType);
  const totalBillAmount = calculateTotalOrderAmount(suborder.subordersTotalPrice, parcelCharge, tax, additionalCharge);

  const finalBillAmount = totalBillAmount.toFixed(0);
  const roundoffAmount = finalBillAmount - totalBillAmount;

  // Extract the first two letters of the store name to create an order number prefix.
  const prefix = store.name.slice(0, 2).toUpperCase();
  // Create a new order data instance.
  const order = new Order({
    charges: {
      tax: tax.toFixed(2),
      additionalCharge: {
        name: dineCategory.name,
        amount: additionalCharge.toFixed(2),
        percentage: diningCategoryAdditionalCharge || 0,
      },
      appliedDiscount: suborder.totalAppliedDiscount,
      taxIncludeItemTotalPrice: totalMenuitemsAmount.totalAmountWithTax,
      parcelCharge: parcelCharge.toFixed(2),
    },
    orderNumber: prefix + ((KotAndBillNumber[0].orderNo / 10000 + 1 || 1) + 1).toFixed(4).split('.')[1],
    storeId: store._id,
    storeName: store.name,
    tableNo: table.name,
    tableId: table._id,
    customerName: user.firstName,
    customerId: user._id,
    subtotalBillAmount: suborder.subordersTotalPrice,
    roundoffAmount: roundoffAmount.toFixed(2),
    finalBillAmount,
    grossAmount:totalBillAmount,
    currency: store.currency,
    subOrders: [suborder],
  });

  // Save the order data to the database and return the result.
  return order.save();
};

/**
 * Add suborders
 */
const addSubOrders = async ({ mainOrder, user, store, items, addons, isSelfOrder = true, orderType = 'dining' }, next) => {
  const productIds = items?.map((data) => data?.itemId);
  const addonsIds = addons?.map((data) => data?.addonId);
  const orderItems = [];
  const addonsData = [];

  console.log({ mainOrder });

  // ========execute both processes in parallel=========
  const [totalMenuitemsAmount] = await Promise.all([
    findProductTotalAmount({ orderItems, productIds, items, storeId: store._id }),
  ]);

  if (!orderItems.length) throw next(new ApiError(400, 'Product not exist.'));

  if (!mainOrder) throw next(new ApiError(400, 'Choose the right order since there is no other way.'));

  // =========create sub order=============
  const suborder = {
    addons: addonsData,
    orderItems,
    orderType,
    createdAt: new Date(Date.now()),
    totalMenuitemsAmount: totalMenuitemsAmount.productTotalAmount,
    totalAppliedDiscount: totalMenuitemsAmount.totalDiscount,
    subordersTotalPrice: totalMenuitemsAmount.productTotalAmount,
    isSelfOrder,
  };

  // Calculate subtotal bill amount by adding the main order's subtotal and suborder's total.
  const subtotalBillAmount = mainOrder.subtotalBillAmount + suborder.subordersTotalPrice;

  // Extract charges and discounts from the main order.
  const {
    _id: orderId,
    charges: {
      additionalCharge: { amount, percentage: additionalChargePercentage, name: additionalChargeName },
      appliedDiscount,
      taxIncludeItemTotalPrice,
      parcelCharge: mainOrderParcelCharge,
    },
  } = mainOrder;

  // const additionalCharge = subtotalBillAmount * ((amount || 100) / 100);
  const additionalCharge = calculateAdditionalCharge(subtotalBillAmount, additionalChargePercentage);
  const taxIncludedItemAmount = taxIncludeItemTotalPrice + totalMenuitemsAmount.totalAmountWithTax;
  const taxRate = store.taxRate;
  const tax = calculateTax(subtotalBillAmount, taxIncludedItemAmount, taxRate);
  const parcelChargeInPercentage = store.parcelCharge;
  const parcelCharge = calculateParcelCharge(
    suborder.subordersTotalPrice,
    parcelChargeInPercentage,
    orderType,
    mainOrderParcelCharge
  );
  const totalBillAmount = calculateTotalOrderAmount(subtotalBillAmount, parcelCharge, tax, additionalCharge);

  // Calculate the total discount by summing applied discounts from both mainOrder and suborder.
  const discount = (appliedDiscount || 0) + suborder.totalAppliedDiscount;

  // Construct the charges object with tax, appliedDiscount, and additionalCharge.
  const charges = {
    tax: tax.toFixed(2),
    appliedDiscount: discount,
    taxIncludeItemTotalPrice: taxIncludedItemAmount,
    additionalCharge: {
      amount: additionalCharge.toFixed(2),
      name: additionalChargeName,
      percentage: additionalChargePercentage,
    },
    parcelCharge: parcelCharge.toFixed(2),
  };

  // Calculate the final bill amount by adding the subtotal and tax.
  const finalBillAmount = totalBillAmount.toFixed(0);
  const roundoffAmount = finalBillAmount - totalBillAmount;
  // Update the order with the new suborder and charges.
  const order = await Order.findByIdAndUpdate(
    mainOrder._id,
    {
      subtotalBillAmount,
      charges,
      finalBillAmount,
      grossAmount:totalBillAmount,
      roundoffAmount: roundoffAmount.toFixed(2),
      $push: { subOrders: suborder },
    },
    { new: true }
  );

  // Return the updated order with added suborders.
  return order;
};

/**
 * Fetch all orders by user id
 */
const getOrdersByUserId = async (userId) => {
  return Order.find({ customerId: userId, orderStatus: 'completed' }).sort({ updatedAt: -1 }).populate('store');
};

/**
 * Fetch current order by userId and storeId
 *
 */
const getCurrentOrderByUserId = async (userId, storeId, status = 'open') => {
  //liveOrder?.paymentDetails?.status
  return Order.findOne({
    customerId: userId,
    storeId: storeId,
    orderStatus: status,
    'paymentDetails.status': { $ne: 'success' },
  });
};

/** find order using orderid
 */
const getOrderByOrderId = async (id) => await Order.findById(id);

/**
 * Update Order using order id
 */
const updateOrderbyId = async (orderId, updatedBody) => {
  return Order.findByIdAndUpdate(orderId, updatedBody, { new: true });
};

/**
 * Update order
 */
const udpateOrder = async (find, update) => {
  return Order.findOneAndUpdate(find, update, { new: true });
};

/**
 * Update Order Status
 * @returns
 */
const updateOrderStatus = async ({ orderId, status }) => {
  return await updateOrderbyId(orderId, { orderStatus: status });
};

/**
 * Update order items status
 */
const updateOrderItemsStatus = async ({ orderId, itemId, status }) => {
  return await udpateOrder({ _id: orderId, 'items._id': itemId }, { $set: { 'items.$.status': status } });
};

/**
 * Update Payment Status
 * @param {String} id - order id
 *
 */
const paymentSuccess = async (id) => {
  const order = await Order.findByIdAndUpdate(
    id,
    { paymentDetails: { status: 'success', paymentType: 'app' } },
    { new: true }
  );
  if (!order) return next(new ApiError(400, 'Invalid order data'));

  const notCompletedOrder = order.subOrders.find((data) => data.orderStatus !== 'completed');
  if (!notCompletedOrder) await Order.findOneAndUpdate({ _id: order.id }, { orderStatus: 'completed' });
  return 'success';
};

/**
 * Update all item status
 * @param {*} param0
 * @returns
 */
const udpateallItemsStatus = async ({ orderId, status }) => {
  return await updateOrderbyId(orderId, { $set: { 'items.$[].status': status } });
};

const getOrderAndKotNumber = async (storeId) => {
  const aggregationPipeline = [
    {
      $match: {
        storeId: mongoose.Types.ObjectId(storeId),
      },
    },
    {
      $facet: {
        totalCount: [{ $count: 'count' }],
        unwindAndCount: [{ $unwind: '$subOrders' }, { $count: 'count' }],
      },
    },
    {
      $project: {
        orderNo: { $arrayElemAt: ['$totalCount.count', 0] },
        kotNo: { $arrayElemAt: ['$unwindAndCount.count', 0] },
      },
    },
  ];
  return Order.aggregate(aggregationPipeline);
};
module.exports = {
  createOrder,
  paymentSuccess,
  updateOrderbyId,
  getOrderByOrderId,
  getOrderAndKotNumber,
  getNotCompletedOrderByUserId,
  updateOrderStatus,
  udpateOrder,
  addSubOrders,
  updateOrderItemsStatus,
  udpateallItemsStatus,
  getOrdersByUserId,
  getCurrentOrderByUserId,
};
