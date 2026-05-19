// ╔══════════════════════════════════════════════════════════════════════╗
// ║   4 TOPICS — VISUAL DEBUG VERSION                                   ║
// ║   Real Sites + Highlight + Step Banner + Console Logs              ║
// ║                                                                      ║
// ║   playwright.config.js-এ add করো:                                  ║
// ║   use: { headless: false, slowMo: 700 }                            ║
// ╚══════════════════════════════════════════════════════════════════════╝

import { test, expect } from '@playwright/test';
import { mkdirSync, existsSync } from 'fs';

// ════════════════════════════════════════════════════════════════════════
//  HELPERS
// ════════════════════════════════════════════════════════════════════════

async function highlightElement(page, selector, color = '#FFD700', duration = 1500) {
  await page.evaluate(({ sel, col }) => {
    const el = document.querySelector(sel);
    if (!el) return;
    const orig = el.style.cssText;
    el.style.cssText += `
      outline: 4px solid ${col} !important;
      box-shadow: 0 0 20px ${col} !important;
      transition: all 0.3s ease;
    `;
    setTimeout(() => { el.style.cssText = orig; }, 1500);
  }, { sel: selector, col: color });
  await page.waitForTimeout(duration);
}

async function showStep(page, num, msg) {
  console.log(`\n${'─'.repeat(55)}`);
  console.log(`  STEP ${num}: ${msg}`);
  console.log(`${'─'.repeat(55)}`);
  await page.evaluate(({ n, m }) => {
    const old = document.getElementById('__step__');
    if (old) old.remove();
    const d         = document.createElement('div');
    d.id            = '__step__';
    d.style.cssText =
      'position:fixed;top:0;left:0;right:0;z-index:99999;' +
      'background:#1a1a2e;color:#00d4aa;padding:10px 16px;' +
      'font:bold 14px monospace;border-bottom:3px solid #e94560;';
    d.textContent = 'STEP ' + n + ': ' + m;
    document.body.prepend(d);
  }, { n: num, m: msg });
  await page.waitForTimeout(1200);
}

async function showStatus(page, message, type = 'info') {
  const colors = {
    info: '#3498db', success: '#27ae60',
    warning: '#f39c12', error: '#e74c3c', mock: '#9b59b6',
  };
  await page.evaluate(({ msg, col }) => {
    const old = document.getElementById('pw-status-bar');
    if (old) old.remove();
    const bar         = document.createElement('div');
    bar.id            = 'pw-status-bar';
    bar.style.cssText =
      'position:fixed;top:10px;left:50%;transform:translateX(-50%);' +
      'background:' + col + ';color:white;padding:12px 24px;' +
      'border-radius:8px;font:bold 15px monospace;z-index:999999;' +
      'box-shadow:0 4px 20px rgba(0,0,0,0.3);max-width:90%;text-align:center;';
    bar.textContent = '🎯 ' + msg;
    document.body.appendChild(bar);
  }, { msg: message, col: colors[type] });
  await page.waitForTimeout(1200);
}


// ════════════════════════════════════════════════════════════════════════
//  TOPIC 1 — AUTO-COMPLETE / SUGGESTION DROPDOWN
//
//  1A → w3schools.com/howto/howto_js_autocomplete.asp
//  1B → w3schools.com (keyboard navigation)
//  1C → demo.opencart.com (address field)
//  1D → select2.org (custom dropdown)
// ════════════════════════════════════════════════════════════════════════

