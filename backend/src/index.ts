import cors from 'cors';
import express, { type Request, type Response, type NextFunction } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { connectDatabase } from './config/database.js';
import healthRouter from './routes/health.js';
import authRouter from './routes/auth.js';
import propertiesRouter from './routes/properties.js';
import bookingsRouter from './routes/bookings.js';
import hostsRouter from './routes/hosts.js';
import paymentsRouter from './routes/payments.js';
import adminRouter from './routes/admin.js';
import verificationRouter from './routes/verification.js';

export const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
  })
);
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'Hopebed backend is running',
    status: 'ok',
  });
});

app.use('/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/properties', propertiesRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/hosts', hostsRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/verification', verificationRouter);

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    message: 'Internal server error',
    error: env.NODE_ENV === 'production' ? undefined : err.message,
  });
});

const startServer = async (): Promise<void> => {
  try {
    await connectDatabase();

    app.listen(env.PORT, () => {
      console.log(`Backend server running on http://localhost:${env.PORT}`);
    });
  } catch (error) {
    console.error('Failed to start backend server:', error);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== 'test') {
  startServer();
}
