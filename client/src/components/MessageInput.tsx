import {
	AtSign,
	Bold,
	Code,
	Italic,
	Link,
	List,
	ListOrdered,
	Mic,
	Paperclip,
	Send,
	Smile,
	Strikethrough,
} from 'lucide-react';
import { useState } from 'react';

interface MessageInputProps {
	channelName: string;
	onSendMessage: (content: string) => void;
}

export function MessageInput({ channelName, onSendMessage }: MessageInputProps) {
	const [message, setMessage] = useState('');

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (message.trim()) {
			onSendMessage(message);
			setMessage('');
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSubmit(e);
		}
	};

	return (
		<div className="border-t border-gray-800 p-4">
			<form onSubmit={handleSubmit}>
				<div className="border border-gray-700 rounded-lg overflow-hidden focus-within:border-gray-600 transition-colors bg-[#222529]">
					{/* Formatting Toolbar */}
					<div className="border-b border-gray-700 px-2 py-1 flex items-center gap-1">
						<button type="button" className="p-1.5 hover:bg-gray-700 rounded transition-colors">
							<Bold className="w-4 h-4 text-gray-300" />
						</button>
						<button type="button" className="p-1.5 hover:bg-gray-700 rounded transition-colors">
							<Italic className="w-4 h-4 text-gray-300" />
						</button>
						<button type="button" className="p-1.5 hover:bg-gray-700 rounded transition-colors">
							<Strikethrough className="w-4 h-4 text-gray-300" />
						</button>
						<div className="w-px h-5 bg-gray-700 mx-1" />
						<button type="button" className="p-1.5 hover:bg-gray-700 rounded transition-colors">
							<Link className="w-4 h-4 text-gray-300" />
						</button>
						<button type="button" className="p-1.5 hover:bg-gray-700 rounded transition-colors">
							<ListOrdered className="w-4 h-4 text-gray-300" />
						</button>
						<button type="button" className="p-1.5 hover:bg-gray-700 rounded transition-colors">
							<List className="w-4 h-4 text-gray-300" />
						</button>
						<button type="button" className="p-1.5 hover:bg-gray-700 rounded transition-colors">
							<Code className="w-4 h-4 text-gray-300" />
						</button>
					</div>

					{/* Text Input */}
					<textarea
						value={message}
						onChange={(e) => setMessage(e.target.value)}
						onKeyDown={handleKeyDown}
						placeholder={`Message #${channelName}`}
						className="w-full px-3 py-2 resize-none outline-none bg-transparent text-white placeholder-gray-500"
						rows={3}
					/>

					{/* Bottom Actions */}
					<div className="px-2 py-1 flex items-center justify-between">
						<div className="flex items-center gap-1">
							<button type="button" className="p-1.5 hover:bg-gray-700 rounded transition-colors">
								<Paperclip className="w-4 h-4 text-gray-300" />
							</button>
							<button type="button" className="p-1.5 hover:bg-gray-700 rounded transition-colors">
								<Mic className="w-4 h-4 text-gray-300" />
							</button>
							<button type="button" className="p-1.5 hover:bg-gray-700 rounded transition-colors">
								<Smile className="w-4 h-4 text-gray-300" />
							</button>
							<button type="button" className="p-1.5 hover:bg-gray-700 rounded transition-colors">
								<AtSign className="w-4 h-4 text-gray-300" />
							</button>
						</div>
						<button
							type="submit"
							disabled={!message.trim()}
							className="p-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-green-600"
						>
							<Send className="w-4 h-4" />
						</button>
					</div>
				</div>
			</form>
		</div>
	);
}
