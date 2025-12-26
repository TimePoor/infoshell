# #InfoHouse 보안 가이드

## 개요

이 문서는 #InfoHouse 앱의 보안 설계 및 가이드라인을 설명합니다.

---

## 1. Electron 보안 설정

### 1.1 필수 보안 옵션

```javascript
const mainWindow = new BrowserWindow({
    webPreferences: {
        nodeIntegration: false,      // Node.js 직접 접근 차단
        contextIsolation: true,      // 컨텍스트 격리
        preload: path.join(__dirname, 'preload.js'),
        webSecurity: true,           // 웹 보안 활성화
        allowRunningInsecureContent: false,
    }
});
```

| 옵션 | 값 | 설명 |
|------|-----|------|
| nodeIntegration | false | Renderer에서 Node.js API 차단 |
| contextIsolation | true | Preload와 Renderer 컨텍스트 분리 |
| webSecurity | true | 동일 출처 정책 적용 |

### 1.2 Preload 스크립트

Preload 스크립트에서 `contextBridge`를 통해 안전한 API만 노출합니다:

```javascript
// ✅ 좋은 예: 필요한 API만 노출
contextBridge.exposeInMainWorld('infohouse', {
    getPrice: (symbol) => ipcRenderer.invoke('price:get', symbol),
});

// ❌ 나쁜 예: 전체 ipcRenderer 노출
contextBridge.exposeInMainWorld('ipc', ipcRenderer); // 절대 금지!
```

---

## 2. API 키 관리

### 2.1 환경 변수 사용

API 키는 절대 하드코딩하지 않습니다.

```javascript
// ❌ 나쁜 예
const API_KEY = 'abc123xyz';

// ✅ 좋은 예
const API_KEY = process.env.ECOS_API_KEY;
```

### 2.2 .env 파일

```bash
# .env (gitignore에 반드시 포함!)
ECOS_API_KEY=your_api_key_here
STORE_ENCRYPTION_KEY=random_encryption_key
```

### 2.3 .gitignore 설정

```gitignore
# 민감한 파일
.env
.env.local
*.db
```

### 2.4 암호화 저장 (선택)

`electron-store`로 암호화하여 저장:

```javascript
const Store = require('electron-store');
const store = new Store({
    encryptionKey: process.env.STORE_ENCRYPTION_KEY
});

// 저장
store.set('apiKeys.ecos', apiKey);

// 조회
const apiKey = store.get('apiKeys.ecos');
```

---

## 3. 입력값 검증

### 3.1 심볼 검증

```javascript
/**
 * 심볼 문자열 검증 및 정제
 * @param {string} input
 * @returns {string}
 */
function sanitizeSymbol(input) {
    // 허용: 영문 대소문자, 숫자, 일부 특수문자
    return input.replace(/[^A-Za-z0-9_-]/g, '').toUpperCase();
}

// 사용
const safeSymbol = sanitizeSymbol(userInput);
```

### 3.2 SQL Injection 방지

항상 Parameterized Query 사용:

```javascript
// ❌ 나쁜 예 (SQL Injection 취약)
db.exec(`SELECT * FROM prices WHERE symbol = '${symbol}'`);

// ✅ 좋은 예 (Parameterized)
const stmt = db.prepare('SELECT * FROM prices WHERE symbol = ?');
stmt.get(symbol);
```

### 3.3 XSS 방지

DOM 조작 시 `textContent` 사용:

```javascript
// ❌ 나쁜 예 (XSS 취약)
element.innerHTML = userInput;

// ✅ 좋은 예
element.textContent = userInput;

// 또는 템플릿 리터럴 사용 시 escape
function escapeHtml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
```

---

## 4. CSP (Content Security Policy)

### 4.1 메타 태그 설정

```html
<meta http-equiv="Content-Security-Policy" content="
    default-src 'self';
    script-src 'self';
    style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com;
    font-src 'self' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com;
    connect-src 'self' https://api.coingecko.com https://ecos.bok.or.kr;
    img-src 'self' data:;
">
```

### 4.2 CSP 지시자 설명

| 지시자 | 설명 |
|--------|------|
| default-src | 기본 소스 (fallback) |
| script-src | JavaScript 소스 |
| style-src | CSS 소스 |
| font-src | 폰트 소스 |
| connect-src | XHR/Fetch 허용 도메인 |
| img-src | 이미지 소스 |

---

## 5. 네트워크 보안

### 5.1 HTTPS 강제

```javascript
// HTTP 요청 차단
if (url.startsWith('http://') && !url.includes('localhost')) {
    throw new Error('HTTPS only');
}
```

### 5.2 요청 타임아웃

```javascript
const response = await axios.get(url, {
    timeout: 10000  // 10초
});
```

### 5.3 허용 도메인 화이트리스트

```javascript
const ALLOWED_DOMAINS = [
    'api.coingecko.com',
    'ecos.bok.or.kr',
    // ...
];

function isAllowedDomain(url) {
    const domain = new URL(url).hostname;
    return ALLOWED_DOMAINS.includes(domain);
}
```

---

## 6. 보안 체크리스트

### 개발 시

- [ ] `nodeIntegration: false` 확인
- [ ] `contextIsolation: true` 확인
- [ ] API 키 .env 파일에 저장
- [ ] .gitignore에 민감 파일 추가
- [ ] SQL은 Parameterized Query 사용
- [ ] DOM 조작 시 XSS 방지
- [ ] CSP 헤더 설정

### 배포 전

- [ ] .env 파일 제외 확인
- [ ] DevTools 비활성화 (프로덕션)
- [ ] 하드코딩된 키 없음 확인
- [ ] 의존성 보안 취약점 검사 (`npm audit`)

### 프로덕션

```javascript
// DevTools 비활성화
if (!process.argv.includes('--dev')) {
    mainWindow.webContents.on('devtools-opened', () => {
        mainWindow.webContents.closeDevTools();
    });
}
```

---

## 7. 의존성 관리

### 보안 취약점 검사

```bash
# 취약점 검사
npm audit

# 자동 수정
npm audit fix
```

### 정기적인 업데이트

```bash
# outdated 패키지 확인
npm outdated

# 업데이트
npm update
```

---

## 8. 문제 보고

보안 취약점 발견 시 아래 절차를 따릅니다:

1. 공개적으로 이슈를 생성하지 않습니다
2. 직접 담당자에게 비공개로 보고합니다
3. 재현 방법과 영향 범위를 상세히 기술합니다
