import { useQuery } from '@tanstack/react-query';
import { Menu, MessageSquare, PanelLeftOpen } from 'lucide-react';
import { type Message as ApiMessage, fetchUserThreads, type User } from '../lib/api';

interface ThreadsListViewProps {
	currentUser: User;
	onToggleRightSidebar?: () => void;
	onOpenThread?: (message: ApiMessage) => void;
	isSidebarCollapsed: boolean;
	onToggleSidebar: () => void;
}

export function ThreadsListView({
	currentUser: _currentUser,
	onToggleRightSidebar,
	onOpenThread,
	isSidebarCollapsed,
	onToggleSidebar,
}: ThreadsListViewProps) {
	const { data: threads, isLoading } = useQuery<ApiMessage[]>({
		// Specify the type for the query data
		queryKey: ['user-threads'],
		queryFn: fetchUserThreads,
		refetchInterval: 10000,
	});

	return (
		<div className="flex-1 flex flex-col bg-[#1a1d21] overflow-hidden">
			{/* Header */}
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
						className="md:hidden p-2 -ml-2 hover:bg-gray-800 rounded transition-colors"
					>
						<Menu className="w-4 h-4 text-gray-400" />
					</button>
					<h2 className="text-white font-bold">Threads</h2>
				</div>
			</div>

			{isLoading ? (
				<div className="flex-1 flex items-center justify-center text-gray-400">Loading threads...</div>
			) : !threads || threads.length === 0 ? (
				<div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-2">
					<MessageSquare className="w-12 h-12 opacity-50" />
					<p>No threads yet</p>
					<p className="text-sm text-gray-500">Threads you participate in will appear here.</p>
				</div>
			) : (
				<div className="flex-1 overflow-y-auto p-4 space-y-4">
					{threads.map((thread) => {
						// This is a parent message.
						const channelName = thread.channel?.name || 'unknown';
						// Using fallback for avatar since sender might be partial? API should return full info though.
						const avatarUrl =
							thread.sender?.avatar ||
							`https://api.dicebear.com/7.x/avataaars/svg?seed=${thread.sender?.username || 'unknown'}`;

						return (
							<div key={thread.id} className="bg-[#222529] rounded-lg border border-gray-700 overflow-hidden">
								{/* Context Header */}
								<div className="bg-[#1a1d21] px-4 py-2 border-b border-gray-800 flex items-center justify-between">
									<span className="text-sm font-bold text-gray-300">#{channelName}</span>
									<span className="text-xs text-gray-500">{new Date(thread.updatedAt).toLocaleDateString()}</span>
								</div>

								<button
									type="button"
									className="w-full text-left p-4 hover:bg-gray-800/50 transition-colors focus:outline-none focus:bg-gray-800/50"
									onClick={() => onOpenThread?.(thread)}
									onKeyDown={(e) => {
										if (e.key === 'Enter' || e.key === ' ') {
											e.preventDefault();
											onOpenThread?.(thread);
										}
									}}
								>
									<div className="flex gap-3">
										<img src={avatarUrl} alt={thread.sender?.username} className="w-9 h-9 rounded" />
										<div className="flex-1">
											<div className="flex items-center gap-2 mb-1">
												<span className="font-bold text-white text-sm">{thread.sender?.username}</span>
												<span className="text-xs text-gray-400">
													{new Date(thread.createdAt).toLocaleTimeString([], {
														hour: '2-digit',
														minute: '2-digit',
													})}
												</span>
											</div>
											<div className="text-gray-300 text-[15px] leading-relaxed">{thread.content}</div>

											{/* Reply Teaser */}
											<div className="mt-3 flex items-center gap-2 text-blue-400 text-sm font-medium hover:underline">
												<MessageSquare className="w-4 h-4" />
												<span>{thread.threadCount || 0} replies</span>
											</div>

											{/* Render latest reply if available */}
											{thread.replies && thread.replies.length > 0 && (
												<div className="mt-3 ml-2 border-l-2 border-gray-700 pl-3 pt-1">
													<div className="flex items-center gap-2 mb-1">
														<img
															src={
																thread.replies[0].sender?.avatar ||
																`https://api.dicebear.com/7.x/avataaars/svg?seed=${thread.replies[0].sender?.username}`
															}
															className="w-5 h-5 rounded"
															alt="Replier"
														/>
														<span className="text-xs font-bold text-gray-400">
															{thread.replies[0].sender?.username}
														</span>
														<span className="text-xs text-gray-500">last reply</span>
													</div>
													<div className="text-sm text-gray-400 line-clamp-1">{thread.replies[0].content}</div>
												</div>
											)}
										</div>
									</div>
								</button>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}
