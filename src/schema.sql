
-- Users Table
CREATE TABLE IF NOT EXISTS users (
id SERIAL PRIMARY KEY,
name VARCHAR(100) NOT NULL,
email VARCHAR(100) UNIQUE NOT NULL,
password_hash TEXT NOT NULL,  -- Added
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
id SERIAL PRIMARY KEY,
name VARCHAR(50) UNIQUE NOT NULL
);

-- Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
id SERIAL PRIMARY KEY,
user_id INT REFERENCES users(id) ON DELETE CASCADE,
amount NUMERIC NOT NULL,
type VARCHAR(10) CHECK (type IN ('income', 'expense')) NOT NULL,
category VARCHAR(50),
note TEXT,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Budgets Table
CREATE TABLE budgets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL,
  amount NUMERIC NOT NULL,
  month INTEGER CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL,
  UNIQUE (user_id, category, month, year)
);

-- Add password_hash to user table: added to the user sql--

ALTER TABLE users
ADD COLUMN password_hash TEXT NOT 
NULL;

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  amount DECIMAL(10, 2) NOT NULL,
  scheduled_date TIMESTAMP NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  receiver_name VARCHAR(255) NOT NULL,
  receiver_account VARCHAR(20) NOT NULL,
  description VARCHAR(255),
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
);

-- NEW  payments --

CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(15, 2) NOT NULL, -- Increased precision for large amounts
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  recipient_name VARCHAR(255) NOT NULL,
  recipient_account VARCHAR(20) NOT NULL,
  recipient_bank_code VARCHAR(10) NOT NULL, -- e.g., '011' for First Bank
  paystack_recipient_code VARCHAR(100), -- The 'RCP_xxxx' from our handshake
  scheduled_date TIMESTAMP NOT NULL,
  last_run_at TIMESTAMP, -- Track exactly when the scheduler last tried this
  frequency VARCHAR(20) DEFAULT 'once', -- Allows for recurring payments later
  description VARCHAR(255),
  failure_reason TEXT, -- Stores why a payment failed (e.g., "Insufficient Funds")
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
);


CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE users ADD COLUMN balance DECIMAL(15, 2) DEFAULT 0.00;


CREATE TABLE transactions (
  id SERIAL PRIMARY KEY, 
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(15, 2) NOT NULL,
  type VARCHAR(10) CHECK (type IN ('credit', 'debit')),
  category VARCHAR(50), -- e.g. 'wallet_funding', 'payment_deduction'
  reference_id INTEGER, -- links to payments table
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- NEW --

  CREATE TABLE transactions (
  id SERIAL PRIMARY KEY, 
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(15, 2) NOT NULL,
  
  -- 'credit' (money in) or 'debit' (money out)
  type VARCHAR(10) CHECK (type IN ('credit', 'debit')),
  
  -- Detailed categories for clear history
  category VARCHAR(50), -- 'wallet_funding', 'autopay_payout', 'referral_bonus'
  
  -- Internal Link: Connects to your 'payments' table ID (Integer)
  payment_id INTEGER REFERENCES payments(id) ON DELETE SET NULL,
  
  -- External Link: The alphanumeric string from Paystack (String)
  gateway_reference VARCHAR(100) UNIQUE,
  
  -- The final status of the transaction
  status VARCHAR(20) DEFAULT 'success' CHECK (status IN ('success', 'failed', 'reversed')),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

   ALTER TABLE transactions ADD COLUMN gateway_reference VARCHAR(100) UNIQUE;


CREATE TABLE transactions (
  id SERIAL PRIMARY KEY, 
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(15, 2) NOT NULL,
  type VARCHAR(10) CHECK (type IN ('credit', 'debit')),
  category VARCHAR(50), 
  payment_id INTEGER REFERENCES payments(id) ON DELETE SET NULL,
  gateway_reference VARCHAR(100) UNIQUE,
  status VARCHAR(20) DEFAULT 'success' CHECK (status IN ('success', 'failed', 'reversed')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE transactions ADD COLUMN gateway_reference VARCHAR(100) UNIQUE;