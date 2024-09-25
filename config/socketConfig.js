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
      // const id = if(propertyOwnerId ? propertyOwnerId : propertyUserId)
      // console.log(`User with ID ${id} joined room ${room}`.blue);

      const clients = io.sockets.adapter.rooms.get(room);
      console.log(`Clients in room after join: `, clients);
    
      // Conversations event handler
      socket.on('conversations', async (data) => {
        const res = await getMessagesForAListing(data);
        io.to(room).emit("conversations-response", res);
        console.log(`Message sent to room ${room}`.cyan);
      });
    
      socket.on('send-message', async (data) => {
        try {
          // Ensure sender joins the room
          // socket.join(room);
      
          // Check if both sender and receiver are in the chatRoom
          const clients = io.sockets.adapter.rooms.get(room);
    
          console.log("Clients in room: ", clients);
          const res = await sendMessage(data);
          io.to(room).emit('message-response', res);
      
          if (clients && clients.size === 2) {
            console.log('Both users are in the room.');

          } else {
            console.log('Receiver is not in the chatRoom yet.');
          }

        } catch (error) {
          console.error('Error sending message:', error);
        }
      });
      
    
      // Typing event
      socket.on('typing', (data) => {
        const { senderName, receiverId } = data;
        socket.broadcast.to(room).emit('typing-response', `${senderName} is typing`);
      });
    
      // New user joins
      socket.on('newUser', (data) => {
        users.push(data);
        console.log("Updated users:", users);
        io.emit('newUserResponse', users);
      });
    
      // Disconnection
      socket.on('disconnect', () => {
        users = users.filter(user => user.socketID !== socket.id);
      });
    });

    // Send message event handler
    
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


