const Joi = require('joi');
const { objectId } = require('./custom.validation');

const getStore = {
  params: Joi.object().keys({
    storeId: Joi.string().custom(objectId),
    tableId:Joi.string()
  }),
};

module.exports = {
  getStore,
};
