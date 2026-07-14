import React from 'react';
import { useChatStore } from './store/chatStore';
import { Login } from './components/Login';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';

const App: React.FC = () => {
  const currentUser = useChatStore((state) => state.currentUser);

  if (!currentUser) {
    return <Login />;
  }

  return (
    <div className="app-container">
      <Sidebar />
      <ChatArea />
    </div>
  );
};

export default App;
