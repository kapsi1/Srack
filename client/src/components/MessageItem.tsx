/** biome-ignore-all lint/a11y/noStaticElementInteractions: Container handles mouse events for showing actions overlay */

import EmojiPicker, { type EmojiClickData, Theme } from 'emoji-picker-react';
import { Bookmark, FileText, MessageSquare, Share, Smile, Trash, Phone, Video, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Message, User } from '../App';

interface MessageItemProps {
	message: Message;
	showAvatar: boolean;
	onAddReaction: (messageId: string, emoji: string) => void;
	onToggleSave?: (messageId: string) => void;
	onReply?: (message: Message) => void;
	onForward?: (message: Message) => void;
	onDelete?: (messageId: string) => void;
	currentUser?: User | null;
}

export function MessageItem({
	message,
	showAvatar,
	onAddReaction,
	onToggleSave,
	onReply,
	onForward,
	onDelete,
	currentUser,
}: MessageItemProps) {
	const [showActions, setShowActions] = useState(false);
	const [showEmojiPicker, setShowEmojiPicker] = useState(false);
	const [pickerPosition, setPickerPosition] = useState({ top: 0, left: 0 });
	const pickerRef = useRef<HTMLDivElement>(null);
	const smileButtonRef = useRef<HTMLButtonElement>(null);
	const reactionsSmileButtonRef = useRef<HTMLButtonElement>(null);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
				setShowEmojiPicker(false);
			}
		};

		if (showEmojiPicker) {
			document.addEventListener('mousedown', handleClickOutside);
		}
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [showEmojiPicker]);

	const toggleEmojiPicker = (buttonRef: React.RefObject<HTMLButtonElement | null>) => {
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
		return date.toLocaleTimeString('en-US', {
			hour: 'numeric',
			minute: '2-digit',
			hour12: true,
		});
	};

	// Helper to highlight mentions
	const formatMentions = (text: string) => {
		// Replace @username with a markdown link that we can intercept
		// Be careful not to replace inside code blocks (handled by regex lookarounds or by remark plugins properly)
		// For simplicity: simple regex.
		return text.replace(/@(\w+)/g, '[@$1](/user/$1)');
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
					{showAvatar && <img src={message.userAvatar} alt={message.userName} className="w-9 h-9 rounded" />}
				</div>

				{/* Message Content */}
				<div className="flex-1 min-w-0">
					{showAvatar && (
						<div className="flex items-baseline gap-2 mb-0.5">
							<span className="text-white">{message.userName}</span>
							<span className="text-xs text-gray-500">{formatTime(message.timestamp)}</span>
						</div>
					)}
					{message.type !== 'CALL' && (
					<div className="text-gray-200 markdown-content">
						<ReactMarkdown
							remarkPlugins={[remarkGfm]}
							components={{
								p: ({ node, ...props }) => <p className="markdown-paragraph" {...props} />,
								a: ({ node, href, ...props }) => {
									if (href?.startsWith('/user/')) {
										return (
											<span className="text-blue-400 bg-blue-500/10 px-1 rounded font-medium hover:bg-blue-500/20">
												{props.children}
											</span>
										);
									}
									return (
										<a className="markdown-link" target="_blank" rel="noopener noreferrer" href={href} {...props} />
									);
								},
								ul: ({ node, ...props }) => <ul className="markdown-list-unordered" {...props} />,
								ol: ({ node, ...props }) => <ol className="markdown-list-ordered" {...props} />,
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
								strong: ({ node, ...props }) => <strong className="markdown-strong" {...props} />,
								em: ({ node, ...props }) => <em className="markdown-em" {...props} />,
								del: ({ node, ...props }) => <del className="markdown-del" {...props} />,
							}}
						>
							{formatMentions(message.content)}
						</ReactMarkdown>
					</div>
					)}

					{/* Call Info Card */}
					{message.type === 'CALL' && message.metadata && (
						<div className="mt-2 text-sm bg-gray-800 border border-gray-700 rounded-lg p-3 max-w-sm">
							<div className="flex items-center gap-2 mb-2 font-medium text-gray-200">
								{message.metadata.callType === 'video' ? <Video className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
								<span>{message.content}</span>
							</div>

							<div className="space-y-1 text-gray-400 text-xs">
								{message.metadata.startedAt && (
									<div className="flex items-center gap-2">
										<Clock className="w-3 h-3" />
										<span>Started: {new Date(message.metadata.startedAt).toLocaleTimeString()}</span>
									</div>
								)}
								{message.metadata.endedAt && (
									<div className="flex items-center gap-2">
										<Clock className="w-3 h-3" />
										<span>Ended: {new Date(message.metadata.endedAt).toLocaleTimeString()}</span>
									</div>
								)}
								<div className="flex items-center gap-2">
									<Clock className="w-3 h-3" />
									<span>Duration: {message.metadata.duration ? `${Math.floor(message.metadata.duration / 60)}m ${message.metadata.duration % 60}s` : '0s'}</span>
								</div>
								
								{message.metadata.status === 'completed' ? (
									<div className="flex items-center gap-2 text-green-400">
										<CheckCircle2 className="w-3 h-3" />
										<span>Completed</span>
									</div>
								) : (
									<div className="flex items-center gap-2 text-red-400">
										<AlertCircle className="w-3 h-3" />
										<span>{message.metadata.reason || 'Failed'}</span>
									</div>
								)}
							</div>
						</div>
					)}
					
					{/* Attachments */}
					{message.attachments && message.attachments.length > 0 && (
						<div className="flex flex-wrap gap-2 mt-2">
							{message.attachments.map((attachment) => {
								const isImage = attachment.mimeType?.startsWith('image/');
								const isAudio = attachment.mimeType?.startsWith('audio/');
								const isVideo = attachment.mimeType?.startsWith('video/');

								if (isImage) {
									return (
										<a
											key={attachment.uuid}
											href={attachment.cdnUrl}
											target="_blank"
											rel="noopener noreferrer"
											className="block rounded-lg overflow-hidden border border-gray-700 hover:border-blue-500 transition-colors"
										>
											<img
												src={`${attachment.cdnUrl}-/preview/600x600/-/quality/smart/`}
												alt={attachment.name}
												className="max-w-full max-h-[300px] object-contain bg-[#1a1d21]"
											/>
										</a>
									);
								}

								if (isAudio) {
									return (
										<div key={attachment.uuid} className="rounded-lg overflow-hidden border border-gray-700 bg-[#1a1d21] p-2 min-w-[300px]">
											<div className="flex items-center gap-2 mb-2 text-sm text-gray-300">
												<FileText className="w-4 h-4" />
												<span className="truncate">{attachment.name}</span>
											</div>
											{/* biome-ignore lint/a11y/useMediaCaption: User uploaded content does not support captions yet */}
											<audio controls className="w-full h-8" src={attachment.cdnUrl} />
										</div>
									);
								}

								if (isVideo) {
									return (
										<div key={attachment.uuid} className="rounded-lg overflow-hidden border border-gray-700 bg-[#1a1d21] max-w-[400px]">
											{/* biome-ignore lint/a11y/useMediaCaption: User uploaded content does not support captions yet */}
											<video controls className="w-full max-h-[300px]" src={attachment.cdnUrl} />
											<div className="p-2 border-t border-gray-800 text-xs text-gray-400 truncate">
												{attachment.name}
											</div>
										</div>
									);
								}

								return (
									<a
										key={attachment.uuid}
										href={attachment.cdnUrl}
										target="_blank"
										rel="noopener noreferrer"
										className="flex items-center gap-3 px-3 py-2 bg-[#1a1d21] border border-gray-700 rounded-lg hover:border-blue-500 transition-colors group/file"
									>
										<div className="p-2 bg-gray-800 rounded group-hover/file:bg-gray-700 transition-colors">
											<FileText className="w-5 h-5 text-gray-400" />
										</div>
										<div className="flex flex-col min-w-0">
											<span className="text-sm text-gray-200 font-medium truncate max-w-[200px]">{attachment.name}</span>
											<span className="text-xs text-gray-500">{(attachment.size / 1024).toFixed(1)} KB</span>
										</div>
									</a>
								);
							})}
						</div>
					)}

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
									<span className="text-xs text-gray-300">{reaction.count}</span>
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
								{message.threadCount} {message.threadCount === 1 ? 'reply' : 'replies'}
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
						className={`p-1.5 hover:bg-gray-700 transition-colors ${message.isSaved ? 'text-blue-400 bg-gray-700' : ''}`}
						onClick={() => onToggleSave?.(message.id)}
						title={message.isSaved ? 'Remove from saved' : 'Save message'}
					>
						<Bookmark className={`w-4 h-4 ${message.isSaved ? 'fill-current' : 'text-gray-300'}`} />
					</button>
					{currentUser?.id === message.userId && onDelete && (
						<button
							type="button"
							className="p-1.5 hover:bg-gray-700 transition-colors text-red-500 hover:text-red-400"
							onClick={() => onDelete(message.id)}
							title="Delete message"
						>
							<Trash className="w-4 h-4" />
						</button>
					)}
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
