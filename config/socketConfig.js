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
      console.log("New room created: ", room)
      socket.join(room);
      console.log(`User with ID ${currentUserId} joined room ${room}`);

      socket.on('conversations', async (data) => {
        const res = await getMessagesForAListing(data);
        // Emit to the specific room
        io.to(room).emit("conversations-response", res);
        console.log(`Message sent to room ${room}`);
      });

      // Send messgae
      socket.on('send-message', async (data) => {
        try {
          console.log(`New socket message received`.yellow);
      
          const res = await sendMessage(data);
      
          const { senderId, receiverId, listingId } = data;
          io.to(room).emit('message-response', res);
          // socket.to(room).emit('message-response', res)
      
          console.log(`Message successfully emitted to both sender and receiver in room ${room}`.green);
        } catch (error) {
          console.error('Error sending message:', error);
        }
      });

      // Typing event
        socket.on('typing', (data) => {
          console.log("Typing status is active".green)
          const { senderName, receiverId } = data;
          socket.broadcast.to(room).emit('typing-response', `${senderName} is typing`);
          console.log("sent typing status to receiver".magenta)
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


