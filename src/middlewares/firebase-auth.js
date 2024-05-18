const httpStatus = require('http-status');
const admin = require('../config/firebase-config');
const { customerService } = require('../services');
const catchAsync = require('../utils/catchAsync');

/**
 * Decode Token
 * @description Authorization Middleware
 */
const decodeToken = async (req, res, next) => {
  try {
    // ensure the request header has an authorisation token.
    if (!req.headers.authorization) return res.status(httpStatus.UNAUTHORIZED).send('Unauthorized');
    const token = req.headers.authorization.split(' ')[1];

    // utilising firebase admin to decodetoken
    const decodeValue = await admin.auth().verifyIdToken(token);

    // Send a 401 response if decodevalue is null.
    if (!decodeValue) {
      return res.status(httpStatus.UNAUTHORIZED).send('Unauthorized');
    }

    // utilising the firebase id, check the user details from the database.
    const user = await customerService.getCustomerByFirebaseId(decodeValue?.user_id);
    if (!user)
      return res
        .status(httpStatus.UNAUTHORIZED)
        .send('Oops! It seems your session has expired or there was a login issue. Please login again');

    // store user data in req.userData for use the data in next middleware
    req.userData = user;
    return next();
  } catch (error) {
    console.log(error);
    return res.status(httpStatus.FORBIDDEN).send('Internal server error');
  }
};

/**
 * Fetch User Data form Firebase
 * @description used to fetch user data from firebase using token
 */
const TokenizedFirebaseUserMiddleware = catchAsync(async (req, res, next) => {
  // ensure the request header has an authorisation token.
  if (!req.headers.authorization) return res.status(httpStatus.UNAUTHORIZED).send('Unauthorized');
  const token = req.headers.authorization.split(' ')[1];

  console.log({ token });

  // utilising firebase admin to decodetoken
  const decodeValue = await admin.auth().verifyIdToken(token);

  // Send a 401 response if decodevalue is null.
  if (!decodeValue) {
    return res.status(httpStatus.UNAUTHORIZED).send('Unauthorized');
  }

  // Create req.userData for access in the following router, use decodevalue.
  const { sign_in_provider } = decodeValue.firebase;
  if (sign_in_provider === 'google.com') {
    const { name, user_id, email, picture } = decodeValue;
    req.userData = { firstName: name, firebaseId: user_id, email, picture };
  } else if (sign_in_provider === 'phone') {
    const { user_id, phone_number } = decodeValue;
    req.userData = { firebaseId: user_id, phone: phone_number };
  } else {
    return res.status(httpStatus.UNAUTHORIZED).send('Unauthorized sign in provider');
  }
  return next();
});

const socketErrorResponse = (socket) => {
  socket.on('error', (err) => {
    if (err && err.message === 'unauthorized event') {
      socket.disconnect();
    }
  });
};

const socketAuthenticationMiddleware = async (socket, next) => {
  try {
    const { token } = socket.handshake.auth; // Extract token from query parameter

    console.log({ token });

    // utilising firebase admin to decodetoken
    const decodeValue = await admin.auth().verifyIdToken(token.split(' ')[1]);

    if (!decodeValue) {
      return socketErrorResponse(socket);
    }
    const user = await customerService.getCustomerByFirebaseId(decodeValue?.user_id);
    if (!user) socketErrorResponse(socket);

    // store user data in req.userData for use the data in next middleware
    socket.user = user;
    return next();
  } catch (error) {
    socketErrorResponse(socket);
  }
};

module.exports = { decodeToken, TokenizedFirebaseUserMiddleware, socketAuthenticationMiddleware };
