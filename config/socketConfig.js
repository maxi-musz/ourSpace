import { 
  getMessagesForAListing,
  sendMessage,
  spaceOwnerGetAllChats,
  spaceUserGetAllChats,
 } from "../controllers/messageCtrlr.js";


let users = [];

const socketHandlers = (io) => {
  io.on('connection', (socket) => {
    // console.log("A user connected".yellow);

    socket.on('join-room', async (data) => {
      const { currentUserId, otherUserId, listingId } = data;
      const room = `chat_${currentUserId}_${otherUserId}_${listingId}`;
      socket.join(room);
      console.log(`User with ID ${currentUserId} joined room ${room}`.blue);

      const clients = io.sockets.adapter.rooms.get(room);
      console.log(`Clients in room after join: `, clients);
    
      // Conversations event handler
      socket.on('conversations', async (data) => {
        const res = await getMessagesForAListing(data);
        io.to(room).emit("conversations-response", res);
        console.log(`Message sent to room ${room}`.cyan);
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
    socket.on('send-message', async (data) => {
      try {
        const { senderId, receiverId, listingId } = data;
        const chatRoom = `chat_${senderId}_${receiverId}_${listingId}`;
        
        // Ensure sender joins the room
        socket.join(chatRoom);
    
        // Check if both sender and receiver are in the chatRoom
        const clients = io.sockets.adapter.rooms.get(chatRoom);
  
        console.log("Clients in room: ", clients);
    
        if (clients && clients.size === 2) {
          console.log('Both users are in the chatRoom.');
    
          // Emit the message to the chatRoom
          const res = await sendMessage(data);
          io.to(chatRoom).emit('message-response', res);
        } else {
          console.log('Receiver is not in the chatRoom yet.');
          // Emit the message only to the sender, until receiver joins
          socket.emit('error', { message: 'Receiver is not in the chatRoom.' });
        }
      } catch (error) {
        console.error('Error sending message:', error);
      }
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


