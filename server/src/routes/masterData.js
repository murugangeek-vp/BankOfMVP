import express from 'express';
import { query, getMemoryState } from '../db/index.js';

const router = express.Router();

// GET all master data rules
router.get('/', async (req, res) => {
  try {
    const interestRates = await query('SELECT * FROM master_interest_rates ORDER BY id ASC');
    const creditRules = await query('SELECT * FROM master_credit_scoring_rules ORDER BY min_credit_score DESC');
    const feePenalties = await query('SELECT * FROM master_fee_penalties ORDER BY id ASC');
    const loanProducts = await query('SELECT * FROM master_loan_products ORDER BY id ASC');

    res.json({
      interestRates: interestRates.rows,
      creditRules: creditRules.rows,
      feePenalties: feePenalties.rows,
      loanProducts: loanProducts.rows,
    });
  } catch (err) {
    const mem = getMemoryState();
    res.json({
      interestRates: mem.master_interest_rates,
      creditRules: mem.master_credit_scoring_rules,
      feePenalties: mem.master_fee_penalties,
      loanProducts: mem.master_loan_products,
    });
  }
});

// PUT update master interest rate
router.put('/interest-rates/:productKey', async (req, res) => {
  const { productKey } = req.params;
  const { annualRatePct, compoundingFrequency } = req.body;

  try {
    const result = await query(
      `UPDATE master_interest_rates SET annual_rate_pct = $1, compounding_frequency = $2, updated_at = CURRENT_TIMESTAMP WHERE product_key = $3 RETURNING *`,
      [annualRatePct, compoundingFrequency, productKey]
    );

    // Audit log
    await query(
      `INSERT INTO audit_logs (user_role, action, module, details_json) VALUES ($1, $2, $3, $4)`,
      ['BANK_MANAGER', 'UPDATE_MASTER_INTEREST_RATE', 'MASTER_DATA', JSON.stringify({ productKey, annualRatePct, compoundingFrequency })]
    );

    if (result.rows.length === 0) {
      // Memory fallback update
      const mem = getMemoryState();
      const item = mem.master_interest_rates.find(r => r.product_key === productKey);
      if (item) {
        item.annual_rate_pct = parseFloat(annualRatePct);
        if (compoundingFrequency) item.compounding_frequency = compoundingFrequency;
      }
      return res.json({ success: true, updated: item });
    }

    res.json({ success: true, updated: result.rows[0] });
  } catch (err) {
    const mem = getMemoryState();
    const item = mem.master_interest_rates.find(r => r.product_key === productKey);
    if (item) {
      item.annual_rate_pct = parseFloat(annualRatePct);
      if (compoundingFrequency) item.compounding_frequency = compoundingFrequency;
    }
    res.json({ success: true, updated: item });
  }
});

// PUT update master fee & penalties
router.put('/fee-penalties/:accountType', async (req, res) => {
  const { accountType } = req.params;
  const { minBalanceRequired, minBalancePenaltyFee, overdraftAnnualApr } = req.body;

  try {
    const result = await query(
      `UPDATE master_fee_penalties SET min_balance_required = $1, min_balance_penalty_fee = $2, overdraft_annual_apr = $3, updated_at = CURRENT_TIMESTAMP WHERE account_type = $4 RETURNING *`,
      [minBalanceRequired, minBalancePenaltyFee, overdraftAnnualApr, accountType]
    );

    if (result.rows.length === 0) {
      const mem = getMemoryState();
      const item = mem.master_fee_penalties.find(f => f.account_type === accountType);
      if (item) {
        item.min_balance_required = parseFloat(minBalanceRequired);
        item.min_balance_penalty_fee = parseFloat(minBalancePenaltyFee);
        item.overdraft_annual_apr = parseFloat(overdraftAnnualApr);
      }
      return res.json({ success: true, updated: item });
    }

    res.json({ success: true, updated: result.rows[0] });
  } catch (err) {
    const mem = getMemoryState();
    const item = mem.master_fee_penalties.find(f => f.account_type === accountType);
    if (item) {
      item.min_balance_required = parseFloat(minBalanceRequired);
      item.min_balance_penalty_fee = parseFloat(minBalancePenaltyFee);
      item.overdraft_annual_apr = parseFloat(overdraftAnnualApr);
    }
    res.json({ success: true, updated: item });
  }
});

export default router;
