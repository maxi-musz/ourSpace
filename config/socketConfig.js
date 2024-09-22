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
    socket.on('typing', (data) => socket.broadcast.emit('typing-response', data));

    // Sending messages
    socket.on('send-message', async (data) => {
      // Ensure you're logging the complete data structure
      console.log(`New socket message received: ${JSON.stringify(data)}`.yellow); 
    
      const { sender, listingId, content, receiverId } = data;
    
      // Additional logging to ensure all fields are present
      console.log(`sender: ${sender}`.blue);
      console.log(`receiverId: ${receiverId}`.cyan);
      console.log(`listingId: ${listingId}`.green);
      console.log(`content: ${content}`.magenta);
    
      // Ensure `sendMessage` receives the correct data and await the response
      const res = await sendMessage(data); 
    
      // Emit the message response back to the receiver's room
      io.to(receiverId).emit('message-response', res);
      console.log('Message successfully emitted to receiver'.america)
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
