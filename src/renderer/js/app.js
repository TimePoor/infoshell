/**
/**
 * #InfoHouse - 메인 앱 로직
 */

// DOM 요소
const priceGrid = document.getElementById('priceGrid');
const statsTabs = document.getElementById('statsTabs');
const trendList = document.getElementById('trendList');
const lastUpdateEl = document.getElementById('lastUpdate');
const statusDot = document.getElementById('statusDot');
const btnMiniMode = document.getElementById('btnMiniMode');
const btnRefresh = document.getElementById('btnRefresh');

// 페이지 요소
const dashboardContent = document.querySelector('.content');
const calculatorPage = document.getElementById('calculatorPage');
const supportPage = document.getElementById('supportPage');

// 프로그레스 요소
const collectProgress = document.getElementById('collectProgress');
const collectStatus = document.getElementById('collectStatus');
const collectCount = document.getElementById('collectCount');
const collectFill = document.getElementById('collectFill');
const collectItems = document.getElementById('collectItems');

// 페이지 요소
const schedulePage = document.getElementById('schedulePage');

// 통계 요소
const todayHigh = document.getElementById('todayHigh');
const todayLow = document.getElementById('todayLow');
const todayAvg = document.getElementById('todayAvg');
const weekHigh = document.getElementById('weekHigh');
const weekLow = document.getElementById('weekLow');
const weekChange = document.getElementById('weekChange');

let currentStatsSymbol = 'BTC';

/** @type {Map<string, Object>} 현재 표시 중인 가격 데이터 */
let currentPrices = new Map();

/** @type {boolean} 로딩 중 여부 */
let isLoading = false;

/** 수집할 전체 항목 */
const ALL_SYMBOLS = ['BTC', 'ETH', 'XAU', 'XAG', 'USD', 'EUR', 'JPY', 'CNY', 'RUB', 'VND', 'GASOLINE', 'DIESEL'];

/** @type {Set<string>} 수집 완료된 항목 */
let collectedSymbols = new Set();

/**
 * 초기화
 */
async function init() {
  console.log('[App] 초기화 시작');

  // 이벤트 리스너 등록
  setupEventListeners();

  // 로딩 상태 표시
  showLoading();

  // 데이터 로드 시도
  const result = await window.infohouse.getAllPrices();
  
  if (result.success && result.data && result.data.length > 0) {
    // 기존 데이터 있음 - Map에도 저장 및 프로그레스 업데이트
    for (const price of result.data) {
      currentPrices.set(price.symbol, price);
      collectedSymbols.add(price.symbol);
    }
    renderPrices(result.data);
    updateStatus();
  } else {
    // 데이터 없음 - 프로그레스 표시 후 수집 시작
    console.log('[App] 데이터 없음, 수집 시작...');
    showProgress();
    window.infohouse.collectNow();
  }
  
  // 통계 초기화
  loadStats(currentStatsSymbol);
  
  // 트렌드 로드
  loadTrends();

  // 배너 로드
  loadBanners();

  // 실시간 업데이트 리스너
  window.infohouse.onPriceUpdate((data) => {
    console.log('[App] 가격 업데이트:', data.length, '건');
    // 기존 데이터와 병합
    mergeAndRenderPrices(data);
    updateStatus();
    hideLoading();
    // 통계도 갱신
    loadStats(currentStatsSymbol);
    // 트렌드도 갱신
    loadTrends();
  });

  window.infohouse.onCollectStatus((status) => {
    console.log('[App] 수집 상태:', status);
    if (status.status === 'complete' || status.status === 'partial') {
      hideLoading();
      updateStatus();
      loadStats(currentStatsSymbol);
    }
  });
}

/**
 * 이벤트 리스너 설정
 */
