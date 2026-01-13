import { useEffect, useRef } from 'react';
import type { Message } from '../App';
import { MessageItem } from './MessageItem';

interface MessageListProps {
	messages: Message[];
	onAddReaction: (messageId: string, emoji: string) => void;
}

export function MessageList({ messages, onAddReaction }: MessageListProps) {
	const bottomRef = useRef<HTMLDivElement>(null);

	// biome-ignore lint/correctness/useExhaustiveDependencies: We want to scroll on every message update
	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [messages]);

	return (
		<div className="flex-1 overflow-y-auto">
			{/* Channel Intro */}
			<div className="p-6 border-b border-gray-800">
				<div className="flex items-center gap-2 mb-2">
					<div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center">
						<span className="text-2xl text-white">#</span>
					</div>
					<h1 className="text-white">general</h1>
				</div>
				<p className="text-gray-400">
					This is the very beginning of the <span className="text-white">#general</span> channel.
				</p>
			</div>

			{/* Messages */}
			<div className="px-4 py-2">
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
						/>
					);
				})}
				<div ref={bottomRef} />
			</div>
		</div>
	);
}
