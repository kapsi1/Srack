import { Router } from "express";
import { createChannel, getChannels } from "../controllers/channel.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.get("/", authenticate, getChannels);
router.post("/", authenticate, createChannel);

export default router;
