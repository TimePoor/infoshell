/**
 * INFOShell API - Cloudflare Workers
 */

// 관리자 인증 정보 (환경변수로 관리 권장)
const ADMIN_ID = 'codepedia';
const ADMIN_PW = 'dhfpdh123@';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS 헤더
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // ===== 공개 API =====
      
      // 문의 등록
      if (path === '/api/inquiry' && request.method === 'POST') {
        return await handleInquiry(request, env, corsHeaders);
      }

      // 헬스 체크
      if (path === '/api/health') {
        return new Response(JSON.stringify({ status: 'ok', timestamp: Date.now() }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // 다운로드 추적 (Rate Limit 포함)
      if (path === '/api/download' && request.method === 'POST') {
        return await trackDownload(request, env, corsHeaders);
      }

      // 다운로드 통계 조회 (공개)
      if (path === '/api/download/stats' && request.method === 'GET') {
        return await getDownloadStats(request, env, corsHeaders);
      }

      // ===== 관리자 API =====
      
      // 관리자 로그인
      if (path === '/api/admin/login' && request.method === 'POST') {
        return await adminLogin(request, env, corsHeaders);
      }

      // 관리자 인증 필요한 엔드포인트
      const adminPaths = ['/api/admin/inquiries', '/api/admin/inquiry/', '/api/admin/stats', '/api/admin/banners', '/api/admin/banner/', '/api/admin/downloads', '/api/admin/blocked'];
      const isAdminPath = adminPaths.some(p => path.startsWith(p));
      
      if (isAdminPath) {
        const authResult = await verifyAdmin(request);
        if (!authResult.valid) {
          return new Response(JSON.stringify({ error: '인증이 필요합니다.' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

      // 문의 목록 (관리자)
      if (path === '/api/admin/inquiries' && request.method === 'GET') {
        return await getInquiries(request, env, corsHeaders);
      }

      // 문의 상태 업데이트 (관리자)
      if (path.startsWith('/api/admin/inquiry/') && request.method === 'PATCH') {
        return await updateInquiry(request, env, corsHeaders);
      }

      // 문의 삭제 (관리자)
      if (path.startsWith('/api/admin/inquiry/') && request.method === 'DELETE') {
        return await deleteInquiry(request, env, corsHeaders);
      }

      // 통계 조회 (관리자)
      if (path === '/api/admin/stats' && request.method === 'GET') {
        return await getStats(request, env, corsHeaders);
      }

      // 통계 설정 (관리자)
      if (path === '/api/admin/stats' && request.method === 'POST') {
        return await setStats(request, env, corsHeaders);
      }

      // ===== 배너 API =====
      
      // 배너 목록 (공개 - 활성화된 것만)
      if (path === '/api/banners' && request.method === 'GET') {
        return await getActiveBanners(request, env, corsHeaders);
      }

      // 배너 이미지 조회 (공개)
      if (path.startsWith('/api/banner/image/') && request.method === 'GET') {
        return await getBannerImage(request, env, corsHeaders);
      }

      // 배너 목록 (관리자 - 전체)
      if (path === '/api/admin/banners' && request.method === 'GET') {
        return await getAllBanners(request, env, corsHeaders);
      }

      // 배너 생성 (관리자)
      if (path === '/api/admin/banners' && request.method === 'POST') {
        return await createBanner(request, env, corsHeaders);
      }

      // 배너 수정 (관리자)
      if (path.startsWith('/api/admin/banner/') && request.method === 'PATCH') {
        return await updateBanner(request, env, corsHeaders);
      }

      // 배너 삭제 (관리자)
      if (path.startsWith('/api/admin/banner/') && request.method === 'DELETE') {
        return await deleteBanner(request, env, corsHeaders);
      }

      // 배너 이미지 업로드 (관리자)
      if (path === '/api/admin/banner/upload' && request.method === 'POST') {
        return await uploadBannerImage(request, env, corsHeaders);
      }

      // 다운로드 상세 통계 (관리자)
      if (path === '/api/admin/downloads' && request.method === 'GET') {
        return await getDownloadDetails(request, env, corsHeaders);
      }

      // 차단 목록 조회 (관리자)
      if (path === '/api/admin/blocked' && request.method === 'GET') {
        return await getBlockedIPs(request, env, corsHeaders);
      }

      // 차단 해제 (관리자)
      if (path.startsWith('/api/admin/blocked/') && request.method === 'DELETE') {
        return await unblockIP(request, env, corsHeaders);
      }

      return new Response(JSON.stringify({ error: 'Not Found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};

/**
 * 관리자 로그인
 */
async function adminLogin(request, env, corsHeaders) {
  const body = await request.json();
  const { id, password } = body;

  if (id === ADMIN_ID && password === ADMIN_PW) {
    // 간단한 토큰 생성 (실제로는 JWT 권장)
    const token = btoa(`${ADMIN_ID}:${Date.now()}`);
    
    return new Response(JSON.stringify({ 
      success: true, 
      token,
      admin: id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({ error: '아이디 또는 비밀번호가 올바르지 않습니다.' }), {
    status: 401,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

/**
 * 관리자 인증 확인
 */
async function verifyAdmin(request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false };
  }

  const token = authHeader.slice(7);
  try {
    const decoded = atob(token);
    if (decoded.startsWith(ADMIN_ID + ':')) {
      return { valid: true, admin: ADMIN_ID };
    }
  } catch {
    return { valid: false };
  }

  return { valid: false };
}

// ===== Rate Limit 설정 =====
const RATE_LIMIT = {
  DOWNLOAD_MAX: 10,        // 시간당 최대 다운로드
  DOWNLOAD_WINDOW: 3600,   // 1시간 (초)
  BLOCK_DURATION: 86400,   // 차단 기간 24시간 (초)
  INQUIRY_MAX: 5,          // 시간당 최대 문의
  INQUIRY_WINDOW: 3600,    // 1시간 (초)
};

/**
 * Rate Limit 체크
 */
async function checkRateLimit(env, ip, type, maxCount, windowSec) {
  const key = `${type}:${ip}`;
  const now = new Date();
  const kst = new Date(now.getTime() + (9 * 60 * 60 * 1000));
  const kstString = kst.toISOString().slice(0, 19).replace('T', ' ');
  
  // 기존 레코드 조회
  const record = await env.DB.prepare(
    'SELECT * FROM rate_limits WHERE ip = ?'
  ).bind(key).first();
  
  // 차단 중인지 확인
  if (record?.blocked_until) {
    const blockedUntil = new Date(record.blocked_until);
    if (now < blockedUntil) {
      return { allowed: false, blocked: true, until: record.blocked_until };
    }
  }
  
  // 윈도우 시간 체크
  if (record) {
    const lastUpdate = new Date(record.updated_at);
    const elapsed = (now - lastUpdate) / 1000;
    
    if (elapsed < windowSec) {
      // 같은 윈도우 내
      if (record.count >= maxCount) {
        // 한도 초과 - 차단
        const blockUntil = new Date(now.getTime() + (RATE_LIMIT.BLOCK_DURATION * 1000));
        const blockUntilKst = new Date(blockUntil.getTime() + (9 * 60 * 60 * 1000));
        const blockString = blockUntilKst.toISOString().slice(0, 19).replace('T', ' ');
        
        await env.DB.prepare(
          'UPDATE rate_limits SET blocked_until = ?, updated_at = ? WHERE ip = ?'
        ).bind(blockString, kstString, key).run();
        
        return { allowed: false, blocked: true, until: blockString };
      }
      
      // 카운트 증가
      await env.DB.prepare(
        'UPDATE rate_limits SET count = count + 1, updated_at = ? WHERE ip = ?'
      ).bind(kstString, key).run();
      
      return { allowed: true, count: record.count + 1 };
    } else {
      // 새 윈도우 - 리셋
      await env.DB.prepare(
        'UPDATE rate_limits SET count = 1, blocked_until = NULL, updated_at = ? WHERE ip = ?'
      ).bind(kstString, key).run();
      
      return { allowed: true, count: 1 };
    }
  }
  
  // 새 레코드
  await env.DB.prepare(
    'INSERT INTO rate_limits (ip, count, updated_at) VALUES (?, 1, ?)'
  ).bind(key, kstString).run();
  
  return { allowed: true, count: 1 };
}

/**
 * 다운로드 추적
 */
async function trackDownload(request, env, corsHeaders) {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const userAgent = request.headers.get('User-Agent') || '';
  const referer = request.headers.get('Referer') || '';
  const country = request.headers.get('CF-IPCountry') || '';
  
  // Rate Limit 체크
  const rateCheck = await checkRateLimit(
    env, ip, 'download', 
    RATE_LIMIT.DOWNLOAD_MAX, 
    RATE_LIMIT.DOWNLOAD_WINDOW
  );
  
  if (!rateCheck.allowed) {
    return new Response(JSON.stringify({ 
      error: '너무 많은 다운로드 요청입니다.', 
      blocked: true,
      until: rateCheck.until 
    }), {
      status: 429,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  
  // KST 시간
  const now = new Date();
  const kst = new Date(now.getTime() + (9 * 60 * 60 * 1000));
  const kstString = kst.toISOString().slice(0, 19).replace('T', ' ');
  
  // 다운로드 기록
  await env.DB.prepare(
    'INSERT INTO downloads (ip, user_agent, referer, country, created_at) VALUES (?, ?, ?, ?, ?)'
  ).bind(ip, userAgent.slice(0, 500), referer.slice(0, 500), country, kstString).run();
  
  // 총 다운로드 수 증가
  await env.DB.prepare(
    "UPDATE site_stats SET value = CAST(CAST(value AS INTEGER) + 1 AS TEXT), updated_at = ? WHERE key = 'download_count'"
  ).bind(kstString).run();
  
  // 현재 총 다운로드 수 조회
  const stats = await env.DB.prepare(
    "SELECT value FROM site_stats WHERE key = 'download_count'"
  ).first();
  
  return new Response(JSON.stringify({ 
    success: true, 
    total: parseInt(stats?.value || '0'),
    remaining: RATE_LIMIT.DOWNLOAD_MAX - rateCheck.count
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

/**
 * 다운로드 통계 조회 (공개)
 */
async function getDownloadStats(request, env, corsHeaders) {
  // 총 다운로드 수
  const totalStats = await env.DB.prepare(
    "SELECT value FROM site_stats WHERE key = 'download_count'"
  ).first();
  
  // 오늘 다운로드 수
  const now = new Date();
  const kst = new Date(now.getTime() + (9 * 60 * 60 * 1000));
  const today = kst.toISOString().slice(0, 10);
  
  const todayStats = await env.DB.prepare(
    "SELECT COUNT(*) as count FROM downloads WHERE created_at LIKE ?"
  ).bind(today + '%').first();
  
  return new Response(JSON.stringify({ 
    success: true, 
    data: {
      total: parseInt(totalStats?.value || '0'),
      today: todayStats?.count || 0
    }
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

/**
 * 문의 등록
 */
async function handleInquiry(request, env, corsHeaders) {
  const body = await request.json();
  const { type, email, content, version } = body;

  // 유효성 검사
  if (!type || !email || !content) {
    return new Response(JSON.stringify({ error: '필수 항목이 누락되었습니다.' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // 이메일 형식 검사
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return new Response(JSON.stringify({ error: '올바른 이메일 형식이 아닙니다.' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // 문의 유형 검사
  const validTypes = ['general', 'ads', 'bug'];
  if (!validTypes.includes(type)) {
    return new Response(JSON.stringify({ error: '올바른 문의 유형이 아닙니다.' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // 내용 길이 검사
  if (content.length < 10 || content.length > 2000) {
    return new Response(JSON.stringify({ error: '문의 내용은 10-2000자 사이여야 합니다.' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // KST 시간 생성
  const now = new Date();
  const kst = new Date(now.getTime() + (9 * 60 * 60 * 1000));
  const kstString = kst.toISOString().slice(0, 19).replace('T', ' ');

  // DB 저장
  const result = await env.DB.prepare(
    `INSERT INTO inquiries (type, email, content, version, ip, created_at) 
     VALUES (?, ?, ?, ?, ?, ?)`
  ).bind(
    type,
    email,
    content,
    version || '1.0.0',
    request.headers.get('CF-Connecting-IP') || 'unknown',
    kstString
  ).run();

  return new Response(JSON.stringify({ 
    success: true, 
    message: '문의가 접수되었습니다.',
    id: result.meta.last_row_id 
  }), {
    status: 201,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

/**
 * 문의 목록 조회 (관리자용)
 */
async function getInquiries(request, env, corsHeaders) {
  const url = new URL(request.url);
  const status = url.searchParams.get('status') || 'all';
  const limit = parseInt(url.searchParams.get('limit')) || 50;
  const offset = parseInt(url.searchParams.get('offset')) || 0;

  let query = 'SELECT * FROM inquiries';
  const params = [];

  if (status !== 'all') {
    query += ' WHERE status = ?';
    params.push(status);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const result = await env.DB.prepare(query).bind(...params).all();

  return new Response(JSON.stringify({
    success: true,
    data: result.results,
    total: result.results.length
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

/**
 * 문의 상태 업데이트 (관리자용)
 */
async function updateInquiry(request, env, corsHeaders) {
  const url = new URL(request.url);
  const id = url.pathname.split('/').pop();
  const body = await request.json();
  const { status, reply } = body;

  const validStatuses = ['pending', 'answered', 'closed'];
  if (status && !validStatuses.includes(status)) {
    return new Response(JSON.stringify({ error: '올바른 상태가 아닙니다.' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // KST 시간
  const now = new Date();
  const kst = new Date(now.getTime() + (9 * 60 * 60 * 1000));
  const kstString = kst.toISOString().slice(0, 19).replace('T', ' ');

  await env.DB.prepare(
    `UPDATE inquiries SET status = ?, reply = ?, replied_at = ? WHERE id = ?`
  ).bind(status || 'answered', reply || '', kstString, id).run();

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

/**
 * 문의 삭제 (관리자용)
 */
async function deleteInquiry(request, env, corsHeaders) {
  const url = new URL(request.url);
  const id = url.pathname.split('/').pop();

  await env.DB.prepare('DELETE FROM inquiries WHERE id = ?').bind(id).run();

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

/**
 * 통계 조회 (관리자용)
 */
async function getStats(request, env, corsHeaders) {
  // 문의 통계
  const inquiryStats = await env.DB.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN status = 'answered' THEN 1 ELSE 0 END) as answered
    FROM inquiries
  `).first();

  // 사이트 통계 (별도 테이블)
  const siteStats = await env.DB.prepare(`
    SELECT key, value FROM site_stats
  `).all();

  const stats = {
    inquiries: inquiryStats,
    site: {}
  };

  for (const row of siteStats.results || []) {
    stats.site[row.key] = row.value;
  }

  return new Response(JSON.stringify({ success: true, data: stats }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

/**
 * 통계 설정 (관리자용)
 */
async function setStats(request, env, corsHeaders) {
  const body = await request.json();
  const { key, value } = body;

  if (!key) {
    return new Response(JSON.stringify({ error: 'key가 필요합니다.' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  await env.DB.prepare(`
    INSERT INTO site_stats (key, value) VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')
  `).bind(key, value || '').run();

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}


// ===== 배너 관련 함수 =====

const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

/**
 * 활성 배너 조회 (공개)
 */
async function getActiveBanners(request, env, corsHeaders) {
  const url = new URL(request.url);
  const position = url.searchParams.get('position');
  
  // KST 현재 시간
  const now = new Date();
  const kst = new Date(now.getTime() + (9 * 60 * 60 * 1000));
  const kstString = kst.toISOString().slice(0, 10);

  let query = `
    SELECT * FROM banners 
    WHERE is_active = 1 
    AND (start_date IS NULL OR start_date <= ?)
    AND (end_date IS NULL OR end_date >= ?)
  `;
  const params = [kstString, kstString];

  if (position) {
    query += ' AND position = ?';
    params.push(position);
  }

  query += ' ORDER BY created_at DESC';

  const result = await env.DB.prepare(query).bind(...params).all();

  // images JSON 파싱
  const banners = result.results.map(b => ({
    ...b,
    images: JSON.parse(b.images || '[]')
  }));

  return new Response(JSON.stringify({ success: true, data: banners }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

/**
 * 배너 이미지 조회 (공개)
 */
async function getBannerImage(request, env, corsHeaders) {
  const url = new URL(request.url);
  const filename = url.pathname.replace('/api/banner/image/', '');

  const object = await env.BANNERS.get(filename);
  if (!object) {
    return new Response('Not Found', { status: 404 });
  }

  const headers = new Headers();
  headers.set('Content-Type', object.httpMetadata?.contentType || 'image/png');
  headers.set('Cache-Control', 'public, max-age=86400');

  return new Response(object.body, { headers });
}

/**
 * 전체 배너 조회 (관리자)
 */
async function getAllBanners(request, env, corsHeaders) {
  const result = await env.DB.prepare('SELECT * FROM banners ORDER BY created_at DESC').all();

  const banners = result.results.map(b => ({
    ...b,
    images: JSON.parse(b.images || '[]')
  }));

  return new Response(JSON.stringify({ success: true, data: banners }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

/**
 * 배너 이미지 업로드 (관리자)
 */
async function uploadBannerImage(request, env, corsHeaders) {
  const contentType = request.headers.get('Content-Type') || '';
  
  if (!contentType.includes('multipart/form-data')) {
    return new Response(JSON.stringify({ error: 'multipart/form-data 필요' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const formData = await request.formData();
  const file = formData.get('image');

  if (!file) {
    return new Response(JSON.stringify({ error: '이미지 파일이 필요합니다.' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // 파일 타입 검사
  if (!ALLOWED_TYPES.includes(file.type)) {
    return new Response(JSON.stringify({ error: 'JPG, PNG, GIF, WebP만 허용됩니다.' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // 파일 크기 검사
  if (file.size > MAX_IMAGE_SIZE) {
    return new Response(JSON.stringify({ error: '이미지 크기는 2MB 이하여야 합니다.' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // 파일명 생성
  const ext = file.name.split('.').pop();
  const filename = `banner_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

  // R2에 업로드
  await env.BANNERS.put(filename, file.stream(), {
    httpMetadata: { contentType: file.type }
  });

  return new Response(JSON.stringify({ 
    success: true, 
    filename,
    url: `/api/banner/image/${filename}`
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

/**
 * 배너 생성 (관리자)
 */
async function createBanner(request, env, corsHeaders) {
  const body = await request.json();
  const { name, position, images, link_url, start_date, end_date, transition, interval } = body;

  if (!name || !position || !images || images.length === 0) {
    return new Response(JSON.stringify({ error: '필수 항목이 누락되었습니다.' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // 위치 검증
  const validPositions = ['content-top', 'price-bottom', 'stats-bottom', 'trend-bottom'];
  if (!validPositions.includes(position)) {
    return new Response(JSON.stringify({ error: '올바른 위치가 아닙니다.' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // KST 시간
  const now = new Date();
  const kst = new Date(now.getTime() + (9 * 60 * 60 * 1000));
  const kstString = kst.toISOString().slice(0, 19).replace('T', ' ');

  const result = await env.DB.prepare(`
    INSERT INTO banners (name, position, images, link_url, start_date, end_date, transition, interval, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    name,
    position,
    JSON.stringify(images),
    link_url || null,
    start_date || null,
    end_date || null,
    transition || 'fade',
    interval || 5000,
    kstString,
    kstString
  ).run();

  return new Response(JSON.stringify({ success: true, id: result.meta.last_row_id }), {
    status: 201,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

/**
 * 배너 수정 (관리자)
 */
async function updateBanner(request, env, corsHeaders) {
  const url = new URL(request.url);
  const id = url.pathname.split('/').pop();
  const body = await request.json();

  const { name, position, images, link_url, start_date, end_date, transition, interval, is_active } = body;

  // KST 시간
  const now = new Date();
  const kst = new Date(now.getTime() + (9 * 60 * 60 * 1000));
  const kstString = kst.toISOString().slice(0, 19).replace('T', ' ');

  const updates = [];
  const params = [];

  if (name !== undefined) { updates.push('name = ?'); params.push(name); }
  if (position !== undefined) { updates.push('position = ?'); params.push(position); }
  if (images !== undefined) { updates.push('images = ?'); params.push(JSON.stringify(images)); }
  if (link_url !== undefined) { updates.push('link_url = ?'); params.push(link_url); }
  if (start_date !== undefined) { updates.push('start_date = ?'); params.push(start_date); }
  if (end_date !== undefined) { updates.push('end_date = ?'); params.push(end_date); }
  if (transition !== undefined) { updates.push('transition = ?'); params.push(transition); }
  if (interval !== undefined) { updates.push('interval = ?'); params.push(interval); }
  if (is_active !== undefined) { updates.push('is_active = ?'); params.push(is_active ? 1 : 0); }

  updates.push('updated_at = ?');
  params.push(kstString);
  params.push(id);

  await env.DB.prepare(`UPDATE banners SET ${updates.join(', ')} WHERE id = ?`).bind(...params).run();

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

/**
 * 배너 삭제 (관리자)
 */
async function deleteBanner(request, env, corsHeaders) {
  const url = new URL(request.url);
  const id = url.pathname.split('/').pop();

  // 이미지 파일도 삭제
  const banner = await env.DB.prepare('SELECT images FROM banners WHERE id = ?').bind(id).first();
  if (banner && banner.images) {
    const images = JSON.parse(banner.images);
    for (const img of images) {
      try {
        await env.BANNERS.delete(img);
      } catch (e) {
        // 삭제 실패해도 계속 진행
      }
    }
  }

  await env.DB.prepare('DELETE FROM banners WHERE id = ?').bind(id).run();

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}


/**
 * 다운로드 상세 통계 (관리자)
 */
async function getDownloadDetails(request, env, corsHeaders) {
  const url = new URL(request.url);
  const days = parseInt(url.searchParams.get('days')) || 7;
  
  // 최근 N일 다운로드
  const now = new Date();
  const kst = new Date(now.getTime() + (9 * 60 * 60 * 1000));
  const startDate = new Date(kst);
  startDate.setDate(startDate.getDate() - days);
  const startString = startDate.toISOString().slice(0, 10);
  
  // 일별 통계
  const dailyStats = await env.DB.prepare(`
    SELECT DATE(created_at) as date, COUNT(*) as count 
    FROM downloads 
    WHERE created_at >= ?
    GROUP BY DATE(created_at)
    ORDER BY date DESC
  `).bind(startString).all();
  
  // 국가별 통계
  const countryStats = await env.DB.prepare(`
    SELECT country, COUNT(*) as count 
    FROM downloads 
    WHERE created_at >= ?
    GROUP BY country
    ORDER BY count DESC
    LIMIT 10
  `).bind(startString).all();
  
  // 최근 다운로드 목록
  const recentDownloads = await env.DB.prepare(`
    SELECT ip, country, created_at 
    FROM downloads 
    ORDER BY created_at DESC
    LIMIT 50
  `).all();
  
  return new Response(JSON.stringify({ 
    success: true, 
    data: {
      daily: dailyStats.results,
      byCountry: countryStats.results,
      recent: recentDownloads.results
    }
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

/**
 * 차단 목록 조회 (관리자)
 */
async function getBlockedIPs(request, env, corsHeaders) {
  const now = new Date();
  
  const blocked = await env.DB.prepare(`
    SELECT ip, count, blocked_until, updated_at 
    FROM rate_limits 
    WHERE blocked_until IS NOT NULL AND blocked_until > datetime('now')
    ORDER BY blocked_until DESC
  `).all();
  
  return new Response(JSON.stringify({ 
    success: true, 
    data: blocked.results.map(r => ({
      ...r,
      ip: r.ip.replace(/^(download|inquiry):/, '') // prefix 제거
    }))
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

/**
 * 차단 해제 (관리자)
 */
async function unblockIP(request, env, corsHeaders) {
  const url = new URL(request.url);
  const ip = decodeURIComponent(url.pathname.split('/').pop());
  
  // download: 와 inquiry: prefix 모두 해제
  await env.DB.prepare(
    'UPDATE rate_limits SET blocked_until = NULL WHERE ip LIKE ?'
  ).bind('%' + ip).run();
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}
