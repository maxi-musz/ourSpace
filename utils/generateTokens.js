import jwt from "jsonwebtoken";

const generateTokens = (res, userId) => {
    const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.USER_ACCESS_TOKEN_EXPIRATION_TIME // Access token expires in 15 minutes
    });

    const refreshToken = jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.USER_REFRESH_TOKEN_EXPIRATION_TIME // Refresh token expires in 7 days
    });

    // Setting the refresh token in a cookie
    res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== "development",
        maxAge: 15 * 60 * 1000, // 15 minutes 
      });
      
    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== "development", // Set to true in production
        sameSite: "none",
        maxAge: 7 * 24 * 60 * 60 * 1000, // Cookie expiration 7 days
    });

    return { accessToken, refreshToken }; // Returning both tokens
}

export default generateTokens; 