import cron from "node-cron";
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from "cookie-parser";
import db from './config/db.js';
import morgan from "morgan";
import session from "express-session";
import passport from "./utils/passport.js";
import axios from "axios";
import MongoStore from 'connect-mongo';
import colors from "colors";
import http from "http";

import waitlistRoutes from "./routes/extras/waitlistRoutes.js";
import authRoutes from "./routes/userRoutes/authRoutes.js";
import listingsRoute from "./routes/listingsRoutes/listingsRoute.js";
import { getWaitlistsAsCsv } from "./controllers/extras/waitlistCtrl.js";
import reviewsRoute from "./routes/reviewsRoute/reviewsRoutes.js";
import userSettingsR from "./routes/settingsRoute/userSettingsR.js"
import profileRoutes from "./routes/profileRoutes/profileRoutes.js"

import paystackRoutes from "./routes/extras/paystackRoutes.js";

// Admin Routes
import adminDashboardR from "./routes/adminRoutes/adminDashboardR.js"
import waitlistAdminRoute from "./routes/adminRoutes/waitlistAdminRoute.js"
import authAdminR from "./routes/adminRoutes/authAdminR.js";
import usersAdminR from "./routes/adminRoutes/usersAdminR.js";
import listingsAdminR from "./routes/adminRoutes/listingsAdminR.js";


import configureSocketIO from "./config/socketConfig.js";
import messageRoutes from "./routes/messageRoutes/messageRoutes.js"

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(morgan("dev"));

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: new MongoStore({
        mongoUrl: process.env.MONGODB_URL,
        collectionName: 'sessions'
    })
}));

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());

const corsOptions = {
    origin: "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

app.get("/api/v1", (req, res) => {
    console.log("ourSpace API is running".blue);
    res.send("ourSpace API is running");
});

const server = http.createServer(app);

await db.connectDb();


cron.schedule('*/2 * * * *', async () => {
    console.log('Calling ourSpace API every 2 minutes'.green);
    try {
        const response = await axios.get('https://ourspace-0ggk.onrender.com/api/v1');
        console.log('Response from ourSpace API:', response.data);
    } catch (error) {
        console.error('Error calling ourSpace API:', error.message);
    }
});

//24hrs
cron.schedule('0 0 * * *', async () => {
    console.log('Running getWaitlistsAsCsv every 24 hours'.green);
    try {
        await getWaitlistsAsCsv();
    } catch (error) {
        console.error('Error executing getWaitlistsAsCsv:', error.message);
    }
});

app.use("/api/v1/waitlist", waitlistRoutes);
app.use("/api/v1/users", authRoutes);
app.use("/api/v1/listing", listingsRoute);
app.use("/api/v1/settings", userSettingsR);
app.use("/api/v1/profile", profileRoutes);



// Admin routes
app.use("/api/v1/admin/dashboard", adminDashboardR)
app.use("/api/v1/admin/waitlist", waitlistAdminRoute);
app.use("/api/v1/admin/auth", authAdminR);
app.use("/api/v1/admin/users", usersAdminR);
app.use("/api/v1/admin/listings", listingsAdminR);

configureSocketIO(server);
app.use("/api/v1/messaging", messageRoutes)

app.use('/api/v1/paystack', paystackRoutes);


app.use("*", (req, res, next) => {
    console.log("Route not found");
    res.status(404).json({
        success: false,
        message: "Route not found"
    });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`.blue);
});
