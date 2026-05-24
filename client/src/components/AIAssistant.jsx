import { useState, useRef, useEffect } from 'react';
import api from '../api';

export default function AIAssistant({ eventInfo, onClose }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: `Hey! I'm your AI planning assistant. I can help with:\n\n• Event planning & logistics\n• Task breakdowns\n• Meeting agendas\n• Budget & fundraising ideas\n• Marketing strategies\n\nWhat can I help you with?` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setLoading(true);

    try {
      const context = eventInfo ? {
        eventTitle: eventInfo.title,
        organization: eventInfo.organization,
        eventDate: eventInfo.start_date,
        eventLocation: eventInfo.event_location
      } : {};

      const { data } = await api.post('/ai/chat', { message: userMessage, context });
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Something went wrong. Try again.';
      setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ ${errorMsg}` }]);
    }
    setLoading(false);
  };

  const quickActions = [
    { label: '📋 Suggest tasks', action: 'What tasks should we create for this event?' },
    { label: '📝 Meeting agenda', action: 'Generate a meeting agenda for our next planning session' },
    { label: '💰 Budget ideas', action: 'What budget items should we consider for this event?' },
    { label: '📣 Marketing plan', action: 'Suggest a marketing plan to promote this event on campus' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose}></div>
      <div className="relative bg-white w-full sm:w-[440px] h-[85vh] sm:h-[600px] sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <span className="text-sm">🤖</span>
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">AI Assistant</h3>
              <p className="text-white/70 text-[10px]">Powered by Gemini</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition p-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-md'
                  : 'bg-gray-100 text-gray-800 rounded-bl-md'
              }`}>
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick actions */}
        {messages.length <= 1 && (
          <div className="px-4 pb-2 flex gap-2 overflow-x-auto scrollbar-hide">
            {quickActions.map((qa, idx) => (
              <button
                key={idx}
                onClick={() => { setInput(qa.action); }}
                className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full whitespace-nowrap hover:bg-indigo-100 transition font-medium flex-shrink-0"
              >
                {qa.label}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <form onSubmit={sendMessage} className="p-3 border-t border-gray-100 flex gap-2 flex-shrink-0">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything about event planning..."
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            disabled={loading}
            aria-label="AI chat input"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
