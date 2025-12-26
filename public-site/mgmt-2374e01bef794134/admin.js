/**
 * INFOShell Admin JavaScript
 */

'use strict';

// API 설정
const API_BASE = 'https://infoshell-api.rxnrich.workers.dev';

// DOM 요소
const loginContainer = document.getElementById('loginContainer');
const adminContainer = document.getElementById('adminContainer');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');

// 상태
let isLoggedIn = false;
let authToken = null;

/**
 * 초기화
 */
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  setupEventListeners();
});

/**
 * 인증 체크
 */
function checkAuth() {
  const token = sessionStorage.getItem('adminToken');
  if (token) {
    authToken = token;
    isLoggedIn = true;
    showAdmin();
  }
}

/**
 * 이벤트 리스너 설정
 */
function setupEventListeners() {
  // 로그인 폼
  loginForm.addEventListener('submit', handleLogin);
  
  // 로그아웃
  logoutBtn.addEventListener('click', handleLogout);
  
  // 네비게이션
  document.querySelectorAll('.admin-nav__link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const section = link.dataset.section;
      navigateTo(section);
    });
  });

  // 문의 필터
  const inquiryFilter = document.getElementById('inquiryFilter');
  if (inquiryFilter) {
    inquiryFilter.addEventListener('change', () => loadInquiries());
  }
}

/**
 * API 요청 헬퍼
 */
async function apiRequest(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(authToken && { 'Authorization': `Bearer ${authToken}` })
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: { ...headers, ...options.headers }
  });

  return response.json();
}

/**
 * 로그인 처리
 */
async function handleLogin(e) {
  e.preventDefault();
  
  const id = document.getElementById('adminId').value;
  const pw = document.getElementById('adminPw').value;
  
  try {
    const result = await apiRequest('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ id, password: pw })
    });

    if (result.success && result.token) {
      authToken = result.token;
      sessionStorage.setItem('adminToken', result.token);
      sessionStorage.setItem('adminName', result.admin);
      isLoggedIn = true;
      showAdmin();
    } else {
      loginError.textContent = result.error || '로그인에 실패했습니다.';
      setTimeout(() => {
        loginError.textContent = '';
      }, 3000);
    }
  } catch (error) {
    loginError.textContent = '서버 연결에 실패했습니다.';
    setTimeout(() => {
      loginError.textContent = '';
    }, 3000);
  }
}

/**
 * 로그아웃 처리
 */
function handleLogout() {
  sessionStorage.removeItem('adminToken');
  sessionStorage.removeItem('adminName');
  authToken = null;
  isLoggedIn = false;
  loginContainer.style.display = 'flex';
  adminContainer.style.display = 'none';
  loginForm.reset();
}

/**
 * 관리자 화면 표시
 */
function showAdmin() {
  loginContainer.style.display = 'none';
  adminContainer.style.display = 'flex';
  
  const adminName = sessionStorage.getItem('adminName') || '관리자';
  const adminNameEl = document.getElementById('adminName');
  if (adminNameEl) adminNameEl.textContent = adminName;
  
  // 데이터 로드
  loadDashboardData();
}

/**
 * 섹션 전환
 */
function navigateTo(section) {
  // 네비게이션 활성화
  document.querySelectorAll('.admin-nav__link').forEach(link => {
    link.classList.toggle('active', link.dataset.section === section);
  });
  
  // 섹션 표시
  document.querySelectorAll('.admin-section').forEach(sec => {
    sec.classList.remove('active');
  });
  
  const targetSection = document.getElementById('section' + capitalize(section));
  if (targetSection) {
    targetSection.classList.add('active');
  }
  
  // 타이틀 업데이트
  const titles = {
    dashboard: '대시보드',
    downloads: '다운로드 통계',
    inquiries: '문의 관리',
    banners: '배너 관리'
  };
  document.getElementById('pageTitle').textContent = titles[section] || '대시보드';
  
  // 섹션별 데이터 로드
  if (section === 'downloads') loadDownloadStats();
  if (section === 'inquiries') loadInquiries();
  if (section === 'banners') loadBanners();
}

/**
 * 대시보드 데이터 로드
 */
