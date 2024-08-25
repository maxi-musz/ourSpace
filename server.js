import cron from "node-cron"
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import colors from 'colors';
import cookieParser from "cookie-parser";
import axios from 'axios';
import db from './config/db.js';

import waitlistRoutes from "./routes/waitlistRoutes.js"
import authRoutes from "./routes/userRoutes/authRoutes.js"
import adminUsers from "./routes/adminRoutes/adminUser.js"
import listingsRoute from "./routes/listingsRoutes/listingsRoute.js"
import { getWaitlists } from "./controllers/waitlistCtrl.js";
import reviewsRoute from "./routes/reviewsRoute/reviewsRoutes.js"
// Paystack
import paystackRoutes from "./routes/extras/paystackRoutes.js"

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const corsOptions = {
    origin: "*", // Allow access from any origin
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
    optionsSuccessStatus: 200
  };
   
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true })); 

app.use(cookieParser());

app.get("/api/v1", (req, res) => {
    console.log("ourSPace Api is running".blue)
    res.send("ourSpace API is running")
});

db.connectDb()

cron.schedule('*/2 * * * *', async () => {
    console.log('Calling ourSpace API every 2 minutes'.green);
    try {
        const response = await axios.get('http://localhost:3000/api/v1');
        console.log('Response from ourSpace API:', response.data);
    } catch (error) {
        console.error('Error calling ourSpace API:', error.message);
    }
});


// Schedule a task to run every 2 minutes
cron.schedule('0 0 * * *', async () => { 
    console.log('Running getWaitlists every 24 hours'.green);
    try {
        await getWaitlists();
    } catch (error) {
        console.error('Error executing getWaitlists:', error.message);
    }
});

app.use("/api/v1/waitlist", waitlistRoutes)
app.use("/api/v1/users", authRoutes)
app.use("/api/v1/admin", adminUsers)
app.use("/api/v1/listing", listingsRoute)
app.use("/api/v1/reviews", reviewsRoute)

// Paystack
app.use('/api/v1/paystack', paystackRoutes);

app.use("*", (req, res, next) => {
    console.log("Route not found")
    res.status(404).json({
        success: false,
        message: "Route not found"
    })
})

app.listen(port, () => {
    console.log(`Server 2 running on port ${port}`.blue)
})