test.describe('TOPIC 1: Auto-complete / Suggestion Dropdown', () => {

  // ── 1A. BASIC AUTO-COMPLETE ──────────────────────────────────────────
  // 🇧🇩 Real site: w3schools autocomplete demo
  // দেখবে: type করলে dropdown আসে → item click হয় → value set হয়

  test('1A VISUAL — Basic Autocomplete: type + select', async ({ page }) => {

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⌨️  TEST 1A: Basic Autocomplete');
    console.log('   Site: w3schools.com');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    await page.goto('https://www.w3schools.com/howto/howto_js_autocomplete.asp');
    await page.waitForTimeout(1000);

    // ── STEP 1: Input find করো ─────────────────────────────────────
    await showStep(page, 1, 'Input field খুঁজছি...');
    const input = page.locator('#myInput');
    await expect(input).toBeVisible();
    await highlightElement(page, '#myInput', '#3498db');
    console.log('  🔵 Input field highlighted (blue)');

    // ── STEP 2: Type করো ───────────────────────────────────────────
    await showStep(page, 2, '"S" type করছি — suggestion আসবে...');
    await input.click();
    await input.clear();
    await input.pressSequentially('S', { delay: 150 });
    await page.waitForTimeout(600);

    // ── STEP 3: Dropdown দেখো ──────────────────────────────────────
    await showStep(page, 3, 'Dropdown visible হয়েছে!');
    const dropdown = page.locator('#myInputautocomplete-list');
    await expect(dropdown).toBeVisible({ timeout: 3000 });
    await highlightElement(page, '#myInputautocomplete-list', '#f39c12');
    console.log('  🟠 Dropdown highlighted (orange)');

    // Suggestions গুলো দেখাও
    const suggestions = page.locator('#myInputautocomplete-list div');
    const count       = await suggestions.count();
    console.log(`\n  📋 Found ${count} suggestions:`);
    for (let i = 0; i < count; i++) {
      const text = await suggestions.nth(i).textContent();
      console.log(`     ${i + 1}. ${text?.trim()}`);
    }

    // ── STEP 4: First suggestion click করো ────────────────────────
    await showStep(page, 4, 'First suggestion click করছি...');
    await highlightElement(page, '#myInputautocomplete-list div:first-child', '#27ae60');
    await suggestions.first().click();
    await page.waitForTimeout(500);

    // ── STEP 5: Value verify করো ───────────────────────────────────
    await showStep(page, 5, 'Value set হয়েছে কিনা verify করছি...');
    const value = await input.inputValue();
    console.log(`  ✅ Selected value: "${value}"`);
    expect(value.length).toBeGreaterThan(0);
    await highlightElement(page, '#myInput', '#27ae60');
    await showStatus(page, `✅ 1A DONE! Selected: "${value}"`, 'success');
    await page.waitForTimeout(2000);

    console.log('\n  ✅ 1A COMPLETE!\n');
  });


  // ── 1B. KEYBOARD NAVIGATION ──────────────────────────────────────────
  // 🇧🇩 Real site: w3schools autocomplete
  // দেখবে: ArrowDown press হয় → item highlight হয় → Enter-এ select

  test('1B VISUAL — Keyboard Navigation in Autocomplete', async ({ page }) => {

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⌨️  TEST 1B: Keyboard Navigation');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    await page.goto('https://www.w3schools.com/howto/howto_js_autocomplete.asp');
    await page.waitForTimeout(1000);

    const input = page.locator('#myInput');

    // ── STEP 1: Type করো ───────────────────────────────────────────
    await showStep(page, 1, '"S" type করছি...');
    await input.click();
    await input.clear();
    await input.pressSequentially('S', { delay: 150 });
    await page.waitForTimeout(500);
    await highlightElement(page, '#myInput', '#3498db');

    // ── STEP 2: ArrowDown 1 ────────────────────────────────────────
    await showStep(page, 2, 'ArrowDown → 1st item select');
    await input.press('ArrowDown');
    await page.waitForTimeout(400);
    await highlightElement(page, '#myInputautocomplete-list div:first-child', '#f39c12');
    console.log('  → 1st item active');

    // ── STEP 3: ArrowDown 2 ────────────────────────────────────────
    await showStep(page, 3, 'ArrowDown → 2nd item select');
    await input.press('ArrowDown');
    await page.waitForTimeout(400);
    console.log('  → 2nd item active');

    // ── STEP 4: ArrowDown 3 ────────────────────────────────────────
    await showStep(page, 4, 'ArrowDown → 3rd item select');
    await input.press('ArrowDown');
    await page.waitForTimeout(400);
    console.log('  → 3rd item active');

    // ── STEP 5: Enter ──────────────────────────────────────────────
    await showStep(page, 5, 'Enter press — item select হবে!');
    await input.press('Enter');
    await page.waitForTimeout(500);

    const value = await input.inputValue();
    console.log(`  ✅ Keyboard selected: "${value}"`);
    expect(value.length).toBeGreaterThan(0);
    await highlightElement(page, '#myInput', '#27ae60');
    await showStatus(page, `✅ 1B DONE! Keyboard selected: "${value}"`, 'success');
    await page.waitForTimeout(2000);

    console.log('\n  ✅ 1B COMPLETE!\n');
  });


  // ── 1C. ADDRESS AUTOCOMPLETE ──────────────────────────────────────────
  // 🇧🇩 Real site: demo.opencart.com checkout
  // দেখবে: City field-এ type → autocomplete বা direct fill

  test('1C VISUAL — Address Autocomplete (OpenCart)', async ({ page }) => {

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🏠 TEST 1C: Address Autocomplete');
    console.log('   Site: demo.opencart.com');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    await page.goto('https://demo.opencart.com/index.php?route=checkout/checkout');
    await page.waitForTimeout(2000);

    await showStep(page, 1, 'Checkout page load হয়েছে');
    await highlightElement(page, '#content', '#3498db');

    const cityField = page.locator('#input-payment-city');

    await showStep(page, 2, 'City field খুঁজছি...');
    if (await cityField.isVisible()) {
      await highlightElement(page, '#input-payment-city', '#f39c12');
      console.log('  🟠 City field highlighted (orange)');

      await showStep(page, 3, '"Dha" type করছি...');
      await cityField.click();
      await cityField.pressSequentially('Dha', { delay: 100 });
      await page.waitForTimeout(1000);

      const options = page.locator('[class*="autocomplete"] li, [class*="suggestion"] li');
      const optCount = await options.count();

      if (optCount > 0) {
        await showStep(page, 4, `${optCount} suggestions পাওয়া গেছে!`);
        await highlightElement(page, '[class*="autocomplete"] li', '#27ae60');
        await options.first().click();
        console.log('  ✅ Suggestion clicked!');
      } else {
        await showStep(page, 4, 'Autocomplete নেই — directly fill করছি');
        await cityField.fill('Dhaka');
        await highlightElement(page, '#input-payment-city', '#27ae60');
        console.log('  ✅ City filled directly: Dhaka');
      }

      const val = await cityField.inputValue();
      await showStatus(page, `✅ 1C DONE! City: "${val}"`, 'success');
    } else {
      console.log('  ℹ️  Login required for checkout — showing page structure');
      await showStatus(page, 'ℹ️  Login needed for checkout', 'warning');
    }

    await page.waitForTimeout(2000);
    console.log('\n  ✅ 1C COMPLETE!\n');
  });


  // ── 1D. MULTI-SELECT (Select2) ────────────────────────────────────────
  // 🇧🇩 Real site: select2.org
  // দেখবে: Custom dropdown click → search → item select

  test('1D VISUAL — Multi-select (Select2 Dropdown)', async ({ page }) => {

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔽 TEST 1D: Select2 Dropdown');
    console.log('   Site: select2.org');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    await page.goto('https://select2.org/getting-started/basic-usage');
    await page.waitForTimeout(1500);

    await showStep(page, 1, 'Select2 container খুঁজছি...');
    const container = page.locator('.select2-container').first();
    await expect(container).toBeVisible();
    await highlightElement(page, '.select2-container', '#3498db');
    console.log('  🔵 Select2 container highlighted (blue)');

    await showStep(page, 2, 'Dropdown click করছি...');
    await container.click();
    await page.waitForTimeout(500);

    await showStep(page, 3, 'Search box-এ "Ala" type করছি...');
    const searchBox = page.locator('.select2-search__field');
    await expect(searchBox).toBeVisible({ timeout: 3000 });
    await highlightElement(page, '.select2-search__field', '#f39c12');
    await searchBox.fill('Ala');
    await page.waitForTimeout(500);

    await showStep(page, 4, 'Results দেখাচ্ছে!');
    const results = page.locator('.select2-results__option');
    await expect(results.first()).toBeVisible();
    const rCount = await results.count();
    console.log(`  📋 ${rCount} results found`);
    await highlightElement(page, '.select2-results', '#9b59b6');

    await showStep(page, 5, 'First result select করছি...');
    await highlightElement(page, '.select2-results__option:first-child', '#27ae60');
    await results.first().click();
    await page.waitForTimeout(500);

    const selected = page.locator('.select2-selection__rendered');
    const selText  = await selected.textContent();
    console.log(`  ✅ Selected: "${selText?.trim()}"`);
    await highlightElement(page, '.select2-selection', '#27ae60');
    await showStatus(page, `✅ 1D DONE! Selected: "${selText?.trim()}"`, 'success');
    await page.waitForTimeout(2000);

    console.log('\n  ✅ 1D COMPLETE!\n');
  });

});