function setupEventListeners() {
  // 미니 모드 버튼
  btnMiniMode.addEventListener('click', () => {
    window.infohouse.toMiniMode();
  });

  // 새로고침 버튼
  btnRefresh.addEventListener('click', async () => {
    btnRefresh.querySelector('i').classList.add('fa-spin');
    showProgress();
    collectedSymbols.clear();
    updateProgress();
    await window.infohouse.collectNow();
    await loadPrices();
    setTimeout(() => {
      btnRefresh.querySelector('i').classList.remove('fa-spin');
    }, 500);
  });

  // 통계 탭
  statsTabs.addEventListener('click', (e) => {
    const tab = e.target.closest('.stats-tab');
    if (!tab) return;

    // 활성 탭 변경
    statsTabs.querySelectorAll('.stats-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');

    // 통계 업데이트
    currentStatsSymbol = tab.dataset.symbol;
    loadStats(currentStatsSymbol);
  });

  // 사이드바 네비게이션
  document.querySelectorAll('.sidebar__link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll('.sidebar__link').forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      
      const section = link.dataset.section;
      document.querySelector('.header__title').textContent = getSectionTitle(section);
      
      // 페이지 전환
      dashboardContent.style.display = 'none';
      calculatorPage.style.display = 'none';
      schedulePage.style.display = 'none';
      supportPage.style.display = 'none';
      
      if (section === 'calculator') {
        calculatorPage.style.display = 'block';
        window.CalculatorModule.setPrices(currentPrices);
        window.CalculatorModule.updateExchangeCalc();
        window.CalculatorModule.updateGoldCalc();
      } else if (section === 'schedule') {
        schedulePage.style.display = 'block';
        window.ScheduleModule.renderCalendar();
        window.ScheduleModule.renderScheduleList();
        window.ScheduleModule.renderTodoList();
      } else if (section === 'support') {
        supportPage.style.display = 'block';
      } else {
        dashboardContent.style.display = 'block';
      }
    });
  });

  // 모듈 초기화
  window.CalculatorModule.init(currentPrices);
  window.ScheduleModule.init();

  // 문의 폼 이벤트
  const supportForm = document.getElementById('supportForm');
  const inquiryContent = document.getElementById('inquiryContent');
  if (supportForm) {
    supportForm.addEventListener('submit', handleInquirySubmit);
    updateInquiryLimit();
    
    // 글자수 카운트 (debounce 적용)
    if (inquiryContent) {
      let charCountTimeout;
      inquiryContent.addEventListener('input', () => {
        clearTimeout(charCountTimeout);
        charCountTimeout = setTimeout(updateCharCount, 50);
      });
    }
  }
}

/**
 * 글자수 카운트 업데이트
 */
function updateCharCount() {
  const content = document.getElementById('inquiryContent');
  const countEl = document.getElementById('charCount');
  if (!content || !countEl) return;
  
  const len = content.value.length;
  const max = 2000;
  
  countEl.textContent = `${len}/${max}`;
  countEl.classList.remove('warning', 'error');
  
  if (len >= max) {
    countEl.classList.add('error');
  } else if (len >= max * 0.9) {
    countEl.classList.add('warning');
  }
}

/**
 * 섹션 제목 반환
 * @param {string} section
 * @returns {string}
 */
function getSectionTitle(section) {
  const titles = {
    dashboard: '대시보드',
    calculator: '계산기',
    schedule: '일정',
    support: '이용문의'
  };
  return titles[section] || '대시보드';
}

/**
 * 가격 데이터 로드
 */
async function loadPrices() {
  try {
    const result = await window.infohouse.getAllPrices();
    if (result.success && result.data) {
      renderPrices(result.data);
      updateStatus();
    }
  } catch (error) {
    console.error('[App] 가격 로드 실패:', error);
  }
}

/**
 * 로딩 상태 표시
 * @param {string} [message]
 */
function showLoading(message = '데이터를 불러오는 중...') {
  isLoading = true;
  priceGrid.innerHTML = `
    <div class="price-card price-card--loading">
      <i class="fa-solid fa-spinner fa-spin"></i>
      <span>${message}</span>
    </div>
  `;
}

/**
 * 로딩 상태 해제
 */
function hideLoading() {
  isLoading = false;
}

/**
 * 프로그레스 바 표시
 */
function showProgress() {
  collectedSymbols.clear();
  collectProgress.style.display = 'block';
  updateProgress();
}

