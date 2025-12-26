/**
 * #InfoHouse - 스케줄러 (KST 정각 기준)
 * 
 * 수집 주기:
 * - 암호화폐: 10분 (00, 10, 20, 30, 40, 50분)
 * - 금/은/환율: 30분 (00, 30분)
 * - 유가: 6시간 (00, 06, 12, 18시)
 */

const cron = require('node-cron');
const { BrowserWindow } = require('electron');
const { collectGold, collectSilver } = require('./collector/gold.js');
const { collectExchange } = require('./collector/exchange.js');
const { collectOil } = require('./collector/oil.js');
const { collectCrypto } = require('./collector/crypto.js');
const { collectTrends } = require('./collector/trends.js');
const { collectEconomicIndicators } = require('./collector/economic.js');
const { getSetting, setSetting } = require('../database/queries.js');

/** @type {Map<string, cron.ScheduledTask>} */
const tasks = new Map();

/** 마지막 수집 시간 키 */
const LAST_COLLECT_KEYS = {
  crypto: 'last_collect_crypto',
  metals: 'last_collect_metals',
  exchange: 'last_collect_exchange',
  oil: 'last_collect_oil',
  trends: 'last_collect_trends',
  economic: 'last_collect_economic'
};

/**
 * 모든 윈도우에 데이터 전송
 * @param {string} channel
 * @param {*} data
 */
function broadcastToWindows(channel, data) {
  const windows = BrowserWindow.getAllWindows();
  for (const win of windows) {
    if (!win.isDestroyed()) {
      win.webContents.send(channel, data);
    }
  }
}

/**
 * 수집 실행 및 결과 브로드캐스트
 * @param {string} category
 * @param {Function[]} collectors
 */
async function runCollectors(category, collectors) {
  console.log(`[Scheduler] ${category} 수집 시작`);
  
  const allData = [];
  const errors = [];

  for (const collector of collectors) {
    try {
      const result = await collector();
      if (result.success && result.data) {
        allData.push(...result.data);
      }
      if (!result.success) {
        errors.push(result.error);
      }
    } catch (error) {
      console.error(`[Scheduler] ${category} 수집 오류:`, error.message);
      errors.push(error.message);
    }
  }

  // 마지막 수집 시간 저장
  const key = LAST_COLLECT_KEYS[category];
  if (key) {
    try {
      setSetting(key, Date.now());
    } catch (e) {
      // DB 미초기화 시 무시
    }
  }

  // 결과 브로드캐스트
  if (allData.length > 0) {
    broadcastToWindows('price:update', allData);
  }

  broadcastToWindows('collect:status', {
    category,
    status: errors.length === 0 ? 'complete' : 'partial',
    count: allData.length,
    errors
  });

  console.log(`[Scheduler] ${category} 수집 완료: ${allData.length}건`);
  return allData;
}

/**
 * 주기 경과 여부 확인
 * @param {string} category
 * @param {number} intervalMs - 주기 (밀리초)
 * @returns {boolean}
 */
function shouldCollect(category, intervalMs) {
  try {
    const key = LAST_COLLECT_KEYS[category];
    const lastCollect = getSetting(key);
    console.log(`[Scheduler] ${category} 마지막 수집:`, lastCollect);
    if (!lastCollect) return true;
    
    const elapsed = Date.now() - lastCollect;
    const shouldRun = elapsed >= intervalMs;
    console.log(`[Scheduler] ${category} 경과: ${elapsed}ms, 주기: ${intervalMs}ms, 수집필요: ${shouldRun}`);
    return shouldRun;
  } catch (e) {
    console.log(`[Scheduler] ${category} 체크 오류:`, e.message);
    return true;
  }
}

/**
 * 앱 시작 시 필요한 데이터 즉시 수집
 */
