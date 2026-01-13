import { useEffect, useState } from "react";
import { AuthPage } from "./components/AuthPage";
import { ChatArea } from "./components/ChatArea";
import { Sidebar } from "./components/Sidebar";
import { useSocket } from "./context/SocketContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { 
    createDM, 
    fetchChannels, 
    fetchCurrentUser, 
    fetchMessages, 
    fetchUsers, 
    sendMessage,
    type Channel as ApiChannel,
    type Message as ApiMessage,
    type User as ApiUser 
} from "./lib/api";

export type User = ApiUser;

export interface DirectMessage {
	id: string;
	userName: string;
	userAvatar: string;
	isOnline: boolean;
	unreadCount?: number;
}

export interface Message {
	id: string;
	userId: string;
	userName: string;
	userAvatar: string;
	content: string;
	timestamp: Date;
	reactions?: { emoji: string; count: number; users: string[] }[];
	threadCount?: number;
}

export interface Channel {
	id: string;
	name: string;
	isPrivate?: boolean;
    type?: "PUBLIC" | "PRIVATE" | "DM";
	unreadCount?: number;
    members?: User[];
}



export interface DirectMessage {
	id: string;
	userName: string;
	userAvatar: string;
	isOnline: boolean;
	unreadCount?: number;
}

