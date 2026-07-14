import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

interface User {
  id: string;
  username: string;
  name: string;
  avatar: string;
}

interface Chat {
  id: string;
  name: string;
  isGroup: boolean;
  avatar: string | null;
  lastMessage: string;
}

interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  timestamp: number;
}

interface ChatStore {
  currentUser: User | null;
  token: string | null;
  socket: Socket | null;
  chats: Chat[];
  activeChatId: string | null;
  messages: Message[];
  auth: (type: 'login' | 'register', username: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
  setActiveChat: (chatId: string) => void;
  sendMessage: (text: string) => void;
  fetchChats: () => Promise<void>;
  fetchMessages: (chatId: string) => Promise<void>;
  searchUsers: (query: string) => Promise<User[]>;
  createChat: (targetUserId: string) => Promise<void>;
}

const SERVER_URL = 'http://localhost:4000';

export const useChatStore = create<ChatStore>((set, get) => ({
  currentUser: null,
  token: localStorage.getItem('token'),
  socket: null,
  chats: [],
  activeChatId: null,
  messages: [],

  auth: async (type, username, password, name) => {
    try {
      const res = await fetch(`${SERVER_URL}/api/auth/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, name })
      });
      if (!res.ok) throw new Error('Auth failed');
      const data = await res.json();
      localStorage.setItem('token', data.token);
      set({ currentUser: data.user, token: data.token });
      
      const socket = io(SERVER_URL);
      socket.on('receive_message', (msg: Message) => {
        set((state) => {
          // Add message if we are in this chat
          if (state.activeChatId === msg.chatId) {
            return { messages: [...state.messages, msg] };
          }
          return state;
        });
      });
      set({ socket });
      await get().fetchChats();
    } catch (e) {
      console.error(e);
      throw e;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    get().socket?.disconnect();
    set({ currentUser: null, token: null, chats: [], messages: [], activeChatId: null, socket: null });
  },

  fetchChats: async () => {
    const { token, socket } = get();
    if (!token) return;
    try {
      const res = await fetch(`${SERVER_URL}/api/chats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const chats = await res.json();
      set({ chats });
      if (socket && chats.length > 0) {
        socket.emit('join_chats', chats.map((c: Chat) => c.id));
      }
    } catch (e) {
      console.error(e);
    }
  },

  fetchMessages: async (chatId) => {
    const { token } = get();
    try {
      const res = await fetch(`${SERVER_URL}/api/messages/${chatId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const messages = await res.json();
      set({ messages });
    } catch (e) {
      console.error(e);
    }
  },

  setActiveChat: (chatId) => {
    set({ activeChatId: chatId });
    get().fetchMessages(chatId);
  },

  sendMessage: (text) => {
    const { socket, activeChatId, currentUser } = get();
    if (socket && activeChatId && currentUser) {
      socket.emit('send_message', {
        chatId: activeChatId,
        senderId: currentUser.id,
        text
      });
    }
  },

  searchUsers: async (query) => {
    const { token } = get();
    const res = await fetch(`${SERVER_URL}/api/users/search?q=${query}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.json();
  },

  createChat: async (targetUserId) => {
    const { token } = get();
    const res = await fetch(`${SERVER_URL}/api/chats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ targetUserId })
    });
    const newChat = await res.json();
    await get().fetchChats();
    get().setActiveChat(newChat.id);
  }
}));
