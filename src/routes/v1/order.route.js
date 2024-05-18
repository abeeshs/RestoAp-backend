/* eslint-disable no-unused-expressions */
const express = require('express');

const router = express.Router();
const { orderValidation } = require('../../validations');
const { decodeToken } = require('../../middlewares/firebase-auth');
const { orderController } = require('../../controllers');
const validate = require('../../middlewares/validate');

router.use(decodeToken);

router.route('/').post(orderController.createOrder);
router.route('/:orderId').patch(orderController.updateOrderStatus);
router.route('/:orderId/update-all').patch(orderController.updateAllItemStatus);
router.route('/:orderId/:productId').patch(orderController.updateOrderItemStatus);
// router.route('/store/:storeid').post(validate(orderValidation.createOrder), orderController.createOrder);
router.route('/allOrders').get(orderController.getAllOrder);
router.route('/current-order/:storeId').get(validate(orderValidation.currentOrder), orderController.getCurrentOrder);
router.route('/payment/:orderId').get(validate(orderValidation.payment), orderController.orderPayment);

module.exports = router;
