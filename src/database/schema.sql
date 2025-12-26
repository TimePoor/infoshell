-- #InfoHouse Database Schema

-- 시세 원본 데이터
CREATE TABLE IF NOT EXISTS prices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,        -- 'gold', 'silver', 'oil', 'exchange', 'crypto', 'economic'
    symbol TEXT NOT NULL,          -- 'XAU', 'XAG', 'WTI', 'USD', 'BTC', 'CPI' 등
    price REAL NOT NULL,           -- 현재가
    unit TEXT,                     -- 'KRW', 'USD', '%' 등
    collected_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_prices_symbol ON prices(symbol);
CREATE INDEX IF NOT EXISTS idx_prices_collected ON prices(collected_at);

-- 일별 요약
CREATE TABLE IF NOT EXISTS daily_summary (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol TEXT NOT NULL,
    date DATE NOT NULL,
    open_price REAL,               -- 시가 (당일 첫 수집)
    high_price REAL NOT NULL,      -- 고가
    low_price REAL NOT NULL,       -- 저가
    close_price REAL,              -- 종가 (당일 마지막 수집)
    avg_price REAL NOT NULL,       -- 평균가
    count INTEGER DEFAULT 0,       -- 수집 횟수
    UNIQUE(symbol, date)
);

CREATE INDEX IF NOT EXISTS idx_daily_symbol_date ON daily_summary(symbol, date);

-- 트렌드 키워드
CREATE TABLE IF NOT EXISTS trends (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source TEXT NOT NULL,          -- 'google', 'naver'
    keyword TEXT NOT NULL,
    rank INTEGER,
    collected_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_trends_collected ON trends(collected_at);

-- 앱 설정
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
