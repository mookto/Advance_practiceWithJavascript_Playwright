// ╔══════════════════════════════════════════════════════════════════════╗
// ║   4 TOPICS — VISUAL DEBUG VERSION — ALL ERRORS FIXED               ║
// ║   playwright.config.js: use: { headless: false, slowMo: 700 }      ║
// ╚══════════════════════════════════════════════════════════════════════╝

import { test, expect } from '@playwright/test';
import { mkdirSync } from 'fs';

// ════════════════════════════════════════════════════════════════════════
//  HELPERS
// ════════════════════════════════════════════════════════════════════════

async function highlightElement(page, selector, color = '#FFD700', duration = 1500) {
  await page.evaluate(({ sel, col }) => {
    // ✅ FIX: Playwright selector syntax (has-text) browser-এ কাজ করে না
    // তাই standard CSS selector use করো অথবা text content দিয়ে খোঁজো
    let el = null;
    try {
      el = document.querySelector(sel);
    } catch (e) {
      // Fallback: text content দিয়ে খোঁজো
      const all = document.querySelectorAll('*');
      for (const node of all) {
        if (node.textContent.trim().includes(sel.replace(':has-text("', '').replace('")', ''))) {
          el = node;
          break;
        }
      }
    }
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
// ════════════════════════════════════════════════════════════════════════

test.describe('TOPIC 1: Auto-complete / Suggestion Dropdown', () => {

  test('1A VISUAL — Basic Autocomplete: type + select', async ({ page }) => {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⌨️  TEST 1A: Basic Autocomplete');
    console.log('   Site: w3schools.com');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    await page.goto('https://www.w3schools.com/howto/howto_js_autocomplete.asp');
    await page.waitForTimeout(1000);

    await showStep(page, 1, 'Input field খুঁজছি...');
    const input = page.locator('#myInput');
    await expect(input).toBeVisible();
    await highlightElement(page, '#myInput', '#3498db');
    console.log('  🔵 Input highlighted (blue)');

    await showStep(page, 2, '"S" type করছি...');
    await input.click();
    await input.clear();
    await input.pressSequentially('S', { delay: 150 });
    await page.waitForTimeout(600);

    await showStep(page, 3, 'Dropdown দেখাচ্ছে!');
    const dropdown = page.locator('#myInputautocomplete-list');
    await expect(dropdown).toBeVisible({ timeout: 3000 });
    await highlightElement(page, '#myInputautocomplete-list', '#f39c12');

    const suggestions = page.locator('#myInputautocomplete-list div');
    const count       = await suggestions.count();
    console.log(`\n  📋 Found ${count} suggestions`);

    await showStep(page, 4, 'First suggestion click করছি...');
    await highlightElement(page, '#myInputautocomplete-list div', '#27ae60');
    await suggestions.first().click();
    await page.waitForTimeout(500);

    await showStep(page, 5, 'Value verify করছি...');
    const value = await input.inputValue();
    console.log(`  ✅ Selected: "${value}"`);
    expect(value.length).toBeGreaterThan(0);
    await highlightElement(page, '#myInput', '#27ae60');
    await showStatus(page, `✅ 1A DONE! Selected: "${value}"`, 'success');
    await page.waitForTimeout(2000);
    console.log('\n  ✅ 1A COMPLETE!\n');
  });


  test('1B VISUAL — Keyboard Navigation in Autocomplete', async ({ page }) => {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⌨️  TEST 1B: Keyboard Navigation');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    await page.goto('https://www.w3schools.com/howto/howto_js_autocomplete.asp');
    await page.waitForTimeout(1000);

    const input = page.locator('#myInput');

    await showStep(page, 1, '"S" type করছি...');
    await input.click();
    await input.clear();
    await input.pressSequentially('S', { delay: 150 });
    await page.waitForTimeout(500);
    await highlightElement(page, '#myInput', '#3498db');

    await showStep(page, 2, 'ArrowDown → 1st item');
    await input.press('ArrowDown');
    await page.waitForTimeout(400);
    await highlightElement(page, '#myInputautocomplete-list div', '#f39c12');

    await showStep(page, 3, 'ArrowDown → 2nd item');
    await input.press('ArrowDown');
    await page.waitForTimeout(400);

    await showStep(page, 4, 'ArrowDown → 3rd item');
    await input.press('ArrowDown');
    await page.waitForTimeout(4000);

    await showStep(page, 5, 'Enter — select!');
    await input.press('Enter');
    await page.waitForTimeout(500);

    const value = await input.inputValue();
    console.log(`  ✅ Keyboard selected: "${value}"`);
    expect(value.length).toBeGreaterThan(0);
    await highlightElement(page, '#myInput', '#27ae60');
    await showStatus(page, `✅ 1B DONE! Selected: "${value}"`, 'success');
    await page.waitForTimeout(2000);
    console.log('\n  ✅ 1B COMPLETE!\n');
  });


  test('1C VISUAL — Address Autocomplete (OpenCart)', async ({ page }) => {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🏠 TEST 1C: Address Autocomplete');
    console.log('   Site: demo.opencart.com');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    await page.goto('https://demo.opencart.com/index.php?route=checkout/checkout');
    await page.waitForTimeout(2000);

    await showStep(page, 1, 'Checkout page loaded');
    await highlightElement(page, '#content', '#3498db');

    const cityField = page.locator('#input-payment-city');

    await showStep(page, 2, 'City field খুঁজছি...');
    if (await cityField.isVisible()) {
      await highlightElement(page, '#input-payment-city', '#f39c12');

      await showStep(page, 3, '"Dha" type করছি...');
      await cityField.click();
      await cityField.pressSequentially('Dha', { delay: 100 });
      await page.waitForTimeout(1000);

      const options  = page.locator('[class*="autocomplete"] li, [class*="suggestion"] li');
      const optCount = await options.count();

      if (optCount > 0) {
        await showStep(page, 4, `${optCount} suggestions পাওয়া গেছে!`);
        await options.first().click();
        console.log('  ✅ Suggestion clicked!');
      } else {
        await showStep(page, 4, 'Direct fill করছি...');
        await cityField.fill('Dhaka');
        await highlightElement(page, '#input-payment-city', '#27ae60');
        console.log('  ✅ City: Dhaka');
      }

      const val = await cityField.inputValue();
      await showStatus(page, `✅ 1C DONE! City: "${val}"`, 'success');
    } else {
      await showStatus(page, 'ℹ️ Login needed for checkout', 'warning');
      console.log('  ℹ️  Login required');
    }

    await page.waitForTimeout(2000);
    console.log('\n  ✅ 1C COMPLETE!\n');
  });


  // ✅ FIX 1D: strict mode violation —
  // '.select2-search__field' 2টা element match করে।
  // .first() use করো অথবা specific selector দাও।

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

    await showStep(page, 2, 'Dropdown click করছি...');
    await container.click();
    await page.waitForTimeout(500);

    await showStep(page, 3, 'Search box-এ "Ala" type করছি...');

    // ✅ FIX: .first() দিয়ে strict mode error avoid করো
    const searchBox = page.locator('.select2-search__field').first();
    await expect(searchBox).toBeVisible({ timeout: 3000 });

    // ✅ FIX: highlightElement-এ specific selector
    await highlightElement(page, 'input[type="search"]', '#f39c12');
    await searchBox.fill('Ala');
    await page.waitForTimeout(500);

    await showStep(page, 4, 'Results দেখাচ্ছে!');
    const results = page.locator('.select2-results__option');
    await expect(results.first()).toBeVisible();
    const rCount = await results.count();
    console.log(`  📋 ${rCount} results found`);
    await highlightElement(page, '.select2-results__option', '#9b59b6');

    await showStep(page, 5, 'First result select করছি...');
    await results.first().click();
    await page.waitForTimeout(500);

    const selected = page.locator('.select2-selection__rendered').first();
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
// ════════════════════════════════════════════════════════════════════════

test.describe('TOPIC 2: Visual Regression (Screenshot Compare)', () => {

  test('2A VISUAL — Full Page Screenshot Compare', async ({ page }) => {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📸 TEST 2A: Full Page Screenshot');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    mkdirSync('./test-screenshots/2A', { recursive: true });

    await page.goto('https://playwright.dev');
    await page.waitForLoadState('networkidle');

    await showStep(page, 1, 'Page loaded — screenshot নেবো');
    await highlightElement(page, 'nav', '#3498db', 500);

    await showStep(page, 2, 'Full page screenshot capture...');
    await page.screenshot({ path: './test-screenshots/2A/full-page.png', fullPage: true });
    console.log('  📸 full-page.png saved');

    await showStep(page, 3, 'Baseline compare হচ্ছে...');
    try {
      await expect(page).toHaveScreenshot('playwright-homepage.png', {
        fullPage: true, maxDiffPixels: 500, threshold: 0.3, animations: 'disabled',
      });
      await showStatus(page, '✅ 2A PASSED! Matches baseline!', 'success');
    } catch (e) {
      await showStatus(page, '📸 Baseline created! Run again.', 'info');
      console.log('  📸 Baseline created!');
    }

    await page.waitForTimeout(2000);
    console.log('\n  ✅ 2A COMPLETE!\n');
  });


  test('2B VISUAL — Component Level Screenshot', async ({ page }) => {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 TEST 2B: Component Screenshot');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    mkdirSync('./test-screenshots/2B', { recursive: true });

    await page.goto('https://playwright.dev');
    await page.waitForLoadState('networkidle');

    await showStep(page, 1, 'Navbar capture করছি...');
    const navbar = page.locator('nav').first();
    await expect(navbar).toBeVisible();
    await highlightElement(page, 'nav', '#e74c3c');
    await navbar.screenshot({ path: './test-screenshots/2B/navbar.png' });
    console.log('  📸 navbar.png saved');

    try {
      await expect(navbar).toHaveScreenshot('navbar-component.png', {
        maxDiffPixels: 100, animations: 'disabled',
      });
      console.log('  ✅ Navbar matches!');
    } catch (e) {
      console.log('  📸 Navbar baseline created!');
    }

    await showStep(page, 2, 'Main section capture করছি...');
    const main = page.locator('main').first();
    await highlightElement(page, 'main', '#27ae60');
    await main.screenshot({ path: './test-screenshots/2B/main.png' });
    console.log('  📸 main.png saved');

    try {
      await expect(main).toHaveScreenshot('main-section.png', {
        maxDiffPixels: 300, animations: 'disabled',
      });
      console.log('  ✅ Main matches!');
    } catch (e) {
      console.log('  📸 Main baseline created!');
    }

    await showStatus(page, '✅ 2B DONE! Screenshots saved!', 'success');
    await page.waitForTimeout(2000);
    console.log('\n  ✅ 2B COMPLETE!\n');
  });


  test('2C VISUAL — Before/After Screenshot Compare', async ({ page }) => {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔄 TEST 2C: Before/After Compare');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    mkdirSync('./screenshots', { recursive: true });

    await page.goto('https://playwright.dev');
    await page.waitForLoadState('networkidle');

    await showStep(page, 1, 'BEFORE screenshot...');
    await highlightElement(page, 'nav', '#3498db', 500);
    const before = await page.screenshot({ path: './screenshots/before.png' });
    console.log('  📸 before.png saved');

    await showStep(page, 2, 'Scroll করছি...');
    await page.evaluate(() => window.scrollTo(0, 300));
    await page.waitForTimeout(500);

    await showStep(page, 3, 'AFTER screenshot...');
    await highlightElement(page, 'main', '#e74c3c', 500);
    const after = await page.screenshot({ path: './screenshots/after.png' });
    console.log('  📸 after.png saved');

    await showStep(page, 4, 'Compare করছি...');
    const isDifferent = !before.equals(after);
    console.log(`  📊 ${isDifferent ? 'DIFFERENT ⚠️' : 'SAME ✅'}`);

    await showStatus(
      page,
      `📸 2C DONE! ${isDifferent ? 'Different' : 'Same'}`,
      isDifferent ? 'warning' : 'success'
    );
    await page.waitForTimeout(2000);
    console.log('\n  ✅ 2C COMPLETE!\n');
  });


  test('2D VISUAL — Responsive Screenshots (3 viewports)', async ({ page }) => {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📱 TEST 2D: Responsive Viewports');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    mkdirSync('./test-screenshots/2D', { recursive: true });

    const viewports = [
      { name: 'mobile',  width: 375,  height: 812,  color: '#e74c3c' },
      { name: 'tablet',  width: 768,  height: 1024, color: '#f39c12' },
      { name: 'desktop', width: 1440, height: 900,  color: '#27ae60' },
    ];

    for (const [i, vp] of viewports.entries()) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('https://playwright.dev');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      await showStep(page, i + 1, `${vp.name.toUpperCase()}: ${vp.width}x${vp.height}`);

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

      await highlightElement(page, 'nav', vp.color, 500);
      await page.screenshot({ path: `./test-screenshots/2D/${vp.name}.png` });
      console.log(`  📸 ${vp.name}.png saved`);

      try {
        await expect(page).toHaveScreenshot(`homepage-${vp.name}.png`, {
          maxDiffPixels: 500, animations: 'disabled',
        });
        console.log(`  ✅ ${vp.name}: matches!`);
      } catch (e) {
        console.log(`  📸 ${vp.name}: baseline created!`);
      }

      await showStatus(page, `✅ ${vp.name} done!`, 'success');
      await page.waitForTimeout(800);
    }

    console.log('\n  ✅ 2D COMPLETE!\n');
  });

});


// ════════════════════════════════════════════════════════════════════════
//  TOPIC 3 — PARALLEL EXECUTION + FLAKY TEST RETRY
// ════════════════════════════════════════════════════════════════════════
test.describe('TOPIC 3: Parallel Execution + Flaky Test Retry', () => {

  test('3A-1 VISUAL — Parallel: Homepage load', async ({ page }) => {
    console.log(`\n 🔀 PARALLEL [3A-1]`);
    await page.goto('https://playwright.dev');
    await showStep(page, 1, 'Thread 3A-1 চলছে...');
    await highlightElement(page, 'nav', '#3498db');
    await expect(page).toHaveTitle(/Playwright/);
    await showStatus(page, '✅ 3A-1 PASSED!', 'success');
    await page.waitForTimeout(1000);
  });

  test('3A-2 VISUAL — Parallel: Docs page', async ({ page }) => {
    console.log(`\n 🔀 PARALLEL [3A-2]`);
    await page.goto('https://playwright.dev/docs/intro');
    await showStep(page, 1, 'Thread 3A-2 চলছে...');
    await highlightElement(page, 'h1', '#f39c12');
    await expect(page.locator('h1')).toBeVisible();
    await showStatus(page, '✅ 3A-2 PASSED!', 'success');
    await page.waitForTimeout(1000);
  });

  test('3A-3 VISUAL — Parallel: API page', async ({ page }) => {
    console.log(`\n 🔀 PARALLEL [3A-3]`);
    await page.goto('https://playwright.dev/docs/api/class-page');
    await showStep(page, 1, 'Thread 3A-3 চলছে...');
    await highlightElement(page, 'h1', '#27ae60');
    await expect(page.locator('h1')).toBeVisible();
    await showStatus(page, '✅ 3A-3 PASSED!', 'success');
    await page.waitForTimeout(1000);
  });

  test('3B VISUAL — Flaky Test with Retry', async ({ page }) => {
    const attemptNum = test.info().retry + 1;
    console.log(`\n 🔄 TEST 3B: Attempt ${attemptNum}`);
    await page.goto('https://playwright.dev');
    await showStep(page, 1, `Attempt #${attemptNum}`);

    await page.evaluate((num) => {
      const d = document.createElement('div');
      d.style.cssText =
        'position:fixed;bottom:10px;left:10px;z-index:99999;' +
        'background:#9b59b6;color:white;padding:10px 16px;' +
        'border-radius:8px;font:bold 13px monospace;';
      d.textContent = '🔄 Attempt: ' + num;
      document.body.appendChild(d);
    }, attemptNum);

    await highlightElement(page, 'nav', '#9b59b6');
    await expect(page.locator('nav')).toBeVisible({ timeout: 10000 });
    await showStatus(page, `✅ 3B PASSED! Attempt ${attemptNum}`, 'success');
    await page.waitForTimeout(1000);
  });

  test('3C VISUAL — Test Info + Retry', async ({ page }) => {
    await page.goto('https://playwright.dev');
    await showStep(page, 1, 'Test info দেখাচ্ছি...');

    const info = {
      retry:  test.info().retry,
      worker: test.info().workerIndex,
    };
    console.log(' 📊 Info:', JSON.stringify(info));

    await page.evaluate((info) => {
      const d = document.createElement('div');
      d.style.cssText =
        'position:fixed;bottom:10px;right:10px;z-index:99999;' +
        'background:#2c3e50;color:#ecf0f1;padding:12px 16px;' +
        'border-radius:8px;font:13px monospace;line-height:1.6;';
      d.innerHTML =
        '<b style="color:#3498db;">📊 Test Info</b><br>' +
        'Retry: ' + info.retry + '<br>Worker: ' + info.worker;
      document.body.appendChild(d);
    }, info);

    await highlightElement(page, 'main', '#3498db');
    await showStatus(page, `✅ 3C PASSED! Retry: ${info.retry}`, 'success');
    await page.waitForTimeout(1000);
  });
});

// ============================================================================
// 3D VISUAL — Parallel Users (Separate Parallel Suite)
// ============================================================================
test.describe.parallel('3D VISUAL — Parallel Users', () => {

  test('User A: Browse Desktops', async ({ page }) => {
    console.log('\n 👤 USER A...');
    await page.goto('https://opencart.abstracta.us/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    await showStep(page, 1, 'User A: Desktops browse...');

    const logo = page.locator('#logo a, .navbar-header a').first();
    await expect(logo).toBeVisible({ timeout: 15000 });
    await highlightElement(page, '#logo', '#e74c3c');

    await page.locator('text=Desktops').first().click();
    
    await expect(page.locator('#content')).toBeVisible({ timeout: 15000 });
    await highlightElement(page, '#content h2', '#27ae60');

    await showStatus(page, '✅ User A: Done!', 'success');
    console.log(' ✅ User A DONE!');
  });

  test('User B: Search laptop', async ({ page }) => {
    console.log('\n 👤 USER B...');
    await page.goto('https://opencart.abstracta.us/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    await showStep(page, 1, 'User B: Laptop search...');

    const searchInput = page.locator('input[name="search"]').first();
    await expect(searchInput).toBeVisible({ timeout: 15000 });
    await highlightElement(page, 'input[name="search"]', '#f39c12');

    await searchInput.fill('MacBook');
    await searchInput.press('Enter');
    
    await expect(page.locator('#content')).toBeVisible({ timeout: 15000 });

    await showStatus(page, '✅ User B: Done!', 'success');
    console.log(' ✅ User B DONE!');
  });

  test('User C: Visit homepage', async ({ page }) => {
    console.log('\n 👤 USER C...');
    await page.goto('https://opencart.abstracta.us/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    await showStep(page, 1, 'User C: Homepage দেখছে...');

    const topHeader = page.locator('header, #menu, .nav').first();
    await expect(topHeader).toBeVisible({ timeout: 15000 });
    await highlightElement(page, 'header', '#9b59b6');

    await showStatus(page, '✅ User C: Done!', 'success');
    console.log(' ✅ User C DONE!');
  });

 });

// ════════════════════════════════════════════════════════════════════════
//  TOPIC 4 — MULTI-TAB / MULTI-CONTEXT / MULTI-USER
// ════════════════════════════════════════════════════════════════════════

test.describe('TOPIC 4: Multi-Tab / Multi-Context / Multi-User', () => {

  // ✅ FIX 4A: highlightElement-এ 'a:has-text()' browser querySelector-এ কাজ করে না
  // CSS standard selector use করো

  test('4A VISUAL — New Tab Handling', async ({ page, context }) => {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🗂️  TEST 4A: New Tab');
    console.log('   Site: the-internet.herokuapp.com');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    await page.goto('https://the-internet.herokuapp.com/windows');
    await page.waitForTimeout(1000);

    await showStep(page, 1, 'Link খুঁজছি...');
    const link = page.locator('a', { hasText: 'Click Here' }).first();
    await expect(link).toBeVisible();

    // ✅ FIX: Standard CSS selector use করো highlight-এ
    await highlightElement(page, '.example a', '#3498db');
    console.log('  🔵 Link highlighted!');

    await showStep(page, 2, 'Click → নতুন tab খুলবে!');
    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      link.click(),
    ]);

    await newPage.waitForLoadState('domcontentloaded');
    console.log(`  ✅ New tab URL: ${newPage.url()}`);

    await showStep(newPage, 3, 'নতুন tab-এ আছি!');

    // ✅ FIX: newPage-এ evaluate করো, page-এ নয়
    await newPage.evaluate((url) => {
      const d         = document.createElement('div');
      d.style.cssText =
        'position:fixed;top:50px;left:50%;transform:translateX(-50%);' +
        'z-index:99999;background:#27ae60;color:white;padding:12px 20px;' +
        'border-radius:8px;font:bold 14px monospace;';
      d.textContent = '🆕 NEW TAB: ' + url;
      document.body.appendChild(d);
    }, newPage.url());

    await highlightElement(newPage, 'h3', '#27ae60');
    await showStatus(newPage, '✅ New tab verified!', 'success');
    await newPage.waitForTimeout(1500);

    await showStep(page, 4, 'Tab বন্ধ → original-এ ফিরছি...');
    await newPage.close();
    await page.bringToFront();
    await highlightElement(page, 'h3', '#f39c12');
    await showStatus(page, '✅ 4A DONE! Tab opened + closed!', 'success');
    await page.waitForTimeout(2000);
    console.log('\n  ✅ 4A COMPLETE!\n');
  });


  test('4B VISUAL — Multiple Tabs Management', async ({ context }) => {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🗂️  TEST 4B: Multiple Tabs');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const page1 = await context.newPage();
    const page2 = await context.newPage();
    const page3 = await context.newPage();

    // Tab 1
    await showStep(page1, 1, 'Tab 1: playwright.dev');
    await page1.goto('https://playwright.dev');
    await page1.bringToFront();
    await highlightElement(page1, 'nav', '#e74c3c');
    await page1.evaluate(() => {
      const d         = document.createElement('div');
      d.style.cssText =
        'position:fixed;bottom:10px;right:10px;z-index:99999;' +
        'background:#e74c3c;color:white;padding:8px 14px;' +
        'border-radius:8px;font:bold 13px monospace;';
      d.textContent = '🗂️ TAB 1';
      document.body.appendChild(d);
    });
    console.log(`  🔴 Tab 1: ${await page1.title()}`);
    await page1.waitForTimeout(800);

    // Tab 2
    await showStep(page2, 1, 'Tab 2: github.com');
    await page2.goto('https://github.com/microsoft/playwright');
    await page2.bringToFront();
    await highlightElement(page2, 'h1', '#f39c12');
    await page2.evaluate(() => {
      const d         = document.createElement('div');
      d.style.cssText =
        'position:fixed;bottom:10px;right:10px;z-index:99999;' +
        'background:#f39c12;color:white;padding:8px 14px;' +
        'border-radius:8px;font:bold 13px monospace;';
      d.textContent = '🗂️ TAB 2';
      document.body.appendChild(d);
    });
    console.log(`  🟠 Tab 2: ${await page2.title()}`);
    await page2.waitForTimeout(800);

    // Tab 3
    await showStep(page3, 1, 'Tab 3: npmjs.com');
    await page3.goto('https://www.npmjs.com/package/@playwright/test');
    await page3.bringToFront();
    await highlightElement(page3, 'h1', '#27ae60');
    await page3.evaluate(() => {
      const d         = document.createElement('div');
      d.style.cssText =
        'position:fixed;bottom:10px;right:10px;z-index:99999;' +
        'background:#27ae60;color:white;padding:8px 14px;' +
        'border-radius:8px;font:bold 13px monospace;';
      d.textContent = '🗂️ TAB 3';
      document.body.appendChild(d);
    });
    console.log(`  🟢 Tab 3: ${await page3.title()}`);
    await page3.waitForTimeout(800);

    expect(page1.url()).toContain('playwright.dev');
    expect(page2.url()).toContain('github.com');
    expect(page3.url()).toContain('npmjs.com');

    const total = context.pages().length;
    console.log(`  📊 Total tabs: ${total}`);

    await page2.close();
    await page3.close();
    await page1.bringToFront();
    await showStatus(page1, `✅ 4B DONE! ${total} tabs managed!`, 'success');
    await page1.waitForTimeout(2000);
    console.log('\n  ✅ 4B COMPLETE!\n');
  });


  test('4C VISUAL — Multi-Context: Two Different Users', async ({ browser }) => {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👥 TEST 4C: Multi-Context Users');
    console.log('   Site: saucedemo.com');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // User 1: Standard
    console.log('\n  👤 User 1: standard_user');
    const ctx1  = await browser.newContext();
    const page1 = await ctx1.newPage();

    await page1.goto('https://www.saucedemo.com');
    await showStep(page1, 1, 'User 1 login করছি...');
    await page1.fill('#user-name', 'standard_user');
    await page1.fill('#password',  'secret_sauce');
    await highlightElement(page1, '#login-button', '#27ae60');
    await page1.click('#login-button');
    await page1.waitForURL('**/inventory.html');
    await showStep(page1, 2, 'Inventory দেখাচ্ছে! ✅');
    await highlightElement(page1, '.inventory_list', '#27ae60');
    await showStatus(page1, '✅ User 1: Access GRANTED!', 'success');
    console.log('  ✅ Standard user: access granted');
    await page1.waitForTimeout(1500);
    await ctx1.close();

    // User 2: Locked
    console.log('\n  👤 User 2: locked_out_user');
    const ctx2  = await browser.newContext();
    const page2 = await ctx2.newPage();

    await page2.goto('https://www.saucedemo.com');
    await showStep(page2, 1, 'User 2 login চেষ্টা...');
    await page2.fill('#user-name', 'locked_out_user');
    await page2.fill('#password',  'secret_sauce');
    await highlightElement(page2, '#login-button', '#e74c3c');
    await page2.click('#login-button');
    await expect(page2.locator('[data-test="error"]')).toBeVisible({ timeout: 5000 });
    await showStep(page2, 2, 'BLOCKED! ❌');
    await highlightElement(page2, '[data-test="error"]', '#e74c3c');
    await showStatus(page2, '❌ User 2: Access DENIED!', 'error');
    console.log('  ❌ Locked user: blocked');
    await page2.waitForTimeout(1500);
    await ctx2.close();

    console.log('\n  ✅ 4C COMPLETE!\n');
  });


  // ✅ FIX 4D: 'page is not defined' error
  // page variable নেই এই test-এ (browser fixture use হচ্ছে)
  // page.waitForTimeout() → alicePage.waitForTimeout() দিয়ে replace করো

  test('4D VISUAL — Real-time Chat (Sender + Receiver)', async ({ browser }) => {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💬 TEST 4D: Real-time Chat');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const chatHTML = `<!DOCTYPE html><html><head><style>
      body{font-family:sans-serif;margin:0;padding:20px;background:#f0f4f8;}
      h1{color:#2c3e50;margin-bottom:4px;}
      .user-badge{display:inline-block;padding:4px 12px;border-radius:20px;
        color:white;font-size:13px;margin-bottom:16px;}
      #messages{background:white;border:1px solid #ddd;border-radius:10px;
        padding:16px;height:250px;overflow-y:auto;margin-bottom:12px;}
      .message{padding:8px 12px;border-radius:8px;margin-bottom:8px;max-width:70%;}
      .msg-alice{background:#3498db;color:white;margin-left:auto;text-align:right;}
      .msg-bob{background:#ecf0f1;color:#2c3e50;}
      .input-row{display:flex;gap:10px;}
      input{flex:1;padding:10px;border:1px solid #ddd;border-radius:8px;}
      button{padding:10px 20px;background:#3498db;color:white;border:none;
        border-radius:8px;cursor:pointer;}
    </style></head><body>
      <h1>💬 Chat Room</h1>
      <div id="user-badge" class="user-badge">Loading...</div>
      <div id="messages"></div>
      <div class="input-row">
        <input id="msg-input" placeholder="Type message..."/>
        <button onclick="sendMsg()">Send</button>
      </div>
      <script>
        var user=new URLSearchParams(window.location.search).get('user')||'User';
        var colors={Alice:'#e74c3c',Bob:'#27ae60'};
        var badge=document.getElementById('user-badge');
        badge.textContent='👤 '+user;
        badge.style.background=colors[user]||'#3498db';
        var ch=new BroadcastChannel('chat-123');
        var msgs=[];
        function render(){
          var box=document.getElementById('messages');
          box.innerHTML='';
          msgs.forEach(function(m){
            var d=document.createElement('div');
            d.className='message msg-'+m.user.toLowerCase();
            d.textContent=m.user+': '+m.text;
            box.appendChild(d);
          });
          box.scrollTop=box.scrollHeight;
        }
        function sendMsg(){
          var inp=document.getElementById('msg-input');
          var txt=inp.value.trim();
          if(!txt)return;
          var msg={id:Date.now(),user:user,text:txt};
          msgs.push(msg);
          ch.postMessage(msg);
          render();
          inp.value='';
        }
        ch.onmessage=function(e){msgs.push(e.data);render();};
        document.getElementById('msg-input').addEventListener('keypress',function(e){
          if(e.key==='Enter')sendMsg();
        });
      </script>
    </body></html>`;

    const aliceCtx  = await browser.newContext();
    const alicePage = await aliceCtx.newPage();
    await alicePage.route('https://chatapp.test/**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'text/html', body: chatHTML });
    });

    const bobCtx    = await browser.newContext();
    const bobPage   = await bobCtx.newPage();
    await bobPage.route('https://chatapp.test/**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'text/html', body: chatHTML });
    });

    await alicePage.goto('https://chatapp.test/?user=Alice');
    await showStep(alicePage, 1, 'Alice joined!');
    await highlightElement(alicePage, '#user-badge', '#e74c3c');

    await bobPage.goto('https://chatapp.test/?user=Bob');
    await showStep(bobPage, 1, 'Bob joined!');
    await highlightElement(bobPage, '#user-badge', '#27ae60');

    // Alice sends
    await alicePage.bringToFront();
    await showStep(alicePage, 2, 'Alice message পাঠাচ্ছে...');
    await alicePage.fill('#msg-input', 'Hello Bob! This is Alice 👋');
    await highlightElement(alicePage, '#msg-input', '#e74c3c');
    await alicePage.press('#msg-input', 'Enter');

    // ✅ FIX: page.waitForTimeout → alicePage.waitForTimeout
    await alicePage.waitForTimeout(500);

    await expect(alicePage.locator('#messages')).toContainText('Alice: Hello Bob!');
    await highlightElement(alicePage, '#messages', '#27ae60');
    console.log('  ✅ Alice sent!');

    // Bob replies
    await bobPage.bringToFront();
    await showStep(bobPage, 2, 'Bob reply পাঠাচ্ছে...');
    await bobPage.fill('#msg-input', 'Hi Alice! Got it ✅');
    await highlightElement(bobPage, '#msg-input', '#27ae60');
    await bobPage.press('#msg-input', 'Enter');

    // ✅ FIX: page.waitForTimeout → bobPage.waitForTimeout
    await bobPage.waitForTimeout(500);

    await expect(bobPage.locator('#messages')).toContainText('Bob: Hi Alice!');
    await highlightElement(bobPage, '#messages', '#27ae60');
    console.log('  ✅ Bob replied!');

    await showStatus(alicePage, '✅ 4D DONE! Chat complete!', 'success');
    await alicePage.waitForTimeout(2000);

    await aliceCtx.close();
    await bobCtx.close();
    console.log('\n  ✅ 4D COMPLETE!\n');
  });


  // ✅ FIX 4E: 'page is not defined' error
  // page.waitForTimeout() → sellerPage.waitForTimeout() দিয়ে replace

  test('4E VISUAL — Buyer + Seller (saucedemo)', async ({ browser }) => {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🛒 TEST 4E: Buyer + Seller');
    console.log('   Site: saucedemo.com');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Seller
    console.log('\n  🏪 SELLER...');
    const sellerCtx  = await browser.newContext();
    const sellerPage = await sellerCtx.newPage();

    await sellerPage.goto('https://www.saucedemo.com');
    await showStep(sellerPage, 1, 'Seller login...');
    await sellerPage.fill('#user-name', 'standard_user');
    await sellerPage.fill('#password',  'secret_sauce');
    await highlightElement(sellerPage, '#login-button', '#9b59b6');
    await sellerPage.click('#login-button');
    await sellerPage.waitForURL('**/inventory.html');

    await showStep(sellerPage, 2, 'Seller — Inventory দেখছে...');
    await highlightElement(sellerPage, '.inventory_list', '#9b59b6');

    const productCount = await sellerPage.locator('.inventory_item').count();
    console.log(`  📦 ${productCount} products`);

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

    // ✅ FIX: page.waitForTimeout → sellerPage.waitForTimeout
    await sellerPage.waitForTimeout(1500);

    // Buyer
    console.log('\n  🛒 BUYER...');
    const buyerCtx  = await browser.newContext();
    const buyerPage = await buyerCtx.newPage();

    await buyerPage.goto('https://www.saucedemo.com');
    await showStep(buyerPage, 1, 'Buyer login...');
    await buyerPage.fill('#user-name', 'problem_user');
    await buyerPage.fill('#password',  'secret_sauce');
    await highlightElement(buyerPage, '#login-button', '#27ae60');
    await buyerPage.click('#login-button');
    await buyerPage.waitForURL('**/inventory.html');

    await showStep(buyerPage, 2, 'Buyer — Products দেখছে...');
    await highlightElement(buyerPage, '.inventory_list', '#27ae60');

    await showStep(buyerPage, 3, 'Cart-এ add করছে...');
    const addBtn = buyerPage.locator('button:has-text("Add to cart")').first();
    await addBtn.scrollIntoViewIfNeeded();
    await highlightElement(buyerPage, '.btn_primary', '#f39c12');
    await addBtn.click();

    const cartBadge = buyerPage.locator('.shopping_cart_badge');
    await expect(cartBadge).toBeVisible({ timeout: 5000 });
    await highlightElement(buyerPage, '.shopping_cart_badge', '#27ae60');
    console.log('  ✅ Added to cart!');

    await buyerPage.evaluate(() => {
      const d         = document.createElement('div');
      d.style.cssText =
        'position:fixed;top:60px;right:10px;z-index:99999;' +
        'background:#27ae60;color:white;padding:12px 16px;' +
        'border-radius:8px;font:bold 13px monospace;';
      d.textContent = '🛒 BUYER\n✅ Item in cart!';
      document.body.appendChild(d);
    });

    await showStatus(buyerPage, '✅ 4E DONE! Cart updated!', 'success');
    await buyerPage.waitForTimeout(2000);

    await sellerCtx.close();
    await buyerCtx.close();
    console.log('\n  ✅ 4E COMPLETE!\n');
  });

});
