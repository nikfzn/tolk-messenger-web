import React, { useState } from 'react';
import { useChatStore } from '../store/chatStore';
import { MessageCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const login = useChatStore((state) => state.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      await login(username, name || username);
    }
  };

  return (
    <div className="login-container">
      <div className="glass login-card">
        <div className="login-logo">
          <MessageCircle size={40} />
        </div>
        <h1 className="login-title">Welcome to Tolk</h1>
        <p className="login-subtitle">Connect with friends effortlessly.</p>
        
        <form onSubmit={handleSubmit} className="login-form">
          <input
            type="text"
            className="input-base"
            placeholder="Username (e.g., john)"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="text"
            className="input-base"
            placeholder="Display Name (optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button type="submit" className="btn" style={{ marginTop: 8 }}>
            Start Talking
          </button>
        </form>
      </div>
    </div>
  );
};
