# IELTS platforma testlari

Bu papka **barcha o'quv markazlariga umumiy** bo'lgan IELTS mock testlarini
tayyorlaydi. Maqsad: markaz o'zi test tuzmasin — tayyorini olib, PIN berib,
o'quvchiga topshirsin.

## Nima bor

```
blueprint.mjs            IELTS Reading tuzilma qollanmasi + tekshiruvchi
tests/test-NN.mjs        savollar + reading passajlari (kontent)
transcripts/test-NN.mjs  Listening transkripti (spikerlar bilan)
seed.mjs                 testlarni bazaga yuklaydi
audio/generate.mjs       transkriptdan audio yasaydi (macOS)
audio/link.mjs           audio fayllarni bazadagi audioUrl ga bog'laydi
```

Audio fayllar `public/audio/ielts/` ga tushadi va Vercel ularni static
fayl sifatida tarqatadi — alohida fayl serveri yoki VPS kerak emas.

## Buyruqlar

```bash
# testlarni tekshirish (bazaga yozmaydi)
node scripts/ielts-seed/seed.mjs --dry

# testlarni bazaga yuklash (mavjudini o'tkazib yuboradi)
node scripts/ielts-seed/seed.mjs

# bazadagi platforma testlari ro'yxati
node scripts/ielts-seed/seed.mjs --list

# bitta testni o'chirish (savollari bilan)
node scripts/ielts-seed/seed.mjs --remove "Platform Test 3 — History & Society"

# audio yasash (faqat yetishmaganini)
node scripts/ielts-seed/audio/generate.mjs

# hammasini qayta yasash / bittasini
node scripts/ielts-seed/audio/generate.mjs --force
node scripts/ielts-seed/audio/generate.mjs test-04

# audioni bazaga bog'lash
node scripts/ielts-seed/audio/link.mjs
```

## ⚠️ Reading tuzilmasi — `blueprint.mjs` ni O'QING

O'quv markazi sinovi (2026-07-31) ko'rsatdiki, testlar rasmiy IELTS tuzilmasiga
mos emas edi: uchala passajda ham bir xil qolip (7×TFNG + 3×MCQ + 3×gap-fill),
matching turlari umuman yo'q, qiyinlik oshmaydi.

To'g'ri tuzilma qoidalari `blueprint.mjs` faylining boshida yozilgan. Qisqacha:

- Savollar **blok** bo'lib keladi (ketma-ket bir xil tur), har blok 3–7 savol.
- Passaj 1 → oson, Passaj 2 → o'rta, Passaj 3 → qiyin.
- Uchala passajning tuzilmasi bir xil bo'lishi **mumkin emas**.
- Har testda kamida bitta **matching** bloki bo'lishi shart.
- "Which paragraph contains..." bo'lgan passajda xatboshilar `A`, `B`, `C` ...
  bilan **harflangan** bo'lishi shart (matnda yakka harf qatori).

Tekshirish:

```bash
node scripts/ielts-seed/seed.mjs --dry --strict
```

`--strict` siz blueprint xatolari faqat ogohlantirish bo'ladi (eski testlar
hali tuzatilmagani uchun). Yangi test **strict rejimda toza** o'tishi kerak.

Blok sarlavhasi va so'z chegarasi `options` massivida meta-yozuv sifatida beriladi:

```js
options: ['@Match each statement with the correct person, A, B, C or D.',
          'A) Hannah Reisz', 'B) Tomas Bergqvist']
options: ['@words:NO MORE THAN TWO WORDS']   // default: ONE WORD ONLY
```

Meta faqat blokning **birinchi** savoliga yoziladi — qolganlari uni meros oladi.

## Yangi test qo'shish

1. `tests/test-11.mjs` yarating — mavjud faylni namuna qiling.
   Talab: 3 ta reading passaji (≥500 so'z) va **jami 40 ta** reading savoli,
   **40 ta** listening savoli, **2 ta** writing task. `seed.mjs --dry` tekshiradi.
2. `transcripts/test-11.mjs` yarating. **Muhim:** har bir listening savolining
   javobi transkriptda tabiiy tarzda aytilishi shart.
3. Ishga tushiring:
   ```bash
   node scripts/ielts-seed/seed.mjs
   node scripts/ielts-seed/audio/generate.mjs
   node scripts/ielts-seed/audio/link.mjs
   ```
4. `public/audio/ielts/` dagi yangi fayllarni commit qiling va push qiling.

## Audio haqida

- macOS `say` buyrug'i ishlatiladi (boshqa OS'da ishlamaydi).
- Britaniya ovozlari: Daniel, Shelley, Sandy, Rocko — IELTS aksentiga mos.
- Tezlik 150 so'z/daqiqa — haqiqiy imtihonga yaqin.
- AAC 24 kbps: bir bo'lim ≈ 500 KB, bir test ≈ 2 MB.
- Spiker belgilari: `narrator`, `m1`, `m2`, `f1`, `f2`.
  Yozilishi: `['f1', "Gap matni"]`.

Ovoz sifatini oshirish kerak bo'lsa, `audio/generate.mjs` dagi `VOICES`
ni o'zgartiring yoki macOS Sozlamalari → Accessibility → Spoken Content
orqali "Premium" ovozlarni yuklab oling (ular ancha tabiiy).

## ⚠️ Mualliflik huquqi

Bu yerdagi barcha matn, savol va transkriptlar **original yozilgan**.

Cambridge IELTS kitoblari, British Council va IDP materiallari mualliflik
huquqi bilan himoyalangan. Ularni ko'chirib, pullik mahsulotda tarqatish
o'quv markazlariga ham, platformaga ham yuridik xavf tug'diradi.
IELTS **formati** himoyalanmagan — shuning uchun format takrorlanadi,
matn esa yangidan yoziladi. Yangi test qo'shganda ham shu qoidaga rioya qiling.
