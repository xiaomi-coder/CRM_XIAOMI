/**
 * IELTS Academic Writing Task 1 uchun grafik chizuvchi (SVG).
 *
 * Nega SVG: tashqi kutubxona, rasm xizmati yoki fayl yuklash kerak emas.
 * Fayllar `public/images/ielts/` ga tushadi va Vercel ularni static tarqatadi —
 * bazada faqat manzil saqlanadi (`taskImageUrl`), sxema o'zgarmaydi.
 *
 * Uslub imtihon varaqasiga yaqin: oq fon, qora matn, oddiy ranglar, yirik yozuv.
 */

const W = 760;
const COLORS = ['#1d4ed8', '#dc2626', '#059669', '#d97706', '#7c3aed'];
const INK = '#0f172a';
const GRID = '#cbd5e1';
const MUTED = '#475569';

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const text = (x, y, s, { size = 13, anchor = 'start', weight = 400, fill = INK, rotate } = {}) =>
  `<text x="${x}" y="${y}" font-family="Helvetica, Arial, sans-serif" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}"${rotate ? ` transform="rotate(${rotate} ${x} ${y})"` : ''}>${esc(s)}</text>`;

const wrap = (s, max) => {
  const words = String(s).split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    if ((line + ' ' + w).trim().length > max && line) { lines.push(line.trim()); line = w; }
    else line += ' ' + w;
  }
  if (line.trim()) lines.push(line.trim());
  return lines;
};

/** Chiroyli o'q qiymatlari: 0, 10, 20 ... */
const niceTicks = (max, count = 5) => {
  const raw = max / count;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) || mag * 10;
  const top = Math.ceil(max / step) * step;
  const ticks = [];
  for (let v = 0; v <= top + 1e-9; v += step) ticks.push(Number(v.toFixed(10)));
  return { ticks, top };
};

