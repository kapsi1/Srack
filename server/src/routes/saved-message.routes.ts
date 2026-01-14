import { Router } from "express";
import {
	getSavedMessages,
	toggleSavedMessage,
} from "../controllers/saved-message.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.post("/toggle", authenticate, toggleSavedMessage);
router.get("/", authenticate, getSavedMessages);

export default router;
