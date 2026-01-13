import { Info, Phone, Search, Star, Users, Video } from 'lucide-react';
import type { Channel, Message } from '../App';
import { MessageInput } from './MessageInput';
import { MessageList } from './MessageList';

interface ChatAreaProps {
	channel: Channel;
	messages: Message[];
	onSendMessage: (content: string) => void;
	onAddReaction: (messageId: string, emoji: string) => void;
}

export function ChatArea({ channel, messages, onSendMessage, onAddReaction }: ChatAreaProps) {
	return (
		<div className="flex-1 flex flex-col bg-[#1a1d21]">
			{/* Channel Header */}
			<div className="h-12 border-b border-gray-800 px-4 flex items-center justify-between">
				<div className="flex items-center gap-2">
					<h2 className="flex items-center gap-1.5 text-white">
						<span>#</span>
						<span>{channel.name}</span>
					</h2>
					<button type="button" className="p-1 hover:bg-gray-800 rounded transition-colors">
						<Star className="w-4 h-4 text-gray-400" />
					</button>
				</div>
				<div className="flex items-center gap-1">
					<button type="button" className="p-2 hover:bg-gray-800 rounded transition-colors">
						<Phone className="w-4 h-4 text-gray-400" />
					</button>
					<button type="button" className="p-2 hover:bg-gray-800 rounded transition-colors">
						<Video className="w-4 h-4 text-gray-400" />
					</button>
					<button type="button" className="p-2 hover:bg-gray-800 rounded transition-colors">
						<Users className="w-4 h-4 text-gray-400" />
					</button>
					<div className="w-px h-6 bg-gray-800 mx-1" />
					<button type="button" className="p-2 hover:bg-gray-800 rounded transition-colors">
						<Search className="w-4 h-4 text-gray-400" />
					</button>
					<button type="button" className="p-2 hover:bg-gray-800 rounded transition-colors">
						<Info className="w-4 h-4 text-gray-400" />
					</button>
				</div>
			</div>

			{/* Messages Area */}
			<MessageList messages={messages} onAddReaction={onAddReaction} />

			{/* Message Input */}
			<MessageInput channelName={channel.name} onSendMessage={onSendMessage} />
		</div>
	);
}
