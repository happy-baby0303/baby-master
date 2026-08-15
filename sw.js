const CACHE = 'yukamate-v2';   // 🔄 버전 올림 (기존 캐시 자동 정리)

// 🚨 하나라도 없으면 전부 실패하므로, 확실히 존재하는 것만!
const ASSETS = [
    './',
    './index.html',
    './style.css',
    './script.js',
    './icon-512.png',
    './icon-192x192.png'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE).then(c => 
            // 🛡️ 하나씩 담아서, 없는 파일이 있어도 나머지는 무사히 저장
            Promise.all(ASSETS.map(url =>
                c.add(url).catch(err => console.warn('[SW] 캐시 실패(무시):', url))
            ))
        )
    );
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    e.waitUntil(caches.keys().then(keys =>
        Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ));
    self.clients.claim();
});

self.addEventListener('fetch', (e) => {
    if (e.request.method !== 'GET') return;

    const url = e.request.url;
    // 🚨 아래 2줄을 추가해서 구글 관련 통신을 건너뜁니다.
    if (url.includes('firestore') || url.includes('googleapis') ||
        url.includes('kakao')     || url.includes('gtm.js') ||
        url.includes('google.com') || url.includes('gstatic')) return;

    e.respondWith(
        fetch(e.request)
            .then(res => {
                // ✅ 정상 응답이고 우리 사이트 것일 때만 저장 (404·외부자원 제외)
                if (res && res.ok && res.type === 'basic') {
                    const clone = res.clone();
                    caches.open(CACHE).then(c => c.put(e.request, clone)).catch(() => {});
                }
                return res;
            })
            .catch(async () => {
                // 🛡️ 1차: 쿼리(?v=) 무시하고 캐시 검색
                const cached = await caches.match(e.request, { ignoreSearch: true });
                if (cached) return cached;

                // 🛡️ 2차: 페이지 요청이면 홈 화면이라도 띄워주기
                if (e.request.mode === 'navigate') {
                    const home = await caches.match('./index.html', { ignoreSearch: true });
                    if (home) return home;
                }

                // 🛡️ 3차: 그래도 없으면 빈 응답 (절대 undefined 반환 금지!)
                return new Response('', { status: 503, statusText: 'Offline' });
            })
    );
});