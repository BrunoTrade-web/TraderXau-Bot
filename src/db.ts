import Database from 'better-sqlite3';
import path from 'path';

const db = new Database('quantiva.db');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    plan_type TEXT DEFAULT 'Free',
    risk_limit_percent REAL DEFAULT 1.0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS assets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS signals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    asset_id INTEGER,
    type TEXT NOT NULL,
    entry_price REAL NOT NULL,
    stop_loss REAL NOT NULL,
    take_profit REAL NOT NULL,
    score INTEGER NOT NULL,
    confirmed BOOLEAN DEFAULT 0,
    executed BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(asset_id) REFERENCES assets(id)
  );

  CREATE TABLE IF NOT EXISTS broker_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    broker_name TEXT NOT NULL,
    account_type TEXT DEFAULT 'Demo', -- 'Demo' or 'Real'
    balance REAL DEFAULT 10000.0,
    api_key TEXT,
    api_secret TEXT,
    active BOOLEAN DEFAULT 0,
    is_selected BOOLEAN DEFAULT 0,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS trades_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    signal_id INTEGER,
    user_id INTEGER,
    executed_price REAL,
    profit_loss REAL,
    executed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(signal_id) REFERENCES signals(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

// Seed assets if empty
const assetCount = db.prepare('SELECT COUNT(*) as count FROM assets').get() as { count: number };
if (assetCount.count === 0) {
  const insertAsset = db.prepare('INSERT INTO assets (symbol, name, category) VALUES (?, ?, ?)');
  insertAsset.run('XAUUSD', 'Gold / US Dollar', 'Forex');
  insertAsset.run('EURUSD', 'Euro / US Dollar', 'Forex');
  insertAsset.run('BTCUSD', 'Bitcoin / US Dollar', 'Crypto');
  insertAsset.run('ETHUSD', 'Ethereum / US Dollar', 'Crypto');
  insertAsset.run('GBPUSD', 'British Pound / US Dollar', 'Forex');
  insertAsset.run('USDJPY', 'US Dollar / Japanese Yen', 'Forex');
}

export default db;
