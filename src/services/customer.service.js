const httpStatus = require('http-status');
const { Customer } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Get Customer by id
 * @param {ObjectId} id
 * @returns {Promise<Customer>}
 */
const getCustomerById = async (id) => {
  return Customer.findById(id);
};

/**
 * Get Customer by phone number
 * @param {string} phone
 * @returns {Promise<Customer>}
 */
const getCustomerByPhoneNumber = async (phone) => {
  return Customer.findOne({ phone });
};

/**
 * Get Customer by firebase Id
 * @param {String} firebaseId
 * @returns {Promise}
 */
const getCustomerByFirebaseId = async (firebaseId) => {
  return await Customer.findOne({ firebaseId });
};

/**
 * Create Customer by phone number and OTP
 * @param {string} phone
 * @param {string} otp
 * @returns {Promise<Customer>}
 */
const createCustomer = async (phone, otp) => {
  const customer = await getCustomerByPhoneNumber(phone);
  if (customer) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Phone number already taken');
  } else {
    const newCustomer = await Customer.create({ phone, otp });
    return newCustomer;
  }
};

/**
 * Update Customer OTP
 * @param {object} customer
 * @param {string} newOtp
 * @returns {Promise<Customer>}
 */
const updateCustomerOtp = async (customer, newOtp) => {
  const customerToUpdate = customer;
  customerToUpdate.otp = newOtp;
  await customerToUpdate.save();

  return customer;
};

module.exports = { getCustomerById, getCustomerByPhoneNumber, createCustomer, updateCustomerOtp, getCustomerByFirebaseId };
