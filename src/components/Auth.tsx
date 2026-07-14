import React, { useState } from 'react';
import { useChatStore } from '../store/chatStore';
import { MessageCircle } from 'lucide-react';

export const Auth: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const auth = useChatStore((s) => s.auth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await auth(mode, { username: username.trim(), password, name: name.trim() || username.trim() });
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card fade-in">
        <div className="auth-logo">
          <MessageCircle size={36} color="white" />
        </div>
        <h1 className="auth-title">Tolk</h1>
        <p className="auth-subtitle">
          {mode === 'login' ? 'Войдите в аккаунт' : 'Создайте аккаунт'}
        </p>

        {error && <div className="error-msg" style={{ marginBottom: 16 }}>{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="form-field">
              <label className="form-label">Имя</label>
              <input
                className="form-input"
                type="text"
                placeholder="Ваше имя"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}
          <div className="form-field">
            <label className="form-label">Username</label>
            <input
              className="form-input"
              type="text"
              placeholder="@username"
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/\s/g, '').toLowerCase())}
              required
              autoFocus
            />
          </div>
          <div className="form-field">
            <label className="form-label">Пароль</label>
            <input
              className="form-input"
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Загрузка...' : mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
          </button>
        </form>

        <div className="auth-switch">
          {mode === 'login' ? (
            <>Нет аккаунта? <span onClick={() => { setMode('register'); setError(''); }}>Зарегистрироваться</span></>
          ) : (
            <>Уже есть аккаунт? <span onClick={() => { setMode('login'); setError(''); }}>Войти</span></>
          )}
        </div>
      </div>
    </div>
  );
};
