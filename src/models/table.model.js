const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const TableSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    storeId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'Store',
      trim: true,
    },
    dineCategory: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'DiningCategory',
      trim: true,
    },
  },
  { timestamps: true }
);

// add plugin that converts mongoose to json
TableSchema.plugin(toJSON);
TableSchema.plugin(paginate);

/**
 * @typedef TableCreation
 */

const Table = mongoose.model('Table', TableSchema);

module.exports = Table;