async function loadDashboardData() {
  try {
    // 기본 통계
    const statsResult = await apiRequest('/api/admin/stats');
    
    if (statsResult.success && statsResult.data) {
      const { inquiries, site } = statsResult.data;
      
      // 총 다운로드 수
      document.getElementById('totalDownloads').textContent = 
        parseInt(site.download_count || '0').toLocaleString();
      
      // 미답변 문의
      document.getElementById('pendingInquiries').textContent = 
        (inquiries?.pending || 0).toLocaleString();
      
      // 현재 버전
      document.getElementById('currentVersion').textContent = 
        site.version || '1.0.0';
    }
    
    // 다운로드 상세 통계
    const downloadResult = await apiRequest('/api/admin/downloads?days=7');
    
    if (downloadResult.success && downloadResult.data) {
      // 오늘 다운로드
      const today = new Date().toISOString().slice(0, 10);
      const todayData = downloadResult.data.daily.find(d => d.date === today);
      document.getElementById('todayDownloads').textContent = 
        (todayData?.count || 0).toLocaleString();
      
      // 차트 초기화 (실제 데이터)
      initChart(downloadResult.data.daily);
    }

    // 최근 문의 로드
    loadRecentInquiries();
    
  } catch (error) {
    console.error('대시보드 데이터 로드 실패:', error);
  }
}

/**
 * 최근 문의 로드
 */
async function loadRecentInquiries() {
  try {
    const result = await apiRequest('/api/admin/inquiries?limit=5');
    
    if (result.success && result.data && result.data.length > 0) {
      const container = document.getElementById('recentInquiries');
      container.innerHTML = result.data.map(inq => `
        <div class="inquiry-item">
          <div class="inquiry-item__header">
            <span class="badge badge--${inq.status === 'pending' ? 'warning' : 'success'}">${inq.status === 'pending' ? '미답변' : '완료'}</span>
            <span class="inquiry-item__date">${inq.created_at}</span>
          </div>
          <div class="inquiry-item__email">${escapeHtml(inq.email)}</div>
          <div class="inquiry-item__content">${escapeHtml(inq.content.slice(0, 50))}...</div>
        </div>
      `).join('');
    }
  } catch (error) {
    console.error('최근 문의 로드 실패:', error);
  }
}

/**
 * 다운로드 통계 로드
 */
async function loadDownloadStats() {
  try {
    // 기본 통계
    const statsResult = await apiRequest('/api/admin/stats');
    const tbody = document.getElementById('downloadTable');
    
    if (statsResult.success && statsResult.data && statsResult.data.site) {
      const { site } = statsResult.data;
      tbody.innerHTML = `
        <tr>
          <td><strong>v${site.version || '1.0.0'}</strong></td>
          <td>${parseInt(site.download_count || 0).toLocaleString()}</td>
          <td><span class="badge badge--success">현재</span></td>
          <td>
            <button class="btn btn--secondary btn--sm" onclick="editDownloadCount()">
              <i class="fa-solid fa-edit"></i>
            </button>
          </td>
        </tr>
      `;
    }
    
    // 상세 다운로드 통계
    const downloadResult = await apiRequest('/api/admin/downloads?days=7');
    
    if (downloadResult.success && downloadResult.data) {
      // 국가별 통계
      renderCountryStats(downloadResult.data.byCountry);
      
      // 최근 다운로드
      renderRecentDownloads(downloadResult.data.recent);
    }
    
    // 차단 목록
    loadBlockedIPs();
    
  } catch (error) {
    console.error('다운로드 통계 로드 실패:', error);
  }
}

/**
 * 국가별 통계 렌더링
 */
