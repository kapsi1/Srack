import type { Server, Socket } from "socket.io";
import prisma from "./lib/prisma";

// Store io instance locally
let ioInstance: Server;

// Map socket IDs to user IDs for reverse lookup
const socketUserMap = new Map<string, string>();

interface CallSession {
	initiatorId: string;
	recipientId: string;
	channelId: string;
	startTime?: Date;
	status: 'ringing' | 'active' | 'ended' | 'rejected';
	callType: 'audio' | 'video';
}

const activeCalls = new Map<string, CallSession>();

export const setupSocket = (io: Server) => {
	ioInstance = io;
	io.on("connection", (socket: Socket) => {
		console.log("User connected:", socket.id);

		// Register user for call routing
		socket.on("register-user", (data: { userId: string }) => {
			userSocketMap.set(data.userId, socket.id);
			socketUserMap.set(socket.id, data.userId);
			console.log(`User ${data.userId} registered with socket ${socket.id}`);
		});

		socket.on("join_channel", (channelId: string) => {
			socket.join(channelId);
			console.log(`User ${socket.id} joined channel ${channelId}`);
		});

		socket.on("leave_channel", (channelId: string) => {
			socket.leave(channelId);
			console.log(`User ${socket.id} left channel ${channelId}`);
		});

		// Keeping these for backward compatibility or if we decide to use sockets for sending later
		// The controller will also use broadcastMessage
		socket.on(
			"send_message",
			async (data: {
				content: string;
				channelId: string;
				senderId: string;
			}) => {
				try {
					const { content, channelId, senderId } = data;

					const message = await prisma.message.create({
						data: {
							content,
							channelId,
							senderId,
							type: "TEXT",
						},
						include: {
							sender: {
								select: {
									id: true,
									username: true,
									avatar: true,
								},
							},
							reactions: true,
						},
					});

					io.to(channelId).emit("new_message", message);
				} catch (error) {
					console.error("Error sending message:", error);
					socket.emit("error", { message: "Failed to send message" });
				}
			},
		);

		socket.on(
			"add_reaction",
			async (data: {
				messageId: string;
				emoji: string;
				userId: string;
				channelId: string;
			}) => {
				try {
					const { messageId, emoji, userId, channelId } = data;

					const reaction = await prisma.reaction.create({
						data: {
							messageId,
							userId,
							emoji,
						},
						include: {
							user: {
								select: {
									id: true,
									username: true,
								},
							},
						},
					});

					io.to(channelId).emit("reaction_added", reaction);
				} catch (error) {
					console.error("Error adding reaction:", error);
				}
			},
		);

		// ==================== WebRTC Signaling Events ====================
		
		// Handle call request (caller sends offer to callee)
		socket.on(
			"call-request",
			(data: {
				to: string;
				from: { id: string; username: string; avatar?: string };
				channelId: string;
				callType: "audio" | "video";
				offer: RTCSessionDescriptionInit;
			}) => {
				const targetSocketId = userSocketMap.get(data.to);
				
				// Initialize call session
				const session: CallSession = {
					initiatorId: data.from.id,
					recipientId: data.to,
					channelId: data.channelId,
					status: 'ringing',
					callType: data.callType
				};
				activeCalls.set(data.from.id, session);
				activeCalls.set(data.to, session);

				if (targetSocketId) {
					io.to(targetSocketId).emit("call-request", {
						from: data.from,
						channelId: data.channelId,
						callType: data.callType,
						offer: data.offer,
					});
					console.log(`Call request from ${data.from.id} to ${data.to}`);
				} else {
					// Target user not online
					socket.emit("call-rejected", { reason: "offline" });
					
					// Log failed call
					recordCallMessage(session, 'offline');
					
					// Cleanup
					activeCalls.delete(data.from.id);
					activeCalls.delete(data.to);
					
					console.log(`Call failed: User ${data.to} is offline`);
				}
			},
		);

		// Handle call answer (callee responds with answer)
		socket.on(
			"call-answer",
			(data: { to: string; answer: RTCSessionDescriptionInit }) => {
				const targetSocketId = userSocketMap.get(data.to);
				
				// Update session status
				const senderId = socketUserMap.get(socket.id);
				if (senderId) {
					const session = activeCalls.get(senderId);
					if (session) {
						session.status = 'active';
						session.startTime = new Date();
					}
				}

				if (targetSocketId) {
					io.to(targetSocketId).emit("call-answer", {
						answer: data.answer,
					});
					console.log(`Call answer sent to ${data.to}`);
				}
			},
		);

		// Handle ICE candidate exchange
		socket.on(
			"ice-candidate",
			(data: { to: string; candidate: RTCIceCandidateInit }) => {
				const targetSocketId = userSocketMap.get(data.to);
				if (targetSocketId) {
					io.to(targetSocketId).emit("ice-candidate", {
						candidate: data.candidate,
					});
					// console.log(`ICE candidate forwarded to ${data.to}`);
				} else {
					// console.log(`ICE candidate failed: User ${data.to} not found in socket map`);
				}
			},
		);

		// Handle call rejection
		socket.on("call-rejected", (data: { to: string; reason?: string }) => {
			const targetSocketId = userSocketMap.get(data.to);
			
			// Handle session
			const senderId = socketUserMap.get(socket.id);
			if (senderId) {
				const session = activeCalls.get(senderId);
				if (session) {
					recordCallMessage(session, data.reason || 'declined');
					activeCalls.delete(session.initiatorId);
					activeCalls.delete(session.recipientId);
				}
			}

			if (targetSocketId) {
				io.to(targetSocketId).emit("call-rejected", {
					reason: data.reason || "declined",
				});
				console.log(`Call rejected by user, notifying ${data.to}`);
			}
		});

		// Handle call ended
		socket.on("call-ended", (data: { to: string }) => {
			const targetSocketId = userSocketMap.get(data.to);
			
			// Handle session
			const senderId = socketUserMap.get(socket.id);
			if (senderId) {
				const session = activeCalls.get(senderId);
				if (session) {
					recordCallMessage(session, 'ended');
					activeCalls.delete(session.initiatorId);
					activeCalls.delete(session.recipientId);
				}
			}
			
			if (targetSocketId) {
				io.to(targetSocketId).emit("call-ended");
				console.log(`Call ended, notifying ${data.to}`);
			}
		});

		// ==================== End WebRTC Signaling Events ====================

		socket.on("disconnect", () => {
			// Remove user from socket map on disconnect
			const userId = socketUserMap.get(socket.id);
			if (userId) {
				userSocketMap.delete(userId);
				socketUserMap.delete(socket.id);
				
				// If user was in a pending/active call, clean it up?
				// Maybe treat disconnect as call end/failure
				const session = activeCalls.get(userId);
				if (session) {
					// Notify other party
					const otherUserId = session.initiatorId === userId ? session.recipientId : session.initiatorId;
					const otherSocketId = userSocketMap.get(otherUserId);
					if (otherSocketId) {
						io.to(otherSocketId).emit("call-ended");
					}
					
					recordCallMessage(session, 'disconnected');
					activeCalls.delete(session.initiatorId);
					activeCalls.delete(session.recipientId);
				}
				
				console.log(`User ${userId} unregistered on disconnect`);
			}
			console.log("User disconnected:", socket.id);
		});
	});
};


