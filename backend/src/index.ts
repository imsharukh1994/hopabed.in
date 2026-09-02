import cors from 'cors';
import express, { type Request, type Response, type NextFunction } from 'express';
import { env } from './config/env.js';
import { connectDatabase } from './config/database.js';
import healthRouter from './routes/health.js';

const app = express();

app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'Hopebed backend is running',
    status: 'ok',
  });
});

app.use('/health', healthRouter);

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

startServer();
