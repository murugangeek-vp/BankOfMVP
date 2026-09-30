-- CoreBank System Seed Data

-- 1. SEED MASTER INTEREST RATES
INSERT INTO master_interest_rates (product_key, product_name, annual_rate_pct, compounding_frequency, description) VALUES
('SAVINGS_PERSONAL', 'Personal Savings Interest Rate', 4.50, 'DAILY', 'Daily compounding accrued monthly for personal savings accounts'),
('SAVINGS_CORPORATE', 'Corporate Savings Interest Rate', 3.80, 'MONTHLY', 'Monthly compounding interest for corporate treasury accounts'),
('CURRENT_OVERDRAFT', 'Current Account Overdraft APR', 12.00, 'MONTHLY', 'Annual interest rate charged on active overdraft balances'),
('LOAN_PERSONAL', 'Standard Personal Loan Base APR', 10.50, 'MONTHLY', 'Base annual percentage rate for unsecured personal loans'),
('LOAN_BUSINESS', 'Commercial Business Loan Base APR', 9.25, 'MONTHLY', 'Base annual percentage rate for corporate commercial credit');

-- 2. SEED MASTER CREDIT SCORING RULES
INSERT INTO master_credit_scoring_rules (tier_name, min_credit_score, max_credit_score, max_dti_ratio_pct, income_multiplier, base_interest_discount_pct, auto_approval_eligible) VALUES
('EXCELLENT', 750, 850, 50.00, 10.00, 1.50, TRUE),
('GOOD', 680, 749, 45.00, 7.50, 0.50, TRUE),
('FAIR', 600, 679, 35.00, 4.00, 0.00, FALSE),
('POOR', 300, 599, 25.00, 1.50, -2.00, FALSE);

-- 3. SEED MASTER FEE PENALTIES
INSERT INTO master_fee_penalties (account_type, min_balance_required, min_balance_penalty_fee, overdraft_annual_apr, max_overdraft_default_limit) VALUES
('SAVINGS', 1000.00, 25.00, 0.00, 0.00),
('CURRENT', 0.00, 0.00, 12.00, 50000.00),
('CORPORATE_SAVINGS', 10000.00, 100.00, 10.00, 250000.00);

-- 4. SEED MASTER LOAN PRODUCTS
INSERT INTO master_loan_products (product_key, product_name, min_amount, max_amount, default_apr_pct, max_tenure_months, processing_fee_pct) VALUES
('PERSONAL_LOAN', 'Personal Flexi Loan', 2000.00, 100000.00, 10.50, 60, 1.00),
('BUSINESS_LOAN', 'Corporate Growth Credit', 25000.00, 1000000.00, 9.25, 120, 1.50),
('AUTO_LOAN', 'Vehicle Purchase Loan', 5000.00, 80000.00, 7.25, 72, 0.75);

-- 5. SEED USERS
-- Passwords set to hashed 'password123'
INSERT INTO users (username, password_hash, full_name, email, role, corporate_tax_id, credit_score, monthly_income) VALUES
('john_retail', '$2a$10$wN1rD/4g1fNq7y.Y.u.Uu.2V.yJ/O6fH1iA5M5A2xZ1qN7y.Y.u.U', 'Johnathan Doe', 'john.doe@example.com', 'RETAIL_USER', NULL, 765, 95000.00),
('alice_maker', '$2a$10$wN1rD/4g1fNq7y.Y.u.Uu.2V.yJ/O6fH1iA5M5A2xZ1qN7y.Y.u.U', 'Alice Smith (Maker)', 'alice@acmecorp.com', 'CORPORATE_MAKER', 'US-9842145-ACME', 780, 125000.00),
('bob_checker', '$2a$10$wN1rD/4g1fNq7y.Y.u.Uu.2V.yJ/O6fH1iA5M5A2xZ1qN7y.Y.u.U', 'Bob Vance (Checker)', 'bob@acmecorp.com', 'CORPORATE_CHECKER', 'US-9842145-ACME', 810, 145000.00),
('sarah_manager', '$2a$10$wN1rD/4g1fNq7y.Y.u.Uu.2V.yJ/O6fH1iA5M5A2xZ1qN7y.Y.u.U', 'Sarah Jenkins (Bank Admin)', 's.jenkins@corebank.com', 'BANK_MANAGER', NULL, 820, 160000.00);

-- 6. SEED ACCOUNTS
INSERT INTO accounts (user_id, account_number, account_type, balance, overdraft_limit, overdraft_balance, accrued_interest) VALUES
(1, 'SAV-10029481', 'SAVINGS', 24850.75, 0.00, 0.00, 93.18),
(1, 'CUR-50039281', 'CURRENT', 14200.00, 10000.00, 0.00, 0.00),
(2, 'CORP-80091244', 'CORPORATE_SAVINGS', 845000.00, 150000.00, 0.00, 2675.83);

