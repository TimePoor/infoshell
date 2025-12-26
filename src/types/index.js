/**
 * #InfoHouse - JSDoc 타입 정의
 * 이 파일의 타입들은 프로젝트 전체에서 사용됨
 */

// ============================================
// 가격 관련 타입
// ============================================

/**
 * 가격 데이터
 * @typedef {Object} PriceData
 * @property {number} [id] - DB ID
 * @property {string} category - 카테고리 ('gold', 'silver', 'oil', 'exchange', 'crypto', 'economic')
 * @property {string} symbol - 심볼 (예: 'XAU', 'BTC', 'USD')
 * @property {number} price - 현재가
 * @property {number} [change] - 변동률 (%)
 * @property {number} [changeAmount] - 변동액
 * @property {string} [unit] - 단위 ('KRW', 'USD', '%')
 * @property {string|Date} collectedAt - 수집 시간
 */

/**
 * 일별 요약 데이터
 * @typedef {Object} DailySummary
 * @property {number} [id] - DB ID
 * @property {string} symbol - 심볼
 * @property {string} date - 날짜 ('YYYY-MM-DD')
 * @property {number} openPrice - 시가
 * @property {number} highPrice - 고가
 * @property {number} lowPrice - 저가
 * @property {number} closePrice - 종가
 * @property {number} avgPrice - 평균가
 * @property {number} [count] - 수집 횟수
 */

// ============================================
// 차트 관련 타입
// ============================================

/**
 * 차트 데이터 (TradingView Lightweight Charts 형식)
 * @typedef {Object} ChartData
 * @property {string} time - 날짜 ('YYYY-MM-DD')
 * @property {number} open - 시가
 * @property {number} high - 고가
 * @property {number} low - 저가
 * @property {number} close - 종가
 */

/**
 * 라인 차트 데이터
 * @typedef {Object} LineChartData
 * @property {string} time - 날짜 ('YYYY-MM-DD')
 * @property {number} value - 값
 */

// ============================================
// 트렌드 관련 타입
// ============================================

/**
 * 트렌드 키워드
 * @typedef {Object} TrendKeyword
 * @property {number} [id] - DB ID
 * @property {string} source - 소스 ('google', 'naver')
 * @property {string} keyword - 키워드
 * @property {number} rank - 순위
 * @property {string|Date} collectedAt - 수집 시간
 */

// ============================================
// 설정 관련 타입
// ============================================

/**
 * 앱 설정
 * @typedef {Object} AppSettings
 * @property {string[]} [miniModeSymbols] - 미니 모드에 표시할 심볼 목록
 * @property {number} [collectInterval] - 수집 간격 (분)
 * @property {boolean} [startMinimized] - 최소화 상태로 시작
 * @property {boolean} [alwaysOnTop] - 항상 위에 표시
 * @property {string} [theme] - 테마 ('light', 'dark')
 */

/**
 * 윈도우 설정
 * @typedef {Object} WindowBounds
 * @property {number} x - X 좌표
 * @property {number} y - Y 좌표
 * @property {number} width - 너비
 * @property {number} height - 높이
 */

// ============================================
// 수집기 관련 타입
// ============================================

/**
 * 수집기 설정
 * @typedef {Object} CollectorConfig
 * @property {string} name - 수집기 이름
 * @property {boolean} enabled - 활성화 여부
 * @property {number} interval - 수집 간격 (ms)
 * @property {string} [apiKey] - API 키 (필요한 경우)
 */

/**
 * 수집 결과
 * @typedef {Object} CollectResult
 * @property {boolean} success - 성공 여부
 * @property {PriceData[]} [data] - 수집된 데이터
 * @property {string} [error] - 에러 메시지
 * @property {number} [timestamp] - 수집 시간
 */

// ============================================
// IPC 관련 타입
// ============================================

/**
 * IPC 응답
 * @typedef {Object} IpcResponse
 * @property {boolean} success - 성공 여부
 * @property {*} [data] - 응답 데이터
 * @property {string} [error] - 에러 메시지
 */

export {};
