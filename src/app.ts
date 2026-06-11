import express, { Express, NextFunction, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { v4 as uuidv4 } from 'uuid';
import { env } from './config/env';
import logger from './shared/middleware/logger.middleware';
import { errorMiddleware } from './shared/middleware/error.middleware';
import { apiLimiter } from './shared/middleware/ratelimit.middleware';
import registerRoutes from './routes';
import { AuthRequest } from './shared/utils/response.util';

const app: Express = express();

// Security middleware
app.use(helmet());

// CORS
const allowedOrigins = env.ALLOWED_ORIGINS.split(',');
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Request logging
app.use(
  morgan(':method :url :status :res[content-length] - :response-time ms', {
    stream: {
      write: (message: string) => logger.info(message.trim()),
    },
  })
);

// Request ID middleware
app.use((req: AuthRequest, res: Response, next: NextFunction) => {
  req.requestId = uuidv4();
  next();
});

// Rate limiting
app.use('/api/', apiLimiter);

// Routes
registerRoutes(app);

// Health check
app.get('/health', (req: AuthRequest, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API documentation route placeholder
app.get('/api/v1/docs', (req: AuthRequest, res: Response) => {
  res.json({
    message: 'API Documentation',
    version: env.API_VERSION,
    baseUrl: `http://localhost:${env.PORT}/api/${env.API_VERSION}`,
  });
});

// 404 handler
app.use((req: AuthRequest, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Error middleware (must be last)
app.use(errorMiddleware);

export default app;
