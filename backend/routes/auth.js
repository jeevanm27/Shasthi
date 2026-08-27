import { Router } from 'express';
import { register, login, me, googleAuth } from '../controllers/authController.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();

router.post('/register', register);
router.post('/login',    login);
router.post('/google',   googleAuth);
router.get('/me',        requireAuth, me);

export default router;
