# #InfoHouse 프로젝트 개요

## 프로젝트 정보
- **이름**: #InfoHouse
- **설명**: 실시간 시세 및 트렌드 대시보드 데스크톱 앱
- **플랫폼**: Electron (Windows/Mac/Linux)
- **언어**: JavaScript (ES6+ Module + JSDoc 타입)

## 핵심 기능
1. 시세 데이터: 금/은/유가/환율(USD,CNY,VND,RUB,JPY,EUR)/BTC,ETH/CPI/기준금리
2. 트렌드 키워드: Google Trends, 네이버 데이터랩
3. 수집 주기: 1시간마다
4. 일별 기록: 고가/저가/평균가
5. 미니 위젯 모드 지원

## 기술 스택
- Electron + JavaScript (ES6+)
- JSDoc (타입 명시, 빌드 없이 타입 체크)
- SQLite (better-sqlite3)
- TradingView Lightweight Charts
- Font Awesome (아이콘)
- TheJamsil 폰트 (CDN)

## 주요 디렉터리
- `src/main/` - Electron Main Process
- `src/renderer/` - Electron Renderer Process  
- `src/services/` - 데이터 수집 및 비즈니스 로직
- `src/database/` - SQLite 관련
- `src/types/` - JSDoc 타입 정의
- `docs/` - 문서

## 참고 문서
- `docs/PROJECT_STRUCTURE.md` - 전체 구조 설계서
