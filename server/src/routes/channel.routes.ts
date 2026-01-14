import { Router } from "express";
import {
	createChannel,
	createDM,
	getChannels,
} from "../controllers/channel.controller";
import { getChannelMessages } from "../controllers/message.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.get("/", authenticate, getChannels);
router.post("/", authenticate, createChannel);
router.post("/dm", authenticate, createDM);
router.get("/:channelId/messages", authenticate, getChannelMessages);

export default router;
