/**
 * INFOShell - 렌더러 유틸리티
 */

'use strict';

// ============================================
// 보안 유틸리티
// ============================================

/**
 * XSS 방지용 HTML 이스케이프
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return String(str).replace(/[&<>"']/g, s => map[s]);
}

/**
 * 안전한 innerHTML 설정 (텍스트 전용)
 * @param {HTMLElement} el
 * @param {string} text
 */
function safeSetText(el, text) {
  if (el) el.textContent = text;
}

/**
 * URL 검증
 * @param {string} url
 * @returns {boolean}
 */
function isValidUrl(url) {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

// ============================================
// 성능 최적화 유틸리티
// ============================================

/**
 * Debounce 함수
 * @param {Function} fn
 * @param {number} delay
 * @returns {Function}
 */
function debounce(fn, delay = 300) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Throttle 함수
 * @param {Function} fn
 * @param {number} limit
 * @returns {Function}
 */
function throttle(fn, limit = 100) {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * requestAnimationFrame 기반 throttle
 * @param {Function} fn
 * @returns {Function}
 */
function rafThrottle(fn) {
  let ticking = false;
  return function (...args) {
    if (!ticking) {
      requestAnimationFrame(() => {
        fn.apply(this, args);
        ticking = false;
      });
      ticking = true;
    }
  };
}

/**
 * 메모이제이션
 * @param {Function} fn
 * @returns {Function}
 */
function memoize(fn) {
  const cache = new Map();
  return function (...args) {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);
    const result = fn.apply(this, args);
    cache.set(key, result);
    // 캐시 크기 제한 (100개)
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    return result;
  };
}

// ============================================
// DOM 유틸리티
// ============================================

/**
 * DOM 요소 캐싱
 */
const domCache = new Map();

/**
 * 캐시된 DOM 요소 가져오기
 * @param {string} selector
 * @returns {HTMLElement|null}
 */
function $(selector) {
  if (!domCache.has(selector)) {
    domCache.set(selector, document.querySelector(selector));
  }
  return domCache.get(selector);
}

/**
 * DOM 캐시 초기화
 */
function clearDomCache() {
  domCache.clear();
}

// ============================================
// 포맷팅 유틸리티
// ============================================

/**
 * 숫자를 콤마 포맷으로 변환
 * @param {number} num
 * @param {number} [decimals=0]
 * @returns {string}
 */
function formatNumber(num, decimals = 0) {
  if (num === null || num === undefined || isNaN(num)) {
    return '-';
  }
  return num.toLocaleString('ko-KR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

/**
 * 변동률 포맷
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
    // 유가
    GASOLINE: '휘발유',
    DIESEL: '경유',
    WTI: 'WTI 원유',
    BRENT: '브렌트유',
    // 환율 (1단위 기준 표시)
    USD: '미국 달러 (1$)',
    EUR: '유로 (1€)',
    JPY: '일본 엔 (100¥)',
    CNY: '중국 위안 (1¥)',
    RUB: '러시아 루블 (1₽)',
    VND: '베트남 동 (100₫)',
    // 암호화폐
    BTC: '비트코인',
    ETH: '이더리움',
    // 경제지표
    RATE_KR: '🇰🇷 기준금리',
    RATE_US: '🇺🇸 기준금리',
    CPI_KR: '🇰🇷 소비자물가',
    CPI_US: '🇺🇸 소비자물가'
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
    economic: '금리/물가'
  };
  return names[category] || category;
}

/**
 * 현재 시간을 HH:MM 형식으로 반환
 * @returns {string}
 */
function getCurrentTime() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * DOM 엘리먼트 생성 헬퍼
 * @param {string} tag
 * @param {Object} [attrs]
 * @param {string|HTMLElement|HTMLElement[]} [children]
 * @returns {HTMLElement}
 */
function createElement(tag, attrs = {}, children = null) {
  const el = document.createElement(tag);
  
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'className') {
      el.className = value;
    } else if (key === 'dataset') {
      Object.assign(el.dataset, value);
    } else if (key.startsWith('on') && typeof value === 'function') {
      el.addEventListener(key.slice(2).toLowerCase(), value);
    } else {
      el.setAttribute(key, value);
    }
  }

  if (children) {
    if (typeof children === 'string') {
      el.textContent = children;
    } else if (Array.isArray(children)) {
      children.forEach(child => el.appendChild(child));
    } else {
      el.appendChild(children);
    }
  }

  return el;
}
