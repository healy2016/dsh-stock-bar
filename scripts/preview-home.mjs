/**
 * 本地渲染预览：把 lib/client.js 里的 CSS 抽出来，拼一份和首页相同的 DOM 结构，
 * 用无头 Chrome 截图，方便肉眼核对间距/遮挡这类纯样式问题（不需要启动 DSH）。
 *
 * 用法：node scripts/preview-home.mjs [输出png] [宽度] [shell]
 *   shell: none（默认，裸内容）| side（持仓看板整页）| bar（顶栏展开面板）
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const clientPath = path.join(root, 'lib', 'client.js');
const out = process.argv[2] || path.join(root, '.preview-home.png');
const width = Number(process.argv[3]) || 900;
const shell = process.argv[4] || 'none';
/** --mask：把金额渲染成隐藏态，用来核对星号排版 */
const masked = process.argv.includes('--mask');
const M = (v) => (masked ? '****' : v);

const src = readFileSync(clientPath, 'utf8');
const startTag = 'const CSS = `';
const start = src.indexOf(startTag);
const end = start >= 0 ? src.indexOf('\n`;', start) : -1;
if (start < 0 || end < 0) throw new Error('没能从 client.js 里抽出 CSS');
const css = src.slice(start + startTag.length, end);

const idxCard = (name, price, chg, pct, dir) => `
  <div class="dst-idx"><div class="dst-idx-name">${name}</div>
    <div class="dst-idx-price">${price}</div>
    <div class="dst-idx-chg ${dir}">${chg} ${pct}</div></div>`;

