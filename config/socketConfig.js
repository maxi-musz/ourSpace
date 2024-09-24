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
      // console.log("New room created: ", room)
      socket.join(room);
      console.log(`User with ID ${currentUserId} joined room ${room}`.blue);

      socket.on('conversations', async (data) => {
        const res = await getMessagesForAListing(data);
        // Emit to the specific room
        io.emit("conversations-response", res);
        socket.broadcast.to(room).emit('message-response', res);
        console.log(`Message sent to room ${room}`.cyan);
      });

      // Send messgae
      socket.on('send-message', async (data) => {
        try {
            const { senderId, receiverId, listingId } = data;
            const chatRoom = `chat_${senderId}_${receiverId}_${listingId}`;
            
            // Join the chatRoom if not already in it
            socket.join(chatRoom);
    
            // Check if both sender and receiver are in the chatRoom
            const clients = io.sockets.adapter.rooms.get(chatRoom);
    
            if (clients && clients.size === 2) {
                console.log('Both users are in the chatRoom.');
    
                // Emit the message to the chatRoom
                const res = await sendMessage(data);
                io.to(chatRoom).emit('message-response', res);
            } else {
                console.log('Receiver is not in the chatRoom yet.');
                // Handle the case when the receiver is not in the chatRoom
                socket.emit('error', { message: 'Receiver is not in the chatRoom.' });
            }
    
        } catch (error) {
            console.error('Error sending message:', error);
        }
      });
    

      // Typing event
        socket.on('typing', (data) => {
          // console.log("Typing status is active".green)
          const { senderName, receiverId } = data;
          socket.broadcast.to(room).emit('typing-response', `${senderName} is typing`);
          // console.log("sent typing status to receiver".magenta)
        });

        // New user joins
        socket.on('newUser', (data) => {
          users.push(data);
          console.log("Updated users:", users);
          io.emit('newUserResponse', users);
        });

        // Disconnection
        socket.on('disconnect', () => {
          // console.log('🔥: A user disconnected:', socket.id);
          users = users.filter(user => user.socketID !== socket.id);
        });
    });

    // socket.on('join-room', (data) => {
    //   const { currentUserId, otherUserId, listingId } = data;
    //   const room = `chat_${currentUserId}_${otherUserId}_${listingId}`;
  
    //   socket.join(room);
    //   console.log(`User with ID ${currentUserId} joined room ${room}`);
  
    //   // Confirm both sender and receiver are in the room
    //   const clients = io.sockets.adapter.rooms.get(room);
  
    //   // Check if the room has exactly 2 clients (sender and receiver)
    //   if (clients && clients.size === 2) {
    //       io.to(room).emit('both-users-in-room', { message: 'Both users are in the room' });
    //   } else {
    //       io.to(room).emit('waiting-for-user', { message: 'Waiting for the other user to join' });
    //   }
    // }); 
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


