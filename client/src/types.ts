import {
	type Message as ApiMessage,
	type MessageReaction,
	type User as ApiUser,
	type Attachment,
} from './lib/api';

// Re-export User from API
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
	attachments?: Attachment[];
	type?: 'TEXT' | 'CALL' | 'SYSTEM';
	metadata?: Record<string, unknown>;
}

export interface Channel {
	id: string;
	name: string;
	description?: string;
	isPrivate?: boolean;
	isStarred?: boolean;
	type?: 'PUBLIC' | 'PRIVATE' | 'DM';
	unreadCount?: number;
	members?: User[];
	createdAt?: string;
}

/**
 * Maps API messages to frontend Message format by aggregating reactions
 */
export function mapApiMessagesToMessages(apiMessages: ApiMessage[]): Message[] {
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
			attachments: msg.attachments,
			type: msg.type,
			metadata: msg.metadata,
		};
	});
}
