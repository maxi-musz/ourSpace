import cron from "node-cron"
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import colors from 'colors';
import cookieParser from "cookie-parser";
import db from './config/db.js';

import waitlistRoutes from "./routes/waitlistRoutes.js"
import authRoutes from "./routes/userRoutes/authRoutes.js"
import adminUsers from "./routes/adminRoutes/adminUser.js"
import listingsRoute from "./routes/listingsRoutes/listingsRoute.js"
import { getWaitlists } from "./controllers/waitlistCtrl.js";

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

// Schedule a task to run every 2 minutes
cron.schedule('* */12 * * *', async () => { //every 2 minutes
    console.log('Running getWaitlists every 12 Hours'.green);
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

app.listen(port, () => {
    console.log(`Server 2 running on port ${port}`.blue)
})