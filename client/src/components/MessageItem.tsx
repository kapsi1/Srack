/** biome-ignore-all lint/a11y/noStaticElementInteractions: Container handles mouse events for showing actions overlay */
import { Bookmark, MessageSquare, Share, Smile } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { createPortal } from "react-dom";
import EmojiPicker, { Theme, type EmojiClickData } from "emoji-picker-react";
import type { Message } from "../App";

interface MessageItemProps {
	message: Message;
	showAvatar: boolean;
	onAddReaction: (messageId: string, emoji: string) => void;
	onToggleSave?: (messageId: string) => void;
	onReply?: (message: Message) => void;
	onForward?: (message: Message) => void;
}

export function MessageItem({
	message,
	showAvatar,
	onAddReaction,
	onToggleSave,
	onReply,
	onForward,
}: MessageItemProps) {
	const [showActions, setShowActions] = useState(false);
	const [showEmojiPicker, setShowEmojiPicker] = useState(false);
	const [pickerPosition, setPickerPosition] = useState({ top: 0, left: 0 });
	const pickerRef = useRef<HTMLDivElement>(null);
	const smileButtonRef = useRef<HTMLButtonElement>(null);
	const reactionsSmileButtonRef = useRef<HTMLButtonElement>(null);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				pickerRef.current &&
				!pickerRef.current.contains(event.target as Node)
			) {
				setShowEmojiPicker(false);
			}
		};

		if (showEmojiPicker) {
			document.addEventListener("mousedown", handleClickOutside);
		}
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [showEmojiPicker]);

	const toggleEmojiPicker = (
		buttonRef: React.RefObject<HTMLButtonElement | null>,
	) => {
		if (showEmojiPicker) {
			setShowEmojiPicker(false);
			return;
		}

		if (buttonRef.current) {
			const rect = buttonRef.current.getBoundingClientRect();
			// Position the picker above/below the button
			const top = rect.top + window.scrollY;
			const left = rect.left + window.scrollX;

			// Adjust if it would go off screen
			let pickerTop = top + rect.height + 5;
			if (pickerTop + 450 > window.innerHeight) {
				pickerTop = top - 450 - 5;
			}

			let pickerLeft = left - 350 + rect.width;
			if (pickerLeft < 0) pickerLeft = left;

			setPickerPosition({ top: pickerTop, left: pickerLeft });
			setShowEmojiPicker(true);
		}
	};

	const formatTime = (date: Date) => {
		return date.toLocaleTimeString("en-US", {
			hour: "numeric",
			minute: "2-digit",
			hour12: true,
		});
	};

	// Helper to highlight mentions
	const formatMentions = (text: string) => {
		// Replace @username with a markdown link that we can intercept
		// Be careful not to replace inside code blocks (handled by regex lookarounds or by remark plugins properly)
		// For simplicity: simple regex.
		return text.replace(/@(\w+)/g, "[@$1](/user/$1)");
	};

	return (
		<div
			className="group relative py-2 hover:bg-[#222529] -mx-4 px-4"
			onMouseEnter={() => setShowActions(true)}
			onMouseLeave={() => {
				setShowActions(false);
				// Don't hide emoji picker on mouse leave, let handleClickOutside handle it
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
								p: ({ node, ...props }) => (
									<p className="markdown-paragraph" {...props} />
								),
								a: ({ node, href, ...props }) => {
									if (href?.startsWith("/user/")) {
										return (
											<span className="text-blue-400 bg-blue-500/10 px-1 rounded font-medium hover:bg-blue-500/20">
												{props.children}
											</span>
										);
									}
									return (
										<a
											className="markdown-link"
											target="_blank"
											rel="noopener noreferrer"
											href={href}
											{...props}
										/>
									);
								},
								ul: ({ node, ...props }) => (
									<ul className="markdown-list-unordered" {...props} />
								),
								ol: ({ node, ...props }) => (
									<ol className="markdown-list-ordered" {...props} />
								),
								li: ({ node, ...props }) => (
									<li className="markdown-list-item" {...props} />
								),
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
								em: ({ node, ...props }) => (
									<em className="markdown-em" {...props} />
								),
								del: ({ node, ...props }) => (
									<del className="markdown-del" {...props} />
								),
							}}
						>
							{formatMentions(message.content)}
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
								ref={reactionsSmileButtonRef}
								className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#222529] border border-gray-700 rounded hover:border-blue-500 transition-colors text-sm"
								onClick={() => toggleEmojiPicker(reactionsSmileButtonRef)}
								title="Add reaction"
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
							onClick={() => onReply?.(message)}
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
						ref={smileButtonRef}
						className="p-1.5 hover:bg-gray-700 rounded transition-colors relative"
						onClick={() => toggleEmojiPicker(smileButtonRef)}
						title="Add reaction"
					>
						<Smile className="w-4 h-4 text-gray-300" />
					</button>
					<button
						type="button"
						className="p-1.5 hover:bg-gray-700 transition-colors"
						onClick={() => onReply?.(message)}
						title="Reply in thread"
					>
						<MessageSquare className="w-4 h-4 text-gray-300" />
					</button>
					<button
						type="button"
						className="p-1.5 hover:bg-gray-700 transition-colors"
						onClick={() => onForward?.(message)}
						title="Forward message"
					>
						<Share className="w-4 h-4 text-gray-300" />
					</button>
					<button
						type="button"
						className={`p-1.5 hover:bg-gray-700 transition-colors ${message.isSaved ? "text-blue-400 bg-gray-700" : ""}`}
						onClick={() => onToggleSave?.(message.id)}
						title={message.isSaved ? "Remove from saved" : "Save message"}
					>
						<Bookmark
							className={`w-4 h-4 ${message.isSaved ? "fill-current" : "text-gray-300"}`}
						/>
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

			{/* Emoji Picker Portal */}
			{showEmojiPicker &&
				createPortal(
					<div
						className="fixed z-[9999]"
						style={{
							top: `${pickerPosition.top}px`,
							left: `${pickerPosition.left}px`,
						}}
						ref={pickerRef}
					>
						<EmojiPicker
							theme={Theme.DARK}
							onEmojiClick={(emojiData: EmojiClickData) => {
								onAddReaction(message.id, emojiData.emoji);
								setShowEmojiPicker(false);
							}}
							autoFocusSearch={false}
							width={350}
							height={450}
						/>
					</div>,
					document.body,
				)}
		</div>
	);
}
