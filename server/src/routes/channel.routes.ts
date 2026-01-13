import { Router } from 'express';
import { getChannels, createChannel } from '../controllers/channel.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, getChannels);
router.post('/', authenticate, createChannel);

export default router;
