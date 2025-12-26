/**
 * #InfoHouse - SQL 쿼리 모음
 */

const { getDatabase } = require('./index.js');

// ============================================
// 가격 관련 쿼리
// ============================================

/**
 * 가격 데이터 저장
 * @param {import('../types/index.js').PriceData} data
 * @returns {number} - 삽입된 row ID
 */
function insertPrice(data) {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO prices (category, symbol, price, change_rate, change_amount, unit)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    data.category,
    data.symbol,
    data.price,
    data.change || null,
    data.changeAmount || null,
    data.unit || 'KRW'
  );
  return result.lastInsertRowid;
}

/**
 * 특정 심볼의 최신 가격 조회
 * @param {string} symbol
 * @returns {import('../types/index.js').PriceData|undefined}
 */
function getPrice(symbol) {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT * FROM prices 
    WHERE symbol = ? 
    ORDER BY collected_at DESC 
    LIMIT 1
  `);
  return stmt.get(symbol);
}

/**
 * 모든 심볼의 최신 가격 조회
 * @returns {import('../types/index.js').PriceData[]}
 */
function getLatestPrices() {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT p.* FROM prices p
    INNER JOIN (
      SELECT symbol, MAX(id) as max_id
      FROM prices
      GROUP BY symbol
    ) latest ON p.id = latest.max_id
    ORDER BY p.category, p.symbol
  `);
  return stmt.all();
}

/**
 * 차트용 히스토리 조회
 * daily_summary가 없으면 prices 테이블에서 직접 조회
 * @param {string} symbol
 * @param {number} days
 * @returns {import('../types/index.js').ChartData[]}
 */
function getPriceHistory(symbol, days = 30) {
  const db = getDatabase();
  
  // 먼저 daily_summary에서 조회
  const summaryStmt = db.prepare(`
    SELECT 
      date as time,
      open_price as open,
      high_price as high,
      low_price as low,
      close_price as close,
      avg_price as avg
    FROM daily_summary
    WHERE symbol = ?
    ORDER BY date DESC
    LIMIT ?
  `);
  const summaryData = summaryStmt.all(symbol, days);
  
  if (summaryData.length > 0) {
    return summaryData.reverse();
  }
  
  // daily_summary가 없으면 prices 테이블에서 직접 조회
  const pricesStmt = db.prepare(`
    SELECT 
      strftime('%Y-%m-%d %H:%M', collected_at) as time,
      price as close,
      price as avg
    FROM prices
    WHERE symbol = ?
    ORDER BY collected_at DESC
    LIMIT ?
  `);
  return pricesStmt.all(symbol, days * 24).reverse();  // 시간별 데이터
}

// ============================================
// 일별 요약 관련 쿼리
// ============================================

/**
 * 일별 요약 업데이트 또는 삽입
 * @param {import('../types/index.js').DailySummary} data
 */
function upsertDailySummary(data) {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO daily_summary (symbol, date, open_price, high_price, low_price, close_price, avg_price, count)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(symbol, date) DO UPDATE SET
      high_price = MAX(high_price, excluded.high_price),
      low_price = MIN(low_price, excluded.low_price),
      close_price = excluded.close_price,
      avg_price = (avg_price * count + excluded.avg_price) / (count + 1),
      count = count + 1
  `);
  stmt.run(
    data.symbol,
    data.date,
    data.openPrice,
    data.highPrice,
    data.lowPrice,
    data.closePrice,
    data.avgPrice,
    1
  );
}

// ============================================
// 트렌드 관련 쿼리
// ============================================

/**
 * 트렌드 키워드 저장
 * @param {import('../types/index.js').TrendKeyword[]} trends
 */
function insertTrends(trends) {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO trends (source, keyword, rank)
    VALUES (?, ?, ?)
  `);

  const insertMany = db.transaction((items) => {
    for (const item of items) {
      stmt.run(item.source, item.keyword, item.rank);
    }
  });

  insertMany(trends);
}

/**
 * 트렌드 키워드 조회 (중복 제거)
 * @param {string} source - 'google_kr', 'google_us', 'zum', 'all'
 * @returns {import('../types/index.js').TrendKeyword[]}
 */
function getTrends(source = 'all') {
  const db = getDatabase();
  
  // 소스별로 가장 최근 수집된 데이터에서 중복 키워드 제거
  if (source === 'all') {
    const stmt = db.prepare(`
      SELECT source, keyword, MIN(rank) as rank
      FROM trends
      WHERE collected_at >= datetime('now', '-1 hour')
      GROUP BY source, keyword
      ORDER BY source, rank
    `);
    return stmt.all();
  }

  const stmt = db.prepare(`
    SELECT source, keyword, MIN(rank) as rank
    FROM trends
    WHERE source = ? AND collected_at >= datetime('now', '-1 hour')
    GROUP BY keyword
    ORDER BY rank
  `);
  return stmt.all(source);
}

// ============================================
// 설정 관련 쿼리
// ============================================

/**
 * 설정 조회
 * @param {string} key
 * @returns {*}
 */
function getSetting(key) {
  const db = getDatabase();
  const stmt = db.prepare('SELECT value FROM settings WHERE key = ?');
  const row = stmt.get(key);
  if (!row) return null;
  
  try {
    return JSON.parse(row.value);
  } catch {
    return row.value;
  }
}

