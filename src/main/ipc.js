/**
/**
 * #InfoHouse - IPC 핸들러
 */

const { ipcMain } = require('electron');
const { getPrice, getPriceHistory, getLatestPrices, getTodayStats, getWeekStats } = require('../database/queries.js');
const { getTrends } = require('../database/queries.js');
const { getSetting, setSetting } = require('../database/queries.js');
const { addSchedule, getSchedulesByDate, getScheduleDates, deleteSchedule } = require('../database/queries.js');
const { addTodo, getTodos, toggleTodo, deleteTodo } = require('../database/queries.js');
const { collectAll } = require('../services/collector/index.js');
const { collectAllManual } = require('../services/scheduler.js');

/**
 * IPC 핸들러 등록
 */
function registerIpcHandlers() {
  // ============================================
  // 가격 관련
  // ============================================

  /**
   * 특정 심볼의 최신 가격 조회
   */
  ipcMain.handle('price:get', async (event, symbol) => {
    try {
      const data = getPrice(symbol);
      return { success: true, data };
    } catch (error) {
      console.error('[IPC] price:get 에러:', error);
      return { success: false, error: error.message };
    }
  });

  /**
   * 모든 최신 가격 조회
   */
  ipcMain.handle('price:getAll', async () => {
    try {
      const data = getLatestPrices();
      return { success: true, data };
    } catch (error) {
      console.error('[IPC] price:getAll 에러:', error);
      return { success: false, error: error.message };
    }
  });

  /**
   * 차트용 히스토리 조회
   */
  ipcMain.handle('price:history', async (event, symbol, days = 30) => {
    try {
      const data = getPriceHistory(symbol, days);
      return { success: true, data };
    } catch (error) {
      console.error('[IPC] price:history 에러:', error);
      return { success: false, error: error.message };
    }
  });

  // ============================================
  // 트렌드 관련
  // ============================================

  /**
   * 트렌드 키워드 조회
   */
  ipcMain.handle('trend:get', async (event, source = 'all') => {
    try {
      const data = getTrends(source);
      return { success: true, data };
    } catch (error) {
      console.error('[IPC] trend:get 에러:', error);
      return { success: false, error: error.message };
    }
  });

  // ============================================
  // 수집 관련
  // ============================================

  /**
   * 수동 수집 트리거 (전체)
   */
  ipcMain.handle('collect:manual', async () => {
    try {
      const data = await collectAllManual();
      return { success: true, data };
    } catch (error) {
      console.error('[IPC] collect:manual 에러:', error);
      return { success: false, error: error.message };
    }
  });

  /**
   * 카테고리별 최신 가격 조회
   */
  ipcMain.handle('price:getByCategory', async (event, category) => {
    try {
      const allPrices = getLatestPrices();
      const filtered = allPrices.filter(p => p.category === category);
      return { success: true, data: filtered };
    } catch (error) {
      console.error('[IPC] price:getByCategory 에러:', error);
      return { success: false, error: error.message };
    }
  });

  // ============================================
  // 통계 관련
  // ============================================

  /**
   * 오늘 통계 조회
   */
  ipcMain.handle('stats:today', async (event, symbol) => {
    try {
      const data = getTodayStats(symbol);
      return { success: true, data };
    } catch (error) {
      console.error('[IPC] stats:today 에러:', error);
      return { success: false, error: error.message };
    }
  });

  /**
   * 주간 통계 조회
   */
  ipcMain.handle('stats:week', async (event, symbol) => {
    try {
      const data = getWeekStats(symbol);
      return { success: true, data };
    } catch (error) {
      console.error('[IPC] stats:week 에러:', error);
      return { success: false, error: error.message };
    }
  });

  // ============================================
  // 설정 관련
  // ============================================

  /**
   * 설정 조회
   */
  ipcMain.handle('settings:get', async (event, key) => {
    try {
      const value = getSetting(key);
      return { success: true, data: value };
    } catch (error) {
      console.error('[IPC] settings:get 에러:', error);
      return { success: false, error: error.message };
    }
  });

  /**
   * 설정 저장
   */
  ipcMain.handle('settings:set', async (event, key, value) => {
    try {
      setSetting(key, value);
      return { success: true };
    } catch (error) {
      console.error('[IPC] settings:set 에러:', error);
      return { success: false, error: error.message };
    }
  });

  // ============================================
  // 일정 관련
  // ============================================

  ipcMain.handle('schedule:add', async (event, date, text) => {
    try {
      addSchedule(date, text);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('schedule:getByDate', async (event, date) => {
    try {
      const data = getSchedulesByDate(date);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('schedule:getDates', async (event, yearMonth) => {
    try {
      const data = getScheduleDates(yearMonth);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('schedule:delete', async (event, id) => {
    try {
      deleteSchedule(id);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // ============================================
  // 투두 관련
  // ============================================

  ipcMain.handle('todo:add', async (event, text) => {
    try {
      addTodo(text);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('todo:getAll', async () => {
    try {
      const data = getTodos();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('todo:toggle', async (event, id, done) => {
    try {
      toggleTodo(id, done);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('todo:delete', async (event, id) => {
    try {
      deleteTodo(id);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  console.log('[InfoHouse] IPC 핸들러 등록 완료');
}

module.exports = {
  registerIpcHandlers
};
