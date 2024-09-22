import { 
  getMessagesForAListing,
  sendMessage,
  spaceOwnerGetAllChats,
  spaceUserGetAllChats,
 } from "../controllers/messageCtrlr.js";


let users = [];

const socketHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log("A user connected".yellow);

    // Space owner chat events
    socket.on('so-get-all-chats', async (data) => {
      const res = await spaceOwnerGetAllChats(data);
      console.log("Emitting data to Isiaq".blue);
      io.emit("so-get-all-chats", res);
    });

    // Space user chat events
    socket.on('su-get-all-chats', async (data) => {
      const res = await spaceUserGetAllChats(data);
      console.log("Emitting data to Isiaq".blue);
      io.emit("su-get-all-chats", res);
    });

    // Conversations between users
    socket.on('conversations', async (data) => {
      const res = await getMessagesForAListing(data);
      console.log("Emitting conversations for a listing to Isiaq".blue);
      io.emit("conversations", res);
    });

    // Typing event
    socket.on('typing', (data) => socket.broadcast.emit('typingResponse', data));

    // Sending messages
    socket.on('send-message', async (data) => {
      console.log("New socket message received:".yellow);
      const res = await sendMessage(data);
      io.to(data.receiverId).emit('messageResponse', res); // Emit the result to the receiver's room
    });

    // New user joins
    socket.on('newUser', (data) => {
      users.push(data);
      console.log("Updated users:", users);
      io.emit('newUserResponse', users);
    });

    // Disconnection
    socket.on('disconnect', () => {
      console.log('🔥: A user disconnected:', socket.id);
      users = users.filter(user => user.socketID !== socket.id);
    });

    // Join room by userId
    socket.on('join', (userId) => {
      socket.join(userId); // Join a room based on userId
      console.log(`User with ID ${userId} joined their room`);
    });
  });
};

export default socketHandlers;