const stack = `
<div class="dst-home-stack">
  <div class="dst-fade-in"><div class="dst-sum-card">
    <button class="dst-eye" type="button" aria-pressed="${masked ? "true" : "false"}"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M2.2 12S5.8 5.6 12 5.6 21.8 12 21.8 12 18.2 18.4 12 18.4 2.2 12 2.2 12z"/><circle cx="12" cy="12" r="2.5"/>${masked ? '<path d="M3.6 20.4 20.4 3.6"/>' : ''}</svg></button>
    <div class="dst-sum-grid">
      <div class="dst-metric"><span class="dst-metric-k">总资产</span><span class="dst-metric-v dst-big">${M("¥27.89万")}</span><span class="dst-metric-s">现金 ¥6.20万 + 持仓市值</span></div>
      <div class="dst-metric"><span class="dst-metric-k">总投入</span><span class="dst-metric-v">${M("¥23.44万")}</span><span class="dst-metric-s">现金 + 持仓成本</span></div>
      <div class="dst-metric"><span class="dst-metric-k">持仓市值</span><span class="dst-metric-v">${M("¥18.88万")}</span><span class="dst-metric-s">2 只持仓</span></div>
      <div class="dst-metric"><span class="dst-metric-k">持仓成本</span><span class="dst-metric-v">${M("¥17.24万")}</span><span class="dst-metric-s">股数 × 成本价</span></div>
      <div class="dst-metric"><span class="dst-metric-k">浮动盈亏</span><span class="dst-metric-v ${masked ? "" : "dst-up"}">${M("+1.64万 (+9.53%)")}</span><span class="dst-metric-s">市值 − 成本</span></div>
      <div class="dst-metric"><span class="dst-metric-k">当日盈亏</span><span class="dst-metric-v ${masked ? "" : "dst-down"}">${M("-120.50 (-0.06%)")}</span><span class="dst-metric-s">按昨收计算</span></div>
    </div>
    <div class="dst-cash">
      <div class="dst-donut" style="background:${masked ? "rgba(0,0,0,.06)" : "conic-gradient(#4f7cff 0% 80%, #2fd08a 80% 100%)"}">
        <div class="dst-donut-center"><span class="dst-donut-k">总现金</span><span class="dst-donut-v">${M("¥6.20万")}</span></div>
      </div>
      <div class="dst-legend">
        <div class="dst-legend-row"><span class="dst-legend-dot" style="background:#4f7cff"></span><span class="dst-legend-name">A股主账户</span><span class="dst-legend-val">${M("¥5.00万 · 80.6%")}</span></div>
        <div class="dst-legend-row"><span class="dst-legend-dot" style="background:#2fd08a"></span><span class="dst-legend-name">港股账户</span><span class="dst-legend-val">${M("¥1.20万 · 19.4%")}</span></div>
      </div>
    </div>
  </div></div>

  <div class="dst-pair">
    <div class="dst-fade-in"><div class="dst-card">
      <div class="dst-card-head"><span class="dst-card-title">💰 分红记录</span><span class="dst-spacer"></span><button class="dst-btn">+ 记一笔</button></div>
      <div class="dst-card-big">¥2,500.00</div>
      <span class="dst-sub">共 2 笔 · 只做统计，不计入收益</span>
      <div class="dst-list">
        <div class="dst-list-row"><span class="dst-ell">贵州茅台</span><span class="dst-sub">2026-06-20</span><b>¥2,100.00</b></div>
        <div class="dst-list-row"><span class="dst-ell">平安银行</span><span class="dst-sub">2026-07-10</span><b>¥400.00</b></div>
      </div>
    </div></div>
    <div class="dst-fade-in"><div class="dst-card">
      <div class="dst-card-head"><span class="dst-card-title">🎯 未来 7 天打新</span><span class="dst-spacer"></span></div>
      <div class="dst-card-big">新股 1 只 · 新债 0 只</div>
      <span class="dst-sub">2026-11-09 ~ 2026-11-16（仅 A 股）</span>
      <div class="dst-list">
        <div class="dst-list-row"><span class="dst-tag">新股</span><span class="dst-ell">华晟智能</span><span class="dst-sub">2026-11-11</span><span class="dst-sub">¥23.52</span></div>
      </div>
    </div></div>
  </div>

  <div class="dst-fade-in">
    <div class="dst-sec">大盘指数</div>
    <div class="dst-idx-grid">
      ${idxCard('上证指数', '3,660.79', '+11.61', '+0.32%', 'dst-up')}
      ${idxCard('深证成指', '11,145.49', '-30.29', '-0.27%', 'dst-down')}
      ${idxCard('科创50', '1,261.95', '+6.95', '+0.55%', 'dst-up')}
      ${idxCard('沪深300', '4,064.17', '-11.83', '-0.29%', 'dst-down')}
      ${idxCard('北证50', '902.83', '-12.37', '-1.35%', 'dst-down')}
      ${idxCard('恒生科技', '4,081.03', '+27.03', '+0.67%', 'dst-up')}
      ${idxCard('纳斯达克', '24,579.42', '+264.42', '+1.09%', 'dst-up')}
      ${idxCard('标普500', '7,376.86', '+22.86', '+0.31%', 'dst-up')}
    </div>
    <div class="dst-note">点击任意指数卡片看走势，再点一次收起。</div>
  </div>
</div>`;

const rail = ['首页', '持仓', '自选', '添加', '流水', '预警', '分析', '设置']
  .map((t, i) => `<button class="dst-rail-item ${i === 0 ? 'dst-on' : ''}"><span class="dst-rail-ico">•</span><span>${t}</span></button>`)
  .join('');

let body;
if (shell === 'side') {
  body = `<div class="dst-side dst-theme" style="height:660px">
    <nav class="dst-rail">${rail}</nav>
    <div class="dst-main">
      <div class="dst-side-head">
        <span class="dst-side-title">📈 持仓看板</span>
        <span class="dst-session">交易中 10:23</span>
        <span class="dst-spacer"></span>
        <button class="dst-btn">⟳</button>
      </div>
      <div class="dst-body dst-side-body">${stack}</div>
    </div>
  </div>`;
} else if (shell === 'bar') {
  body = `<div class="dst-root dst-theme" style="top:0">
    <div class="dst-bar">
      <div class="dst-brand"><span>📈</span><span>行情</span><span class="dst-dot dst-live"></span></div>
      <span class="dst-session">交易中 10:23</span>
      <span class="dst-flat">加载行情中…</span>
      <span class="dst-spacer"></span>
    </div>
    <div class="dst-panel" style="position:relative;left:0;right:0;top:0">
      <div class="dst-tabs">
        <button class="dst-tab dst-on">首页</button><button class="dst-tab">持仓</button>
        <button class="dst-tab">自选</button><button class="dst-tab">添加</button>
        <span class="dst-spacer"></span><button class="dst-btn">收起</button>
      </div>
      <div class="dst-body" style="max-height:520px">${stack}</div>
    </div>
  </div>`;
} else {
  body = `<div class="dst-theme">${stack}</div>`;
}

