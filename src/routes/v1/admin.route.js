const express = require('express');
const passport = require('passport');
const validate = require('../../middlewares/validate');
const authValidation = require('../../validations/auth.validation');
const authController = require('../../controllers/auth.controller');
const { jwtStrategy } = require('../../config/passport');

const router = express.Router();

// use customer passport jwt strategy

router.use(passport.initialize());
passport.use('jwt', jwtStrategy);

router.post('/register', validate(authValidation.register), authController.register);

module.exports = router;
