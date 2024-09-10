// socketConfig.js

import { Server } from "socket.io";
import Message from "../models/messageModel.js";


const configureSocketIO = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "http://your-frontend-url",
      methods: ["GET", "POST"],
    },
  });

  io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('joinRoom', ({ listingId, userId }) => {
      socket.join(listingId);
      console.log(`User ${userId} joined room ${listingId}`);
    });

    socket.on('sendMessage', async ({ senderId, receiverId, listingId, content }) => {
      const message = new Message({ sender: senderId, receiver: receiverId, listing: listingId, content });
      await message.save();

      io.to(listingId).emit('receiveMessage', message);
    });

    socket.on('disconnect', () => {
      console.log('A user disconnected');
    });
  });
};

export default configureSocketIO;
