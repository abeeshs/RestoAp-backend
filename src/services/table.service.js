const { Table } = require('../models');

const getTableById = async (id) => Table.findById(id).populate('dineCategory');

module.exports = { getTableById };