function renderCountryStats(countryData) {
  const container = document.getElementById('countryStats');
  if (!container) return;
  
  if (!countryData || countryData.length === 0) {
    container.innerHTML = '<p class="empty-state">데이터가 없습니다.</p>';
    return;
  }
  
  const countryNames = {
    'KR': '한국', 'US': '미국', 'JP': '일본', 'CN': '중국',
    'TW': '대만', 'VN': '베트남', 'TH': '태국', 'SG': '싱가포르',
    '': '알 수 없음'
  };
  
  const total = countryData.reduce((sum, c) => sum + c.count, 0);
  
  container.innerHTML = countryData.map(c => {
    const percent = total > 0 ? Math.round((c.count / total) * 100) : 0;
    const name = countryNames[c.country] || c.country || '알 수 없음';
    return `
      <div class="country-item">
        <div class="country-item__info">
          <span class="country-item__name">${name}</span>
          <span class="country-item__count">${c.count}회 (${percent}%)</span>
        </div>
        <div class="country-item__bar">
          <div class="country-item__fill" style="width: ${percent}%"></div>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * 최근 다운로드 렌더링
 */
function renderRecentDownloads(downloads) {
  const tbody = document.getElementById('recentDownloadsTable');
  if (!tbody) return;
  
  if (!downloads || downloads.length === 0) {
    tbody.innerHTML = '<tr><td colspan="3" class="empty-state">다운로드 기록이 없습니다.</td></tr>';
    return;
  }
  
  const countryNames = {
    'KR': '🇰🇷 한국', 'US': '🇺🇸 미국', 'JP': '🇯🇵 일본', 'CN': '🇨🇳 중국',
    'TW': '🇹🇼 대만', 'VN': '🇻🇳 베트남', 'TH': '🇹🇭 태국', 'SG': '🇸🇬 싱가포르',
    '': '🌐 알 수 없음'
  };
  
  tbody.innerHTML = downloads.slice(0, 20).map(d => `
    <tr>
      <td><code>${maskIP(d.ip)}</code></td>
      <td>${countryNames[d.country] || d.country || '🌐 알 수 없음'}</td>
      <td>${d.created_at}</td>
    </tr>
  `).join('');
}

/**
 * IP 마스킹
 */
function maskIP(ip) {
  if (!ip) return '-';
  const parts = ip.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.***.***`;
  }
  return ip.slice(0, 10) + '***';
}

/**
 * 차단 목록 로드
 */
async function loadBlockedIPs() {
  try {
    const result = await apiRequest('/api/admin/blocked');
    const tbody = document.getElementById('blockedTable');
    
    if (result.success && result.data && result.data.length > 0) {
      tbody.innerHTML = result.data.map(b => `
        <tr>
          <td><code>${maskIP(b.ip)}</code></td>
          <td>${b.count}회</td>
          <td>${b.blocked_until}</td>
          <td>
            <button class="btn btn--warning btn--sm" onclick="unblockIP('${b.ip}')">
              <i class="fa-solid fa-unlock"></i> 해제
            </button>
          </td>
        </tr>
      `).join('');
    } else {
      tbody.innerHTML = '<tr><td colspan="4" class="empty-state">차단된 IP가 없습니다.</td></tr>';
    }
  } catch (error) {
    console.error('차단 목록 로드 실패:', error);
  }
}

/**
 * IP 차단 해제
 */
async function unblockIP(ip) {
  if (!confirm('이 IP의 차단을 해제하시겠습니까?')) return;
  
  try {
    await apiRequest(`/api/admin/blocked/${encodeURIComponent(ip)}`, { method: 'DELETE' });
    showToast('차단이 해제되었습니다.', 'success');
    loadBlockedIPs();
  } catch (error) {
    showToast('차단 해제 실패', 'error');
  }
}

/**
 * 다운로드 수 수정
 */
async function editDownloadCount() {
  const newCount = prompt('새 다운로드 수를 입력하세요:');
  if (newCount === null) return;
  
  const count = parseInt(newCount, 10);
  if (isNaN(count) || count < 0) {
    alert('올바른 숫자를 입력하세요.');
    return;
  }

  try {
    const result = await apiRequest('/api/admin/stats', {
      method: 'POST',
      body: JSON.stringify({ key: 'download_count', value: String(count) })
    });

    if (result.success) {
      alert('수정되었습니다.');
      loadDownloadStats();
      loadDashboardData();
    }
  } catch (error) {
    alert('수정에 실패했습니다.');
  }
}

/**
 * 문의 목록 로드
 */
async function loadInquiries() {
  try {
    const filter = document.getElementById('inquiryFilter')?.value || 'all';
    const result = await apiRequest(`/api/admin/inquiries?status=${filter}`);
    
    const tbody = document.getElementById('inquiryTable');
    if (result.success && result.data) {
      if (result.data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">문의가 없습니다.</td></tr>';
        return;
      }

      tbody.innerHTML = result.data.map(inq => `
        <tr data-id="${inq.id}">
          <td>${getTypeLabel(inq.type)}</td>
          <td>${escapeHtml(inq.email)}</td>
          <td title="${escapeHtml(inq.content)}">${escapeHtml(inq.content.slice(0, 30))}...</td>
          <td>${inq.created_at}</td>
          <td>
            <span class="badge badge--${inq.status === 'pending' ? 'warning' : inq.status === 'answered' ? 'success' : 'secondary'}">
              ${getStatusLabel(inq.status)}
            </span>
          </td>
          <td>
            <button class="btn btn--secondary btn--sm" onclick="viewInquiry(${inq.id})">
              <i class="fa-solid fa-eye"></i>
            </button>
            <button class="btn btn--danger btn--sm" onclick="deleteInquiry(${inq.id})">
              <i class="fa-solid fa-trash"></i>
            </button>
          </td>
        </tr>
      `).join('');
    }
  } catch (error) {
    console.error('문의 목록 로드 실패:', error);
  }
}

// 현재 선택된 문의 ID
let currentInquiryId = null;
let currentInquiryEmail = null;

/**
 * 문의 상세 보기 (모달)
 */
async function viewInquiry(id) {
  try {
    const result = await apiRequest(`/api/admin/inquiries`);
    const inquiry = result.data?.find(i => i.id === id);
    
    if (inquiry) {
      currentInquiryId = id;
      currentInquiryEmail = inquiry.email;
      
      // 모달에 데이터 채우기
      document.getElementById('modalType').textContent = getTypeLabel(inquiry.type);
      document.getElementById('modalEmail').textContent = inquiry.email;
      document.getElementById('modalDate').textContent = inquiry.created_at;
      document.getElementById('modalStatus').value = inquiry.status;
      document.getElementById('modalContent').textContent = inquiry.content;
      document.getElementById('modalReply').value = inquiry.reply || '';
      
      // 모달 열기
      document.getElementById('inquiryModal').classList.add('active');
    }
  } catch (error) {
    alert('문의 조회에 실패했습니다.');
  }
}

/**
 * 문의 모달 닫기
 */
function closeInquiryModal() {
  document.getElementById('inquiryModal').classList.remove('active');
  currentInquiryId = null;
  currentInquiryEmail = null;
}

/**
 * 문의 저장 (상태만)
 */
async function saveInquiry() {
  if (!currentInquiryId) return;
  
  const status = document.getElementById('modalStatus').value;
  const reply = document.getElementById('modalReply').value;
  
  try {
    await apiRequest(`/api/admin/inquiry/${currentInquiryId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reply })
    });
    
    closeInquiryModal();
    loadInquiries();
    loadDashboardData();
    showToast('저장되었습니다.', 'success');
  } catch (error) {
    showToast('저장에 실패했습니다.', 'error');
  }
}

/**
 * 저장 및 이메일 발송
 */
async function saveAndSendEmail() {
  if (!currentInquiryId || !currentInquiryEmail) return;
  
  const status = document.getElementById('modalStatus').value;
  const reply = document.getElementById('modalReply').value;
  
  if (!reply.trim()) {
    showToast('답변 내용을 입력하세요.', 'error');
    return;
  }
  
  try {
    // 저장
    await apiRequest(`/api/admin/inquiry/${currentInquiryId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'answered', reply })
    });
    
    // 이메일 발송 (mailto 링크)
    const subject = encodeURIComponent('[INFOShell] 문의 답변');
    const body = encodeURIComponent(reply);
    window.open(`mailto:${currentInquiryEmail}?subject=${subject}&body=${body}`, '_blank');
    
    closeInquiryModal();
    loadInquiries();
    loadDashboardData();
    showToast('저장되었습니다. 이메일 클라이언트를 확인하세요.', 'success');
  } catch (error) {
    showToast('저장에 실패했습니다.', 'error');
  }
}

