# #InfoHouse 프로젝트 구조 설계서

## 1. 프로젝트 개요

| 항목 | 내용 |
|------|------|
| **프로젝트명** | #InfoHouse |
| **설명** | 실시간 시세 및 트렌드 대시보드 데스크톱 애플리케이션 |
| **플랫폼** | Electron (Windows/Mac/Linux) |
| **언어** | JavaScript (ES6+ Module + JSDoc 타입) |
| **DB** | SQLite (better-sqlite3) |
| **차트** | TradingView Lightweight Charts |

---

## 2. 핵심 기능

### 2.1 시세 데이터
| 카테고리 | 항목 | 데이터 소스 (예정) |
|----------|------|-------------------|
| 귀금속 | 금, 은 | Investing.com, Yahoo Finance |
| 에너지 | 국제유가 (WTI/Brent) | Yahoo Finance, EIA |
| 환율 | USD, CNY, VND, RUB, JPY, EUR (원화 기준) | 한국은행 ECOS API, ExchangeRate-API |
| 암호화폐 | BTC, ETH | CoinGecko API, Binance API |
| 경제지표 | 소비자물가지수(CPI), 기준금리 | 한국은행 ECOS API |

### 2.2 트렌드 키워드
| 소스 | 방식 |
|------|------|
| Google Trends | SerpAPI 또는 크롤링 |
| 네이버 데이터랩 | 공식 API |

### 2.3 데이터 수집 정책
- **수집 주기**: 1시간마다
- **일별 기록**: 최저가, 최고가, 평균가
- **차트 표시**: 평균가 기준 + 고가/저가 표시 (마우스 오버 시)

### 2.4 UI 모드
| 모드 | 설명 |
|------|------|
| **메인 모드** | 전체 대시보드 (차트, 목록, 트렌드) |
| **미니 모드** | 작은 위젯 형태 (상시 표시용, Always on Top) |

---

## 3. 기술 스택

### 3.1 Frontend
| 기술 | 용도 |
|------|------|
| Electron | 데스크톱 앱 프레임워크 |
| JavaScript (ES6+) | 메인/렌더러 프로세스 |
| JSDoc | 타입 명시 (빌드 없이 타입 체크) |
| HTML/CSS | UI 구성 |
| Font Awesome | 아이콘 (이모지 대체) |
| TheJamsil | 폰트 (CDN) |
| TradingView Lightweight Charts | 시세 차트 |

### 3.2 Backend (Main Process)
| 기술 | 용도 |
|------|------|
| better-sqlite3 | 내장 SQLite DB |
| node-cron | 스케줄링 (1시간마다 수집) |
| axios | HTTP 요청 (API/크롤링) |
| cheerio | HTML 파싱 (크롤링 시) |

### 3.3 빌드/배포
| 기술 | 용도 |
|------|------|
| electron-builder | 앱 패키징 |

---

## 4. 디렉터리 구조

