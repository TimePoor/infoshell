/**
 * INFOShell - 데이터 수집기 매니저
 */

const { collectGold, collectSilver } = require('./gold.js');
const { collectExchange } = require('./exchange.js');
const { collectOil } = require('./oil.js');
const { collectCrypto } = require('./crypto.js');
const { collectEconomicIndicators } = require('./economic.js');

/**
 * 모든 수집기 실행
 * @returns {Promise<import('../../types/index.js').CollectResult>}
 */
async function collectAll() {
  console.log('[Collector] 수집 시작...');
  
  const results = {
    success: true,
    data: [],
    errors: []
  };

  // 각 수집기 실행
  const collectors = [
    { name: 'gold', fn: collectGold },
    { name: 'silver', fn: collectSilver },
    { name: 'exchange', fn: collectExchange },
    { name: 'oil', fn: collectOil },
    { name: 'crypto', fn: collectCrypto },
    { name: 'economic', fn: collectEconomicIndicators }
  ];

  for (const collector of collectors) {
    try {
      const result = await collector.fn();
      if (result.success && result.data) {
        results.data.push(...result.data);
      }
      console.log(`[Collector] ${collector.name} 완료`);
    } catch (error) {
      console.error(`[Collector] ${collector.name} 실패:`, error.message);
      results.errors.push({ name: collector.name, error: error.message });
    }
  }

  console.log(`[Collector] 수집 완료: ${results.data.length}건`);
  return results;
}

module.exports = {
  collectAll
};
