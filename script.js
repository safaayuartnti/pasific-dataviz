/* ═══════════════════════════════════════════════════
   PARADOKS PASIFIK — script.js (FINAL · DIPERBAIKI)
   Data asli: Pacific Data Hub, SPC
   Memuat data/pacific_data.json saat runtime
═══════════════════════════════════════════════════ */

'use strict';

const PALETTE = ['#1a5c8a','#c94030','#2a7a5a','#e07820','#7050a0','#c06080','#4090a0','#a08030','#5080c0','#80a040','#406090','#a05050'];
const FOCUS_COUNTRIES = ['Fiji','Papua New Guinea','Solomon Islands','Vanuatu','Samoa','Kiribati','Tonga','Tuvalu','Marshall Islands'];

let DATA = null;
let activeCountries = new Set(['Fiji','Kiribati','Tuvalu','Samoa']);
const charts = {};
const barFocus = { ghgBarChart: null, affectedChart: null, waterBarChart: null };
const soloFocus = { sstLineChart: null, seaLevelChart: null, cropLineChart: null, econLossChart: null };
let paradoxCache = null;
let paradoxManualFocus = null;
let currentScrollyStep = -1;

// ── PETA WARNA TETAP PER NEGARA (1 warna = 1 negara, di semua grafik) ──
const COUNTRY_COLOR = {};
function buildCountryColorMap() {
  const seen = new Set();
  Object.values(DATA.main).forEach(group => Object.keys(group).forEach(c => seen.add(c)));
  const ordered = [...FOCUS_COUNTRIES, ...[...seen].filter(c => !FOCUS_COUNTRIES.includes(c)).sort()];
  ordered.forEach((name, i) => { COUNTRY_COLOR[name] = PALETTE[i % PALETTE.length]; });
}
function colorFor(name) { return COUNTRY_COLOR[name] || '#9a9590'; }

// Daftar negara untuk satu dataset, dengan negara utama (FOCUS_COUNTRIES) lebih
// dulu, lalu sisanya. Dipakai agar grafik tidak pernah cuma menampilkan 1-2
// negara saja ketika dataset itu tidak memiliki semua negara utama.
function prioritizedCountries(group, max) {
  const list = allCountries(group);
  const prioritized = FOCUS_COUNTRIES.filter(f => list.includes(f));
  const rest = list.filter(c => !FOCUS_COUNTRIES.includes(c));
  const combined = [...prioritized, ...rest];
  return max ? combined.slice(0, max) : combined;
}

// ── TEMA ───────────────────────────────────────────────────────────────
const root = document.documentElement;
let dark = false;
document.getElementById('themeToggle').addEventListener('click', () => {
  dark = !dark;
  root.setAttribute('data-theme', dark ? 'dark' : 'light');
  setTimeout(() => {
    renderCover();
    firedCharts.forEach(id => (chartFns[id] || []).forEach(fn => fn()));
  }, 60);
});

// ── HELPER ─────────────────────────────────────────────────────────────
function fmt(n, decimals = 1) {
  if (n === null || n === undefined || isNaN(n)) return '—';
  const abs = Math.abs(n);
  if (abs >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (abs >= 1e3) return (n / 1e3).toFixed(abs >= 1e5 ? 0 : 1) + 'K';
  return parseFloat(n.toFixed(decimals)).toString();
}
function style(prop) { return getComputedStyle(root).getPropertyValue(prop).trim(); }
function colors() {
  return {
    text1: style('--text-1'), text2: style('--text-2'), text3: style('--text-3'),
    border: style('--border'), surface: style('--surface'),
    accent: style('--accent'), accent2: style('--accent-2'), accent3: style('--accent-3'),
    bg: style('--bg')
  };
}
function yearsOf(obj) { return Object.keys(obj).map(Number).sort((a, b) => a - b); }
// Rentang tahun yang KONTINU (tanpa lompat), dengan 0 untuk tahun yang tidak
// punya data. Ini mencegah sumbu-X "melompati" tahun yang datanya kosong.
function continuousYearRange(yearsArr) {
  if (!yearsArr.length) return [];
  const min = Math.min(...yearsArr), max = Math.max(...yearsArr);
  const out = [];
  for (let y = min; y <= max; y++) out.push(y);
  return out;
}
function getChart(id) {
  if (charts[id]) return charts[id];
  const el = document.getElementById(id);
  if (!el) return null;
  charts[id] = echarts.init(el);
  return charts[id];
}
function baseOpt(c) {
  return {
    backgroundColor: 'transparent',
    animationDuration: 700,
    animationEasing: 'cubicOut',
    textStyle: { fontFamily: "'Inter', sans-serif", color: c.text2 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: c.surface, borderColor: c.border, borderWidth: 1,
      textStyle: { color: c.text1, fontSize: 12 },
      extraCssText: 'box-shadow:0 4px 16px rgba(0,0,0,0.12); border-radius:8px; padding:10px 12px;'
    }
  };
}
function axisDefaults(c) {
  return {
    axisLabel: { color: c.text2, fontSize: 11 },
    axisLine: { lineStyle: { color: c.border } },
    splitLine: { lineStyle: { color: c.border, type: 'dashed' } },
    axisTick: { show: false }
  };
}
// Sumbu tipe value untuk TAHUN: hilangkan format pemisah ribuan ("1.980")
function yearAxisDefaults(c) {
  const base = axisDefaults(c);
  return { ...base, axisLabel: { ...base.axisLabel, formatter: v => Math.round(v) } };
}

// ── AKSES DATA ─────────────────────────────────────────────────────────
async function loadData() {
  const res = await fetch('data/pacific_data.json');
  DATA = await res.json();
}
function seriesFor(group, country) { return (DATA.main[group] && DATA.main[group][country]) || null; }
function summaryFor(group, country) { return (DATA.summary[group] && DATA.summary[group][country]) || null; }
function allCountries(group) { return Object.keys(DATA.main[group] || {}); }
function pickRepresentative(group, candidates) {
  for (const c of candidates) if (DATA.main[group] && DATA.main[group][c]) return c;
  return allCountries(group)[0];
}

// ── ANGKA BERHITUNG NAIK ────────────────────────────────────────────────
const countUpObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) { animateCount(entry.target); countUpObserver.unobserve(entry.target); }
  });
}, { threshold: 0.4 });

function setCountUp(el, value, formatter) {
  if (!el) return;
  if (typeof value !== 'number' || isNaN(value)) { el.textContent = '—'; return; }
  el._target = value;
  el._fmt = formatter || (v => v.toFixed(1));
  if (el._counted) { el.textContent = el._fmt(value); return; }
  el.textContent = el._fmt(0);
  countUpObserver.observe(el);
}
function animateCount(el) {
  el._counted = true;
  const target = el._target, formatter = el._fmt, duration = 1100, start = performance.now();
  function tick(now) {
    const p = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = formatter(target * eased);
    if (p < 1) requestAnimationFrame(tick); else el.textContent = formatter(target);
  }
  requestAnimationFrame(tick);
}

