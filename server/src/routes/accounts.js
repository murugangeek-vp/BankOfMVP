import express from 'express';
import { query, getMemoryState } from '../db/index.js';

const router = express.Router();

// GET user accounts and balances
router.get('/', async (req, res) => {
  const userId = req.query.userId || 1;
  try {
    const accResult = await query('SELECT * FROM accounts WHERE user_id = $1 ORDER BY id ASC', [userId]);
    let accounts = accResult.rows;
    if (accounts.length === 0) {
      const mem = getMemoryState();
      accounts = mem.accounts.filter(a => a.user_id == userId);
    }
    res.json(accounts);
  } catch (err) {
    const mem = getMemoryState();
    res.json(mem.accounts.filter(a => a.user_id == userId));
  }
});

// GET transactions for account
router.get('/:accountId/transactions', async (req, res) => {
  const { accountId } = req.params;
  try {
    const result = await query('SELECT * FROM transactions WHERE account_id = $1 ORDER BY created_at DESC', [accountId]);
    let txs = result.rows;
    if (txs.length === 0) {
      const mem = getMemoryState();
      txs = mem.transactions.filter(t => t.account_id == accountId);
    }
    res.json(txs);
  } catch (err) {
    const mem = getMemoryState();
    res.json(mem.transactions.filter(t => t.account_id == accountId));
  }
});

// POST deposit or withdrawal transaction
router.post('/transaction', async (req, res) => {
  const { accountId, type, amount, category, description, counterpartyName } = req.body;
  const numAmount = parseFloat(amount);

  if (isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({ error: 'Invalid transaction amount' });
  }

  try {
    const accRes = await query('SELECT * FROM accounts WHERE id = $1', [accountId]);
    let account = accRes.rows[0];

    if (!account) {
      const mem = getMemoryState();
      account = mem.accounts.find(a => a.id == accountId);
    }

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    let currentBalance = parseFloat(account.balance);
    let overdraftLimit = parseFloat(account.overdraft_limit || 0);
    let newBalance = currentBalance;

    if (type === 'DEPOSIT' || type === 'TRANSFER_IN') {
      newBalance = currentBalance + numAmount;
    } else if (type === 'WITHDRAWAL' || type === 'TRANSFER_OUT' || type === 'VENDOR_PAYMENT') {
      const maxAvailable = currentBalance + overdraftLimit;
      if (numAmount > maxAvailable) {
        return res.status(400).json({ error: `Insufficient funds. Available (Balance + Overdraft Limit): $${maxAvailable.toFixed(2)}` });
      }
      newBalance = currentBalance - numAmount;
    }

    const txRef = `TX-${Date.now()}`;
    
    // Update account balance
    await query('UPDATE accounts SET balance = $1 WHERE id = $2', [newBalance, accountId]);

    // Insert transaction record
    const txRes = await query(
      `INSERT INTO transactions (account_id, tx_ref, tx_type, amount, balance_after, category, description, counterparty_name) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [accountId, txRef, type, numAmount, newBalance, category || 'GENERAL', description || 'Account Transaction', counterpartyName || 'Self']
    );

    // Audit log
    await query(
      `INSERT INTO audit_logs (user_id, user_role, action, module, details_json) VALUES ($1, $2, $3, $4, $5)`,
      [account.user_id, 'RETAIL_USER', `ACCOUNT_${type}`, 'ACCOUNTS', JSON.stringify({ accountId, type, amount: numAmount, newBalance })]
    );

    // Sync memory state as fallback
    const mem = getMemoryState();
    const memAcc = mem.accounts.find(a => a.id == accountId);
    if (memAcc) memAcc.balance = newBalance;
    const newTxObj = txRes.rows[0] || {
      id: Date.now(),
      account_id: accountId,
      tx_ref: txRef,
      tx_type: type,
      amount: numAmount,
      balance_after: newBalance,
      category,
      description,
      counterparty_name: counterpartyName,
      created_at: new Date().toISOString()
    };
    mem.transactions.unshift(newTxObj);

    res.json({ success: true, newBalance, transaction: newTxObj });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to process transaction' });
  }
});

// POST calculate compounding interest accrued on savings account
router.post('/:accountId/calculate-interest', async (req, res) => {
  const { accountId } = req.params;

  try {
    // Fetch rate from master data
    const rateRes = await query(`SELECT annual_rate_pct FROM master_interest_rates WHERE product_key = 'SAVINGS_PERSONAL'`);
    const annualRate = rateRes.rows.length > 0 ? parseFloat(rateRes.rows[0].annual_rate_pct) : 4.50;

    const accRes = await query('SELECT * FROM accounts WHERE id = $1', [accountId]);
    let account = accRes.rows[0];
    if (!account) {
      const mem = getMemoryState();
      account = mem.accounts.find(a => a.id == accountId);
    }

    const currentBalance = parseFloat(account.balance);
    // Daily compounding accrual formula: Accrued = Balance * (annualRate / 100 / 365) * 30 days
    const monthlyAccruedInterest = (currentBalance * (annualRate / 100 / 365) * 30);
    const newBalance = currentBalance + monthlyAccruedInterest;

    // Credit interest to account
    await query('UPDATE accounts SET balance = $1, accrued_interest = $2 WHERE id = $3', [newBalance, monthlyAccruedInterest, accountId]);

    const txRef = `TX-INT-${Date.now()}`;
    await query(
      `INSERT INTO transactions (account_id, tx_ref, tx_type, amount, balance_after, category, description, counterparty_name) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [accountId, txRef, 'INTEREST_CREDIT', monthlyAccruedInterest, newBalance, 'INTEREST', `Compounded Interest Credit (${annualRate}% APR)`, 'CoreBank Automated Interest Engine']
    );

    res.json({
      success: true,
      annualRatePct: annualRate,
      interestCredited: monthlyAccruedInterest.toFixed(2),
      newBalance: newBalance.toFixed(2),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST adjust overdraft limit for current account
router.post('/:accountId/overdraft-limit', async (req, res) => {
  const { accountId } = req.params;
  const { limit } = req.body;
  const newLimit = parseFloat(limit);

  try {
    await query('UPDATE accounts SET overdraft_limit = $1 WHERE id = $2', [newLimit, accountId]);
    
    const mem = getMemoryState();
    const memAcc = mem.accounts.find(a => a.id == accountId);
    if (memAcc) memAcc.overdraft_limit = newLimit;

    res.json({ success: true, overdraftLimit: newLimit });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