async function collectOnStartup() {
  console.log('[Scheduler] 시작 시 수집 체크...');

  const INTERVALS = {
    crypto: 10 * 60 * 1000,      // 10분
    metals: 30 * 60 * 1000,      // 30분
    exchange: 30 * 60 * 1000,    // 30분
    oil: 6 * 60 * 60 * 1000,     // 6시간
    trends: 30 * 60 * 1000,      // 30분
    economic: 6 * 60 * 60 * 1000 // 6시간 (금리/CPI는 자주 안 바뀜)
  };

  // 환율 (금/은 변환에 필요하므로 먼저 수집)
  if (shouldCollect('exchange', INTERVALS.exchange)) {
    await runCollectors('exchange', [collectExchange]);
  }

  // 금/은 (환율 적용)
  if (shouldCollect('metals', INTERVALS.metals)) {
    await runCollectors('metals', [collectGold, collectSilver]);
  }

  // 암호화폐
  if (shouldCollect('crypto', INTERVALS.crypto)) {
    await runCollectors('crypto', [collectCrypto]);
  }

  // 유가
  if (shouldCollect('oil', INTERVALS.oil)) {
    await runCollectors('oil', [collectOil]);
  }

  // 트렌드
  if (shouldCollect('trends', INTERVALS.trends)) {
    await runCollectors('trends', [collectTrends]);
  }

  // 경제지표
  if (shouldCollect('economic', INTERVALS.economic)) {
    await runCollectors('economic', [collectEconomicIndicators]);
  }

  console.log('[Scheduler] 시작 시 수집 완료');
}

/**
 * 스케줄러 시작
 */
function startScheduler() {
  // 암호화폐: 매 10분 (0, 10, 20, 30, 40, 50분)
  tasks.set('crypto', cron.schedule('0,10,20,30,40,50 * * * *', async () => {
    await runCollectors('crypto', [collectCrypto]);
  }, { timezone: 'Asia/Seoul' }));

  // 금/은: 매 30분 (0, 30분)
  tasks.set('metals', cron.schedule('0,30 * * * *', async () => {
    await runCollectors('metals', [collectGold, collectSilver]);
  }, { timezone: 'Asia/Seoul' }));

  // 환율: 매 30분 (0, 30분)
  tasks.set('exchange', cron.schedule('0,30 * * * *', async () => {
    await runCollectors('exchange', [collectExchange]);
  }, { timezone: 'Asia/Seoul' }));

  // 유가: 매 6시간 (0, 6, 12, 18시)
  tasks.set('oil', cron.schedule('0 0,6,12,18 * * *', async () => {
    await runCollectors('oil', [collectOil]);
  }, { timezone: 'Asia/Seoul' }));

  // 트렌드: 매 30분 (0, 30분)
  tasks.set('trends', cron.schedule('0,30 * * * *', async () => {
    await runCollectors('trends', [collectTrends]);
  }, { timezone: 'Asia/Seoul' }));

  // 경제지표: 매 6시간 (0, 6, 12, 18시)
  tasks.set('economic', cron.schedule('0 0,6,12,18 * * *', async () => {
    await runCollectors('economic', [collectEconomicIndicators]);
  }, { timezone: 'Asia/Seoul' }));

  console.log('[Scheduler] 시작됨');
  console.log('  - 암호화폐: 매 10분');
  console.log('  - 금/은: 매 30분');
  console.log('  - 환율: 매 30분');
  console.log('  - 유가: 매 6시간');
  console.log('  - 트렌드: 매 30분');
  console.log('  - 경제지표: 매 6시간');

  // 앱 시작 후 3초 뒤 초기 수집
  setTimeout(() => {
    collectOnStartup().catch(err => {
      console.error('[Scheduler] 초기 수집 실패:', err);
    });
  }, 3000);
}

/**
 * 스케줄러 중지
 */
function stopScheduler() {
  for (const [name, task] of tasks) {
    task.stop();
    console.log(`[Scheduler] ${name} 중지됨`);
  }
  tasks.clear();
  console.log('[Scheduler] 모든 스케줄 중지됨');
}

/**
 * 수동 수집 (전체)
 */
async function collectAllManual() {
  console.log('[Scheduler] 수동 전체 수집 시작');
  
  const allData = [];
  
  const cryptoData = await runCollectors('crypto', [collectCrypto]);
  allData.push(...cryptoData);
  
  const metalsData = await runCollectors('metals', [collectGold, collectSilver]);
  allData.push(...metalsData);
  
  const exchangeData = await runCollectors('exchange', [collectExchange]);
  allData.push(...exchangeData);
  
  const oilData = await runCollectors('oil', [collectOil]);
  allData.push(...oilData);

  const economicData = await runCollectors('economic', [collectEconomicIndicators]);
  allData.push(...economicData);
  
  console.log(`[Scheduler] 수동 전체 수집 완료: ${allData.length}건`);
  return allData;
}

module.exports = {
  startScheduler,
  stopScheduler,
  collectAllManual,
  collectOnStartup
};
