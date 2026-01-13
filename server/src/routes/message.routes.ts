import { Router } from "express";
import {
	createMessage,
} from "../controllers/message.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.post("/", authenticate, createMessage);

export default router;
