import { X, Hash, Info, Users, Clock, Shield } from 'lucide-react';
import type { Channel, User } from '../App';

interface ChannelInfoProps {
	channel: Channel;
	currentUser: User;
	onClose: () => void;
}

export function ChannelInfo({ channel, currentUser, onClose }: ChannelInfoProps) {
	const isDM = channel.type === 'DM';
	const otherUser = isDM ? channel.members?.find(m => m.id !== currentUser.id) : null;
	const displayName = otherUser ? otherUser.username : channel.name;

	return (
		<div className="w-80 border-l border-gray-800 bg-[#1a1d21] flex flex-col h-full">
			{/* Header */}
			<div className="h-12 border-b border-gray-800 px-4 flex items-center justify-between">
				<h3 className="text-white font-bold">Details</h3>
				<button 
					type="button"
					onClick={onClose}
					className="p-1 hover:bg-gray-800 rounded transition-colors"
                >
					<X className="w-5 h-5 text-gray-400" />
				</button>
			</div>

			{/* Content */}
			<div className="flex-1 overflow-y-auto p-4 space-y-6">
				{/* Channel/User Identification */}
				<div className="text-center pb-4 border-b border-gray-800">
					<div className="flex justify-center mb-3">
						{isDM ? (
							<img 
								src={otherUser?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherUser?.username}`} 
								alt={displayName}
								className="w-20 h-20 rounded-lg"
							/>
						) : (
							<div className="w-20 h-20 bg-gray-800 rounded-lg flex items-center justify-center">
								<Hash className="w-10 h-10 text-gray-400" />
							</div>
						)}
					</div>
					<h4 className="text-white text-xl font-bold">{displayName}</h4>
					{isDM && <p className="text-gray-400 text-sm mt-1">{otherUser?.email}</p>}
				</div>

				{/* About Section */}
				{!isDM && (
					<div className="space-y-3">
						<h5 className="text-white font-semibold flex items-center gap-2">
							<Info className="w-4 h-4" />
							About
						</h5>
						<div className="bg-gray-800/50 rounded-lg p-3 space-y-3">
							<div>
								<p className="text-gray-400 text-xs uppercase font-bold">Description</p>
								<p className="text-gray-300 text-sm mt-1">
                                    {channel.description || (channel.isPrivate ? 'This is a private channel.' : 'This is a public channel anyone in the workspace can join.')}
                                </p>
							</div>
							<div>
								<p className="text-gray-400 text-xs uppercase font-bold">Created on</p>
								<p className="text-gray-300 text-sm mt-1 flex items-center gap-1.5">
									<Clock className="w-3.5 h-3.5" />
									{channel.createdAt ? new Date(channel.createdAt).toLocaleDateString() : 'Long ago'}
								</p>
							</div>
						</div>
					</div>
				)}

				{/* Members Section */}
				<div className="space-y-3">
					<h5 className="text-white font-semibold flex items-center gap-2">
						<Users className="w-4 h-4" />
						Members {channel.members ? `(${channel.members.length})` : ''}
					</h5>
					<div className="space-y-2">
						{channel.members?.map((member) => (
							<div key={member.id} className="flex items-center gap-3 p-2 hover:bg-gray-800 rounded-lg transition-colors group">
								<img 
									src={member.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.username}`} 
									alt={member.username}
									className="w-8 h-8 rounded"
								/>
								<div className="flex-1 min-w-0">
									<p className="text-sm font-medium text-gray-200 truncate group-hover:text-white">
										{member.username}
										{member.id === currentUser.id && <span className="ml-1.5 text-xs text-gray-500 font-normal">(you)</span>}
									</p>
								</div>
                                <Shield className="w-3.5 h-3.5 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
							</div>
						))}
                        {(!channel.members || channel.members.length === 0) && (
                            <p className="text-gray-500 text-sm italic">No members found</p>
                        )}
					</div>
				</div>
			</div>
		</div>
	);
}
