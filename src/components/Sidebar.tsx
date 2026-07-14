import React from 'react';
import { useChatStore } from '../store/chatStore';
import { Menu, Search } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { chats, activeChatId, setActiveChat, currentUser } = useChatStore();

  return (
    <div className="sidebar glass-panel">
      <div className="sidebar-header">
        <button className="btn-icon">
          <Menu size={20} />
        </button>
        <div style={{ flex: 1, padding: '0 12px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="input-base" 
              placeholder="Search" 
              style={{ paddingLeft: 34, borderRadius: 20, padding: '8px 8px 8px 34px', fontSize: 14 }}
            />
          </div>
        </div>
      </div>
      <div className="chat-list">
        {chats.map(chat => (
          <div 
            key={chat.id} 
            className={`chat-item ${activeChatId === chat.id ? 'active' : ''}`}
            onClick={() => setActiveChat(chat.id)}
          >
            <img src={`https://i.pravatar.cc/150?u=${chat.id}`} alt="Avatar" className="avatar" />
            <div className="chat-item-info">
              <div className="chat-item-name">{chat.name}</div>
              <div className="chat-item-preview">{chat.lastMessage}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
