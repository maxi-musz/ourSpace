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

    // Join Room Event
    socket.on('join-room', (data) => {
      const { propertyOwnerId, listingId, propertyUserId } = data;
      const room = `chat_${propertyOwnerId}_${listingId}_${propertyUserId}`;
      socket.join(room);

      const clients = io.sockets.adapter.rooms.get(room);
      console.log(`Clients in room after join: `, clients);
    });

    // Event for sending messages (attached once per socket connection)
    socket.on('send-message', async (data) => {
      try {
        const { propertyOwnerId, listingId, propertyUserId } = data;
        const room = `chat_${propertyOwnerId}_${listingId}_${propertyUserId}`;
        
        // Ensure sender joins the room
        socket.join(room);
      
        // Check if both sender and receiver are in the chatRoom
        const clients = io.sockets.adapter.rooms.get(room);
    
        console.log(`Clients in room: ${clients}`.yellow);
        
        // Save the message to the database
        const res = await sendMessage(data);

        // Emit the message to the room if valid
        if (data.roomName === room) {
          io.to(room).emit('message-response', { room, res });
        }

        // Check if both users are in the room
        if (clients && clients.size === 2) {
          console.log('Both users are in the room.'.green);
        } else {
          console.log('Receiver is not in the chatRoom yet.'.red);
        }

      } catch (error) {
        console.error('Error sending message:', error);
      }
    });

    // Typing event (attached once per socket connection)
    socket.on('typing', (data) => {
      const { senderName, roomName } = data;

      // Emit the typing event only within the appropriate room
      socket.broadcast.to(roomName).emit('typing-response', `${senderName} is typing`);
    });

    // New user joins (attached once per socket connection)
    socket.on('newUser', (data) => {
      users.push(data);
      console.log("Updated users:", users);
      io.emit('newUserResponse', users);
    });

    // Conversations event handler (attached once per socket connection)
    socket.on('conversations', async (data) => {
      const { propertyOwnerId, listingId, propertyUserId } = data;
      const room = `chat_${propertyOwnerId}_${listingId}_${propertyUserId}`;
      
      const res = await getMessagesForAListing(data);

      if (data.roomName === room) {
        io.to(room).emit("conversations-response", { room, res });
      }
    });

    // Handle socket disconnection
    socket.on('disconnect', () => {
      console.log(`User ${socket.id} disconnected`.red);
    });
  });
};

export default socketHandlers;


