import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import { AuthPage } from './components/AuthPage';
import { CallNotification } from './components/CallNotification';
import { ChannelInfo } from './components/ChannelInfo';
import { ChatArea } from './components/ChatArea';
import { CreateChannelModal } from './components/CreateChannelModal';
import { ForwardMessageModal } from './components/ForwardMessageModal';
import { MentionsReactionsView } from './components/MentionsReactionsView';
import { SavedItemsView } from './components/SavedItemsView';
import { Sidebar } from './components/Sidebar';
import { ThreadsListView } from './components/ThreadsListView';
import { ThreadView } from './components/ThreadView';
import { VideoCall } from './components/VideoCall';
import { CallProvider, type CallUser, useCall } from './context/CallContext';
import { useSocket } from './context/SocketContext';
import { useAuth, useChannels, useMessages, useSocketEvents } from './hooks';
import { mapApiMessagesToMessages, type Channel, type Message, type User } from './types';

// Re-export types for backwards compatibility
export type { User, Message, Channel } from './types';
export type { DirectMessage } from './types';

export default function App() {
	const { currentUser, isLoading, handleLogin, handleLogout } = useAuth();

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-screen bg-gray-900 text-white">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
			</div>
		);
	}

	if (!currentUser) {
		return <AuthPage onLogin={handleLogin} />;
	}

	return (
		<Routes>
			<Route
				path="/"
				element={<MainAppWithCall currentUser={currentUser} onLogout={handleLogout} />}
			/>
			<Route
				path="/channel/:channelName"
				element={<MainAppWithCall currentUser={currentUser} onLogout={handleLogout} />}
			/>
			<Route
				path="/user/:userName"
				element={<MainAppWithCall currentUser={currentUser} onLogout={handleLogout} />}
			/>
			<Route
				path="/saved-items"
				element={<MainAppWithCall currentUser={currentUser} onLogout={handleLogout} />}
			/>
			<Route
				path="/mentions-reactions"
				element={<MainAppWithCall currentUser={currentUser} onLogout={handleLogout} />}
			/>
			<Route
				path="/threads"
				element={<MainAppWithCall currentUser={currentUser} onLogout={handleLogout} />}
			/>
			<Route path="*" element={<Navigate to="/" replace />} />
		</Routes>
	);
}

function MainApp({
	currentUser,
	onLogout,
	onStartCall,
}: {
	currentUser: User;
	onLogout: () => void;
	onStartCall?: (channelId: string, remoteUser: CallUser, isVideo: boolean) => Promise<void>;
}) {
	const location = useLocation();
	const navigate = useNavigate();
	const { channelName, userName } = useParams();
	const { socket } = useSocket();

	// UI State
	const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
	const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
	const [activeThread, setActiveThread] = useState<Message | null>(null);
	const [isForwardModalOpen, setIsForwardModalOpen] = useState(false);
	const [messageToForward, setMessageToForward] = useState<Message | null>(null);

	// Custom Hooks
	const {
		channelsData,
		usersData,
		channels,
		directMessages,
		activeChannel,
		setActiveChannel,

		setUnreadCounts,
		dmMutation,
		handleStarChannel,
		handleCreateChannel,
		isCreateChannelModalOpen,
		setIsCreateChannelModalOpen,
	} = useChannels({ currentUser });

	const {
		messages,
		setMessages,
		threadMessages,
		setThreadMessages,
		savedMessagesData,
		sendMessageMutation,
		handleSendMessage,
		handleSendReply,
		handleToggleSave,
		handleDeleteMessage,
	} = useMessages({ currentUser, activeChannel, activeThread });

	// Socket event handlers
	useSocketEvents({
		socket,
		currentUser,
		activeChannel,
		activeThread,
		channelsData,
		setMessages,
		setThreadMessages,
		setUnreadCounts,
		setActiveThread,
	});

	// Set initial active channel based on URL
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
	}, [channelsData, usersData, channelName, userName, activeChannel, navigate, dmMutation, location.pathname, setActiveChannel]);

	// Clear unreads when changing active channel
	useEffect(() => {
		if (activeChannel) {
			setUnreadCounts((prev) => ({ ...prev, [activeChannel.id]: 0 }));
		}
	}, [activeChannel, setUnreadCounts]);

	// Reaction handler
	const handleAddReaction = (messageId: string, emoji: string) => {
		if (!currentUser || !socket || !activeChannel) return;

		socket.emit('add_reaction', {
			messageId,
			emoji,
			userId: currentUser.id,
			channelId: activeChannel.id,
		});
	};

	// Forward message handlers
	const handleForwardMessage = (message: Message) => {
		setMessageToForward(message);
		setIsForwardModalOpen(true);
	};

	const submitForwardMessage = (targetChannelId: string) => {
		if (!messageToForward || !currentUser) return;

		// Create a quoted version of the message
		const content = `> **${messageToForward.userName}** said:\n> ${messageToForward.content.replace(/\n/g, '\n> ')}`;

		const tempId = `temp-${Date.now()}`;
		sendMessageMutation.mutate({ channelId: targetChannelId, content, tempId });

		// Navigate to target channel if different
		if (activeChannel?.id !== targetChannelId) {
			const targetChannel = channelsData?.find((c) => c.id === targetChannelId);
			if (targetChannel) {
				navigate(`/channel/${targetChannel.name}`);
			}
		}
	};

	// Path checks
	const isSavedItemsPath = location.pathname === '/saved-items';
	const isActivityPath = location.pathname === '/mentions-reactions';
	const isThreadsPath = location.pathname === '/threads';

	return (
		<div className="flex h-screen overflow-hidden">
			<Sidebar
				channels={channels}
				directMessages={directMessages}
				activeChannel={activeChannel || channels[0]}
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
							setIsRightSidebarOpen(false);
						}}
						onDelete={handleDeleteMessage}
						onForward={handleForwardMessage}
						onStarChannel={handleStarChannel}
						users={usersData}
						isSidebarCollapsed={isSidebarCollapsed}
						onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
						onStartCall={
							activeChannel.type === 'DM' && onStartCall
								? (isVideo: boolean) => {
										const otherUser = activeChannel.members?.find((m) => m.id !== currentUser.id);
										if (otherUser) {
											onStartCall(
												activeChannel.id,
												{
													id: otherUser.id,
													username: otherUser.username,
													avatar: otherUser.avatar,
												},
												isVideo,
											);
										}
									}
								: undefined
						}
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
						onDelete={handleDeleteMessage}
						currentUser={currentUser}
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

// Wrapper component that provides call functionality
function MainAppWithCall({ currentUser, onLogout }: { currentUser: User; onLogout: () => void }) {
	return (
		<CallProvider currentUser={{ id: currentUser.id, username: currentUser.username, avatar: currentUser.avatar }}>
			<MainAppWithCallInner currentUser={currentUser} onLogout={onLogout} />
		</CallProvider>
	);
}

// Inner component that can use the useCall hook
function MainAppWithCallInner({
	currentUser,
	onLogout,
}: {
	currentUser: User;
	onLogout: () => void;
}) {
	const { startCall } = useCall();

	return (
		<>
			<MainApp currentUser={currentUser} onLogout={onLogout} onStartCall={startCall} />
			<VideoCall />
			<CallNotification />
		</>
	);
}