/**
 * 프로그레스 바 숨김
 */
function hideProgress() {
  setTimeout(() => {
    collectProgress.style.display = 'none';
  }, 1000);
}

/**
 * 프로그레스 업데이트
 */
function updateProgress() {
  const total = ALL_SYMBOLS.length;
  const done = collectedSymbols.size;
  const percent = Math.round((done / total) * 100);
  
  collectCount.textContent = `${done}/${total}`;
  collectFill.style.width = `${percent}%`;
  
  if (done >= total) {
    collectStatus.textContent = '수집 완료!';
    hideProgress();
  } else {
    collectStatus.textContent = '데이터 수집 중...';
  }
  
  // 항목 태그 업데이트
  collectItems.innerHTML = ALL_SYMBOLS.map(symbol => {
    const isDone = collectedSymbols.has(symbol);
    const className = isDone ? 'done' : '';
    return `<span class="collect-progress__item ${className}">${symbol}</span>`;
  }).join('');
}

/**
 * 새 데이터를 기존 데이터와 병합하여 렌더링
 * @param {Array} newPrices
 */
function mergeAndRenderPrices(newPrices) {
  // 새 데이터로 Map 업데이트 및 프로그레스 업데이트
  for (const price of newPrices) {
    currentPrices.set(price.symbol, price);
    collectedSymbols.add(price.symbol);
  }
  
  // 프로그레스 업데이트
  updateProgress();
  
  // Map을 배열로 변환하여 렌더링
  const allPrices = Array.from(currentPrices.values());
  renderPrices(allPrices);
}

/**
 * 가격 포맷팅 (카테고리별)
 * @param {Object} price
 * @returns {string}
 */
function formatPriceDisplay(price) {
  const { symbol, price: value, unit, category } = price;
  
  // 카테고리별 포맷
  if (category === 'gold' || category === 'silver') {
    // 금/은 (원/돈, 1돈=3.75g)
    return `₩${formatNumber(value, 0)}/돈`;
  } else if (category === 'crypto') {
    // 암호화폐 (원, 큰 숫자)
    return `₩${formatNumber(value, 0)}`;
  } else if (category === 'oil') {
    // 유가 (리터당)
    return `₩${formatNumber(value, 0)}/L`;
  } else if (category === 'exchange') {
    // 환율 (1단위 기준, JPY는 100엔 기준)
    return `₩${formatNumber(value, 2)}`;
  } else if (category === 'economic') {
    // 경제지표 (금리, CPI - 퍼센트)
    return `${formatNumber(value, 2)}%`;
  }
  
  // 기본
  return unit === 'KRW' ? `₩${formatNumber(value, 0)}` : formatNumber(value, 2);
}

/**
 * 가격 카드 렌더링
 * @param {Array} prices
 */
