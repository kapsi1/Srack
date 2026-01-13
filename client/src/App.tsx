import { useEffect, useState } from 'react';
import { AuthPage } from './components/AuthPage';
import { ChatArea } from './components/ChatArea';
import { Sidebar } from './components/Sidebar';
import { useSocket } from './context/SocketContext';

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
	{
		id: '1',
		userName: 'Sarah Chen',
		userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
		isOnline: true,
		unreadCount: 2,
	},
	{
		id: '2',
		userName: 'Mike Johnson',
		userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike',
		isOnline: true,
	},
	{
		id: '3',
		userName: 'Alex Rivera',
		userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
		isOnline: false,
	},
	{
		id: '4',
		userName: 'Jamie Lee',
		userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jamie',
		isOnline: true,
	},
];

const initialMessages: Message[] = [
	{
		id: '1',
		userId: '1',
		userName: 'Sarah Chen',
		userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
		content:
			'Hey team! Just pushed the new feature to staging. Would love to get your feedback before we deploy to production.',
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
    
    // Hooks must be unconditional
	const { socket } = useSocket();

	useEffect(() => {
		const savedUser = localStorage.getItem('user');
		if (savedUser && token) {
			setCurrentUser(JSON.parse(savedUser));
		}
	}, [token]);

	useEffect(() => {
		if (!socket || !currentUser) return; // Wait for login

		// Join the new channel
		socket.emit('join_channel', activeChannel.id);

		const handleNewMessage = (message: any) => {
			const newMessage: Message = {
				id: message.id,
				userId: message.sender?.id || message.senderId,
				userName: message.sender?.username || 'Unknown',
				userAvatar: message.sender?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${message.sender?.username || 'Unknown'}`,
				content: message.content,
				timestamp: new Date(message.createdAt),
				reactions: [],
				threadCount: 0
			};
			
			if (message.channelId === activeChannel.id) {
				setMessages((prev) => [...prev, newMessage]);
			}
		};

		const handleReactionAdded = (reaction: any) => {
			if (reaction.message?.channelId && reaction.message.channelId !== activeChannel.id) return;

			setMessages((prevMessages) =>
				prevMessages.map((msg) => {
					if (msg.id === reaction.messageId) {
						const reactions = msg.reactions || [];
						const existingReactionIndex = reactions.findIndex((r) => r.emoji === reaction.emoji);

						if (existingReactionIndex > -1) {
							const updatedReactions = [...reactions];
							const existing = updatedReactions[existingReactionIndex];
							if (!existing.users.includes(reaction.user.username)) {
								updatedReactions[existingReactionIndex] = {
									...existing,
									count: existing.count + 1,
									users: [...existing.users, reaction.user.username]
								};
							}
							return { ...msg, reactions: updatedReactions };
						} else {
							return {
								...msg,
								reactions: [...reactions, { emoji: reaction.emoji, count: 1, users: [reaction.user.username] }]
							};
						}
					}
					return msg;
				})
			);
		};

		socket.on('new_message', handleNewMessage);
		socket.on('reaction_added', handleReactionAdded);

		return () => {
			socket.emit('leave_channel', activeChannel.id);
			socket.off('new_message', handleNewMessage);
			socket.off('reaction_added', handleReactionAdded);
		};
	}, [socket, activeChannel.id, currentUser]);

	const handleLogin = (user: User, token: string) => {
		setCurrentUser(user);
		setToken(token);
		localStorage.setItem('token', token);
		localStorage.setItem('user', JSON.stringify(user));
	};

	const handleLogout = () => {
		setCurrentUser(null);
		setToken(null);
		localStorage.removeItem('token');
		localStorage.removeItem('user');
	};

	if (!currentUser) {
		return <AuthPage onLogin={handleLogin} />;
	}
    
    // ... handleSendMessage ... 



	const handleSendMessage = (content: string) => {
		if (!currentUser || !socket) return;
		
		// For now we don't optimistically update, waiting for server echo
        socket.emit("send_message", {
            content,
            channelId: activeChannel.id,
            senderId: currentUser.id
        });
	};

	const handleAddReaction = (messageId: string, emoji: string) => {
		if (!currentUser || !socket) return;

        socket.emit("add_reaction", {
            messageId,
            emoji,
            userId: currentUser.id,
            channelId: activeChannel.id
        });
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
				currentUser={currentUser}
				onLogout={handleLogout}
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
