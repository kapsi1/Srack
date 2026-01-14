import http from "node:http";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { Server } from "socket.io";
import prisma from "./lib/prisma";
import authRoutes from "./routes/auth.routes";
import channelRoutes from "./routes/channel.routes";
import messageRoutes from "./routes/message.routes";
import savedMessageRoutes from "./routes/saved-message.routes";
import userRoutes from "./routes/user.routes";
import activityRoutes from "./routes/activity.routes";
import { setupSocket } from "./socket";

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
	cors: {
		origin: process.env.CORS_ORIGIN || "*",
		methods: ["GET", "POST"],
	},
});

app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/channels", channelRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/saved-messages", savedMessageRoutes);
app.use("/api/activity", activityRoutes);

app.get("/health", async (_req: express.Request, res: express.Response) => {
	try {
		await prisma.$queryRaw`SELECT 1`;
		res.json({ status: "ok", database: "connected" });
	} catch (error) {
		res.status(500).json({ status: "error", database: "disconnected", error });
	}
});

setupSocket(io);

export { app, server };
