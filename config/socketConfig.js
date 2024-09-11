import { Server } from "socket.io";
import Message from "../models/messageModel.js";

const configureSocketIO = (io) => {
  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('joinRoom', ({ userId }) => {
      socket.join(userId);
      console.log(`User ${userId} joined room`);
    });

    socket.on('sendMessage', async ({ senderId, receiverId, content, messageMedia }) => {
      const message = new Message({ sender: senderId, receiver: receiverId, content, messageMedia });
      await message.save();

      io.to(receiverId).emit('receiveMessage', message); // Correct the emit event for the receiver
    });

    socket.on('disconnect', () => {
      console.log('A user disconnected:', socket.id);
    });
  });
};

export default configureSocketIO;
