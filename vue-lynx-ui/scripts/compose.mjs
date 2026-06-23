import { chromium } from 'playwright';
import { readFileSync } from 'fs';
const [leftImg, rightImg, leftLabel, rightLabel, title, out] = process.argv.slice(2);
const b64 = p => 'data:image/png;base64,' + readFileSync(p).toString('base64');
const html = `<!doctype html><html><head><style>
  * { margin:0; box-sizing:border-box; }
  body { background:#16181d; font-family: -apple-system, Segoe UI, Roboto, sans-serif; padding:24px; }
  h1 { color:#e6e6e6; font-size:20px; text-align:center; margin-bottom:4px; font-weight:600; }
  .sub { color:#8a8f98; font-size:13px; text-align:center; margin-bottom:18px; }
  .row { display:flex; gap:20px; justify-content:center; }
  .col { display:flex; flex-direction:column; align-items:center; gap:10px; }
  .frame { width:300px; border-radius:14px; overflow:hidden; border:1px solid #2a2e37; box-shadow:0 8px 30px rgba(0,0,0,.4); }
  .frame img { width:300px; display:block; }
  .tag { color:#cdd2da; font-size:13px; font-weight:600; letter-spacing:.3px; }
  .tag span { color:#7d828c; font-weight:400; }
</style></head><body>
  <h1>${title}</h1>
  <div class="sub">Lynx-for-Web · headless Chromium · identical viewport (420×820 @2x)</div>
  <div class="row">
    <div class="col"><div class="tag">${leftLabel}</div><div class="frame"><img src="${b64(leftImg)}"/></div></div>
    <div class="col"><div class="tag">${rightLabel}</div><div class="frame"><img src="${b64(rightImg)}"/></div></div>
  </div>
</body></html>`;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 700, height: 760 }, deviceScaleFactor: 2 });
await page.setContent(html, { waitUntil:'load' });
await page.waitForTimeout(300);
const el = await page.$('body');
await el.screenshot({ path: out });
await browser.close();
console.log('wrote '+out);
