const Joi = require('joi');
const { objectId } = require('./custom.validation');

const getMenu = {
  params: Joi.object().keys({
    storeId: Joi.string().custom(objectId),
  }),
};
const getItemById={
  params:Joi.object().keys({
    storeId:Joi.string().custom(objectId),
    itemId:Joi.string().custom(objectId),
  })
}
const getCategory = {
  params: Joi.object().keys({
    storeId: Joi.string().custom(objectId),
  }),
};
const getFilteredMenu = {
  params: Joi.object().keys({
    storeId: Joi.string().custom(objectId),
  }),
  query: Joi.object().keys({
    foodCategory: Joi.string(),
  }),
};
const searchMenu = {
  params: Joi.object().keys({
    storeId: Joi.string().custom(objectId),
  }),
  query: Joi.object().keys({
    text: Joi.string(),
  }),
};

module.exports = {
  getMenu,
  getCategory,
  getFilteredMenu,
  searchMenu,
  getItemById
};
