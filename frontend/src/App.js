import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';

import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

function MapComponent({ data }) {
  const position = [18.5204, 73.8567]; // Pune
  const mapRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [data]);

  return (
    <MapContainer
      whenCreated={map => mapRef.current = map}
      center={position}
      zoom={10}
      style={{ height: '300px', width: '100%', borderRadius: '10px' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <Marker position={position}>
        <Popup>Map of {data[0]?.District}.</Popup>
      </Marker>
    </MapContainer>
  );
}

function App() {
  const [messages, setMessages] = useState([
    { type: 'text', sender: 'bot', data: 'Hello! Ask me for data or maps (e.g., "show me a map of pune").' }
  ]);
  const [input, setInput] = useState('');

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { type: 'text', sender: 'user', data: input };
    const typingMessage = { type: 'text', sender: 'bot', data: 'Typing...' };
    setMessages(prevMessages => [...prevMessages, userMessage, typingMessage]);
    const currentInput = input;
    setInput('');

    try {
      const response = await fetch('http://127.0.0.1:8000/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ district: "pune", question: currentInput }),
      });
      const result = await response.json();
      const botMessage = { type: result.type, sender: 'bot', data: result.data };
      setMessages(prevMessages => {
        const newMessages = [...prevMessages];
        newMessages[newMessages.length - 1] = botMessage;
        return newMessages;
      });
    } catch (error) {
      const errorMessage = { type: 'text', sender: 'bot', data: 'Sorry, I am having trouble connecting.' };
      setMessages(prevMessages => {
        const newMessages = [...prevMessages];
        newMessages[newMessages.length - 1] = errorMessage;
        return newMessages;
      });
    }
  };

  return (
    <div className="App">
      <header className="App-header"><h1>AquaIntel AI</h1></header>
      <div className="chat-window">
        <div className="message-list">
          {messages.map((message, index) => (
            <div key={index} className={`message ${message.sender}`}>
              {message.type === 'text' && <p>{message.data}</p>}
              {message.type === 'map' && <MapComponent data={message.data} />}
            </div>
          ))}
        </div>
        <form onSubmit={handleSend} className="input-form">
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask a question..."/>
          <button type="submit">Send</button>
        </form>
      </div>
    </div>
  );
}

export default App;