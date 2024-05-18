const { Payment } = require('../models');

const createPayment = async (paymentData) => {
  console.log(paymentData);
  return await Payment.create(paymentData);
};

module.exports = { createPayment };
