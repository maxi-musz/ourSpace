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

    // On joining a chat room
    // socket.on('join-room', async(data) => {
    //   console.log(`Data from join-room: ${data}`)
    //   const {currentUserId, otherUserId, listingId} = data
    //   // console.log(`Id's: ${currentUserId}_${otherUserId}_${listingId}`)
    //   const room = `chat_${currentUserId}_${otherUserId}_${listingId}`;
    //   socket.join(room);
    //   console.log(`User with ID ${currentUserId} joined room ${room}`.america);
    // });

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
    });

    // Space owner chat events
    socket.on('so-get-all-chats', async (data) => {
      console.log("SPace owner".yellow)
      const res = await spaceOwnerGetAllChats(data); 
      console.log(`Emitting chats to user with ID: ${data.userId}`.blue);
      socket.emit("so-get-all-chats", res);
    });
    //frontedn
    socket.emit('so-get-all-chats');

    // Space user chat events
    socket.on('su-get-all-chats', async (data) => {
      const res = await spaceUserGetAllChats(data);
      console.log(`Emitting chats to user with ID: ${data.userId}`.blue);
      io.emit("su-get-all-chats", res);
    });

    // Conversations between users
    // socket.on('conversations', async (data) => {
    //   const { currentUserId, listingId, otherUserId } = data;
    
    //   // Create the same unique room identifier used for joining
    //   const room = `chat_${currentUserId}_${otherUserId}_${listingId}`;
    
    //   const res = await getMessagesForAListing(data);

    //   console.log("Response:", res)
    
    //   // Emit to the specific room
    //   socket.emit("conversations-response", res);
    
    //   console.log(`Message sent to room ${room}`);
    // });

    // Typing event
    socket.on('typing', (data) => {
      const { senderName, receiverId } = data;
    
      // Broadcast only to the receiver's room (so only the receiver gets the typing notification)
      socket.broadcast.emit('typing-response', `${senderName} is typing`);
    });

    
    // Handling the 'send-message' socket event
    socket.on('send-message', async (data) => {
      console.log(`New socket message received: ${JSON.stringify(data)}`.yellow); 

      const { sender, listingId, content, receiverId } = data;

      const res = await sendMessage(data); 

      // Emit the formatted message to both sender and receiver
      socket.emit('message-response', res)
      socket.broadcast.emit('message-response', res); 

      console.log(`Message successfully emitted to sender and receiver.`.green);
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
};

export default socketHandlers;


