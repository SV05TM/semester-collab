import { useState, useEffect, useRef } from 'react';
import api from '../api';
import socket from '../socket';

export default function ChatPanel({ eventId, user }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadMessages();

    const handleNewMessage = (message) => {
      // Only add messages for this event
      if (message.event_id === eventId) {
        setMessages(prev => [...prev, message]);
      }
    };

    socket.on('new-message', handleNewMessage);
    return () => socket.off('new-message', handleNewMessage);
  }, [eventId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async () => {
    try {
      const { data } = await api.get(`/messages/event/${eventId}`);
      setMessages(data);
    } catch (err) {
      console.error('Failed to load messages', err);
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    socket.emit('send-message', {
      event_id: eventId,
      content: input.trim(),
      user_id: user.id,
      username: user.username
    });

    setInput('');
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border flex flex-col h-[500px]">
      <div className="p-3 border-b flex items-center justify-between">
        <h3 className="font-semibold text-sm">💬 Event Chat</h3>
        <span className="text-xs text-gray-400">{messages.length} messages</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 text-sm py-8">No messages yet. Start the conversation!</div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={msg.id || idx}
              className={`flex flex-col ${msg.user_id === user.id ? 'items-end' : 'items-start'}`}
            >
              <div className={`max-w-[70%] rounded-lg px-3 py-2 ${
                msg.user_id === user.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {msg.user_id !== user.id && (
                  <p className="text-xs font-medium mb-0.5 opacity-75">{msg.username}</p>
                )}
                <p className="text-sm">{msg.content}</p>
              </div>
              <span className="text-xs text-gray-400 mt-1">
                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="p-3 border-t flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          aria-label="Message input"
        />
        <button
          type="submit"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
        >
          Send
        </button>
      </form>
    </div>
  );
}