-- 7. SEED INITIAL TRANSACTIONS
INSERT INTO transactions (account_id, tx_ref, tx_type, amount, balance_after, category, description, counterparty_name) VALUES
(1, 'TX-1001', 'DEPOSIT', 25000.00, 25000.00, 'SALARY', 'Monthly Payroll Deposit', 'Tech Global Corp'),
(1, 'TX-1002', 'INTEREST_CREDIT', 93.18, 25093.18, 'INTEREST', 'Accrued Monthly Interest Credit', 'CoreBank Savings Engine'),
(1, 'TX-1003', 'TRANSFER_OUT', 242.43, 24850.75, 'BILL_PAYMENT', 'Utility Payment', 'Metro Power & Light'),
(2, 'TX-2001', 'DEPOSIT', 15000.00, 15000.00, 'TRANSFER_IN', 'Initial Current Account Deposit', 'Johnathan Doe'),
(2, 'TX-2002', 'WITHDRAWAL', 800.00, 14200.00, 'VENDOR', 'Equipment Vendor Disbursement', 'Office Supplies Inc'),
(3, 'TX-3001', 'DEPOSIT', 1000000.00, 1000000.00, 'CAPITAL', 'Corporate Treasury Capital Injection', 'Acme Group Holding'),
(3, 'TX-3002', 'PAYROLL_DISBURSEMENT', 155000.00, 845000.00, 'PAYROLL', 'Monthly Staff Salary Batch Run', 'Acme Payroll Batch #104');

-- 8. SEED CORPORATE APPROVAL REQUESTS (Maker-Checker)
INSERT INTO corporate_approval_requests (corporate_account_id, maker_user_id, checker_user_id, request_type, total_amount, recipient_count, status, payload_json) VALUES
(3, 2, NULL, 'BULK_PAYROLL', 425000.00, 85, 'PENDING', '{"batchName": "September 2026 Salary Run", "department": "Engineering & Operations", "items": [{"name": "Software Engineering Team", "count": 50, "sum": 250000}, {"name": "Product & Operations", "count": 35, "sum": 175000}]}'),
(3, 2, 3, 'HIGH_VALUE_TRANSFER', 180000.00, 1, 'APPROVED', '{"recipientName": "Global Steel Suppliers", "accountNo": "CUR-9921448", "taxId": "US-2294100", "purpose": "Raw materials bulk procurement"}');

-- 9. SEED LOANS & AMORTIZATION
INSERT INTO loans (user_id, loan_number, product_key, requested_amount, tenure_months, emi_amount, apr_pct, applicant_income, credit_score, credit_tier, status, approved_by) VALUES
(1, 'LN-2026-9041', 'PERSONAL_LOAN', 25000.00, 24, 1159.23, 9.00, 95000.00, 765, 'EXCELLENT', 'ACTIVE', 4);

INSERT INTO amortization_schedules (loan_id, installment_num, due_date, emi_amount, principal_portion, interest_portion, remaining_balance, status, paid_at) VALUES
(1, 1, '2026-08-01', 1159.23, 971.73, 187.50, 24028.27, 'PAID', '2026-08-01 10:15:00'),
(1, 2, '2026-09-01', 1159.23, 979.02, 180.21, 23049.25, 'PAID', '2026-09-01 09:30:00'),
(1, 3, '2026-10-01', 1159.23, 986.36, 172.87, 22062.89, 'PENDING', NULL),
(1, 4, '2026-11-01', 1159.23, 993.76, 165.47, 21069.13, 'PENDING', NULL);

-- 10. SEED AUDIT LOGS
INSERT INTO audit_logs (user_id, user_role, action, module, details_json) VALUES
(1, 'RETAIL_USER', 'USER_LOGIN', 'AUTH', '{"ip": "127.0.0.1", "device": "Chrome Desktop"}'),
(2, 'CORPORATE_MAKER', 'CREATE_PAYROLL_BATCH', 'CORPORATE', '{"batchId": 1, "amount": 425000.00, "recipients": 85}'),
(3, 'CORPORATE_CHECKER', 'APPROVE_TRANSFER', 'CORPORATE', '{"requestId": 2, "amount": 180000.00, "vendor": "Global Steel Suppliers"}'),
(4, 'BANK_MANAGER', 'APPROVE_LOAN', 'LOANS', '{"loanNumber": "LN-2026-9041", "amount": 25000.00, "tier": "EXCELLENT"}');
