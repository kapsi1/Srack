import { Router } from "express";
import { createChannel, getChannels } from "../controllers/channel.controller";
import { getChannelMessages } from "../controllers/message.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.get("/", authenticate, getChannels);
router.post("/", authenticate, createChannel);
router.get("/:channelId/messages", authenticate, getChannelMessages);

export default router;
