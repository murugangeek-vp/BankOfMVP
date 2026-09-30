import express from 'express';
import { query, getMemoryState } from '../db/index.js';

const router = express.Router();

// GET all approval requests for corporate accounts (Maker/Checker Queue)
router.get('/requests', async (req, res) => {
  try {
    const result = await query(`
      SELECT r.*, m.full_name as maker_name, c.full_name as checker_name 
      FROM corporate_approval_requests r
      LEFT JOIN users m ON r.maker_user_id = m.id
      LEFT JOIN users c ON r.checker_user_id = c.id
      ORDER BY r.created_at DESC
    `);
    
    let requests = result.rows;
    if (requests.length === 0) {
      const mem = getMemoryState();
      requests = mem.corporate_approval_requests;
    }
    res.json(requests);
  } catch (err) {
    const mem = getMemoryState();
    res.json(mem.corporate_approval_requests);
  }
});

// POST Maker creates a new transaction / bulk payroll request
router.post('/request', async (req, res) => {
  const { corporateAccountId, makerUserId, requestType, totalAmount, recipientCount, payload } = req.body;
  const numAmount = parseFloat(totalAmount);

  try {
    const result = await query(
      `INSERT INTO corporate_approval_requests (corporate_account_id, maker_user_id, request_type, total_amount, recipient_count, status, payload_json) 
       VALUES ($1, $2, $3, $4, $5, 'PENDING', $6) RETURNING *`,
      [corporateAccountId || 3, makerUserId || 2, requestType || 'HIGH_VALUE_TRANSFER', numAmount, recipientCount || 1, JSON.stringify(payload || {})]
    );

    // Audit log
    await query(
      `INSERT INTO audit_logs (user_id, user_role, action, module, details_json) VALUES ($1, $2, $3, $4, $5)`,
      [makerUserId || 2, 'CORPORATE_MAKER', 'SUBMIT_MAKER_REQUEST', 'CORPORATE', JSON.stringify({ requestType, totalAmount: numAmount, recipientCount })]
    );

    const mem = getMemoryState();
    const newReq = result.rows[0] || {
      id: Date.now(),
      corporate_account_id: corporateAccountId || 3,
      maker_user_id: makerUserId || 2,
      request_type: requestType,
      total_amount: numAmount,
      recipient_count: recipientCount || 1,
      status: 'PENDING',
      payload_json: payload,
      maker_name: 'Alice Smith (Maker)',
      created_at: new Date().toISOString()
    };
    mem.corporate_approval_requests.unshift(newReq);

    res.json({ success: true, request: newReq });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit Maker request' });
  }
});

// POST Checker approves or rejects a corporate request
router.post('/request/:requestId/decision', async (req, res) => {
  const { requestId } = req.params;
  const { checkerUserId, action, rejectionReason } = req.body; // action: 'APPROVE' or 'REJECT'

  try {
    const status = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';

    const reqRes = await query(`SELECT * FROM corporate_approval_requests WHERE id = $1`, [requestId]);
    let reqObj = reqRes.rows[0];
    
    if (!reqObj) {
      const mem = getMemoryState();
      reqObj = mem.corporate_approval_requests.find(r => r.id == requestId);
    }

    if (!reqObj) {
      return res.status(404).json({ error: 'Approval request not found' });
    }

    if (reqObj.status !== 'PENDING') {
      return res.status(400).json({ error: `Request has already been ${reqObj.status.toLowerCase()}` });
    }

    // Update approval request status
    await query(
      `UPDATE corporate_approval_requests SET status = $1, checker_user_id = $2, rejection_reason = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4`,
      [status, checkerUserId || 3, rejectionReason || null, requestId]
    );

    // If APPROVED, execute ledger disbursement
    if (action === 'APPROVE') {
      const accId = reqObj.corporate_account_id;
      const amount = parseFloat(reqObj.total_amount);

      const accRes = await query('SELECT * FROM accounts WHERE id = $1', [accId]);
      let account = accRes.rows[0];
      if (!account) {
        const mem = getMemoryState();
        account = mem.accounts.find(a => a.id == accId);
      }

      const currentBalance = parseFloat(account.balance);
      const newBalance = currentBalance - amount;

      await query('UPDATE accounts SET balance = $1 WHERE id = $2', [newBalance, accId]);

      const txRef = `TX-CORP-${Date.now()}`;
      await query(
        `INSERT INTO transactions (account_id, tx_ref, tx_type, amount, balance_after, category, description, counterparty_name) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [accId, txRef, reqObj.request_type === 'BULK_PAYROLL' ? 'PAYROLL_DISBURSEMENT' : 'TRANSFER_OUT', amount, newBalance, 'CORPORATE', `Checker Approved: ${reqObj.request_type}`, 'Corporate Disbursement']
      );

      const mem = getMemoryState();
      const memAcc = mem.accounts.find(a => a.id == accId);
      if (memAcc) memAcc.balance = newBalance;
    }

    // Update memory fallback
    const mem = getMemoryState();
    const memReq = mem.corporate_approval_requests.find(r => r.id == requestId);
    if (memReq) {
      memReq.status = status;
      memReq.checker_user_id = checkerUserId || 3;
      memReq.checker_name = 'Bob Vance (Checker)';
      if (rejectionReason) memReq.rejection_reason = rejectionReason;
    }

    // Audit log
    await query(
      `INSERT INTO audit_logs (user_id, user_role, action, module, details_json) VALUES ($1, $2, $3, $4, $5)`,
      [checkerUserId || 3, 'CORPORATE_CHECKER', `MAKER_CHECKER_${action}`, 'CORPORATE', JSON.stringify({ requestId, action, status })]
    );

    res.json({ success: true, status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to process Checker decision' });
  }
});

export default router;
