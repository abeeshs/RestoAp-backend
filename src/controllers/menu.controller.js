const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { menuitemSevice, storeService } = require('../services');
const pick = require('../utils/pick');

/**
 *
 */

/**
 * Get Categories
 * GET /customer/categories/{{storeId}}
 */

const getCategories = catchAsync(async (req, res) => {
  const { storeId } = req.params;
  console.log(storeId);
  const categories = await menuitemSevice.getAllCategories(storeId);
  res.status(httpStatus.OK).json(categories);
});

/**
 * Get Menu Items
 * GET /customer/menuItems/{{storeId}}
 */

const getMenuList = catchAsync(async (req, res) => {
  const { storeId } = req.params;

  console.log(storeId);
  const items = await menuitemSevice.getAllMenu(storeId);
  res.status(httpStatus.OK).json(items);
});

/**
 * Get single item by item id
 * GET /customer/menuItems/item/{{storeId}}/{{itemId}}
 */
const getItemById = catchAsync(async (req, res) => {
  const { storeId, itemId } = req.params;
  console.log({storeId,itemId})
  const item  = await menuitemSevice.getMenuItemById(storeId, itemId);
  console.log(item)
  res.status(httpStatus.OK).json(item);
});

/**
 * Get Store details by id
 * GET /customer/store/{{storeId}}
 */
const getStoreById = catchAsync(async (req, res) => {
  const { storeId } = req.params;
  const { tableId } = req.params;
  console.log(storeId, tableId);
  const store = await storeService.getStoreAndTableDetails(storeId, tableId);
  res.status(200).json(store);
});

/**
 * Get filtered menuitems
 * GET customer/menuItems/filter/{{storeId}}?store
 */

const filterMenuItems = catchAsync(async (req, res) => {
  const store = pick(req.params, ['storeId']);
  const options = pick(req.query, ['foodCategory']);
  console.log(store, options);
  const items = await menuitemSevice.getFilteredMenuItems(store, options);
  console.log(items);
  res.status(httpStatus.OK).json(items);
});

/**
 * Search menu items
 * GET customer/menuItems/search/{{storeId}}?text
 */

const searchMenuItems = catchAsync(async (req, res) => {
  const { storeId } = req.params;
  const { text } = req.query;
  const searchResult = await menuitemSevice.getSearchMenuItems(storeId, text);
  console.log(searchResult);
  res.status(httpStatus.OK).json(searchResult);
});
module.exports = { getMenuList,getItemById, getStoreById, getCategories, filterMenuItems, searchMenuItems };
