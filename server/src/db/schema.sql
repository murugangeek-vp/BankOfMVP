-- CoreBank System (BankOfMVP) PostgreSQL Schema

DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS amortization_schedules CASCADE;
DROP TABLE IF EXISTS loans CASCADE;
DROP TABLE IF EXISTS corporate_approval_requests CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DROP TABLE IF EXISTS master_loan_products CASCADE;
DROP TABLE IF EXISTS master_fee_penalties CASCADE;
DROP TABLE IF EXISTS master_credit_scoring_rules CASCADE;
DROP TABLE IF EXISTS master_interest_rates CASCADE;

-- 1. MASTER DATA TABLES

CREATE TABLE master_interest_rates (
    id SERIAL PRIMARY KEY,
    product_key VARCHAR(50) UNIQUE NOT NULL,
    product_name VARCHAR(100) NOT NULL,
    annual_rate_pct NUMERIC(5, 2) NOT NULL,
    compounding_frequency VARCHAR(20) NOT NULL DEFAULT 'MONTHLY', -- DAILY, MONTHLY, ANNUAL
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE master_credit_scoring_rules (
    id SERIAL PRIMARY KEY,
    tier_name VARCHAR(30) UNIQUE NOT NULL, -- EXCELLENT, GOOD, FAIR, POOR
    min_credit_score INT NOT NULL,
    max_credit_score INT NOT NULL,
    max_dti_ratio_pct NUMERIC(5, 2) NOT NULL, -- Debt-to-income cap
    income_multiplier NUMERIC(5, 2) NOT NULL, -- Max loan = income * multiplier
    base_interest_discount_pct NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    auto_approval_eligible BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE master_fee_penalties (
    id SERIAL PRIMARY KEY,
    account_type VARCHAR(50) UNIQUE NOT NULL, -- SAVINGS, CURRENT, CORPORATE_SAVINGS
    min_balance_required NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    min_balance_penalty_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    overdraft_annual_apr NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    max_overdraft_default_limit NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE master_loan_products (
    id SERIAL PRIMARY KEY,
    product_key VARCHAR(50) UNIQUE NOT NULL, -- PERSONAL_LOAN, BUSINESS_LOAN, AUTO_LOAN, HOME_LOAN
    product_name VARCHAR(100) NOT NULL,
    min_amount NUMERIC(15, 2) NOT NULL,
    max_amount NUMERIC(15, 2) NOT NULL,
    default_apr_pct NUMERIC(5, 2) NOT NULL,
    max_tenure_months INT NOT NULL,
    processing_fee_pct NUMERIC(5, 2) NOT NULL DEFAULT 1.00,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. DOMAIN TABLES

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    role VARCHAR(30) NOT NULL, -- RETAIL_USER, CORPORATE_MAKER, CORPORATE_CHECKER, BANK_MANAGER
    corporate_tax_id VARCHAR(50),
    credit_score INT DEFAULT 720,
    monthly_income NUMERIC(15, 2) DEFAULT 85000.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE accounts (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    account_number VARCHAR(20) UNIQUE NOT NULL,
    account_type VARCHAR(30) NOT NULL, -- SAVINGS, CURRENT, CORPORATE_SAVINGS
    balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    overdraft_limit NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    overdraft_balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    accrued_interest NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, FROZEN, CLOSED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    account_id INT REFERENCES accounts(id) ON DELETE CASCADE,
    tx_ref VARCHAR(50) UNIQUE NOT NULL,
    tx_type VARCHAR(30) NOT NULL, -- DEPOSIT, WITHDRAWAL, TRANSFER_IN, TRANSFER_OUT, INTEREST_CREDIT, PENALTY_FEE, OVERDRAFT_INTEREST, PAYROLL_DISBURSEMENT, EMI_DEBIT
    amount NUMERIC(15, 2) NOT NULL,
    balance_after NUMERIC(15, 2) NOT NULL,
    category VARCHAR(50) DEFAULT 'GENERAL',
    description TEXT,
    counterparty_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE corporate_approval_requests (
    id SERIAL PRIMARY KEY,
    corporate_account_id INT REFERENCES accounts(id) ON DELETE CASCADE,
    maker_user_id INT REFERENCES users(id),
    checker_user_id INT REFERENCES users(id),
    request_type VARCHAR(50) NOT NULL, -- HIGH_VALUE_TRANSFER, BULK_PAYROLL
    total_amount NUMERIC(15, 2) NOT NULL,
    recipient_count INT DEFAULT 1,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
    payload_json JSONB NOT NULL,
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE loans (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    loan_number VARCHAR(30) UNIQUE NOT NULL,
    product_key VARCHAR(50) REFERENCES master_loan_products(product_key),
    requested_amount NUMERIC(15, 2) NOT NULL,
    tenure_months INT NOT NULL,
    emi_amount NUMERIC(15, 2) NOT NULL,
    apr_pct NUMERIC(5, 2) NOT NULL,
    applicant_income NUMERIC(15, 2) NOT NULL,
    credit_score INT NOT NULL,
    credit_tier VARCHAR(30) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING, APPROVED, ACTIVE, REJECTED, CLOSED, DEFAULTED
    approved_by INT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE amortization_schedules (
    id SERIAL PRIMARY KEY,
    loan_id INT REFERENCES loans(id) ON DELETE CASCADE,
    installment_num INT NOT NULL,
    due_date DATE NOT NULL,
    emi_amount NUMERIC(15, 2) NOT NULL,
    principal_portion NUMERIC(15, 2) NOT NULL,
    interest_portion NUMERIC(15, 2) NOT NULL,
    remaining_balance NUMERIC(15, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING, PAID, OVERDUE
    paid_at TIMESTAMP
);

CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    user_role VARCHAR(30),
    action VARCHAR(100) NOT NULL,
    module VARCHAR(50) NOT NULL,
    details_json JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
