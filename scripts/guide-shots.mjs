// Qo'llanma skrinshotlari: demo propusk bilan kirib, har bo'limni rasmga oladi.
import puppeteer from 'puppeteer-core';
import fs from 'fs';

const OUT = '/Users/shokhijakhon/project/CRM_XIAOMI/public/guide';
const APP = 'http://localhost:3000';
const API = 'https://api.eduprocrm.uz';
const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6ImNybS12cHMiLCJpYXQiOjE3ODIzMzQ3NTcsImV4cCI6MjQxMzA1NDc1N30.f1UCrcbJ-G0_q9-wFn9BIyMLPNBgzk2MYpxzU1IC4xw';

fs.mkdirSync(OUT, { recursive: true });

// Demo propusk olamiz (frontend bilan bir xil yo'l)
const res = await fetch(`${API}/rest/v1/rpc/demo_login`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${ANON}`, 'Content-Type': 'application/json' },
  body: '{}',
});
const demo = await res.json();
if (!demo.token) throw new Error('demo_login ishlamadi: ' + JSON.stringify(demo));

const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: 'new',
  args: ['--no-sandbox', '--window-size=1440,900'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });

// Sessiyani localStorage'ga joylaymiz (App shu yerdan o'qiydi).
// DIQQAT: vite dev macOS'da /app so'roviga App.tsx faylini berib yuboradi
// (katta-kichik harf farqlanmaydi), shuning uchun /app ga TO'G'RIDAN-TO'G'RI
// kirmaymiz — /register orqali kiramiz: foydalanuvchi bor bo'lsa u o'zi
// client-side /app ga yo'naltiradi.
await page.goto(`${APP}/register`, { waitUntil: 'domcontentloaded' });
await page.evaluate(({ token, user }) => {
  localStorage.setItem('edu_token', token);
  localStorage.setItem('edu_user', JSON.stringify(user));
  localStorage.setItem('edu_user_role', user.role);
  localStorage.setItem('edu_lang', 'uz');
}, demo);

await page.goto(`${APP}/register`, { waitUntil: 'networkidle2' });
await new Promise(r => setTimeout(r, 3500));
if (!(await page.$('aside'))) throw new Error('Ilova ochilmadi (aside topilmadi): ' + page.url());

// Demo yo'lboshchi kartasi rasmga tushmasin — yopamiz
const closeTour = async () => {
  await page.evaluate(() => {
    const btn = document.querySelector('button[title="Yopish"]');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 400));
};
await closeTour();
await page.screenshot({ path: `${OUT}/dashboard.png` });
console.log('dashboard ✓');

// Sidebar tugmasini matni bo'yicha bosish
const goTab = async (label) => {
  const found = await page.evaluate((label) => {
    const els = [...document.querySelectorAll('aside button, aside a')];
    const el = els.find(e => e.textContent.trim().toUpperCase().includes(label.toUpperCase()));
    if (el) el.click();
    return !!el;
  }, label);
  if (!found) throw new Error(`Sidebar tugmasi topilmadi: ${label}`);
  await new Promise(r => setTimeout(r, 2000));
  await closeTour();
};

const shots = [
  ['GURUHLAR', 'groups'],
  ["O'QUVCHILAR", 'students'],
  ['DAVOMAT', 'attendance'],
  ["TO'LOVLAR", 'payments'],
  ['SOZLAMALARI', 'settings'],
];
for (const [label, name] of shots) {
  await goTab(label);
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log(name + ' ✓');
}

// Ro'yxatdan o'tish sahifasi (login talab qilmaydi)
await page.evaluate(() => localStorage.clear());
await page.goto(`${APP}/register`, { waitUntil: 'networkidle2' });
await new Promise(r => setTimeout(r, 1200));
await page.screenshot({ path: `${OUT}/register.png` });
console.log('register ✓');

await browser.close();
