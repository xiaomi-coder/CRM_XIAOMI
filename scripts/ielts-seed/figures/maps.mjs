#!/usr/bin/env node
/**
 * Listening Part 2 uchun xaritalar → public/images/ielts/listening-map-test-NN.svg
 *
 * ⚠️ ENG MUHIM QOIDA: xarita transkript bilan bir butun. Talaba javobni faqat
 * eshitib topadi, shuning uchun transkriptda har bir joyning o'rni ANIQ
 * aytilishi shart ("on your right", "beyond the pond", "in the far corner").
 * Xaritani o'zgartirsangiz, transkriptni ham o'zgartirib, audioni QAYTA yasang:
 *     node scripts/ielts-seed/audio/generate.mjs --force test-01
 *
 * Ishlatish:
 *   node scripts/ielts-seed/figures/maps.mjs
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { planMap } from './charts.mjs';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '../../../public/images/ielts');

export const MAPS = {
  // Test 1, Part 2 — Ashcombe Botanical Garden
  '01': () => planMap({
    title: 'Ashcombe Botanical Garden',
    outline: { x: 80, y: 60, w: 600, h: 320 },
    // asosiy yo'l: kirishdan hovuzgacha
    paths: [[380, 380, 380, 230]],
    landmarks: [
      { x: 380, y: 230, r: 24, label: 'Lily pond', above: true },
    ],
    entrance: { x: 380, y: 380 },
    markers: [
      { letter: 'A', x: 296, y: 344 },
      { letter: 'B', x: 464, y: 344 },
      { letter: 'C', x: 214, y: 286 },
      { letter: 'D', x: 546, y: 286 },
      { letter: 'E', x: 150, y: 112 },
      { letter: 'F', x: 610, y: 112 },
      { letter: 'G', x: 380, y: 118 },
      { letter: 'H', x: 510, y: 196 },
    ],
  }),

  // Test 7, Part 2 — Hollow Brook Farm
  '07': () => planMap({
    title: 'Hollow Brook Farm',
    outline: { x: 80, y: 60, w: 600, h: 320 },
    // hovli (gorizontal) va asosiy yo'l (vertikal)
    paths: [[240, 380, 240, 340], [240, 340, 600, 340], [460, 340, 460, 110]],
    landmarks: [
      { x: 370, y: 300, w: 96, h: 30, label: 'Farmhouse', above: true },
    ],
    entrance: { x: 240, y: 380 },
    markers: [
      { letter: 'A', x: 285, y: 306 },
      { letter: 'B', x: 550, y: 306 },
      { letter: 'C', x: 630, y: 300 },
      { letter: 'D', x: 330, y: 200 },
      { letter: 'E', x: 560, y: 200 },
      { letter: 'F', x: 620, y: 120 },
      { letter: 'G', x: 150, y: 120 },
      { letter: 'H', x: 170, y: 306 },
    ],
  }),
};

function main() {
  mkdirSync(OUT, { recursive: true });
  for (const [nn, build] of Object.entries(MAPS)) {
    const file = join(OUT, `listening-map-test-${nn}.svg`);
    writeFileSync(file, build());
    console.log(`✅ listening-map-test-${nn}.svg`);
  }
}

if (process.argv[1] && process.argv[1].endsWith('maps.mjs')) main();