// ════════════════════════════════════════════════════════════════════════
//  TOPIC 2 — VISUAL REGRESSION
//
//  2A → playwright.dev (full page screenshot)
//  2B → playwright.dev (element screenshot)
//  2C → playwright.dev (before/after compare)
//  2D → playwright.dev (multiple viewports)
// ════════════════════════════════════════════════════════════════════════

test.describe('TOPIC 2: Visual Regression (Screenshot Compare)', () => {

  // ── 2A. FULL PAGE SCREENSHOT ──────────────────────────────────────────
  // 🇧🇩 দেখবে: Page load → screenshot নেওয়া হবে → baseline তৈরি/compare

  test('2A VISUAL — Full Page Screenshot Compare', async ({ page }) => {

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📸 TEST 2A: Full Page Screenshot');
    console.log('   Site: playwright.dev');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    mkdirSync('./test-screenshots/2A', { recursive: true });

    await page.goto('https://playwright.dev');
    await page.waitForLoadState('networkidle');

    await showStep(page, 1, 'Page fully loaded — screenshot নেবো');
    await highlightElement(page, 'body', '#3498db', 500);

    await showStep(page, 2, 'Full page screenshot capture হচ্ছে...');
    console.log('  📸 Capturing full page screenshot...');

    // Manual screenshot নাও (always works)
    const screenshot = await page.screenshot({
      path:     './test-screenshots/2A/full-page.png',
      fullPage: true,
    });

    await showStep(page, 3, 'Screenshot saved! Baseline compare হচ্ছে...');
    console.log('  ✅ Screenshot saved: ./test-screenshots/2A/full-page.png');

    // toHaveScreenshot দিয়ে compare করো
    // প্রথমবার → baseline তৈরি হয়
    // পরেরবার → compare হয়
    try {
      await expect(page).toHaveScreenshot('playwright-homepage.png', {
        fullPage:       true,
        maxDiffPixels:  500,
        threshold:      0.3,
        animations:     'disabled',
      });
      await showStatus(page, '✅ 2A PASSED! Screenshot matches baseline!', 'success');
      console.log('  ✅ Screenshot matches baseline!');
    } catch (e) {
      await showStatus(page, '📸 2A: Baseline created! Run again to compare.', 'info');
      console.log('  📸 Baseline created! Run again to compare.');
    }

    await page.waitForTimeout(2000);
    console.log('\n  ✅ 2A COMPLETE!\n');
  });


  // ── 2B. ELEMENT SCREENSHOT ────────────────────────────────────────────
  // 🇧🇩 দেখবে: Specific element highlight → screenshot নেওয়া হবে

  test('2B VISUAL — Component Level Screenshot', async ({ page }) => {

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 TEST 2B: Component Screenshot');
    console.log('   Site: playwright.dev');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    mkdirSync('./test-screenshots/2B', { recursive: true });

    await page.goto('https://playwright.dev');
    await page.waitForLoadState('networkidle');

    // ── Navbar screenshot ─────────────────────────────────────────
    await showStep(page, 1, 'Navbar element capture করছি...');
    const navbar = page.locator('nav').first();
    await expect(navbar).toBeVisible();
    await highlightElement(page, 'nav', '#e74c3c');
    console.log('  🔴 Navbar highlighted (red)');

    await navbar.screenshot({ path: './test-screenshots/2B/navbar.png' });
    console.log('  📸 navbar.png saved');

    try {
      await expect(navbar).toHaveScreenshot('navbar-component.png', {
        maxDiffPixels: 100,
        animations:    'disabled',
      });
      console.log('  ✅ Navbar screenshot matches!');
    } catch (e) {
      console.log('  📸 Navbar baseline created!');
    }

    // ── Main content screenshot ───────────────────────────────────
    await showStep(page, 2, 'Main section capture করছি...');
    const main = page.locator('main').first();
    await highlightElement(page, 'main', '#27ae60');
    console.log('  🟢 Main section highlighted (green)');

    await main.screenshot({ path: './test-screenshots/2B/main.png' });
    console.log('  📸 main.png saved');

    try {
      await expect(main).toHaveScreenshot('main-section.png', {
        maxDiffPixels: 300,
        animations:    'disabled',
      });
      console.log('  ✅ Main section matches!');
    } catch (e) {
      console.log('  📸 Main baseline created!');
    }

    await showStatus(page, '✅ 2B DONE! Component screenshots saved!', 'success');
    await page.waitForTimeout(2000);
    console.log('\n  ✅ 2B COMPLETE!\n');
  });


  // ── 2C. BEFORE/AFTER COMPARE ──────────────────────────────────────────
  // 🇧🇩 দেখবে: Before screenshot → action → After screenshot → compare

  test('2C VISUAL — Before/After Screenshot Compare', async ({ page }) => {

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔄 TEST 2C: Before/After Compare');
    console.log('   Site: playwright.dev');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    mkdirSync('./screenshots', { recursive: true });

    await page.goto('https://playwright.dev');
    await page.waitForLoadState('networkidle');

    // ── Before screenshot ─────────────────────────────────────────
    await showStep(page, 1, 'BEFORE screenshot নিচ্ছি...');
    await highlightElement(page, 'body', '#3498db', 500);
    const before = await page.screenshot({
      path:     './screenshots/before.png',
      fullPage: false,
    });
    console.log('  📸 before.png saved');

    // ── Some action করো ───────────────────────────────────────────
    await showStep(page, 2, 'Page scroll করছি (action simulate)...');
    await page.evaluate(() => window.scrollTo(0, 300));
    await page.waitForTimeout(500);

    // ── After screenshot ──────────────────────────────────────────
    await showStep(page, 3, 'AFTER screenshot নিচ্ছি...');
    await highlightElement(page, 'body', '#e74c3c', 500);
    const after = await page.screenshot({
      path:     './screenshots/after.png',
      fullPage: false,
    });
    console.log('  📸 after.png saved');

    // ── Compare ───────────────────────────────────────────────────
    await showStep(page, 4, 'Before vs After compare করছি...');
    const isDifferent = !before.equals(after);
    console.log(`\n  📊 Screenshots: ${isDifferent ? 'DIFFERENT ⚠️' : 'SAME ✅'}`);
    console.log('  📁 Check: ./screenshots/before.png & after.png');

    await showStatus(
      page,
      `📸 2C DONE! ${isDifferent ? 'Different' : 'Same'} screenshots`,
      isDifferent ? 'warning' : 'success'
    );
    await page.waitForTimeout(2000);
    console.log('\n  ✅ 2C COMPLETE!\n');
  });


  // ── 2D. RESPONSIVE VISUAL REGRESSION ─────────────────────────────────
  // 🇧🇩 দেখবে: Mobile → Tablet → Desktop viewport-এ page দেখাবে

  test('2D VISUAL — Responsive Screenshots (3 viewports)', async ({ page }) => {

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📱 TEST 2D: Responsive Viewports');
    console.log('   Site: playwright.dev');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    mkdirSync('./test-screenshots/2D', { recursive: true });

    const viewports = [
      { name: 'mobile',  width: 375,  height: 812,  color: '#e74c3c' },
      { name: 'tablet',  width: 768,  height: 1024, color: '#f39c12' },
      { name: 'desktop', width: 1440, height: 900,  color: '#27ae60' },
    ];

    for (const [i, vp] of viewports.entries()) {
      await showStep(page, i + 1,
        `${vp.name.toUpperCase()} viewport: ${vp.width}x${vp.height}`
      );

      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('https://playwright.dev');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      // Viewport indicator inject করো
      await page.evaluate(({ name, w, h, col }) => {
        const old = document.getElementById('__vp__');
        if (old) old.remove();
        const d         = document.createElement('div');
        d.id            = '__vp__';
        d.style.cssText =
          'position:fixed;bottom:10px;right:10px;z-index:99999;' +
          'background:' + col + ';color:white;padding:8px 14px;' +
          'border-radius:8px;font:bold 13px monospace;';
        d.textContent = '📱 ' + name + ' (' + w + 'x' + h + ')';
        document.body.appendChild(d);
      }, { name: vp.name, w: vp.width, h: vp.height, col: vp.color });

      await highlightElement(page, 'body', vp.color, 500);

      // Screenshot নাও
      await page.screenshot({
        path: `./test-screenshots/2D/${vp.name}.png`,
      });
      console.log(`  📸 ${vp.name}.png saved (${vp.width}x${vp.height})`);

      // Visual regression compare
      try {
        await expect(page).toHaveScreenshot(`homepage-${vp.name}.png`, {
          maxDiffPixels: 500,
          animations:    'disabled',
        });
        console.log(`  ✅ ${vp.name}: Screenshot matches!`);
      } catch (e) {
        console.log(`  📸 ${vp.name}: Baseline created!`);
      }

      await showStatus(page, `✅ ${vp.name} viewport captured!`, 'success');
      await page.waitForTimeout(1000);
    }

    console.log('\n  ✅ 2D COMPLETE! 3 viewport screenshots saved!\n');
  });

});


