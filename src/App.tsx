import React, { useEffect } from 'react';
import { useChatStore } from './store/chatStore';
import { Auth } from './components/Auth';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';

const App: React.FC = () => {
  const { currentUser, fetchChats, initSocket } = useChatStore();

  useEffect(() => {
    if (currentUser) {
      fetchChats();
      initSocket();
    }
  }, [currentUser, fetchChats, initSocket]);

  if (!currentUser) {
    return <Auth />;
  }

  return (
    <div className="app-layout fade-in">
      <Sidebar />
      <ChatArea />
    </div>
  );
};

export default App;
