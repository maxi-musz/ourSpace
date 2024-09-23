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
      console.log(`User with ID ${currentUserId} joined room ${room}`);

      // Move conversations event listener inside join-room
      socket.on('conversations', async (data) => {
        const res = await getMessagesForAListing(data);
        console.log("Response:", res);
        // Emit to the specific room
        io.to(room).emit("conversations-response", res);
        console.log(`Message sent to room ${room}`);
      });

      // Send messgae
      socket.on('send-message', async (data) => {
        console.log(`New socket message received`.yellow); 
        const res = await sendMessage(data);
        // Emit the message to everyone in the room except the sender
        // socket.broadcast.to(room).emit('message-response', res);
        // Emit the message to the sender
        socket.to(room).emit('message-response', res)
        // socket.emit('message-response', res);
        console.log(`Message successfully emitted to sender and receiver.`.green);
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


