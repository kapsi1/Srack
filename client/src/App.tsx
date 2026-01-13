import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { AuthPage } from './components/AuthPage';

export interface User {
  id: string;
  email: string;
  username: string;
  avatar?: string;
}

export interface Message {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  timestamp: Date;
  reactions?: { emoji: string; count: number; users: string[] }[];
  threadCount?: number;
}

export interface Channel {
  id: string;
  name: string;
  isPrivate?: boolean;
  unreadCount?: number;
}

export interface DirectMessage {
  id: string;
  userName: string;
  userAvatar: string;
  isOnline: boolean;
  unreadCount?: number;
}

const initialChannels: Channel[] = [
  { id: '1', name: 'general' },
  { id: '2', name: 'random' },
  { id: '3', name: 'engineering', unreadCount: 3 },
  { id: '4', name: 'design' },
  { id: '5', name: 'marketing', isPrivate: true },
];

const initialDMs: DirectMessage[] = [
  { id: '1', userName: 'Sarah Chen', userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah', isOnline: true, unreadCount: 2 },
  { id: '2', userName: 'Mike Johnson', userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike', isOnline: true },
  { id: '3', userName: 'Alex Rivera', userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex', isOnline: false },
  { id: '4', userName: 'Jamie Lee', userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jamie', isOnline: true },
];

const initialMessages: Message[] = [
  {
    id: '1',
    userId: '1',
    userName: 'Sarah Chen',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    content: 'Hey team! Just pushed the new feature to staging. Would love to get your feedback before we deploy to production.',
    timestamp: new Date('2025-12-06T09:30:00'),
    reactions: [
      { emoji: '👍', count: 3, users: ['Mike', 'Alex', 'Jamie'] },
      { emoji: '🚀', count: 2, users: ['Mike', 'Alex'] },
    ],
    threadCount: 5,
  },
  {
    id: '2',
    userId: '2',
    userName: 'Mike Johnson',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike',
    content: 'Looks great! I tested it on my end and everything works smoothly.',
    timestamp: new Date('2025-12-06T09:45:00'),
  },
];

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [channels] = useState<Channel[]>(initialChannels);
  const [directMessages] = useState<DirectMessage[]>(initialDMs);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [activeChannel, setActiveChannel] = useState<Channel>(initialChannels[0]);
  const [activeView, setActiveView] = useState<'channel' | 'dm'>('channel');

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser && token) {
      setCurrentUser(JSON.parse(savedUser));
    }
  }, [token]);

  const handleLogin = (user: User, token: string) => {
    setCurrentUser(user);
    setToken(token);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  };

  const _handleLogout = () => {
    setCurrentUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  if (!currentUser) {
    return <AuthPage onLogin={handleLogin} />;
  }

  const handleSendMessage = (content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      userId: currentUser.id,
      userName: currentUser.username,
      userAvatar: currentUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.username}`,
      content,
      timestamp: new Date(),
    };
    setMessages([...messages, newMessage]);
  };

  const handleAddReaction = (messageId: string, emoji: string) => {
    setMessages(messages.map(msg => {
      if (msg.id === messageId) {
        const reactions = msg.reactions || [];
        const existingReaction = reactions.find(r => r.emoji === emoji);
        
        if (existingReaction) {
          return {
            ...msg,
            reactions: reactions.map(r => 
              r.emoji === emoji 
                ? { ...r, count: r.count + 1, users: [...r.users, currentUser.username] }
                : r
            ),
          };
        } else {
          return {
            ...msg,
            reactions: [...reactions, { emoji, count: 1, users: [currentUser.username] }],
          };
        }
      }
      return msg;
    }));
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        channels={channels}
        directMessages={directMessages}
        activeChannel={activeChannel}
        onChannelSelect={setActiveChannel}
        activeView={activeView}
        onViewChange={setActiveView}
      />
      <ChatArea
        channel={activeChannel}
        messages={messages}
        onSendMessage={handleSendMessage}
        onAddReaction={handleAddReaction}
      />
    </div>
  );
}
