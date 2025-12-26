/**
 * #InfoHouse - Silver Price Collector
 */

const { log } = require('../../utils/logger.js');

/**
 * 은 시세 수집
 * @returns {Promise<import('../../types/index.js').PriceData[]>}
 */
async function collectSilver() {
  log('[Silver] 은 시세 수집 중...');
  
  // TODO: 실제 API 또는 크롤링 구현
  const price = 1000 + Math.random() * 50; // 약 1,000원/g
  
  return [
    {
      category: 'silver',
      symbol: 'XAG',
      price: Math.round(price),
      unit: 'KRW',
    }
  ];
}

module.exports = { collectSilver };
