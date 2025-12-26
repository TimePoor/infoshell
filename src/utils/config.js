/**
 * #InfoHouse - Configuration
 */

const path = require('path');
require('dotenv').config();

const config = {
  // 앱 정보
  app: {
    name: '#InfoHouse',
    version: '1.0.0',
  },
  
  // 환경
  isDev: process.argv.includes('--dev') || process.env.NODE_ENV === 'development',
  
  // 경로
  paths: {
    data: path.join(__dirname, '../../data'),
    assets: path.join(__dirname, '../../assets'),
  },
  
  // API 키
  api: {
    ecos: process.env.ECOS_API_KEY || '',
    coingecko: process.env.COINGECKO_API_KEY || '',
  },
  
  // 수집 설정
  collector: {
    interval: 60, // 분 단위
    timeout: 30000, // ms
  },
  
  // 심볼 목록
  symbols: {
    gold: ['XAU'],
    silver: ['XAG'],
    oil: ['WTI', 'BRENT'],
    exchange: ['USD', 'CNY', 'VND', 'RUB', 'JPY', 'EUR'],
    crypto: ['BTC', 'ETH'],
    economic: ['CPI', 'RATE'],
  },
};

module.exports = config;
