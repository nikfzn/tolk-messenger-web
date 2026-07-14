import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

export interface User {
  id: string;
  username: string;
  name: string | null;
  avatar: string | null;
}

export interface LastMessage {
  text: string;
  timestamp: number;
  senderId: string;
}

export interface Chat {
  id: string;
  name: string;
  isGroup: boolean;
  avatar: string | null;
  lastMessage: LastMessage | null;
  unreadCount: number;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  timestamp: number;
  sender?: User;
}

interface ChatStore {
  // Auth
  currentUser: User | null;
  token: string | null;

  // Socket
  socket: Socket | null;

  // Data
  chats: Chat[];
  activeChatId: string | null;
  messages: Message[];
  typingUsers: Record<string, Set<string>>;

  // Search
  searchQuery: string;
  searchResults: User[];

  // Actions
  auth: (type: 'login' | 'register', data: { username: string; password: string; name?: string }) => Promise<void>;
  logout: () => void;
  initSocket: () => void;

  fetchChats: () => Promise<void>;
  setActiveChat: (chatId: string) => void;
  fetchMessages: (chatId: string) => Promise<void>;

  sendMessage: (text: string) => void;
  emitTyping: () => void;

  searchUsers: (query: string) => Promise<void>;
  clearSearch: () => void;
  startChat: (targetUserId: string) => Promise<void>;

  getDisplayName: (chat: Chat) => string;
}

const API = 'http://localhost:4000/api';
const WS = 'http://localhost:4000';

function getHeaders(token: string | null) {
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const useChatStore = create<ChatStore>((set, get) => ({
  currentUser: (() => {
    try {
      const u = localStorage.getItem('tolk_user');
      return u ? JSON.parse(u) : null;
    } catch { return null; }
  })(),
  token: localStorage.getItem('tolk_token'),
  socket: null,
  chats: [],
  activeChatId: null,
  messages: [],
  typingUsers: {},
  searchQuery: '',
  searchResults: [],

  auth: async (type, { username, password, name }) => {
    const res = await fetch(`${API}/auth/${type}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, name }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Authentication failed');

    localStorage.setItem('tolk_token', data.token);
    localStorage.setItem('tolk_user', JSON.stringify(data.user));
    set({ token: data.token, currentUser: data.user });

    get().initSocket();
    await get().fetchChats();
  },

  logout: () => {
    localStorage.removeItem('tolk_token');
    localStorage.removeItem('tolk_user');
    get().socket?.disconnect();
    set({
      currentUser: null,
      token: null,
      socket: null,
      chats: [],
      activeChatId: null,
      messages: [],
    });
  },

  initSocket: () => {
    const { token, socket: existingSocket } = get();
    if (existingSocket?.connected) return;
    
    const socket = io(WS, { transports: ['websocket'] });

    socket.on('connect', () => {
      socket.emit('authenticate', token);
    });

    socket.on('new_message', (msg: Message) => {
      const { activeChatId, chats } = get();

      // Add to messages if active chat
      if (msg.chatId === activeChatId) {
        set((state) => ({ messages: [...state.messages, msg] }));
      }

      // Update last message in chat list
      set((state) => ({
        chats: state.chats.map((c) =>
          c.id === msg.chatId
            ? {
                ...c,
                lastMessage: { text: msg.text, timestamp: msg.timestamp, senderId: msg.senderId },
                unreadCount: msg.chatId !== activeChatId ? c.unreadCount + 1 : 0,
              }
            : c
        ).sort((a, b) => (b.lastMessage?.timestamp ?? 0) - (a.lastMessage?.timestamp ?? 0)),
      }));
    });

    socket.on('user_typing', ({ chatId, username }: { chatId: string; username: string }) => {
      set((state) => {
        const prev = new Set(state.typingUsers[chatId] || []);
        prev.add(username);
        return { typingUsers: { ...state.typingUsers, [chatId]: prev } };
      });
      setTimeout(() => {
        set((state) => {
          const prev = new Set(state.typingUsers[chatId] || []);
          prev.delete(username);
          return { typingUsers: { ...state.typingUsers, [chatId]: prev } };
        });
      }, 2500);
    });

    socket.on('new_chat', async () => {
      await get().fetchChats();
    });

    set({ socket });
  },

  fetchChats: async () => {
    const { token, socket } = get();
    if (!token) return;

    const res = await fetch(`${API}/chats`, { headers: getHeaders(token) });
    if (!res.ok) return;
    const chats: Chat[] = await res.json();
    set({ chats });

    if (socket) {
      socket.emit('join_chats', chats.map((c) => c.id));
    }
  },

  setActiveChat: (chatId) => {
    set((state) => ({
      activeChatId: chatId,
      chats: state.chats.map((c) => (c.id === chatId ? { ...c, unreadCount: 0 } : c)),
    }));
    get().fetchMessages(chatId);
    get().socket?.emit('read_messages', { chatId });
  },

  fetchMessages: async (chatId) => {
    const { token } = get();
    if (!token) return;
    set({ messages: [] });
    const res = await fetch(`${API}/messages/${chatId}`, { headers: getHeaders(token) });
    if (!res.ok) return;
    const messages: Message[] = await res.json();
    set({ messages });
  },

  sendMessage: (text) => {
    const { socket, activeChatId } = get();
    if (!socket || !activeChatId || !text.trim()) return;
    socket.emit('send_message', { chatId: activeChatId, text: text.trim() });
  },

  emitTyping: () => {
    const { socket, activeChatId } = get();
    if (socket && activeChatId) {
      socket.emit('typing', { chatId: activeChatId });
    }
  },

  searchUsers: async (query) => {
    const { token } = get();
    set({ searchQuery: query });
    if (!query.trim()) {
      set({ searchResults: [] });
      return;
    }
    const res = await fetch(`${API}/users/search?q=${encodeURIComponent(query)}`, {
      headers: getHeaders(token),
    });
    if (!res.ok) return;
    const users: User[] = await res.json();
    set({ searchResults: users });
  },

  clearSearch: () => set({ searchQuery: '', searchResults: [] }),

  startChat: async (targetUserId) => {
    const { token } = get();
    const res = await fetch(`${API}/chats`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify({ targetUserId }),
    });
    const chat = await res.json();
    await get().fetchChats();
    get().setActiveChat(chat.id);
    get().clearSearch();
  },

  getDisplayName: (chat) => chat.name || 'Unknown',
}));
