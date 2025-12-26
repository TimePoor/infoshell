/**
 * INFOShell - Electron Main Process
 */

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

// 모듈 import
const { createMainWindow, createMiniWindow } = require('./window.js');
const { createTray } = require('./tray.js');
const { registerIpcHandlers } = require('./ipc.js');
const { initDatabase } = require('../database/index.js');
const { startScheduler } = require('../services/scheduler.js');
const updater = require('./updater.js');

/** @type {BrowserWindow|null} */
let mainWindow = null;

/** @type {BrowserWindow|null} */
let miniWindow = null;

/**
 * 앱 초기화
 */
async function init() {
  try {
    // 데이터베이스 초기화
    await initDatabase();
    
    // 메인 윈도우 생성
    mainWindow = createMainWindow();
    
    // 시스템 트레이 생성
    createTray(mainWindow);
    
    // IPC 핸들러 등록
    registerIpcHandlers();
    
    // 스케줄러 시작
    startScheduler();
    
    // 자동 업데이트 체크 시작 (60분 간격)
    updater.startAutoUpdateCheck(mainWindow, 60);
    
    console.log('[INFOShell] 앱 초기화 완료');
  } catch (error) {
    console.error('[InfoHouse] 초기화 실패:', error);
  }
}

// 앱 준비 완료
app.whenReady().then(init);

// 모든 윈도우 닫히면 앱 종료 (macOS 제외)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// macOS: dock 아이콘 클릭 시 윈도우 재생성
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    mainWindow = createMainWindow();
  }
});

// 미니 모드 전환
ipcMain.handle('window:mini', () => {
  if (mainWindow) {
    mainWindow.hide();
  }
  if (!miniWindow) {
    miniWindow = createMiniWindow();
  }
  miniWindow.show();
});

// 메인 모드 전환
ipcMain.handle('window:main', () => {
  if (miniWindow) {
    miniWindow.hide();
  }
  if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
  }
});

// 외부 링크 열기
ipcMain.handle('shell:openExternal', async (event, url) => {
  const { shell } = require('electron');
  if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
    await shell.openExternal(url);
  }
});
