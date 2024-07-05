import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import colors from 'colors';
import cookieParser from "cookie-parser";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

var corsOptions = {
    origin: ['http://localhost:3000', 
    "https://rac-client.vercel.app", 
    "https://rac-frontend.vercel.app",
    "https://127.0.0.1:8888",
    "http://localhost:5173",
    "https://rac-admin.netlify.app",
],
    methods: "GET, HEAD, PUT, PATCH, POST, DELETE",
    httpOnly: true,
    credentials: true,
    optionsSuccessStatus: 200
}
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true })); 

app.use(cookieParser());

app.get("/", (req, res) => {
    console.log("ourSPace Api is running".blue)
    res.send("ourSpace API is running")
});

app.listen(port, () => {
    console.log(`Server 2 running on port ${port}`.blue)
})