// ── CHIP LEGENDA (dipakai bersama) ──────────────────────────────────────
function buildChips(containerId, names, isActiveFn, onClick) {
  const wrap = document.getElementById(containerId);
  if (!wrap) return;
  wrap.innerHTML = '';
  names.forEach(name => {
    const col = colorFor(name);
    const chip = document.createElement('span');
    const active = isActiveFn(name);
    chip.className = 'ctry-chip' + (active ? ' active' : '');
    chip.style.setProperty('--swatch', col);
    chip.textContent = name;
    if (active) { chip.style.background = col; chip.style.borderColor = col; chip.style.color = '#fff'; }
    else { chip.style.background = ''; chip.style.borderColor = ''; chip.style.color = ''; }
    chip.addEventListener('click', () => onClick(name, chip));
    wrap.appendChild(chip);
  });
}

// ── KLIK-UNTUK-FOKUS PADA BAR CHART ─────────────────────────────────────
function attachBarFocus(chart, chartId, rerenderFn) {
  chart.off('click');
  chart.getZr().off('click');
  chart.on('click', (params) => {
    if (params.componentType !== 'series') return;
    barFocus[chartId] = (barFocus[chartId] === params.dataIndex) ? null : params.dataIndex;
    rerenderFn();
  });
  chart.getZr().on('click', (e) => {
    if (!e.target) { barFocus[chartId] = null; rerenderFn(); }
  });
}

// ── TEKS CALLOUT DINAMIS (argumen berbasis data, sebab-akibat) ─────────
function ghgCalloutText(country, val) {
  const ratio = val > 0 ? (4.7 / val) : 0;
  return `<strong>${country}</strong> emits only ${val.toFixed(2)} tons CO₂e per person — roughly <strong>${ratio.toFixed(0)}×</strong> less than the global average of 4.7 tons CO₂e. An emission this small could not meaningfully drive global warming, yet this country still bears its consequences in the chapters ahead.`;
}
function affectedCalloutText(country, total, totalAll) {
  const pct = (total / totalAll) * 100;
  return `<strong>${country}</strong> has recorded <strong>${fmt(total)}</strong> people affected by disasters — about <strong>${pct.toFixed(1)}%</strong> of all disaster victims across the Pacific. The more frequent the cyclones and floods, the higher this number climbs — a direct consequence of the climate evidence shown in Chapter 2.`;
}
function waterCalloutText(country, val, isLow) {
  return isLow
    ? `<strong>${country}</strong>: only <strong>${val.toFixed(1)}%</strong> of the population has access to safe drinking water — one of the lowest rates in this dataset. This links directly to the rainfall disruptions and sea-level rise discussed in Chapter 2.`
    : `<strong>${country}</strong>: <strong>${val.toFixed(1)}%</strong> of the population has access to safe drinking water — one of the highest rates in the region.`;
}
function paradoxClickText(country, ghg, affected) {
  return `<strong>${country}</strong>: emits only ${ghg.toFixed(2)} tons CO₂e per person, yet ${fmt(affected)} people have been affected by disasters. Click again to deselect.`;
}

// ════════════════════════════════════════════════════════════════════
//  COVER
// ════════════════════════════════════════════════════════════════════
function renderCover() {
  const ghgVals = Object.values(DATA.summary.ghg).map(d => d.Latest_Emission).filter(v => typeof v === 'number' && v < 10);
  const avgGhg = ghgVals.reduce((a, b) => a + b, 0) / ghgVals.length;
  setCountUp(document.getElementById('cs-ghg'), avgGhg, v => v.toFixed(1));

  const totalAffected = Object.values(DATA.summary.disaster_affected).reduce((a, d) => a + (d.Total_Affected || 0), 0);
  setCountUp(document.getElementById('cs-affected'), totalAffected, v => fmt(v, 0));

  requestAnimationFrame(() => setTimeout(() => {
    const b1 = document.getElementById('cs-ghg-bar'), b2 = document.getElementById('cs-affected-bar');
    if (b1) b1.style.width = '22%';
    if (b2) b2.style.width = '92%';
  }, 250));

  document.getElementById('coverContent').classList.add('in');
}

// ════════════════════════════════════════════════════════════════════
//  BAB 1 — PENYEBAB (GHG)
// ════════════════════════════════════════════════════════════════════
// Gaya bar berperingkat: warna kontras saat difokus (klik), ditambah
// garis tepi default pada satu bar paling penting (misalnya Fiji).
function rankedBarItemStyle(c, name, idx, focusIdx, highlightIdx) {
  const isFocused = focusIdx === idx;
  const isDefaultHighlight = focusIdx === null && idx === highlightIdx;
  const dim = focusIdx !== null && !isFocused;
  return {
    color: isFocused ? c.accent2 : colorFor(name),
    borderRadius: [0, 4, 4, 0],
    opacity: dim ? 0.18 : 1,
    borderColor: isFocused ? c.text1 : (isDefaultHighlight ? c.accent2 : 'transparent'),
    borderWidth: isFocused ? 2 : (isDefaultHighlight ? 2 : 0),
    shadowBlur: isFocused ? 12 : 0,
    shadowColor: isFocused ? 'rgba(201,64,48,0.4)' : 'transparent'
  };
}

function renderGHGBar() {
  const c = colors();
  const chart = getChart('ghgBarChart');
  if (!chart) return;

  const entries = Object.entries(DATA.summary.ghg)
    .filter(([, v]) => typeof v.Latest_Emission === 'number' && v.Latest_Emission < 15)
    .sort(([, a], [, b]) => b.Latest_Emission - a.Latest_Emission);
  const names = entries.map(e => e[0]);
  const vals = entries.map(e => e[1].Latest_Emission);
  const focusIdx = barFocus.ghgBarChart;

  chart.setOption({
    ...baseOpt(c),
    animationDurationUpdate: 450,
    grid: { left: 175, right: 40, top: 10, bottom: 42 },
    xAxis: { type: 'value', ...axisDefaults(c), axisLine: { show: false }, name: 'tons CO₂e / person', nameLocation: 'middle', nameGap: 24, nameTextStyle: { color: c.text2, fontSize: 11, fontWeight: 500 } },
    yAxis: { type: 'category', data: names, axisLine: { show: false }, axisTick: { show: false },
      axisLabel: { color: c.text2, fontSize: 11.5, width: 160, overflow: 'truncate' } },
    tooltip: { ...baseOpt(c).tooltip, formatter: p => `<b>${p[0].name}</b><br/>${p[0].value.toFixed(2)} tons CO₂e / person` },
    series: [{
      type: 'bar', barMaxWidth: 22,
      data: vals.map((v, i) => ({ value: v, itemStyle: rankedBarItemStyle(c, names[i], i, focusIdx, 0) })),
      emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.18)' } },
      label: { show: true, position: 'right', formatter: p => p.value.toFixed(1), color: c.text3, fontSize: 10 },
      animationDelay: idx => idx * 45
    }]
  });

  attachBarFocus(chart, 'ghgBarChart', renderGHGBar);

  const calloutEl = document.getElementById('ghgCallout');
  if (focusIdx !== null && names[focusIdx]) {
    calloutEl.innerHTML = ghgCalloutText(names[focusIdx], vals[focusIdx]);
    calloutEl.classList.add('show');
  } else { calloutEl.classList.remove('show'); }

  const lowest = entries[entries.length - 1];
  setCountUp(document.getElementById('in-ghg-lowest'), lowest[1].Latest_Emission, v => v.toFixed(1));
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  setCountUp(document.getElementById('in-ghg-pacific'), avg, v => v.toFixed(1));
}

