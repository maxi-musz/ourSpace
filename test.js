// inside app.js
const App = () => {
    const userId = '66e3f225313c0171cf9864f4'; // you should replace this with the currently signed in user you get 
  
    return (
      <div>
        <h1>My Chat Application</h1>
        <ChatComponent userId={userId} />
      </div>
    );
  };

//   install socket client too for your side 
// npm install socket.io-client



// ChatComponent.js
import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const ChatComponent = ({ userId }) => {
  const [messages, setMessages] = useState([]);
  const socket = io('https://ourspace-dev.onrender.com');

  useEffect(() => {

    socket.on('connect', () => {
      // Emit 'join' event with the user's ID
      socket.emit('join', userId);
      console.log(`Joined room: ${userId}`);
    });

    // Listen for new messages
    socket.on('new_message', (message) => {
      console.log('New message received:', message);
      setMessages((prevMessages) => [...prevMessages, message]); // Update state with new message
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
    };
  }, [userId, socket]);

  return (
    <div>
      <h2>Chat</h2>
      <div>
        {messages.map((msg, index) => (
          <div key={index}>
            <strong>{msg.sender}</strong>: {msg.content}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatComponent;



