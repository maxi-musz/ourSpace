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
import { Server } from "socket.io";
import configureSocketIO from "./config/socketConfig.js";

import waitlistRoutes from "./routes/extras/waitlistRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import listingsRoute from "./routes/listingsRoute.js";
import bookingsRoute from "./routes/bookingsRoute.js";
import { getWaitlistsAsCsv } from "./controllers/extras/waitlistCtrl.js";
import reviewsRoute from "./routes/reviewsRoute/reviewsRoutes.js";
import userSettingsR from "./routes/userSettingsR.js";
import profileRoutes from "./routes/profileRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import paystackRoutes from "./routes/extras/paystackRoutes.js";

// Admin Routes
import adminDashboardR from "./routes/adminRoutes/adminDashboardR.js";
import waitlistAdminRoute from "./routes/adminRoutes/waitlistAdminRoute.js";
import authAdminR from "./routes/adminRoutes/authAdminR.js";
import usersAdminR from "./routes/adminRoutes/usersAdminR.js";
import listingsAdminR from "./routes/adminRoutes/listingsAdminR.js";

dotenv.config();
await db.connectDb();

const app = express();
const port = process.env.PORT || 3000;

app.use(morgan("dev"));

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
    origin: "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

let users = [];

// Socket.IO connection setup
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

// Socket.IO connection event
io.on('connection', (socket) => {
    console.log(`⚡: ${socket.id} user just connected!`);

    // Listen for messages
    socket.on('loggedIn', (data) => {
      console.log(`testing data for message: ${data}`)
    });

    socket.on('message', (data) => {
        console.log("Message received:", data); // Log received message
        io.emit('messageResponse', data);
    });

    // Listen when a new user joins the server
    socket.on('newUser', (data) => {
        users.push(data);
        console.log("Updated users:", users); // Log users list
        io.emit('newUserResponse', users);
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('🔥: A user disconnected:', socket.id);
        // Update users list
        users = users.filter(user => user.socketID !== socket.id);
    });

    // Handle joining rooms (for testing)
    socket.on('join', (userId) => {
        socket.join(userId); // Join a room based on userId
        console.log(`User with ID ${userId} joined their room`);
    });
});

app.use((req, res, next) => {
    req.io = io; 
    next();
});


app.get("/api/v1", (req, res) => {
    console.log("ourSpace API is running".blue);
    res.send("ourSpace API is running");
});

// Cron jobs
if(process.env.NODE_ENV === "production") {
    cron.schedule('*/2 * * * *', async () => {
        console.log('Calling ourSpace API every 2 minutes'.green);
        try {
            const response = await axios.get('https://ourspace-dev.onrender.com/api/v1');
            console.log('Response from ourSpace API:', response.data);
        } catch (error) {
            console.error('Error calling ourSpace API:', error.message);
        }
    });
}

app.use("/api/v1/waitlist", waitlistRoutes);
app.use("/api/v1/users", authRoutes);
app.use("/api/v1/listing", listingsRoute);
app.use("/api/v1/bookings", bookingsRoute);
app.use("/api/v1/settings", userSettingsR);
app.use("/api/v1/profile", profileRoutes);
app.use("/api/v1/messages", messageRoutes);

// Admin routes
app.use("/api/v1/admin/dashboard", adminDashboardR);
app.use("/api/v1/admin/waitlist", waitlistAdminRoute);
app.use("/api/v1/admin/auth", authAdminR);
app.use("/api/v1/admin/users", usersAdminR);
app.use("/api/v1/admin/listings", listingsAdminR);

app.use("/api/v1/messaging", messageRoutes);
app.use('/api/v1/paystack', paystackRoutes);

app.post('/api/v1/join', (req, res) => {
    const { userId } = req.body;
    io.emit('join', userId);
    res.status(200).json({ success: true, message: `User ${userId} joined the room` });
});

app.use("*", (req, res, next) => {
    console.log("Route not found");
    res.status(404).json({
        success: false,
        message: "Route not found"
    });
});

server.listen(port, () => {
    console.log(`Server running on port ${port}`.blue);
});
