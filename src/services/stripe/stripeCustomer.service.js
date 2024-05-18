const stripe = require('../../config/stripe');

const createStripeCustomer = async ({ id, orderid, storeid }) => {
  const customer = await stripe.customers.create({
    metadata: {
      userid: id.toString(),
      orderid: orderid.toString(),
      storeid: storeid.toString(),
    },
  });
  return customer;
};

module.exports = { createStripeCustomer };
