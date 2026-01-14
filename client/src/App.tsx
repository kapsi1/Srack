import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import { AuthPage } from './components/AuthPage';
import { ChannelInfo } from './components/ChannelInfo';
import { ChatArea } from './components/ChatArea';
import { CreateChannelModal } from './components/CreateChannelModal';
import { ForwardMessageModal } from './components/ForwardMessageModal';
import { MentionsReactionsView } from './components/MentionsReactionsView';
import { SavedItemsView } from './components/SavedItemsView';
import { Sidebar } from './components/Sidebar';
import { ThreadsListView } from './components/ThreadsListView';
import { ThreadView } from './components/ThreadView';
import { useSocket } from './context/SocketContext';
import {
	type Channel as ApiChannel,
	type Message as ApiMessage,
	type User as ApiUser,
	createChannel,
	createDM,
	fetchChannels,
	fetchCurrentUser,
	fetchMessages,
	fetchSavedMessages,
	fetchThreadMessages,
	fetchUsers,
	type MessageReaction,
	sendMessage,
	toggleSavedMessage,
} from './lib/api';

export type User = ApiUser;

export interface DirectMessage {
	id: string;
	userName: string;
	userAvatar: string;
	isOnline: boolean;
	unreadCount?: number;
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
	isSaved?: boolean;
}

export interface Channel {
	id: string;
	name: string;
	description?: string;
	isPrivate?: boolean;
	type?: 'PUBLIC' | 'PRIVATE' | 'DM';
	unreadCount?: number;
	members?: User[];
	createdAt?: string;
}

