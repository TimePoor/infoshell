# #InfoHouse

실시간 시세 및 트렌드 대시보드 데스크톱 애플리케이션

## 기능

- 금/은/유가 시세
- 환율 (USD, CNY, VND, RUB, JPY, EUR)
- 암호화폐 (BTC, ETH)
- 경제지표 (CPI, 기준금리)
- 트렌드 키워드 (Google, Naver)
- 미니 위젯 모드

## 기술 스택

- Electron
- JavaScript (ES6+ Module)
- JSDoc (타입 체크)
- SQLite (better-sqlite3)
- TradingView Lightweight Charts

## 설치

```bash
npm install
```

## 실행

```bash
# 개발 모드
npm run dev

# 일반 실행
npm start
```

## 빌드

```bash
# Windows
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux
```

## 환경 변수

`.env.example`을 `.env`로 복사하고 API 키 설정

```bash
cp .env.example .env
```

## 라이선스

MIT
