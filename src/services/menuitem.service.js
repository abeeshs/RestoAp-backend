const { MenuItem, Category, AddOns } = require('../models');
const mongoose = require('mongoose');

/**
 * @param {ObjectId} storeId
 * @returns {Array}
 */
const getAllCategories = async (storeId) => {
  return await Category.find({ store: storeId, active: true });
};

/**
 * An array of IDs is used to get the menu item
 * @param {ObjectId} productIds
 * @returns {Array}
 */
const getMenuItemFromArrayofId = async (productIds) => {
  return await MenuItem.find({ _id: { $in: productIds } }).lean();
};
/**
 *
 * @param {ObjectId} storeId
 * @returns  {Array}
 */

const getAllMenu = async (storeId) => {
  const menus = await MenuItem.aggregate([
    {
      $match: {
        storeId: mongoose.Types.ObjectId(storeId),
        Active: true,
      },
    },
    {
      $lookup: {
        from: 'categories',
        localField: 'category',
        foreignField: '_id',
        as: 'result',
      },
    },
    // {
    //   $lookup: {
    //     from: 'addOns',
    //     localField: 'addOns',
    //     foreignField: '_id',
    //     as: 'addOns',
    //   },
    // },
    {
      $group: {
        _id: '$categoryName',
        items: {
          $push: {
            ingredientWarnings: '$ingredientWarnings',
            featured: '$featured',
            images: '$images',
            videos: '$videos',
            relatedSocialMedia: '$relatedSocialMedia',
            storeId: '$storeId',
            name: '$name',
            description: '$description',
            shortDescription: '$shortDescription',
            offerPrice: '$offerPrice',
            price: '$price',
            size: '$size',
            taxInclude: '$taxInclude',
            taxCategory: '$taxCategory',
            preparationTime: '$preparationTime',
            availability: '$availability',
            createdAt: '$createdAt',
            updatedAt: '$updatedAt',
            id: '$_id',
            nutrition: '$nutrition',
            category: '$category',
            foodCategory: '$foodCategory',
            variants: '$variants',
          },
        },
      },
    },
  ]);

  await AddOns.populate(menus, { path: 'addOns', select: 'name price' });

  return menus;
};

/**
 * @param {ObjectId} storeId
 * @return {array}
 */

const getFilteredMenuItems = async (store, options) => {
  const items = await MenuItem.paginate(store, options);
  console.log(items);
  if (!items) {
    throw new ApiError(httpStatus.NOT_FOUND, 'item not found');
  }
  return items;
};

/**
 *
 * @param {ObjectId} storeId
 * @param {*} searchText
 * @returns {Array} search result
 */

const getSearchMenuItems = async (storeId, searchText) => {
  const condition1 = { name: { $regex: searchText, $options: 'i' } };
  const condition2 = { categoryName: { $regex: searchText, $options: 'i' } };
  return await MenuItem.find({ storeId, $or: [condition1, condition2] });
};

/**
 *
 * @param {ObjectId} storeId
 * @param {ObjectId} itemId
 * @returns {Object}  result
 */

const getMenuItemById = async (storeId, itemId) => {
  const result = await MenuItem.findOne({ storeId, _id: itemId });
  console.log(result);
  return result;
};

module.exports = {
  getMenuItemFromArrayofId,
  getAllMenu,
  getMenuItemById,
  getAllCategories,
  getFilteredMenuItems,
  getSearchMenuItems,
};