export const broadcastMessage = (channelId: string, message: unknown) => {
	if (ioInstance) {
		ioInstance.to(channelId).emit("new_message", message);
	}
};

export const broadcastMessageDeleted = (channelId: string, messageId: string) => {
	if (ioInstance) {
		ioInstance.to(channelId).emit("message_deleted", { messageId, channelId });
	}
};

async function recordCallMessage(session: CallSession, reason: string) {
	try {
		const endTime = new Date();
		const duration = session.startTime ? Math.round((endTime.getTime() - session.startTime.getTime()) / 1000) : 0;
		
		let content = "Call ended";
		if (reason === 'offline') content = "Call failed: User offline";
		if (reason === 'busy') content = "Call failed: User busy";
		if (reason === 'declined') content = "Call declined";
		if (reason === 'disconnected') content = "Call disconnected";
		
		const metadata = {
			type: session.callType,
			startedAt: session.startTime?.toISOString(),
			endedAt: endTime.toISOString(),
			duration,
			status: reason === 'ended' ? 'completed' : 'failed',
			reason
		};

		const message = await prisma.message.create({
			data: {
				content,
				channelId: session.channelId,
				senderId: session.initiatorId, 
				type: "CALL", // Make sure this matches the enum
				metadata
			},
			include: {
				sender: {
					select: {
						id: true,
						username: true,
						avatar: true,
					},
				},
				reactions: true,
			},
		});

		broadcastMessage(session.channelId, message);
	} catch (error) {
		console.error("Error recording call message:", error);
	}
}