function renderGHGCountrySelector() {
  const uniq = prioritizedCountries('ghg');
  buildChips('ghgCountrySelector', uniq,
    name => activeCountries.has(name),
    (name) => { activeCountries.has(name) ? activeCountries.delete(name) : activeCountries.add(name); renderGHGLine(); renderGHGCountrySelector(); }
  );
}

function renderGHGLine() {
  const c = colors();
  const chart = getChart('ghgLineChart');
  if (!chart) return;
  const list = allCountries('ghg');
  const selected = [...activeCountries].filter(x => list.includes(x));
  const solo = selected.length === 1;

  const series = selected.map(country => {
    const raw = seriesFor('ghg', country);
    const yrs = yearsOf(raw);
    const col = colorFor(country);
    return {
      name: country, type: 'line', smooth: true,
      data: yrs.map(y => [Number(y), raw[y]]),
      lineStyle: { color: col, width: solo ? 3 : 2 },
      itemStyle: { color: col },
      areaStyle: solo ? { color: col, opacity: 0.08 } : undefined,
      symbol: 'circle', symbolSize: solo ? 5 : 4,
      endLabel: { show: solo, formatter: '{a}', color: col, fontSize: 10 }
    };
  });

  const opt = {
    ...baseOpt(c),
    animation: true,
    animationDuration: 1800,
    animationEasing: 'cubicOut',
    animationDurationUpdate: 600,
    animationEasingUpdate: 'cubicInOut',
    grid: { left: 50, right: solo ? 110 : 30, top: 32, bottom: 48 },
    xAxis: { type: 'value', ...yearAxisDefaults(c), axisLine: { show: false }, min: 1970, max: 2024, name: 'Year', nameLocation: 'middle', nameGap: 26, nameTextStyle: { color: c.text2, fontSize: 11, fontWeight: 500 } },
    yAxis: { type: 'value', ...axisDefaults(c), axisLine: { show: false }, name: 'tons CO₂e / person', nameLocation: 'end', nameGap: 12, nameTextStyle: { color: c.text2, fontSize: 11, fontWeight: 500 } },
    tooltip: {
      ...baseOpt(c).tooltip, trigger: 'axis',
      formatter: params => { let s = `<b>${Math.round(params[0].axisValue)}</b><br/>`; params.forEach(p => s += `<span style="color:${p.color}">●</span> ${p.seriesName}: ${p.value[1].toFixed(2)}<br/>`); return s; }
    },
    series: series.map((s, i) => ({
      ...s,
      animationDelay: i * 120,
      animationDuration: 1800,
      animationEasing: 'cubicOut'
    }))
  };

  const isFirstRender = !chart._lineAnimDone;
  chart.setOption(opt, true);

  if (isFirstRender) {
    chart._lineAnimDone = true;
    runLineDrawAnimation(chart, 1800 + series.length * 120);
  }
}

// ── ANIMASI MENGGAMBAR GARIS DARI KIRI KE KANAN ────────────────────
// Menggunakan clipPath ECharts graphic: sebuah rect transparan yang
// lebarnya di-animate dari 0 → 100%, "mengungkap" garis secara progresif.
function runLineDrawAnimation(chart, totalDuration) {
  const el = chart.getDom();
  const w = el.offsetWidth;
  const h = el.offsetHeight;
  if (!w || !h) return;

  const duration = totalDuration || 2000;
  const start = performance.now();

  // Pasang clipRect awal (lebar 0)
  chart.setOption({
    graphic: [{
      type: 'rect',
      id: 'lineRevealClip',
      z: 100,
      left: 0,
      top: 0,
      shape: { x: 0, y: 0, width: 0, height: h },
      style: { fill: 'transparent' },
      silent: true
    }]
  });

  // Gunakan requestAnimationFrame untuk grow rect dari kiri ke kanan
  function tick(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    // Easing: ease-in-out cubic
    const eased = progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;

    chart.setOption({
      graphic: [{
        id: 'lineRevealClip',
        shape: { width: w * eased }
      }]
    }, false);

    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      // Hapus graphic setelah selesai agar tooltip tidak terganggu
      chart.setOption({ graphic: [] }, false);
    }
  }
  requestAnimationFrame(tick);
}

// Versi khusus untuk spark chart (lebih cepat, tidak pakai clip)
function runSparkAnimation(chart, duration) {
  duration = duration || 1200;
  const el = chart.getDom();
  const w = el.offsetWidth;
  const h = el.offsetHeight;
  if (!w || !h) return;
  const start = performance.now();
  function tick(now) {
    const p = Math.min((now - start) / duration, 1);
    const e = 1 - Math.pow(1 - p, 3);
    chart.setOption({ graphic: [{ id: 'sparkClip', shape: { width: w * e, height: h } }] }, false);
    if (p < 1) requestAnimationFrame(tick);
    else chart.setOption({ graphic: [] }, false);
  }
  chart.setOption({ graphic: [{ type: 'rect', id: 'sparkClip', z: 100, left: 0, top: 0, shape: { x: 0, y: 0, width: 0, height: h }, style: { fill: 'transparent' }, silent: true }] });
  requestAnimationFrame(tick);
}

// ════════════════════════════════════════════════════════════════════
//  BAB 2 — BUKTI
// ════════════════════════════════════════════════════════════════════
function makeSpark(id, data, color) {
  const chart = getChart(id);
  if (!chart) return;
  const yrs = yearsOf(data);
  chart.setOption({
    backgroundColor: 'transparent',
    animation: true,
    animationDuration: 1200,
    animationEasing: 'cubicOut',
    grid: { left: 0, right: 0, top: 4, bottom: 0 },
    xAxis: { type: 'category', show: false, data: yrs },
    yAxis: { type: 'value', show: false },
    series: [{ type: 'line', data: yrs.map(y => data[y]), smooth: true,
      lineStyle: { color, width: 1.5 }, itemStyle: { opacity: 0 },
      areaStyle: { color, opacity: 0.14 }, symbol: 'none',
      animationDuration: 1200,
      animationEasing: 'cubicOut'
    }]
  });
  // Jalankan animasi draw kiri-ke-kanan
  setTimeout(() => runSparkAnimation(chart, 1200), 50);
}

