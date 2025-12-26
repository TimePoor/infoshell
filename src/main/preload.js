/**
 * #InfoHouse - Preload 스크립트
 * Renderer에서 안전하게 사용할 API만 노출
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('infohouse', {
  // ============================================
  // 가격 관련
  // ============================================
  
  /**
   * 특정 심볼의 최신 가격 조회
   * @param {string} symbol
   * @returns {Promise<import('../types/index.js').IpcResponse>}
   */
  getPrice: (symbol) => ipcRenderer.invoke('price:get', symbol),

  /**
   * 모든 최신 가격 조회
   * @returns {Promise<import('../types/index.js').IpcResponse>}
   */
  getAllPrices: () => ipcRenderer.invoke('price:getAll'),

  /**
   * 카테고리별 최신 가격 조회
   * @param {string} category - 'gold', 'silver', 'exchange', 'oil', 'crypto'
   * @returns {Promise<import('../types/index.js').IpcResponse>}
   */
  getPricesByCategory: (category) => ipcRenderer.invoke('price:getByCategory', category),

  /**
   * 차트용 히스토리 조회
   * @param {string} symbol
   * @param {number} days
   * @returns {Promise<import('../types/index.js').IpcResponse>}
   */
  getHistory: (symbol, days = 30) => ipcRenderer.invoke('price:history', symbol, days),

  /**
   * 오늘 통계 조회
   * @param {string} symbol
   * @returns {Promise<import('../types/index.js').IpcResponse>}
   */
  getTodayStats: (symbol) => ipcRenderer.invoke('stats:today', symbol),

  /**
   * 주간 통계 조회
   * @param {string} symbol
   * @returns {Promise<import('../types/index.js').IpcResponse>}
   */
  getWeekStats: (symbol) => ipcRenderer.invoke('stats:week', symbol),

  // ============================================
  // 트렌드 관련
  // ============================================

  /**
   * 트렌드 키워드 조회
   * @param {string} source - 'google', 'naver', 'all'
   * @returns {Promise<import('../types/index.js').IpcResponse>}
   */
  getTrends: (source = 'all') => ipcRenderer.invoke('trend:get', source),

  // ============================================
  // 수집 관련
  // ============================================

  /**
   * 수동 수집 트리거
   * @returns {Promise<import('../types/index.js').IpcResponse>}
   */
  collectNow: () => ipcRenderer.invoke('collect:manual'),

  // ============================================
  // 윈도우 관련
  // ============================================

  /**
   * 미니 모드로 전환
   */
  toMiniMode: () => ipcRenderer.invoke('window:mini'),

  /**
   * 메인 모드로 전환
   */
  toMainMode: () => ipcRenderer.invoke('window:main'),

  // ============================================
  // 설정 관련
  // ============================================

  /**
   * 설정 조회
   * @param {string} key
   * @returns {Promise<import('../types/index.js').IpcResponse>}
   */
  getSetting: (key) => ipcRenderer.invoke('settings:get', key),

  /**
   * 설정 저장
   * @param {string} key
   * @param {*} value
   * @returns {Promise<import('../types/index.js').IpcResponse>}
   */
  setSetting: (key, value) => ipcRenderer.invoke('settings:set', key, value),

  // ============================================
  // 일정 관련
  // ============================================

  addSchedule: (date, text) => ipcRenderer.invoke('schedule:add', date, text),
  getSchedulesByDate: (date) => ipcRenderer.invoke('schedule:getByDate', date),
  getScheduleDates: (yearMonth) => ipcRenderer.invoke('schedule:getDates', yearMonth),
  deleteSchedule: (id) => ipcRenderer.invoke('schedule:delete', id),

  // ============================================
  // 투두 관련
  // ============================================

  addTodo: (text) => ipcRenderer.invoke('todo:add', text),
  getTodos: () => ipcRenderer.invoke('todo:getAll'),
  toggleTodo: (id, done) => ipcRenderer.invoke('todo:toggle', id, done),
  deleteTodo: (id) => ipcRenderer.invoke('todo:delete', id),

  // ============================================
  // 이벤트 리스너
  // ============================================

  /**
   * 가격 업데이트 이벤트 리스너
   * @param {function} callback
   */
  onPriceUpdate: (callback) => {
    ipcRenderer.on('price:update', (event, data) => callback(data));
  },

  /**
   * 수집 상태 이벤트 리스너
   * @param {function} callback
   */
  onCollectStatus: (callback) => {
    ipcRenderer.on('collect:status', (event, data) => callback(data));
  },

  // ============================================
  // 업데이트 이벤트 리스너
  // ============================================

  onUpdateChecking: (callback) => {
    ipcRenderer.on('update-checking', () => callback());
  },
  onUpdateAvailable: (callback) => {
    ipcRenderer.on('update-available', (event, info) => callback(info));
  },
  onUpdateNotAvailable: (callback) => {
    ipcRenderer.on('update-not-available', (event, info) => callback(info));
  },
  onUpdateProgress: (callback) => {
    ipcRenderer.on('update-progress', (event, progress) => callback(progress));
  },
  onUpdateDownloaded: (callback) => {
    ipcRenderer.on('update-downloaded', (event, info) => callback(info));
  },
  onUpdateError: (callback) => {
    ipcRenderer.on('update-error', (event, err) => callback(err));
  },

  /**
   * 이벤트 리스너 제거
   * @param {string} channel
   */
  removeListener: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  },

  // ============================================
  // 유틸리티
  // ============================================

  /**
   * 외부 링크를 시스템 브라우저로 열기
   * @param {string} url
   */
  openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url)
});
