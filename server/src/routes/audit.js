import express from 'express';
import { query, getMemoryState } from '../db/index.js';

const router = express.Router();

// GET audit logs
router.get('/', async (req, res) => {
  try {
    const result = await query(`
      SELECT a.*, u.username, u.full_name 
      FROM audit_logs a 
      LEFT JOIN users u ON a.user_id = u.id 
      ORDER BY a.created_at DESC 
      LIMIT 100
    `);
    let logs = result.rows;
    if (logs.length === 0) {
      const mem = getMemoryState();
      logs = mem.audit_logs;
    }
    res.json(logs);
  } catch (err) {
    const mem = getMemoryState();
    res.json(mem.audit_logs);
  }
});

export default router;
