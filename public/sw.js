// Versiya oshirilsa, eski kesh butunlay tozalanadi (activate hodisasida).
const CACHE_NAME = 'educontrol-v2';

// ⚠️ index.html KESHLANMAYDI.
// Sabab: unda joriy bundle nomi (assets/index-XXXX.js) yozilgan bo'ladi.
// Eski index.html keshdan berilsa, brauzer allaqachon yo'q bo'lgan yoki
// eskirgan JS ni yuklaydi va ilova jimgina ishlamay qoladi (2026-08-05 da
// aynan shu bo'ldi: login va ro'yxatlar ishlamay qolgan edi).
const urlsToCache = [
    '/index.css'
];

// Service Worker o'rnatish
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Cache ochildi');
                return cache.addAll(urlsToCache);
            })
            .catch((err) => {
                console.log('Cache xatosi:', err);
            })
    );
    // Yangi SW ni darhol aktivlashtirish
    self.skipWaiting();
});

// Faollashtirish - eski cache ni tozalash
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Eski cache o\'chirildi:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    // Barcha clientlarni nazoratga olish
    self.clients.claim();
});

// Fetch - Network first, cache fallback strategiyasi
self.addEventListener('fetch', (event) => {
    // Faqat GET so'rovlarni cache qilish
    if (event.request.method !== 'GET') return;

    // API so'rovlarini cache qilmaslik
    if (event.request.url.includes('supabase.co') ||
        event.request.url.includes('api.eduprocrm.uz') ||
        event.request.url.includes('/rest/v1/') ||
        event.request.url.includes('/api/')) {
        return;
    }

    // HTML (sahifa ochilishi) — HAR DOIM tarmoqdan, keshdan emas.
    // Aks holda foydalanuvchi eski bundle bilan qolib ketadi.
    if (event.request.mode === 'navigate' ||
        event.request.destination === 'document' ||
        event.request.url.endsWith('/index.html')) {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Javob nusxasini cache ga saqlash
                if (response.status === 200) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME)
                        .then((cache) => {
                            cache.put(event.request, responseClone);
                        });
                }
                return response;
            })
            .catch(() => {
                // Offline bo'lsa cache dan olish
                return caches.match(event.request);
            })
    );
});

// Push notification uchun (keyinchalik)
self.addEventListener('push', (event) => {
    const options = {
        body: event.data ? event.data.text() : 'Yangi xabar!',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        }
    };

    event.waitUntil(
        self.registration.showNotification('EduControl Pro', options)
    );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow('/')
    );
});
