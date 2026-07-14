import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

interface User {
  id: string;
  username: string;
  name: string;
  status: string;
  avatar: string;
}

interface Chat {
  id: string;
  name: string;
  type: string;
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
  socket: Socket | null;
  chats: Chat[];
  activeChatId: string | null;
  messages: Message[];
  login: (username: string, name?: string) => Promise<void>;
  setActiveChat: (chatId: string) => void;
  sendMessage: (text: string) => void;
  initSocket: (userId: string) => void;
  fetchChats: () => Promise<void>;
  fetchMessages: (chatId: string) => Promise<void>;
}

const SERVER_URL = 'http://localhost:4000';

export const useChatStore = create<ChatStore>((set, get) => ({
  currentUser: null,
  socket: null,
  chats: [],
  activeChatId: null,
  messages: [],

  login: async (username, name) => {
    try {
      const res = await fetch(`${SERVER_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, name })
      });
      const user = await res.json();
      set({ currentUser: user });
      get().initSocket(user.id);
      await get().fetchChats();
    } catch (e) {
      console.error('Login failed', e);
    }
  },

  initSocket: (userId) => {
    const socket = io(SERVER_URL);
    socket.on('connect', () => {
      socket.emit('join', userId);
    });

    socket.on('receive_message', (msg: Message) => {
      set((state) => ({ messages: [...state.messages, msg] }));
    });

    set({ socket });
  },

  fetchChats: async () => {
    try {
      const res = await fetch(`${SERVER_URL}/api/chats`);
      const chats = await res.json();
      set({ chats });
      if (chats.length > 0 && !get().activeChatId) {
        get().setActiveChat(chats[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  },

  fetchMessages: async (chatId) => {
    try {
      const res = await fetch(`${SERVER_URL}/api/messages/${chatId}`);
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
  }
}));
