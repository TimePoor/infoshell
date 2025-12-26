/**
 * #InfoHouse - 유틸리티 함수
 */

/**
 * 숫자를 콤마 포맷으로 변환
 * @param {number} num
 * @param {number} [decimals=0] - 소수점 자릿수
 * @returns {string}
 */
function formatNumber(num, decimals = 0) {
  return num.toLocaleString('ko-KR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

/**
 * 날짜를 YYYY-MM-DD 형식으로 변환
 * @param {Date|string} date
 * @returns {string}
 */
function formatDate(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 날짜를 상대 시간으로 변환
 * @param {Date|string} date
 * @returns {string}
 */
function timeAgo(date) {
  const now = new Date();
  const diff = now - new Date(date);
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  if (days < 7) return `${days}일 전`;
  
  return formatDate(date);
}

/**
 * 변동률 포맷 (+/-% 형식)
 * @param {number} change
 * @returns {string}
 */
function formatChange(change) {
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(2)}%`;
}

/**
 * 심볼을 한글 이름으로 변환
 * @param {string} symbol
 * @returns {string}
 */
function getSymbolName(symbol) {
  const names = {
    // 귀금속
    XAU: '금',
    XAG: '은',
    // 에너지
    WTI: 'WTI 유',
    BRENT: '브렌트유',
    // 환율
    USD: '미국 달러',
    CNY: '중국 위안',
    JPY: '일본 엔',
    EUR: '유로',
    VND: '베트남 동',
    RUB: '러시아 루블',
    // 암호화폐
    BTC: '비트코인',
    ETH: '이더리움',
    // 경제지표
    CPI: '소비자물가지수',
    RATE: '기준금리'
  };
  return names[symbol] || symbol;
}

/**
 * 카테고리를 한글 이름으로 변환
 * @param {string} category
 * @returns {string}
 */
function getCategoryName(category) {
  const names = {
    gold: '귀금속',
    silver: '귀금속',
    oil: '에너지',
    exchange: '환율',
    crypto: '암호화폐',
    economic: '경제지표'
  };
  return names[category] || category;
}

// CommonJS export (Node.js용)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    formatNumber,
    formatDate,
    timeAgo,
    formatChange,
    getSymbolName,
    getCategoryName
  };
}

// ES Module export (브라우저용)
if (typeof window !== 'undefined') {
  window.InfohouseUtils = {
    formatNumber,
    formatDate,
    timeAgo,
    formatChange,
    getSymbolName,
    getCategoryName
  };
}
