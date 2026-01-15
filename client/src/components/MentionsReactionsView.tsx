import { useQuery } from '@tanstack/react-query';
import { Menu, PanelLeftOpen } from 'lucide-react';
import { type Message as ApiMessage, fetchUserActivity, type MessageReaction, type User } from '../lib/api';

interface MentionsReactionsViewProps {
	currentUser: User;
	onToggleRightSidebar?: () => void;
	isSidebarCollapsed: boolean;
	onToggleSidebar: () => void;
}

// Helper to type guard
function isMessage(data: ApiMessage | MessageReaction): data is ApiMessage {
	return (data as ApiMessage).content !== undefined;
}

export function MentionsReactionsView({
	onToggleRightSidebar,
	isSidebarCollapsed,
	onToggleSidebar,
}: MentionsReactionsViewProps) {
	const { data: activity, isLoading } = useQuery({
		queryKey: ['user-activity'],
		queryFn: fetchUserActivity,
		// Refetch often as activity happens in real-time, but for now relies on manual refresh slightly
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
					<h2 className="text-white font-bold">Mentions & Reactions</h2>
				</div>
			</div>

			{isLoading ? (
				<div className="flex-1 flex items-center justify-center text-gray-400">Loading activity...</div>
			) : !activity || activity.length === 0 ? (
				<div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-2">
					<Menu className="w-12 h-12 opacity-50" />
					<p>No new mentions or reactions</p>
				</div>
			) : (
				<div className="flex-1 overflow-y-auto p-4 space-y-4">
					{activity.map((item) => {
						const isMention = item.type === 'mention';

						if (isMention && isMessage(item.data)) {
							const message = item.data;
							// Accessing nested props might require type casting if API types aren't fully deep
							// But our setup should cover it.
							// Assuming nested fields exist as per API response
							const channelName = message.channel?.name || 'unknown-channel';

							return (
								<div key={`mention-${item.id}`} className="bg-[#222529] rounded-lg p-3 border border-gray-700">
									<div className="flex items-center gap-2 mb-2 text-sm text-gray-400">
										<span className="text-blue-400 font-medium">@{message.sender?.username}</span>
										<span>mentioned you in</span>
										<span className="font-bold text-gray-300">#{channelName}</span>
										<span className="text-xs ml-auto">
											{new Date(item.createdAt).toLocaleDateString()}{' '}
											{new Date(item.createdAt).toLocaleTimeString([], {
												hour: '2-digit',
												minute: '2-digit',
											})}
										</span>
									</div>
									<div className="text-gray-200 bg-[#1a1d21] p-3 rounded border border-gray-800">{message.content}</div>
								</div>
							);
						}

						if (!isMention && !isMessage(item.data)) {
							// Reaction
							const reaction = item.data as MessageReaction & {
								message: ApiMessage & { channel: { name: string } };
							};
							const reactorName = reaction.user?.username || 'Someone';
							const channelName = reaction.message?.channel?.name || 'unknown';

							return (
								<div key={`reaction-${item.id}`} className="bg-[#222529] rounded-lg p-3 border border-gray-700">
									<div className="flex items-center gap-2 mb-2 text-sm text-gray-400">
										<span className="text-yellow-500 font-medium">{reactorName}</span>
										<span>reacted to your message in</span>
										<span className="font-bold text-gray-300">#{channelName}</span>
										<span className="text-xs ml-auto">
											{new Date(item.createdAt).toLocaleDateString()}{' '}
											{new Date(item.createdAt).toLocaleTimeString([], {
												hour: '2-digit',
												minute: '2-digit',
											})}
										</span>
									</div>
									<div className="flex gap-3">
										<div className="flex flex-col items-center justify-center bg-[#1a1d21] p-2 rounded border border-gray-800 min-w-[3rem]">
											<span className="text-xl">{reaction.emoji}</span>
										</div>
										<div className="flex-1 text-gray-400 text-sm line-clamp-2 italic self-center">
											"{reaction.message?.content}"
										</div>
									</div>
								</div>
							);
						}

						return null;
					})}
				</div>
			)}
		</div>
	);
}
