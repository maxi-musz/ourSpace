import jwt from 'jsonwebtoken';
import asyncHandler from './asyncHandler.js';
import User from '../models/userModel.js';
import util from "util";

// User must be authenticated
const protect = asyncHandler(async (req, res, next) => {
  // Read JWT from the 'accessToken' cookie
  const token = req.cookies.accessToken;

  if (!token) {
      res.status(401);
      throw new Error("Not authorized, login required");
  }

  try {
      const decoded = await util.promisify(jwt.verify)(token, process.env.JWT_SECRET);

      const user = await User.findById(decoded.userId).select('-password');
      if (!user) {
          res.status(401);
          throw new Error("User does not exist");
      }

      req.user = user;
      next();
  } catch (error) {
      res.status(401);
      throw new Error("Not authorized, token failed");
  }
});

// User must be an admin
const admin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
      next();
  } else {
      res.status(401);
      throw new Error('Access denied, admin only');
  }
};

const localVariables = (req, res, next) => {
  req.app.locals = {
      OTP: null,
      resetSession: false,
  };
  next();
};

export { protect, admin, localVariables };