function renderPrices(prices) {
  if (!prices || prices.length === 0) {
    priceGrid.innerHTML = `
      <div class="price-card price-card--loading">
        <span>데이터를 수집 중입니다...</span>
      </div>
    `;
    return;
  }

  // 카테고리 순서 정렬
  const categoryOrder = ['crypto', 'gold', 'silver', 'exchange', 'oil', 'economic'];
  const sorted = [...prices].sort((a, b) => {
    const orderA = categoryOrder.indexOf(a.category);
    const orderB = categoryOrder.indexOf(b.category);
    return orderA - orderB;
  });

  // 유효한 가격 데이터만 필터링
  const validPrices = sorted.filter(price => 
    price && 
    price.symbol && 
    price.category && 
    price.price !== undefined && 
    price.price !== null
  );

  if (validPrices.length === 0) {
    priceGrid.innerHTML = `
      <div class="price-card price-card--loading">
        <span>데이터를 수집 중입니다...</span>
      </div>
    `;
    return;
  }

  priceGrid.innerHTML = validPrices.map(price => {
    const changeValue = price.change_rate ?? price.change ?? 0;
    const changeClass = changeValue >= 0 ? 'up' : 'down';
    const changeIcon = changeValue >= 0 ? 'fa-caret-up' : 'fa-caret-down';
    
    return `
      <div class="price-card" data-symbol="${price.symbol}" data-category="${price.category}">
        <div class="price-card__header">
          <span class="price-card__symbol">${price.symbol}</span>
          <span class="price-card__category">${getCategoryName(price.category)}</span>
        </div>
        <div class="price-card__name">${getSymbolName(price.symbol)}</div>
        <div class="price-card__price">${formatPriceDisplay(price)}</div>
        <div class="price-card__change ${changeClass}">
          <i class="fa-solid ${changeIcon}"></i>
          <span>${formatChange(changeValue)}</span>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * 통계 로드
 * @param {string} symbol
 */
async function loadStats(symbol) {
  try {
    // 오늘 통계
    const todayResult = await window.infohouse.getTodayStats(symbol);
    if (todayResult.success && todayResult.data) {
      const today = todayResult.data;
      const price = currentPrices.get(symbol);
      const unit = getStatsUnit(symbol, price);
      
      todayHigh.textContent = `${unit}${formatNumber(today.high, 0)}`;
      todayLow.textContent = `${unit}${formatNumber(today.low, 0)}`;
      todayAvg.textContent = `${unit}${formatNumber(today.avg, 0)}`;
    } else {
      todayHigh.textContent = '-';
      todayLow.textContent = '-';
      todayAvg.textContent = '-';
    }

    // 주간 통계
    const weekResult = await window.infohouse.getWeekStats(symbol);
    if (weekResult.success && weekResult.data) {
      const week = weekResult.data;
      const price = currentPrices.get(symbol);
      const unit = getStatsUnit(symbol, price);
      
      weekHigh.textContent = `${unit}${formatNumber(week.high, 0)}`;
      weekLow.textContent = `${unit}${formatNumber(week.low, 0)}`;
      
      const changeClass = week.change >= 0 ? 'up' : 'down';
      const changeSign = week.change >= 0 ? '+' : '';
      weekChange.textContent = `${changeSign}${week.change}%`;
      weekChange.className = `stats-value ${changeClass}`;
    } else {
      weekHigh.textContent = '-';
      weekLow.textContent = '-';
      weekChange.textContent = '-';
      weekChange.className = 'stats-value';
    }
  } catch (error) {
    console.error('[App] 통계 로드 실패:', error);
  }
}

/**
 * 통계 단위 반환
 * @param {string} symbol
 * @param {Object} price
 * @returns {string}
 */
function getStatsUnit(symbol, price) {
  if (!price) return '₩';
  if (price.unit === 'USD') return '$';
  return '₩';
}

/**
 * 트렌드 로드
 */
async function loadTrends() {
  try {
    const result = await window.infohouse.getTrends();
    if (result.success && result.data && result.data.length > 0) {
      renderTrends(result.data);
    }
  } catch (error) {
    console.error('[App] 트렌드 로드 실패:', error);
  }
}

// ============================================
// 배너 관련
// ============================================

const API_BASE = 'https://infoshell-api.realcoin9608.workers.dev';
const bannerPositionMap = {
  'content-top': 'adBannerTop',
  'price-bottom': 'adBannerPrice',
  'stats-bottom': 'adBannerStats',
  'trend-bottom': 'adBannerTrend'
};

// 슬라이더 인터벌 저장
const bannerIntervals = {};

/**
 * 배너 로드
 */
async function loadBanners() {
  try {
    const response = await fetch(`${API_BASE}/api/banners`);
    const result = await response.json();
    
    if (result.success && result.data && result.data.length > 0) {
      result.data.forEach(banner => {
        renderBanner(banner);
      });
    }
  } catch (error) {
    console.error('[App] 배너 로드 실패:', error);
  }
}

/**
 * 배너 렌더링
 */
function renderBanner(banner) {
  const elementId = bannerPositionMap[banner.position];
  if (!elementId) return;
  
  const container = document.getElementById(elementId);
  if (!container) return;
  
  let images = banner.images || [];
  if (images.length === 0) return;
  
  // 이미지 데이터 정규화 (이전 형식 호환)
  images = images.map(img => {
    if (typeof img === 'string') {
      return { filename: img, url: banner.link_url || '' };
    }
    return img;
  });
  
  // 기존 인터벌 정리
  if (bannerIntervals[elementId]) {
    clearInterval(bannerIntervals[elementId]);
  }
  
  const transition = banner.transition || 'fade';
  const interval = banner.interval || 5000;
  
  if (images.length === 1 || transition === 'none') {
    // 단일 이미지
    const img = images[0];
    container.innerHTML = `
      <div class="ad-banner__link" data-url="${img.url || ''}">
        <img src="${API_BASE}/api/banner/image/${img.filename}" alt="광고" class="ad-banner__img">
      </div>
    `;
    
    // 클릭 이벤트
    setupBannerClick(container, img.url);
  } else {
    // 슬라이더
    container.innerHTML = `
      <div class="ad-banner__slider" data-transition="${transition}">
        ${images.map((img, i) => `
          <div class="ad-banner__slide ${i === 0 ? 'active' : ''}" data-url="${img.url || ''}">
            <img src="${API_BASE}/api/banner/image/${img.filename}" alt="광고">
          </div>
        `).join('')}
      </div>
    `;
    
    // 슬라이더 클릭 이벤트 (현재 활성 슬라이드 URL로 이동)
    container.style.cursor = 'pointer';
    container.addEventListener('click', () => {
      const activeSlide = container.querySelector('.ad-banner__slide.active');
      const url = activeSlide?.dataset.url;
      if (url) {
        window.infohouse.openExternal(url);
      }
    });
    
    // 슬라이더 자동 전환
    let currentSlide = 0;
    bannerIntervals[elementId] = setInterval(() => {
      const slides = container.querySelectorAll('.ad-banner__slide');
      if (slides.length === 0) return;
      
      slides[currentSlide].classList.remove('active');
      currentSlide = (currentSlide + 1) % slides.length;
      slides[currentSlide].classList.add('active');
    }, interval);
  }
  
  // 배너 표시
  container.classList.add('ad-banner--loaded');
}

/**
 * 배너 클릭 이벤트 설정
 */
function setupBannerClick(container, url) {
  const bannerLink = container.querySelector('.ad-banner__link');
  if (bannerLink && url) {
    bannerLink.style.cursor = 'pointer';
    bannerLink.addEventListener('click', () => {
      window.infohouse.openExternal(url);
    });
  }
}

/**
 * 트렌드 렌더링
 * @param {Array} trends
 */
function renderTrends(trends) {
  if (!trends || trends.length === 0) {
    trendList.innerHTML = `
      <div class="trend-empty">
        <span>트렌드 데이터가 없습니다</span>
      </div>
    `;
    return;
  }

  // 소스별로 그룹화
  const googleKrTrends = trends.filter(t => t.source === 'google_kr').slice(0, 10);
  const googleUsTrends = trends.filter(t => t.source === 'google_us').slice(0, 10);
  const zumTrends = trends.filter(t => t.source === 'zum').slice(0, 10);

  let html = '';

  // 구글 트렌드 (한국)
  if (googleKrTrends.length > 0) {
    html += `
      <div class="trend-section">
        <div class="trend-section__title">
          <i class="fa-brands fa-google"></i> 트렌드 🇰🇷
        </div>
        <div class="trend-items">
          ${googleKrTrends.map((t, i) => `
            <div class="trend-item">
              <span class="trend-item__rank">${i + 1}</span>
              <span class="trend-item__keyword">${t.keyword}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // 구글 트렌드 (미국)
  if (googleUsTrends.length > 0) {
    html += `
      <div class="trend-section">
        <div class="trend-section__title">
          <i class="fa-brands fa-google"></i> 트렌드 🇺🇸
        </div>
        <div class="trend-items">
          ${googleUsTrends.map((t, i) => `
            <div class="trend-item">
              <span class="trend-item__rank">${i + 1}</span>
              <span class="trend-item__keyword">${t.keyword}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // 줌 실검
  if (zumTrends.length > 0) {
    html += `
      <div class="trend-section">
        <div class="trend-section__title">
          <i class="fa-solid fa-fire"></i> 실시간 키워드
        </div>
        <div class="trend-items">
          ${zumTrends.map((t, i) => `
            <div class="trend-item">
              <span class="trend-item__rank">${i + 1}</span>
              <span class="trend-item__keyword">${t.keyword}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  trendList.innerHTML = html;
}

/**
 * 상태 업데이트
 */
function updateStatus() {
  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  lastUpdateEl.textContent = `마지막 업데이트: ${timeStr}`;
  statusDot.classList.add('active');
}


// ============================================
// 문의 폼 관련 (보안 강화)
// ============================================

const INQUIRY_LIMIT = 3;
const INQUIRY_RESET_HOURS = 1;
const INQUIRY_STORAGE_KEY = 'inquiry_history';
const INQUIRY_MAX_LENGTH = 2000;
const INQUIRY_MIN_LENGTH = 10;

/**
 * XSS 방지를 위한 HTML 이스케이프
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  if (!str) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
  };
  return String(str).replace(/[&<>"'`=\/]/g, s => map[s]);
}

/**
 * 입력값 정제 (trim + 연속 공백 제거)
 * @param {string} str
 * @returns {string}
 */
function sanitizeInput(str) {
  if (!str) return '';
  return String(str)
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, INQUIRY_MAX_LENGTH);
}

/**
 * 스크립트 패턴 탐지
 * @param {string} str
 * @returns {boolean}
 */
function containsMaliciousPattern(str) {
  const patterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /data:\s*text\/html/gi,
    /<iframe/gi,
    /<object/gi,
    /<embed/gi,
    /eval\s*\(/gi,
    /document\.(cookie|write|location)/gi,
    /window\.(location|open)/gi
  ];
  return patterns.some(pattern => pattern.test(str));
}

/**
 * 이메일 형식 검증 (강화)
 * @param {string} email
 * @returns {boolean}
 */
function isValidEmail(email) {
  if (!email || email.length > 254) return false;
  const regex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return regex.test(email);
}

/**
 * 문의 이력 가져오기 (무결성 체크)
 */
function getInquiryHistory() {
  try {
    const data = localStorage.getItem(INQUIRY_STORAGE_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    
    // 배열인지, 숫자 배열인지 검증
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(ts => typeof ts === 'number' && ts > 0);
  } catch {
    localStorage.removeItem(INQUIRY_STORAGE_KEY);
    return [];
  }
}

/**
 * 문의 이력 저장
 */
function saveInquiryHistory(history) {
  try {
    localStorage.setItem(INQUIRY_STORAGE_KEY, JSON.stringify(history));
  } catch {
    // localStorage 실패 시 무시
  }
}

/**
 * 1시간 내 문의 횟수 계산
 */
function getRecentInquiryCount() {
  const history = getInquiryHistory();
  const oneHourAgo = Date.now() - (INQUIRY_RESET_HOURS * 60 * 60 * 1000);
  
  const recent = history.filter(timestamp => timestamp > oneHourAgo);
  
  if (recent.length !== history.length) {
    saveInquiryHistory(recent);
  }
  
  return recent.length;
}

/**
 * 남은 문의 횟수 표시 업데이트
 */
function updateInquiryLimit() {
  const formLimitEl = document.getElementById('formLimit');
  const submitBtn = document.getElementById('submitInquiry');
  if (!formLimitEl) return;
  
  const used = getRecentInquiryCount();
  const remaining = INQUIRY_LIMIT - used;
  
  formLimitEl.textContent = `남은 문의 횟수: ${remaining}회`;
  
  if (remaining <= 0) {
    formLimitEl.classList.add('error');
    formLimitEl.textContent = '1시간 후 다시 문의할 수 있습니다';
    if (submitBtn) submitBtn.disabled = true;
  } else if (remaining === 1) {
    formLimitEl.classList.add('warning');
    formLimitEl.classList.remove('error');
    if (submitBtn) submitBtn.disabled = false;
  } else {
    formLimitEl.classList.remove('warning', 'error');
    if (submitBtn) submitBtn.disabled = false;
  }
}

/** 마지막 제출 시간 (더블 클릭 방지) */
let lastSubmitTime = 0;

/**
 * 토스트 메시지 표시
 * @param {string} message
 * @param {string} type - 'success', 'error', 'warning'
 */
function showToast(message, type = 'error') {
  // 기존 토스트 제거
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.innerHTML = `
    <i class="fa-solid ${type === 'success' ? 'fa-check-circle' : type === 'warning' ? 'fa-exclamation-triangle' : 'fa-times-circle'}"></i>
    <span>${message}</span>
  `;
  document.body.appendChild(toast);
  
  // 애니메이션
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });
  
  // 3초 후 제거
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/**
 * 문의 제출 처리 (보안 강화)
 */
async function handleInquirySubmit(e) {
  e.preventDefault();
  
  // 더블 클릭 방지 (2초)
  const now = Date.now();
  if (now - lastSubmitTime < 2000) {
    return;
  }
  lastSubmitTime = now;
  
  // Rate Limit 체크
  const remaining = INQUIRY_LIMIT - getRecentInquiryCount();
  if (remaining <= 0) {
    showToast('1시간에 3회까지만 문의할 수 있습니다.', 'warning');
    return;
  }
  
  // 입력값 추출 및 정제
  const type = sanitizeInput(document.getElementById('inquiryType').value);
  const email = sanitizeInput(document.getElementById('inquiryEmail').value);
  const content = sanitizeInput(document.getElementById('inquiryContent').value);
  
  // 필수값 체크
  if (!type || !email || !content) {
    showToast('모든 항목을 입력해주세요.', 'error');
    return;
  }
  
  // 문의 유형 검증
  const validTypes = ['general', 'ads', 'bug'];
  if (!validTypes.includes(type)) {
    showToast('올바른 문의 유형을 선택해주세요.', 'error');
    return;
  }
  
  // 이메일 형식 체크
  if (!isValidEmail(email)) {
    showToast('올바른 이메일 형식을 입력해주세요.', 'error');
    return;
  }
  
  // 내용 길이 체크
  if (content.length < INQUIRY_MIN_LENGTH) {
    showToast(`문의 내용을 ${INQUIRY_MIN_LENGTH}자 이상 입력해주세요.`, 'error');
    return;
  }
  
  if (content.length > INQUIRY_MAX_LENGTH) {
    showToast(`문의 내용은 ${INQUIRY_MAX_LENGTH}자 이내로 입력해주세요.`, 'error');
    return;
  }
  
  // 악성 패턴 탐지
  if (containsMaliciousPattern(content) || containsMaliciousPattern(email)) {
    showToast('허용되지 않는 문자가 포함되어 있습니다.', 'error');
    return;
  }
  
  const submitBtn = document.getElementById('submitInquiry');
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 전송 중...';
  
  try {
    // 이스케이프 처리된 데이터
    const safeData = {
      type: escapeHtml(type),
      email: escapeHtml(email),
      content: escapeHtml(content),
      timestamp: Date.now(),
      version: '1.0.8'
    };
    
    // API 연동
    const response = await fetch('https://infoshell-api.realcoin9608.workers.dev/api/inquiry', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(safeData)
    });
    
    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || 'Server error');
    }
    
    // 이력 저장
    const history = getInquiryHistory();
    history.push(Date.now());
    saveInquiryHistory(history);
    
    // 폼 초기화
    document.getElementById('supportForm').reset();
    updateCharCount();
    
    showToast('문의가 정상적으로 접수되었습니다.', 'success');
    
  } catch (error) {
    console.error('[App] 문의 전송 실패:', error);
    showToast('문의 전송에 실패했습니다. 잠시 후 다시 시도해주세요.', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> 문의 보내기';
    updateInquiryLimit();
  }
}

// 앱 시작
document.addEventListener('DOMContentLoaded', init);
