/** biome-ignore-all lint/a11y/noStaticElementInteractions: Container handles mouse events for showing actions overlay */
import {
	Bookmark,
	MessageSquare,
	MoreVertical,
	Share,
	Smile,
} from "lucide-react";
import { useState } from "react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Message } from "../App";

interface MessageItemProps {
	message: Message;
	showAvatar: boolean;
	onAddReaction: (messageId: string, emoji: string) => void;
}

const commonEmojis = ["👍", "😄", "🎉", "❤️", "🚀", "👀"];

export function MessageItem({
	message,
	showAvatar,
	onAddReaction,
}: MessageItemProps) {
	const [showActions, setShowActions] = useState(false);
	const [showEmojiPicker, setShowEmojiPicker] = useState(false);

	const formatTime = (date: Date) => {
		return date.toLocaleTimeString("en-US", {
			hour: "numeric",
			minute: "2-digit",
			hour12: true,
		});
	};

	return (
		<div
			className="group relative py-2 hover:bg-[#222529] -mx-4 px-4"
			onMouseEnter={() => setShowActions(true)}
			onMouseLeave={() => {
				setShowActions(false);
				setShowEmojiPicker(false);
			}}
		>
			<div className="flex gap-2">
				{/* Avatar */}
				<div className="w-9 flex-shrink-0">
					{showAvatar && (
						<img
							src={message.userAvatar}
							alt={message.userName}
							className="w-9 h-9 rounded"
						/>
					)}
				</div>

				{/* Message Content */}
				<div className="flex-1 min-w-0">
					{showAvatar && (
						<div className="flex items-baseline gap-2 mb-0.5">
							<span className="text-white">{message.userName}</span>
							<span className="text-xs text-gray-500">
								{formatTime(message.timestamp)}
							</span>
						</div>
					)}
					<div className="text-gray-200 markdown-content">
						<ReactMarkdown
							remarkPlugins={[remarkGfm]}
							components={{
								p: ({ node, ...props }) => <p className="markdown-paragraph" {...props} />,
								a: ({ node, ...props }) => (
									<a
										className="markdown-link"
										target="_blank"
										rel="noopener noreferrer"
										{...props}
									/>
								),
								ul: ({ node, ...props }) => (
									<ul className="markdown-list-unordered" {...props} />
								),
								ol: ({ node, ...props }) => (
									<ol className="markdown-list-ordered" {...props} />
								),
								li: ({ node, ...props }) => <li className="markdown-list-item" {...props} />,
								code: ({
									node,
									inline,
									...props
								}: {
									node?: unknown;
									inline?: boolean;
								} & React.HTMLAttributes<HTMLElement>) =>
									inline ? (
										<code className="markdown-code-inline" {...props} />
									) : (
										<pre className="markdown-code-block">
											<code {...props} />
										</pre>
									),
								strong: ({ node, ...props }) => (
									<strong className="markdown-strong" {...props} />
								),
								em: ({ node, ...props }) => <em className="markdown-em" {...props} />,
								del: ({ node, ...props }) => (
									<del className="markdown-del" {...props} />
								),
							}}
						>
							{message.content}
						</ReactMarkdown>
					</div>

					{/* Reactions */}
					{message.reactions && message.reactions.length > 0 && (
						<div className="flex flex-wrap gap-1 mt-1">
							{message.reactions.map((reaction) => (
								<button
									type="button"
									key={reaction.emoji}
									className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#222529] border border-gray-700 rounded hover:border-blue-500 transition-colors text-sm"
									onClick={() => onAddReaction(message.id, reaction.emoji)}
								>
									<span>{reaction.emoji}</span>
									<span className="text-xs text-gray-300">
										{reaction.count}
									</span>
								</button>
							))}
							<button
								type="button"
								className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#222529] border border-gray-700 rounded hover:border-blue-500 transition-colors text-sm"
								onClick={() => setShowEmojiPicker(!showEmojiPicker)}
							>
								<Smile className="w-3.5 h-3.5 text-gray-400" />
							</button>
						</div>
					)}

					{/* Thread Count */}
					{(message.threadCount || 0) > 0 && (
						<button
							type="button"
							className="flex items-center gap-2 mt-1 text-sm text-blue-400 hover:underline"
						>
							<MessageSquare className="w-4 h-4" />
							<span>
								{message.threadCount}{" "}
								{message.threadCount === 1 ? "reply" : "replies"}
							</span>
						</button>
					)}
				</div>
			</div>

			{/* Message Actions */}
			{showActions && (
				<div className="absolute top-0 right-4 transform -translate-y-2 bg-[#222529] border border-gray-700 rounded-lg shadow-lg flex items-center">
					<button
						type="button"
						className="p-1.5 hover:bg-gray-700 rounded transition-colors relative"
						onClick={() => setShowEmojiPicker(!showEmojiPicker)}
					>
						<Smile className="w-4 h-4 text-gray-300" />
					</button>
					<button
						type="button"
						className="p-1.5 hover:bg-gray-700 transition-colors"
					>
						<MessageSquare className="w-4 h-4 text-gray-300" />
					</button>
					<button
						type="button"
						className="p-1.5 hover:bg-gray-700 transition-colors"
					>
						<Share className="w-4 h-4 text-gray-300" />
					</button>
					<button
						type="button"
						className="p-1.5 hover:bg-gray-700 transition-colors"
					>
						<Bookmark className="w-4 h-4 text-gray-300" />
					</button>
					{/* <div className="w-px h-5 bg-gray-700" />
					<button
						type="button"
						className="p-1.5 hover:bg-gray-700 rounded transition-colors"
					>
						<MoreVertical className="w-4 h-4 text-gray-300" />
					</button> */}
				</div>
			)}

			{/* Emoji Picker */}
			{showEmojiPicker && (
				<div className="absolute top-6 right-4 bg-[#222529] border border-gray-700 rounded-lg shadow-lg p-2 flex gap-1 z-10">
					{commonEmojis.map((emoji) => (
						<button
							type="button"
							key={emoji}
							className="w-8 h-8 hover:bg-gray-700 rounded flex items-center justify-center text-lg"
							onClick={() => {
								onAddReaction(message.id, emoji);
								setShowEmojiPicker(false);
							}}
						>
							{emoji}
						</button>
					))}
				</div>
			)}
		</div>
	);
}
