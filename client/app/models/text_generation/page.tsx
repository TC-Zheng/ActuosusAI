'use client';
import { useEffect, useState, useRef } from 'react';
import WordDropdown from '@/app/models/text_generation/components/WordDropdown';
import useTrie from '@/app/models/text_generation/hooks/useTrie';
type textGenerationResponse = {
  response: Array<Array<[string, number]>>;
};

const WebSocketComponent = () => {
  const [messages, setMessages] = useState<Array<Array<[string, number]>>>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const ws = useRef<WebSocket | null>(null);
  const { insertTrie, searchTrie } = useTrie();

  useEffect(() => {
    // Create a new WebSocket connection
    ws.current = new WebSocket(`ws://127.0.0.1:8000/ws/generation/${4}/`);

    // Handle incoming messages
    ws.current.onmessage = (event) => {
      const data: textGenerationResponse = JSON.parse(event.data);
      const newMessages = insertTrie(data.response);
      setMessages(newMessages);
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
      const message = JSON.stringify({
        prompt: inputMessage,
        temperature: 0.5,
      });
      ws.current.send(message);
      setInputMessage(''); // Clear input after sending
    } else {
      console.error('WebSocket connection is not open');
    }
  };

  const OnWordClick = (index: number, word: string) => {
    // Check if the word is in the trie
    const prev_messages = messages
      .slice(0, index)
      .map((wordList) => wordList[0][0]);
    const searchResults = searchTrie([...prev_messages, word]);
    if (searchResults) {
      setMessages(searchResults);
      return;
    }
    const newMessage = prev_messages.join('') + word;
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      const message = JSON.stringify({
        prompt: newMessage,
        temperature: 0.5,
      });
      ws.current.send(message);
      setInputMessage(''); // Clear input after sending
    } else {
      console.error('WebSocket connection is not open');
    }
  };

  return (
    <div>
      <h1>WebSocket Messages</h1>
      <div className="flex flex-wrap">
        {messages.map((wordList, index) => (
          <WordDropdown
            key={index}
            index={index}
            wordList={wordList}
            OnWordClick={OnWordClick}
          />
        ))}
      </div>

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