```
C:\hashtag\
├── docs/                          # 문서
│   └── PROJECT_STRUCTURE.md       # 본 문서
│
├── src/                           # 소스 코드
│   ├── main/                      # Electron Main Process
│   │   ├── index.js               # 메인 엔트리포인트
│   │   ├── window.js              # 윈도우 관리 (메인/미니)
│   │   ├── tray.js                # 시스템 트레이
│   │   ├── ipc.js                 # IPC 핸들러
│   │   └── preload.js             # 프리로드 스크립트
│   │
│   ├── renderer/                  # Electron Renderer Process
│   │   ├── index.html             # 메인 HTML
│   │   ├── mini.html              # 미니 모드 HTML
│   │   ├── css/
│   │   │   ├── main.css           # 메인 스타일
│   │   │   ├── mini.css           # 미니 모드 스타일
│   │   │   ├── variables.css      # CSS 변수
│   │   │   └── fonts.css          # 폰트 정의
│   │   └── js/
│   │       ├── app.js             # 메인 앱 로직
│   │       ├── mini.js            # 미니 모드 로직
│   │       ├── chart.js           # TradingView 차트 래퍼
│   │       └── utils.js           # 유틸리티
│   │
│   ├── services/                  # 비즈니스 로직
│   │   ├── collector/             # 데이터 수집
│   │   │   ├── index.js           # 수집기 매니저
│   │   │   ├── gold.js            # 금 시세
│   │   │   ├── silver.js          # 은 시세
│   │   │   ├── oil.js             # 유가
│   │   │   ├── exchange.js        # 환율
│   │   │   ├── crypto.js          # 암호화폐
│   │   │   ├── economic.js        # 경제지표 (CPI, 금리)
│   │   │   └── trends.js          # 트렌드 키워드
│   │   │
│   │   ├── scheduler.js           # 스케줄러 (node-cron)
│   │   └── calculator.js          # 일별 고/저/평균 계산
│   │
│   ├── database/                  # 데이터베이스
│   │   ├── index.js               # DB 연결 관리
│   │   ├── schema.sql             # 테이블 스키마
│   │   └── queries.js             # SQL 쿼리
│   │
│   ├── types/                     # JSDoc 타입 정의
│   │   └── index.js               # 공통 타입 (@typedef)
│   │
│   └── utils/                     # 공통 유틸리티
│       ├── format.js              # 숫자/날짜 포맷
│       ├── logger.js              # 로깅
│       └── config.js              # 설정 관리
│
├── assets/                        # 정적 리소스
│   └── icons/                     # 앱 아이콘
│       ├── icon.ico               # Windows
│       ├── icon.icns              # macOS
│       └── icon.png               # Linux / 트레이
│
├── data/                          # 런타임 데이터 (gitignore)
│   └── infohouse.db               # SQLite DB 파일
│
├── dist/                          # 빌드 결과물 (gitignore)
│
├── package.json
├── jsconfig.json                  # JSDoc 타입 체크 설정
├── electron-builder.yml           # 빌드 설정
├── .gitignore
├── .env.example                   # 환경변수 예시
└── README.md
```

---

## 5. JSDoc 타입 시스템

### 5.1 타입 정의 예시 (src/types/index.js)
```javascript
/**
 * 가격 데이터
 * @typedef {Object} PriceData
 * @property {string} symbol - 심볼 (예: 'XAU', 'BTC')
 * @property {string} category - 카테고리
 * @property {number} price - 현재가
 * @property {number} [change] - 변동률
 * @property {string} [unit] - 단위 ('KRW', 'USD')
 * @property {Date} collectedAt - 수집 시간
 */

/**
 * 일별 요약 데이터
 * @typedef {Object} DailySummary
 * @property {string} symbol
 * @property {string} date - 'YYYY-MM-DD'
 * @property {number} openPrice - 시가
 * @property {number} highPrice - 고가
 * @property {number} lowPrice - 저가
 * @property {number} closePrice - 종가
 * @property {number} avgPrice - 평균가
 */

/**
 * 차트 데이터 (TradingView 형식)
 * @typedef {Object} ChartData
 * @property {string} time - 'YYYY-MM-DD'
 * @property {number} open
 * @property {number} high
 * @property {number} low
 * @property {number} close
 */

/**
 * 트렌드 키워드
 * @typedef {Object} TrendKeyword
 * @property {string} source - 'google' | 'naver'
 * @property {string} keyword
 * @property {number} rank
 * @property {Date} collectedAt
 */

export {};
```

### 5.2 함수에서 사용
```javascript
import './types/index.js';

/**
 * 가격 카드 생성
 * @param {PriceData} data
 * @returns {HTMLDivElement}
 */
function createPriceCard(data) {
    const card = document.createElement('div');
    card.innerHTML = `
        <h3>${data.symbol}</h3>
        <p>${data.price.toLocaleString()}${data.unit}</p>
    `;
    return card;
}
```

### 5.3 jsconfig.json
```json
{
  "compilerOptions": {
    "checkJs": true,
    "strict": true,
    "module": "ESNext",
    "moduleResolution": "node",
    "target": "ES2020",
    "baseUrl": "./src",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

---

## 6. 데이터베이스 스키마

### 6.1 prices (시세 원본 데이터)
```sql
CREATE TABLE prices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,
    symbol TEXT NOT NULL,
    price REAL NOT NULL,
    unit TEXT,
    collected_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_prices_symbol ON prices(symbol);
CREATE INDEX idx_prices_collected ON prices(collected_at);
```

### 6.2 daily_summary (일별 요약)
```sql
CREATE TABLE daily_summary (
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
);

