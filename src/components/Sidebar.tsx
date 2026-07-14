import React, { useEffect, useRef, useState } from 'react';
import { useChatStore, Chat, User } from '../store/chatStore';
import { Search, LogOut, MessageCircle, X, Plus } from 'lucide-react';

function getInitials(name: string | null | undefined, username?: string): string {
  const str = name || username || '?';
  return str.slice(0, 1).toUpperCase();
}

function formatTime(timestamp: number | null): string {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays < 7) {
    return d.toLocaleDateString([], { weekday: 'short' });
  }
  return d.toLocaleDateString([], { day: '2-digit', month: '2-digit' });
}

function AvatarItem({ name, avatar, username, size = '' }: { name?: string | null, avatar?: string | null, username?: string, size?: string }) {
  if (avatar) {
    return <img className={`avatar ${size}`} src={avatar} alt={name || ''} onError={(e: any) => { e.target.onerror = null; e.target.style.display = 'none'; }} />;
  }
  return <div className={`avatar-placeholder ${size}`}>{getInitials(name, username)}</div>;
}

export const Sidebar: React.FC = () => {
  const {
    currentUser, chats, activeChatId, logout,
    searchQuery, searchResults, searchUsers, clearSearch, startChat, setActiveChat
  } = useChatStore();

  const searchRef = useRef<HTMLInputElement>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => searchUsers(q), 300);
    // Update immediately for UI
    useChatStore.setState({ searchQuery: q });
  };

  const handleClearSearch = () => {
    clearSearch();
    if (searchRef.current) searchRef.current.value = '';
  };

  const showSearch = searchQuery.trim().length > 0;

  return (
    <div className="sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <div className="sidebar-title-row">
          <span className="sidebar-title">Tolk</span>
          <div style={{ display: 'flex', gap: 4 }}>
            <button className="btn-icon" onClick={logout} title="Выйти">
              <LogOut size={18} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="search-box">
          <Search size={16} />
          <input
            ref={searchRef}
            className="search-input"
            type="text"
            placeholder="Поиск по username..."
            defaultValue={searchQuery}
            onChange={handleSearchChange}
          />
          {searchQuery && (
            <button className="btn-icon" style={{ position: 'absolute', right: 4 }} onClick={handleClearSearch}>
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Chat List or Search Results */}
      <div className="chat-list">
        {showSearch ? (
          <div className="search-results">
            {searchResults.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                Пользователи не найдены
              </div>
            ) : (
              <>
                <div className="section-label">Пользователи</div>
                {searchResults.map((user: User) => (
                  <div key={user.id} className="search-result-item" onClick={() => startChat(user.id)}>
                    <AvatarItem name={user.name} avatar={user.avatar} username={user.username} />
                    <div className="search-result-info">
                      <div className="search-result-name">{user.name || user.username}</div>
                      <div className="search-result-username">@{user.username}</div>
                    </div>
                    <button className="btn-icon"><Plus size={16} /></button>
                  </div>
                ))}
              </>
            )}
          </div>
        ) : (
          <>
            {chats.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <MessageCircle size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                <div style={{ fontSize: 14 }}>Нет чатов</div>
                <div style={{ fontSize: 13, marginTop: 4 }}>Найдите пользователя через поиск</div>
              </div>
            ) : (
              chats.map((chat: Chat) => (
                <div
                  key={chat.id}
                  className={`chat-item ${activeChatId === chat.id ? 'active' : ''}`}
                  onClick={() => setActiveChat(chat.id)}
                >
                  <div className="avatar-wrap">
                    <AvatarItem name={chat.name} avatar={chat.avatar} />
                  </div>
                  <div className="chat-item-body">
                    <div className="chat-item-top">
                      <div className="chat-item-name">{chat.name}</div>
                      <div className="chat-item-time">
                        {chat.lastMessage ? formatTime(chat.lastMessage.timestamp) : ''}
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div className="chat-item-preview">
                        {chat.lastMessage?.text || 'Нет сообщений'}
                      </div>
                      {chat.unreadCount > 0 && (
                        <div className="unread-badge">{chat.unreadCount}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>

      {/* Current User Bar */}
      <div className="current-user-bar">
        <AvatarItem name={currentUser?.name} avatar={currentUser?.avatar} username={currentUser?.username} size="sm" />
        <div className="current-user-info">
          <div className="current-user-name">{currentUser?.name || currentUser?.username}</div>
          <div className="current-user-username">@{currentUser?.username}</div>
        </div>
      </div>
    </div>
  );
};