function renderEvidenceCards() {
  const c = colors();

  const sstCountry = pickRepresentative('sst', ['Fiji']);
  const sstRaw = seriesFor('sst', sstCountry);
  const sstYrs = yearsOf(sstRaw).filter(y => y >= 1980);
  const sstRecent = {}; sstYrs.forEach(y => sstRecent[y] = sstRaw[y]);
  const sstSum = summaryFor('sst', sstCountry);
  setCountUp(document.getElementById('ev-sst'), sstSum.Latest_SST, v => (v >= 0 ? '+' : '') + v.toFixed(1) + '°C');
  makeSpark('evSSTChart', sstRecent, c.accent2);

  const tempCountry = pickRepresentative('surf_temp', ['Fiji']);
  const tempRaw = seriesFor('surf_temp', tempCountry);
  const tempYrs = yearsOf(tempRaw).filter(y => y >= 1980);
  const tempRecent = {}; tempYrs.forEach(y => tempRecent[y] = tempRaw[y]);
  const tempSum = summaryFor('surf_temp', tempCountry) || {};
  const tempLatestKey = Object.keys(tempSum).find(k => k.toLowerCase().includes('latest') && !k.includes('Year'));
  const tempLatest = tempLatestKey ? tempSum[tempLatestKey] : tempRaw[tempYrs[tempYrs.length - 1]];
  setCountUp(document.getElementById('ev-temp'), tempLatest, v => (v >= 0 ? '+' : '') + v.toFixed(1) + '°C');
  makeSpark('evTempChart', tempRecent, '#e07820');

  const rainCountry = pickRepresentative('rain', ['Fiji']);
  const rainRaw = seriesFor('rain', rainCountry);
  const rainYrs = yearsOf(rainRaw);
  const rainLatest = rainRaw[rainYrs[rainYrs.length - 1]];
  setCountUp(document.getElementById('ev-rain'), rainLatest, v => (v >= 0 ? '+' : '') + v.toFixed(1) + 'mm');
  makeSpark('evRainChart', rainRaw, c.accent);

  const seaCountry = pickRepresentative('sea_level', ['Fiji']);
  const seaRaw = seriesFor('sea_level', seaCountry);
  const seaYrs = yearsOf(seaRaw);
  const seaLatest = seaRaw[seaYrs[seaYrs.length - 1]];
  setCountUp(document.getElementById('ev-sea'), seaLatest, v => (v >= 0 ? '+' : '') + v.toFixed(2) + 'm');
  makeSpark('evSeaChart', seaRaw, c.accent3);
}

// ── GRAFIK GARIS MULTI-NEGARA YANG BISA DIFOKUSKAN (SST / Sea Level / Crop) ──
function renderFocusableLineChart(cfg) {
  const c = colors();
  const chart = getChart(cfg.chartId);
  if (!chart) return;
  const focus = soloFocus[cfg.chartId];

  const series = cfg.countries.map((country) => {
    const raw = seriesFor(cfg.group, country);
    if (!raw) return null;
    let yrs = yearsOf(raw);
    if (cfg.filterYearsFn) yrs = yrs.filter(cfg.filterYearsFn);
    const isFocused = focus === country;
    const dim = focus && !isFocused;
    const col = colorFor(country);
    return {
      name: country, type: 'line', smooth: true,
      data: yrs.map(y => [y, raw[y]]),
      lineStyle: { color: col, width: isFocused ? 3 : 1.5, opacity: dim ? 0.15 : 1 },
      itemStyle: { color: col, opacity: dim ? 0.15 : 1 },
      symbol: 'none', z: isFocused ? 10 : 1,
      endLabel: { show: isFocused, formatter: '{a}', fontSize: 10, color: col }
    };
  }).filter(Boolean);

  const isFirstRender = !chart._lineAnimDone;
  chart.setOption({
    ...baseOpt(c),
    animation: true,
    animationDuration: 2000,
    animationEasing: 'cubicOut',
    animationDurationUpdate: 500,
    animationEasingUpdate: 'cubicInOut',
    grid: { left: 58, right: 30, top: 32, bottom: 48 },
    xAxis: { type: 'value', ...yearAxisDefaults(c), axisLine: { show: false }, min: cfg.xMin, max: cfg.xMax, name: 'Year', nameLocation: 'middle', nameGap: 26, nameTextStyle: { color: c.text2, fontSize: 11, fontWeight: 500 } },
    yAxis: {
      type: 'value', ...axisDefaults(c), axisLine: { show: false },
      name: cfg.yName, nameLocation: 'end', nameGap: 12, nameTextStyle: { color: c.text2, fontSize: 11, fontWeight: 500 },
      axisLabel: cfg.yFormatter ? { color: c.text2, fontSize: 11, formatter: cfg.yFormatter } : { ...axisDefaults(c).axisLabel, color: c.text2, fontSize: 11 }
    },
    tooltip: {
      ...baseOpt(c).tooltip, trigger: 'axis',
      formatter: params => { let s = `<b>${Math.round(params[0].axisValue)}</b><br/>`; params.forEach(p => s += `<span style="color:${p.color}">●</span> ${p.seriesName}: ${p.value[1].toFixed(2)}<br/>`); return s; }
    },
    series: series.map((s, i) => ({
      ...s,
      animationDelay: i * 100,
      animationDuration: 2000,
      animationEasing: 'cubicOut'
    }))
  });

  if (isFirstRender) {
    chart._lineAnimDone = true;
    runLineDrawAnimation(chart, 2000 + series.length * 100);
  }

  buildChips(cfg.legendId, cfg.countries,
    name => soloFocus[cfg.chartId] === name,
    (name) => { soloFocus[cfg.chartId] = soloFocus[cfg.chartId] === name ? null : name; renderFocusableLineChart(cfg); }
  );
}

// PERBAIKAN: sebelumnya hanya menampilkan negara yang ada di daftar prioritas
// (FOCUS_COUNTRIES), padahal dataset SST hanya berisi sedikit negara dan
// kebanyakan tidak masuk daftar itu — sehingga grafik tampak cuma punya 1-2
// data. Sekarang menampilkan SEMUA negara yang benar-benar tersedia.
function renderSSTLineChart() {
  const focus = prioritizedCountries('sst');
  renderFocusableLineChart({ chartId: 'sstLineChart', legendId: 'sstLegend', group: 'sst', countries: focus, xMin: 1980, xMax: 2025, yName: '°C', filterYearsFn: y => y >= 1980 });
}
function renderSeaLevelChart() {
  const list = allCountries('sea_level');
  const highlight = ['Tuvalu', 'Marshall Islands', 'Kiribati', 'Fiji', 'Vanuatu'].filter(h => list.includes(h));
  renderFocusableLineChart({ chartId: 'seaLevelChart', legendId: 'seaLevelLegend', group: 'sea_level', countries: highlight, xMin: 1993, xMax: 2023, yName: 'm', yFormatter: v => v + 'm' });
}