/**
 * 토스트 메시지
 */
function showToast(message, type = 'success') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.innerHTML = `
    <i class="fa-solid ${type === 'success' ? 'fa-check-circle' : 'fa-times-circle'}"></i>
    <span>${message}</span>
  `;
  document.body.appendChild(toast);
  
  requestAnimationFrame(() => toast.classList.add('show'));
  
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/**
 * 문의 삭제
 */
async function deleteInquiry(id) {
  if (!confirm('정말 삭제하시겠습니까?')) return;

  try {
    const result = await apiRequest(`/api/admin/inquiry/${id}`, {
      method: 'DELETE'
    });

    if (result.success) {
      loadInquiries();
      loadDashboardData();
    }
  } catch (error) {
    alert('삭제에 실패했습니다.');
  }
}

/**
 * 문의 유형 라벨
 */
function getTypeLabel(type) {
  const labels = { general: '일반', ads: '광고', bug: '버그' };
  return labels[type] || type;
}

/**
 * 상태 라벨
 */
function getStatusLabel(status) {
  const labels = { pending: '미답변', answered: '답변완료', closed: '종료' };
  return labels[status] || status;
}

// ===== 배너 관리 =====
let currentBannerId = null;
let uploadedImages = []; // [{filename, url}]

/**
 * 배너 목록 로드
 */
