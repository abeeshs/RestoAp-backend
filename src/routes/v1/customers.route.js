const express = require('express');
const passport = require('passport');
const { jwtStrategy } = require('../../config/passport');
const { decodeToken } = require('../../middlewares/firebase-auth');
const validate = require('../../middlewares/validate');
const { menuController, orderController, customerController } = require('../../controllers');
const { orderValidation, menuValidation, storeValidation } = require('../../validations');

const router = express.Router();

// router.use(decodeToken);
// passport.use('jwt', jwtStrategy);

router.get('/something', (req, res) => {
  console.log('Header in request', req.headers);
  console.log({ userData: req.userData });
  res.send('Hi');
});

router.route('/store/:storeId/:tableId').get(validate(storeValidation.getStore), menuController.getStoreById);
router.route('/categories/:storeId').get(validate(menuValidation.getCategory), menuController.getCategories);
router.route('/menuItems/:storeId').get(validate(menuValidation.getMenu), menuController.getMenuList);
router.route('/menuItems/item/:storeId/:itemId').get(validate(menuValidation.getItemById),menuController.getItemById)
router.route('/menuItems/filter/:storeId').get(validate(menuValidation.getFilteredMenu), menuController.filterMenuItems);
router.route('/menuItems/search/:storeId').get(validate(menuValidation.searchMenu), menuController.searchMenuItems);
router.use(decodeToken);
router.route('/order/:storeid').post(validate(orderValidation.createOrder), orderController.createOrder);
router.route('/user-detail').get(customerController.getUserData);

module.exports = router;
