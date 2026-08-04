#!/usr/bin/env node
/**
 * Writing Task 1 grafiklarini yasaydi → public/images/ielts/task1-test-NN.svg
 *
 * Academic Task 1 talabi: talaba VIZUAL ma'lumotni o'z so'zlari bilan tasvirlaydi.
 * Shu paytgacha platformada rasm umuman yo'q edi, ya'ni topshiriq bajarib
 * bo'lmaydigan holatda edi. Har bir rasm test faylidagi Task 1 matniga
 * (`writing[0].prompt`) aynan mos kelishi shart.
 *
 * Ishlatish:
 *   node scripts/ielts-seed/figures/generate.mjs
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lineChart, groupedBar, dualPanel, table, processDiagram, stack } from './charts.mjs';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '../../../public/images/ielts');

/** Har bir rasm uchun ma'lumot. `data` — AI baholovchiga beriladigan qisqa izoh. */
export const FIGURES = {
  '01': {
    svg: () => lineChart({
      title: 'Percentage of household waste recycled in four European countries, 2000–2020',
      xLabels: ['2000', '2005', '2010', '2015', '2020'],
      yLabel: 'Waste recycled (%)',
      unit: '%',
      series: [
        { name: 'Germany', values: [30, 42, 55, 62, 67] },
        { name: 'Sweden', values: [25, 34, 46, 50, 54] },
        { name: 'Spain', values: [12, 20, 28, 33, 36] },
        { name: 'Poland', values: [5, 9, 18, 28, 39] },
      ],
    }),
    data: 'Line graph, % household waste recycled 2000/2005/2010/2015/2020. Germany 30/42/55/62/67; Sweden 25/34/46/50/54; Spain 12/20/28/33/36; Poland 5/9/18/28/39. All four rose. Germany highest throughout. Poland lowest in 2000 but grew most (5 to 39) and overtook Spain by 2020.',
  },

  '02': {
    svg: () => processDiagram({
      title: 'The process by which a vaccine is developed, tested and approved',
      steps: [
        'Laboratory research identifies the antigen',
        'Pre-clinical testing on cells and animals',
        'Phase 1 trial: small group, safety checked',
        'Phase 2 trial: several hundred people, dosage set',
        'Phase 3 trial: thousands of people, effectiveness measured',
        'Regulatory authority reviews all trial data',
        'Approval granted and mass production begins',
        'Distribution, with safety monitored in use',
      ],
    }),
    data: 'Process diagram, 8 linear stages of vaccine development: 1 laboratory research identifies antigen, 2 pre-clinical testing on cells and animals, 3 Phase 1 trial small group for safety, 4 Phase 2 trial several hundred people for dosage, 5 Phase 3 trial thousands for effectiveness, 6 regulatory review of trial data, 7 approval and mass production, 8 distribution with monitoring in use.',
  },

  '03': {
    svg: () => table({
      title: 'Visitors to four types of cultural institution, 2005, 2015 and 2025 (millions)',
      columns: ['Type of institution', '2005', '2015', '2025'],
      rows: [
        ['Museums', '12.4', '15.8', '18.2'],
        ['Public libraries', '28.6', '21.3', '14.7'],
        ['Theatres', '6.2', '7.1', '6.8'],
        ['Cinemas', '24.5', '22.9', '19.4'],
      ],
      note: 'Figures are annual visits, in millions.',
    }),
    data: 'Table, annual visits in millions 2005/2015/2025. Museums 12.4/15.8/18.2 (only steady rise). Public libraries 28.6/21.3/14.7 (largest fall, roughly halved). Theatres 6.2/7.1/6.8 (smallest category, broadly stable). Cinemas 24.5/22.9/19.4 (gradual decline). Libraries began highest but by 2025 cinemas were the most visited.',
  },

  '04': {
    svg: () => dualPanel({
      title: 'Average hours slept per night and reported difficulty sleeping, by age group, 2024',
      left: {
        subtitle: 'Average hours slept per night',
        yLabel: 'Hours',
        categories: ['18–24', '25–39', '40–59', '60–74', '75+'],
        values: [7.2, 6.9, 6.6, 7.0, 7.4],
        colorIndex: 0,
      },
      right: {
        subtitle: 'Reporting difficulty sleeping',
        yLabel: 'Percentage',
        unit: '%',
        categories: ['18–24', '25–39', '40–59', '60–74', '75+'],
        values: [22, 28, 35, 41, 47],
        colorIndex: 1,
      },
    }),
    data: 'Two bar charts by age group (18-24, 25-39, 40-59, 60-74, 75+). Average hours slept: 7.2/6.9/6.6/7.0/7.4 — dips in middle age, lowest at 40-59, highest at 75+. Difficulty sleeping: 22/28/35/41/47 per cent — rises steadily with age. So the oldest group sleeps longest yet reports most difficulty.',
  },

  '05': {
    svg: () => groupedBar({
      title: 'Employees working mainly from home in five sectors, 2019 and 2025',
      yLabel: 'Employees working from home (%)',
      unit: '%',
      categories: ['Information technology', 'Finance', 'Education', 'Manufacturing', 'Hospitality'],
      series: [
        { name: '2019', values: [18, 12, 4, 2, 1] },
        { name: '2025', values: [62, 48, 15, 6, 3] },
      ],
    }),
    data: 'Grouped bar chart, % working mainly from home 2019 vs 2025. IT 18 to 62; Finance 12 to 48; Education 4 to 15; Manufacturing 2 to 6; Hospitality 1 to 3. Every sector rose. IT highest in both years and largest absolute rise (+44 points). Hospitality lowest throughout, barely changed.',
  },

  '06': {
    svg: () => dualPanel({
      title: 'Student enrolments in three types of course, 2010 and 2025, and average student age',
      left: {
        subtitle: 'Number of students enrolled',
        yLabel: 'Students',
        categories: ['Vocational', 'Academic', 'Online'],
        series: [
          { name: '2010', values: [1250, 860, 140], colorIndex: 0 },
          { name: '2025', values: [980, 1320, 1610], colorIndex: 1 },
        ],
      },
      right: {
        subtitle: 'Average age of students, 2025',
        yLabel: 'Years',
        categories: ['Vocational', 'Academic', 'Online'],
        values: [27, 20, 34],
        colorIndex: 3,
      },
    }),
    data: 'Left bar chart, enrolments 2010 vs 2025: vocational 1250 to 980 (only fall), academic 860 to 1320, online 140 to 1610 (more than tenfold, largest by 2025). Right bar chart, average age in 2025: vocational 27, academic 20 (youngest), online 34 (oldest).',
  },

  '07': {
    svg: () => processDiagram({
      title: 'Stages in producing coffee, from harvesting to packaging',
      steps: [
        'Ripe cherries picked by hand',
        'Pulping machine removes the outer skin',
        'Beans fermented in water tanks for 24–48 hours',
        'Beans washed and dried in the sun',
        'Hulling removes the dried parchment layer',
        'Beans graded and sorted by size',
        'Roasting at high temperature',
        'Packing into sealed bags for export',
      ],
    }),
    data: 'Process diagram, 8 stages of coffee production: 1 ripe cherries picked by hand, 2 pulping machine removes outer skin, 3 beans fermented in water tanks 24-48 hours, 4 washed and dried in the sun, 5 hulling removes dried parchment, 6 graded and sorted by size, 7 roasted at high temperature, 8 packed into sealed bags for export.',
  },

  '08': {
    // Grafik va jadval bitta faylda — bazada bitta rasm maydoni bor
    svg: () => stack(
      groupedBar({
        title: 'International visitors to five cities, 2015 and 2025 (millions)',
        yLabel: 'Visitors (millions)',
        categories: ['Barcelona', 'Prague', 'Lisbon', 'Venice', 'Amsterdam'],
        series: [
          { name: '2015', values: [8.3, 6.6, 4.2, 5.1, 7.0] },
          { name: '2025', values: [9.1, 7.4, 6.9, 4.3, 8.2] },
        ],
      }),
      table({
        title: 'Average length of stay, 2025 (nights)',
        columns: ['City', 'Barcelona', 'Prague', 'Lisbon', 'Venice', 'Amsterdam'],
        rows: [['Nights', '3.4', '2.8', '4.1', '1.6', '2.9']],
      }),
    ),
    data: 'Grouped bar chart, international visitors in millions 2015 vs 2025: Barcelona 8.3 to 9.1 (highest in both years), Prague 6.6 to 7.4, Lisbon 4.2 to 6.9 (largest proportional rise), Venice 5.1 to 4.3 (only city to fall), Amsterdam 7.0 to 8.2. Accompanying table of average length of stay in nights: Barcelona 3.4, Prague 2.8, Lisbon 4.1, Venice 1.6, Amsterdam 2.9 — Venice has the shortest stay, Lisbon the longest.',
  },

  '09': {
    svg: () => lineChart({
      title: 'Advertising expenditure by medium, 2005–2025 (billions of pounds)',
      xLabels: ['2005', '2010', '2015', '2020', '2025'],
      yLabel: 'Expenditure (£ billion)',
      series: [
        { name: 'Digital', values: [1.2, 3.8, 7.5, 12.4, 18.6] },
        { name: 'Print', values: [5.6, 3.9, 2.4, 1.5, 0.9] },
        { name: 'Television', values: [4.8, 5.2, 4.9, 4.1, 3.4] },
        { name: 'Radio', values: [1.1, 1.0, 1.0, 0.9, 0.8] },
      ],
    }),
    data: 'Line graph, advertising spend in £ billions 2005/2010/2015/2020/2025. Digital 1.2/3.8/7.5/12.4/18.6 (rose steeply, overtook print by 2010 and television by about 2012-2015, far the largest by 2025). Print 5.6/3.9/2.4/1.5/0.9 (largest in 2005, fell steadily to smallest but one). Television 4.8/5.2/4.9/4.1/3.4 (peaked 2010 then declined gently). Radio 1.1/1.0/1.0/0.9/0.8 (smallest and almost flat).',
  },

  '10': {
    svg: () => lineChart({
      title: 'Objects launched into space by five countries, 1990–2025',
      xLabels: ['1990', '2000', '2010', '2020', '2025'],
      yLabel: 'Objects launched',
      series: [
        { name: 'United States', values: [60, 45, 80, 180, 300] },
        { name: 'China', values: [5, 10, 25, 90, 210] },
        { name: 'Russia', values: [75, 40, 35, 30, 45] },
        { name: 'India', values: [5, 8, 15, 35, 70] },
        { name: 'Japan', values: [8, 12, 20, 40, 65] },
      ],
    }),
    data: 'Line graph, objects launched 1990/2000/2010/2020/2025. United States 60/45/80/180/300 (dipped in 2000 then rose steeply, highest by 2025). China 5/10/25/90/210 (slowest start but sharpest acceleration, second by 2025). Russia 75/40/35/30/45 (highest in 1990, then fell and stayed low). India 5/8/15/35/70 and Japan 8/12/20/40/65 (both small but growing steadily).',
  },
};

function main() {
  mkdirSync(OUT, { recursive: true });
  for (const [nn, fig] of Object.entries(FIGURES)) {
    writeFileSync(join(OUT, `task1-test-${nn}.svg`), fig.svg());
    if (fig.extra) writeFileSync(join(OUT, `task1-test-${nn}-b.svg`), fig.extra());
    console.log(`✅ task1-test-${nn}.svg${fig.extra ? ' (+ -b.svg)' : ''}`);
  }
  console.log(`\n${Object.keys(FIGURES).length} ta rasm → ${OUT}`);
}

if (process.argv[1] && process.argv[1].endsWith('generate.mjs')) main();
