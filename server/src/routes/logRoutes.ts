import express from 'express';
import { createLog } from '../controllers/logController';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

router.post('/', authenticate, createLog);

export default router;