function mapApiMessagesToMessages(apiMessages: ApiMessage[]): Message[] {
	return apiMessages.map((msg: ApiMessage) => {
		const agg: Record<string, { count: number; users: string[] }> = {};
		msg.reactions?.forEach((r: MessageReaction) => {
			const reactionEmoji = r.emoji;
			if (!agg[reactionEmoji]) {
				agg[reactionEmoji] = { count: 0, users: [] };
			}
			agg[reactionEmoji].count++;
			const username = r.user?.username;
			if (username) agg[reactionEmoji].users.push(username);
		});

		return {
			id: msg.id,
			userId: msg.senderId || msg.sender?.id,
			userName: msg.sender?.username || 'Unknown',
			userAvatar:
				msg.sender?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.sender?.username || 'Unknown'}`,
			content: msg.content,
			timestamp: new Date(msg.createdAt),
			reactions: Object.entries(agg).map(([emoji, data]) => ({
				emoji,
				count: data.count,
				users: data.users,
			})),
			isSaved: msg.isSaved,
			threadCount: msg.threadCount,
		};
	});
}

export default function App() {
	const [currentUser, setCurrentUser] = useState<User | null>(null);
	const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
	const navigate = useNavigate();

	const handleLogout = useCallback(() => {
		setCurrentUser(null);
		setToken(null);
		localStorage.removeItem('token');
		localStorage.removeItem('user');
		navigate('/', { replace: true });
	}, [navigate]);

	const handleLogin = (user: User, token: string) => {
		setCurrentUser(user);
		setToken(token);
		localStorage.setItem('token', token);
		localStorage.setItem('user', JSON.stringify(user));
	};

	useEffect(() => {
		const savedToken = localStorage.getItem('token');
		if (savedToken) {
			fetchCurrentUser()
				.then((user) => {
					setCurrentUser(user);
					setToken(savedToken);
				})
				.catch(() => {
					handleLogout();
				});
		}
	}, [handleLogout]);

	if (!currentUser) {
		return <AuthPage onLogin={handleLogin} />;
	}

	return (
		<Routes>
			<Route path="/" element={<MainApp currentUser={currentUser} onLogout={handleLogout} token={token || ''} />} />
			<Route
				path="/channel/:channelName"
				element={<MainApp currentUser={currentUser} onLogout={handleLogout} token={token || ''} />}
			/>
			<Route
				path="/user/:userName"
				element={<MainApp currentUser={currentUser} onLogout={handleLogout} token={token || ''} />}
			/>
			<Route
				path="/saved-items"
				element={<MainApp currentUser={currentUser} onLogout={handleLogout} token={token || ''} />}
			/>
			<Route
				path="/mentions-reactions"
				element={<MainApp currentUser={currentUser} onLogout={handleLogout} token={token || ''} />}
			/>
			<Route
				path="/threads"
				element={<MainApp currentUser={currentUser} onLogout={handleLogout} token={token || ''} />}
			/>
			<Route path="*" element={<Navigate to="/" replace />} />
		</Routes>
	);
}

function MainApp({ currentUser, onLogout, token }: { currentUser: User; onLogout: () => void; token: string }) {
	const location = useLocation();
	// State for UI
	const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
	const [messages, setMessages] = useState<Message[]>([]);
	const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
	const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
	const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

	const [isCreateChannelModalOpen, setIsCreateChannelModalOpen] = useState(false);
	const [activeThread, setActiveThread] = useState<Message | null>(null);
	const [threadMessages, setThreadMessages] = useState<Message[]>([]);
	const [isForwardModalOpen, setIsForwardModalOpen] = useState(false);
	const [messageToForward, setMessageToForward] = useState<Message | null>(null);

	// Hooks must be unconditional
	const { socket } = useSocket();
	const queryClient = useQueryClient();

	// Data Fetching
	const { data: channelsData } = useQuery({
		queryKey: ['channels'],
		queryFn: fetchChannels,
		enabled: !!token,
	});

	const { data: usersData } = useQuery({
		queryKey: ['users'],
		queryFn: fetchUsers,
		enabled: !!token,
	});

	const { data: messagesData } = useQuery({
		queryKey: ['messages', activeChannel?.id],
		queryFn: () => (activeChannel ? fetchMessages(activeChannel.id) : Promise.resolve([])),
		enabled: !!token && !!activeChannel,
	});

	const { data: savedMessagesData } = useQuery({
		queryKey: ['saved-messages'],
		queryFn: fetchSavedMessages,
		enabled: !!token,
	});

	const { data: threadMessagesData } = useQuery({
		queryKey: ['thread-messages', activeThread?.id],
		queryFn: () => (activeThread ? fetchThreadMessages(activeThread.id) : Promise.resolve([])),
		enabled: !!token && !!activeThread,
	});

	// Mutations
	const dmMutation = useMutation({
		mutationFn: createDM,
		onSuccess: (newChannel: ApiChannel) => {
			// Check if we need to add type info if missing from backend response (it should be there)
			const channel: Channel = {
				id: newChannel.id,
				name: newChannel.name,
				isPrivate: newChannel.isPrivate,
				type: newChannel.type,
				members: newChannel.members,
				unreadCount: 0,
				createdAt: newChannel.createdAt,
			};

			// Optimistically update channels list if not there
			queryClient.setQueryData(['channels'], (old: ApiChannel[] | undefined) => {
				if (!old) return [newChannel];
				if (old.find((c) => c.id === newChannel.id)) return old;
				return [...old, newChannel];
			});

			setActiveChannel(channel);
		},
	});

	const createChannelMutation = useMutation({
		mutationFn: ({ name, isPrivate, description }: { name: string; isPrivate: boolean; description?: string }) =>
			createChannel(name, isPrivate, description),
		onSuccess: (newChannel: ApiChannel) => {
			queryClient.invalidateQueries({ queryKey: ['channels'] });
			navigate(`/channel/${newChannel.name}`);
			setIsCreateChannelModalOpen(false);
		},
	});

	const sendMessageMutation = useMutation({
		mutationFn: ({
			channelId,
			content,
			tempId,
			parentId,
		}: {
			channelId: string;
			content: string;
			tempId: string;
			parentId?: string;
		}) => sendMessage(channelId, content, tempId, parentId),
		onMutate: async ({ channelId, content, tempId, parentId }) => {
			if (parentId) {
				// Optimistic update for thread
				await queryClient.cancelQueries({ queryKey: ['thread-messages', parentId] });
				// logic for optimistic thread update could go here, omitting for brevity/complexity
				return;
			}
			await queryClient.cancelQueries({ queryKey: ['messages', channelId] });

			const previousMessages = queryClient.getQueryData(['messages', channelId]);

			// Optimistic update for React Query cache (ApiMessage structure)
			if (currentUser) {
				const optimisticMessage: ApiMessage = {
					id: tempId,
					content,
					senderId: currentUser.id,
					channelId,
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
					sender: currentUser,
					reactions: [],
				};

				queryClient.setQueryData(['messages', channelId], (old: ApiMessage[] | undefined) => {
					return [...(old || []), optimisticMessage];
				});

				// Also update local state immediately for instant feedback
				setMessages((prev) => [
					...prev,
					{
						id: tempId,
						userId: currentUser.id,
						userName: currentUser.username,
						userAvatar: currentUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.username}`,
						content: content,
						timestamp: new Date(),
						reactions: [],
						threadCount: 0,
					},
				]);
			}

			return { previousMessages };
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['channels'] });
		},
		onError: (_err, { channelId }, context) => {
			if (context?.previousMessages) {
				queryClient.setQueryData(['messages', channelId], context.previousMessages);
			}
		},
		// Remove empty onSuccess as we handle updates via socket/optimistic
	});

	const toggleSaveMutation = useMutation({
		mutationFn: toggleSavedMessage,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['messages'] });
			queryClient.invalidateQueries({ queryKey: ['saved-messages'] });
		},
	});

	const { channelName, userName } = useParams();
	const navigate = useNavigate();

	// Set initial active channel
	useEffect(() => {
		if (channelsData && channelsData.length > 0) {
			if (location.pathname === '/saved-items') return;

			if (channelName) {
				const found = channelsData.find((c) => c.name === channelName);
				if (found && found.id !== activeChannel?.id) {
					setActiveChannel(found);
				}
			} else if (userName) {
				const user = usersData?.find((u) => u.username === userName);
				if (user) {
					const dmChannel = channelsData.find((c) => c.type === 'DM' && c.members?.some((m) => m.id === user.id));
					if (dmChannel) {
						if (dmChannel.id !== activeChannel?.id) {
							setActiveChannel(dmChannel);
						}
					} else {
						// Avoid infinite loop if mutation is slow
						if (!dmMutation.isPending) {
							dmMutation.mutate(user.id);
						}
					}
				}
			} else if (!activeChannel) {
				// If no channel in URL, go to first channel
				navigate(`/channel/${channelsData[0].name}`, { replace: true });
			}
		}
	}, [channelsData, usersData, channelName, userName, activeChannel, navigate, dmMutation, location.pathname]);

	// Clear unreads when changing active channel
	useEffect(() => {
		if (activeChannel) {
			setUnreadCounts((prev) => ({ ...prev, [activeChannel.id]: 0 }));
		}
	}, [activeChannel]);

	// Sync messages when channel changes or data fetches
	useEffect(() => {
		if (messagesData) {
			setMessages(mapApiMessagesToMessages(messagesData));
		}
	}, [messagesData]);

	useEffect(() => {
		if (threadMessagesData) {
			setThreadMessages(mapApiMessagesToMessages(threadMessagesData));
		}
	}, [threadMessagesData]);

	// Derived state for props
	const channels: Channel[] =
		channelsData
			?.filter((c: ApiChannel) => c.type !== 'DM')
			.map((c: ApiChannel) => ({
				...c,
				unreadCount: unreadCounts[c.id] || 0,
			})) || [];

	const directMessages: DirectMessage[] =
		usersData?.map((u: User) => {
			const dmChannel = channelsData?.find(
				(c: ApiChannel) => c.type === 'DM' && c.members?.some((m: User) => m.id === u.id),
			);
			return {
				id: u.id,
				userName: u.username,
				userAvatar: u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`,
				isOnline: false, // No online status API yet
				unreadCount: dmChannel ? unreadCounts[dmChannel.id] || 0 : 0,
			};
		}) || [];

	useEffect(() => {
		if (!socket || !currentUser || !activeChannel) return; // Wait for login and channel

		// Current logic: joins ONLY active channel. This means we WON'T get unread counts for other channels unless we are in them.
		// For public channels, we join them all to get unread counts.

		channelsData?.forEach((c: Channel) => {
			socket.emit('join_channel', c.id);
		});
		socket.emit('join_channel', activeChannel.id);

		const handleNewMessage = (message: ApiMessage & { tempId?: string }) => {
			const newMessage: Message = {
				id: message.id,
				userId: message.sender?.id || message.senderId,
				userName: message.sender?.username || 'Unknown',
				userAvatar:
					message.sender?.avatar ||
					`https://api.dicebear.com/7.x/avataaars/svg?seed=${message.sender?.username || 'Unknown'}`,
				content: message.content,
				timestamp: new Date(message.createdAt),
				reactions: [],
				threadCount: message.threadCount || 0,
			};

			const parentId = message.parentId; // Access parentId if present

			if (parentId) {
				// Handle reply
				if (activeThread && activeThread.id === parentId) {
					setThreadMessages((prev) => [...prev, newMessage]);
				}

				// Update parent message thread count in main channel list
				if (message.channelId === activeChannel.id) {
					setMessages((prev) =>
						prev.map((m) => {
							if (m.id === parentId) {
								return {
									...m,
									threadCount: (m.threadCount || 0) + 1,
								};
							}
							return m;
						}),
					);
				}
				return;
			}

			if (message.channelId === activeChannel.id) {
				setMessages((prev) => {
					const tempId = message.tempId;
					// If we have an optimistic message with this tempId, replace it
					if (tempId && prev.some((m) => m.id === tempId)) {
						return prev.map((m) => (m.id === tempId ? newMessage : m));
					}
					// If we already have this real ID (rare race cond), don't append
					if (prev.some((m) => m.id === message.id)) {
						return prev;
					}
					return [...prev, newMessage];
				});
			} else {
				setUnreadCounts((prev) => ({
					...prev,
					[message.channelId]: (prev[message.channelId] || 0) + 1,
				}));
			}
		};

		const handleReactionAdded = (reaction: MessageReaction & { message?: { channelId: string } }) => {
			if (reaction.message?.channelId && reaction.message.channelId !== activeChannel.id) return;

			setMessages((prevMessages) =>
				prevMessages.map((msg) => {
					if (msg.id === reaction.messageId) {
						const reactions = msg.reactions || [];
						const existingReactionIndex = reactions.findIndex((r) => r.emoji === reaction.emoji);

						const reactingUsername = reaction.user?.username || 'Unknown';

						if (existingReactionIndex > -1) {
							const updatedReactions = [...reactions];
							const existing = updatedReactions[existingReactionIndex];
							if (!existing.users.includes(reactingUsername)) {
								updatedReactions[existingReactionIndex] = {
									...existing,
									count: existing.count + 1,
									users: [...existing.users, reactingUsername],
								};
							}
							return { ...msg, reactions: updatedReactions };
						} else {
							return {
								...msg,
								reactions: [
									...reactions,
									{
										emoji: reaction.emoji,
										count: 1,
										users: [reactingUsername],
									},
								],
							};
						}
					}
					return msg;
				}),
			);
		};

		socket.on('new_message', handleNewMessage);
		socket.on('reaction_added', handleReactionAdded);

		return () => {
			socket.off('new_message', handleNewMessage);
			socket.off('reaction_added', handleReactionAdded);
		};
	}, [socket, activeChannel, currentUser, channelsData, activeThread]); // Added channelsData dependency logic implicitly

	// We need a separate effect to join all channels once
	useEffect(() => {
		if (socket && channelsData) {
			channelsData.forEach((c) => {
				socket.emit('join_channel', c.id);
			});
		}
	}, [socket, channelsData]);

	const handleSendMessage = (content: string) => {
		if (!currentUser || !activeChannel) return;

		const tempId = `temp-${Date.now()}`;
		sendMessageMutation.mutate({ channelId: activeChannel.id, content, tempId });
	};

	const handleSendReply = (content: string) => {
		if (!currentUser || !activeChannel || !activeThread) return;
		const tempId = `temp-${Date.now()}`;
		sendMessageMutation.mutate({ channelId: activeChannel.id, content, tempId, parentId: activeThread.id });
	};

	const handleCreateChannel = (name: string, isPrivate: boolean, description: string) => {
		createChannelMutation.mutate({ name, isPrivate, description });
	};

	const handleAddReaction = (messageId: string, emoji: string) => {
		if (!currentUser || !socket || !activeChannel) return;

		socket.emit('add_reaction', {
			messageId,
			emoji,
			userId: currentUser.id,
			channelId: activeChannel.id,
		});
	};

	const handleToggleSave = (messageId: string) => {
		toggleSaveMutation.mutate(messageId);
	};

	const isSavedItemsPath = location.pathname === '/saved-items';
	const isActivityPath = location.pathname === '/mentions-reactions';
	const isThreadsPath = location.pathname === '/threads';

	const handleForwardMessage = (message: Message) => {
		setMessageToForward(message);
		setIsForwardModalOpen(true);
	};

	const submitForwardMessage = (targetChannelId: string) => {
		if (!messageToForward || !currentUser) return;

		// Create a quoted version of the message
		// Note: Using standard markdown blockquote
		const content = `> **${messageToForward.userName}** said:\n> ${messageToForward.content.replace(/\n/g, '\n> ')}`;

		const tempId = `temp-${Date.now()}`;
		sendMessageMutation.mutate({ channelId: targetChannelId, content, tempId });

		// If we forwarded to a different channel, we might want to navigate there,
		// or just show a toast. For now, let's navigate if it's not the current one.
		if (activeChannel?.id !== targetChannelId) {
			const targetChannel = channelsData?.find((c) => c.id === targetChannelId);
			if (targetChannel) {
				navigate(`/channel/${targetChannel.name}`);
			}
		}
	};

	// dmMutation logic is now handled in useEffect based on userName param

	return (
		<div className="flex h-screen overflow-hidden">
			<Sidebar
				channels={channels}
				directMessages={directMessages}
				activeChannel={activeChannel || channels[0]} // Fallback or assume conditional rendering for chat
				currentUser={currentUser}
				onLogout={onLogout}
				onAddChannel={() => setIsCreateChannelModalOpen(true)}
				isCollapsed={isSidebarCollapsed}
				onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
			/>
			<div className="flex-1 flex overflow-hidden">
				{isSavedItemsPath ? (
					<SavedItemsView
						currentUser={currentUser}
						messages={mapApiMessagesToMessages(savedMessagesData || [])}
						onAddReaction={handleAddReaction}
						onToggleSave={handleToggleSave}
						isSidebarCollapsed={isSidebarCollapsed}
						onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
					/>
				) : isActivityPath ? (
					<MentionsReactionsView
						currentUser={currentUser}
						onToggleRightSidebar={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
						isSidebarCollapsed={isSidebarCollapsed}
						onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
					/>
				) : isThreadsPath ? (
					<ThreadsListView
						currentUser={currentUser}
						onToggleRightSidebar={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
						onOpenThread={(msg) => setActiveThread(mapApiMessagesToMessages([msg])[0])}
						isSidebarCollapsed={isSidebarCollapsed}
						onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
					/>
				) : activeChannel ? (
					<ChatArea
						channel={activeChannel}
						currentUser={currentUser}
						messages={messages}
						onSendMessage={handleSendMessage}
						onAddReaction={handleAddReaction}
						onToggleSave={handleToggleSave}
						onToggleRightSidebar={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
						onReply={(msg) => {
							setActiveThread(msg);
							setIsRightSidebarOpen(false); // Close info if open
						}}
						onForward={handleForwardMessage}
						users={usersData}
						isSidebarCollapsed={isSidebarCollapsed}
						onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
					/>
				) : (
					<div className="flex-1 flex items-center justify-center bg-gray-900 text-white">
						<p>Select a channel or create one to start</p>
					</div>
				)}

				{isRightSidebarOpen && activeChannel && (
					<ChannelInfo channel={activeChannel} currentUser={currentUser} onClose={() => setIsRightSidebarOpen(false)} />
				)}

				{activeThread && (
					<ThreadView
						parentMessage={activeThread}
						replies={threadMessages}
						onClose={() => setActiveThread(null)}
						onSendMessage={handleSendReply}
						onAddReaction={handleAddReaction}
						onToggleSave={handleToggleSave}
						users={usersData}
					/>
				)}
			</div>
			<CreateChannelModal
				isOpen={isCreateChannelModalOpen}
				onClose={() => setIsCreateChannelModalOpen(false)}
				onCreate={handleCreateChannel}
			/>
			{channelsData && (
				<ForwardMessageModal
					isOpen={isForwardModalOpen}
					onClose={() => setIsForwardModalOpen(false)}
					channels={channelsData}
					message={messageToForward}
					onForward={submitForwardMessage}
				/>
			)}
		</div>
	);
}
