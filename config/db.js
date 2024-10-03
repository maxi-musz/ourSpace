import mongoose from "mongoose";
const connection = {};

 
async function connectDb() {
<<<<<<< HEAD
  try {
    if (connection.isConnected) {
        console.log("Already connected to the database.");
=======
  console.log("Connecting to db".cyan)
  try {
    if (connection.isConnected) {
        console.log("Already connected to the database.".red);
>>>>>>> ourspace/test
        return;
      }
      if (mongoose.connections.length > 0) {
        connection.isConnected = mongoose.connections[0].readyState;
        if (connection.isConnected === 1) {
          console.log("Use previous connection to the database.");
          return;
        }
        await mongoose.disconnect();
      }
      const db = await mongoose.connect(process.env.MONGODB_URL);
      console.log(`New connection to the database: ${db.connection.host}`.gray);
      connection.isConnected = db.connections[0].readyState;
  } catch (error) {
    console.log(`Error: ${error.message}`);
    process.exit(1);
  } 
}

async function disconnectDb() {
  if (connection.isConnected) {
    if (process.env.NODE_ENV === "production") {
      await mongoose.disconnect();
      connection.isConnected = false;
    } else {
      console.log("not diconnecting from the database.".white);
    }
  }
}
const db = { connectDb, disconnectDb };
export default db;