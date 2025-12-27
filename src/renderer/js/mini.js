/**
 * INFOShell - 위젯 모드 로직
 */

// DOM 요소
const miniTabs = document.getElementById('miniTabs');
const miniTrendTabs = document.getElementById('miniTrendTabs');
const miniPriceList = document.getElementById('miniPriceList');
const miniTrendList = document.getElementById('miniTrendList');
const miniStatsSymbol = document.getElementById('miniStatsSymbol');
const miniStatsGrid = document.getElementById('miniStatsGrid');
const miniCalcAmount = document.getElementById('miniCalcAmount');
const miniCalcFrom = document.getElementById('miniCalcFrom');
const miniCalcTo = document.getElementById('miniCalcTo');
const miniCalcResult = document.getElementById('miniCalcResult');
const miniScheduleList = document.getElementById('miniScheduleList');
const miniTodoList = document.getElementById('miniTodoList');
const lastUpdateEl = document.getElementById('lastUpdate');
const btnExpand = document.getElementById('btnExpand');
const btnClose = document.getElementById('btnClose');
const btnRefresh = document.getElementById('btnRefresh');

/** @type {Map<string, Object>} 현재 표시 중인 가격 데이터 */
let currentPrices = new Map();

/** @type {Array} 전체 트렌드 데이터 */
let allTrends = [];

/** @type {string} 현재 선택된 트렌드 소스 */
let currentTrendSource = 'all';

/**
 * 초기화
 */
async function init() {
  console.log('[Widget] 초기화 시작');

  // 이벤트 리스너 등록
  setupEventListeners();

  // 데이터 로드
  await loadPrices();
  await loadTrends();
  await loadStats();
  await loadSchedule();
  await loadTodos();
  updateCalc();
  updateTime();

  // 실시간 업데이트 리스너
  window.infohouse.onPriceUpdate((data) => {
    mergeAndRenderPrices(data);
    updateTime();
  });
}

/**
 * 새 데이터를 기존 데이터와 병합하여 렌더링
 * @param {Array} newPrices
 */
function mergeAndRenderPrices(newPrices) {
  for (const price of newPrices) {
    currentPrices.set(price.symbol, price);
  }
  const allPrices = Array.from(currentPrices.values());
  renderPrices(allPrices);
}

/**
 * 이벤트 리스너 설정
 */
