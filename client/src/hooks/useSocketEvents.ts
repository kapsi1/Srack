import { useEffect } from 'react';
import type { Socket } from 'socket.io-client';
import type { Message as ApiMessage, Channel as ApiChannel, MessageReaction } from '../lib/api';
import type { Channel, Message, User } from '../types';

export interface UseSocketEventsOptions {
	socket: Socket | null;
	currentUser: User | null;
	activeChannel: Channel | null;
	activeThread: Message | null;
	channelsData: ApiChannel[] | undefined;
	setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
	setThreadMessages: React.Dispatch<React.SetStateAction<Message[]>>;
	setUnreadCounts: React.Dispatch<React.SetStateAction<Record<string, number>>>;
	setActiveThread: React.Dispatch<React.SetStateAction<Message | null>>;
}

export function useSocketEvents({
	socket,
	currentUser,
	activeChannel,
	activeThread,
	channelsData,
	setMessages,
	setThreadMessages,
	setUnreadCounts,
	setActiveThread,
}: UseSocketEventsOptions): void {
	// Join all channels for unread counts
	useEffect(() => {
		if (socket && channelsData) {
			channelsData.forEach((c) => {
				socket.emit('join_channel', c.id);
			});
		}
	}, [socket, channelsData]);

	// Socket event handlers
	useEffect(() => {
		if (!socket || !currentUser || !activeChannel) return;

		// Join active channel
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
				type: message.type,
				metadata: message.metadata,
			};

			const parentId = message.parentId;

			if (parentId) {
				// Handle reply
				if (activeThread && activeThread.id === parentId) {
					setThreadMessages((prev) => {
						const tempId = message.tempId;
						// If we have an optimistic message with this tempId, replace it
						if (tempId && prev.some((m) => m.id === tempId)) {
							return prev.map((m) => (m.id === tempId ? newMessage : m));
						}
						// If we already have this real ID, don't append
						if (prev.some((m) => m.id === message.id)) {
							return prev;
						}
						return [...prev, newMessage];
					});
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

		const handleMessageDeleted = ({ messageId, channelId }: { messageId: string; channelId: string }) => {
			if (channelId === activeChannel.id) {
				setMessages((prev) => prev.filter((m) => m.id !== messageId));
			}
			// Also update thread messages if applicable
			if (activeThread && activeThread.id === messageId) {
				setActiveThread(null); // Thread parent deleted
			}
			setThreadMessages((prev) => prev.filter((m) => m.id !== messageId));
		};

		socket.on('new_message', handleNewMessage);
		socket.on('reaction_added', handleReactionAdded);
		socket.on('message_deleted', handleMessageDeleted);

		return () => {
			socket.off('new_message', handleNewMessage);
			socket.off('reaction_added', handleReactionAdded);
			socket.off('message_deleted', handleMessageDeleted);
		};
	}, [socket, activeChannel, currentUser, activeThread, setMessages, setThreadMessages, setUnreadCounts, setActiveThread]);
}
