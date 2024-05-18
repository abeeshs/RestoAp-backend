const { AddOns } = require('../models');

const getAddOnsFromArrayOfId = async (addOnsIds) => {
  console.log(addOnsIds);
  return AddOns.find({ _id: { $in: addOnsIds } });
};

module.exports = { getAddOnsFromArrayOfId };