// ════════════════════════════════════════════════════════════════════
//  BAB 3 — BIAYA MANUSIA
// ════════════════════════════════════════════════════════════════════
function renderAffectedChart() {
  const c = colors();
  const chart = getChart('affectedChart');
  if (!chart) return;

  const entries = Object.entries(DATA.summary.disaster_affected)
    .filter(([, v]) => v.Total_Affected > 0)
    .sort(([, a], [, b]) => b.Total_Affected - a.Total_Affected)
    .slice(0, 14);
  const names = entries.map(e => e[0]);
  const totals = entries.map(e => e[1].Total_Affected);
  const totalAll = Object.values(DATA.summary.disaster_affected).reduce((a, b) => a + (b.Total_Affected || 0), 0);
  const focusIdx = barFocus.affectedChart;

  chart.setOption({
    ...baseOpt(c),
    animationDurationUpdate: 450,
    grid: { left: 195, right: 70, top: 10, bottom: 42 },
    xAxis: { type: 'value', ...axisDefaults(c), axisLine: { show: false }, name: 'Total People Affected', nameLocation: 'middle', nameGap: 24, nameTextStyle: { color: c.text2, fontSize: 11, fontWeight: 500 }, axisLabel: { color: c.text2, fontSize: 11, formatter: v => fmt(v) } },
    yAxis: { type: 'category', data: names, axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: c.text2, fontSize: 11, width: 180, overflow: 'truncate' } },
    tooltip: {
      ...baseOpt(c).tooltip,
      formatter: p => { const d = DATA.summary.disaster_affected[p[0].name]; return `<b>${p[0].name}</b><br/>Total: ${fmt(d.Total_Affected)}<br/>Worst year: ${fmt(d.Max_Affected)}<br/>Rank: #${d.Impact_Rank}`; }
    },
    series: [{
      type: 'bar', barMaxWidth: 18,
      data: totals.map((v, i) => ({ value: v, itemStyle: rankedBarItemStyle(c, names[i], i, focusIdx, 0) })),
      emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.18)' } },
      label: { show: true, position: 'right', formatter: p => fmt(p.value), color: c.text3, fontSize: 10 },
      animationDelay: idx => idx * 40
    }]
  });

  attachBarFocus(chart, 'affectedChart', renderAffectedChart);

  const calloutEl = document.getElementById('affectedCallout');
  if (focusIdx !== null && names[focusIdx]) {
    calloutEl.innerHTML = affectedCalloutText(names[focusIdx], totals[focusIdx], totalAll);
    calloutEl.classList.add('show');
  } else { calloutEl.classList.remove('show'); }

  setCountUp(document.getElementById('in-total-affected'), totalAll, v => fmt(v, 0));
}

// "Ada apa di tahun X?" — total Pasifik per tahun, tahun terparah disorot.
// Rentang tahun dibuat KONTINU (tidak melompati tahun yang nol) agar pembaca
// tahu pasti tahun mana yang memang tidak tercatat datanya.
function renderAffectedTimeline() {
  const c = colors();
  const chart = getChart('affectedTimelineChart');
  if (!chart) return;

  const yearly = {};
  Object.values(DATA.main.disaster_affected).forEach(countryData => {
    Object.entries(countryData).forEach(([y, v]) => { yearly[y] = (yearly[y] || 0) + v; });
  });
  const allYears = Object.keys(yearly).map(Number);
  const fullRange = continuousYearRange(allYears);
  const recentYears = fullRange.slice(-10);
  const vals = recentYears.map(y => yearly[y] || 0);
  const peakIdx = vals.indexOf(Math.max(...vals));
  const peakYear = recentYears[peakIdx];

  chart.setOption({
    ...baseOpt(c),
    animationDurationUpdate: 450,
    grid: { left: 60, right: 20, top: 26, bottom: 48 },
    xAxis: { type: 'category', data: recentYears.map(String), ...axisDefaults(c), axisLabel: { color: c.text2, fontSize: 11 } },
    yAxis: { type: 'value', ...axisDefaults(c), axisLine: { show: false }, name: 'People Affected', nameLocation: 'end', nameGap: 10, nameTextStyle: { color: c.text2, fontSize: 11, fontWeight: 500 }, axisLabel: { color: c.text2, fontSize: 11, formatter: v => fmt(v) } },
    tooltip: { ...baseOpt(c).tooltip, formatter: p => `<b>${p[0].name}</b><br/>${fmt(p[0].value)} people affected, Pacific-wide` },
    series: [{
      type: 'bar', barMaxWidth: 30,
      data: vals.map((v, i) => ({
        value: v,
        itemStyle: { color: i === peakIdx ? c.accent2 : c.accent, opacity: i === peakIdx ? 1 : (v === 0 ? 0.15 : 0.5), borderRadius: [4, 4, 0, 0] }
      })),
      label: { show: true, position: 'top', fontSize: 10, color: c.text3, formatter: p => p.value > 0 ? fmt(p.value) : '' },
      animationDelay: idx => idx * 55
    }]
  });

  const contribs = Object.entries(DATA.main.disaster_affected)
    .filter(([, yrs]) => yrs[String(peakYear)])
    .map(([country, yrs]) => [country, yrs[String(peakYear)]])
    .sort((a, b) => b[1] - a[1]);
  const top = contribs[0];

  const calloutEl = document.getElementById('timelineCallout');
  if (calloutEl && top) {
    calloutEl.innerHTML = `What happened in <strong>${peakYear}</strong>? This was the worst year in the past decade, with <strong>${fmt(vals[peakIdx])}</strong> people affected across the Pacific. <strong>${top[0]}</strong> alone accounted for <strong>${fmt(top[1])}</strong> of those — coinciding with a spike in sea surface temperature anomalies over the same period, as shown in Chapter 2.`;
    calloutEl.classList.add('show');
  }
}

