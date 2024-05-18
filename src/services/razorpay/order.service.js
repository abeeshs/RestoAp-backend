const instance = require('../../config/razorpay-config');
const ApiError = require('../../utils/ApiError');

/**
 * Create Order
 */
const createOrder = async ({ amount, account = 'acc_MWmZBN2kbSCDBx', orderId, customerId }, next) => {
  console.log({amount})
  const orderData = {
    amount: `${parseInt(amount)}00`,
    currency: 'INR',
    transfers: [
      {
        account,
        amount: `${parseInt(amount)}00`,
        currency: 'INR',
        on_hold: 0,
      },
    ],
    notes: {
      orderId,
      customerId,
    },
  };

  try {
    const order = await instance.orders.create(orderData);
    return order;
  } catch (error) {
    console.log({ error: error });
    throw next(new ApiError(400, error?.error?.description));
  }
};

module.exports = { createOrder };
