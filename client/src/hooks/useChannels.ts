import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
	type Channel as ApiChannel,
	createChannel,
	createDM,
	fetchChannels,
	fetchUsers,
	toggleStarChannel,
} from '../lib/api';
import type { Channel, DirectMessage, User } from '../types';

export interface UseChannelsOptions {
	currentUser: User | null;
}

export interface UseChannelsReturn {
	channelsData: ApiChannel[] | undefined;
	usersData: User[] | undefined;
	channels: Channel[];
	directMessages: DirectMessage[];
	activeChannel: Channel | null;
	setActiveChannel: (channel: Channel | null) => void;
	unreadCounts: Record<string, number>;
	setUnreadCounts: React.Dispatch<React.SetStateAction<Record<string, number>>>;
	createChannelMutation: ReturnType<
		typeof useMutation<ApiChannel, Error, { name: string; isPrivate: boolean; description?: string }>
	>;
	dmMutation: ReturnType<typeof useMutation<ApiChannel, Error, string>>;
	toggleStarChannelMutation: ReturnType<typeof useMutation<{ starred: boolean; channelId: string }, Error, string>>;
	handleStarChannel: (channelId: string) => void;
	handleCreateChannel: (name: string, isPrivate: boolean, description: string) => void;
	isCreateChannelModalOpen: boolean;
	setIsCreateChannelModalOpen: (open: boolean) => void;
}

export function useChannels({ currentUser }: UseChannelsOptions): UseChannelsReturn {
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
	const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
	const [isCreateChannelModalOpen, setIsCreateChannelModalOpen] = useState(false);

	// Data Fetching
	const { data: channelsData } = useQuery({
		queryKey: ['channels'],
		queryFn: fetchChannels,
		enabled: !!currentUser,
	});

	const { data: usersData } = useQuery({
		queryKey: ['users'],
		queryFn: fetchUsers,
		enabled: !!currentUser,
	});

	// Mutations
	const dmMutation = useMutation({
		mutationFn: createDM,
		onSuccess: (newChannel: ApiChannel) => {
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

	const toggleStarChannelMutation = useMutation({
		mutationFn: toggleStarChannel,
		onSuccess: (result) => {
			// Update the channels list to reflect the new starred state
			queryClient.setQueryData(['channels'], (old: ApiChannel[] | undefined) => {
				if (!old) return old;
				return old.map((c) => (c.id === result.channelId ? { ...c, isStarred: result.starred } : c));
			});
			// Also update activeChannel if it matches
			if (activeChannel?.id === result.channelId) {
				setActiveChannel({ ...activeChannel, isStarred: result.starred });
			}
		},
	});

	// Derived state
	const channels: Channel[] = useMemo(
		() =>
			channelsData
				?.filter((c: ApiChannel) => c.type !== 'DM')
				.map((c: ApiChannel) => ({
					...c,
					unreadCount: unreadCounts[c.id] || 0,
				})) || [],
		[channelsData, unreadCounts],
	);

	const directMessages: DirectMessage[] = useMemo(
		() =>
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
			}) || [],
		[usersData, channelsData, unreadCounts],
	);

	const handleStarChannel = (channelId: string) => {
		toggleStarChannelMutation.mutate(channelId);
	};

	const handleCreateChannel = (name: string, isPrivate: boolean, description: string) => {
		createChannelMutation.mutate({ name, isPrivate, description });
	};

	return {
		channelsData,
		usersData,
		channels,
		directMessages,
		activeChannel,
		setActiveChannel,
		unreadCounts,
		setUnreadCounts,
		createChannelMutation,
		dmMutation,
		toggleStarChannelMutation,
		handleStarChannel,
		handleCreateChannel,
		isCreateChannelModalOpen,
		setIsCreateChannelModalOpen,
	};
}
