import React, { useState, useRef, useEffect } from 'react';
import { useChatStore } from '../store/chatStore';
import { Send, Paperclip, MoreVertical, Phone, Video } from 'lucide-react';

export const ChatArea: React.FC = () => {
  const { messages, currentUser, activeChatId, chats, sendMessage } = useChatStore();
  const [text, setText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeChat = chats.find(c => c.id === activeChatId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      sendMessage(text);
      setText('');
    }
  };

  if (!activeChat) {
    return <div className="chat-area" style={{ alignItems: 'center', justifyContent: 'center' }}>Select a chat to start messaging</div>;
  }

  return (
    <div className="chat-area">
      <div className="chat-header">
        <img src={`https://i.pravatar.cc/150?u=${activeChat.id}`} alt="Avatar" className="avatar" style={{ width: 40, height: 40 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 16 }}>{activeChat.name}</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{messages.length} messages</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-icon"><Phone size={20} /></button>
          <button className="btn-icon"><Video size={20} /></button>
          <button className="btn-icon"><MoreVertical size={20} /></button>
        </div>
      </div>

      <div className="messages-container">
        {messages.map((msg, index) => {
          const isMine = msg.senderId === currentUser?.id;
          return (
            <div key={msg.id || index} className={`message-wrapper ${isMine ? 'mine' : 'other'}`}>
              <div className="message-bubble">
                {msg.text}
              </div>
              <div className="message-time">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="chat-input-area">
        <button type="button" className="btn-icon">
          <Paperclip size={20} />
        </button>
        <input
          type="text"
          className="chat-input"
          placeholder="Write a message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button type="submit" className="btn-icon" style={{ color: text.trim() ? 'var(--primary)' : 'var(--text-muted)' }}>
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};
