/**
 * INFOShell - 자동 업데이트 모듈
 */

const { autoUpdater } = require('electron-updater');
const { dialog, BrowserWindow } = require('electron');

class Updater {
  constructor() {
    // 자동 다운로드
    autoUpdater.autoDownload = true;
    
    // 종료 시 자동 설치
    autoUpdater.autoInstallOnAppQuit = true;
    
    // Pre-release 제외
    autoUpdater.allowPrerelease = false;

    this.mainWindow = null;
    this.updateCheckInterval = null;

    this.setupEventListeners();
  }

  /**
   * 이벤트 리스너 설정
   */
  setupEventListeners() {
    // 업데이트 체크 시작
    autoUpdater.on('checking-for-update', () => {
      console.log('[Updater] 업데이트 확인 중...');
      this.sendToRenderer('update-checking');
    });

    // 업데이트 발견
    autoUpdater.on('update-available', (info) => {
      console.log(`[Updater] 업데이트 발견: v${info.version}`);
      this.sendToRenderer('update-available', info);
      
      // 다운로드 시작
      autoUpdater.downloadUpdate().catch(err => {
        console.error('[Updater] 다운로드 실패:', err);
      });
    });

    // 업데이트 없음
    autoUpdater.on('update-not-available', (info) => {
      console.log(`[Updater] 최신 버전입니다: v${info.version}`);
      this.sendToRenderer('update-not-available', info);
    });

    // 다운로드 진행률
    autoUpdater.on('download-progress', (progress) => {
      const percent = Math.round(progress.percent);
      console.log(`[Updater] 다운로드: ${percent}%`);
      this.sendToRenderer('update-progress', {
        percent,
        transferred: progress.transferred,
        total: progress.total
      });
    });

    // 다운로드 완료
    autoUpdater.on('update-downloaded', (info) => {
      console.log(`[Updater] 다운로드 완료: v${info.version}`);
      this.sendToRenderer('update-downloaded', info);
      this.showUpdateNotification(info);
    });

    // 에러
    autoUpdater.on('error', (err) => {
      console.error('[Updater] 오류:', err.message);
      this.sendToRenderer('update-error', { message: err.message });
    });
  }

  /**
   * 렌더러로 이벤트 전송
   */
  sendToRenderer(channel, data = null) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(channel, data);
    }
  }

  /**
   * 업데이트 알림
   */
  async showUpdateNotification(info) {
    const result = await dialog.showMessageBox(this.mainWindow, {
      type: 'info',
      title: '업데이트 알림',
      message: `새로운 버전 v${info.version}이 준비되었습니다.`,
      detail: '업데이트를 적용하려면 앱을 재시작해야 합니다.',
      buttons: ['지금 재시작', '나중에'],
      defaultId: 0,
      cancelId: 1
    });

    if (result.response === 0) {
      // 모든 윈도우 닫기
      BrowserWindow.getAllWindows().forEach(win => {
        win.removeAllListeners('close');
        win.close();
      });
      
      // 재시작 및 설치
      autoUpdater.quitAndInstall(true, true);
    }
  }

  /**
   * 업데이트 체크
   */
  async checkForUpdates() {
    try {
      const isDev = process.argv.includes('--dev');
      
      if (isDev) {
        console.log('[Updater] 개발 모드 - 업데이트 체크 스킵');
        return;
      }
      
      await autoUpdater.checkForUpdates();
    } catch (error) {
      console.error('[Updater] 체크 실패:', error);
    }
  }

  /**
   * 자동 업데이트 체크 시작
   */
  startAutoUpdateCheck(mainWindow, intervalMinutes = 60) {
    this.mainWindow = mainWindow;

    // 앱 시작 후 10초 뒤 첫 체크
    setTimeout(() => {
      this.checkForUpdates();
    }, 10000);

    // 주기적 체크
    this.updateCheckInterval = setInterval(() => {
      this.checkForUpdates();
    }, intervalMinutes * 60 * 1000);
  }

  /**
   * 자동 업데이트 중지
   */
  stopAutoUpdateCheck() {
    if (this.updateCheckInterval) {
      clearInterval(this.updateCheckInterval);
      this.updateCheckInterval = null;
    }
  }
}

module.exports = new Updater();
