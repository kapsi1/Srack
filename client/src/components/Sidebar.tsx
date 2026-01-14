import {
	AtSign,
	Bookmark,
	ChevronDown,
	Hash,
	Lock,
	LogOut,
	type LucideIcon,
	MessageSquare,
	Plus,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import type { Channel, DirectMessage, User } from "../App";

interface SidebarProps {
	channels: Channel[];
	directMessages: DirectMessage[];
	activeChannel: Channel;
	currentUser: User;
	onLogout: () => void;
	onAddChannel: () => void;
}

export function Sidebar({
	channels,
	directMessages,
	activeChannel,
	currentUser,
	onLogout,
	onAddChannel,
}: SidebarProps) {
    const location = useLocation();
	const handleLogout = () => {
		onLogout();
	};
	return (
		<div className="flex h-screen bg-[#19171d]">
			{/* Workspace Sidebar - hide for now, don't delete */}
			{/* <div className="w-[70px] bg-[#0d0c0f] flex flex-col items-center py-2 gap-1">
				<button
					type="button"
					className="w-9 h-9 bg-white rounded-lg mb-2 flex items-center justify-center"
				>
					<span>W</span>
				</button>
				<div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer">
					<Plus className="w-5 h-5 text-white" />
				</div>
			</div> */}

			{/* Main Sidebar */}
			<div className="w-[260px] flex flex-col text-white">
				{/* Workspace Header */}
				<button
					type="button"
					className="h-12 px-4 flex items-center justify-between hover:bg-white/10 transition-colors border-b border-white/10"
				>
					<span>Workspace Name</span>
					<ChevronDown className="w-4 h-4" />
				</button>

				{/* Navigation */}
				<div className="flex-1 overflow-y-auto py-2">
					{/* Quick Access */}
					<div className="px-2 mb-4">
						<SidebarItem 
                            icon={MessageSquare} 
                            label="Threads" 
                            to="/threads" 
                            active={location.pathname === '/threads'} 
                        />
						<SidebarItem 
                            icon={AtSign} 
                            label="Mentions & reactions" 
                            to="/mentions-reactions" 
                            active={location.pathname === '/mentions-reactions'} 
                        />
						<SidebarItem icon={Bookmark} label="Saved items" to="/saved-items" active={location.pathname === '/saved-items'} />
						{/* <SidebarItem icon={MoreVertical} label="More" /> */}
					</div>

					{/* Channels */}
					<div className="mb-4">
						<div className="px-2 py-1 flex items-center justify-between group">
							<div className="flex items-center gap-1 cursor-pointer">
								<ChevronDown className="w-3 h-3" />
								<span className="text-sm">Channels</span>
							</div>
							<button
								type="button"
								onClick={(e) => {
									e.stopPropagation();
									onAddChannel();
								}}
								className="p-0.5 hover:bg-white/10 rounded transition-all opacity-0 group-hover:opacity-100"
								title="Add Channel"
							>
								<Plus className="w-4 h-4" />
							</button>
						</div>
						<div className="mt-1">
							{channels.map((channel: Channel) => (
								<Link
									key={channel.id}
                                    to={`/channel/${channel.name}`}
									className={`w-full px-2 py-1 flex items-center justify-between hover:bg-white/10 transition-colors group ${
										activeChannel.id === channel.id ? "bg-[#1164a3]" : ""
									}`}
								>
									<div className="flex items-center gap-1.5">
										{channel.isPrivate ? (
											<Lock className="w-3.5 h-3.5" />
										) : (
											<Hash className="w-3.5 h-3.5" />
										)}
										<span className="text-sm">{channel.name}</span>
									</div>
									{(channel.unreadCount || 0) > 0 && (
										<div className="w-5 h-5 bg-white rounded flex items-center justify-center">
											<span className="text-xs text-[#5a2a4e]">
												{channel.unreadCount}
											</span>
										</div>
									)}
								</Link>
							))}
						</div>
					</div>

					{/* Direct Messages */}
					<div>
						<button
							type="button"
							className="w-full px-2 py-1 flex items-center justify-between hover:bg-white/10 transition-colors group"
						>
							<div className="flex items-center gap-1">
								<ChevronDown className="w-3 h-3" />
								<span className="text-sm">Direct messages</span>
							</div>
							<Plus className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
						</button>
						<div className="mt-1">
							{directMessages.map((dm: DirectMessage) => {
                                const isActive = activeChannel?.type === "DM" && activeChannel.members?.some((m: User) => m.id === dm.id);
                                return (
                                    <Link
                                        key={dm.id}
                                        to={`/user/${dm.userName}`}
                                        className={`w-full px-2 py-1 flex items-center justify-between hover:bg-white/10 transition-colors group ${
                                            isActive ? "bg-[#1164a3]" : ""
                                        }`}
                                    >
                                        <div className="flex items-center gap-1.5">
                                            <div className="relative">
                                                <img
                                                    src={dm.userAvatar}
                                                    alt={dm.userName}
                                                    className="w-5 h-5 rounded"
                                                />
                                                {dm.isOnline && (
                                                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-[#19171d] rounded-full" />
                                                )}
                                            </div>
                                            <span className="text-sm">{dm.userName}</span>
                                        </div>
                                        {(dm.unreadCount || 0) > 0 && (
                                            <div className="w-5 h-5 bg-white rounded flex items-center justify-center">
                                                <span className="text-xs text-[#19171d]">
                                                    {dm.unreadCount}
                                                </span>
                                            </div>
                                        )}
                                    </Link>
                                );
                            })}
						</div>
					</div>
				</div>

				{/* User Profile */}
				<div className="h-12 px-2 border-t border-white/10 flex items-center justify-between">
					<div className="flex items-center gap-2">
						<div className="relative">
							<img
								src={
									currentUser.avatar ||
									`https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.username}`
								}
								alt={currentUser.username}
								className="w-7 h-7 rounded"
							/>
							<div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-[#19171d] rounded-full" />
						</div>
						<span className="text-sm">{currentUser.username}</span>
					</div>
					<div className="p-2 cursor-pointer hover:bg-gray-800 transition-colors rounded" title="Logout">
						<LogOut className="w-4 h-4" onClick={handleLogout} />
					</div>
				</div>
			</div>
		</div>
	);
}

function SidebarItem({
	icon: Icon,
	label,
    to,
    active
}: {
	icon: LucideIcon;
	label: string;
    to?: string;
    active?: boolean;
}) {
    const content = (
        <>
            <Icon className="w-4 h-4" />
            <span className="text-sm">{label}</span>
        </>
    );

    if (to) {
        return (
            <Link
                to={to}
                className={`w-full px-2 py-1 flex items-center gap-1.5 hover:bg-white/10 transition-colors rounded ${active ? 'bg-[#1164a3]' : ''}`}
            >
                {content}
            </Link>
        )
    }

	return (
		<button
			type="button"
			className="w-full px-2 py-1 flex items-center gap-1.5 hover:bg-white/10 transition-colors rounded"
		>
			{content}
		</button>
	);
}
