-- Neon 数据库表结构
-- 在 Neon Console 的 SQL Editor 中执行此脚本

-- 玩家数据表
CREATE TABLE IF NOT EXISTS players (
  user_id VARCHAR(255) PRIMARY KEY,
  time_diamonds INTEGER DEFAULT 0,
  current_cash NUMERIC DEFAULT 10000,
  current_chapter INTEGER DEFAULT 1,
  current_level INTEGER DEFAULT 1,
  current_phase INTEGER DEFAULT 1,
  equipment JSONB DEFAULT '[]',
  consumables JSONB DEFAULT '[]',
  total_diamonds_earned INTEGER DEFAULT 0,
  total_deaths INTEGER DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 支付记录表（防止重复添加钻石）
CREATE TABLE IF NOT EXISTS payments (
  session_id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  package_id VARCHAR(50) NOT NULL,
  diamonds INTEGER NOT NULL,
  amount NUMERIC NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_players_user_id ON players(user_id);

