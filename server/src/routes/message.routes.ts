import { Router } from 'express';
import { createMessage, deleteMessage, getThreadMessages, getUserThreads } from '../controllers/message.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/', authenticate, createMessage);
router.get('/threads', authenticate, getUserThreads);
router.get('/:messageId/thread', authenticate, getThreadMessages);
router.delete('/:messageId', authenticate, deleteMessage);

export default router;
