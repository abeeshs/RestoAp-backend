/* eslint-disable no-case-declarations */
const crypto = require('crypto');
const { orderService, paymentService } = require('../index');
const config = require('../../config/config');
const stripe = require('../../config/stripe');
const { createPayment } = require('../payment.service');
const ApiError = require('../../utils/ApiError');

const handleWebHookRequest = async (req, next) => {
  const endpointSecret = config.stripe.stripeWebhookSecret;
  const sig = req.headers['stripe-signature'];
  let data;
  let eventType;
  let event;
  // const rawBody = Buffer.from(JSON.stringify(req.body), 'base64').toString('utf8')

  try {
    event = stripe.webhooks.constructEvent(req.body.toString(), sig, endpointSecret);
  } catch (error) {
    throw next(new ApiError(400, `verification failed${error}`));
  }

  if (event) {
    data = event.data.object;
    eventType = event.type;
  }

  // check the event type
  switch (eventType) {
    case 'payment_intent.succeeded':
      const customer = await stripe.customers.retrieve(data.customer);
      const { metadata, email } = customer;
      const { orderid, userid, storeid } = metadata;
      // eslint-disable-next-line camelcase
      const { amount_received, id } = data;
      const updateOrderPaymentStatus = async () => orderService.paymentSuccess(orderid);
      const createNewPayment = async () =>
        createPayment({
          orderId: orderid,
          paymentId: id,
          totalAmount: Number(amount_received) / 100,
          paymentType: 'app',
          recievedBy: email,
          cashierName: '',
          storeId: storeid,
          paymentMethod: 'card',
          paymentMeta: metadata,
          card: Number(amount_received) / 100,
          upi: 0,
          cash: 0,
        });
      await Promise.all([updateOrderPaymentStatus(), createNewPayment()]);
      break;
    default:
      console.log(`Unhandled event type ${eventType}`);
  }
  return event;
};

module.exports = { handleWebHookRequest };
