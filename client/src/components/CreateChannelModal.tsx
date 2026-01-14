import type React from "react";
import { useState } from "react";
import { X, Lock, Hash } from "lucide-react";

interface CreateChannelModalProps {
	isOpen: boolean;
	onClose: () => void;
	onCreate: (name: string, isPrivate: boolean, description: string) => void;
}

export function CreateChannelModal({
	isOpen,
	onClose,
	onCreate,
}: CreateChannelModalProps) {
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [isPrivate, setIsPrivate] = useState(false);

	if (!isOpen) return null;

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (name.trim()) {
			onCreate(name.trim(), isPrivate, description.trim());
			setName("");
			setDescription("");
			setIsPrivate(false);
			onClose();
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
			<div className="bg-white dark:bg-[#1a1d21] w-full max-w-[520px] rounded-xl shadow-2xl overflow-hidden border border-white/10 animate-in fade-in zoom-in duration-200">
				<div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/5">
					<h2 className="text-xl font-bold text-gray-900 dark:text-white">
						Create a channel
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
					<p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
						Channels are where your team communicates. They’re best when
						organized around a topic — #marketing, for example.
					</p>

					<div className="space-y-6">
						<div>
							<label
								htmlFor="name"
								className="block text-sm font-bold text-gray-900 dark:text-white mb-2"
							>
								Name
							</label>
							<div className="relative">
								<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
									{isPrivate ? (
										<Lock className="w-4 h-4 text-gray-400" />
									) : (
										<Hash className="w-4 h-4 text-gray-400" />
									)}
								</div>
								<input
									type="text"
									id="name"
									value={name}
									onChange={(e) => setName(e.target.value)}
									className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-white/10 rounded-md bg-white dark:bg-transparent text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1264a3] focus:border-transparent sm:text-sm transition-shadow"
									placeholder="e.g. plan-budget"
									required
								/>
							</div>
						</div>

						<div>
							<label
								htmlFor="description"
								className="block text-sm font-bold text-gray-900 dark:text-white mb-1"
							>
								Description{" "}
								<span className="text-gray-500 font-normal">(optional)</span>
							</label>
							<textarea
								id="description"
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								className="block w-full px-3 py-2 border border-gray-300 dark:border-white/10 rounded-md bg-white dark:bg-transparent text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1264a3] focus:border-transparent sm:text-sm transition-shadow resize-none"
								rows={3}
							/>
							<p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
								What’s this channel about?
							</p>
						</div>

						<div className="flex items-center justify-between">
							<div className="flex flex-col pr-4">
								<span className="text-sm font-bold text-gray-900 dark:text-white">
									Make private
								</span>
								<span className="text-xs text-gray-500 dark:text-gray-400">
									When a channel is set to private, it can only be viewed or
									joined by invitation.
								</span>
							</div>
							<button
								type="button"
								onClick={() => setIsPrivate(!isPrivate)}
								className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#1264a3] focus:ring-offset-2 ${
									isPrivate ? "bg-green-600" : "bg-gray-200 dark:bg-white/10"
								}`}
							>
								<span
									aria-hidden="true"
									className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
										isPrivate ? "translate-x-5" : "translate-x-0"
									}`}
								/>
							</button>
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
							disabled={!name.trim()}
							className={`px-6 py-2 text-sm font-bold text-white rounded shadow-sm transition-all ${
								name.trim()
									? "bg-[#007a5a] hover:bg-[#148567] active:scale-95"
									: "bg-gray-300 dark:bg-white/10 cursor-not-allowed"
							}`}
						>
							Create
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