CREATE INDEX idx_daily_symbol_date ON daily_summary(symbol, date);
```

### 6.3 trends (트렌드 키워드)
```sql
CREATE TABLE trends (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source TEXT NOT NULL,
    keyword TEXT NOT NULL,
    rank INTEGER,
    collected_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_trends_collected ON trends(collected_at);
```

### 6.4 settings (앱 설정)
```sql
CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 7. IPC 통신 구조

### 7.1 Main → Renderer
| 채널 | 설명 |
|------|------|
| `price:update` | 새 시세 데이터 전송 |
| `trend:update` | 새 트렌드 데이터 전송 |
| `collect:status` | 수집 상태 (시작/완료/에러) |

### 7.2 Renderer → Main
| 채널 | 설명 |
|------|------|
| `price:get` | 특정 심볼 시세 조회 |
| `price:history` | 차트용 히스토리 조회 |
| `trend:get` | 트렌드 조회 |
| `collect:manual` | 수동 수집 트리거 |
| `window:mini` | 미니 모드 전환 |
| `window:main` | 메인 모드 전환 |
| `settings:get` | 설정 조회 |
| `settings:set` | 설정 저장 |

---

## 8. 미니 모드 사양

| 항목 | 값 |
|------|-----|
| 크기 | 300 x 400 px (조절 가능) |
| 위치 | 화면 우측 하단 (드래그 이동 가능) |
| 속성 | Always on Top, Frameless |
| 표시 내용 | 주요 시세 5~10개 (설정 가능) |
| 기능 | 클릭 시 메인 창 열기, 트레이 아이콘 |

---

## 9. 폰트 및 아이콘

### 9.1 폰트
```css
@font-face {
    font-family: 'TheJamsil';
    src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2302_01@1.0/TheJamsil3Regular.woff2') format('woff2');
    font-weight: 400;
    font-display: swap;
}
```

### 9.2 아이콘
- Font Awesome 6 Free (CDN)
- 이모지 사용 안함

---

## 10. 코드 구조 원칙

### 10.1 모듈 분리
- 파일당 200줄 이상 → 분리 검토
- 함수당 50줄 이상 → 분리 검토
- 하나의 파일 = 하나의 기능/책임

### 10.2 import/export 패턴
```javascript
// services/collector/index.js (진입점)
export { GoldCollector } from './gold.js';
export { ExchangeCollector } from './exchange.js';

// 사용처
import { GoldCollector } from './services/collector/index.js';
```

---

## 11. 보안 설계

### 11.1 Electron 보안 설정
```javascript
const mainWindow = new BrowserWindow({
    webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js'),
        webSecurity: true,
    }
});
```

### 11.2 Preload 스크립트
```javascript
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('infohouse', {
    getPrice: (symbol) => ipcRenderer.invoke('price:get', symbol),
    getHistory: (symbol, days) => ipcRenderer.invoke('price:history', symbol, days),
    onPriceUpdate: (callback) => ipcRenderer.on('price:update', (_, data) => callback(data)),
});
```

### 11.3 보안 체크리스트
- [ ] nodeIntegration: false
- [ ] contextIsolation: true
- [ ] API 키 .env 저장 (.gitignore)
- [ ] SQL parameterized query
- [ ] 외부 입력 sanitize

---

## 12. 개발 단계

### Phase 1: 기본 구조 (1주)
- [ ] Electron + JS 프로젝트 세팅
- [ ] jsconfig.json 설정
- [ ] SQLite 연동 및 스키마 생성
- [ ] 기본 윈도우 구현
- [ ] CSS/폰트 세팅

### Phase 2: 데이터 수집 (2주)
- [ ] 환율 API 연동
- [ ] 암호화폐 API 연동
- [ ] 금/은/유가 크롤링
- [ ] 스케줄러 구현
- [ ] 일별 요약 계산

### Phase 3: UI 구현 (2주)
- [ ] 메인 대시보드
- [ ] TradingView 차트 연동
- [ ] 시세 카드 컴포넌트
- [ ] 설정 패널

### Phase 4: 미니 모드 (1주)
- [ ] 미니 윈도우
- [ ] 시스템 트레이
- [ ] 메인↔미니 전환

### Phase 5: 마무리 (1주)
- [ ] 빌드 및 패키징
- [ ] 테스트

---

## 13. 참고 링크

- [Electron 공식 문서](https://www.electronjs.org/docs)
- [TradingView Lightweight Charts](https://github.com/nickvdyck/lightweight-charts)
- [한국은행 ECOS API](https://ecos.bok.or.kr/)
- [CoinGecko API](https://www.coingecko.com/en/api)
- [JSDoc 문서](https://jsdoc.app/)
