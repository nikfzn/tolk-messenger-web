import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useChatStore, Message, Chat } from '../store/chatStore';
import { Send, Phone, Video, MoreVertical, MessageSquare } from 'lucide-react';

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getInitials(name: string | null | undefined, username?: string): string {
  const str = name || username || '?';
  return str.slice(0, 1).toUpperCase();
}

function AvatarItem({ name, avatar, username, size = '' }: { name?: string | null, avatar?: string | null, username?: string, size?: string }) {
  if (avatar) {
    return <img className={`avatar ${size}`} src={avatar} alt={name || ''} onError={(e: any) => { e.target.onerror = null; e.target.style.display = 'none'; }} />;
  }
  return <div className={`avatar-placeholder ${size}`}>{getInitials(name, username)}</div>;
}

export const ChatArea: React.FC = () => {
  const {
    currentUser, activeChatId, chats, messages,
    sendMessage, emitTyping, typingUsers
  } = useChatStore();

  const [text, setText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const activeChat = chats.find((c) => c.id === activeChatId);
  const typing = typingUsers[activeChatId || ''] || new Set();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [messages, typing]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    emitTyping();
  };

  const handleSend = () => {
    if (text.trim()) {
      sendMessage(text);
      setText('');
      inputRef.current?.focus();
    }
  };

  // Group messages by date
  const groupedMessages = useMemo(() => {
    const groups: { dateLabel: string, messages: Message[] }[] = [];
    let currentDateStr = '';

    messages.forEach(msg => {
      const date = new Date(msg.timestamp);
      const dateStr = date.toLocaleDateString();
      let dateLabel = dateStr;
      
      const now = new Date();
      if (dateStr === now.toLocaleDateString()) dateLabel = 'Сегодня';
      else {
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        if (dateStr === yesterday.toLocaleDateString()) dateLabel = 'Вчера';
        else dateLabel = date.toLocaleDateString([], { day: 'numeric', month: 'long' });
      }

      if (dateStr !== currentDateStr) {
        currentDateStr = dateStr;
        groups.push({ dateLabel, messages: [] });
      }
      groups[groups.length - 1].messages.push(msg);
    });
    return groups;
  }, [messages]);

  if (!activeChat) {
    return (
      <div className="main-area empty-state">
        <div className="empty-state-icon fade-in">
          <MessageSquare size={32} />
        </div>
        <div className="fade-in" style={{ animationDelay: '0.1s' }}>
          <h2>Выберите чат</h2>
          <p>Выберите собеседника из списка слева, чтобы начать общение</p>
        </div>
      </div>
    );
  }

  return (
    <div className="main-area">
      {/* Header */}
      <div className="chat-header">
        <AvatarItem name={activeChat.name} avatar={activeChat.avatar} size="sm" />
        <div className="chat-header-info">
          <div className="chat-header-name">{activeChat.name}</div>
          <div className="chat-header-sub">
            {typing.size > 0 ? (
              <div style={{ color: 'var(--primary)' }}>печатает...</div>
            ) : (
              'был(а) недавно' // Simplified online status
            )}
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-icon"><Phone size={20} /></button>
          <button className="btn-icon"><Video size={20} /></button>
          <button className="btn-icon"><MoreVertical size={20} /></button>
        </div>
      </div>

      {/* Messages */}
      <div className="messages-area">
        {groupedMessages.map((group, gIdx) => (
          <React.Fragment key={gIdx}>
            <div className="date-separator">{group.dateLabel}</div>
            
            {group.messages.map((msg, idx) => {
              const isMine = msg.senderId === currentUser?.id;
              const showAvatar = !isMine && (!group.messages[idx + 1] || group.messages[idx + 1].senderId !== msg.senderId);
              const showName = !isMine && (!group.messages[idx - 1] || group.messages[idx - 1].senderId !== msg.senderId);

              return (
                <div key={msg.id} className={`message-row ${isMine ? 'mine' : 'other'} fade-in`}>
                  {/* Avatar or Spacer */}
                  {!isMine && (
                    showAvatar ? (
                      <div className="message-avatar">
                        <AvatarItem name={msg.sender?.name} avatar={msg.sender?.avatar} username={msg.sender?.username} size="sm" />
                      </div>
                    ) : (
                      <div className="message-spacer" />
                    )
                  )}

                  <div className="message-bubble-wrap">
                    {showName && activeChat.isGroup && (
                      <div className="message-sender-name">{msg.sender?.name || msg.sender?.username}</div>
                    )}
                    <div className="message-bubble">
                      {msg.text}
                      <span className="message-meta">
                        <span className="message-time">{formatTime(msg.timestamp)}</span>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </React.Fragment>
        ))}

        {typing.size > 0 && (
          <div className="message-row other fade-in">
            <div className="message-spacer" />
            <div className="message-bubble-wrap">
              <div className="message-bubble typing-indicator">
                <div className="typing-dot" />
                <div className="typing-dot" />
                <div className="typing-dot" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="input-area">
        <div className="message-input-wrap">
          <textarea
            ref={inputRef}
            className="message-input"
            placeholder="Написать сообщение..."
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            rows={1}
          />
        </div>
        <button 
          className="btn-send"
          onClick={handleSend}
          disabled={!text.trim()}
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};
