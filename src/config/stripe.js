const Stripe = require('stripe');
const config = require('./config');

const stripe = Stripe(config.stripe.stripeSecret);

module.exports = stripe;
