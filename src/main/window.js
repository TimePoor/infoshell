/**
 * #InfoHouse - 윈도우 관리
 */

const { BrowserWindow } = require('electron');
const path = require('path');

/** @type {import('../types/index.js').WindowBounds} */
const DEFAULT_MAIN_BOUNDS = {
  width: 1200,
  height: 800,
  x: undefined,
  y: undefined
};

/** @type {import('../types/index.js').WindowBounds} */
const DEFAULT_MINI_BOUNDS = {
  width: 320,
  height: 480,
  x: undefined,
  y: undefined
};

/**
 * 메인 윈도우 생성
 * @returns {BrowserWindow}
 */
function createMainWindow() {
  const mainWindow = new BrowserWindow({
    width: DEFAULT_MAIN_BOUNDS.width,
    height: DEFAULT_MAIN_BOUNDS.height,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../../assets/icons/icon.png'),
    show: false,
    title: 'INFOShell',
    titleBarStyle: 'default',
    backgroundColor: '#ffffff'
  });

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // 개발 모드면 DevTools 열기
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  return mainWindow;
}

/**
 * 미니 윈도우 생성
 * @returns {BrowserWindow}
 */
function createMiniWindow() {
  // 화면 우측 하단에 위치
  const { screen } = require('electron');
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

  const miniWindow = new BrowserWindow({
    width: DEFAULT_MINI_BOUNDS.width,
    height: DEFAULT_MINI_BOUNDS.height,
    x: screenWidth - DEFAULT_MINI_BOUNDS.width - 20,
    y: screenHeight - DEFAULT_MINI_BOUNDS.height - 20,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../../assets/icons/icon.png'),
    frame: false,
    transparent: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: true,
    movable: true,
    backgroundColor: '#ffffff'
  });

  miniWindow.loadFile(path.join(__dirname, '../renderer/mini.html'));

  return miniWindow;
}

module.exports = {
  createMainWindow,
  createMiniWindow,
  DEFAULT_MAIN_BOUNDS,
  DEFAULT_MINI_BOUNDS
};