const html = `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8">
<style>
  body{margin:0;padding:12px;background:#f6f7f9;font-family:system-ui,"Microsoft YaHei",sans-serif}
  .dst-theme{--dst-up:#e5484d;--dst-down:#0f9d6e;--dst-flat:#8b949e;
    --dst-bg:#fff;--dst-fg:#1f2328;--dst-dim:#8b949e;--dst-border:rgba(0,0,0,.12);
    --dst-hover:rgba(0,0,0,.05);--dst-sel:rgba(0,0,0,.08)}
${css}
  /* 截图时把入场动画和骨架停掉，否则会拍到淡入中间帧，看不出真实间距 */
  .dst-skel,.dst-fade-in{animation:none!important}
  .dst-fade-in{opacity:1!important;transform:none!important}
</style></head>
<body>${body}
<script>
  (() => {
    const rect = (el) => {
      if (!el) return null;
      const b = el.getBoundingClientRect();
      return { top: +b.top.toFixed(1), bottom: +b.bottom.toFixed(1), height: +b.height.toFixed(1) };
    };
    const sec = document.querySelector('.dst-sec');
    const grid = document.querySelector('.dst-idx-grid');
    const scroller = document.querySelector('.dst-body') || document.documentElement;
    const cs = sec ? getComputedStyle(sec) : null;
    const sb = sec ? sec.getBoundingClientRect() : null;
    const cb = scroller.getBoundingClientRect();
    document.title = JSON.stringify({
      sec: rect(sec),
      grid: rect(grid),
      scroller: { top: +cb.top.toFixed(1), height: +cb.height.toFixed(1), scrollHeight: scroller.scrollHeight },
      // grid 顶边比 sec 底边高多少 = 重叠像素（负数说明有重叠）
      gapSecToGrid: sb && grid ? +(grid.getBoundingClientRect().top - sb.bottom).toFixed(1) : null,
      // 正数说明 sec 已被滚出容器上沿，会被裁掉
      clippedByTop: sb ? +(cb.top - sb.top).toFixed(1) : null,
      lineHeight: cs && cs.lineHeight,
      fontSize: cs && cs.fontSize,
      margin: cs && cs.margin,
    });
  })();
</script>
</body></html>`;

const dir = mkdtempSync(path.join(os.tmpdir(), 'stock-home-'));
const file = path.join(dir, 'home.html');
writeFileSync(file, html, 'utf8');

const chrome = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find((p) => existsSync(p));
if (!chrome) throw new Error('没找到 Chrome/Edge');

execFileSync(chrome, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars',
  `--screenshot=${out}`, `--window-size=${width},1200`,
  '--force-device-scale-factor=1',
  // 等动画跑完再截，否则会拍到 fade-in 的中间帧
  '--virtual-time-budget=1500',
  `file:///${file.replace(/\\/g, '/')}`,
], { stdio: 'pipe' });

// 再跑一次 dump-dom，把关键元素的几何量测出来（纯靠截图猜间距太容易看走眼）
const dom = execFileSync(chrome, [
  '--headless=new', '--disable-gpu',
  `--window-size=${width},1200`,
  '--virtual-time-budget=1500',
  '--dump-dom',
  `file:///${file.replace(/\\/g, '/')}`,
], { encoding: 'utf8' });
const mt = dom.match(/<title>([\s\S]*?)<\/title>/);
if (mt && mt[1].trim()) {
  try { console.log('MEASURE', JSON.stringify(JSON.parse(mt[1]))); } catch { console.log('MEASURE raw', mt[1]); }
}
console.log(out);
