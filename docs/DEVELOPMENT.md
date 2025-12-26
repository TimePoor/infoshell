# #InfoHouse 개발 가이드

## 개발 환경 설정

### 필수 요구사항
- Node.js 18.x 이상
- npm 9.x 이상
- Windows / macOS / Linux

### 설치

```bash
# 저장소 클론
cd C:\hashtag

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일을 열어 API 키 설정
```

### 실행

```bash
# 개발 모드 (DevTools 활성화)
npm run dev

# 일반 실행
npm start
```

---

## 프로젝트 구조

```
src/
├── main/           # Electron Main Process
│   ├── index.js    # 앱 진입점
│   ├── window.js   # 윈도우 관리
│   ├── tray.js     # 시스템 트레이
│   ├── ipc.js      # IPC 핸들러
│   └── preload.js  # Preload 스크립트
│
├── renderer/       # Electron Renderer Process
│   ├── index.html  # 메인 HTML
│   ├── mini.html   # 미니 모드 HTML
│   ├── css/        # 스타일
│   └── js/         # 클라이언트 스크립트
│
├── services/       # 비즈니스 로직
│   ├── collector/  # 데이터 수집기
│   └── scheduler.js
│
├── database/       # SQLite 관련
│   ├── index.js    # DB 연결
│   └── queries.js  # SQL 쿼리
│
├── types/          # JSDoc 타입 정의
│   └── index.js
│
└── utils/          # 유틸리티
    └── format.js
```

---

## 코딩 컨벤션

### JSDoc 타입 명시

모든 함수에 JSDoc 주석으로 타입을 명시합니다:

```javascript
/**
 * 가격 카드 생성
 * @param {PriceData} data - 가격 데이터
 * @returns {HTMLDivElement} 카드 엘리먼트
 */
function createPriceCard(data) {
  // ...
}
```

### 타입 정의

`src/types/index.js`에 공통 타입을 정의합니다:

```javascript
/**
 * @typedef {Object} PriceData
 * @property {string} symbol
 * @property {number} price
 * @property {number} [change]
 */
```

### 네이밍 규칙

| 대상 | 규칙 | 예시 |
|------|------|------|
| 파일 | kebab-case | `price-card.js` |
| 함수/변수 | camelCase | `formatNumber` |
| 상수 | UPPER_SNAKE_CASE | `API_URL` |
| CSS 클래스 | BEM | `price-card__title` |

### 모듈 분리 기준

- 파일당 200줄 이상 → 분리 검토
- 함수당 50줄 이상 → 분리 검토
- 하나의 파일 = 하나의 기능/책임

---

## 새 수집기 추가하기

### 1. 수집기 파일 생성

`src/services/collector/` 디렉터리에 새 파일 생성:

```javascript
// src/services/collector/oil.js

const axios = require('axios');
const { insertPrice } = require('../../database/queries.js');

/**
 * 유가 수집
 * @returns {Promise<import('../../types/index.js').CollectResult>}
 */
async function collectOil() {
  try {
    // API 호출 또는 크롤링
    const response = await axios.get('...');
    
    /** @type {import('../../types/index.js').PriceData} */
    const data = {
      category: 'oil',
      symbol: 'WTI',
      price: response.data.price,
      unit: 'USD',
      collectedAt: new Date()
    };

    insertPrice(data);
    
    return { success: true, data: [data] };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

module.exports = {
  collectOil
};
```

### 2. 수집기 매니저에 등록

`src/services/collector/index.js` 수정:

```javascript
const { collectOil } = require('./oil.js');

const collectors = [
  { name: 'gold', fn: collectGold },
  { name: 'oil', fn: collectOil },  // 추가
  // ...
];
```

---

## 데이터베이스

### 테이블 구조

```sql
-- 시세 원본
prices (id, category, symbol, price, change_rate, unit, collected_at)

-- 일별 요약
daily_summary (id, symbol, date, open_price, high_price, low_price, close_price, avg_price)

-- 트렌드
trends (id, source, keyword, rank, collected_at)

-- 설정
settings (key, value, updated_at)
```

### 쿼리 추가

`src/database/queries.js`에 새 쿼리 함수 추가:

```javascript
/**
 * 특정 기간 평균 가격 조회
 * @param {string} symbol
 * @param {number} days
 * @returns {number}
 */
function getAveragePrice(symbol, days) {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT AVG(price) as avg
    FROM prices
    WHERE symbol = ?
      AND collected_at >= datetime('now', '-' || ? || ' days')
  `);
  const result = stmt.get(symbol, days);
  return result?.avg || 0;
}
```

---

## IPC 통신

### 새 핸들러 추가

`src/main/ipc.js`에 핸들러 추가:

```javascript
ipcMain.handle('custom:action', async (event, param) => {
  try {
    const result = doSomething(param);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
```

### Preload 노출

`src/main/preload.js`에 API 노출:

```javascript
contextBridge.exposeInMainWorld('infohouse', {
  // 기존 API...
  
  customAction: (param) => ipcRenderer.invoke('custom:action', param),
});
```

---

## 빌드

### Windows 빌드

```bash
npm run build:win
```

결과물: `dist/InfoHouse Setup x.x.x.exe`

### macOS 빌드

```bash
npm run build:mac
```

결과물: `dist/InfoHouse-x.x.x.dmg`

### Linux 빌드

```bash
npm run build:linux
```

결과물: `dist/InfoHouse-x.x.x.AppImage`

---

## 디버깅

### DevTools 열기

개발 모드로 실행하면 자동으로 DevTools가 열립니다:

```bash
npm run dev
```

### 로그 확인

Main Process 로그는 터미널에, Renderer Process 로그는 DevTools Console에서 확인합니다.

### 데이터베이스 확인

SQLite 파일 위치: `data/infohouse.db`

DB Browser for SQLite 등의 도구로 직접 확인 가능합니다.
