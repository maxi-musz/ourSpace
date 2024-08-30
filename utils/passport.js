import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from "../models/userModel.js";
import dotenv from "dotenv";

dotenv.config();

// Configure Passport to use Google Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID, // Your Google Client ID
  clientSecret: process.env.GOOGLE_CLIENT_SECRET, // Your Google Client Secret
  callbackURL: process.env.GOOGLE_CALLBACK_URL // The URL to redirect to after authentication
},
async (accessToken, refreshToken, profile, done) => {
  try {
      // Find user by Google ID
      const user = await User.findOne({ googleId: profile.id });
      if (user) {
          // User found, return the user
          return done(null, user);
      } else {
          // User not found, create a new user
          const newUser = new User({
              googleId: profile.id,
              name: profile.displayName,
              email: profile.emails[0].value
          });
          await newUser.save();
          return done(null, newUser);
      }
  } catch (error) {
      return done(error, null);
  }
}));

// Serialize and deserialize user
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});

export default passport;
