import type React from "react";
import { useState, useEffect } from "react";
import { X, Share, Hash } from "lucide-react";
import type { Channel, Message } from "../App";

interface ForwardMessageModalProps {
	isOpen: boolean;
	onClose: () => void;
	channels: Channel[];
	message: Message | null;
	onForward: (channelId: string) => void;
}

export function ForwardMessageModal({
	isOpen,
	onClose,
	channels,
	message,
	onForward,
}: ForwardMessageModalProps) {
	const [selectedChannelId, setSelectedChannelId] = useState<string>("");

	// Reset selection when modal opens
	useEffect(() => {
		if (isOpen) {
			setSelectedChannelId("");
		}
	}, [isOpen]);

	if (!isOpen || !message) return null;

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (selectedChannelId) {
			onForward(selectedChannelId);
			onClose();
		}
	};

	const publicChannels = channels.filter((c) => c.type !== "DM");

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
			<div className="bg-white dark:bg-[#1a1d21] w-full max-w-[520px] rounded-xl shadow-2xl overflow-hidden border border-white/10 animate-in fade-in zoom-in duration-200">
				<div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/5">
					<h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
						<Share className="w-5 h-5" />
						Forward message
					</h2>
					<button
						type="button"
						onClick={onClose}
						className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
					>
						<X className="w-6 h-6" />
					</button>
				</div>

				<form onSubmit={handleSubmit} className="p-6">
					{/* Message Preview */}
					<div className="mb-6 p-4 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
						<div className="flex items-baseline gap-2 mb-1">
							<span className="font-bold text-gray-900 dark:text-white text-sm">
								{message.userName}
							</span>
							<span className="text-xs text-gray-500">
								{message.timestamp.toLocaleString()}
							</span>
						</div>
						<div className="text-gray-700 dark:text-gray-300 text-sm line-clamp-3">
							{message.content}
						</div>
					</div>

					<div className="space-y-4">
						<div>
							<label
								htmlFor="channel-select"
								className="block text-sm font-bold text-gray-900 dark:text-white mb-2"
							>
								Forward to channel
							</label>
							<div className="relative">
								<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
									<Hash className="w-4 h-4 text-gray-400" />
								</div>
								<select
									id="channel-select"
									value={selectedChannelId}
									onChange={(e) => setSelectedChannelId(e.target.value)}
									className="block w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-white/10 rounded-md bg-white dark:bg-[#111315] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1264a3] focus:border-transparent sm:text-sm appearance-none cursor-pointer"
									required
								>
									<option value="" disabled>
										Select a channel
									</option>
									{publicChannels.map((channel) => (
										<option key={channel.id} value={channel.id}>
											{channel.name}
										</option>
									))}
								</select>
								<div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
									<svg
										className="h-5 w-5 text-gray-400"
										xmlns="http://www.w3.org/2000/svg"
										viewBox="0 0 20 20"
										fill="currentColor"
										aria-hidden="true"
									>
										<path
											fillRule="evenodd"
											d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
											clipRule="evenodd"
										/>
									</svg>
								</div>
							</div>
						</div>
					</div>

					<div className="mt-8 flex justify-end gap-3">
						<button
							type="button"
							onClick={onClose}
							className="px-4 py-2 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded transition-colors"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={!selectedChannelId}
							className={`px-6 py-2 text-sm font-bold text-white rounded shadow-sm transition-all ${
								selectedChannelId
									? "bg-[#007a5a] hover:bg-[#148567] active:scale-95"
									: "bg-gray-300 dark:bg-white/10 cursor-not-allowed"
							}`}
						>
							Forward
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