// PERBAIKAN: sebelumnya sumbu tahun hanya memuat tahun yang punya nilai > 0,
// sehingga tahun 2013, 2015, 2017 misalnya "hilang" begitu saja dan grafik
// terlihat melompat-lompat. Sekarang rentang tahun dibuat penuh dan kontinu,
// dengan batang setinggi nol untuk tahun yang memang tidak tercatat kerugiannya.
function renderEconLossChart() {
  const c = colors();
  const chart = getChart('econLossChart');
  if (!chart) return;

  const countries = Object.entries(DATA.summary.economic_loss || {})
    .filter(([, v]) => (v.Total_Loss || 0) > 1e6)
    .sort(([, a], [, b]) => (b.Total_Loss || 0) - (a.Total_Loss || 0))
    .slice(0, 6).map(e => e[0]);

  const allYearsRaw = countries.flatMap(c2 => yearsOf(seriesFor('economic_loss', c2) || {}));
  const allYears = continuousYearRange(allYearsRaw);
  const focus = soloFocus.econLossChart;

  const series = countries.map((country) => {
    const raw = seriesFor('economic_loss', country) || {};
    const dim = focus && focus !== country;
    const col = colorFor(country);
    return { name: country, type: 'bar', stack: 'total',
      data: allYears.map(y => raw[y] ? raw[y] / 1e6 : 0),
      itemStyle: { color: col, opacity: dim ? 0.15 : 1 } };
  });

  chart.setOption({
    ...baseOpt(c),
    animationDurationUpdate: 450,
    grid: { left: 60, right: 20, top: 16, bottom: 40 },
    xAxis: { type: 'category', data: allYears.map(String), ...axisDefaults(c), axisLabel: { color: c.text2, fontSize: 11 } },
    yAxis: { type: 'value', ...axisDefaults(c), axisLine: { show: false }, name: 'USD (millions)', nameLocation: 'end', nameGap: 10, nameTextStyle: { color: c.text2, fontSize: 11, fontWeight: 500 }, axisLabel: { color: c.text2, fontSize: 11, formatter: v => '$' + v.toFixed(0) + 'M' } },
    tooltip: {
      ...baseOpt(c).tooltip,
      formatter: params => { let s = `<b>Year ${params[0].axisValue}</b><br/>`; params.forEach(p => { if (p.value > 0) s += `<span style="color:${p.color}">●</span> ${p.seriesName}: $${p.value.toFixed(1)}M<br/>`; }); return s || `<b>Year ${params[0].axisValue}</b><br/>No recorded losses`; }
    },
    series
  });

  buildChips('econLegend', countries,
    name => soloFocus.econLossChart === name,
    (name) => { soloFocus.econLossChart = soloFocus.econLossChart === name ? null : name; renderEconLossChart(); }
  );
}

// ════════════════════════════════════════════════════════════════════
//  BAB 4 — JANGKA PANJANG
// ════════════════════════════════════════════════════════════════════
function renderCropLivestockMetrics() {
  const c = colors();
  const fijiSum = summaryFor('crop_yield', 'Fiji');
  if (fijiSum) setCountUp(document.getElementById('mc-crop'), fijiSum.Latest_Yield, v => fmt(v));
  const fijiSeries = seriesFor('crop_yield', 'Fiji');
  if (fijiSeries) makeSpark('cropSparkChart', fijiSeries, colorFor('Fiji'));

  const liveSum = summaryFor('livestock_yield', 'Fiji');
  if (liveSum) setCountUp(document.getElementById('mc-live'), liveSum.Latest_Yield, v => fmt(v));
  const liveSeries = seriesFor('livestock_yield', 'Fiji');
  if (liveSeries) makeSpark('liveSparkChart', liveSeries, '#e07820');
}

function renderWaterMetricCard() {
  const entries = Object.entries(DATA.summary.water)
    .filter(([, v]) => typeof v.Latest_Access === 'number')
    .sort(([, a], [, b]) => a.Latest_Access - b.Latest_Access);
  const lowest = entries[0];
  if (!lowest) return;
  setCountUp(document.getElementById('mc-water'), lowest[1].Latest_Access, v => v.toFixed(1) + '%');
  const lowestSeries = seriesFor('water', lowest[0]) || {};
  makeSpark('waterSparkChart', lowestSeries, colorFor(lowest[0]));
}

function renderWaterBarChart() {
  const c = colors();
  const chart = getChart('waterBarChart');
  if (!chart) return;

  const entries = Object.entries(DATA.summary.water)
    .filter(([, v]) => typeof v.Latest_Access === 'number')
    .sort(([, a], [, b]) => b.Latest_Access - a.Latest_Access);
  const names = entries.map(e => e[0]);
  const vals = entries.map(e => e[1].Latest_Access);
  const focusIdx = barFocus.waterBarChart;

  chart.setOption({
    ...baseOpt(c),
    animationDurationUpdate: 450,
    grid: { left: 210, right: 70, top: 10, bottom: 30 },
    xAxis: { type: 'value', min: 0, max: 100, ...axisDefaults(c), axisLine: { show: false }, name: '% Population with Access', nameLocation: 'middle', nameGap: 24, nameTextStyle: { color: c.text2, fontSize: 11, fontWeight: 500 }, axisLabel: { color: c.text2, fontSize: 11, formatter: v => v + '%' } },
    yAxis: { type: 'category', data: names, axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: c.text2, fontSize: 11, width: 195, overflow: 'truncate' } },
    tooltip: { ...baseOpt(c).tooltip, formatter: p => `<b>${p[0].name}</b><br/>Safe water access: ${p[0].value.toFixed(2)}%` },
    series: [{
      type: 'bar', barMaxWidth: 16,
      data: vals.map((v, i) => ({ value: v, itemStyle: rankedBarItemStyle(c, names[i], i, focusIdx, names.length - 1) })),
      emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.18)' } },
      label: { show: true, position: 'right', formatter: p => p.value.toFixed(1) + '%', color: c.text3, fontSize: 10 },
      animationDelay: idx => idx * 35
    }]
  });

  attachBarFocus(chart, 'waterBarChart', renderWaterBarChart);

  const calloutEl = document.getElementById('waterCallout');
  if (focusIdx !== null && names[focusIdx]) {
    const isLow = vals[focusIdx] < 70;
    calloutEl.innerHTML = waterCalloutText(names[focusIdx], vals[focusIdx], isLow);
    calloutEl.classList.toggle('danger', isLow);
    calloutEl.classList.add('show');
  } else { calloutEl.classList.remove('show'); }
}

function renderCropLineChart() {
  const list = allCountries('crop_yield');
  const focusList = ['Papua New Guinea', 'Solomon Islands', 'Samoa', 'Fiji', 'Kiribati'].filter(f => list.includes(f));
  renderFocusableLineChart({ chartId: 'cropLineChart', legendId: 'cropLegend', group: 'crop_yield', countries: focusList, xMin: 1961, xMax: 2022, yName: 'kg / ha', yFormatter: v => v >= 1000 ? (v / 1000).toFixed(0) + 'K' : v });
}

