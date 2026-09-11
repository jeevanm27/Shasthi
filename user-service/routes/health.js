import { Router } from 'express';

const router = Router();

// GET /health  — liveness probe for Docker healthcheck and NGINX
router.get('/', (_req, res) => {
  res.json({ status: 'UP', service: 'user-service', ts: new Date().toISOString() });
});

export default router;
