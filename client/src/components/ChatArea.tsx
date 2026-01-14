import { useState, useRef, useEffect } from "react";
import {
	Info,
	Phone,
	Search,
	Star,
	Users,
	Video,
	Hash,
	PanelLeftOpen,
} from "lucide-react";
import type { Channel, Message, User } from "../App";
import { MessageInput } from "./MessageInput";
import { MessageList } from "./MessageList";

interface ChatAreaProps {
	channel: Channel;
	currentUser: User;
	messages: Message[];
	onSendMessage: (content: string) => void;
	onAddReaction: (messageId: string, emoji: string) => void;
	onToggleSave: (messageId: string) => void;
	onToggleRightSidebar: () => void;
	onReply?: (message: Message) => void;
	onForward?: (message: Message) => void;
	users?: User[];
	isSidebarCollapsed: boolean;
	onToggleSidebar: () => void;
}

export function ChatArea({
	channel,
	currentUser,
	messages,
	onSendMessage,
	onAddReaction,
	onToggleSave,
	onToggleRightSidebar,
	onReply,
	onForward,
	users,
	isSidebarCollapsed,
	onToggleSidebar,
}: ChatAreaProps) {
	const [isSearchOpen, setIsSearchOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const inputRef = useRef<HTMLInputElement>(null);

	const isDM = channel.type === "DM";
	const otherUser = isDM
		? channel.members?.find((m) => m.id !== currentUser.id)
		: null;
	const displayName = otherUser ? otherUser.username : channel.name;

	const filteredMessages = messages.filter((msg) =>
		msg.content.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	useEffect(() => {
		if (isSearchOpen && inputRef.current) {
			inputRef.current.focus();
		}
	}, [isSearchOpen]);

	const toggleSearch = () => {
		if (isSearchOpen) {
			setSearchQuery(""); // Clear search when closing
		}
		setIsSearchOpen(!isSearchOpen);
	};

	return (
		<div className="flex-1 flex flex-col bg-[#1a1d21]">
			{/* Channel Header */}
			<div className="h-12 border-b border-gray-800 px-4 flex items-center justify-between">
				<div className="flex items-center gap-2">
					{isSidebarCollapsed && (
						<button
							type="button"
							onClick={onToggleSidebar}
							className="p-2 hover:bg-gray-800 rounded transition-colors text-gray-400"
							title="Show sidebar"
						>
							<PanelLeftOpen className="w-5 h-5" />
						</button>
					)}
					<button
						type="button"
						onClick={onToggleRightSidebar}
						className="flex items-center gap-2 hover:bg-gray-800 px-2 py-1 rounded-md transition-colors text-left"
						title="Channel details"
					>
						<h2 className="flex items-center gap-1.5 text-white font-bold">
							{isDM ? (
								<img
									src={
										otherUser?.avatar ||
										`https://api.dicebear.com/7.x/avataaars/svg?seed=${otherUser?.username}`
									}
									alt={displayName}
									className="w-5 h-5 rounded"
								/>
							) : (
								<Hash className="w-4 h-4 text-gray-400" />
							)}
							<span>{displayName}</span>
						</h2>
					</button>
					<button
						type="button"
						className="p-1 hover:bg-gray-800 rounded transition-colors"
						title="Star channel"
					>
						<Star className="w-4 h-4 text-gray-400" />
					</button>
				</div>
				<div className="flex items-center gap-1">
					{/* <button type="button" className="p-2 hover:bg-gray-800 rounded transition-colors" title="Start call">
						<Phone className="w-4 h-4 text-gray-400" />
					</button>
					<button type="button" className="p-2 hover:bg-gray-800 rounded transition-colors" title="Start video call">
						<Video className="w-4 h-4 text-gray-400" />
					</button> */}
					<button
						type="button"
						onClick={onToggleRightSidebar}
						className="p-2 hover:bg-gray-800 rounded transition-colors"
						title="View members"
					>
						<Users className="w-4 h-4 text-gray-400" />
					</button>
					<div className="w-px h-6 bg-gray-800 mx-1" />

					{isSearchOpen && (
						<div className="relative mr-1">
							<input
								ref={inputRef}
								type="text"
								placeholder="Search..."
								className="bg-gray-900 text-white border border-gray-700 rounded px-2 py-1 text-sm w-48 focus:outline-none focus:border-blue-500 placeholder-gray-500"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
							/>
						</div>
					)}

					<button
						type="button"
						className={`p-2 rounded transition-colors ${isSearchOpen ? "bg-gray-800 text-white" : "hover:bg-gray-800 text-gray-400"}`}
						onClick={toggleSearch}
						title="Search messages"
					>
						<Search className="w-4 h-4" />
					</button>
					<button
						type="button"
						onClick={onToggleRightSidebar}
						className="p-2 hover:bg-gray-800 rounded transition-colors"
						title="Show details"
					>
						<Info className="w-4 h-4 text-gray-400" />
					</button>
				</div>
			</div>

			{/* Messages Area */}
			<MessageList
				channel={channel}
				messages={filteredMessages}
				onAddReaction={onAddReaction}
				onToggleSave={onToggleSave}
				onReply={onReply}
				onForward={onForward}
			/>

			{/* Message Input */}
			<MessageInput
				channelName={displayName}
				isDM={isDM}
				onSendMessage={onSendMessage}
				users={users}
			/>
		</div>
	);
}
