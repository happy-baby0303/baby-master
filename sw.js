// 🔔 파이어베이스 백그라운드 푸시 알림 수신기 (우렁각시)
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyDyXVAf-uiqutmfCd5Bhh34bQmbnFynpas",
    authDomain: "happybaby-6de42.firebaseapp.com",
    projectId: "happybaby-6de42",
    storageBucket: "happybaby-6de42.firebasestorage.app",
    messagingSenderId: "1075311024495",
    appId: "1:1075311024495:web:b9212eab58802dabf9709a"
});

const messaging = firebase.messaging();

// 🚨 여기를 수정했습니다! (중복 알림 방지)
messaging.onBackgroundMessage((payload) => {
    // 구글 파이어베이스가 알아서 알림을 띄우므로 우렁각시는 조용히 로그만 남깁니다!
    console.log('[SW] 백그라운드 푸시 수신 성공!');
});

// 🔔 알림을 터치하면 배냇함 앱이 짠! 하고 열리게 해주는 마법
self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
            if (clientList.length > 0) {
                let client = clientList[0];
                for (let i = 0; i < clientList.length; i++) {
                    if (clientList[i].focused) { client = clientList[i]; }
                }
                return client.focus();
            }
            return clients.openWindow('/');
        })
    );
});


// 💾 기존 PWA 오프라인 캐시 엔진
const CACHE = 'baenaet-v1';   // 🔄 리텐션 모듈 추가로 버전 업!

const ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './style.css',
    './icon-512.png',
    './icon-192x192.png',

    // 뼈대
    './script.js',
    './playdata.js',
    './receiptData.js',

    // 배냇함
    './photos.js',
    './voice.js',
    './waveform.js',
    './sealed.js',
    './postcard.js',
    './memorybox.js',
    './milestonebook.js',
    './photobook.js',

    // 이번에 추가된 것들
    './graveyard.js',
    './export.js',
    './remind.js',
    './memories.js',
    './firstwords.js',

    // 나머지
    './emotion.js',
    './data.js',
    './notes.js',
    './diary.js',
    './firstfill.js',
    './premium.js',
    './anniversaries.js',
    './home.js',
    './bedtime.js',
    './theme.js',
    './mobile.js',
    './fit.js'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE).then(c => 
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
    // 🚨 구글/파이어베이스 통신은 캐싱(저장)하지 않고 그대로 통과시킵니다.
    if (url.includes('firestore') || url.includes('googleapis') ||
        url.includes('kakao')     || url.includes('gtm.js') ||
        url.includes('google.com') || url.includes('gstatic') ||
        url.includes('firebase')) return;

    e.respondWith(
        fetch(e.request)
            .then(res => {
                if (res && res.ok && res.type === 'basic') {
                    const clone = res.clone();
                    caches.open(CACHE).then(c => c.put(e.request, clone)).catch(() => {});
                }
                return res;
            })
            .catch(async () => {
                const cached = await caches.match(e.request, { ignoreSearch: true });
                if (cached) return cached;

                if (e.request.mode === 'navigate') {
                    const home = await caches.match('./index.html', { ignoreSearch: true });
                    if (home) return home;
                }

                return new Response('', { status: 503, statusText: 'Offline' });
            })
    );
});