import { chromium } from 'playwright';
const [url, outIdle, outActive, label] = process.argv.slice(2);
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 420, height: 820 }, deviceScaleFactor: 2, hasTouch: true });
const page = await ctx.newPage();
const logs = [];
page.on('console', m => { const t=m.text(); if(t.includes('clicked')) logs.push(t); });
await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(2500);
// idle screenshot
await page.screenshot({ path: outIdle });
// locate first .button (the render-prop button visual). Playwright pierces open shadow DOM.
const btn = page.locator('.button').first();
const box = await btn.boundingBox();
if (!box) { console.log(label+': NO BUTTON BOX'); await browser.close(); process.exit(1); }
const cx = box.x + box.width/2, cy = box.y + box.height/2;
// press and hold using touchscreen-like input via mouse down (pointer events)
await page.mouse.move(cx, cy);
await page.mouse.down();
await page.waitForTimeout(400);
await page.screenshot({ path: outActive });
await page.mouse.up();
await page.waitForTimeout(300);
// read computed bg of the held element to confirm active color
const bg = await btn.evaluate(el => getComputedStyle(el).backgroundColor);
// full tap to trigger click
await page.mouse.click(cx, cy);
await page.waitForTimeout(300);
console.log(JSON.stringify({ label, box, activeBg: bg, clickedLogs: logs }, null, 2));
await browser.close();
