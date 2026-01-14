import { X } from 'lucide-react';
import type { Message, User } from '../App';
import type { Attachment } from '../lib/api';
import { MessageInput } from './MessageInput';
import { MessageItem } from './MessageItem';
import { MessageList } from './MessageList';

interface ThreadViewProps {
	parentMessage: Message;
	replies: Message[];
	onClose: () => void;
	onSendMessage: (content: string, attachments?: Attachment[]) => void;
	onAddReaction: (messageId: string, emoji: string) => void;
	onToggleSave: (messageId: string) => void;
	onForward?: (message: Message) => void;
	users?: User[];
}

export function ThreadView({
	parentMessage,
	replies,
	onClose,
	onSendMessage,
	onAddReaction,
	onToggleSave,
	onForward,
	users,
}: ThreadViewProps) {
	return (
		<div className="w-[350px] flex flex-col border-l border-gray-800 bg-[#1a1d21]">
			{/* Header */}
			<div className="h-12 border-b border-gray-800 px-4 flex items-center justify-between">
				<h3 className="text-white font-bold flex items-center gap-2">
					Thread
					<span className="text-xs font-normal text-gray-400">
						#{parentMessage.userId} {/* Should probably be channel name? keeping simple */}
					</span>
				</h3>
				<button type="button" onClick={onClose} className="p-1 hover:bg-gray-800 rounded transition-colors">
					<X className="w-5 h-5 text-gray-400" />
				</button>
			</div>

			{/* Scrollable Content */}
			<div className="flex-1 overflow-y-auto flex flex-col">
				{/* Parent Message */}
				<div className="px-4 py-4 border-b border-gray-800">
					<MessageItem
						message={parentMessage}
						showAvatar={true}
						onAddReaction={onAddReaction}
						onToggleSave={onToggleSave}
						onForward={onForward}
					/>
				</div>

				{/* Separator */}
				<div className="flex items-center gap-4 px-4 py-2">
					<div className="h-px bg-gray-800 flex-1" />
					<span className="text-xs text-gray-500">{replies.length} replies</span>
					<div className="h-px bg-gray-800 flex-1" />
				</div>

				{/* Replies */}
				<MessageList
					messages={replies}
					onAddReaction={onAddReaction}
					onToggleSave={onToggleSave}
					onForward={onForward}
				/>
			</div>

			{/* Input */}
			<div className="p-4 border-t border-gray-800">
				<MessageInput
					channelName={`Thread`}
					isDM={false}
					placeholder="Reply..."
					onSendMessage={onSendMessage}
					users={users}
				/>
			</div>
		</div>
	);
}
