/**
 * #InfoHouse - 시스템 트레이
 */

const { Tray, Menu, nativeImage } = require('electron');
const path = require('path');

/** @type {Tray|null} */
let tray = null;

/**
 * 시스템 트레이 생성
 * @param {import('electron').BrowserWindow} mainWindow
 * @returns {Tray}
 */
function createTray(mainWindow) {
  const iconPath = path.join(__dirname, '../../assets/icons/icon.png');
  const icon = nativeImage.createFromPath(iconPath);
  
  tray = new Tray(icon.resize({ width: 16, height: 16 }));
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '열기',
      click: () => {
        mainWindow.show();
        mainWindow.focus();
      }
    },
    {
      label: '미니 모드',
      click: () => {
        mainWindow.webContents.send('window:toggle-mini');
      }
    },
    { type: 'separator' },
    {
      label: '새로고침',
      click: () => {
        mainWindow.webContents.send('collect:manual');
      }
    },
    { type: 'separator' },
    {
      label: '종료',
      click: () => {
        mainWindow.destroy();
        require('electron').app.quit();
      }
    }
  ]);

  tray.setToolTip('#InfoHouse');
  tray.setContextMenu(contextMenu);

  // 트레이 아이콘 클릭 시 메인 윈도우 표시
  tray.on('click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  return tray;
}

/**
 * 트레이 제거
 */
function destroyTray() {
  if (tray) {
    tray.destroy();
    tray = null;
  }
}

module.exports = {
  createTray,
  destroyTray
};
