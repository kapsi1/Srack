import type { Server, Socket } from "socket.io";
import prisma from "./lib/prisma";

// Store io instance locally
let ioInstance: Server;

// Map user IDs to socket IDs for call routing
const userSocketMap = new Map<string, string>();

export const setupSocket = (io: Server) => {
	ioInstance = io;
	io.on("connection", (socket: Socket) => {
		console.log("User connected:", socket.id);

		// Register user for call routing
		socket.on("register-user", (data: { userId: string }) => {
			userSocketMap.set(data.userId, socket.id);
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
					console.log(`Call failed: User ${data.to} is offline`);
				}
			},
		);

		// Handle call answer (callee responds with answer)
		socket.on(
			"call-answer",
			(data: { to: string; answer: RTCSessionDescriptionInit }) => {
				const targetSocketId = userSocketMap.get(data.to);
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
				}
			},
		);

		// Handle call rejection
		socket.on("call-rejected", (data: { to: string; reason?: string }) => {
			const targetSocketId = userSocketMap.get(data.to);
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
			if (targetSocketId) {
				io.to(targetSocketId).emit("call-ended");
				console.log(`Call ended, notifying ${data.to}`);
			}
		});

		// ==================== End WebRTC Signaling Events ====================

		socket.on("disconnect", () => {
			// Remove user from socket map on disconnect
			for (const [userId, socketId] of userSocketMap.entries()) {
				if (socketId === socket.id) {
					userSocketMap.delete(userId);
					console.log(`User ${userId} unregistered on disconnect`);
					break;
				}
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
