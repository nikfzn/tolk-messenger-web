import React, { useState } from 'react';
import { useChatStore } from '../store/chatStore';
import { Menu, Search, LogOut, Plus } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { chats, activeChatId, setActiveChat, currentUser, logout, searchUsers, createChat } = useChatStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.trim()) {
      const results = await searchUsers(query);
      setSearchResults(results.filter((u: any) => u.id !== currentUser?.id));
    } else {
      setSearchResults([]);
    }
  };

  const handleCreateChat = async (userId: string) => {
    await createChat(userId);
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <div className="sidebar glass-panel">
      <div className="sidebar-header" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button className="btn-icon">
            <Menu size={20} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 500 }}>{currentUser?.name}</span>
            <button className="btn-icon" onClick={logout} title="Logout">
              <LogOut size={18} />
            </button>
          </div>
        </div>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            className="input-base" 
            placeholder="Search users..." 
            value={searchQuery}
            onChange={handleSearch}
            style={{ paddingLeft: 34, borderRadius: 20, padding: '8px 8px 8px 34px', fontSize: 14 }}
          />
        </div>
      </div>
      
      <div className="chat-list">
        {searchResults.length > 0 ? (
          <div>
            <div style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Global Search</div>
            {searchResults.map(user => (
              <div key={user.id} className="chat-item" onClick={() => handleCreateChat(user.id)}>
                <img src={user.avatar} alt="Avatar" className="avatar" />
                <div className="chat-item-info">
                  <div className="chat-item-name">{user.name}</div>
                  <div className="chat-item-preview">@{user.username}</div>
                </div>
                <button className="btn-icon"><Plus size={16}/></button>
              </div>
            ))}
          </div>
        ) : (
          chats.map(chat => (
            <div 
              key={chat.id} 
              className={`chat-item ${activeChatId === chat.id ? 'active' : ''}`}
              onClick={() => setActiveChat(chat.id)}
            >
              <img src={chat.avatar || `https://i.pravatar.cc/150?u=${chat.id}`} alt="Avatar" className="avatar" />
              <div className="chat-item-info">
                <div className="chat-item-name">{chat.name}</div>
                <div className="chat-item-preview">{chat.lastMessage || 'No messages yet'}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
