import cron from "node-cron";
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from "cookie-parser";
<<<<<<< HEAD
import db from './config/db.js';
import morgan from "morgan";
import session from "express-session";
import passport from "./utils/passport.js";
=======
import session from "express-session";
>>>>>>> ourspace/test
import axios from "axios";
import MongoStore from 'connect-mongo';
import colors from "colors";
import http from "http";
<<<<<<< HEAD

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
=======
import { Server } from "socket.io";

// Import routes
import passport from "./utils/passport.js";
import db from './config/db.js';
import waitlistRoutes from "./routes/extras/waitlistRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import listingsRoute from "./routes/listingsRoute.js";
import bookingsRoute from "./routes/bookingsRoute.js";
import reviewsRoute from "./routes/reviewsRoutes.js";
import userSettingsR from "./routes/userSettingsR.js";
import profileRoutes from "./routes/profileRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import paystackRoutes from "./routes/extras/paystackRoutes.js";
import socketHandlers from "./config/socketConfig.js"
import walletRoutes from "./routes/walletRoutes.js"
import calendarRoutes from "./routes/calendarRoutes.js"

// Admin routes
import adminDashboardR from "./routes/adminRoutes/adminDashboardR.js";
import waitlistAdminRoute from "./routes/adminRoutes/waitlistAdminRoute.js";
>>>>>>> ourspace/test
import authAdminR from "./routes/adminRoutes/authAdminR.js";
import usersAdminR from "./routes/adminRoutes/usersAdminR.js";
import listingsAdminR from "./routes/adminRoutes/listingsAdminR.js";

<<<<<<< HEAD

import configureSocketIO from "./config/socketConfig.js";
import messageRoutes from "./routes/messageRoutes/messageRoutes.js"

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(morgan("dev"));

=======
dotenv.config();

// Database connection
await db.connectDb();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
>>>>>>> ourspace/test
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URL,
        collectionName: 'sessions'
    })
}));

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());


const corsOptions = {
    origin: [
        "http://localhost:3000", 
        "http://localhost:3001", 
        "https://ourspace-git-dev-ourspace-global.vercel.app",
        "https://ourspace-admin-6rlb.vercel.app",
        "https://www.exploreourspace.com",
        "https://admin.exploreourspace.com",
        "https://ourspace-staging.vercel.app",
    ],
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
    optionsSuccessStatus: 200
};
<<<<<<< HEAD

=======
>>>>>>> ourspace/test
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
<<<<<<< HEAD

app.use(cookieParser());

app.get("/api/v1", (req, res) => {
    console.log("ourSpace API is running".blue);
    res.send("ourSpace API is running");
});

const server = http.createServer(app);

await db.connectDb();


if(process.env.NODE_ENV === "production") {
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
}

app.use("/api/v1/waitlist", waitlistRoutes);
app.use("/api/v1/users", authRoutes);
app.use("/api/v1/listing", listingsRoute);
app.use("/api/v1/settings", userSettingsR);
app.use("/api/v1/profile", profileRoutes);



// Admin routes
app.use("/api/v1/admin/dashboard", adminDashboardR)
=======
app.use(cookieParser());

// HTTP server and Socket.IO setup
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        // origin: [
        //     "http://localhost:3000", 
        //     "https://exploreourspace.com",
        //     "https://ourspace-kxwcfzd7a-ourspace-global.vercel.app/", 
        //     "https://ourspace-admin-6rlb.vercel.app/dashboard",
        // ],
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Initialize socket handlers
socketHandlers(io);

// Routes
app.use("/api/v1/waitlist", waitlistRoutes);
app.use("/api/v1/users", authRoutes);
app.use("/api/v1/listing", listingsRoute);
app.use("/api/v1/bookings", bookingsRoute);
app.use("/api/v1/settings", userSettingsR);
app.use("/api/v1/profile", profileRoutes);
app.use("/api/v1/messages", messageRoutes);
app.use("/api/v1/paystack", paystackRoutes);
app.use("/api/v1/wallet", walletRoutes)
app.use("/api/v1/calendar", calendarRoutes)

// Admin routes
app.use("/api/v1/admin/dashboard", adminDashboardR);
>>>>>>> ourspace/test
app.use("/api/v1/admin/waitlist", waitlistAdminRoute);
app.use("/api/v1/admin/auth", authAdminR);
app.use("/api/v1/admin/users", usersAdminR);
app.use("/api/v1/admin/listings", listingsAdminR);

<<<<<<< HEAD
configureSocketIO(server);
app.use("/api/v1/messaging", messageRoutes)

app.use('/api/v1/paystack', paystackRoutes);


=======
// Default route
app.get("/", (req, res) => {
    console.log("ourSpace API is running".blue);
    res.send("ourSpace API is running");
});

app.get("/api/v1", (req, res) => {
    console.log("ourSpace API is running".blue);
    res.send("ourSpace API is running");
});

// Cron job for production environment
// if (process.env.NODE_ENV === "production") {
//     cron.schedule('*/2 * * * *', async () => {
//         // console.log('Calling ourSpace API every 2 minutes'.green);
//         try {
//             const response = await axios.get('https://ourspace-dev.onrender.com/api/v1');
//             // console.log('Response from ourSpace API:', response.data);
//         } catch (error) {
//             console.error('Error calling ourSpace API:', error.message);
//         }
//     });
// }

// Fallback route for unmatched requests
>>>>>>> ourspace/test
app.use("*", (req, res, next) => {
    console.log("Route not found");
    res.status(404).json({
        success: false,
        message: "Route not found"
    });
});

<<<<<<< HEAD
app.listen(port, () => {
=======
// Start the server
server.listen(port, () => {
>>>>>>> ourspace/test
    console.log(`Server running on port ${port}`.blue);
});
