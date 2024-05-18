const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const addOnSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      trim: true,
    },
    variants: {
      type: Object,
      trim: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
addOnSchema.plugin(toJSON);
addOnSchema.plugin(paginate);

/**
 * @typedef Category
 */
const AddOns = mongoose.model('AddOn', addOnSchema);

module.exports = AddOns;
