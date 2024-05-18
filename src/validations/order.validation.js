const Joi = require('joi');
const { objectId } = require('./custom.validation');
const createOrder = {
  params: Joi.object().keys({
    storeid: Joi.string(),
  }),
  body: Joi.object().keys({
    items: Joi.array().items(
      Joi.object().keys({
        itemId: Joi.string().required(),
        qty: Joi.number().required(),
        size: Joi.string(),
        note: Joi.string(),
      })
    ),

    note: Joi.string(),
    tableId: Joi.string().required().custom(objectId),
    discount: Joi.number(),
    payment: Joi.object(),
    addOns: Joi.array(),
  }),
};

const payment = {
  params: Joi.object().keys({
    orderId: Joi.string(),
  }),
  body: Joi.object().keys({
    destinationAccId: Joi.string(),
  }),
};

const currentOrder = {
  params: Joi.object().keys({
    storeId: Joi.string().custom(objectId),
  }),
};

module.exports = { createOrder, payment,currentOrder };
