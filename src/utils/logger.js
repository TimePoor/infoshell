/**
 * #InfoHouse - Logger
 */

const isDev = process.argv.includes('--dev');

/**
 * 로그 출력
 * @param {...any} args
 */
function log(...args) {
  const timestamp = new Date().toLocaleTimeString('ko-KR');
  console.log(`[${timestamp}]`, ...args);
}

/**
 * 에러 출력
 * @param {...any} args
 */
function error(...args) {
  const timestamp = new Date().toLocaleTimeString('ko-KR');
  console.error(`[${timestamp}] ERROR:`, ...args);
}

/**
 * 디버그 출력 (개발 모드에서만)
 * @param {...any} args
 */
function debug(...args) {
  if (isDev) {
    const timestamp = new Date().toLocaleTimeString('ko-KR');
    console.log(`[${timestamp}] DEBUG:`, ...args);
  }
}

module.exports = { log, error, debug };