// ════════════════════════════════════════════════════════════════════
//  BAB 5 — PARADOKS PASIFIK (SCROLLYTELLING + KLIK-FOKUS)
// ════════════════════════════════════════════════════════════════════
function buildParadoxData() {
  const ghgList = DATA.summary.ghg;
  const affList = DATA.summary.disaster_affected;
  const common = Object.keys(ghgList).filter(c => affList[c] && affList[c].Total_Affected > 0);
  const data = common.map(country => ({ name: country, ghg: ghgList[country].Latest_Emission, affected: affList[country].Total_Affected }))
    .filter(d => typeof d.ghg === 'number' && d.ghg < 15);
  const sortedAffected = [...data].sort((a, b) => b.affected - a.affected);
  const impactThreshold = sortedAffected[Math.min(3, sortedAffected.length - 1)].affected * 0.55;
  const emitThreshold = 1.5;
  const maxGhg = Math.max(...data.map(d => d.ghg));
  const maxAffected = Math.max(...data.map(d => d.affected));
  return { data, impactThreshold, emitThreshold, maxGhg, maxAffected };
}

function renderParadoxScatter() {
  const chart = getChart('paradoxScatter');
  if (!chart) return;
  if (!paradoxCache) paradoxCache = buildParadoxData();

  chart.off('click');
  chart.getZr().off('click');
  chart.on('click', (params) => {
    if (params.componentType !== 'series') return;
    paradoxManualFocus = (paradoxManualFocus === params.name) ? null : params.name;
    drawParadox(currentScrollyStep, paradoxManualFocus);
  });
  chart.getZr().on('click', (e) => {
    if (!e.target) { paradoxManualFocus = null; drawParadox(currentScrollyStep, null); }
  });

  drawParadox(currentScrollyStep, paradoxManualFocus);
}

function drawParadox(step, manualFocus) {
  const c = colors();
  const chart = charts['paradoxScatter'];
  if (!chart || !paradoxCache) return;
  const { data, impactThreshold, emitThreshold, maxGhg, maxAffected } = paradoxCache;
  const lowEmitSet = new Set(data.filter(d => d.ghg < emitThreshold).map(d => d.name));
  const highImpactSet = new Set(data.filter(d => d.affected > impactThreshold).map(d => d.name));

  const showZone = step >= 3 || !!manualFocus;
  const yMax = Math.ceil((maxAffected / 1000) * 1.32 / 100) * 100;
  const xMax = Math.ceil(maxGhg * 1.22 * 10) / 10;

  const symbolData = data.map(d => {
    let fillColor = c.text3, opacity = 0.7, z = 1;
    if (manualFocus) {
      const isFocus = d.name === manualFocus;
      const both = lowEmitSet.has(d.name) && highImpactSet.has(d.name);
      opacity = isFocus ? 0.95 : 0.10;
      fillColor = isFocus ? (both ? c.accent2 : (lowEmitSet.has(d.name) ? c.accent3 : c.accent)) : c.text3;
      z = isFocus ? 10 : 1;
    } else if (step === 1) {
      const inSet = lowEmitSet.has(d.name);
      fillColor = inSet ? c.accent3 : c.text3; opacity = inSet ? 0.95 : 0.15; z = inSet ? 5 : 1;
    } else if (step === 2) {
      const inSet = highImpactSet.has(d.name);
      fillColor = inSet ? c.accent2 : c.text3; opacity = inSet ? 0.95 : 0.15; z = inSet ? 5 : 1;
    } else if (step >= 3) {
      const both = lowEmitSet.has(d.name) && highImpactSet.has(d.name);
      const either = lowEmitSet.has(d.name) || highImpactSet.has(d.name);
      fillColor = both ? c.accent2 : (either ? c.accent : c.text3);
      opacity = both ? 0.95 : (either ? 0.55 : 0.12);
      z = both ? 10 : (either ? 4 : 1);
    }
    const nearTop = (d.affected / 1000) > yMax * 0.78;
    return {
      name: d.name, value: [d.ghg, d.affected / 1000],
      symbolSize: 12 + Math.sqrt(d.affected / maxAffected) * 34,
      itemStyle: { color: fillColor, opacity }, z,
      label: { show: opacity > 0.4, position: nearTop ? 'bottom' : 'top', fontSize: 9, color: c.text2, formatter: d.name }
    };
  });

  chart.setOption({
    backgroundColor: 'transparent',
    animationDurationUpdate: 600,
    grid: { left: 68, right: 36, top: 64, bottom: 56 },
    xAxis: {
      type: 'value', max: xMax, name: 'Emissions per Capita (tons CO₂e)', nameLocation: 'middle', nameGap: 32,
      nameTextStyle: { color: c.text2, fontSize: 12, fontWeight: 500 }, ...axisDefaults(c), axisLine: { show: false },
      axisLabel: { color: c.text2, fontSize: 11 }
    },
    yAxis: {
      type: 'value', max: yMax, name: 'People Affected (thousands)', nameLocation: 'middle', nameGap: 58,
      nameTextStyle: { color: c.text2, fontSize: 12, fontWeight: 500 }, ...axisDefaults(c), axisLine: { show: false },
      axisLabel: { color: c.text2, fontSize: 11, formatter: v => v + 'K' }
    },
    tooltip: {
      backgroundColor: c.surface, borderColor: c.border, textStyle: { color: c.text1, fontSize: 12 },
      formatter: p => { const d = data.find(x => x.name === p.name); return `<b>${p.name}</b><br/>Emissions: ${d.ghg.toFixed(2)} tons CO₂e<br/>People affected: ${fmt(d.affected)}`; }
    },
    series: [{
      type: 'scatter', data: symbolData,
      markArea: showZone ? {
        silent: true,
        itemStyle: { color: 'rgba(201,64,48,0.07)', borderColor: 'rgba(201,64,48,0.3)', borderWidth: 1, borderType: 'dashed' },
        label: { show: true, position: 'insideTopLeft', formatter: 'Paradox Zone', color: c.accent2, fontSize: 10, fontWeight: 600 },
        data: [[{ xAxis: 0, yAxis: impactThreshold / 1000 }, { xAxis: emitThreshold, yAxis: 'max' }]]
      } : { data: [] }
    }]
  });

  const titleEl = document.getElementById('scrollyChartTitle');
  const noteEl = document.getElementById('scrollyNote');
  if (manualFocus) {
    const d = data.find(x => x.name === manualFocus);
    if (titleEl) titleEl.textContent = manualFocus;
    if (noteEl) noteEl.innerHTML = paradoxClickText(d.name, d.ghg, d.affected);
  } else {
    const titles = ['Twelve Nations, Mapped', 'Twelve Nations, Mapped', 'Who Barely Contributes', 'Who Suffers Most', 'The Paradox Zone', 'The Pacific Paradox'];
    if (titleEl) titleEl.textContent = titles[step + 1] || titles[0];
    if (noteEl) noteEl.textContent = 'Each circle represents one Pacific nation. Circle size reflects the number of people affected by disasters.';
  }
}

function setScrollyStep(idx) {
  currentScrollyStep = idx;
  if (!charts['paradoxScatter']) renderParadoxScatter();
  drawParadox(idx, paradoxManualFocus);
}

