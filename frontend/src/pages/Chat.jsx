import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

export default function Chat() {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [warning, setWarning] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  
  const { user } = useAuth();

  const myId = user?.email || "anonymous_operator";
  const receiverId = "airs_support_lead";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_API_BASE_URL || '/';
    const newSocket = io(socketUrl, { path: '/socket.io' });
    setSocket(newSocket);

    newSocket.on('connect', () => {
      newSocket.emit('register_user', { user_id: myId });
    });

    newSocket.on('receive_message', (data) => {
      setIsTyping(false);
      setMessages(prev => [...prev, { id: Date.now(), text: data.message, sender: 'them' }]);
    });

    newSocket.on('warning', (data) => {
      setIsTyping(false);
      setWarning(data.msg);
      setTimeout(() => setWarning(''), 5000);
    });

    return () => newSocket.disconnect();
  }, [myId]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (input.trim() && socket) {
      socket.emit('send_message', {
        sender_id: myId,
        receiver_id: receiverId,
        message: input
      });
      setMessages(prev => [...prev, { id: Date.now(), text: input, sender: 'me' }]);
      setInput('');
      setIsTyping(true); // AI is "thinking"
    }
  };

  return (
    <div className="flex-grow flex flex-col p-2 md:p-6 max-w-5xl mx-auto w-full h-[calc(100vh-120px)] md:h-[calc(100vh-160px)]">
      <div className="bg-brand-navy-light rounded-3xl shadow-2xl border border-slate-800 flex flex-col h-full overflow-hidden">
        
        {/* Chat Header */}
        <div className="bg-slate-900 text-white p-5 flex justify-between items-center border-b border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-brand-cyber-green/20 rounded-full flex items-center justify-center border border-brand-cyber-green/30">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-brand-cyber-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h2 className="font-black text-sm tracking-widest uppercase">AIRS AI Support</h2>
              <p className="text-[10px] text-brand-cyber-green flex items-center gap-1.5 uppercase font-mono mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-cyber-green animate-pulse"></span> Encrypted_Secure_Session
              </p>
            </div>
          </div>
        </div>

        {/* Warning Banner */}
        {warning && (
          <div className="bg-red-600 text-white py-2 px-4 text-center text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">
            SYSTEM_INTERRUPT: {warning}
          </div>
        )}

        {/* Messages Area */}
        <div className="flex-grow p-6 overflow-y-auto bg-brand-navy flex flex-col gap-4 custom-scrollbar">
          {messages.map(msg => (
            <div key={msg.id} className={`max-w-[85%] md:max-w-[70%] p-4 rounded-2xl ${
              msg.sender === 'me' 
                ? 'bg-brand-cyber-green text-brand-navy self-end rounded-tr-none font-bold' 
                : 'bg-brand-navy-light text-slate-200 self-start rounded-tl-none border border-slate-800'
            }`}>
              <p className="text-sm leading-relaxed">{msg.text}</p>
              <p className={`text-[8px] mt-2 font-mono uppercase opacity-50 ${msg.sender === 'me' ? 'text-right' : ''}`}>
                {msg.sender === 'me' ? 'Sent_By_Me' : 'Sent_By_AI'}
              </p>
            </div>
          ))}
          {isTyping && (
            <div className="bg-brand-navy-light text-slate-400 self-start p-4 rounded-2xl rounded-tl-none border border-slate-800 animate-pulse">
              <p className="text-[10px] font-mono uppercase tracking-widest">AI is analyzing query...</p>
            </div>
          )}
          {messages.length === 0 && !isTyping && (
            <div className="flex flex-col items-center justify-center h-full opacity-30">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
               </svg>
               <p className="text-xs font-mono uppercase tracking-[0.3em]">Establishing secure data link...</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-6 bg-slate-900 border-t border-slate-800">
          <form onSubmit={sendMessage} className="flex gap-4">
            <input 
              type="text" 
              className="flex-grow p-4 rounded-2xl bg-brand-navy border border-slate-800 focus:ring-1 focus:ring-brand-cyber-green text-white text-sm outline-none placeholder:text-slate-600 font-mono"
              placeholder="Transmit secure message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button type="submit" className="bg-brand-cyber-green text-brand-navy p-4 rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(100,255,218,0.2)]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
