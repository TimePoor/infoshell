/**
 * INFOShell - 데이터베이스 관리
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { app } = require('electron');

/** @type {Database.Database|null} */
let db = null;

/**
 * 데이터베이스 초기화
 * @returns {Database.Database}
 */
function initDatabase() {
  // 사용자 데이터 폴더 사용 (빌드/개발 모두 호환)
  const userDataPath = app.getPath('userData');
  const dataDir = path.join(userDataPath, 'data');
  
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const dbPath = path.join(dataDir, 'infoshell.db');
  db = new Database(dbPath);

  // WAL 모드 활성화 (성능 향상)
  db.pragma('journal_mode = WAL');

  // 테이블 생성
  createTables();

  console.log('[Database] 초기화 완료:', dbPath);
  return db;
}

/**
 * 테이블 생성
 */
function createTables() {
  // 시세 원본 데이터
  db.exec(`
    CREATE TABLE IF NOT EXISTS prices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      symbol TEXT NOT NULL,
      price REAL NOT NULL,
      change_rate REAL,
      change_amount REAL,
      unit TEXT,
      collected_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 인덱스 생성
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_prices_symbol ON prices(symbol);
    CREATE INDEX IF NOT EXISTS idx_prices_collected ON prices(collected_at);
  `);

  // 일별 요약
  db.exec(`
    CREATE TABLE IF NOT EXISTS daily_summary (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      symbol TEXT NOT NULL,
      date DATE NOT NULL,
      open_price REAL,
      high_price REAL NOT NULL,
      low_price REAL NOT NULL,
      close_price REAL,
      avg_price REAL NOT NULL,
      count INTEGER DEFAULT 0,
      UNIQUE(symbol, date)
    )
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_daily_symbol_date ON daily_summary(symbol, date);
  `);

  // 트렌드 키워드
  db.exec(`
    CREATE TABLE IF NOT EXISTS trends (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source TEXT NOT NULL,
      keyword TEXT NOT NULL,
      rank INTEGER,
      collected_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_trends_collected ON trends(collected_at);
  `);

  // 앱 설정
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 일정
  db.exec(`
    CREATE TABLE IF NOT EXISTS schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      text TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_schedules_date ON schedules(date);
  `);

  // 투두
  db.exec(`
    CREATE TABLE IF NOT EXISTS todos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text TEXT NOT NULL,
      done INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('[Database] 테이블 생성 완료');
}

/**
 * 데이터베이스 인스턴스 반환
 * @returns {Database.Database}
 */
function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
}

/**
 * 데이터베이스 연결 종료
 */
function closeDatabase() {
  if (db) {
    db.close();
    db = null;
    console.log('[Database] 연결 종료');
  }
}

module.exports = {
  initDatabase,
  getDatabase,
  closeDatabase
};
