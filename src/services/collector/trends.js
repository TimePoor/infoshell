/**
 * #InfoHouse - 트렌드 수집기
 * 구글 트렌드 + 줌 실시간 검색어
 */

const axios = require('axios');
const cheerio = require('cheerio');
const { insertTrends } = require('../../database/queries.js');

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'
};

/**
 * 구글 트렌드 RSS 수집
 * @param {string} geo - 지역 코드 (KR, US 등)
 * @param {string} source - 소스명
 * @returns {Promise<Array<{keyword: string, rank: number, traffic: string}>>}
 */
async function fetchGoogleTrends(geo = 'KR', source = 'google_kr') {
  try {
    const domain = geo === 'KR' ? 'trends.google.co.kr' : 'trends.google.com';
    const url = `https://${domain}/trending/rss?geo=${geo}`;
    console.log(`[Trends] 구글 트렌드 (${geo}) 수집 중...`);
    
    const res = await axios.get(url, { 
      headers: HEADERS, 
      timeout: 10000 
    });
    
    const $ = cheerio.load(res.data, { xmlMode: true });
    const items = $('item');
    const trends = [];
    
    items.each((i, el) => {
      const title = $(el).find('title').text().trim();
      const traffic = $(el).find('ht\\:approx_traffic, approx_traffic').text().trim();
      
      if (title) {
        trends.push({
          keyword: title,
          rank: i + 1,
          traffic: traffic || '',
          source: source
        });
      }
    });
    
    console.log(`[Trends] 구글 트렌드 (${geo}):`, trends.length, '개');
    return trends;
  } catch (error) {
    console.error(`[Trends] 구글 트렌드 (${geo}) 수집 실패:`, error.message);
    return [];
  }
}

/**
 * 줌 실시간 검색어 수집
 * @returns {Promise<Array<{keyword: string, rank: number}>>}
 */
async function fetchZumTrends() {
  try {
    console.log('[Trends] 줌 실검 수집 중...');
    const res = await axios.get('https://zum.com/', { 
      headers: HEADERS, 
      timeout: 10000 
    });
    
    const $ = cheerio.load(res.data);
    const trends = [];
    
    // 줌 실검 영역 파싱
    $('[class*="keyword"], [class*="rank"]').find('a').each((i, el) => {
      const text = $(el).text().trim();
      // 앞 숫자(순위) 제거, 뒤 숫자(변동) 제거
      const keyword = text
        .replace(/^\d+\s*/, '')      // 앞 순위 숫자 제거
        .replace(/\s+\d+$/, '')      // 뒤 변동 숫자 제거
        .trim();
      
      if (keyword && keyword.length > 1 && keyword.length < 30 && !trends.find(t => t.keyword === keyword)) {
        trends.push({
          keyword: keyword,
          rank: trends.length + 1
        });
      }
    });
    
    console.log('[Trends] 줌 실검:', trends.length, '개');
    return trends.slice(0, 10);  // 상위 10개만
  } catch (error) {
    console.error('[Trends] 줌 실검 수집 실패:', error.message);
    return [];
  }
}

/**
 * 트렌드 수집 (전체)
 * @returns {Promise<import('../../types/index.js').CollectResult>}
 */
async function collectTrends() {
  try {
    const allTrends = [];
    
    // 구글 트렌드 (한국)
    const googleKrTrends = await fetchGoogleTrends('KR', 'google_kr');
    for (const trend of googleKrTrends) {
      allTrends.push({
        source: 'google_kr',
        keyword: trend.keyword,
        rank: trend.rank
      });
    }
    
    // 딜레이
    await new Promise(r => setTimeout(r, 500));
    
    // 구글 트렌드 (미국)
    const googleUsTrends = await fetchGoogleTrends('US', 'google_us');
    for (const trend of googleUsTrends) {
      allTrends.push({
        source: 'google_us',
        keyword: trend.keyword,
        rank: trend.rank
      });
    }
    
    // 딜레이
    await new Promise(r => setTimeout(r, 500));
    
    // 줌 실검
    const zumTrends = await fetchZumTrends();
    for (const trend of zumTrends) {
      allTrends.push({
        source: 'zum',
        keyword: trend.keyword,
        rank: trend.rank
      });
    }
    
    // DB 저장
    if (allTrends.length > 0) {
      insertTrends(allTrends);
    }
    
    console.log('[Trends] 총 수집:', allTrends.length, '개');
    return { success: true, data: allTrends };
  } catch (error) {
    console.error('[Trends] 수집 실패:', error.message);
    return { success: false, error: error.message };
  }
}

module.exports = {
  collectTrends,
  fetchGoogleTrends,
  fetchZumTrends
};