function setupEventListeners() {
  // 탭 전환
  miniTabs.addEventListener('click', async (e) => {
    const tab = e.target.closest('.mini-tab');
    if (!tab) return;
    
    // 활성 탭 변경
    miniTabs.querySelectorAll('.mini-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    
    // 패널 전환
    document.querySelectorAll('.mini-panel').forEach(p => p.classList.remove('active'));
    const panelId = 'panel' + tab.dataset.tab.charAt(0).toUpperCase() + tab.dataset.tab.slice(1);
    document.getElementById(panelId)?.classList.add('active');
    
    // 탭별 데이터 새로고침
    const tabName = tab.dataset.tab;
    if (tabName === 'schedule') {
      await loadSchedule();
      await loadTodos();
    } else if (tabName === 'stats') {
      await loadStats();
    } else if (tabName === 'trends') {
      await loadTrends();
    }
  });

  // 확장 버튼 (메인 모드로)
  btnExpand.addEventListener('click', () => {
    window.infohouse.toMainMode();
  });

  // 닫기 버튼
  btnClose.addEventListener('click', () => {
    window.close();
  });

  // 새로고침 버튼
  btnRefresh.addEventListener('click', async () => {
    btnRefresh.querySelector('i').classList.add('fa-spin');
    await window.infohouse.collectNow();
    await loadPrices();
    await loadTrends();
    setTimeout(() => {
      btnRefresh.querySelector('i').classList.remove('fa-spin');
    }, 500);
  });

  // 통계 심볼 변경
  miniStatsSymbol.addEventListener('change', loadStats);

  // 계산기
  miniCalcAmount.addEventListener('input', updateCalc);
  miniCalcFrom.addEventListener('change', updateCalc);
  miniCalcTo.addEventListener('change', updateCalc);

  // 트렌드 소스 탭
  miniTrendTabs.addEventListener('click', (e) => {
    const tab = e.target.closest('.mini-trend-tab');
    if (!tab) return;
    
    miniTrendTabs.querySelectorAll('.mini-trend-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    
    currentTrendSource = tab.dataset.source;
    renderTrends(allTrends);
  });
}

/**
 * 가격 데이터 로드
 */
async function loadPrices() {
  try {
    const result = await window.infohouse.getAllPrices();
    if (result.success && result.data && result.data.length > 0) {
      for (const price of result.data) {
        currentPrices.set(price.symbol, price);
      }
      renderPrices(result.data);
    }
  } catch (error) {
    console.error('[Widget] 가격 로드 실패:', error);
  }
}

/**
 * 트렌드 로드
 */
async function loadTrends() {
  try {
    const result = await window.infohouse.getTrends();
    if (result.success && result.data) {
      allTrends = result.data;
      renderTrends(allTrends);
    }
  } catch (error) {
    console.error('[Widget] 트렌드 로드 실패:', error);
  }
}

/**
 * 통계 로드
 */
async function loadStats() {
  const symbol = miniStatsSymbol.value;
  try {
    const todayResult = await window.infohouse.getTodayStats(symbol);
    const weekResult = await window.infohouse.getWeekStats(symbol);
    
    document.getElementById('miniTodayHigh').textContent = 
      todayResult.success && todayResult.data?.high ? formatNumber(todayResult.data.high, 0) : '-';
    document.getElementById('miniTodayLow').textContent = 
      todayResult.success && todayResult.data?.low ? formatNumber(todayResult.data.low, 0) : '-';
    
    const weekChangeEl = document.getElementById('miniWeekChange');
    if (weekResult.success && weekResult.data?.change !== undefined) {
      const change = weekResult.data.change;
      weekChangeEl.textContent = `${change >= 0 ? '+' : ''}${change}%`;
      weekChangeEl.className = `value ${change >= 0 ? 'up' : 'down'}`;
    } else {
      weekChangeEl.textContent = '-';
      weekChangeEl.className = 'value';
    }
  } catch (error) {
    console.error('[Widget] 통계 로드 실패:', error);
  }
}

/**
 * 일정 로드
 */
async function loadSchedule() {
  const today = new Date();
  const dateStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
  
  console.log('[Widget] 일정 로드 시도:', dateStr);
  
  try {
    const result = await window.infohouse.getSchedulesByDate(dateStr);
    console.log('[Widget] 일정 결과:', result);
    
    if (result.success && result.data && result.data.length > 0) {
      miniScheduleList.innerHTML = result.data.map(s => 
        `<div class="mini-schedule-item">${s.text}</div>`
      ).join('');
    } else {
      miniScheduleList.innerHTML = '<div class="mini-schedule-empty">일정이 없습니다</div>';
    }
  } catch (error) {
    console.error('[Widget] 일정 로드 실패:', error);
    miniScheduleList.innerHTML = '<div class="mini-schedule-empty">로드 실패</div>';
  }
}

/**
 * 투두 로드
 */
async function loadTodos() {
  console.log('[Widget] 투두 로드 시도');
  
  try {
    const result = await window.infohouse.getTodos();
    console.log('[Widget] 투두 결과:', result);
    
    if (result.success && result.data && result.data.length > 0) {
      miniTodoList.innerHTML = result.data.slice(0, 5).map(t => `
        <div class="mini-todo-item ${t.done ? 'completed' : ''}">
          <div class="mini-todo-item__check ${t.done ? 'done' : ''}"></div>
          <span>${t.text}</span>
        </div>
      `).join('');
    } else {
      miniTodoList.innerHTML = '<div class="mini-todo-empty">할 일이 없습니다</div>';
    }
  } catch (error) {
    console.error('[Widget] 투두 로드 실패:', error);
    miniTodoList.innerHTML = '<div class="mini-todo-empty">로드 실패</div>';
  }
}

/**
 * 계산기 업데이트
 */
function updateCalc() {
  const amount = parseFloat(miniCalcAmount.value) || 0;
  const from = miniCalcFrom.value;
  const to = miniCalcTo.value;

  const rates = {
    KRW: 1,
    USD: currentPrices.get('USD')?.price || 1445,
    EUR: currentPrices.get('EUR')?.price || 1700,
    JPY: (currentPrices.get('JPY')?.price || 927) / 100
  };

  const fromRate = rates[from];
  const toRate = rates[to];
  const result = (amount * fromRate) / toRate;

  const symbols = { KRW: '₩', USD: '$', EUR: '€', JPY: '¥' };
  miniCalcResult.textContent = `${symbols[to]}${formatNumber(result, to === 'KRW' ? 0 : 2)}`;
}

/**
 * 미니모드용 심볼명 (짧은 버전)
 * @param {string} symbol
 * @returns {string}
 */
function getMiniSymbolName(symbol) {
  const names = {
    XAU: '금', XAG: '은',
    GASOLINE: '휘발유', DIESEL: '경유',
    USD: '달러', CNY: '위안', JPY: '엔(100)', EUR: '유로',
    RUB: '루블', VND: '동(100)',
    BTC: '비트코인', ETH: '이더리움',
    RATE_US: '미국금리', RATE_KR: '한국금리',
    CPI_US: '미국CPI', CPI_KR: '한국CPI'
  };
  return names[symbol] || symbol;
}

/**
 * 가격 포맷팅 (미니모드용 간단 버전)
 * @param {Object} price
 * @returns {string}
 */
function formatMiniPrice(price) {
  const { symbol, price: value, unit, category } = price;
  
  if (unit === 'USD') {
    return `$${formatNumber(value, 2)}`;
  } else if (category === 'crypto') {
    // 암호화폐는 만원 단위로 표시
    if (value >= 10000) {
      return `${formatNumber(Math.round(value / 10000), 0)}만`;
    }
    return formatNumber(value, 0);
  } else if (category === 'oil') {
    return `${formatNumber(value, 0)}`;
  } else if (category === 'economic') {
    // 경제지표는 % 표시
    return `${formatNumber(value, 2)}%`;
  }
  
  return formatNumber(value, symbol === 'JPY' ? 2 : 0);
}

/**
 * 가격 목록 렌더링
 * @param {Array} prices
 */
function renderPrices(prices) {
  if (!prices || prices.length === 0) {
    miniPriceList.innerHTML = '<div class="mini-loading"><div class="loading-spinner"></div></div>';
    return;
  }

  // 카테고리 순서 정렬
  const categoryOrder = ['crypto', 'gold', 'silver', 'exchange', 'oil', 'economic'];
  // 심볼별 세부 정렬 (경제지표)
  const symbolOrder = {
    'RATE_US': 0, 'CPI_US': 1, 'RATE_KR': 2, 'CPI_KR': 3
  };
  const sorted = [...prices].sort((a, b) => {
    const orderA = categoryOrder.indexOf(a.category);
    const orderB = categoryOrder.indexOf(b.category);
    if (orderA !== orderB) return orderA - orderB;
    const symOrderA = symbolOrder[a.symbol] ?? 99;
    const symOrderB = symbolOrder[b.symbol] ?? 99;
    return symOrderA - symOrderB;
  });

  miniPriceList.innerHTML = sorted.map(price => {
    const changeValue = price.change_rate ?? price.change ?? 0;
    const changeClass = changeValue >= 0 ? 'up' : 'down';
    const changeIcon = changeValue >= 0 ? '▲' : '▼';
    const isEconomic = price.category === 'economic';
    
    return `
      <div class="mini-price">
        <div class="mini-price__left">
          <span class="mini-price__name">${getMiniSymbolName(price.symbol)}</span>
        </div>
        <div class="mini-price__right">
          <div class="mini-price__value">${formatMiniPrice(price)}</div>
          ${isEconomic ? '' : `
          <div class="mini-price__change ${changeClass}">
            ${changeIcon} ${formatChange(changeValue)}
          </div>
          `}
        </div>
      </div>
    `;
  }).join('');
}

/**
 * 트렌드 렌더링
 * @param {Array} trends
 */
function renderTrends(trends) {
  if (!trends || trends.length === 0) {
    miniTrendList.innerHTML = '<div class="mini-loading">트렌드 없음</div>';
    return;
  }

  // 소스 필터링
  let filtered = trends;
  if (currentTrendSource !== 'all') {
    filtered = trends.filter(t => t.source === currentTrendSource);
  }

  // 상위 15개만
  const top15 = filtered.slice(0, 15);
  
  if (top15.length === 0) {
    miniTrendList.innerHTML = '<div class="mini-loading">해당 트렌드 없음</div>';
    return;
  }
  
  miniTrendList.innerHTML = top15.map((t, i) => {
    const sourceLabel = t.source === 'google_kr' ? 'KR' : 
                        t.source === 'google_us' ? 'US' : '줌';
    // 전체 보기일 때만 소스 라벨 표시
    const showSource = currentTrendSource === 'all';
    return `
      <div class="mini-trend">
        <span class="mini-trend__rank">${i + 1}</span>
        <span class="mini-trend__keyword">${t.keyword}</span>
        ${showSource ? `<span class="mini-trend__source">${sourceLabel}</span>` : ''}
      </div>
    `;
  }).join('');
}

/**
 * 시간 업데이트
 */
function updateTime() {
  lastUpdateEl.textContent = getCurrentTime();
}

// 앱 시작
document.addEventListener('DOMContentLoaded', init);
