import http from "node:http";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { Server } from "socket.io";
import prisma from "./lib/prisma";
import authRoutes from "./routes/auth.routes";
import channelRoutes from "./routes/channel.routes";
import messageRoutes from "./routes/message.routes";
import userRoutes from "./routes/user.routes";

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
	cors: {
		origin: "*", // In production, replace with your client URL
		methods: ["GET", "POST"],
	},
});

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/channels", channelRoutes);
app.use("/api/messages", messageRoutes);

app.get("/health", async (_req: express.Request, res: express.Response) => {
	try {
		await prisma.$queryRaw`SELECT 1`;
		res.json({ status: "ok", database: "connected" });
	} catch (error) {
		res.status(500).json({ status: "error", database: "disconnected", error });
	}
});

io.on("connection", (socket) => {
	console.log("A user connected:", socket.id);

	socket.on("disconnect", () => {
		console.log("User disconnected:", socket.id);
	});
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});
