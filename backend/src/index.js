import path from 'node:path';
import { fileURLToPath } from 'node:url';

import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';

import db, { testDatabaseConnection } from './db.js';
import authRoutes from './routes/auth.js';
import roomsRoutes from './routes/rooms.js';
import expensesRoutes from './routes/expenses.js';
import invoicesRoutes from './routes/invoices.js';
import tasksRoutes from './routes/tasks.js';
import reportsRoutes from './routes/reports.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 5000);
const clientOrigin = process.env.CLIENT_URL || 'http://localhost:5173';

app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://roommate-frontend.s3-website-ap-northeast-1.amazonaws.com"
  ],
  credentials: true
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomsRoutes);
app.use('/api/expenses', expensesRoutes);
app.use('/api/invoices', invoicesRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/reports', reportsRoutes);

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'Server is running',
  });
});

app.get('/api/test-db', async (_req, res) => {
  try {
    const [rows] = await db.execute('SELECT NOW() AS time');
    res.json({
      message: 'DB connected',
      time: rows[0].time,
    });
  } catch (error) {
    res.status(500).json({
      message: 'DB error',
      error: error.message,
    });
  }
});

async function startServer() {
  try {
    await testDatabaseConnection();

    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error('Unable to connect to MySQL:', error.message);
    process.exit(1);
  }
}

startServer();
