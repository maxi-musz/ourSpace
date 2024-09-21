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
import axios from 'axios';

const ChatComponent = ({ userId }) => {
  const [messages, setMessages] = useState([]);
  const [messageContent, setMessageContent] = useState('');
  const socket = io('http://localhost:3000'); // Adjust the URL accordingly

  useEffect(() => {
    // Join the socket room when the component mounts
    socket.on('connect', () => {
      console.log(`Socket connected: ${socket.id}`);
      socket.emit('join', userId);
      console.log(`Joined room: ${userId}`);
    });

    // Listen for new messages
    socket.on('new_message', (message) => {
      console.log('New message received:', message);
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    // Handle socket connection errors
    socket.on('connect_error', (error) => {
      console.error('Connection Error:', error);
    });

    // Handle disconnection events
    socket.on('disconnect', (reason) => {
      console.warn('Socket disconnected:', reason);
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
      console.log('Socket disconnected on component unmount');
    };
  }, [userId, socket]);

  const sendMessage = async () => {
    try {
      const response = await axios.post('/api/v1/messages/send-message', {
        listingId: 'your-listing-id', // Replace with actual listing ID
        content: messageContent,
        receiver: 'receiver-user-id', // Replace with actual receiver ID
      });
      
      console.log('Message sent successfully:', response.data);
      setMessageContent(''); // Clear input after sending
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

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
      <input
        type="text"
        value={messageContent}
        onChange={(e) => setMessageContent(e.target.value)}
        placeholder="Type your message"
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
};

export default ChatComponent;



