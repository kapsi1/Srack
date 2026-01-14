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
} from "lucide-react";
import { useRef, useState, useEffect } from "react";
import EmojiPicker, { Theme, type EmojiClickData } from "emoji-picker-react";
import { createPortal } from "react-dom";
import type { User } from "../App";

interface MessageInputProps {
	channelName: string;
	isDM?: boolean;
	onSendMessage: (content: string) => void;
	placeholder?: string;
	users?: User[];
}

export function MessageInput({
	channelName,
	isDM,
	onSendMessage,
	placeholder,
	users = [],
}: MessageInputProps) {
	const [message, setMessage] = useState("");
	const [showEmojiPicker, setShowEmojiPicker] = useState(false);
	const [pickerPosition, setPickerPosition] = useState({ top: 0, left: 0 });

	// Mention state
	const [showMentionPicker, setShowMentionPicker] = useState(false);
	const [mentionQuery, setMentionQuery] = useState("");
	const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
	const [mentionSelectedIndex, setMentionSelectedIndex] = useState(0);

	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const pickerRef = useRef<HTMLDivElement>(null);
	const smileButtonRef = useRef<HTMLButtonElement>(null);
	const atButtonRef = useRef<HTMLButtonElement>(null);

	const filteredUsers = users
		.filter((u) =>
			u.username.toLowerCase().includes(mentionQuery.toLowerCase()),
		)
		.slice(0, 5); // Limit to 5 suggestions

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				pickerRef.current &&
				!pickerRef.current.contains(event.target as Node)
			) {
				setShowEmojiPicker(false);
			}
			// Close mention picker on click outside (though typing usually handles it)
			if (
				showMentionPicker &&
				textareaRef.current &&
				!textareaRef.current.contains(event.target as Node)
			) {
				// Check if clicking inside the mention portal (omitted for simplicity as it lives in portal)
				// Actually we need to check if click is NOT in the mention picker
				const mentionPickerEl = document.getElementById(
					"mention-picker-portal",
				);
				if (
					mentionPickerEl &&
					!mentionPickerEl.contains(event.target as Node)
				) {
					setShowMentionPicker(false);
				}
			}
		};

		if (showEmojiPicker || showMentionPicker) {
			document.addEventListener("mousedown", handleClickOutside);
		}
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [showEmojiPicker, showMentionPicker]);

	// Check for mentions on text change
	useEffect(() => {
		if (!textareaRef.current) return;

		const cursorPosition = textareaRef.current.selectionStart;
		const textBeforeCursor = message.slice(0, cursorPosition);

		// Regex to match the last word if it starts with @
		const match = textBeforeCursor.match(/@(\w*)$/);

		if (match) {
			const query = match[1];
			setMentionQuery(query);
			setShowMentionPicker(true);
			setMentionSelectedIndex(0);

			// Calculate position
			// This is a rough estimation. For production we usually use a dedicated library like 'textarea-caret'
			const rect = textareaRef.current.getBoundingClientRect();
			// Approximating caret position is hard without library.
			// We'll position it relatively to the textarea for now, or use the @ button position if we used that.
			// Let's position it above the textarea, aligned left but maybe offset by some chars width
			// A better way without extra deps is just above the current line approx.

			// Re-using the logic from emoji picker but anchored to bottom-left of textarea for now for simplicity,
			// or we can try to follow text.
			// Let's stick to a fixed position above the input for v1 to ensure it doesn't break layout.
			const pickerTop =
				rect.top + window.scrollY - filteredUsers.length * 40 - 20;
			const pickerLeft =
				rect.left +
				window.scrollX +
				((textBeforeCursor.length * 8) % rect.width); // Very rough horizontal approx

			setMentionPosition({
				top: pickerTop < 0 ? rect.bottom + window.scrollY : pickerTop,
				left: Math.min(Math.max(pickerLeft, rect.left), rect.right - 200),
			});
		} else {
			setShowMentionPicker(false);
		}
	}, [message, filteredUsers.length]); // filteredUsers dep loop specific properties not needed if we calculate inside render or use memos properly

	const toggleEmojiPicker = () => {
		if (showEmojiPicker) {
			setShowEmojiPicker(false);
			return;
		}

		if (smileButtonRef.current) {
			const rect = smileButtonRef.current.getBoundingClientRect();
			// Position the picker above the button by default since input is at bottom
			let pickerTop = rect.top + window.scrollY - 450 - 5;
			if (pickerTop < 0) {
				pickerTop = rect.bottom + window.scrollY + 5;
			}

			let pickerLeft = rect.left + window.scrollX;
			if (pickerLeft + 350 > window.innerWidth) {
				pickerLeft = window.innerWidth - 350 - 20;
			}

			setPickerPosition({ top: pickerTop, left: pickerLeft });
			setShowEmojiPicker(true);
		}
	};

	const onEmojiClick = (emojiData: EmojiClickData) => {
		const textarea = textareaRef.current;
		if (!textarea) return;

		const start = textarea.selectionStart;
		const end = textarea.selectionEnd;
		const text = textarea.value;

		const before = text.substring(0, start);
		const after = text.substring(end);

		const newText = `${before}${emojiData.emoji}${after}`;
		setMessage(newText);
		setShowEmojiPicker(false);

		// Restore cursor
		setTimeout(() => {
			textarea.focus();
			textarea.setSelectionRange(
				start + emojiData.emoji.length,
				start + emojiData.emoji.length,
			);
		}, 0);
	};

	const handleMentionSelect = (user: User) => {
		const textarea = textareaRef.current;
		if (!textarea) return;

		const cursorPosition = textarea.selectionStart;
		const textBeforeCursor = message.slice(0, cursorPosition);
		const textAfterCursor = message.slice(cursorPosition);

		// Find where the @ started
		const lastAt = textBeforeCursor.lastIndexOf("@");
		const textBeforeAt = textBeforeCursor.slice(0, lastAt);

		const newText = `${textBeforeAt}@${user.username} ${textAfterCursor}`;
		setMessage(newText);
		setShowMentionPicker(false);

		setTimeout(() => {
			textarea.focus();
			const newCursorPos = lastAt + user.username.length + 2; // @ + name + space
			textarea.setSelectionRange(newCursorPos, newCursorPos);
		}, 0);
	};

	const toggleMentionPicker = () => {
		// Manually trigger mention at current cursor
		const textarea = textareaRef.current;
		if (!textarea) return;

		const start = textarea.selectionStart;
		const text = textarea.value;
		const newText = text.slice(0, start) + "@" + text.slice(start);
		setMessage(newText);

		setTimeout(() => {
			textarea.focus();
			textarea.setSelectionRange(start + 1, start + 1);
		}, 0);
	};

	const handleFormat = (format: string) => {
		const textarea = textareaRef.current;
		if (!textarea) return;

		const start = textarea.selectionStart;
		const end = textarea.selectionEnd;
		const text = textarea.value;

		const before = text.substring(0, start);
		const selection = text.substring(start, end);
		const after = text.substring(end);

		const newText = `${before}${format}${selection}${format}${after}`;
		setMessage(newText);

		// Restore cursor/selection
		setTimeout(() => {
			textarea.focus();
			textarea.setSelectionRange(start + format.length, end + format.length);
		}, 0);
	};

	const handleLink = () => {
		const textarea = textareaRef.current;
		if (!textarea) return;

		const start = textarea.selectionStart;
		const end = textarea.selectionEnd;
		const text = textarea.value;

		const before = text.substring(0, start);
		const selection = text.substring(start, end) || "text";
		const after = text.substring(end);

		const newText = `${before}[${selection}](url)${after}`;
		setMessage(newText);

		setTimeout(() => {
			textarea.focus();
			const urlStart = start + selection.length + 3;
			textarea.setSelectionRange(urlStart, urlStart + 3);
		}, 0);
	};

	const handleList = (type: "ordered" | "unordered") => {
		const textarea = textareaRef.current;
		if (!textarea) return;

		const start = textarea.selectionStart;
		const end = textarea.selectionEnd;
		const text = textarea.value;

		const before = text.substring(0, start);
		const selection = text.substring(start, end);
		const after = text.substring(end);

		const lines = (selection || "").split("\n");
		const formattedLines = lines.map((line, index) => {
			if (type === "ordered") {
				return `${index + 1}. ${line}`;
			}
			return `* ${line}`;
		});

		const replacement = formattedLines.join("\n");
		const newText = `${before}${replacement}${after}`;
		setMessage(newText);

		setTimeout(() => {
			textarea.focus();
			const newEnd = start + replacement.length;
			textarea.setSelectionRange(selection ? start : newEnd, newEnd);
		}, 0);
	};

	const handleCode = () => {
		const textarea = textareaRef.current;
		if (!textarea) return;

		const start = textarea.selectionStart;
		const end = textarea.selectionEnd;
		const text = textarea.value;

		const before = text.substring(0, start);
		const selection = text.substring(start, end);
		const after = text.substring(end);

		let replacement = "";
		let selectionOffset = 0;

		if (selection.includes("\n")) {
			replacement = `\`\`\`\n${selection}\n\`\`\``;
			selectionOffset = 4;
		} else {
			replacement = `\`${selection}\``;
			selectionOffset = 1;
		}

		const newText = `${before}${replacement}${after}`;
		setMessage(newText);

		setTimeout(() => {
			textarea.focus();
			textarea.setSelectionRange(
				start + selectionOffset,
				start + selectionOffset + selection.length,
			);
		}, 0);
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (message.trim()) {
			onSendMessage(message);
			setMessage("");
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (showMentionPicker && filteredUsers.length > 0) {
			if (e.key === "ArrowDown") {
				e.preventDefault();
				setMentionSelectedIndex((prev) => (prev + 1) % filteredUsers.length);
				return;
			}
			if (e.key === "ArrowUp") {
				e.preventDefault();
				setMentionSelectedIndex(
					(prev) => (prev - 1 + filteredUsers.length) % filteredUsers.length,
				);
				return;
			}
			if (e.key === "Enter" || e.key === "Tab") {
				e.preventDefault();
				handleMentionSelect(filteredUsers[mentionSelectedIndex]);
				return;
			}
			if (e.key === "Escape") {
				e.preventDefault();
				setShowMentionPicker(false);
				return;
			}
		}

		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSubmit(e);
		}
	};

	return (
		<div className="border-t border-gray-800 p-4">
			<form onSubmit={handleSubmit}>
				<div className="border border-gray-700 rounded-lg focus-within:border-gray-600 transition-colors bg-[#222529]">
					{/* Formatting Toolbar */}
					<div className="border-b border-gray-700 px-2 py-1 flex items-center gap-1">
						<button
							type="button"
							className="p-1.5 hover:bg-gray-700 rounded transition-colors"
							onClick={() => handleFormat("**")}
							title="Bold"
						>
							<Bold className="w-4 h-4 text-gray-300" />
						</button>
						<button
							type="button"
							className="p-1.5 hover:bg-gray-700 rounded transition-colors"
							onClick={() => handleFormat("_")}
							title="Italic"
						>
							<Italic className="w-4 h-4 text-gray-300" />
						</button>
						<button
							type="button"
							className="p-1.5 hover:bg-gray-700 rounded transition-colors"
							onClick={() => handleFormat("~~")}
							title="Strikethrough"
						>
							<Strikethrough className="w-4 h-4 text-gray-300" />
						</button>
						<div className="w-px h-5 bg-gray-700 mx-1" />
						<button
							type="button"
							className="p-1.5 hover:bg-gray-700 rounded transition-colors"
							onClick={handleLink}
							title="Link"
						>
							<Link className="w-4 h-4 text-gray-300" />
						</button>
						<button
							type="button"
							className="p-1.5 hover:bg-gray-700 rounded transition-colors"
							onClick={() => handleList("ordered")}
							title="Ordered List"
						>
							<ListOrdered className="w-4 h-4 text-gray-300" />
						</button>
						<button
							type="button"
							className="p-1.5 hover:bg-gray-700 rounded transition-colors"
							onClick={() => handleList("unordered")}
							title="Unordered List"
						>
							<List className="w-4 h-4 text-gray-300" />
						</button>
						<button
							type="button"
							className="p-1.5 hover:bg-gray-700 rounded transition-colors"
							onClick={handleCode}
							title="Code"
						>
							<Code className="w-4 h-4 text-gray-300" />
						</button>
					</div>

					{/* Text Input */}
					<textarea
						ref={textareaRef}
						value={message}
						onChange={(e) => setMessage(e.target.value)}
						onKeyDown={handleKeyDown}
						placeholder={
							placeholder || `Message ${isDM ? "@" : "#"}${channelName}`
						}
						className="w-full px-3 py-2 resize-none outline-none bg-transparent text-white placeholder-gray-500 font-normal"
						rows={3}
					/>

					{/* Bottom Actions */}
					<div className="px-2 py-1 flex items-center justify-between">
						<div className="flex items-center gap-1">
							<div className="relative">
								<button
									type="button"
									ref={smileButtonRef}
									className="p-1.5 hover:bg-gray-700 rounded transition-colors"
									onClick={toggleEmojiPicker}
									title="Emoji"
								>
									<Smile className="w-4 h-4 text-gray-300" />
								</button>
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
												onEmojiClick={onEmojiClick}
												autoFocusSearch={false}
												width={350}
												height={450}
											/>
										</div>,
										document.body,
									)}
							</div>

							<button
								type="button"
								ref={atButtonRef}
								className="p-1.5 hover:bg-gray-700 rounded transition-colors"
								onClick={toggleMentionPicker}
								title="Mention someone"
							>
								<AtSign className="w-4 h-4 text-gray-300" />
							</button>
							{showMentionPicker &&
								filteredUsers.length > 0 &&
								createPortal(
									<div
										id="mention-picker-portal"
										className="fixed z-[9999] bg-[#1a1d21] border border-gray-700 rounded-lg shadow-xl overflow-hidden w-64"
										style={{
											top: `${mentionPosition.top}px`,
											left: `${mentionPosition.left}px`,
										}}
									>
										<div className="p-1">
											{filteredUsers.map((user, index) => (
												<button
													type="button"
													key={user.id}
													className={`w-full text-left px-3 py-2 rounded flex items-center gap-2 ${
														index === mentionSelectedIndex
															? "bg-blue-600 text-white"
															: "hover:bg-gray-800 text-gray-200"
													}`}
													onClick={() => handleMentionSelect(user)}
													onMouseEnter={() => setMentionSelectedIndex(index)}
												>
													<img
														src={
															user.avatar ||
															`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`
														}
														alt={user.username}
														className="w-5 h-5 rounded-full"
													/>
													<span className="font-medium">{user.username}</span>
												</button>
											))}
										</div>
										<div className="bg-gray-800 px-2 py-1 text-xs text-gray-400 border-t border-gray-700">
											Use ↑↓ to navigate, Enter to select
										</div>
									</div>,
									document.body,
								)}
							<button
								type="button"
								className="p-1.5 hover:bg-gray-700 rounded transition-colors"
								title="Attach file"
							>
								<Paperclip className="w-4 h-4 text-gray-300" />
							</button>
							<button
								type="button"
								className="p-1.5 hover:bg-gray-700 rounded transition-colors"
								title="Record audio"
							>
								<Mic className="w-4 h-4 text-gray-300" />
							</button>
						</div>
						<button
							type="submit"
							disabled={!message.trim()}
							className="p-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-green-600"
							title="Send message"
						>
							<Send className="w-4 h-4" />
						</button>
					</div>
				</div>
			</form>
		</div>
	);
}
