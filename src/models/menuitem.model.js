const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const menuItemSchema = mongoose.Schema(
  {
    storeId: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Store',
      required: true,
    },

    category: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Category',
      required: true,
    },
    categoryName: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      trim: true,
    },
    foodCategory: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      trim: true,
    },
    price: {
      type: {
        value: {
          type: Number,
          required: true,
          trim: true,
        },
      },
      required: true,
    },
    addOns: [
      {
        type: String,
      },
    ],
    featured: {
      type: Boolean,
      default: false,
    },
    preparationTime: {
      type: String,
    },
    images: [{ type: mongoose.Schema.Types.Mixed }],
    videos: [{ type: mongoose.Schema.Types.Mixed }],
    relatedSocialMedia: [{ type: String }],
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
menuItemSchema.plugin(toJSON);
menuItemSchema.plugin(paginate);


/**
 * @typedef menuItem
 */

const menuItem = mongoose.model('MenuItem', menuItemSchema);

module.exports = menuItem;
