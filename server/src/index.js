import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDb } from './db/index.js';

import masterDataRouter from './routes/masterData.js';
import accountsRouter from './routes/accounts.js';
import corporateRouter from './routes/corporate.js';
import loansRouter from './routes/loans.js';
import auditRouter from './routes/audit.js';
import authRouter from './routes/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/master-data', masterDataRouter);
app.use('/api/accounts', accountsRouter);
app.use('/api/corporate', corporateRouter);
app.use('/api/loans', loansRouter);
app.use('/api/audit', auditRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    system: 'CoreBank System (BankOfMVP)',
    timestamp: new Date().toISOString()
  });
});

// Start DB & Express Server
async function startServer() {
  await initDb();
  const server = app.listen(PORT, () => {
    console.log(`CoreBank System Backend API running on port http://localhost:${PORT}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n[ERROR] Port ${PORT} is already in use by another process.`);
      console.error(`Please close the process using port ${PORT} or set PORT environment variable (e.g., PORT=5001 npm start).\n`);
      process.exit(1);
    } else {
      console.error('Server error:', err);
    }
  });
}

startServer();

