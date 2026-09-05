import { Router } from 'express';
import { validateDatabaseConfiguration } from '../utils/databaseValidation.js';
import { env } from '../config/env.js';

const router = Router();

router.get('/', async (_req, res) => {
  const dbStatus = await validateDatabaseConfiguration();

  res.status(dbStatus.ok ? 200 : 503).json({
    status: dbStatus.ok ? 'ok' : 'degraded',
    service: 'hopebed-backend',
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
    database: dbStatus,
  });
});

export default router;
