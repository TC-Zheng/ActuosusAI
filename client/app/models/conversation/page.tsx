'use client';
import { useEffect, useState, useRef } from 'react';
type textGenerationResponse = {
  response: Array<Array<[string, number]>>;
};

const WebSocketComponent = () => {
  const [messages, setMessages] = useState<textGenerationResponse | null>(null);
  const [inputMessage, setInputMessage] = useState<string>('');
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Create a new WebSocket connection
    ws.current = new WebSocket(`ws://127.0.0.1:8000/ws/generation/${1}/`);

    // Handle incoming messages
    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMessages(data);
    };

    // Handle connection close
    ws.current.onclose = () => {
      console.log('WebSocket connection closed');
    };

    // Handle errors
    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    // Clean up on component unmount
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  // Send message function
  const sendMessage = () => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      const message = JSON.stringify({ prompt: inputMessage });
      ws.current.send(message);
      setInputMessage(''); // Clear input after sending
    } else {
      console.error('WebSocket connection is not open');
    }
  };

  return (
    <div>
      <h1>WebSocket Messages</h1>
      <ul>
        {messages?.response.map((msg, index) => (
          <li key={index}>{msg}</li>
        ))}
      </ul>

      <input
        type="text"
        value={inputMessage}
        onChange={(e) => setInputMessage(e.target.value)}
        placeholder="Type your message"
      />
      <button onClick={sendMessage}>Send Message</button>
    </div>
  );
};

export default WebSocketComponent;
