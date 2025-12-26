# #InfoHouse API 문서

## 개요

이 문서는 #InfoHouse에서 사용하는 데이터 수집 API와 내부 IPC 통신 API를 설명합니다.

---

## 1. 외부 API (데이터 수집)

### 1.1 CoinGecko API (암호화폐)

**Base URL**: `https://api.coingecko.com/api/v3`

**사용 엔드포인트**:
```
GET /simple/price
```

**파라미터**:
| 파라미터 | 타입 | 설명 |
|----------|------|------|
| ids | string | 코인 ID (comma separated) |
| vs_currencies | string | 기준 통화 (krw) |
| include_24hr_change | boolean | 24시간 변동률 포함 |

**예시**:
```javascript
const response = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
  params: {
    ids: 'bitcoin,ethereum',
    vs_currencies: 'krw',
    include_24hr_change: true
  }
});
```

**응답**:
```json
{
  "bitcoin": {
    "krw": 85000000,
    "krw_24h_change": 2.5
  },
  "ethereum": {
    "krw": 3200000,
    "krw_24h_change": -1.2
  }
}
```

**제한사항**:
- 무료 티어: 분당 10-30 요청
- API 키 불필요

---

### 1.2 한국은행 ECOS API (환율, 경제지표)

**Base URL**: `https://ecos.bok.or.kr/api`

**사용 엔드포인트**:
```
GET /StatisticSearch/{인증키}/{요청유형}/{언어}/{시작}/{끝}/{통계표코드}/{주기}/{검색시작일자}/{검색종료일자}
```

**통계표 코드**:
| 코드 | 데이터 |
|------|--------|
| 731Y001 | 원/달러 환율 |
| 722Y001 | 기준금리 |
| 901Y009 | 소비자물가지수 |

**예시**:
```javascript
const apiKey = process.env.ECOS_API_KEY;
const url = `https://ecos.bok.or.kr/api/StatisticSearch/${apiKey}/json/kr/1/10/731Y001/D/20240101/20240131`;
```

**제한사항**:
- API 키 필요 (ecos.bok.or.kr에서 발급)
- 일 요청 제한 있음

---

## 2. 내부 IPC API

Renderer 프로세스에서 `window.infohouse` 객체를 통해 접근합니다.

### 2.1 가격 관련

#### getPrice(symbol)
특정 심볼의 최신 가격 조회

```javascript
const result = await window.infohouse.getPrice('BTC');
// { success: true, data: { symbol: 'BTC', price: 85000000, ... } }
```

#### getAllPrices()
모든 심볼의 최신 가격 조회

```javascript
const result = await window.infohouse.getAllPrices();
// { success: true, data: [{ symbol: 'BTC', ... }, { symbol: 'ETH', ... }] }
```

#### getHistory(symbol, days)
차트용 히스토리 데이터 조회

```javascript
const result = await window.infohouse.getHistory('BTC', 30);
// { success: true, data: [{ time: '2024-01-01', open: 80000000, high: 82000000, ... }] }
```

---

### 2.2 트렌드 관련

#### getTrends(source)
트렌드 키워드 조회

```javascript
const result = await window.infohouse.getTrends('google');
// { success: true, data: [{ source: 'google', keyword: '키워드1', rank: 1 }] }
```

**source 옵션**:
- `'google'` - Google Trends만
- `'naver'` - 네이버 데이터랩만
- `'all'` - 모두 (기본값)

---

### 2.3 수집 관련

#### collectNow()
수동으로 데이터 수집 트리거

```javascript
const result = await window.infohouse.collectNow();
// { success: true, data: { data: [...], errors: [] } }
```

---

### 2.4 윈도우 관련

#### toMiniMode()
미니 모드로 전환

```javascript
await window.infohouse.toMiniMode();
```

#### toMainMode()
메인 모드로 전환

```javascript
await window.infohouse.toMainMode();
```

---

### 2.5 설정 관련

#### getSetting(key)
설정 값 조회

```javascript
const result = await window.infohouse.getSetting('miniModeSymbols');
// { success: true, data: ['BTC', 'USD', 'XAU'] }
```

#### setSetting(key, value)
설정 값 저장

```javascript
await window.infohouse.setSetting('miniModeSymbols', ['BTC', 'ETH', 'USD']);
```

---

### 2.6 이벤트 리스너

#### onPriceUpdate(callback)
가격 업데이트 이벤트 수신

```javascript
window.infohouse.onPriceUpdate((data) => {
  console.log('새 가격 데이터:', data);
});
```

#### onCollectStatus(callback)
수집 상태 이벤트 수신

```javascript
window.infohouse.onCollectStatus((status) => {
  // status: { status: 'complete' | 'error', count?: number, error?: string }
  console.log('수집 상태:', status);
});
```

---

## 3. 응답 형식

모든 IPC 응답은 다음 형식을 따릅니다:

```typescript
interface IpcResponse {
  success: boolean;
  data?: any;
  error?: string;
}
```

**성공 응답**:
```json
{
  "success": true,
  "data": { ... }
}
```

**실패 응답**:
```json
{
  "success": false,
  "error": "에러 메시지"
}
```
