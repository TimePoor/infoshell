/**
 * #InfoHouse - 계산기 모듈
 */

// DOM 요소
let calcAmount, calcFrom, calcTo, calcSwap, calcResult, calcRate;
let goldAmount, goldUnit, goldType, goldResult;

// 현재 가격 참조 (app.js에서 설정)
let _calcPrices = null;

/**
 * 초기화
 * @param {Map} prices - 현재 가격 Map
 */
function initCalculatorModule(prices) {
  _calcPrices = prices;
  
  calcAmount = document.getElementById('calcAmount');
  calcFrom = document.getElementById('calcFrom');
  calcTo = document.getElementById('calcTo');
  calcSwap = document.getElementById('calcSwap');
  calcResult = document.getElementById('calcResult');
  calcRate = document.getElementById('calcRate');
  goldAmount = document.getElementById('goldAmount');
  goldUnit = document.getElementById('goldUnit');
  goldType = document.getElementById('goldType');
  goldResult = document.getElementById('goldResult');

  // 이벤트 등록
  calcAmount.addEventListener('input', updateExchangeCalc);
  calcFrom.addEventListener('change', updateExchangeCalc);
  calcTo.addEventListener('change', updateExchangeCalc);
  calcSwap.addEventListener('click', () => {
    const temp = calcFrom.value;
    calcFrom.value = calcTo.value;
    calcTo.value = temp;
    updateExchangeCalc();
  });

  goldAmount.addEventListener('input', updateGoldCalc);
  goldUnit.addEventListener('change', updateGoldCalc);
  goldType.addEventListener('change', updateGoldCalc);
}

/**
 * 가격 참조 업데이트
 */
function setPrices(prices) {
  _calcPrices = prices;
}

/**
 * 환율 계산기 업데이트
 */
function updateExchangeCalc() {
  const amount = parseFloat(calcAmount.value) || 0;
  const from = calcFrom.value;
  const to = calcTo.value;

  // 환율 가져오기 (KRW 기준)
  const rates = {
    KRW: 1,
    USD: _calcPrices?.get('USD')?.price || 1445,
    EUR: _calcPrices?.get('EUR')?.price || 1700,
    JPY: (_calcPrices?.get('JPY')?.price || 927) / 100,
    CNY: _calcPrices?.get('CNY')?.price || 206,
    RUB: _calcPrices?.get('RUB')?.price || 18,
    VND: (_calcPrices?.get('VND')?.price || 5.7) / 100
  };

  const fromRate = rates[from];
  const toRate = rates[to];
  
  const krwAmount = amount * fromRate;
  const result = krwAmount / toRate;

  const symbol = getCurrencySymbol(to);
  calcResult.textContent = `${symbol}${formatNumber(result, to === 'KRW' ? 0 : 2)}`;
  
  if (from !== to) {
    const rate = fromRate / toRate;
    calcRate.textContent = `1 ${from} = ${formatNumber(rate, 4)} ${to}`;
  } else {
    calcRate.textContent = '';
  }
}

/**
 * 통화 심볼 반환
 */
function getCurrencySymbol(currency) {
  const symbols = {
    KRW: '₩',
    USD: '$',
    EUR: '€',
    JPY: '¥',
    CNY: '¥',
    RUB: '₽',
    VND: '₫'
  };
  return symbols[currency] || '';
}

/**
 * 금/은 계산기 업데이트
 */
function updateGoldCalc() {
  const amount = parseFloat(goldAmount.value) || 0;
  const unit = goldUnit.value;
  const type = goldType.value;

  const pricePerDon = type === 'gold' 
    ? (_calcPrices?.get('XAU')?.price || 789000)
    : (_calcPrices?.get('XAG')?.price || 13000);

  const DON_TO_GRAM = 3.75;
  const OZ_TO_GRAM = 31.1035;

  let grams = 0;
  
  switch (unit) {
    case 'don':
      grams = amount * DON_TO_GRAM;
      break;
    case 'gram':
      grams = amount;
      break;
    case 'ounce':
      grams = amount * OZ_TO_GRAM;
      break;
    case 'krw':
      const pricePerGram = pricePerDon / DON_TO_GRAM;
      grams = amount / pricePerGram;
      break;
  }

  const dons = grams / DON_TO_GRAM;
  const ounces = grams / OZ_TO_GRAM;
  const pricePerGram = pricePerDon / DON_TO_GRAM;
  const totalPrice = grams * pricePerGram;

  goldResult.innerHTML = `
    <div class="calculator__result-item">
      <span class="label">돈</span>
      <span class="value">${formatNumber(dons, 2)}돈</span>
    </div>
    <div class="calculator__result-item">
      <span class="label">그램</span>
      <span class="value">${formatNumber(grams, 2)}g</span>
    </div>
    <div class="calculator__result-item">
      <span class="label">온스</span>
      <span class="value">${formatNumber(ounces, 4)}oz</span>
    </div>
    <div class="calculator__result-item">
      <span class="label">가격</span>
      <span class="value">₩${formatNumber(totalPrice, 0)}</span>
    </div>
  `;
}

// 전역 노출
window.CalculatorModule = {
  init: initCalculatorModule,
  setPrices,
  updateExchangeCalc,
  updateGoldCalc
};
