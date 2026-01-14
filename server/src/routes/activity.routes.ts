
import { Router } from "express";
import { getUserActivity } from "../controllers/activity.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.get("/", authenticate, getUserActivity);

export default router;
