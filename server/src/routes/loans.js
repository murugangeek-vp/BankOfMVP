import express from 'express';
import { query, getMemoryState } from '../db/index.js';

const router = express.Router();

// Helper: Calculate EMI
function calculateEMI(principal, annualRatePct, tenureMonths) {
  const r = annualRatePct / 12 / 100; // monthly rate
  const n = tenureMonths;
  if (r === 0) return principal / n;
  const emi = (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  return emi;
}

// GET all loans
router.get('/', async (req, res) => {
  const userId = req.query.userId;
  try {
    let sql = `SELECT l.*, u.full_name as applicant_name FROM loans l JOIN users u ON l.user_id = u.id`;
    const params = [];
    if (userId) {
      sql += ` WHERE l.user_id = $1`;
      params.push(userId);
    }
    sql += ` ORDER BY l.created_at DESC`;

    const result = await query(sql, params);
    let loans = result.rows;
    if (loans.length === 0) {
      const mem = getMemoryState();
      loans = mem.loans;
    }
    res.json(loans);
  } catch (err) {
    const mem = getMemoryState();
    res.json(mem.loans);
  }
});

// GET loan detail & amortization schedule
router.get('/:loanId/amortization', async (req, res) => {
  const { loanId } = req.params;
  try {
    const loanRes = await query('SELECT * FROM loans WHERE id = $1', [loanId]);
    const schedRes = await query('SELECT * FROM amortization_schedules WHERE loan_id = $1 ORDER BY installment_num ASC', [loanId]);

    let loan = loanRes.rows[0];
    let schedules = schedRes.rows;

    if (!loan) {
      const mem = getMemoryState();
      loan = mem.loans.find(l => l.id == loanId);
      schedules = mem.amortization_schedules.filter(s => s.loan_id == loanId);
    }

    res.json({ loan, schedule: schedules });
  } catch (err) {
    const mem = getMemoryState();
    const loan = mem.loans.find(l => l.id == loanId);
    const schedule = mem.amortization_schedules.filter(s => s.loan_id == loanId);
    res.json({ loan, schedule });
  }
});

// POST evaluate & originate loan application against Database Master Rules
router.post('/apply', async (req, res) => {
  const { userId, productKey, requestedAmount, tenureMonths, monthlyIncome, creditScore } = req.body;
  const amount = parseFloat(requestedAmount);
  const tenure = parseInt(tenureMonths, 10);
  const income = parseFloat(monthlyIncome);
  const score = parseInt(creditScore, 10);

  try {
    // 1. Fetch Loan Product Master Rules
    const prodRes = await query('SELECT * FROM master_loan_products WHERE product_key = $1', [productKey]);
    let prod = prodRes.rows[0];
    if (!prod) {
      const mem = getMemoryState();
      prod = mem.master_loan_products.find(p => p.product_key === productKey) || mem.master_loan_products[0];
    }

    if (amount < parseFloat(prod.min_amount) || amount > parseFloat(prod.max_amount)) {
      return res.status(400).json({ error: `Amount must be between $${prod.min_amount} and $${prod.max_amount} for ${prod.product_name}` });
    }

    if (tenure > prod.max_tenure_months) {
      return res.status(400).json({ error: `Max tenure for ${prod.product_name} is ${prod.max_tenure_months} months.` });
    }

    // 2. Fetch Master Credit Scoring Rules
    const creditRulesRes = await query('SELECT * FROM master_credit_scoring_rules ORDER BY min_credit_score DESC');
    let creditRules = creditRulesRes.rows;
    if (creditRules.length === 0) {
      const mem = getMemoryState();
      creditRules = mem.master_credit_scoring_rules;
    }

    // Determine Credit Tier
    let matchedTier = creditRules.find(r => score >= r.min_credit_score && score <= r.max_credit_score) || creditRules[creditRules.length - 1];

    const baseApr = parseFloat(prod.default_apr_pct);
    const discount = parseFloat(matchedTier.base_interest_discount_pct || 0);
    const finalApr = Math.max(3.0, baseApr - discount);

    // Calculate Max Eligible Loan Amount based on income multiplier
    const maxLoanLimit = income * parseFloat(matchedTier.income_multiplier);
    const emi = calculateEMI(amount, finalApr, tenure);

    let status = 'PENDING';
    if (matchedTier.auto_approval_eligible && amount <= maxLoanLimit) {
      status = 'APPROVED';
    } else if (score < 600 || amount > maxLoanLimit * 1.5) {
      status = 'REJECTED';
    }

    const loanNumber = `LN-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const loanRes = await query(
      `INSERT INTO loans (user_id, loan_number, product_key, requested_amount, tenure_months, emi_amount, apr_pct, applicant_income, credit_score, credit_tier, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [userId || 1, loanNumber, productKey, amount, tenure, emi.toFixed(2), finalApr.toFixed(2), income, score, matchedTier.tier_name, status]
    );

    const newLoan = loanRes.rows[0] || {
      id: Date.now(),
      user_id: userId || 1,
      loan_number: loanNumber,
      product_key: productKey,
      requested_amount: amount,
      tenure_months: tenure,
      emi_amount: parseFloat(emi.toFixed(2)),
      apr_pct: parseFloat(finalApr.toFixed(2)),
      applicant_income: income,
      credit_score: score,
      credit_tier: matchedTier.tier_name,
      status: status,
      created_at: new Date().toISOString()
    };

    // Generate Amortization Schedule
    let remaining = amount;
    const scheduleItems = [];
    const monthlyRate = finalApr / 12 / 100;
    const startDate = new Date();

    for (let i = 1; i <= tenure; i++) {
      const interestPortion = remaining * monthlyRate;
      const principalPortion = emi - interestPortion;
      remaining = Math.max(0, remaining - principalPortion);

      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + i);

      scheduleItems.push({
        installment_num: i,
        due_date: dueDate.toISOString().split('T')[0],
        emi_amount: parseFloat(emi.toFixed(2)),
        principal_portion: parseFloat(principalPortion.toFixed(2)),
        interest_portion: parseFloat(interestPortion.toFixed(2)),
        remaining_balance: parseFloat(remaining.toFixed(2)),
        status: 'PENDING'
      });

      await query(
        `INSERT INTO amortization_schedules (loan_id, installment_num, due_date, emi_amount, principal_portion, interest_portion, remaining_balance, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [newLoan.id, i, dueDate.toISOString().split('T')[0], emi.toFixed(2), principalPortion.toFixed(2), interestPortion.toFixed(2), remaining.toFixed(2), 'PENDING']
      );
    }

    const mem = getMemoryState();
    mem.loans.unshift(newLoan);
    scheduleItems.forEach(item => mem.amortization_schedules.push({ ...item, id: Date.now() + Math.random(), loan_id: newLoan.id }));

    // Audit log
    await query(
      `INSERT INTO audit_logs (user_id, user_role, action, module, details_json) VALUES ($1, $2, $3, $4, $5)`,
      [userId || 1, 'RETAIL_USER', 'APPLY_LOAN', 'LOANS', JSON.stringify({ loanNumber, amount, status, tier: matchedTier.tier_name })]
    );

    res.json({
      success: true,
      loan: newLoan,
      creditEvaluation: {
        score,
        tier: matchedTier.tier_name,
        maxEligibleLimit: maxLoanLimit.toFixed(2),
        apr: finalApr.toFixed(2),
        emi: emi.toFixed(2),
        autoApproved: status === 'APPROVED'
      },
      schedulePreview: scheduleItems.slice(0, 6) // preview first 6 months
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to process loan application' });
  }
});

// POST Bank Manager approves/activates pending loan application
router.post('/:loanId/approve', async (req, res) => {
  const { loanId } = req.params;
  const { managerUserId } = req.body;

  try {
    await query(`UPDATE loans SET status = 'ACTIVE', approved_by = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, [managerUserId || 4, loanId]);

    const mem = getMemoryState();
    const memLoan = mem.loans.find(l => l.id == loanId);
    if (memLoan) memLoan.status = 'ACTIVE';

    await query(
      `INSERT INTO audit_logs (user_id, user_role, action, module, details_json) VALUES ($1, $2, $3, $4, $5)`,
      [managerUserId || 4, 'BANK_MANAGER', 'APPROVE_LOAN_APPLICATION', 'LOANS', JSON.stringify({ loanId, newStatus: 'ACTIVE' })]
    );

    res.json({ success: true, status: 'ACTIVE' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
