const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
/**
 * Get user details for profile
 */
const getUserData = catchAsync(async (req, res) => {
  const { userData } = req;
  res.status(httpStatus.OK).json(userData);
});

module.exports = {
  getUserData,
};
