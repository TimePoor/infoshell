/**
 * #InfoHouse - 금/은 시세 수집기 (TradingEconomics)
 * USD 시세를 가져와서 KRW로 변환하여 저장
 */

const axios = require('axios');
const cheerio = require('cheerio');
const { insertPrice, getPrice } = require('../../database/queries.js');

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5'
};

/** 기본 환율 (USD/KRW) - DB에 환율 없을 때 사용 */
const DEFAULT_EXCHANGE_RATE = 1450;

/**
 * 현재 USD/KRW 환율 조회
 * @returns {Promise<number>}
 */
async function getExchangeRate() {
  // 1. DB에서 최신 USD 환율 조회
  try {
    const usdRate = getPrice('USD');
    console.log('[Gold] DB 환율 조회:', usdRate);
    if (usdRate && usdRate.price) {
      console.log('[Gold] DB 환율 사용:', usdRate.price);
      return usdRate.price;
    }
  } catch (e) {
    console.log('[Gold] DB 환율 조회 실패:', e.message);
  }

  // 2. DB에 없으면 직접 가져오기
  try {
    console.log('[Gold] 환율 직접 조회 시도...');
    const url = 'https://tradingeconomics.com/usdkrw:cur';
    const response = await axios.get(url, { headers: HEADERS, timeout: 10000 });
    const $ = cheerio.load(response.data);
    
    const priceText = $('#p').first().text().trim().split(/\s/)[0];
    console.log('[Gold] 환율 파싱 텍스트:', priceText);
    
    if (priceText) {
      const rate = parseFloat(priceText.replace(/,/g, ''));
      if (!isNaN(rate) && rate > 100) {  // 환율이 100 이상이어야 정상
        console.log('[Gold] 직접 조회 환율:', rate);
        return rate;
      }
    }
  } catch (e) {
    console.warn('[Gold] 환율 직접 조회 실패:', e.message);
  }

  console.log('[Gold] 기본 환율 사용:', DEFAULT_EXCHANGE_RATE);
  return DEFAULT_EXCHANGE_RATE;
}

/**
 * TradingEconomics에서 가격/변동 추출
 * @param {cheerio.CheerioAPI} $ - Cheerio 인스턴스
 * @returns {{ price: number, change: number } | null}
 */
function extractPrice($) {
  // 방법 1: meta description에서 추출 (가장 안정적)
  const metaDesc = $('meta[name="description"]').attr('content') || '';
  const metaMatch = metaDesc.match(/(?:rose|fell|increased|decreased|remained)?\s*(?:to|at)?\s*([\d,]+\.?\d*)\s*USD/i);
  
  let price = null;
  let change = 0;
  
  if (metaMatch) {
    price = parseFloat(metaMatch[1].replace(/,/g, ''));
    
    // 변동률 추출
    const changeMatch = metaDesc.match(/(?:up|down)\s+([\d.]+)%/i);
    if (changeMatch) {
      change = parseFloat(changeMatch[1]);
      if (metaDesc.toLowerCase().includes('down')) {
        change = -change;
      }
    }
  }
  
  // 방법 2: #p 요소에서 추출 (fallback)
  if (!price) {
    const priceText = $('#p').first().text().trim();
    if (priceText) {
      price = parseFloat(priceText.replace(/,/g, ''));
    }
    
    const changeText = $('#pch').first().text().trim();
    if (changeText) {
      const parsed = parseFloat(changeText.replace(/,/g, '').replace('%', ''));
      if (!isNaN(parsed)) {
        change = parsed;
      }
    }
  }
  
  if (!price || isNaN(price)) {
    return null;
  }
  
  return { price, change };
}

/**
 * 금 시세 수집 (KRW 변환)
 * @returns {Promise<import('../../types/index.js').CollectResult>}
 */
async function collectGold() {
  try {
    const url = 'https://tradingeconomics.com/commodity/gold';
    const response = await axios.get(url, { headers: HEADERS, timeout: 10000 });
    const $ = cheerio.load(response.data);
    
    const result = extractPrice($);
    
    if (!result) {
      throw new Error('금 시세를 찾을 수 없습니다');
    }

    // USD → KRW 변환 후 돈 단위로 환산
    // 1 트로이온스 = 31.1035g, 1돈 = 3.75g
    // 1 트로이온스 = 8.294 돈
    const TROY_OZ_TO_DON = 31.1035 / 3.75; // ≈ 8.294
    const exchangeRate = await getExchangeRate();
    const pricePerOzKRW = result.price * exchangeRate;
    const pricePerDon = Math.round(pricePerOzKRW / TROY_OZ_TO_DON);

    /** @type {import('../../types/index.js').PriceData} */
    const data = {
      category: 'gold',
      symbol: 'XAU',
      price: pricePerDon,
      change: result.change,
      unit: 'KRW',
      collectedAt: new Date()
    };

    insertPrice(data);
    
    return { success: true, data: [data] };
  } catch (error) {
    console.error('[Gold] 수집 실패:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * 은 시세 수집 (KRW 변환)
 * @returns {Promise<import('../../types/index.js').CollectResult>}
 */
async function collectSilver() {
  try {
    const url = 'https://tradingeconomics.com/commodity/silver';
    const response = await axios.get(url, { headers: HEADERS, timeout: 10000 });
    const $ = cheerio.load(response.data);
    
    const result = extractPrice($);
    
    if (!result) {
      throw new Error('은 시세를 찾을 수 없습니다');
    }

    // USD → KRW 변환 후 돈 단위로 환산
    const TROY_OZ_TO_DON = 31.1035 / 3.75; // ≈ 8.294
    const exchangeRate = await getExchangeRate();
    const pricePerOzKRW = result.price * exchangeRate;
    const pricePerDon = Math.round(pricePerOzKRW / TROY_OZ_TO_DON);

    /** @type {import('../../types/index.js').PriceData} */
    const data = {
      category: 'silver',
      symbol: 'XAG',
      price: pricePerDon,
      change: result.change,
      unit: 'KRW',
      collectedAt: new Date()
    };

    insertPrice(data);
    
    return { success: true, data: [data] };
  } catch (error) {
    console.error('[Silver] 수집 실패:', error.message);
    return { success: false, error: error.message };
  }
}

module.exports = {
  collectGold,
  collectSilver
};