async function loadBanners() {
  try {
    const result = await apiRequest('/api/admin/banners');
    const tbody = document.getElementById('bannerTable');
    
    if (result.success && result.data && result.data.length > 0) {
      tbody.innerHTML = result.data.map(banner => `
        <tr data-id="${banner.id}">
          <td><strong>${escapeHtml(banner.name)}</strong></td>
          <td>${getPositionLabel(banner.position)}</td>
          <td>${banner.images.length}개</td>
          <td>${banner.start_date || '무기한'} ~ ${banner.end_date || '무기한'}</td>
          <td>
            <span class="badge badge--${banner.is_active ? 'success' : 'secondary'}">
              ${banner.is_active ? '활성' : '비활성'}
            </span>
          </td>
          <td>
            <button class="btn btn--secondary btn--sm" onclick="editBanner(${banner.id})">
              <i class="fa-solid fa-edit"></i>
            </button>
            <button class="btn btn--${banner.is_active ? 'warning' : 'success'} btn--sm" onclick="toggleBanner(${banner.id}, ${!banner.is_active})">
              <i class="fa-solid fa-${banner.is_active ? 'pause' : 'play'}"></i>
            </button>
            <button class="btn btn--danger btn--sm" onclick="deleteBanner(${banner.id})">
              <i class="fa-solid fa-trash"></i>
            </button>
          </td>
        </tr>
      `).join('');
    } else {
      tbody.innerHTML = '<tr><td colspan="6" class="empty-state">등록된 배너가 없습니다.</td></tr>';
    }
  } catch (error) {
    console.error('배너 목록 로드 실패:', error);
  }
}

/**
 * 위치 라벨
 */
function getPositionLabel(position) {
  const labels = {
    'content-top': '콘텐츠 상단',
    'price-bottom': '시세 하단',
    'stats-bottom': '통계 하단',
    'trend-bottom': '트렌드 하단'
  };
  return labels[position] || position;
}

/**
 * 배너 모달 열기
 */
function openBannerModal(banner = null) {
  currentBannerId = banner?.id || null;
  
  // 기존 이미지 데이터 변환 (이전 형식 호환)
  if (banner?.images) {
    uploadedImages = banner.images.map(img => {
      if (typeof img === 'string') {
        return { filename: img, url: banner.link_url || '' };
      }
      return img;
    });
  } else {
    uploadedImages = [];
  }
  
  document.getElementById('bannerModalTitle').textContent = banner ? '배너 수정' : '배너 추가';
  document.getElementById('bannerName').value = banner?.name || '';
  document.getElementById('bannerPosition').value = banner?.position || 'content-top';
  document.getElementById('bannerStartDate').value = banner?.start_date || '';
  document.getElementById('bannerEndDate').value = banner?.end_date || '';
  document.getElementById('bannerTransition').value = banner?.transition || 'fade';
  document.getElementById('bannerInterval').value = banner?.interval || 5000;
  
  // 이미지 미리보기
  renderImageList();
  
  document.getElementById('bannerModal').classList.add('active');
}

/**
 * 배너 모달 닫기
 */
function closeBannerModal() {
  document.getElementById('bannerModal').classList.remove('active');
  document.getElementById('bannerForm').reset();
  currentBannerId = null;
  uploadedImages = [];
  document.getElementById('bannerImageList').innerHTML = '';
}

/**
 * 이미지 목록 렌더링 (URL 입력 포함)
 */
function renderImageList() {
  const container = document.getElementById('bannerImageList');
  if (uploadedImages.length === 0) {
    container.innerHTML = '<p class="empty-hint">이미지를 업로드하세요</p>';
    return;
  }
  
  container.innerHTML = uploadedImages.map((img, i) => `
    <div class="image-item">
      <div class="image-item__preview">
        <img src="${API_BASE}/api/banner/image/${img.filename}" alt="배너 이미지">
        <button type="button" class="image-remove-btn" onclick="removeImage(${i})">
          <i class="fa-solid fa-times"></i>
        </button>
      </div>
      <div class="image-item__url">
        <input type="url" placeholder="클릭 시 이동 URL" value="${img.url || ''}" 
               onchange="updateImageUrl(${i}, this.value)">
      </div>
    </div>
  `).join('');
}

/**
 * 이미지 URL 업데이트
 */
function updateImageUrl(index, url) {
  if (uploadedImages[index]) {
    uploadedImages[index].url = url;
  }
}

/**
 * 이미지 제거
 */
function removeImage(index) {
  uploadedImages.splice(index, 1);
  renderImageList();
}

/**
 * 이미지 업로드 처리
 */
