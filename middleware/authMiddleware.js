import jwt from 'jsonwebtoken';
import asyncHandler from './asyncHandler.js';
import User from '../models/userModel.js';
import util from "util";

// User must be authenticated
const protect = asyncHandler(async (req, res, next) => {

  // Read JWT from the 'jwt' cookie
  const testToken = req.headers.authorization;
  let token;

  if (testToken && testToken.startsWith('Bearer')) {
    token = testToken.split(' ')[1];
  }

  if(!token) {
    res.status(401);
    throw new Error("Not authorized, login required")
  }

  const decoded = await util.promisify(jwt.verify)(token, process.env.JWT_SECRET);

  const user = await User.findById(decoded.userId).select('-password');
  if(!user) {
    res.status(401);
    throw new Error("User does not exist")
  }


  await user.save();

  req.user = user;
  next();

});

// User must be an admin
const admin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(401);
    throw new Error('Access denied, Authorization level  2 required');
  }
};

const localVariables = (req, res, next) => {
  req.app.locals = {
    OTP : null,
    resetSession: false,
  }
  next();
}

export { protect, admin, localVariables};