export default function App() {
	const [currentUser, setCurrentUser] = useState<User | null>(null);
	const [token, setToken] = useState<string | null>(
		localStorage.getItem("token"),
	);

	// State for UI
	const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
	const [activeView, setActiveView] = useState<"channel" | "dm">("channel");
	const [messages, setMessages] = useState<Message[]>([]);
	const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

	// Hooks must be unconditional
	const { socket } = useSocket();
    const queryClient = useQueryClient();

	// Data Fetching
	const { data: channelsData } = useQuery({
		queryKey: ["channels"],
		queryFn: fetchChannels,
		enabled: !!token,
	});

	const { data: usersData } = useQuery({
		queryKey: ["users"],
		queryFn: fetchUsers,
		enabled: !!token,
	});

	const { data: messagesData } = useQuery({
		queryKey: ["messages", activeChannel?.id],
		queryFn: () =>
			activeChannel ? fetchMessages(activeChannel.id) : Promise.resolve([]),
		enabled: !!token && !!activeChannel,
	});

    // Mutations
    const dmMutation = useMutation({
        mutationFn: createDM,
        onSuccess: (newChannel: ApiChannel) => {
            // Check if we need to add type info if missing from backend response (it should be there)
            const channel: Channel = {
                id: newChannel.id,
                name: newChannel.name,
                isPrivate: newChannel.isPrivate,
                type: newChannel.type,
                members: newChannel.members,
                unreadCount: 0
            };
            
            // Optimistically update channels list if not there
            queryClient.setQueryData(["channels"], (old: ApiChannel[] | undefined) => {
                if (!old) return [newChannel];
                if (old.find(c => c.id === newChannel.id)) return old;
                return [...old, newChannel];
            });

            setActiveChannel(channel);
            setActiveView("channel"); // Or "dm" if we want to treat them distinct in UI
        }
    });

    const sendMessageMutation = useMutation({
        mutationFn: ({ channelId, content, tempId }: { channelId: string, content: string, tempId: string }) => 
            sendMessage(channelId, content, tempId),
        onMutate: async ({ channelId, content, tempId }) => {
            await queryClient.cancelQueries({ queryKey: ["messages", channelId] });

            const previousMessages = queryClient.getQueryData(["messages", channelId]);

            // Optimistic update for React Query cache (ApiMessage structure)
            if (currentUser) {
                 const optimisticMessage: ApiMessage = {
                    id: tempId,
                    content,
                    senderId: currentUser.id,
                    channelId,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    sender: currentUser,
                    reactions: []
                };

                queryClient.setQueryData(["messages", channelId], (old: ApiMessage[] | undefined) => {
                    return [...(old || []), optimisticMessage];
                });

                 // Also update local state immediately for instant feedback
                setMessages((prev) => [
                    ...prev,
                    {
                        id: tempId,
                        userId: currentUser.id,
                        userName: currentUser.username,
                        userAvatar: currentUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.username}`,
                        content: content,
                        timestamp: new Date(),
                        reactions: [],
                        threadCount: 0
                    }
                ]);
            }

            return { previousMessages };
        },
        onError: (_err, { channelId }, context) => {
            if (context?.previousMessages) {
                queryClient.setQueryData(["messages", channelId], context.previousMessages);
            }
        },
        // Remove empty onSuccess as we handle updates via socket/optimistic
    });

	useEffect(() => {
		const savedUser = localStorage.getItem("user");
        const savedToken = localStorage.getItem("token");
		if (savedToken) {
            // Verify with backend
             fetchCurrentUser().then(user => {
                 setCurrentUser(user);
                 setToken(savedToken);
             }).catch(() => {
                 handleLogout();
             });
		} else if (savedUser && token) {
			setCurrentUser(JSON.parse(savedUser));
		}
	}, []); // Run once on mount

    useEffect(() => {
        if(savedTokenRef.current !== token) {
           savedTokenRef.current = token;
        }
    }, [token]);
    const savedTokenRef = { current: token }; // Mock ref to avoid errors in this snippet, actual impl below

	// Set initial active channel

	// Set initial active channel
	useEffect(() => {
		if (channelsData && channelsData.length > 0 && !activeChannel) {
			setActiveChannel(channelsData[0]);
		}
	}, [channelsData, activeChannel]);

	// Clear unreads when changing active channel
	useEffect(() => {
		if (activeChannel) {
			setUnreadCounts((prev) => ({ ...prev, [activeChannel.id]: 0 }));
		}
	}, [activeChannel]);

	// Sync messages when channel changes or data fetches
	useEffect(() => {
		if (messagesData) {
			// Mapping with simple type assertions to fix 'any' warnings
			const mappedMessages: Message[] = messagesData.map((msg: any) => ({
				id: msg.id,
				userId: msg.senderId || msg.sender?.id,
				userName: msg.sender?.username || "Unknown",
				userAvatar:
					msg.sender?.avatar ||
					`https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.sender?.username || "Unknown"}`,
				content: msg.content,
				timestamp: new Date(msg.createdAt),
				reactions:
					msg.reactions?.map((r: any) => ({
						emoji: r.emoji,
						count: 1,
						users: [r.user?.username].filter(Boolean),
					})) || [],
			}));

			// Aggregation logic
			const aggregatedMessages = mappedMessages.map((msg) => {
				const rawReactions =
					messagesData.find((m: any) => m.id === msg.id)?.reactions || [];
				const agg: Record<string, { count: number; users: string[] }> = {};

				rawReactions.forEach((r: any) => {
					const reactionEmoji = r.emoji as string;
					if (!agg[reactionEmoji]) {
						agg[reactionEmoji] = { count: 0, users: [] };
					}
					agg[reactionEmoji].count++;
					const username = r.user?.username;
					if (username) agg[reactionEmoji].users.push(username);
				});

				return {
					...msg,
					reactions: Object.entries(agg).map(([emoji, data]) => ({
						emoji,
						count: data.count,
						users: data.users,
					})),
				};
			});

			setMessages(aggregatedMessages);
		}
	}, [messagesData]);

	// Derived state for props
	const channels: Channel[] =
		channelsData
            ?.filter((c: any) => c.type !== "DM")
            .map((c: any) => ({
    			...c,
	    		unreadCount: unreadCounts[c.id] || 0,
		    })) || [];

	const directMessages: DirectMessage[] =
		usersData?.map((u: User) => {
            const dmChannel = channelsData?.find(
                (c: any) => c.type === "DM" && c.members?.some((m: any) => m.id === u.id)
            );
            return {
    			id: u.id,
	    		userName: u.username,
		    	userAvatar:
			    	u.avatar ||
				    `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`,
    			isOnline: false, // No online status API yet
	    		unreadCount: dmChannel ? (unreadCounts[dmChannel.id] || 0) : 0,
		    };
        }) || [];

	useEffect(() => {
		if (!socket || !currentUser || !activeChannel) return; // Wait for login and channel

		// Current logic: joins ONLY active channel. This means we WON'T get unread counts for other channels unless we are in them.
		// For public channels, we join them all to get unread counts.

		channelsData?.forEach((c: Channel) => {
			if (c.id !== activeChannel.id) {
				socket.emit("join_channel", c.id);
			}
		});
		socket.emit("join_channel", activeChannel.id);

		const handleNewMessage = (message: any) => {
			const newMessage: Message = {
				id: message.id,
				userId: message.sender?.id || message.senderId,
				userName: message.sender?.username || "Unknown",
				userAvatar:
					message.sender?.avatar ||
					`https://api.dicebear.com/7.x/avataaars/svg?seed=${message.sender?.username || "Unknown"}`,
				content: message.content,
				timestamp: new Date(message.createdAt),
				reactions: [],
				threadCount: 0,
			};

			if (message.channelId === activeChannel.id) {
                setMessages((prev) => {
                    const tempId = message.tempId;
                    // If we have an optimistic message with this tempId, replace it
                    if (tempId && prev.some(m => m.id === tempId)) {
                        return prev.map(m => m.id === tempId ? newMessage : m);
                    }
                    // If we already have this real ID (rare race cond), don't append
                    if (prev.some(m => m.id === message.id)) {
                        return prev;
                    }
                    return [...prev, newMessage];
                });
			} else {
				setUnreadCounts((prev) => ({
					...prev,
					[message.channelId]: (prev[message.channelId] || 0) + 1,
				}));
			}
		};

		const handleReactionAdded = (reaction: any) => {
			if (
				reaction.message?.channelId &&
				reaction.message.channelId !== activeChannel.id
			)
				return;

			setMessages((prevMessages) =>
				prevMessages.map((msg) => {
					if (msg.id === reaction.messageId) {
						const reactions = msg.reactions || [];
						const existingReactionIndex = reactions.findIndex(
							(r) => r.emoji === reaction.emoji,
						);

						const reactingUsername = reaction.user?.username || "Unknown";

						if (existingReactionIndex > -1) {
							const updatedReactions = [...reactions];
							const existing = updatedReactions[existingReactionIndex];
							if (!existing.users.includes(reactingUsername)) {
								updatedReactions[existingReactionIndex] = {
									...existing,
									count: existing.count + 1,
									users: [...existing.users, reactingUsername],
								};
							}
							return { ...msg, reactions: updatedReactions };
						} else {
							return {
								...msg,
								reactions: [
									...reactions,
									{
										emoji: reaction.emoji,
										count: 1,
										users: [reactingUsername],
									},
								],
							};
						}
					}
					return msg;
				}),
			);
		};

		socket.on("new_message", handleNewMessage);
		socket.on("reaction_added", handleReactionAdded);

		return () => {
			socket.off("new_message", handleNewMessage);
			socket.off("reaction_added", handleReactionAdded);
		};
	}, [socket, activeChannel, currentUser, channelsData]); // Added channelsData dependency logic implicitly

	// We need a separate effect to join all channels once
	useEffect(() => {
		if (socket && channelsData) {
			channelsData.forEach((c) => socket.emit("join_channel", c.id));
		}
	}, [socket, channelsData]);

	const handleLogin = (user: User, token: string) => {
		setCurrentUser(user);
		setToken(token);
		localStorage.setItem("token", token);
		localStorage.setItem("user", JSON.stringify(user));
	};

	const handleLogout = () => {
		setCurrentUser(null);
		setToken(null);
		localStorage.removeItem("token");
		localStorage.removeItem("user");
	};

	if (!currentUser) {
		return <AuthPage onLogin={handleLogin} />;
	}

	const handleSendMessage = (content: string) => {
		if (!currentUser || !activeChannel) return;

        const tempId = `temp-${Date.now()}`;
        // Use mutation instead of socket directly for optimistic updates
        sendMessageMutation.mutate({ channelId: activeChannel.id, content, tempId });
	};

	const handleAddReaction = (messageId: string, emoji: string) => {
		if (!currentUser || !socket || !activeChannel) return;

		socket.emit("add_reaction", {
			messageId,
			emoji,
			userId: currentUser.id,
			channelId: activeChannel.id,
		});
	};

    const handleDMSelect = (targetUserId: string) => {
        dmMutation.mutate(targetUserId);
    };

	return (
		<div className="flex h-screen overflow-hidden">
			<Sidebar
				channels={channels}
				directMessages={directMessages}
				activeChannel={activeChannel || channels[0]} // Fallback or assume conditional rendering for chat
				onChannelSelect={setActiveChannel}
				activeView={activeView}
				onViewChange={setActiveView}
				currentUser={currentUser}
				onLogout={handleLogout}
                onDMSelect={handleDMSelect}
			/>
			{activeChannel ? (
				<ChatArea
					channel={activeChannel}
					currentUser={currentUser}
					messages={messages}
					onSendMessage={handleSendMessage}
					onAddReaction={handleAddReaction}
				/>
			) : (
				<div className="flex-1 flex items-center justify-center bg-gray-900 text-white">
					<p>Select a channel or create one to start</p>
				</div>
			)}
		</div>
	);
}
