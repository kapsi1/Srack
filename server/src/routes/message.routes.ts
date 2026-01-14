import { Router } from "express";
import {
	createMessage,
	getThreadMessages,
	getUserThreads,
} from "../controllers/message.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.post("/", authenticate, createMessage);
router.get("/threads", authenticate, getUserThreads);
router.get("/:messageId/thread", authenticate, getThreadMessages);

export default router;