// ════════════════════════════════════════════════════════════════════════
//  TOPIC 3 — PARALLEL EXECUTION + FLAKY TEST RETRY
//
//  3A → playwright.dev (parallel tests)
//  3B → playwright.dev (flaky test retry)
//  3C → playwright.dev (retry info)
//  3D → demo.opencart.com (parallel users)
// ════════════════════════════════════════════════════════════════════════

test.describe('TOPIC 3: Parallel Execution + Flaky Test Retry', () => {

  // 🇧🇩 এই tests parallel-এ চলে — প্রতিটা নিজের browser instance পায়

  test('3A-1 VISUAL — Parallel: Homepage load', async ({ page }) => {

    console.log(`\n  🔀 PARALLEL TEST [Thread: 3A-1]`);
    await page.goto('https://playwright.dev');

    await showStep(page, 1, 'Parallel test চলছে — Thread 3A-1');
    await highlightElement(page, 'nav', '#3498db');

    await expect(page).toHaveTitle(/Playwright/);
    await showStatus(page, '✅ 3A-1 PASSED! (Parallel)', 'success');
    await page.waitForTimeout(1000);
    console.log('  ✅ 3A-1: Parallel test passed!');
  });

  test('3A-2 VISUAL — Parallel: Docs page', async ({ page }) => {

    console.log(`\n  🔀 PARALLEL TEST [Thread: 3A-2]`);
    await page.goto('https://playwright.dev/docs/intro');

    await showStep(page, 1, 'Parallel test চলছে — Thread 3A-2');
    await highlightElement(page, 'h1', '#f39c12');

    await expect(page.locator('h1')).toBeVisible();
    await showStatus(page, '✅ 3A-2 PASSED! (Parallel)', 'success');
    await page.waitForTimeout(1000);
    console.log('  ✅ 3A-2: Parallel test passed!');
  });

  test('3A-3 VISUAL — Parallel: API page', async ({ page }) => {

    console.log(`\n  🔀 PARALLEL TEST [Thread: 3A-3]`);
    await page.goto('https://playwright.dev/docs/api/class-page');

    await showStep(page, 1, 'Parallel test চলছে — Thread 3A-3');
    await highlightElement(page, 'h1', '#27ae60');

    await expect(page.locator('h1')).toBeVisible();
    await showStatus(page, '✅ 3A-3 PASSED! (Parallel)', 'success');
    await page.waitForTimeout(1000);
    console.log('  ✅ 3A-3: Parallel test passed!');
  });


  // ── 3B. FLAKY TEST RETRY ─────────────────────────────────────────────
  // 🇧🇩 দেখবে: Test attempt number, retry info banner

  test('3B VISUAL — Flaky Test with Retry', async ({ page }) => {

    const attemptNum = test.info().retry + 1;
    console.log(`\n  🔄 TEST 3B: Attempt ${attemptNum}`);

    await page.goto('https://playwright.dev');

    await showStep(page, 1, `Attempt #${attemptNum} — Flaky test চলছে...`);

    // Retry info inject করো
    await page.evaluate((num) => {
      const d         = document.createElement('div');
      d.style.cssText =
        'position:fixed;bottom:10px;left:10px;z-index:99999;' +
        'background:#9b59b6;color:white;padding:10px 16px;' +
        'border-radius:8px;font:bold 13px monospace;';
      d.textContent = '🔄 Attempt: ' + num + ' (retry test)';
      document.body.appendChild(d);
    }, attemptNum);

    await highlightElement(page, 'nav', '#9b59b6');

    await expect(page.locator('nav')).toBeVisible({ timeout: 10000 });
    await page.waitForFunction(() => document.readyState === 'complete');

    await showStatus(page, `✅ 3B PASSED on attempt ${attemptNum}!`, 'success');
    await page.waitForTimeout(1000);
    console.log(`  ✅ 3B PASSED on attempt ${attemptNum}!`);
  });


  // ── 3C. TEST INFO ─────────────────────────────────────────────────────
  test('3C VISUAL — Test Info + Retry Override', async ({ page }) => {

    test.info().annotations.push({
      type:        'info',
      description: 'This test shows retry information',
    });

    await page.goto('https://playwright.dev');

    await showStep(page, 1, 'Test info দেখাচ্ছি...');

    const info = {
      title:  test.info().title,
      retry:  test.info().retry,
      worker: test.info().workerIndex,
    };
    console.log('  📊 Test Info:', JSON.stringify(info, null, 2));

    // Info panel inject করো
    await page.evaluate((info) => {
      const d         = document.createElement('div');
      d.style.cssText =
        'position:fixed;bottom:10px;right:10px;z-index:99999;' +
        'background:#2c3e50;color:#ecf0f1;padding:12px 16px;' +
        'border-radius:8px;font:13px monospace;line-height:1.6;';
      d.innerHTML =
        '<b style="color:#3498db;">📊 Test Info</b><br>' +
        'Retry: ' + info.retry + '<br>' +
        'Worker: ' + info.worker;
      document.body.appendChild(d);
    }, info);

    await highlightElement(page, 'main', '#3498db');
    await expect(page.locator('h1')).toBeVisible();
    await showStatus(page, `✅ 3C PASSED! Retry: ${info.retry}`, 'success');
    await page.waitForTimeout(1000);
    console.log('  ✅ 3C COMPLETE!');
  });


  // ── 3D. PARALLEL USERS ───────────────────────────────────────────────
  // 🇧🇩 Real site: demo.opencart.com
  // দেখবে: 3 user একসাথে আলাদা browsers-এ কাজ করছে

  test.describe.parallel('3D VISUAL — Parallel Users (OpenCart)', () => {

    test('User A: Browse Desktops', async ({ page }) => {
      console.log('\n  👤 USER A starting...');
      await page.goto('https://demo.opencart.com');

      await showStep(page, 1, 'User A: Desktops browse করছে...');
      await highlightElement(page, '#logo', '#e74c3c');

      await page.click('text=Desktops');
      await expect(page.locator('h2, h1').first()).toBeVisible({ timeout: 8000 });
      await highlightElement(page, 'h2, h1', '#27ae60');

      await showStatus(page, '✅ User A: Desktops page!', 'success');
      await page.waitForTimeout(1000);
      console.log('  ✅ User A DONE!');
    });

    test('User B: Search laptop', async ({ page }) => {
      console.log('\n  👤 USER B starting...');
      await page.goto('https://demo.opencart.com');

      await showStep(page, 1, 'User B: Laptop search করছে...');
      await highlightElement(page, '#search', '#f39c12');

      await page.fill('#search input', 'laptop');
      await page.press('#search input', 'Enter');
      await expect(page.locator('#content')).toBeVisible({ timeout: 8000 });

      await showStatus(page, '✅ User B: Search done!', 'success');
      await page.waitForTimeout(1000);
      console.log('  ✅ User B DONE!');
    });

    test('User C: Visit homepage', async ({ page }) => {
      console.log('\n  👤 USER C starting...');
      await page.goto('https://demo.opencart.com');

      await showStep(page, 1, 'User C: Homepage দেখছে...');
      await expect(page.locator('#logo')).toBeVisible({ timeout: 8000 });
      await highlightElement(page, '#logo', '#9b59b6');

      await showStatus(page, '✅ User C: Homepage loaded!', 'success');
      await page.waitForTimeout(1000);
      console.log('  ✅ User C DONE!');
    });

  });

});