function initScrolly() {
  const steps = document.querySelectorAll('.scrolly-step');
  if (!steps.length || steps[0]._wired) return;
  const dots = document.getElementById('scrollyProgress');
  if (dots) { dots.innerHTML = ''; steps.forEach(() => dots.appendChild(document.createElement('span'))); }

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const idx = parseInt(entry.target.dataset.step, 10);
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        setScrollyStep(idx);
        document.querySelectorAll('.scrolly-progress span').forEach((s, i) => s.classList.toggle('active', i <= idx));
      } else {
        entry.target.classList.remove('active');
      }
    });
  }, { threshold: 0.5, rootMargin: '-15% 0px -15% 0px' });

  steps.forEach(s => { s._wired = true; obs.observe(s); });
}

function renderKPIs() {
  const sstHigh = Object.values(DATA.summary.sst).filter(d => typeof d.Latest_SST === 'number' && d.Latest_SST > 0.5).length;
  const sstTotal = Object.keys(DATA.summary.sst).length;
  const k1 = document.querySelector('#kpi1 .kpi-val');
  if (k1) k1.textContent = `${sstHigh}/${sstTotal}`;

  const ghgVals = Object.values(DATA.summary.ghg).map(d => d.Latest_Emission).filter(v => typeof v === 'number' && v < 10);
  const avg = ghgVals.reduce((a, b) => a + b, 0) / ghgVals.length;
  setCountUp(document.querySelector('#kpi2 .kpi-val'), avg, v => v.toFixed(2));

  const total = Object.values(DATA.summary.disaster_affected).reduce((a, b) => a + (b.Total_Affected || 0), 0);
  setCountUp(document.querySelector('#kpi3 .kpi-val'), total, v => fmt(v));

  const highest = Math.max(...Object.values(DATA.summary.disaster_affected).map(d => d.Max_Affected || 0));
  setCountUp(document.querySelector('#kpi4 .kpi-val'), highest, v => fmt(v));
}

// ════════════════════════════════════════════════════════════════════
//  PEMICU SAAT SCROLL (per elemen, muncul tepat saat tiba di tampilan)
// ════════════════════════════════════════════════════════════════════
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('in'); revealObserver.unobserve(entry.target); }
  });
}, { threshold: 0.15, rootMargin: '0px 0px -30px 0px' });

function initReveals() {
  document.querySelectorAll(
    '.reveal, .evidence-grid .ev-card, .three-col .metric-card, .kpi-row .kpi-box, .recap-grid .recap-card'
  ).forEach(el => revealObserver.observe(el));
}

const firedCharts = new Set();
const chartFns = {};
const chartObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.id;
      firedCharts.add(id);
      (chartFns[id] || []).forEach(fn => { try { fn(); } catch (e) { console.error('Render error in', id, e); } });
      chartObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.2, rootMargin: '0px 0px -30px 0px' });

function registerChart(id, fns) {
  chartFns[id] = Array.isArray(fns) ? fns : [fns];
  const el = document.getElementById(id);
  if (el) chartObserver.observe(el);
}

function initChartTriggers() {
  registerChart('ghgBarChart', renderGHGBar);
  registerChart('ghgLineChart', [renderGHGCountrySelector, renderGHGLine]);
  registerChart('evidenceGrid', renderEvidenceCards);
  registerChart('sstLineChart', renderSSTLineChart);
  registerChart('seaLevelChart', renderSeaLevelChart);
  registerChart('affectedChart', renderAffectedChart);
  registerChart('affectedTimelineChart', renderAffectedTimeline);
  registerChart('econLossChart', renderEconLossChart);
  registerChart('lifeMetricsRow', [renderCropLivestockMetrics, renderWaterMetricCard]);
  registerChart('waterBarChart', renderWaterBarChart);
  registerChart('cropLineChart', renderCropLineChart);
  registerChart('paradoxScatter', [renderParadoxScatter, initScrolly]);
  registerChart('kpiRow', renderKPIs);
}

// ── SOROTAN TINGKAT HALAMAN: klik chart/kartu, redupkan tetangganya ───
function initSpotlight() {
  const groups = document.querySelectorAll('.section-row, .evidence-grid, .three-col, .kpi-row');
  groups.forEach(group => {
    const items = Array.from(group.children);
    if (items.length < 2) return;
    group.addEventListener('click', (e) => {
      const item = items.find(it => it.contains(e.target));
      if (!item) return;
      const already = item.classList.contains('is-focused');
      items.forEach(it => it.classList.remove('is-focused', 'is-faded'));
      if (!already) {
        item.classList.add('is-focused');
        items.filter(it => it !== item).forEach(it => it.classList.add('is-faded'));
      }
    });
  });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.section-row, .evidence-grid, .three-col, .kpi-row')) {
      document.querySelectorAll('.is-focused, .is-faded').forEach(el => el.classList.remove('is-focused', 'is-faded'));
    }
  });
}

// ── BILAH PROGRES SCROLL ────────────────────────────────────────────────
function initScrollProgress() {
  const bar = document.getElementById('scrollProgressBar');
  if (!bar) return;
  function update() {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    bar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + '%';
  }
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(() => { update(); ticking = false; }); ticking = true; }
  }, { passive: true });
  update();
}

// ── NAV AKTIF SAAT SCROLL (teknik pita tengah, akurat untuk section tinggi) ──
function initNavScroll() {
  const ids = ['cover', 'cause', 'evidence', 'human', 'life', 'story', 'conclusion'];
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        document.querySelectorAll('.nav-ch').forEach(ch => ch.classList.remove('active'));
        const link = document.querySelector(`.nav-ch[href="#${entry.target.id}"]`);
        if (link) link.classList.add('active');
      }
    });
  }, { threshold: 0, rootMargin: '-45% 0px -45% 0px' });
  ids.forEach(id => { const el = document.getElementById(id); if (el) observer.observe(el); });
}

// ── RESIZE ──────────────────────────────────────────────────────────────
window.addEventListener('resize', () => { Object.values(charts).forEach(ch => ch.resize()); });

// ── TOMBOL SCROLL ───────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const arrow = document.getElementById('scrollArrow');
  if (arrow) arrow.addEventListener('click', () => document.getElementById('cause')?.scrollIntoView({ behavior: 'smooth' }));
});

// ── INIT ────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  initNavScroll();
  initScrollProgress();
  initSpotlight();
  initReveals();
  try {
    await loadData();
    buildCountryColorMap();
    renderCover();
    initChartTriggers();
  } catch (err) {
    console.error('Failed to load Pacific data:', err);
    document.querySelector('.cover-content')?.insertAdjacentHTML('beforeend',
      '<p style="color:#c94030;margin-top:24px;">Failed to load data/pacific_data.json. Make sure the file exists in the same folder, and that this page is served via a local server rather than opened directly (double-click).</p>');
  }
});
