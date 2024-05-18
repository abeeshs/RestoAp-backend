const { stripeService } = require('../services');
const catchAsync = require('../utils/catchAsync');
const stripe = require('../config/stripe');

/**
 * Handle Webhook Request
 * POST /webhooks
 */
const handleWebhook = catchAsync(async (req, res, next) => {
  // Handle webhook request
  const event = await stripeService.stripeWebhooks.handleWebHookRequest(req, next);

  // send response
  res.send();
});
module.exports = { handleWebhook };
