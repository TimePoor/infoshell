-- 문의 테이블
CREATE TABLE IF NOT EXISTS inquiries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  email TEXT NOT NULL,
  content TEXT NOT NULL,
  version TEXT,
  ip TEXT,
  status TEXT DEFAULT 'pending',
  reply TEXT,
  created_at TEXT,
  replied_at TEXT
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_created ON inquiries(created_at);
