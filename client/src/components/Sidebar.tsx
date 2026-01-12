import { Hash, Lock, ChevronDown, Plus, MessageSquare, Bell, Bookmark, AtSign, MoreVertical } from 'lucide-react';
import type { Channel, DirectMessage } from '../App';

interface SidebarProps {
	channels: Channel[];
	directMessages: DirectMessage[];
	activeChannel: Channel;
	onChannelSelect: (channel: Channel) => void;
	activeView: 'channel' | 'dm';
	onViewChange: (view: 'channel' | 'dm') => void;
}

export function Sidebar({ channels, directMessages, activeChannel, onChannelSelect }: SidebarProps) {
	return (
		<div className="flex h-screen bg-[#19171d]">
			{/* Workspace Sidebar */}
			<div className="w-[70px] bg-[#0d0c0f] flex flex-col items-center py-2 gap-1">
				<button className="w-9 h-9 bg-white rounded-lg mb-2 flex items-center justify-center">
					<span>W</span>
				</button>
				<div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer">
					<Plus className="w-5 h-5 text-white" />
				</div>
			</div>

			{/* Main Sidebar */}
			<div className="w-[260px] flex flex-col text-white">
				{/* Workspace Header */}
				<button className="h-12 px-4 flex items-center justify-between hover:bg-white/10 transition-colors border-b border-white/10">
					<span>Workspace Name</span>
					<ChevronDown className="w-4 h-4" />
				</button>

				{/* Navigation */}
				<div className="flex-1 overflow-y-auto py-2">
					{/* Quick Access */}
					<div className="px-2 mb-4">
						<SidebarItem icon={MessageSquare} label="Threads" />
						<SidebarItem icon={AtSign} label="Mentions & reactions" />
						<SidebarItem icon={Bookmark} label="Saved items" />
						<SidebarItem icon={MoreVertical} label="More" />
					</div>

					{/* Channels */}
					<div className="mb-4">
						<button className="w-full px-2 py-1 flex items-center justify-between hover:bg-white/10 transition-colors group">
							<div className="flex items-center gap-1">
								<ChevronDown className="w-3 h-3" />
								<span className="text-sm">Channels</span>
							</div>
							<Plus className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
						</button>
						<div className="mt-1">
							{channels.map((channel) => (
								<button
									key={channel.id}
									onClick={() => onChannelSelect(channel)}
									className={`w-full px-2 py-1 flex items-center justify-between hover:bg-white/10 transition-colors group ${
										activeChannel.id === channel.id ? 'bg-[#1164a3]' : ''
									}`}
								>
									<div className="flex items-center gap-1.5">
										{channel.isPrivate ? <Lock className="w-3.5 h-3.5" /> : <Hash className="w-3.5 h-3.5" />}
										<span className="text-sm">{channel.name}</span>
									</div>
									{channel.unreadCount && (
										<div className="w-5 h-5 bg-white rounded flex items-center justify-center">
											<span className="text-xs text-[#5a2a4e]">{channel.unreadCount}</span>
										</div>
									)}
								</button>
							))}
						</div>
					</div>

					{/* Direct Messages */}
					<div>
						<button className="w-full px-2 py-1 flex items-center justify-between hover:bg-white/10 transition-colors group">
							<div className="flex items-center gap-1">
								<ChevronDown className="w-3 h-3" />
								<span className="text-sm">Direct messages</span>
							</div>
							<Plus className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
						</button>
						<div className="mt-1">
							{directMessages.map((dm) => (
								<button
									key={dm.id}
									className="w-full px-2 py-1 flex items-center justify-between hover:bg-white/10 transition-colors group"
								>
									<div className="flex items-center gap-1.5">
										<div className="relative">
											<img src={dm.userAvatar} alt={dm.userName} className="w-5 h-5 rounded" />
											{dm.isOnline && (
												<div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-[#19171d] rounded-full" />
											)}
										</div>
										<span className="text-sm">{dm.userName}</span>
									</div>
									{dm.unreadCount && (
										<div className="w-5 h-5 bg-white rounded flex items-center justify-center">
											<span className="text-xs text-[#19171d]">{dm.unreadCount}</span>
										</div>
									)}
								</button>
							))}
						</div>
					</div>
				</div>

				{/* User Profile */}
				<div className="h-12 px-2 border-t border-white/10 flex items-center justify-between">
					<div className="flex items-center gap-2">
						<div className="relative">
							<img
								src="https://api.dicebear.com/7.x/avataaars/svg?seed=Current"
								alt="You"
								className="w-7 h-7 rounded"
							/>
							<div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-[#19171d] rounded-full" />
						</div>
						<span className="text-sm">You</span>
					</div>
					<Bell className="w-4 h-4" />
				</div>
			</div>
		</div>
	);
}

function SidebarItem({ icon: Icon, label }: { icon: any; label: string }) {
	return (
		<button className="w-full px-2 py-1 flex items-center gap-1.5 hover:bg-white/10 transition-colors rounded">
			<Icon className="w-4 h-4" />
			<span className="text-sm">{label}</span>
		</button>
	);
}
