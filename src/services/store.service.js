const { Store, Table } = require('../models');

/**
 * GET Store details by id
 * @param {string}
 * @returns {Promise}
 */

const getStoreAndTableDetails = async (storeId, tableId) => {
  try {
    console.log({storeId,tableId})
    const getStore = async () => await Store.findOne({_id:storeId,isActive:true,isQrOrderAwailable:true});
    const getTable = async () => await Table.findById(tableId).populate('dineCategory');
    const [store, table] = await Promise.all([getStore(), getTable()]);
    console.log({ table });
    return { store, table };
  } catch (err) {
    console.log(err);
  }
};

const getStoreDetailsUsingId = async (_id) => Store.findById(_id);

module.exports = {
  getStoreAndTableDetails,
  getStoreDetailsUsingId,
};
