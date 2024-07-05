import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import colors from 'colors';
import cookieParser from "cookie-parser";

import authRoutes from "./routes/authRoutes.js"

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

var corsOptions = {
    origin: ["*",
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

app.use("/api/users", authRoutes)

app.listen(port, () => {
    console.log(`Server 2 running on port ${port}`.blue)
})