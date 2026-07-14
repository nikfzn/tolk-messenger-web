import React, { useState } from 'react';
import { useChatStore } from '../store/chatStore';
import { MessageCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const auth = useChatStore((state) => state.auth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (isRegister) {
        await auth('register', username, password, name || username);
      } else {
        await auth('login', username, password);
      }
    } catch (err) {
      setError('Authentication failed. Please check your credentials.');
    }
  };

  return (
    <div className="login-container">
      <div className="glass login-card">
        <div className="login-logo">
          <MessageCircle size={40} />
        </div>
        <h1 className="login-title">{isRegister ? 'Create Account' : 'Welcome to Tolk'}</h1>
        <p className="login-subtitle">Connect with friends effortlessly.</p>
        
        {error && <div style={{ color: '#ef4444', marginBottom: 16 }}>{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <input
            type="text"
            className="input-base"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          {isRegister && (
            <input
              type="text"
              className="input-base"
              placeholder="Display Name (optional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          )}
          <input
            type="password"
            className="input-base"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="btn" style={{ marginTop: 8 }}>
            {isRegister ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        <p style={{ marginTop: 24, color: 'var(--text-muted)', fontSize: 14 }}>
          {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
          <span 
            style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 500 }}
            onClick={() => setIsRegister(!isRegister)}
          >
            {isRegister ? 'Sign In' : 'Sign Up'}
          </span>
        </p>
      </div>
    </div>
  );
};
