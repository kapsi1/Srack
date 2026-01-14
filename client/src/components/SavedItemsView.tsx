import { Bookmark, PanelLeftOpen } from 'lucide-react';
import type { Message, User } from '../App';
import { MessageList } from './MessageList';

interface SavedItemsViewProps {
	currentUser: User;
	messages: Message[];
	onAddReaction: (messageId: string, emoji: string) => void;
	onToggleSave: (messageId: string) => void;
	isSidebarCollapsed: boolean;
	onToggleSidebar: () => void;
}

export function SavedItemsView({ 
	messages, 
	onAddReaction, 
	onToggleSave,
	isSidebarCollapsed,
	onToggleSidebar,
}: SavedItemsViewProps) {
	return (
		<div className="flex-1 flex flex-col bg-[#1a1d21]">
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
                    <Bookmark className="w-5 h-5 text-gray-400" />
                    <h2 className="text-white font-bold">Saved items</h2>
				</div>
			</div>

			{/* Messages Area */}
			<div className="flex-1 flex flex-col overflow-hidden">
                {messages.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                        <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4">
                            <Bookmark className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Nothing saved yet</h3>
                        <p className="max-w-xs text-sm">
                            Save messages to easily find them later. Just hover over a message and click the bookmark icon.
                        </p>
                    </div>
                ) : (
    				<MessageList 
                        messages={messages} 
                        onAddReaction={onAddReaction} 
                        onToggleSave={onToggleSave}
                    />
                )}
			</div>
		</div>
	);
}
