import type { Server, Socket } from "socket.io";
import prisma from "./lib/prisma";

// Store io instance locally
let ioInstance: Server;

export const setupSocket = (io: Server) => {
	ioInstance = io;
	io.on("connection", (socket: Socket) => {
		console.log("User connected:", socket.id);

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

		socket.on("disconnect", () => {
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