document.addEventListener('DOMContentLoaded', () => {
  const imageInput = document.getElementById('bannerImageInput');
  if (imageInput) {
    imageInput.addEventListener('change', async (e) => {
      const files = e.target.files;
      
      for (const file of files) {
        if (file.size > 2 * 1024 * 1024) {
          showToast(`${file.name}: 2MB 이하만 가능합니다.`, 'error');
          continue;
        }
        
        const formData = new FormData();
        formData.append('image', file);
        
        try {
          const response = await fetch(`${API_BASE}/api/admin/banner/upload`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${authToken}`
            },
            body: formData
          });
          
          const result = await response.json();
          if (result.success) {
            uploadedImages.push({ filename: result.filename, url: '' });
            renderImageList();
          } else {
            showToast(result.error || '업로드 실패', 'error');
          }
        } catch (error) {
          showToast('이미지 업로드 실패', 'error');
        }
      }
      
      e.target.value = '';
    });
  }
});

/**
 * 배너 저장
 */
async function saveBanner() {
  const name = document.getElementById('bannerName').value.trim();
  const position = document.getElementById('bannerPosition').value;
  const startDate = document.getElementById('bannerStartDate').value || null;
  const endDate = document.getElementById('bannerEndDate').value || null;
  const transition = document.getElementById('bannerTransition').value;
  const interval = parseInt(document.getElementById('bannerInterval').value) || 5000;
  
  if (!name) {
    showToast('배너 이름을 입력하세요.', 'error');
    return;
  }
  
  if (uploadedImages.length === 0) {
    showToast('이미지를 업로드하세요.', 'error');
    return;
  }
  
  try {
    if (currentBannerId) {
      // 수정
      await apiRequest(`/api/admin/banner/${currentBannerId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name, position, images: uploadedImages,
          start_date: startDate, end_date: endDate, transition, interval
        })
      });
    } else {
      // 생성
      await apiRequest('/api/admin/banners', {
        method: 'POST',
        body: JSON.stringify({
          name, position, images: uploadedImages,
          start_date: startDate, end_date: endDate, transition, interval
        })
      });
    }
    
    closeBannerModal();
    loadBanners();
    showToast('저장되었습니다.', 'success');
  } catch (error) {
    showToast('저장에 실패했습니다.', 'error');
  }
}

/**
 * 배너 수정
 */
async function editBanner(id) {
  try {
    const result = await apiRequest('/api/admin/banners');
    const banner = result.data?.find(b => b.id === id);
    if (banner) {
      openBannerModal(banner);
    }
  } catch (error) {
    showToast('배너 조회 실패', 'error');
  }
}

/**
 * 배너 활성/비활성 토글
 */
async function toggleBanner(id, active) {
  try {
    await apiRequest(`/api/admin/banner/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: active })
    });
    loadBanners();
    showToast(active ? '활성화되었습니다.' : '비활성화되었습니다.', 'success');
  } catch (error) {
    showToast('상태 변경 실패', 'error');
  }
}

/**
 * 배너 삭제
 */
async function deleteBanner(id) {
  if (!confirm('정말 삭제하시겠습니까? 이미지도 함께 삭제됩니다.')) return;
  
  try {
    await apiRequest(`/api/admin/banner/${id}`, { method: 'DELETE' });
    loadBanners();
    showToast('삭제되었습니다.', 'success');
  } catch (error) {
    showToast('삭제에 실패했습니다.', 'error');
  }
}

// 차트 인스턴스 저장
let chartInstance = null;

/**
 * 차트 초기화
 */
function initChart(dailyData = []) {
  const ctx = document.getElementById('chartCanvas');
  if (!ctx) return;
  
  // 기존 차트 파괴
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }
  
  // 최근 7일 데이터 준비
  const labels = [];
  const data = [];
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().slice(0, 10);
    const displayDate = `${date.getMonth() + 1}/${date.getDate()}`;
    
    labels.push(displayDate);
    
    // 실제 데이터에서 해당 날짜 찾기
    const dayData = dailyData.find(d => d.date === dateStr);
    data.push(dayData?.count || 0);
  }
  
  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: '다운로드',
        data: data,
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(255, 255, 255, 0.05)'
          },
          ticks: {
            color: '#6b6b80'
          }
        },
        x: {
          grid: {
            display: false
          },
          ticks: {
            color: '#6b6b80'
          }
        }
      }
    }
  });
}

/**
 * 유틸리티: 첫글자 대문자
 */
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * 유틸리티: HTML 이스케이프
 */
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[m]));
}
