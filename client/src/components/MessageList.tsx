import { useEffect, useRef } from 'react';
import type { Message, User } from '../App';
import { MessageItem } from './MessageItem';

interface MessageListProps {
	channel?: { name: string; type?: string };
	messages: Message[];
	onAddReaction: (messageId: string, emoji: string) => void;
	onToggleSave?: (messageId: string) => void;
	onReply?: (message: Message) => void;
	onForward?: (message: Message) => void;
	onDelete?: (messageId: string) => void;
	currentUser?: User | null;
}

export function MessageList({ channel, messages, onAddReaction, onToggleSave, onReply, onForward, onDelete, currentUser }: MessageListProps) {
	const bottomRef = useRef<HTMLDivElement>(null);
	const scrollContainerRef = useRef<HTMLDivElement>(null);

	// biome-ignore lint/correctness/useExhaustiveDependencies: We want to scroll on every message update
	useEffect(() => {
		// Use a small timeout to ensure content (like images/videos) has started rendering
		const timer = setTimeout(() => {
			if (scrollContainerRef.current) {
				scrollContainerRef.current.scrollTo({
					top: scrollContainerRef.current.scrollHeight,
					behavior: 'smooth',
				});
			}
		}, 100);
		return () => clearTimeout(timer);
	}, [messages]);

	return (
		<div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
			{/* Channel Intro */}
			{channel && (
				<div className="p-6 border-b border-gray-800">
					<div className="flex items-center gap-2 mb-2">
						<div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center">
							<span className="text-2xl text-white">#</span>
						</div>
						<h1 className="text-white">{channel.name}</h1>
					</div>
					<p className="text-gray-400">
						This is the very beginning of the <span className="text-white">#{channel.name}</span> channel.
					</p>
				</div>
			)}

		{/* Messages */}
			<div className="px-4 py-2 pb-4">
				{messages.map((message, index) => {
					const prevMessage = index > 0 ? messages[index - 1] : null;
					const showAvatar =
						!prevMessage ||
						prevMessage.userId !== message.userId ||
						message.timestamp.getTime() - prevMessage.timestamp.getTime() > 5 * 60 * 1000;

					return (
						<MessageItem
							key={message.id}
							message={message}
							showAvatar={showAvatar}
							onAddReaction={onAddReaction}
							onToggleSave={onToggleSave}
							onReply={onReply}
							onForward={onForward}
							onDelete={onDelete}
							currentUser={currentUser}
						/>
					);
				})}
				<div ref={bottomRef} />
			</div>
		</div>
	);
}
