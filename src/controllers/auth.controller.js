const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { authService, userService, tokenService, emailService, customerService, messageService } = require('../services');
const ApiError = require('../utils/ApiError');

/**
 * Register new user
 */
const register = catchAsync(async (req, res) => {
  let { userData } = req;
  // Verify whether the customer has already logged in.
  const isCustomerExist = await customerService.getCustomerByFirebaseId(userData.firebaseId);
  if (isCustomerExist) return res.status(httpStatus.CREATED).send({ customer: isCustomerExist });
  // Verify whether the user data includes a first name
  if (!userData?.firstName) {
    const { firstName } = req.body;
    userData['firstName'] = firstName;
  }
  // Create new customer
  const newCustomer = await authService.RegisterNewUser(userData);
  // Send response
  res.status(httpStatus.CREATED).send({ customer: newCustomer });
});

const handleUserAuthentication = catchAsync(async (req, res) => {
  const customer = await customerService.getCustomerByPhoneNumber(req.body.phone);
  const otp = Math.floor(1000 + Math.random() * 9000);
  if (customer) {
    console.log('Found Customer', customer);
    const updatedCustomer = await customerService.updateCustomerOtp(customer, otp);
    res.status(httpStatus.FOUND).send({ updatedCustomer });
  } else {
    console.log('No customer in the database');
    const newCustomer = await customerService.createCustomer(req.body.phone, otp);
    await messageService.sendOTP(req.body.phone, otp);
    res.status(httpStatus.CREATED).send({ newCustomer });
  }
});

const verifyOtp = catchAsync(async (req, res) => {
  const { phone, otp } = req.body;
  const customer = await customerService.getCustomerByPhoneNumber(phone);
  if (!customer) throw new ApiError(httpStatus.NOT_FOUND, 'No customer available with this phone number');
  if (customer.otp === otp) {
    const tokens = await tokenService.generateAuthTokens(customer);
    res.status(httpStatus.OK).send({ message: 'otp match', tokens });
  } else {
    res.status(httpStatus.UNAUTHORIZED).send({ message: 'otp does not match' });
  }
});

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const user = await authService.loginUserWithEmailAndPassword(email, password);
  const tokens = await tokenService.generateAuthTokens(user);
  res.send({ user, tokens });
});

const logout = catchAsync(async (req, res) => {
  await authService.logout(req.body.refreshToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const refreshTokens = catchAsync(async (req, res) => {
  const tokens = await authService.refreshAuth(req.body.refreshToken);
  res.send({ ...tokens });
});

const forgotPassword = catchAsync(async (req, res) => {
  const resetPasswordToken = await tokenService.generateResetPasswordToken(req.body.email);
  await emailService.sendResetPasswordEmail(req.body.email, resetPasswordToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const resetPassword = catchAsync(async (req, res) => {
  await authService.resetPassword(req.query.token, req.body.password);
  res.status(httpStatus.NO_CONTENT).send();
});

const sendVerificationEmail = catchAsync(async (req, res) => {
  const verifyEmailToken = await tokenService.generateVerifyEmailToken(req.user);
  await emailService.sendVerificationEmail(req.user.email, verifyEmailToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const verifyEmail = catchAsync(async (req, res) => {
  await authService.verifyEmail(req.query.token);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  register,
  login,
  logout,
  refreshTokens,
  forgotPassword,
  resetPassword,
  sendVerificationEmail,
  verifyEmail,
  handleUserAuthentication,
  verifyOtp,
};