const svg = (height, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${height}" width="${W}" height="${height}" role="img">
<rect width="${W}" height="${height}" fill="#ffffff"/>
${body}
</svg>`;

const legend = (series, x, y) =>
  series
    .map((s, i) => {
      const cx = x + i * 150;
      return `<rect x="${cx}" y="${y - 9}" width="14" height="10" fill="${COLORS[i % COLORS.length]}" rx="2"/>` +
        text(cx + 20, y, s.name, { size: 12, fill: MUTED });
    })
    .join('\n');

/** Chiziqli grafik — vaqt bo'yicha o'zgarish */
export function lineChart({ title, xLabels, series, yLabel, unit = '' }) {
  const H = 430;
  const pad = { l: 68, r: 20, t: 58, b: 76 };
  const plotW = W - pad.l - pad.r;
  const plotH = H - pad.t - pad.b;
  const max = Math.max(...series.flatMap((s) => s.values));
  const { ticks, top } = niceTicks(max);
  const x = (i) => pad.l + (plotW * i) / (xLabels.length - 1);
  const y = (v) => pad.t + plotH - (plotH * v) / top;

  const parts = [
    ...wrap(title, 92).map((l, i) => text(W / 2, 24 + i * 18, l, { size: 14, weight: 700, anchor: 'middle' })),
    ...ticks.map((t) =>
      `<line x1="${pad.l}" y1="${y(t)}" x2="${W - pad.r}" y2="${y(t)}" stroke="${GRID}" stroke-width="1"/>` +
      text(pad.l - 10, y(t) + 4, t + unit, { size: 12, anchor: 'end', fill: MUTED })
    ),
    ...xLabels.map((l, i) => text(x(i), pad.t + plotH + 22, l, { size: 12, anchor: 'middle', fill: MUTED })),
    text(18, pad.t + plotH / 2, yLabel, { size: 12, anchor: 'middle', fill: MUTED, rotate: -90 }),
    ...series.map((s, si) => {
      const c = COLORS[si % COLORS.length];
      const d = s.values.map((v, i) => `${i ? 'L' : 'M'}${x(i)},${y(v)}`).join(' ');
      const dots = s.values.map((v, i) => `<circle cx="${x(i)}" cy="${y(v)}" r="3.5" fill="${c}"/>`).join('');
      return `<path d="${d}" fill="none" stroke="${c}" stroke-width="2.5" stroke-linejoin="round"/>${dots}`;
    }),
    legend(series, pad.l, H - 24),
  ];
  return svg(H, parts.join('\n'));
}

/** Guruhlangan ustunli diagramma — ikki yoki uch davrni solishtirish */
export function groupedBar({ title, categories, series, yLabel, unit = '' }) {
  const H = 430;
  const pad = { l: 68, r: 20, t: 58, b: 90 };
  const plotW = W - pad.l - pad.r;
  const plotH = H - pad.t - pad.b;
  const max = Math.max(...series.flatMap((s) => s.values));
  const { ticks, top } = niceTicks(max);
  const y = (v) => pad.t + plotH - (plotH * v) / top;
  const groupW = plotW / categories.length;
  const barW = Math.min(38, (groupW * 0.68) / series.length);

  const parts = [
    ...wrap(title, 92).map((l, i) => text(W / 2, 24 + i * 18, l, { size: 14, weight: 700, anchor: 'middle' })),
    ...ticks.map((t) =>
      `<line x1="${pad.l}" y1="${y(t)}" x2="${W - pad.r}" y2="${y(t)}" stroke="${GRID}" stroke-width="1"/>` +
      text(pad.l - 10, y(t) + 4, t + unit, { size: 12, anchor: 'end', fill: MUTED })
    ),
    ...categories.flatMap((cat, ci) => {
      const centre = pad.l + groupW * ci + groupW / 2;
      const start = centre - (barW * series.length) / 2;
      const bars = series.map((s, si) => {
        const v = s.values[ci];
        const bx = start + si * barW;
        return `<rect x="${bx}" y="${y(v)}" width="${barW - 4}" height="${pad.t + plotH - y(v)}" fill="${COLORS[si % COLORS.length]}" rx="2"/>` +
          text(bx + (barW - 4) / 2, y(v) - 6, v + unit, { size: 11, anchor: 'middle', fill: MUTED });
      });
      const label = wrap(cat, 14).map((l, li) =>
        text(centre, pad.t + plotH + 20 + li * 14, l, { size: 12, anchor: 'middle', fill: MUTED }));
      return [...bars, ...label];
    }),
    text(18, pad.t + plotH / 2, yLabel, { size: 12, anchor: 'middle', fill: MUTED, rotate: -90 }),
    legend(series, pad.l, H - 22),
  ];
  return svg(H, parts.join('\n'));
}

/** Yonma-yon ikki panel: chapda ustunli, o'ngda ustunli/chiziqli */
export function dualPanel({ title, left, right }) {
  const H = 430;
  const half = W / 2;
  const pad = { t: 66, b: 84 };
  const plotH = H - pad.t - pad.b;

  const panel = (p, x0, width) => {
    const l = x0 + 52, r = x0 + width - 16;
    const plotW = r - l;
    // Panel bitta qator qiymat (values) yoki guruhlangan (series) bo'lishi mumkin
    const series = p.series || [{ name: '', values: p.values, colorIndex: p.colorIndex ?? 0 }];
    const max = Math.max(...series.flatMap((s) => s.values));
    const { ticks, top } = niceTicks(max, 4);
    const y = (v) => pad.t + plotH - (plotH * v) / top;
    const groupW = plotW / p.categories.length;
    const barW = Math.min(30, (groupW * 0.6) / series.length);

    const bars = p.categories.flatMap((cat, ci) => {
      const centre = l + groupW * ci + groupW / 2;
      const start = centre - (barW * series.length) / 2;
      const drawn = series.map((s, si) => {
        const v = s.values[ci];
        const bx = start + si * barW;
        const colour = COLORS[(s.colorIndex ?? si + (p.colorIndex ?? 0)) % COLORS.length];
        return `<rect x="${bx}" y="${y(v)}" width="${barW - 3}" height="${pad.t + plotH - y(v)}" fill="${colour}" rx="2"/>` +
          text(bx + (barW - 3) / 2, y(v) - 6, v + (p.unit || ''), { size: 10, anchor: 'middle', fill: MUTED });
      });
      return [...drawn, ...wrap(cat, 11).map((line, li) =>
        text(centre, pad.t + plotH + 18 + li * 13, line, { size: 11, anchor: 'middle', fill: MUTED }))];
    });

    const key = p.series
      ? p.series.map((s, si) => {
        const cx = l + si * 92;
        return `<rect x="${cx}" y="${H - 42}" width="12" height="9" fill="${COLORS[(s.colorIndex ?? si) % COLORS.length]}" rx="2"/>` +
          text(cx + 17, H - 34, s.name, { size: 11, fill: MUTED });
      })
      : [];

    return [
      text(x0 + width / 2, pad.t - 20, p.subtitle, { size: 12, weight: 700, anchor: 'middle' }),
      ...ticks.map((t) =>
        `<line x1="${l}" y1="${y(t)}" x2="${r}" y2="${y(t)}" stroke="${GRID}" stroke-width="1"/>` +
        text(l - 8, y(t) + 4, t + (p.unit || ''), { size: 11, anchor: 'end', fill: MUTED })
      ),
      ...bars,
      ...key,
      text(x0 + 14, pad.t + plotH / 2, p.yLabel, { size: 11, anchor: 'middle', fill: MUTED, rotate: -90 }),
    ];
  };

  const parts = [
    ...wrap(title, 92).map((l, i) => text(W / 2, 24 + i * 18, l, { size: 14, weight: 700, anchor: 'middle' })),
    ...panel(left, 0, half),
    `<line x1="${half}" y1="${pad.t - 34}" x2="${half}" y2="${H - 30}" stroke="${GRID}" stroke-width="1"/>`,
    ...panel(right, half, half),
  ];
  return svg(H, parts.join('\n'));
}

/** Jadval */
export function table({ title, columns, rows, note }) {
  const rowH = 34;
  const headH = 38;
  const H = 96 + headH + rows.length * rowH + (note ? 26 : 0);
  const pad = { l: 40, r: 40, t: 62 };
  const tableW = W - pad.l - pad.r;
  const colW = tableW / columns.length;

  const parts = [
    ...wrap(title, 92).map((l, i) => text(W / 2, 24 + i * 18, l, { size: 14, weight: 700, anchor: 'middle' })),
    `<rect x="${pad.l}" y="${pad.t}" width="${tableW}" height="${headH}" fill="#e2e8f0"/>`,
    ...columns.map((c, i) =>
      text(pad.l + colW * i + (i === 0 ? 12 : colW / 2), pad.t + 24, c, {
        size: 12, weight: 700, anchor: i === 0 ? 'start' : 'middle',
      })
    ),
    ...rows.flatMap((row, ri) => {
      const y0 = pad.t + headH + ri * rowH;
      const bg = ri % 2 ? `<rect x="${pad.l}" y="${y0}" width="${tableW}" height="${rowH}" fill="#f8fafc"/>` : '';
      return [
        bg,
        `<line x1="${pad.l}" y1="${y0}" x2="${pad.l + tableW}" y2="${y0}" stroke="${GRID}" stroke-width="1"/>`,
        ...row.map((cell, ci) =>
          text(pad.l + colW * ci + (ci === 0 ? 12 : colW / 2), y0 + 22, cell, {
            size: 12, anchor: ci === 0 ? 'start' : 'middle', weight: ci === 0 ? 600 : 400,
          })
        ),
      ];
    }),
    `<rect x="${pad.l}" y="${pad.t}" width="${tableW}" height="${headH + rows.length * rowH}" fill="none" stroke="${INK}" stroke-width="1.2"/>`,
    ...columns.slice(1).map((_, i) =>
      `<line x1="${pad.l + colW * (i + 1)}" y1="${pad.t}" x2="${pad.l + colW * (i + 1)}" y2="${pad.t + headH + rows.length * rowH}" stroke="${GRID}" stroke-width="1"/>`
    ),
    note ? text(W / 2, pad.t + headH + rows.length * rowH + 22, note, { size: 11, anchor: 'middle', fill: MUTED }) : '',
  ];
  return svg(H, parts.join('\n'));
}

/**
 * Bir nechta figurani bitta SVG ga vertikal joylaydi.
 * Bazada bitta `taskImageUrl` maydoni bor, shuning uchun "chart + table"
 * turidagi topshiriqlar bitta faylga sig'ishi kerak.
 */
export function stack(...figures) {
  let offset = 0;
  const groups = figures.map((fig) => {
    const h = Number(fig.match(/height="(\d+(?:\.\d+)?)"/)[1]);
    const inner = fig.replace(/^[\s\S]*?<rect[^>]*fill="#ffffff"\/>/, '').replace(/<\/svg>\s*$/, '');
    const g = `<g transform="translate(0 ${offset})">${inner}</g>`;
    offset += h;
    return g;
  });
  return svg(offset, `<rect width="${W}" height="${offset}" fill="#ffffff"/>\n${groups.join('\n')}`);
}

/** Jarayon diagrammasi — qutilar va strelkalar, qatorlarga bo'linadi */
export function processDiagram({ title, steps, perRow = 4 }) {
  const boxW = 156;
  const boxH = 84;
  const gapX = 24;
  const gapY = 54;
  const rows = Math.ceil(steps.length / perRow);
  const H = 74 + rows * boxH + (rows - 1) * gapY + 30;
  const rowWidth = perRow * boxW + (perRow - 1) * gapX;
  const startX = (W - rowWidth) / 2;
  const top = 66;

  const arrow = (x1, y1, x2, y2) =>
    `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${INK}" stroke-width="1.6" marker-end="url(#ah)"/>`;

  const parts = [
    `<defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${INK}"/></marker></defs>`,
    ...wrap(title, 92).map((l, i) => text(W / 2, 26 + i * 18, l, { size: 14, weight: 700, anchor: 'middle' })),
  ];

  steps.forEach((step, i) => {
    const row = Math.floor(i / perRow);
    const col = i % perRow;
    const reversed = row % 2 === 1; // ilon shaklida: 2-qator o'ngdan chapga
    const slot = reversed ? perRow - 1 - col : col;
    const x = startX + slot * (boxW + gapX);
    const y = top + row * (boxH + gapY);

    parts.push(`<rect x="${x}" y="${y}" width="${boxW}" height="${boxH}" fill="#f1f5f9" stroke="${INK}" stroke-width="1.2" rx="6"/>`);
    parts.push(text(x + 10, y + 20, String(i + 1), { size: 11, weight: 700, fill: COLORS[0] }));
    wrap(step, 20).forEach((line, li) =>
      parts.push(text(x + boxW / 2, y + 40 + li * 15, line, { size: 12, anchor: 'middle' }))
    );

    if (i < steps.length - 1) {
      const nextRow = Math.floor((i + 1) / perRow);
      if (nextRow === row) {
        const dir = reversed ? -1 : 1;
        const from = dir > 0 ? x + boxW : x;
        parts.push(arrow(from, y + boxH / 2, from + dir * gapX, y + boxH / 2));
      } else {
        parts.push(arrow(x + boxW / 2, y + boxH, x + boxW / 2, y + boxH + gapY));
      }
    }
  });

  return svg(H, parts.join('\n'));
}