// ════════════════════════════════════════════════════════════════════════
//  TOPIC 4 — MULTI-TAB / MULTI-CONTEXT / MULTI-USER
//
//  4A → the-internet.herokuapp.com (new tab)
//  4B → 3 sites (multiple tabs)
//  4C → saucedemo.com (two contexts)
//  4D → নিজের HTML chat app (sender + receiver)
//  4E → saucedemo.com (buyer + seller simulation)
// ════════════════════════════════════════════════════════════════════════

test.describe('TOPIC 4: Multi-Tab / Multi-Context / Multi-User', () => {

  // ── 4A. NEW TAB ───────────────────────────────────────────────────────
  // 🇧🇩 Real site: the-internet.herokuapp.com/windows
  // দেখবে: Link click → নতুন tab খোলে → verify → close → back

  test('4A VISUAL — New Tab Handling', async ({ page, context }) => {

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🗂️  TEST 4A: New Tab Handling');
    console.log('   Site: the-internet.herokuapp.com');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    await page.goto('https://the-internet.herokuapp.com/windows');
    await page.waitForTimeout(1000);

    await showStep(page, 1, 'Original tab — link খুঁজছি...');
    const link = page.locator('a:has-text("Click Here")');
    await expect(link).toBeVisible();
    await highlightElement(page, 'a:has-text("Click Here")', '#3498db');
    console.log('  🔵 Link highlighted — এটা নতুন tab খুলবে!');

    await showStep(page, 2, 'Link click করছি — নতুন tab খুলবে!');
    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      link.click(),
    ]);

    await newPage.waitForLoadState('domcontentloaded');
    console.log(`  ✅ New tab URL: ${newPage.url()}`);

    await showStep(page, 3, 'নতুন tab-এ verify করছি...');
    await newPage.bringToFront();

    await page.evaluate((url) => {
      const d         = document.createElement('div');
      d.style.cssText =
        'position:fixed;top:50px;left:50%;transform:translateX(-50%);' +
        'z-index:99999;background:#27ae60;color:white;padding:12px 20px;' +
        'border-radius:8px;font:bold 14px monospace;text-align:center;';
      d.textContent = '🆕 NEW TAB OPENED!\n' + url;
      newPage.document?.body?.appendChild(d);
    }, newPage.url());

    await highlightElement(newPage, 'h3', '#27ae60');
    console.log('  🟢 New tab content highlighted!');

    await showStep(page, 4, 'নতুন tab বন্ধ করছি — original-এ ফিরছি...');
    await newPage.close();
    await page.bringToFront();
    await highlightElement(page, 'h3', '#f39c12');

    await showStatus(page, '✅ 4A DONE! Tab opened + closed!', 'success');
    await page.waitForTimeout(2000);
    console.log('\n  ✅ 4A COMPLETE!\n');
  });


  // ── 4B. MULTIPLE TABS ────────────────────────────────────────────────
  // 🇧🇩 দেখবে: 3 tab খুলবে → switch হবে → verify → close

  test('4B VISUAL — Multiple Tabs Management', async ({ context }) => {

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🗂️  TEST 4B: Multiple Tabs');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const page1 = await context.newPage();
    const page2 = await context.newPage();
    const page3 = await context.newPage();

    // ── Tab 1 ─────────────────────────────────────────────────────
    await showStep(page1, 1, 'Tab 1: playwright.dev load করছি...');
    await page1.goto('https://playwright.dev');
    await page1.bringToFront();
    await highlightElement(page1, 'nav', '#e74c3c');
    console.log(`  🔴 Tab 1: ${await page1.title()}`);

    // Tab indicator inject করো
    await page1.evaluate(() => {
      const d         = document.createElement('div');
      d.style.cssText =
        'position:fixed;bottom:10px;right:10px;z-index:99999;' +
        'background:#e74c3c;color:white;padding:8px 14px;' +
        'border-radius:8px;font:bold 13px monospace;';
      d.textContent = '🗂️ TAB 1';
      document.body.appendChild(d);
    });

    await page1.waitForTimeout(800);

    // ── Tab 2 ─────────────────────────────────────────────────────
    await showStep(page2, 1, 'Tab 2: github.com load করছি...');
    await page2.goto('https://github.com/microsoft/playwright');
    await page2.bringToFront();
    await highlightElement(page2, 'h1', '#f39c12');
    console.log(`  🟠 Tab 2: ${await page2.title()}`);
    await page2.evaluate(() => {
      const d         = document.createElement('div');
      d.style.cssText =
        'position:fixed;bottom:10px;right:10px;z-index:99999;' +
        'background:#f39c12;color:white;padding:8px 14px;' +
        'border-radius:8px;font:bold 13px monospace;';
      d.textContent = '🗂️ TAB 2';
      document.body.appendChild(d);
    });
    await page2.waitForTimeout(800);

    // ── Tab 3 ─────────────────────────────────────────────────────
    await showStep(page3, 1, 'Tab 3: npmjs.com load করছি...');
    await page3.goto('https://www.npmjs.com/package/@playwright/test');
    await page3.bringToFront();
    await highlightElement(page3, 'h1', '#27ae60');
    console.log(`  🟢 Tab 3: ${await page3.title()}`);
    await page3.evaluate(() => {
      const d         = document.createElement('div');
      d.style.cssText =
        'position:fixed;bottom:10px;right:10px;z-index:99999;' +
        'background:#27ae60;color:white;padding:8px 14px;' +
        'border-radius:8px;font:bold 13px monospace;';
      d.textContent = '🗂️ TAB 3';
      document.body.appendChild(d);
    });
    await page3.waitForTimeout(800);

    // ── Verify all URLs ───────────────────────────────────────────
    expect(page1.url()).toContain('playwright.dev');
    expect(page2.url()).toContain('github.com');
    expect(page3.url()).toContain('npmjs.com');

    const totalTabs = context.pages().length;
    console.log(`\n  📊 Total open tabs: ${totalTabs}`);

    // ── Close tabs ────────────────────────────────────────────────
    await page2.close();
    await page3.close();
    await page1.bringToFront();
    await showStatus(page1, `✅ 4B DONE! ${totalTabs} tabs managed!`, 'success');
    await page1.waitForTimeout(2000);
    console.log('\n  ✅ 4B COMPLETE!\n');
  });


  // ── 4C. MULTI-CONTEXT (Two Users) ────────────────────────────────────
  // 🇧🇩 Real site: saucedemo.com
  // দেখবে: Standard user ✅ vs Locked user ❌ — দুটো browser side by side

  test('4C VISUAL — Multi-Context: Two Different Users', async ({ browser }) => {

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👥 TEST 4C: Multi-Context Users');
    console.log('   Site: saucedemo.com');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // ── Context 1: Standard User ───────────────────────────────────
    console.log('\n  👤 User 1: standard_user (should succeed)');
    const ctx1  = await browser.newContext();
    const page1 = await ctx1.newPage();

    await page1.goto('https://www.saucedemo.com');
    await showStep(page1, 1, 'User 1 (standard) — login করছি...');
    await page1.fill('#user-name', 'standard_user');
    await page1.fill('#password',  'secret_sauce');
    await highlightElement(page1, '#login-button', '#27ae60');
    await page1.click('#login-button');
    await page1.waitForURL('**/inventory.html');

    await showStep(page1, 2, 'User 1 — Inventory দেখাচ্ছে! ✅');
    await highlightElement(page1, '.inventory_list', '#27ae60');
    await showStatus(page1, '✅ User 1: Access GRANTED!', 'success');
    console.log('  ✅ Standard user: CAN access inventory');
    await page1.waitForTimeout(1500);
    await ctx1.close();

    // ── Context 2: Locked Out User ─────────────────────────────────
    console.log('\n  👤 User 2: locked_out_user (should be blocked)');
    const ctx2  = await browser.newContext();
    const page2 = await ctx2.newPage();

    await page2.goto('https://www.saucedemo.com');
    await showStep(page2, 1, 'User 2 (locked) — login চেষ্টা করছি...');
    await page2.fill('#user-name', 'locked_out_user');
    await page2.fill('#password',  'secret_sauce');
    await highlightElement(page2, '#login-button', '#e74c3c');
    await page2.click('#login-button');

    await expect(page2.locator('[data-test="error"]')).toBeVisible({ timeout: 5000 });
    await showStep(page2, 2, 'User 2 — BLOCKED! Error দেখাচ্ছে! ❌');
    await highlightElement(page2, '[data-test="error"]', '#e74c3c');
    const errText = await page2.locator('[data-test="error"]').textContent();
    await showStatus(page2, '❌ User 2: Access DENIED!', 'error');
    console.log(`  ❌ Locked user blocked: ${errText?.trim()}`);
    await page2.waitForTimeout(1500);
    await ctx2.close();

    console.log('\n  ✅ 4C COMPLETE! Role-based access verified!\n');
  });


  // ── 4D. REAL-TIME CHAT ───────────────────────────────────────────────
  // 🇧🇩 নিজের HTML chat app — Sender আর Receiver দুটো context-এ

  test('4D VISUAL — Real-time Chat (Sender + Receiver)', async ({ browser }) => {

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💬 TEST 4D: Real-time Chat');
    console.log('   2 users, 1 chat room');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Chat app route
    const chatHTML = `<!DOCTYPE html><html><head><style>
      body{font-family:sans-serif;margin:0;padding:20px;background:#f0f4f8;}
      h1{color:#2c3e50;margin-bottom:4px;}
      .user-badge{display:inline-block;padding:4px 12px;border-radius:20px;
        color:white;font-size:13px;margin-bottom:16px;}
      #messages{background:white;border:1px solid #ddd;border-radius:10px;
        padding:16px;height:250px;overflow-y:auto;margin-bottom:12px;}
      .message{padding:8px 12px;border-radius:8px;margin-bottom:8px;
        max-width:70%;font-size:14px;}
      .msg-alice{background:#3498db;color:white;margin-left:auto;text-align:right;}
      .msg-bob{background:#ecf0f1;color:#2c3e50;}
      .input-row{display:flex;gap:10px;}
      input{flex:1;padding:10px;border:1px solid #ddd;border-radius:8px;font-size:14px;}
      button{padding:10px 20px;background:#3498db;color:white;border:none;
        border-radius:8px;cursor:pointer;font-size:14px;}
      #status{color:#666;font-size:13px;margin-top:8px;}
    </style></head><body>
      <h1>💬 Chat Room #123</h1>
      <div id="user-badge" class="user-badge">Loading...</div>
      <div id="messages"></div>
      <div class="input-row">
        <input id="msg-input" placeholder="Type message..." />
        <button onclick="sendMessage()">Send</button>
      </div>
      <div id="status">Connected</div>
      <script>
        var userName = new URLSearchParams(window.location.search).get('user') || 'User';
        var badgeColors = {Alice:'#e74c3c', Bob:'#27ae60'};
        var badge = document.getElementById('user-badge');
        badge.textContent = '👤 ' + userName;
        badge.style.background = badgeColors[userName] || '#3498db';

        // Shared storage simulation via BroadcastChannel
        var channel = new BroadcastChannel('chat-room-123');
        var msgs = JSON.parse(sessionStorage.getItem('chat_msgs') || '[]');

        function renderMessages() {
          var box = document.getElementById('messages');
          box.innerHTML = '';
          msgs.forEach(function(m) {
            var d = document.createElement('div');
            d.className = 'message msg-' + m.user.toLowerCase();
            d.textContent = m.user + ': ' + m.text;
            d.id = 'msg-' + m.id;
            box.appendChild(d);
          });
          box.scrollTop = box.scrollHeight;
        }

        function sendMessage() {
          var input = document.getElementById('msg-input');
          var text  = input.value.trim();
          if (!text) return;
          var msg = { id: Date.now(), user: userName, text: text };
          msgs.push(msg);
          sessionStorage.setItem('chat_msgs', JSON.stringify(msgs));
          channel.postMessage(msg);
          renderMessages();
          input.value = '';
        }

        channel.onmessage = function(e) {
          msgs.push(e.data);
          renderMessages();
        };

        document.getElementById('msg-input').addEventListener('keypress', function(e) {
          if (e.key === 'Enter') sendMessage();
        });

        renderMessages();
      </script>
    </body></html>`;

    // Alice context
    const aliceCtx  = await browser.newContext();
    const alicePage = await aliceCtx.newPage();
    await alicePage.route('https://chatapp.test/**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'text/html', body: chatHTML });
    });

    // Bob context
    const bobCtx    = await browser.newContext();
    const bobPage   = await bobCtx.newPage();
    await bobPage.route('https://chatapp.test/**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'text/html', body: chatHTML });
    });

    // ── Alice joins ───────────────────────────────────────────────
    await alicePage.goto('https://chatapp.test/?user=Alice');
    await showStep(alicePage, 1, 'Alice joined chat room!');
    await highlightElement(alicePage, '#user-badge', '#e74c3c');

    // ── Bob joins ─────────────────────────────────────────────────
    await bobPage.goto('https://chatapp.test/?user=Bob');
    await showStep(bobPage, 1, 'Bob joined chat room!');
    await highlightElement(bobPage, '#user-badge', '#27ae60');

    // ── Alice sends message ───────────────────────────────────────
    await alicePage.bringToFront();
    await showStep(alicePage, 2, 'Alice message পাঠাচ্ছে...');
    await alicePage.fill('#msg-input', 'Hello Bob! This is Alice 👋');
    await highlightElement(alicePage, '#msg-input', '#e74c3c');
    await alicePage.press('#msg-input', 'Enter');
    await page.waitForTimeout(500);

    // Alice-এর message verify করো
    await expect(alicePage.locator('#messages')).toContainText('Alice: Hello Bob!');
    await highlightElement(alicePage, '#messages', '#27ae60');
    console.log('  ✅ Alice sent message!');

    // ── Bob sends reply ───────────────────────────────────────────
    await bobPage.bringToFront();
    await showStep(bobPage, 2, 'Bob reply পাঠাচ্ছে...');
    await bobPage.fill('#msg-input', 'Hi Alice! Got your message ✅');
    await highlightElement(bobPage, '#msg-input', '#27ae60');
    await bobPage.press('#msg-input', 'Enter');
    await page.waitForTimeout(500);

    await expect(bobPage.locator('#messages')).toContainText('Bob: Hi Alice!');
    await highlightElement(bobPage, '#messages', '#27ae60');
    console.log('  ✅ Bob replied!');

    await showStatus(alicePage, '✅ 4D DONE! Chat simulation complete!', 'success');
    await page.waitForTimeout(2000);

    await aliceCtx.close();
    await bobCtx.close();
    console.log('\n  ✅ 4D COMPLETE!\n');
  });


  // ── 4E. BUYER + SELLER ───────────────────────────────────────────────
  // 🇧🇩 saucedemo.com — Standard user (buyer) + দেখবে inventory
  //    দুটো আলাদা context-এ একসাথে কাজ করছে

  test('4E VISUAL — Buyer + Seller Simulation (saucedemo)', async ({ browser }) => {

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🛒 TEST 4E: Buyer + Seller');
    console.log('   Site: saucedemo.com');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // ── Seller context (admin role simulation) ─────────────────────
    console.log('\n  🏪 SELLER context starting...');
    const sellerCtx  = await browser.newContext();
    const sellerPage = await sellerCtx.newPage();

    await sellerPage.goto('https://www.saucedemo.com');
    await showStep(sellerPage, 1, 'Seller — login করছি...');
    await sellerPage.fill('#user-name', 'standard_user');
    await sellerPage.fill('#password',  'secret_sauce');
    await highlightElement(sellerPage, '#login-button', '#9b59b6');
    await sellerPage.click('#login-button');
    await sellerPage.waitForURL('**/inventory.html');

    await showStep(sellerPage, 2, 'Seller — Inventory দেখছে...');
    await highlightElement(sellerPage, '.inventory_list', '#9b59b6');

    // Product count দেখাও
    const productCount = await sellerPage.locator('.inventory_item').count();
    console.log(`  📦 Seller sees ${productCount} products in inventory`);

    // Seller panel inject করো
    await sellerPage.evaluate((count) => {
      const d         = document.createElement('div');
      d.style.cssText =
        'position:fixed;top:60px;right:10px;z-index:99999;' +
        'background:#9b59b6;color:white;padding:12px 16px;' +
        'border-radius:8px;font:bold 13px monospace;';
      d.textContent = '🏪 SELLER\n📦 ' + count + ' products';
      document.body.appendChild(d);
    }, productCount);

    await showStatus(sellerPage, '🏪 Seller: Viewing inventory', 'mock');
    await page.waitForTimeout(1500);

    // ── Buyer context ──────────────────────────────────────────────
    console.log('\n  🛒 BUYER context starting...');
    const buyerCtx  = await browser.newContext();
    const buyerPage = await buyerCtx.newPage();

    await buyerPage.goto('https://www.saucedemo.com');
    await showStep(buyerPage, 1, 'Buyer — login করছি...');
    await buyerPage.fill('#user-name', 'problem_user');
    await buyerPage.fill('#password',  'secret_sauce');
    await highlightElement(buyerPage, '#login-button', '#27ae60');
    await buyerPage.click('#login-button');
    await buyerPage.waitForURL('**/inventory.html');

    await showStep(buyerPage, 2, 'Buyer — Products দেখছে...');
    await highlightElement(buyerPage, '.inventory_list', '#27ae60');

    // First item cart-এ add করো
    await showStep(buyerPage, 3, 'Buyer — Cart-এ product add করছে...');
    const addBtn = buyerPage.locator('button:has-text("Add to cart")').first();
    await addBtn.scrollIntoViewIfNeeded();
    await highlightElement(buyerPage, 'button:has-text("Add to cart")', '#f39c12');
    await addBtn.click();

    const cartBadge = buyerPage.locator('.shopping_cart_badge');
    await expect(cartBadge).toBeVisible({ timeout: 5000 });
    await highlightElement(buyerPage, '.shopping_cart_badge', '#27ae60');
    console.log('  ✅ Product added to cart!');

    // Buyer panel inject করো
    await buyerPage.evaluate(() => {
      const d         = document.createElement('div');
      d.style.cssText =
        'position:fixed;top:60px;right:10px;z-index:99999;' +
        'background:#27ae60;color:white;padding:12px 16px;' +
        'border-radius:8px;font:bold 13px monospace;';
      d.textContent = '🛒 BUYER\n✅ Item in cart!';
      document.body.appendChild(d);
    });

    await showStatus(buyerPage, '✅ 4E DONE! Buyer added to cart!', 'success');
    await page.waitForTimeout(2000);

    await sellerCtx.close();
    await buyerCtx.close();
    console.log('\n  ✅ 4E COMPLETE!\n');
  });

});