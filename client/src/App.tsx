import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';

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
  {
    id: '3',
    userId: '3',
    userName: 'Alex Rivera',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
    content: 'Quick question - did we implement the dark mode toggle? I remember that was part of the requirements.',
    timestamp: new Date('2025-12-06T10:15:00'),
    threadCount: 2,
  },
  {
    id: '4',
    userId: '1',
    userName: 'Sarah Chen',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    content: 'Yes! It\'s in the settings menu. You can toggle between light and dark themes.',
    timestamp: new Date('2025-12-06T10:20:00'),
    reactions: [
      { emoji: '✅', count: 1, users: ['Alex'] },
    ],
  },
  {
    id: '5',
    userId: '4',
    userName: 'Jamie Lee',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jamie',
    content: 'Perfect timing! I\'ll run through the QA checklist this afternoon and report back.',
    timestamp: new Date('2025-12-06T10:30:00'),
  },
];

export default function App() {
  const [channels] = useState<Channel[]>(initialChannels);
  const [directMessages] = useState<DirectMessage[]>(initialDMs);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [activeChannel, setActiveChannel] = useState<Channel>(initialChannels[0]);
  const [activeView, setActiveView] = useState<'channel' | 'dm'>('channel');

  const handleSendMessage = (content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      userId: 'current',
      userName: 'You',
      userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Current',
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
                ? { ...r, count: r.count + 1, users: [...r.users, 'You'] }
                : r
            ),
          };
        } else {
          return {
            ...msg,
            reactions: [...reactions, { emoji, count: 1, users: ['You'] }],
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
