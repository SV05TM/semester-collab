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
      content: input.trim()
    });

    setInput('');
  };

  const formatTime = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Group messages by date
  let lastDate = '';

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[550px] overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm">💬</span>
          </div>
          <div>
            <h3 className="font-semibold text-sm text-gray-900">Event Chat</h3>
            <p className="text-xs text-gray-400">{messages.length} messages</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-gray-50/50 to-white">
        {messages.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gray-50 rounded-2xl mb-3">
              <span className="text-2xl">💬</span>
            </div>
            <p className="text-gray-400 text-sm">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const showDate = formatDate(msg.created_at) !== lastDate;
            lastDate = formatDate(msg.created_at);
            const isOwn = msg.user_id === user.id;

            return (
              <div key={msg.id || idx}>
                {showDate && (
                  <div className="flex items-center justify-center my-4">
                    <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">{formatDate(msg.created_at)}</span>
                  </div>
                )}
                <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] ${isOwn ? 'order-2' : ''}`}>
                    <div className={`rounded-2xl px-4 py-2.5 ${
                      isOwn
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-md'
                        : 'bg-white border border-gray-100 text-gray-800 shadow-sm rounded-bl-md'
                    }`}>
                      {!isOwn && (
                        <p className={`text-xs font-semibold mb-1 ${isOwn ? 'text-indigo-200' : 'text-indigo-600'}`}>{msg.username}</p>
                      )}
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                    </div>
                    <span className={`text-[11px] text-gray-400 mt-1 block ${isOwn ? 'text-right' : 'text-left'}`}>
                      {formatTime(msg.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="p-4 border-t border-gray-100 flex gap-3 bg-white">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition bg-gray-50 focus:bg-white"
          aria-label="Message input"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2.5 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:shadow-none"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </form>
    </div>
  );
}
