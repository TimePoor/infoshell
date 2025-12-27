/**
 * #InfoHouse - 환율 수집기 (exchangerate-api.com)
 * 무료 API 사용, USD 기준 환율을 KRW 기준으로 변환
 */

const axios = require('axios');
const cheerio = require('cheerio');
const { insertPrice } = require('../../database/queries.js');

const API_URL = 'https://api.exchangerate-api.com/v4/latest/USD';

// Investing.com 환율 URL 매핑
const INVESTING_URLS = {
  USD: 'https://kr.investing.com/currencies/usd-krw',
  EUR: 'https://kr.investing.com/currencies/eur-krw',
  JPY: 'https://kr.investing.com/currencies/jpy-krw',
  CNY: 'https://kr.investing.com/currencies/cny-krw',
  RUB: 'https://kr.investing.com/currencies/rub-krw',
  VND: 'https://kr.investing.com/currencies/vnd-krw'
};

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
};

/**
 * Investing.com에서 단일 환율 변동률 크롤링
 * @param {string} currency 통화 코드
 * @param {string} url 크롤링 URL
 * @returns {Promise<number>} 변동률
 */
async function fetchSingleChangeRate(currency, url) {
  try {
    const response = await axios.get(url, {
      headers: HEADERS,
      timeout: 15000
    });
    
    const $ = cheerio.load(response.data);
    
    // Investing.com 페이지에서 변동률 추출
    // 형식: "1,448.53 -22.17(-1.51%)" 또는 비슷한 패턴
    const pageText = $('body').text();
    
    // 변동률 패턴 찾기: (-1.51%) 또는 (+1.51%)
    const changeMatch = pageText.match(/\(([+-]?\d+\.?\d*)%\)/);
    if (changeMatch) {
      const changeRate = parseFloat(changeMatch[1]);
      if (!isNaN(changeRate)) {
        console.log(`[Exchange] ${currency} 변동률: ${changeRate}%`);
        return changeRate;
      }
    }
    
    // 대체 패턴: 숫자(-1.51%) 형태
    const altMatch = pageText.match(/([+-]?\d+\.?\d*)%/);
    if (altMatch) {
      // 첫 번째 퍼센트 값이 변동률일 수 있음
      const val = parseFloat(altMatch[1]);
      if (!isNaN(val) && Math.abs(val) < 20) { // 합리적인 범위
        return val;
      }
    }
    
    return 0;
  } catch (error) {
    console.error(`[Exchange] ${currency} 크롤링 실패:`, error.message);
    return 0;
  }
}

/**
 * Investing.com에서 환율 변동률 크롤링
 * @returns {Promise<Object>} 통화별 변동률 객체
 */
async function fetchInvestingChangeRates() {
  const changeRates = {};
  
  try {
    // 순차적으로 크롤링 (너무 빠르면 차단될 수 있음)
    for (const [currency, url] of Object.entries(INVESTING_URLS)) {
      changeRates[currency] = await fetchSingleChangeRate(currency, url);
      // 요청 간 딜레이
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('[Exchange] Investing.com 변동률 크롤링 완료:', Object.keys(changeRates).length, '건');
  } catch (error) {
    console.error('[Exchange] Investing.com 크롤링 실패:', error.message);
  }
  
  return changeRates;
}

/**
 * 환율 수집
 * @returns {Promise<import('../../types/index.js').CollectResult>}
 */
async function collectExchange() {
  try {
    console.log('[Exchange] 환율 수집 시작...');
    
    // 1. 기존 API에서 환율 가져오기
    const response = await axios.get(API_URL, { timeout: 10000 });
    const rates = response.data.rates;
    
    // USD/KRW 기준
    const usdKrw = rates.KRW;
    console.log('[Exchange] USD/KRW:', usdKrw);
    
    // 2. 네이버 금융에서 변동률 가져오기
    const changeRates = await fetchInvestingChangeRates();
    console.log('[Exchange] 변동률:', changeRates);
    
    const data = [];
    
    // USD
    const usdData = {
      category: 'exchange',
      symbol: 'USD',
      price: Math.round(usdKrw * 100) / 100,
      change: changeRates.USD || 0,
      unit: 'KRW',
      collectedAt: new Date()
    };
    insertPrice(usdData);
    data.push(usdData);
    console.log('[Exchange] USD:', usdData.price, '변동:', usdData.change);
    
    // EUR (1 EUR = ? KRW)
    const eurKrw = usdKrw / rates.EUR;
    const eurData = {
      category: 'exchange',
      symbol: 'EUR',
      price: Math.round(eurKrw * 100) / 100,
      change: changeRates.EUR || 0,
      unit: 'KRW',
      collectedAt: new Date()
    };
    insertPrice(eurData);
    data.push(eurData);
    console.log('[Exchange] EUR:', eurData.price, '변동:', eurData.change);
    
    // JPY (100 JPY = ? KRW)
    const jpyKrw = (usdKrw / rates.JPY) * 100;  // 100엔 기준
    const jpyData = {
      category: 'exchange',
      symbol: 'JPY',
      price: Math.round(jpyKrw * 100) / 100,
      change: changeRates.JPY || 0,
      unit: 'KRW',
      collectedAt: new Date()
    };
    insertPrice(jpyData);
    data.push(jpyData);
    console.log('[Exchange] JPY (100엔):', jpyData.price, '변동:', jpyData.change);
    
    // CNY (1 CNY = ? KRW)
    const cnyKrw = usdKrw / rates.CNY;
    const cnyData = {
      category: 'exchange',
      symbol: 'CNY',
      price: Math.round(cnyKrw * 100) / 100,
      change: changeRates.CNY || 0,
      unit: 'KRW',
      collectedAt: new Date()
    };
    insertPrice(cnyData);
    data.push(cnyData);
    console.log('[Exchange] CNY:', cnyData.price, '변동:', cnyData.change);
    
    // RUB (1 RUB = ? KRW)
    const rubKrw = usdKrw / rates.RUB;
    const rubData = {
      category: 'exchange',
      symbol: 'RUB',
      price: Math.round(rubKrw * 100) / 100,
      change: changeRates.RUB || 0,
      unit: 'KRW',
      collectedAt: new Date()
    };
    insertPrice(rubData);
    data.push(rubData);
    console.log('[Exchange] RUB:', rubData.price, '변동:', rubData.change);
    
    // VND (100 VND = ? KRW)
    const vndKrw = (usdKrw / rates.VND) * 100;  // 100동 기준
    const vndData = {
      category: 'exchange',
      symbol: 'VND',
      price: Math.round(vndKrw * 100) / 100,
      change: changeRates.VND || 0,
      unit: 'KRW',
      collectedAt: new Date()
    };
    insertPrice(vndData);
    data.push(vndData);
    console.log('[Exchange] VND (100동):', vndData.price, '변동:', vndData.change);
    
    console.log('[Exchange] 환율 수집 완료:', data.length, '건');
    return { success: true, data };
  } catch (error) {
    console.error('[Exchange] 수집 실패:', error.message);
    return { success: false, error: error.message };
  }
}

module.exports = {
  collectExchange
};
