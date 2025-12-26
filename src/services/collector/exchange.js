/**
 * #InfoHouse - 환율 수집기 (exchangerate-api.com)
 * 무료 API 사용, USD 기준 환율을 KRW 기준으로 변환
 */

const axios = require('axios');
const { insertPrice } = require('../../database/queries.js');

const API_URL = 'https://api.exchangerate-api.com/v4/latest/USD';

/**
 * 환율 수집
 * @returns {Promise<import('../../types/index.js').CollectResult>}
 */
async function collectExchange() {
  try {
    console.log('[Exchange] 환율 수집 시작...');
    
    const response = await axios.get(API_URL, { timeout: 10000 });
    const rates = response.data.rates;
    
    // USD/KRW 기준
    const usdKrw = rates.KRW;
    console.log('[Exchange] USD/KRW:', usdKrw);
    
    const data = [];
    
    // USD
    const usdData = {
      category: 'exchange',
      symbol: 'USD',
      price: Math.round(usdKrw * 100) / 100,
      change: 0,  // 이 API는 변동률 제공 안 함
      unit: 'KRW',
      collectedAt: new Date()
    };
    insertPrice(usdData);
    data.push(usdData);
    console.log('[Exchange] USD:', usdData.price);
    
    // EUR (1 EUR = ? KRW)
    const eurKrw = usdKrw / rates.EUR;
    const eurData = {
      category: 'exchange',
      symbol: 'EUR',
      price: Math.round(eurKrw * 100) / 100,
      change: 0,
      unit: 'KRW',
      collectedAt: new Date()
    };
    insertPrice(eurData);
    data.push(eurData);
    console.log('[Exchange] EUR:', eurData.price);
    
    // JPY (100 JPY = ? KRW)
    const jpyKrw = (usdKrw / rates.JPY) * 100;  // 100엔 기준
    const jpyData = {
      category: 'exchange',
      symbol: 'JPY',
      price: Math.round(jpyKrw * 100) / 100,
      change: 0,
      unit: 'KRW',
      collectedAt: new Date()
    };
    insertPrice(jpyData);
    data.push(jpyData);
    console.log('[Exchange] JPY (100엔):', jpyData.price);
    
    // CNY (1 CNY = ? KRW)
    const cnyKrw = usdKrw / rates.CNY;
    const cnyData = {
      category: 'exchange',
      symbol: 'CNY',
      price: Math.round(cnyKrw * 100) / 100,
      change: 0,
      unit: 'KRW',
      collectedAt: new Date()
    };
    insertPrice(cnyData);
    data.push(cnyData);
    console.log('[Exchange] CNY:', cnyData.price);
    
    // RUB (1 RUB = ? KRW)
    const rubKrw = usdKrw / rates.RUB;
    const rubData = {
      category: 'exchange',
      symbol: 'RUB',
      price: Math.round(rubKrw * 100) / 100,
      change: 0,
      unit: 'KRW',
      collectedAt: new Date()
    };
    insertPrice(rubData);
    data.push(rubData);
    console.log('[Exchange] RUB:', rubData.price);
    
    // VND (100 VND = ? KRW)
    const vndKrw = (usdKrw / rates.VND) * 100;  // 100동 기준
    const vndData = {
      category: 'exchange',
      symbol: 'VND',
      price: Math.round(vndKrw * 100) / 100,
      change: 0,
      unit: 'KRW',
      collectedAt: new Date()
    };
    insertPrice(vndData);
    data.push(vndData);
    console.log('[Exchange] VND (100동):', vndData.price);
    
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
