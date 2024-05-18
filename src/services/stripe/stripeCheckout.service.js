const { menuitemSevice } = require('..');
const config = require('../../config/config');
const stripe = require('../../config/stripe');

/**
 * Create checkout session
 * @param {Object}
 * @returns {Promise<stripe>}
 */
const createCheckoutSession = async ({ customer, order, destinationAccId }) => {
  // Create product list
  const line_items = [
    {
      price_data: {
        currency: 'inr',
        product_data: {
          name: 'items',
        },
        unit_amount: Number(order?.finalBillAmount) * 100,
      },
      quantity: 1,
    },
  ];

  // Create payment intent for transfer money to restaurant
  const payment_intent_data = {
    transfer_data: {
      destination: destinationAccId,
    },
    setup_future_usage: 'off_session',
  };

  // Create checkout session
  const session = await stripe.checkout.sessions.create(
    {
      mode: 'payment',
      payment_method_types: ['card'],
      line_items,
      payment_intent_data,
      success_url: `${config.clientUrl}/payment-success`,
      cancel_url: `${config.clientUrl}/payment-failed`,
      customer: customer.id,
    },
    {
      apiKey: config.stripe.stripeSecret,
    }
  );
  return session;
};

/**
 * Create payment intent for conncected accounts
 */

const createStripeIntent = async ({ orderData, store, customer }) => {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: orderData.amount,
    currency: 'inr',
    customer,
    payment_method: ['card'],
    confirm: true,
    transfer_data: {
      amount: orderData.amount,
      destination: store.stripeAccountId,
    },
  });
  return paymentIntent;
};

module.exports = { createCheckoutSession, createStripeIntent };
