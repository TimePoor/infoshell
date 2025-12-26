# #InfoHouse 데이터베이스 스키마

## 개요

#InfoHouse는 SQLite 데이터베이스를 사용하며, `better-sqlite3` 라이브러리로 접근합니다.

**파일 위치**: `data/infohouse.db`

---

## 테이블

### 1. prices (시세 원본 데이터)

수집된 모든 시세 데이터를 저장합니다.

```sql
CREATE TABLE prices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,        -- 카테고리
    symbol TEXT NOT NULL,          -- 심볼
    price REAL NOT NULL,           -- 현재가
    change_rate REAL,              -- 변동률 (%)
    change_amount REAL,            -- 변동액
    unit TEXT,                     -- 단위 ('KRW', 'USD')
    collected_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_prices_symbol ON prices(symbol);
CREATE INDEX idx_prices_collected ON prices(collected_at);
```

**카테고리 값**:
| category | 설명 |
|----------|------|
| gold | 금 |
| silver | 은 |
| oil | 유가 |
| exchange | 환율 |
| crypto | 암호화폐 |
| economic | 경제지표 |

**심볼 값**:
| symbol | 설명 |
|--------|------|
| XAU | 금 |
| XAG | 은 |
| WTI | WTI 원유 |
| BRENT | 브렌트유 |
| USD | 미국 달러 |
| CNY | 중국 위안 |
| JPY | 일본 엔 |
| EUR | 유로 |
| VND | 베트남 동 |
| RUB | 러시아 루블 |
| BTC | 비트코인 |
| ETH | 이더리움 |
| CPI | 소비자물가지수 |
| RATE | 기준금리 |

---

### 2. daily_summary (일별 요약)

일별 시가, 고가, 저가, 종가, 평균가를 저장합니다.

```sql
CREATE TABLE daily_summary (
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

CREATE INDEX idx_daily_symbol_date ON daily_summary(symbol, date);
```

**UPSERT 로직**:
- 같은 symbol + date가 있으면 UPDATE
- high_price는 MAX 값으로 갱신
- low_price는 MIN 값으로 갱신
- avg_price는 누적 평균 계산

---

### 3. trends (트렌드 키워드)

Google Trends, 네이버 데이터랩 키워드를 저장합니다.

```sql
CREATE TABLE trends (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source TEXT NOT NULL,          -- 'google', 'naver'
    keyword TEXT NOT NULL,         -- 키워드
    rank INTEGER,                  -- 순위 (1~10)
    collected_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_trends_collected ON trends(collected_at);
```

---

### 4. settings (앱 설정)

앱 설정을 key-value 형태로 저장합니다.

```sql
CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT,                    -- JSON 문자열로 저장
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**주요 설정 키**:
| key | 설명 | 기본값 |
|-----|------|--------|
| miniModeSymbols | 미니 모드에 표시할 심볼 | `["BTC","USD","XAU"]` |
| collectInterval | 수집 간격 (분) | `60` |
| theme | 테마 | `"light"` |
| alwaysOnTop | 항상 위에 표시 | `true` |

---

## 주요 쿼리

### 최신 가격 조회 (심볼별)

```sql
SELECT p.* FROM prices p
INNER JOIN (
    SELECT symbol, MAX(collected_at) as max_time
    FROM prices
    GROUP BY symbol
) latest ON p.symbol = latest.symbol 
        AND p.collected_at = latest.max_time
ORDER BY p.category, p.symbol;
```

### 차트 데이터 조회 (최근 N일)

```sql
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
LIMIT ?;
```

### 일별 요약 UPSERT

```sql
INSERT INTO daily_summary 
    (symbol, date, open_price, high_price, low_price, close_price, avg_price, count)
VALUES (?, ?, ?, ?, ?, ?, ?, 1)
ON CONFLICT(symbol, date) DO UPDATE SET
    high_price = MAX(high_price, excluded.high_price),
    low_price = MIN(low_price, excluded.low_price),
    close_price = excluded.close_price,
    avg_price = (avg_price * count + excluded.avg_price) / (count + 1),
    count = count + 1;
```

### 최근 1시간 트렌드 조회

```sql
SELECT * FROM trends
WHERE collected_at >= datetime('now', '-1 hour')
ORDER BY source, rank;
```

---

## ERD

```
┌─────────────────┐
│     prices      │
├─────────────────┤
│ id (PK)         │
│ category        │
│ symbol          │──────┐
│ price           │      │
│ change_rate     │      │
│ unit            │      │
│ collected_at    │      │
└─────────────────┘      │
                         │
┌─────────────────┐      │
│  daily_summary  │      │
├─────────────────┤      │
│ id (PK)         │      │
│ symbol          │◄─────┘
│ date            │
│ open_price      │
│ high_price      │
│ low_price       │
│ close_price     │
│ avg_price       │
│ count           │
└─────────────────┘

┌─────────────────┐      ┌─────────────────┐
│     trends      │      │    settings     │
├─────────────────┤      ├─────────────────┤
│ id (PK)         │      │ key (PK)        │
│ source          │      │ value           │
│ keyword         │      │ updated_at      │
│ rank            │      └─────────────────┘
│ collected_at    │
└─────────────────┘
```

---

## 백업

SQLite 파일을 직접 복사하여 백업할 수 있습니다:

```bash
cp data/infohouse.db data/infohouse_backup_$(date +%Y%m%d).db
```
