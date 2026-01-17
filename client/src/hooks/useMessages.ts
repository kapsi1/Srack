import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import {
	type Message as ApiMessage,
	type Attachment,
	deleteMessage,
	fetchMessages,
	fetchSavedMessages,
	fetchThreadMessages,
	sendMessage,
	toggleSavedMessage,
} from '../lib/api';
import { type Channel, type Message, mapApiMessagesToMessages, type User } from '../types';

export interface UseMessagesOptions {
	currentUser: User | null;
	activeChannel: Channel | null;
	activeThread: Message | null;
}

export interface UseMessagesReturn {
	messages: Message[];
	setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
	threadMessages: Message[];
	setThreadMessages: React.Dispatch<React.SetStateAction<Message[]>>;
	savedMessagesData: ApiMessage[] | undefined;
	sendMessageMutation: {
		mutate: (params: {
			channelId: string;
			content: string;
			tempId: string;
			parentId?: string;
			attachments?: Attachment[];
		}) => void;
		isPending: boolean;
	};
	handleSendMessage: (content: string, attachments?: Attachment[]) => void;
	handleSendReply: (content: string, attachments?: Attachment[]) => void;
	handleToggleSave: (messageId: string) => void;
	handleDeleteMessage: (messageId: string) => void;
}

export function useMessages({ currentUser, activeChannel, activeThread }: UseMessagesOptions): UseMessagesReturn {
	const queryClient = useQueryClient();
	const [messages, setMessages] = useState<Message[]>([]);
	const [threadMessages, setThreadMessages] = useState<Message[]>([]);

	// Data Fetching
	const { data: messagesData } = useQuery({
		queryKey: ['messages', activeChannel?.id],
		queryFn: () => (activeChannel ? fetchMessages(activeChannel.id) : Promise.resolve([])),
		enabled: !!currentUser && !!activeChannel,
	});

	const { data: savedMessagesData } = useQuery({
		queryKey: ['saved-messages'],
		queryFn: fetchSavedMessages,
		enabled: !!currentUser,
	});

	const { data: threadMessagesData } = useQuery({
		queryKey: ['thread-messages', activeThread?.id],
		queryFn: () => (activeThread ? fetchThreadMessages(activeThread.id) : Promise.resolve([])),
		enabled: !!currentUser && !!activeThread,
	});

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

	// Mutations
	const sendMessageMutation = useMutation({
		mutationFn: ({
			channelId,
			content,
			tempId,
			parentId,
			attachments,
		}: {
			channelId: string;
			content: string;
			tempId: string;
			parentId?: string;
			attachments?: Attachment[];
		}) => sendMessage(channelId, content, tempId, parentId, attachments),
		onMutate: async ({ channelId, content, tempId, parentId, attachments }) => {
			if (parentId) {
				// Optimistic update for thread
				await queryClient.cancelQueries({ queryKey: ['thread-messages', parentId] });
				// Add optimistic message to thread immediately
				if (currentUser) {
					const optimisticMessage: Message = {
						id: tempId,
						userId: currentUser.id,
						userName: currentUser.username,
						userAvatar: currentUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.username}`,
						content,
						timestamp: new Date(),
						reactions: [],
						threadCount: 0,
						attachments,
					};
					setThreadMessages((prev) => [...prev, optimisticMessage]);
				}
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
					attachments,
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
						attachments,
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
	});

	const toggleSaveMutation = useMutation({
		mutationFn: toggleSavedMessage,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['messages'] });
			queryClient.invalidateQueries({ queryKey: ['saved-messages'] });
		},
	});

	const deleteMessageMutation = useMutation({
		mutationFn: deleteMessage,
		onSuccess: () => {
			// Invalidation happens via socket event, but good to have
		},
	});

	// Handlers
	const handleSendMessage = (content: string, attachments?: Attachment[]) => {
		if (!currentUser || !activeChannel) return;

		const tempId = `temp-${Date.now()}`;
		sendMessageMutation.mutate({ channelId: activeChannel.id, content, tempId, attachments });
	};

	const handleSendReply = (content: string, attachments?: Attachment[]) => {
		if (!currentUser || !activeChannel || !activeThread) return;
		const tempId = `temp-${Date.now()}`;
		sendMessageMutation.mutate({
			channelId: activeChannel.id,
			content,
			tempId,
			parentId: activeThread.id,
			attachments,
		});
	};

	const handleToggleSave = (messageId: string) => {
		toggleSaveMutation.mutate(messageId);
	};

	const handleDeleteMessage = (messageId: string) => {
		if (window.confirm('Are you sure you want to delete this message?')) {
			deleteMessageMutation.mutate(messageId);
		}
	};

	return {
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
	};
}
