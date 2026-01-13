import { Router } from 'express';
import { getChannelMessages, createMessage } from '../controllers/message.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/:channelId/messages', authenticate, getChannelMessages);
router.post('/', authenticate, createMessage);

export default router;
