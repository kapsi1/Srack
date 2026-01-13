import { Server, Socket } from "socket.io";
import prisma from "./lib/prisma";

export const setupSocket = (io: Server) => {
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

    socket.on("send_message", async (data: { content: string; channelId: string; senderId: string }) => {
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
              }
            },
            reactions: true
          }
        });

        // Broadcast to everyone in the channel (including sender)
        io.to(channelId).emit("new_message", message);
      } catch (error) {
        console.error("Error sending message:", error);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    socket.on("add_reaction", async (data: { messageId: string; emoji: string; userId: string; channelId: string }) => {
      try {
        const { messageId, emoji, userId, channelId } = data;

        // Check if reaction exists to toggle or valid constraint? 
        // For now, let's just add it. If constraint fails (unique), catch error.
        // Actually, UI usually toggles. Let's assume add for now as per "Reaction Updated".
        // Or better, let's implement toggle logic since that's standard.
        // But the requirement says "Reaction Updated", let's just do add/toggle.
        
        // Simple create first:
        const reaction = await prisma.reaction.create({
            data: {
                messageId,
                userId,
                emoji
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true
                    }
                }
            }
        });
        
        // We probably need to send back the full message or just the reaction update.
        // A "reaction_added" event seems appropriate.
        io.to(channelId).emit("reaction_added", reaction);

      } catch (error) {
        // If it's a unique constraint violation, maybe they want to remove it?
        // Let's keep it simple: just log error for now.
        console.error("Error adding reaction:", error);
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
};
