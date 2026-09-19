-- Thanda Kapda dashboard schema (MySQL 8 / MariaDB 10.6+).
-- Stock and account balances are never stored: they are derived from the
-- transaction tables below. Every row carries who created / last changed it.

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('owner','staff') NOT NULL DEFAULT 'owner',
  active TINYINT(1) NOT NULL DEFAULT 1,
  theme VARCHAR(10) NOT NULL DEFAULT 'system',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS sessions (
  token_hash CHAR(64) PRIMARY KEY,
  user_id INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  INDEX (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS login_attempts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ip VARCHAR(64) NOT NULL,
  at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX (ip, at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- Master lists ----------
CREATE TABLE IF NOT EXISTS designs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  low_stock INT NULL,
  archived TINYINT(1) NOT NULL DEFAULT 0,
  sort INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL, created_by INT NULL,
  updated_at DATETIME NOT NULL, updated_by INT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS locations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  archived TINYINT(1) NOT NULL DEFAULT 0,
  sort INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL, created_by INT NULL,
  updated_at DATETIME NOT NULL, updated_by INT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS accounts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  archived TINYINT(1) NOT NULL DEFAULT 0,
  sort INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL, created_by INT NULL,
  updated_at DATETIME NOT NULL, updated_by INT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  archived TINYINT(1) NOT NULL DEFAULT 0,
  sort INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL, created_by INT NULL,
  updated_at DATETIME NOT NULL, updated_by INT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS people (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  archived TINYINT(1) NOT NULL DEFAULT 0,
  sort INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL, created_by INT NULL,
  updated_at DATETIME NOT NULL, updated_by INT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- Sales ----------
CREATE TABLE IF NOT EXISTS sales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  date DATE NOT NULL,
  party VARCHAR(190) NOT NULL,
  design_id INT NULL,
  location_id INT NULL,
  quantity INT NOT NULL DEFAULT 0,
  price DECIMAL(14,2) NOT NULL DEFAULT 0,
  freight DECIMAL(14,2) NOT NULL DEFAULT 0,
  person_id INT NULL,
  notes TEXT NULL,
  created_at DATETIME NOT NULL, created_by INT NULL,
  updated_at DATETIME NOT NULL, updated_by INT NULL,
  INDEX (date), INDEX (design_id, location_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS sale_payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sale_id INT NOT NULL,
  date DATE NOT NULL,
  amount DECIMAL(14,2) NOT NULL,
  account_id INT NOT NULL,
  created_at DATETIME NOT NULL, created_by INT NULL,
  updated_at DATETIME NOT NULL, updated_by INT NULL,
  INDEX (sale_id), INDEX (account_id),
  CONSTRAINT fk_payment_sale FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- Samples ----------
CREATE TABLE IF NOT EXISTS samples (
  id INT AUTO_INCREMENT PRIMARY KEY,
  date DATE NOT NULL,
  design_id INT NOT NULL,
  location_id INT NOT NULL,
  quantity INT NOT NULL,
  given_to VARCHAR(190) NOT NULL,
  person_id INT NULL,
  remark TEXT NULL,
  created_at DATETIME NOT NULL, created_by INT NULL,
  updated_at DATETIME NOT NULL, updated_by INT NULL,
  INDEX (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- Expenses ----------
CREATE TABLE IF NOT EXISTS expenses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  date DATE NOT NULL,
  paid_to VARCHAR(190) NOT NULL,
  amount DECIMAL(14,2) NOT NULL,
  category_id INT NOT NULL,
  account_id INT NOT NULL,
  person_id INT NULL,
  remarks TEXT NULL,
  created_at DATETIME NOT NULL, created_by INT NULL,
  updated_at DATETIME NOT NULL, updated_by INT NULL,
  INDEX (date), INDEX (account_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- Amazon ----------
CREATE TABLE IF NOT EXISTS amazon_orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  date DATE NOT NULL,
  order_id VARCHAR(60) NOT NULL,
  customer VARCHAR(190) NULL,
  city VARCHAR(120) NULL,
  status ENUM('Shipment','Cancel','Refund') NOT NULL DEFAULT 'Shipment',
  invoice_no VARCHAR(60) NULL,
  design_id INT NULL,
  location_id INT NULL,
  quantity INT NOT NULL DEFAULT 0,
  taxable DECIMAL(14,2) NOT NULL DEFAULT 0,
  tax DECIMAL(14,2) NOT NULL DEFAULT 0,
  invoice_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL, created_by INT NULL,
  updated_at DATETIME NOT NULL, updated_by INT NULL,
  INDEX (date), INDEX (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Money Amazon actually pays out (net of its fees) into one of our accounts.
CREATE TABLE IF NOT EXISTS amazon_settlements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  date DATE NOT NULL,
  account_id INT NOT NULL,
  amount DECIMAL(14,2) NOT NULL,
  fees DECIMAL(14,2) NOT NULL DEFAULT 0,
  reference VARCHAR(120) NULL,
  note TEXT NULL,
  created_at DATETIME NOT NULL, created_by INT NULL,
  updated_at DATETIME NOT NULL, updated_by INT NULL,
  INDEX (date), INDEX (account_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- GST registers ----------
CREATE TABLE IF NOT EXISTS gst_purchases (
  id INT AUTO_INCREMENT PRIMARY KEY,
  date DATE NOT NULL,
  supplier VARCHAR(190) NOT NULL,
  gstin VARCHAR(20) NULL,
  invoice_no VARCHAR(60) NULL,
  taxable DECIMAL(14,2) NOT NULL DEFAULT 0,
  gst DECIMAL(14,2) NOT NULL DEFAULT 0,
  total DECIMAL(14,2) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL, created_by INT NULL,
  updated_at DATETIME NOT NULL, updated_by INT NULL,
  INDEX (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS gst_sales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  date DATE NOT NULL,
  party VARCHAR(190) NOT NULL,
  gstin VARCHAR(20) NULL,
  invoice_no VARCHAR(60) NULL,
  taxable DECIMAL(14,2) NOT NULL DEFAULT 0,
  gst DECIMAL(14,2) NOT NULL DEFAULT 0,
  total DECIMAL(14,2) NOT NULL DEFAULT 0,
  sale_id INT NULL,
  created_at DATETIME NOT NULL, created_by INT NULL,
  updated_at DATETIME NOT NULL, updated_by INT NULL,
  INDEX (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- Money ----------
-- Opening balances, capital put in, withdrawals and corrections.
CREATE TABLE IF NOT EXISTS account_entries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  date DATE NOT NULL,
  account_id INT NOT NULL,
  direction ENUM('in','out') NOT NULL,
  kind ENUM('opening','capital','withdrawal','correction','other') NOT NULL DEFAULT 'other',
  amount DECIMAL(14,2) NOT NULL,
  note TEXT NULL,
  created_at DATETIME NOT NULL, created_by INT NULL,
  updated_at DATETIME NOT NULL, updated_by INT NULL,
  INDEX (account_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS account_transfers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  date DATE NOT NULL,
  from_account_id INT NOT NULL,
  to_account_id INT NOT NULL,
  amount DECIMAL(14,2) NOT NULL,
  note TEXT NULL,
  created_at DATETIME NOT NULL, created_by INT NULL,
  updated_at DATETIME NOT NULL, updated_by INT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- Stock ----------
-- mode 'set' means "on this date the count was exactly quantity".
CREATE TABLE IF NOT EXISTS stock_adjustments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  date DATE NOT NULL,
  design_id INT NOT NULL,
  location_id INT NOT NULL,
  mode ENUM('add','remove','set') NOT NULL DEFAULT 'add',
  quantity INT NOT NULL,
  reason VARCHAR(60) NOT NULL,
  note TEXT NULL,
  created_at DATETIME NOT NULL, created_by INT NULL,
  updated_at DATETIME NOT NULL, updated_by INT NULL,
  INDEX (design_id, location_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS stock_transfers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  date DATE NOT NULL,
  design_id INT NOT NULL,
  from_location_id INT NOT NULL,
  to_location_id INT NOT NULL,
  quantity INT NOT NULL,
  note TEXT NULL,
  created_at DATETIME NOT NULL, created_by INT NULL,
  updated_at DATETIME NOT NULL, updated_by INT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- Housekeeping ----------
CREATE TABLE IF NOT EXISTS activity_log (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  user_id INT NULL,
  action VARCHAR(20) NOT NULL,
  entity VARCHAR(40) NOT NULL,
  entity_id INT NULL,
  summary VARCHAR(255) NOT NULL,
  data JSON NULL,
  INDEX (at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS settings (
  k VARCHAR(60) PRIMARY KEY,
  v TEXT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