/**
 * 설정 저장
 * @param {string} key
 * @param {*} value
 */
function setSetting(key, value) {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO settings (key, value, updated_at)
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET
      value = excluded.value,
      updated_at = datetime('now')
  `);
  stmt.run(key, JSON.stringify(value));
}

/**
 * 오늘 통계 조회
 * @param {string} symbol
 * @returns {{ high: number, low: number, avg: number, count: number } | null}
 */
function getTodayStats(symbol) {
  const db = getDatabase();
  // CURRENT_TIMESTAMP는 UTC 기준이므로, KST(+9시간) 기준으로 오늘 날짜 계산
  const stmt = db.prepare(`
    SELECT 
      MAX(price) as high,
      MIN(price) as low,
      AVG(price) as avg,
      COUNT(*) as count
    FROM prices
    WHERE symbol = ?
    AND date(collected_at, '+9 hours') = date('now', '+9 hours')
  `);
  const result = stmt.get(symbol);
  if (!result || result.count === 0) return null;
  return {
    high: Math.round(result.high),
    low: Math.round(result.low),
    avg: Math.round(result.avg),
    count: result.count
  };
}

/**
 * 주간 통계 조회 (7일)
 * @param {string} symbol
 * @returns {{ high: number, low: number, change: number, count: number } | null}
 */
function getWeekStats(symbol) {
  const db = getDatabase();
  
  // 7일간 최고/최저 (UTC 기준, KST 변환 불필요 - 7일 범위라 큰 영향 없음)
  const statsStmt = db.prepare(`
    SELECT 
      MAX(price) as high,
      MIN(price) as low,
      COUNT(*) as count
    FROM prices
    WHERE symbol = ?
    AND collected_at >= datetime('now', '-7 days')
  `);
  const stats = statsStmt.get(symbol);
  
  if (!stats || stats.count === 0) return null;
  
  // 7일 전 가격 (변동률 계산용)
  const oldPriceStmt = db.prepare(`
    SELECT price FROM prices
    WHERE symbol = ?
    AND collected_at >= datetime('now', '-7 days')
    ORDER BY collected_at ASC
    LIMIT 1
  `);
  const oldPrice = oldPriceStmt.get(symbol);
  
  // 현재 가격
  const currentPriceStmt = db.prepare(`
    SELECT price FROM prices
    WHERE symbol = ?
    ORDER BY collected_at DESC
    LIMIT 1
  `);
  const currentPrice = currentPriceStmt.get(symbol);
  
  let change = 0;
  if (oldPrice && currentPrice && oldPrice.price > 0) {
    change = ((currentPrice.price - oldPrice.price) / oldPrice.price) * 100;
  }
  
  return {
    high: Math.round(stats.high),
    low: Math.round(stats.low),
    change: Math.round(change * 100) / 100,
    count: stats.count
  };
}

// ============================================
// 일정 관련 쿼리
// ============================================

/**
 * 일정 추가
 * @param {string} date - YYYY-MM-DD
 * @param {string} text
 */
function addSchedule(date, text) {
  const db = getDatabase();
  const stmt = db.prepare('INSERT INTO schedules (date, text) VALUES (?, ?)');
  return stmt.run(date, text);
}

/**
 * 특정 날짜 일정 조회
 * @param {string} date - YYYY-MM-DD
 */
function getSchedulesByDate(date) {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM schedules WHERE date = ? ORDER BY created_at');
  return stmt.all(date);
}

/**
 * 월별 일정 있는 날짜 조회
 * @param {string} yearMonth - YYYY-MM
 */
function getScheduleDates(yearMonth) {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT DISTINCT date FROM schedules 
    WHERE date LIKE ? || '%'
  `);
  return stmt.all(yearMonth).map(r => r.date);
}

/**
 * 일정 삭제
 * @param {number} id
 */
function deleteSchedule(id) {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM schedules WHERE id = ?');
  return stmt.run(id);
}

// ============================================
// 투두 관련 쿼리
// ============================================

/**
 * 투두 추가
 * @param {string} text
 */
function addTodo(text) {
  const db = getDatabase();
  const stmt = db.prepare('INSERT INTO todos (text) VALUES (?)');
  return stmt.run(text);
}

/**
 * 모든 투두 조회
 */
function getTodos() {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM todos ORDER BY created_at DESC');
  return stmt.all();
}

/**
 * 투두 완료 토글
 * @param {number} id
 * @param {boolean} done
 */
function toggleTodo(id, done) {
  const db = getDatabase();
  const stmt = db.prepare('UPDATE todos SET done = ? WHERE id = ?');
  return stmt.run(done ? 1 : 0, id);
}

/**
 * 투두 삭제
 * @param {number} id
 */
function deleteTodo(id) {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM todos WHERE id = ?');
  return stmt.run(id);
}

module.exports = {
  // 가격
  insertPrice,
  getPrice,
  getLatestPrices,
  getPriceHistory,
  // 통계
  getTodayStats,
  getWeekStats,
  // 일별 요약
  upsertDailySummary,
  // 트렌드
  insertTrends,
  getTrends,
  // 설정
  getSetting,
  setSetting,
  // 일정
  addSchedule,
  getSchedulesByDate,
  getScheduleDates,
  deleteSchedule,
  // 투두
  addTodo,
  getTodos,
  toggleTodo,
  deleteTodo
};
