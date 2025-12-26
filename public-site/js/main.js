/**
 * INFOShell - Public Site JavaScript
 */

'use strict';

// DOM 요소
const headerDownloadBtn = document.getElementById('headerDownloadBtn');
const downloadBtn = document.getElementById('downloadBtn');
const downloadBtn2 = document.getElementById('downloadBtn2');
const floatingDownload = document.getElementById('floatingDownload');
const downloadModal = document.getElementById('downloadModal');
const modalClose = document.getElementById('modalClose');
const modalCancel = document.getElementById('modalCancel');
const modalAgree = document.getElementById('modalAgree');

/**
 * 초기화
 */
document.addEventListener('DOMContentLoaded', () => {
  setCurrentYear();
  setupFAQ();
  setupSmoothScroll();
  setupScreenshotSlider();
  setupDownloadModal();
  loadDownloadStats();
});

/**
 * 다운로드 통계 로드 (비활성화)
 */
function loadDownloadStats() {
  // 실시간 통계 표시 비활성화
  // 필요시 활성화
}

/**
 * 현재 연도 설정
 */
function setCurrentYear() {
  const yearEl = document.getElementById('currentYear');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
}

/**
 * 다운로드 모달 설정
 */
function setupDownloadModal() {
  // 다운로드 버튼들 클릭 시 모달 열기
  const openModal = () => {
    downloadModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  };
  
  const closeModal = () => {
    downloadModal.classList.remove('active');
    document.body.style.overflow = '';
  };
  
  // 헤더 다운로드 버튼
  if (headerDownloadBtn) {
    headerDownloadBtn.addEventListener('click', openModal);
  }
  
  // 히어로 다운로드 버튼
  if (downloadBtn) {
    downloadBtn.addEventListener('click', openModal);
  }
  
  // 다운로드 섹션 버튼
  if (downloadBtn2) {
    downloadBtn2.addEventListener('click', openModal);
  }
  
  // 플로팅 버튼
  if (floatingDownload) {
    floatingDownload.addEventListener('click', openModal);
  }
  
  // 모달 닫기
  if (modalClose) {
    modalClose.addEventListener('click', closeModal);
  }
  
  if (modalCancel) {
    modalCancel.addEventListener('click', closeModal);
  }
  
  // 오버레이 클릭 시 닫기
  if (downloadModal) {
    downloadModal.addEventListener('click', (e) => {
      if (e.target === downloadModal) {
        closeModal();
      }
    });
  }
  
  // ESC 키로 닫기
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && downloadModal.classList.contains('active')) {
      closeModal();
    }
  });
  
  // 동의 버튼 클릭 시 다운로드 추적 후 다운로드
  if (modalAgree) {
    modalAgree.addEventListener('click', async () => {
      try {
        // 다운로드 추적 API 호출
        const response = await fetch('https://infoshell-api.rxnrich.workers.dev/api/download', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        
        const result = await response.json();
        
        if (result.blocked) {
          alert('너무 많은 다운로드 요청으로 일시적으로 차단되었습니다.\n24시간 후 다시 시도해주세요.');
          closeModal();
          return;
        }
        
        // 다운로드 시작
        window.location.href = 'assets/INFOShell-setup.exe';
        closeModal();
        
      } catch (error) {
        console.error('다운로드 추적 실패:', error);
        // 추적 실패해도 다운로드는 진행
        window.location.href = 'assets/INFOShell-setup.exe';
        closeModal();
      }
    });
  }
}

/**
 * FAQ 토글
 */
function setupFAQ() {
  const faqItems = document.querySelectorAll('.faq__item');
  
  faqItems.forEach(item => {
    const question = item.querySelector('.faq__question');
    
    question.addEventListener('click', () => {
      // 다른 항목 닫기
      faqItems.forEach(other => {
        if (other !== item) {
          other.classList.remove('active');
        }
      });
      
      // 현재 항목 토글
      item.classList.toggle('active');
    });
  });
}

/**
 * 부드러운 스크롤
 */
function setupSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
}

/**
 * 스크린샷 슬라이더
 */
function setupScreenshotSlider() {
  const items = document.querySelectorAll('.screenshots__item');
  
  items.forEach(item => {
    item.addEventListener('click', () => {
      items.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
    });
  });
}


