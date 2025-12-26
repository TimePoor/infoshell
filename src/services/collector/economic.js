/**
 * INFOShell - 경제지표 수집기 (금리, CPI)
 * 네이버 금융 크롤링
 */

const axios = require('axios');
const cheerio = require('cheerio');

/**
 * 한국 기준금리 크롤링 (네이버 금융)
 * @returns {Promise<Object|null>}
 */
async function fetchKoreaInterestRate() {
  try {
    // 네이버 금융 - 국내 금리
    const url = 'https://finance.naver.com/marketindex/interestRate.naver';
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    
    // 한국 기준금리 찾기
    let rate = null;
    
    // 테이블에서 기준금리 행 찾기
    $('table.tbl_exchange tbody tr').each((i, row) => {
      const name = $(row).find('td:first-child').text().trim();
      if (name.includes('한국') && name.includes('기준금리')) {
        const value = $(row).find('td:nth-child(2)').text().trim();
        rate = parseFloat(value.replace(/,/g, ''));
      }
    });

    // 다른 방식으로 시도
    if (!rate) {
      const rateText = $('.tb_td1').first().text().trim();
      if (rateText) {
        rate = parseFloat(rateText.replace(/,/g, ''));
      }
    }

    if (rate && !isNaN(rate)) {
      return {
        symbol: 'RATE_KR',
        name: '한국 기준금리',
        price: rate,
        unit: '%',
        category: 'economic',
        change: 0,
        change_rate: 0
      };
    }

    return null;
  } catch (error) {
    console.error('[Economic] 한국 금리 크롤링 실패:', error.message);
    return null;
  }
}

/**
 * 미국 금리 크롤링 (인베스팅닷컴)
 * @returns {Promise<Object|null>}
 */
async function fetchUSInterestRate() {
  try {
    const url = 'https://kr.investing.com/economic-calendar/interest-rate-decision-168';
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'ko-KR,ko;q=0.9'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    
    // 현재 금리 값 찾기
    const rateText = $('.ecEventActualValue, .arial_14').first().text().trim();
    const rate = parseFloat(rateText.replace(/[^0-9.]/g, ''));

    if (rate && !isNaN(rate)) {
      return {
        symbol: 'RATE_US',
        name: '미국 기준금리',
        price: rate,
        unit: '%',
        category: 'economic',
        change: 0,
        change_rate: 0
      };
    }

    return null;
  } catch (error) {
    console.error('[Economic] 미국 금리 크롤링 실패:', error.message);
    return null;
  }
}

/**
 * 한국 CPI 크롤링
 * @returns {Promise<Object|null>}
 */
async function fetchKoreaCPI() {
  try {
    // 기본값 사용 (크롤링 어려움 - 통계청 데이터 월 1회 발표)
    return {
      symbol: 'CPI_KR',
      name: '한국 소비자물가',
      price: 1.9, // 2024년 11월 기준 YoY
      unit: '%',
      category: 'economic',
      change: 0,
      change_rate: 0
    };
  } catch (error) {
    console.error('[Economic] 한국 CPI 실패:', error.message);
    return null;
  }
}

/**
 * 미국 CPI (소비자물가지수)
 * @returns {Promise<Object|null>}
 */
async function fetchUSCPI() {
  try {
    // 기본값 사용 (BLS 데이터 월 1회 발표)
    return {
      symbol: 'CPI_US',
      name: '미국 소비자물가',
      price: 2.7, // 2024년 11월 기준 YoY
      unit: '%',
      category: 'economic',
      change: 0,
      change_rate: 0
    };
  } catch (error) {
    console.error('[Economic] 미국 CPI 실패:', error.message);
    return null;
  }
}

/**
 * 경제지표 종합 수집
 * @returns {Promise<{success: boolean, data: Array}>}
 */
async function collectEconomicIndicators() {
  console.log('[Economic] 경제지표 수집 시작');
  
  const results = [];
  
  // 병렬 수집
  const [koreaRate, usRate, koreaCPI, usCPI] = await Promise.all([
    fetchKoreaInterestRate(),
    fetchUSInterestRate(),
    fetchKoreaCPI(),
    fetchUSCPI()
  ]);

  if (koreaRate) results.push(koreaRate);
  if (usRate) results.push(usRate);
  if (koreaCPI) results.push(koreaCPI);
  if (usCPI) results.push(usCPI);

  // 크롤링 실패 시 기본값 제공
  if (!results.find(r => r.symbol === 'RATE_KR')) {
    results.push({
      symbol: 'RATE_KR',
      name: '한국 기준금리',
      price: 3.0, // 2024년 12월 기준
      unit: '%',
      category: 'economic',
      change: 0,
      change_rate: 0
    });
  }

  if (!results.find(r => r.symbol === 'RATE_US')) {
    results.push({
      symbol: 'RATE_US',
      name: '미국 기준금리',
      price: 4.5, // 2024년 12월 기준
      unit: '%',
      category: 'economic',
      change: 0,
      change_rate: 0
    });
  }

  if (!results.find(r => r.symbol === 'CPI_KR')) {
    results.push({
      symbol: 'CPI_KR',
      name: '한국 소비자물가',
      price: 1.9,
      unit: '%',
      category: 'economic',
      change: 0,
      change_rate: 0
    });
  }

  if (!results.find(r => r.symbol === 'CPI_US')) {
    results.push({
      symbol: 'CPI_US',
      name: '미국 소비자물가',
      price: 2.7,
      unit: '%',
      category: 'economic',
      change: 0,
      change_rate: 0
    });
  }

  console.log(`[Economic] 경제지표 ${results.length}개 수집 완료`);
  return {
    success: true,
    data: results
  };
}

module.exports = {
  collectEconomicIndicators,
  fetchKoreaInterestRate,
  fetchUSInterestRate,
  fetchKoreaCPI,
  fetchUSCPI
};
