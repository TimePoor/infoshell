/**
 * #InfoHouse - 암호화폐 수집기
 */

const axios = require('axios');
const { insertPrice } = require('../../database/queries.js');

// CoinGecko API (무료)
const COINGECKO_API = 'https://api.coingecko.com/api/v3';

// 수집할 코인 목록
const COINS = [
  { id: 'bitcoin', symbol: 'BTC' },
  { id: 'ethereum', symbol: 'ETH' }
];

/**
 * 암호화폐 시세 수집
 * @returns {Promise<import('../../types/index.js').CollectResult>}
 */
async function collectCrypto() {
  try {
    const ids = COINS.map(c => c.id).join(',');
    
    const response = await axios.get(`${COINGECKO_API}/simple/price`, {
      params: {
        ids: ids,
        vs_currencies: 'krw',
        include_24hr_change: true
      },
      headers: {
        'Accept': 'application/json'
      },
      timeout: 10000
    });

    const data = [];

    for (const coin of COINS) {
      const coinData = response.data[coin.id];
      if (!coinData) continue;

      /** @type {import('../../types/index.js').PriceData} */
      const priceData = {
        category: 'crypto',
        symbol: coin.symbol,
        price: coinData.krw,
        change: Math.round(coinData.krw_24h_change * 100) / 100,
        unit: 'KRW',
        collectedAt: new Date()
      };

      insertPrice(priceData);
      data.push(priceData);
    }

    return { success: true, data };
  } catch (error) {
    console.error('[Crypto] 수집 실패:', error.message);
    return { success: false, error: error.message };
  }
}

module.exports = {
  collectCrypto,
  COINS
};
