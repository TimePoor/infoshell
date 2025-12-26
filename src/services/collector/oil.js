/**
 * #InfoHouse - 유가 수집기 (GlobalPetrolPrices - 한국 휘발유/경유)
 */

const axios = require('axios');
const cheerio = require('cheerio');
const { insertPrice } = require('../../database/queries.js');

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5'
};

// 수집할 유종
const OIL_TYPES = {
  gasoline: {
    url: 'https://www.globalpetrolprices.com/South-Korea/gasoline_prices/',
    symbol: 'GASOLINE',
    name: '휘발유'
  },
  diesel: {
    url: 'https://www.globalpetrolprices.com/South-Korea/diesel_prices/',
    symbol: 'DIESEL',
    name: '경유'
  }
};

/**
 * GlobalPetrolPrices에서 가격 추출
 * @param {cheerio.CheerioAPI} $ - Cheerio 인스턴스
 * @returns {{ price: number, change: number } | null}
 */
function extractOilPrice($) {
  let price = null;
  let change = 0;

  // 테이블에서 "Current price" 행 찾기
  $('table').each((_, table) => {
    const tableText = $(table).text();
    
    // "Current price 1,741.77" 패턴 찾기
    const priceMatch = tableText.match(/Current\s*price\s*([\d,]+\.?\d*)/i);
    if (priceMatch) {
      price = parseFloat(priceMatch[1].replace(/,/g, ''));
    }
    
    // "One month ago ... X.X %" 에서 월간 변동률 추출
    const changeMatch = tableText.match(/One\s*month\s*ago[\s\S]*?([\d.]+)\s*%/i);
    if (changeMatch) {
      change = parseFloat(changeMatch[1]);
    }
  });

  // Title에서 fallback 추출
  if (!price) {
    const title = $('title').text();
    // "South Korea gasoline prices, 22-Dec-2025" 형식
    const titleMatch = title.match(/KRW\s*([\d,]+\.?\d*)/i);
    if (titleMatch) {
      price = parseFloat(titleMatch[1].replace(/,/g, ''));
    }
  }

  if (!price || isNaN(price)) {
    return null;
  }

  return { price, change };
}

/**
 * 단일 유종 가격 수집
 * @param {string} type - 유종 키 (gasoline, diesel)
 * @returns {Promise<import('../../types/index.js').PriceData|null>}
 */
async function fetchOilPrice(type) {
  const config = OIL_TYPES[type];
  if (!config) return null;

  try {
    const response = await axios.get(config.url, { headers: HEADERS, timeout: 10000 });
    const $ = cheerio.load(response.data);

    const result = extractOilPrice($);

    if (!result) {
      console.warn(`[Oil] ${config.name} 시세를 찾을 수 없습니다`);
      return null;
    }

    return {
      category: 'oil',
      symbol: config.symbol,
      price: result.price,
      change: result.change,
      unit: 'KRW',
      collectedAt: new Date()
    };
  } catch (error) {
    console.error(`[Oil] ${config.name} 수집 실패:`, error.message);
    return null;
  }
}

/**
 * 유가 수집 (휘발유, 경유)
 * @returns {Promise<import('../../types/index.js').CollectResult>}
 */
async function collectOil() {
  try {
    const data = [];
    const types = Object.keys(OIL_TYPES);

    for (let i = 0; i < types.length; i++) {
      const type = types[i];
      const priceData = await fetchOilPrice(type);

      if (priceData) {
        insertPrice(priceData);
        data.push(priceData);
      }

      // 요청 간 딜레이
      if (i < types.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return { success: true, data };
  } catch (error) {
    console.error('[Oil] 수집 실패:', error.message);
    return { success: false, error: error.message };
  }
}

module.exports = {
  collectOil,
  OIL_TYPES
};
