# 코드 스타일 및 컨벤션

## 핵심 원칙
1. **모듈 분리**: 코드가 길어지면 반드시 파일 분리
2. **기능별 파일**: 하나의 파일 = 하나의 기능/책임
3. **import/export**: ES Module 방식으로 불러오기
4. **보안 준수**: API 키 노출 금지, 입력값 검증, XSS 방지

## 언어 선택
- **JavaScript (ES6+)** + **JSDoc 타입 명시**
- TypeScript 빌드 없이 타입 혜택 받기
- jsconfig.json으로 VSCode 타입 체크 활성화

## JSDoc 타입 예시
```javascript
/**
 * @typedef {Object} PriceData
 * @property {string} symbol
 * @property {number} price
 */

/**
 * @param {PriceData} data
 * @returns {HTMLDivElement}
 */
function createPriceCard(data) {
    // ...
}
```

## 모듈 분리 기준
- 파일당 200줄 이상이면 분리 검토
- 함수가 50줄 이상이면 분리 검토
- 관련 기능끼리 같은 디렉터리에 배치
- index.js로 re-export하여 깔끔하게 import

## 보안 규칙
1. API 키: .env 파일 사용 (gitignore 필수)
2. Electron: nodeIntegration: false, contextIsolation: true
3. SQL: parameterized query 사용
4. 입력값: sanitize 함수로 검증

## 일반 규칙
- 들여쓰기: 2 spaces
- 문자열: 작은따옴표 (')
- 세미콜론: 사용
- 줄바꿈: LF

## 네이밍
- 파일명: kebab-case (예: price-card.js)
- 함수/변수: camelCase
- 상수: UPPER_SNAKE_CASE
- CSS 클래스: BEM 스타일

## UI 관련
- 이모지 사용 금지 → Font Awesome 사용
- 폰트: TheJamsil (CDN)
