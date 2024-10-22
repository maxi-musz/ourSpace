<<<<<<< HEAD
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
=======
import { 
  getMessagesForAListing,
  sendMessage,
  spaceOwnerGetAllChats,
  spaceUserGetAllChats,
 } from "../controllers/messageCtrlr.js";


let users = [];

const socketHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log(`User ${socket.id} connected`.yellow);

    socket.on('join-room', (data) => {
      const { propertyOwnerId, listingId, propertyUserId } = data;
      const room = `chat_${propertyOwnerId}_${listingId}_${propertyUserId}`;
      socket.join(room);

      const clients = io.sockets.adapter.rooms.get(room);
      console.log(`Clients in room after join: `, clients);
    
      // Conversations event handler
      socket.on('conversations', async (data) => {
        const res = await getMessagesForAListing(data);

        if(data.roomName === room) {
          io.to(room).emit("conversations-response", {room, res});
        }
      });
    
      //
      socket.on('send-message', async (data) => {
        try {
          // Ensure sender joins the room
          socket.join(room);
      
          // Check if both sender and receiver are in the chatRoom
          const clients = io.sockets.adapter.rooms.get(room);
    
          console.log(`Clients in room: ${clients}`.yellow);
          const res = await sendMessage(data);

          if(data.roomName === room) {
            io.to(room).emit('message-response', {room, res});
            console.log("New message successfully delivered to receiver".america)
          }
      
          if (clients && clients.size === 2) {
            console.log('Both users are in the room.'.green);

          } else {
            console.log('Receiver is not in the chatRoom yet.'.red);
          }

        } catch (error) {
          console.error('Error sending message:', error);
        }
      });
      
    
      // Typing event
      socket.on('typing', (data) => {
        const { senderName, receiverId } = data;

        if(data.roomName === room) {
          socket.broadcast.to(room).emit('typing-response', `${senderName} is typing`);
        }
      });
    
      // New user joins
      socket.on('newUser', (data) => {
        users.push(data);
        console.log("Updated users:", users);
        io.emit('newUserResponse', users);
      });
    });
    
});

    
  

    // Space owner chat events
    // socket.on('so-get-all-chats', async (data) => {
    //   console.log("SPace owner".yellow)
    //   const res = await spaceOwnerGetAllChats(data); 
    //   console.log(`Emitting chats to user with ID: ${data.userId}`.blue);
    //   socket.emit("so-get-all-chats", res);
    // });
    // //frontedn
    // socket.emit('so-get-all-chats');

    // // Space user chat events
    // socket.on('su-get-all-chats', async (data) => {
    //   const res = await spaceUserGetAllChats(data);
    //   console.log(`Emitting chats to user with ID: ${data.userId}`.blue);
    //   io.emit("su-get-all-chats", res);
    // });

    
};

export default socketHandlers;


>>>>>>> ourspace/test
