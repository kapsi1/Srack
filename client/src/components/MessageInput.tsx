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
import { useRef, useState, useEffect } from 'react';
import EmojiPicker, { Theme, type EmojiClickData } from 'emoji-picker-react';
import { createPortal } from 'react-dom';

interface MessageInputProps {
	channelName: string;
	isDM?: boolean;
	onSendMessage: (content: string) => void;
}

export function MessageInput({ channelName, isDM, onSendMessage }: MessageInputProps) {
	const [message, setMessage] = useState('');
	const [showEmojiPicker, setShowEmojiPicker] = useState(false);
	const [pickerPosition, setPickerPosition] = useState({ top: 0, left: 0 });
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const pickerRef = useRef<HTMLDivElement>(null);
	const smileButtonRef = useRef<HTMLButtonElement>(null);

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
			textarea.setSelectionRange(start + emojiData.emoji.length, start + emojiData.emoji.length);
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
		const selection = text.substring(start, end) || 'text';
		const after = text.substring(end);

		const newText = `${before}[${selection}](url)${after}`;
		setMessage(newText);

		setTimeout(() => {
			textarea.focus();
			const urlStart = start + selection.length + 3;
			textarea.setSelectionRange(urlStart, urlStart + 3);
		}, 0);
	};

	const handleList = (type: 'ordered' | 'unordered') => {
		const textarea = textareaRef.current;
		if (!textarea) return;

		const start = textarea.selectionStart;
		const end = textarea.selectionEnd;
		const text = textarea.value;

		const before = text.substring(0, start);
		const selection = text.substring(start, end);
		const after = text.substring(end);

		const lines = (selection || '').split('\n');
		const formattedLines = lines.map((line, index) => {
			if (type === 'ordered') {
				return `${index + 1}. ${line}`;
			}
			return `* ${line}`;
		});

		const replacement = formattedLines.join('\n');
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

		let replacement = '';
		let selectionOffset = 0;

		if (selection.includes('\n')) {
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
			textarea.setSelectionRange(start + selectionOffset, start + selectionOffset + selection.length);
		}, 0);
	};

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
				<div className="border border-gray-700 rounded-lg focus-within:border-gray-600 transition-colors bg-[#222529]">
					{/* Formatting Toolbar */}
					<div className="border-b border-gray-700 px-2 py-1 flex items-center gap-1">
						<button
							type="button"
							className="p-1.5 hover:bg-gray-700 rounded transition-colors"
							onClick={() => handleFormat('**')}
							title="Bold"
						>
							<Bold className="w-4 h-4 text-gray-300" />
						</button>
						<button
							type="button"
							className="p-1.5 hover:bg-gray-700 rounded transition-colors"
							onClick={() => handleFormat('_')}
							title="Italic"
						>
							<Italic className="w-4 h-4 text-gray-300" />
						</button>
						<button
							type="button"
							className="p-1.5 hover:bg-gray-700 rounded transition-colors"
							onClick={() => handleFormat('~~')}
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
							onClick={() => handleList('ordered')}
							title="Ordered List"
						>
							<ListOrdered className="w-4 h-4 text-gray-300" />
						</button>
						<button
							type="button"
							className="p-1.5 hover:bg-gray-700 rounded transition-colors"
							onClick={() => handleList('unordered')}
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
						placeholder={`Message ${isDM ? '@' : '#'}${channelName}`}
						className="w-full px-3 py-2 resize-none outline-none bg-transparent text-white placeholder-gray-500 font-normal"
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
							<div className="relative">
								<button
									type="button"
									ref={smileButtonRef}
									className="p-1.5 hover:bg-gray-700 rounded transition-colors"
									onClick={toggleEmojiPicker}
								>
									<Smile className="w-4 h-4 text-gray-300" />
								</button>
								{showEmojiPicker && createPortal(
									<div 
										className="fixed z-[9999]" 
										style={{ 
											top: `${pickerPosition.top}px`, 
											left: `${pickerPosition.left}px` 
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
									document.body
								)}
							</div>
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
