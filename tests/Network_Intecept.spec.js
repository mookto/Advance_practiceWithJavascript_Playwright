// ╔══════════════════════════════════════════════════════════════════════╗
// ║   VISUAL DEBUG VERSION — দেখতে পাবে ঠিক কী হচ্ছে step by step     ║
// ║                                                                      ║
// ║   ✅ slowMo: প্রতিটা step slow হবে                                  ║
// ║   ✅ Highlight: কোন element check হচ্ছে সেটা গ্লো করবে             ║
// ║   ✅ Status bar: screen-এ live status দেখাবে                        ║
// ║   ✅ Console: প্রতিটা step-এ কী হচ্ছে log হবে                      ║
// ╚══════════════════════════════════════════════════════════════════════╝

import { test, expect, chromium } from '@playwright/test';
import { mkdirSync }     from 'fs';   // ← এটাই fix

// ════════════════════════════════════════════════════════════════════════
//  🇧🇩 HELPER — Element-কে screen-এ highlight করার function
//  এটা call করলে element-টা yellow glow করবে
// ════════════════════════════════════════════════════════════════════════

async function highlightElement(page, selector, color = '#FFD700', duration = 1500) {
  await page.evaluate(({ sel, col }) => {
    const el = document.querySelector(sel);
    if (!el) return;
    const original = el.style.cssText;
    el.style.cssText += `
      outline: 4px solid ${col} !important;
      box-shadow: 0 0 20px ${col} !important;
      transition: all 0.3s ease;
    `;
    setTimeout(() => { el.style.cssText = original; }, 1500);
  }, { sel: selector, col: color });
  await page.waitForTimeout(duration);
}

// ════════════════════════════════════════════════════════════════════════
//  🇧🇩 HELPER — Screen-এ একটা floating status bar দেখাবে
//  "Step 1: Route set করা হচ্ছে..." এই ধরনের message দেখাবে
// ════════════════════════════════════════════════════════════════════════
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
    d.textContent   = 'STEP ' + n + ': ' + m;
    document.body.prepend(d);
  }, { n: num, m: msg });

  await page.waitForTimeout(1200);
}

async function showStatus(page, message, type = 'info') {
  const colors = {
    info:    '#3498db',
    success: '#27ae60',
    warning: '#f39c12',
    error:   '#e74c3c',
    mock:    '#9b59b6',
  };

  await page.evaluate(({ msg, col }) => {
    // পুরোনো status bar সরাও
    const old = document.getElementById('pw-status-bar');
    if (old) old.remove();

    // নতুন status bar বানাও
    const bar        = document.createElement('div');
    bar.id           = 'pw-status-bar';
    bar.style.cssText = `
      position: fixed;
      top: 10px; left: 50%;
      transform: translateX(-50%);
      background: ${col};
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      font-family: monospace;
      font-size: 15px;
      font-weight: bold;
      z-index: 999999;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      animation: fadeIn 0.3s ease;
      max-width: 90%;
      text-align: center;
    `;
    bar.textContent  = msg;
    document.body.appendChild(bar);
  }, { msg: `🎭 ${message}`, col: colors[type] });

  await page.waitForTimeout(1200); // message পড়ার সময় দাও
}

// ════════════════════════════════════════════════════════════════════════
//  🇧🇩 playwright.config.js-এ এটা add করো slowMo-র জন্য:
//
//  use: {
//    headless: false,
//    slowMo: 800,   ← প্রতিটা action-এর মাঝে 800ms pause
//  }
//
//  অথবা command line-এ:
//  npx playwright test --headed --project=chromium
//
// ════════════════════════════════════════════════════════════════════════


// ════════════════════════════════════════════════════════════════════════
//  TEST 1A — Mock API Response — VISUAL VERSION
// ════════════════════════════════════════════════════════════════════════

test('1A VISUAL — Mock API Response', async ({ page }) => {

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎭 TEST 1A: Mock API Response');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // ── STEP 1: Route register ──────────────────────────────────────────
  console.log('\n📍 STEP 1: page.route() দিয়ে URL intercept করছি...');
  console.log('   URL: https://mockapi.test/api/products');
  console.log('   যখন browser এই URL-এ request করবে,');
  console.log('   আমরা fake response দেবো।');

  await page.route('https://mockapi.test/api/products', async (route) => {

    // Route intercept হয়েছে — console-এ দেখাও
    console.log('\n🔴 INTERCEPTED! Browser /api/products চাইছে...');
    console.log('   Real server-এ যাচ্ছে না!');
    console.log('   আমাদের fake data return হচ্ছে ↓');

    const fakeResponse = {
      products: [
        { id: 1, name: 'Fake Product A', price: 100 },
        { id: 2, name: 'Fake Product B', price: 200 },
      ],
      total: 2
    };

    console.log('   Fake Response:', JSON.stringify(fakeResponse, null, 2));

    await route.fulfill({
      status:      200,
      contentType: 'application/json',
      body:        JSON.stringify(fakeResponse),
    });

    console.log('✅ Mock response পাঠানো হলো!');
  });

  // ── STEP 2: HTML page route ─────────────────────────────────────────
  await page.route('https://mockapi.test/', async (route) => {
    await route.fulfill({
      status:      200,
      contentType: 'text/html',
      body: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: sans-serif; padding: 20px; background: #f5f5f5; margin: 0; }
            h1   { color: #333; margin-bottom: 8px; }
            .subtitle { color: #666; font-size: 14px; margin-bottom: 20px; }

            /* Status Timeline — বাম পাশে কী হচ্ছে দেখাবে */
            #timeline {
              position: fixed; right: 16px; top: 16px;
              background: #2c3e50; color: white;
              border-radius: 10px; padding: 16px;
              width: 240px; font-family: monospace; font-size: 12px;
              box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            }
            #timeline h3 { margin: 0 0 12px; color: #3498db; font-size: 13px; }
            .tl-step {
              padding: 6px 0; border-bottom: 1px solid #34495e;
              display: flex; align-items: center; gap: 8px;
            }
            .tl-step:last-child { border-bottom: none; }
            .tl-dot {
              width: 10px; height: 10px; border-radius: 50%;
              background: #7f8c8d; flex-shrink: 0;
            }
            .tl-dot.active  { background: #f39c12; animation: pulse 0.8s infinite; }
            .tl-dot.done    { background: #27ae60; }
            @keyframes pulse {
              0%, 100% { transform: scale(1);   opacity: 1; }
              50%       { transform: scale(1.4); opacity: 0.7; }
            }

            .product-card {
              background: white; border: 1px solid #ddd;
              border-radius: 8px; padding: 16px; margin-bottom: 12px;
              display: flex; justify-content: space-between;
              align-items: center;
              transition: all 0.3s;
            }
            .product-card:hover { transform: translateX(4px); box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .product-name  { font-weight: bold; color: #2c3e50; font-size: 16px; }
            .product-price { color: #27ae60; font-weight: bold; font-size: 18px; }
            .badge {
              display: inline-block; background: #3498db; color: white;
              font-size: 11px; padding: 2px 8px; border-radius: 10px;
              margin-left: 8px;
            }
            #loading { color: #666; padding: 20px; text-align: center; font-size: 16px; }
            #error-message {
              background: #fde8e8; color: #c0392b;
              border: 1px solid #e74c3c; border-radius: 8px;
              padding: 16px; display: none;
            }

            /* Mock indicator banner */
            #mock-banner {
              background: linear-gradient(135deg, #9b59b6, #8e44ad);
              color: white; padding: 10px 16px;
              border-radius: 8px; margin-bottom: 20px;
              font-size: 13px;
            }
          </style>
        </head>
        <body>

          <!-- Mock indicator -->
          <div id="mock-banner">
            🎭 MOCK MODE: Real server-এ যাচ্ছে না — fake data আসছে!
          </div>

          <h1>Product List</h1>
          <div class="subtitle">Playwright mock দিয়ে তৈরি fake products</div>

          <!-- Timeline panel -->
          <div id="timeline">
            <h3>⚡ Live Timeline</h3>
            <div class="tl-step">
              <div class="tl-dot done" id="dot-1"></div>
              <span>Route registered</span>
            </div>
            <div class="tl-step">
              <div class="tl-dot active" id="dot-2"></div>
              <span>Fetching /api/products</span>
            </div>
            <div class="tl-step">
              <div class="tl-dot" id="dot-3"></div>
              <span>Mock intercepted</span>
            </div>
            <div class="tl-step">
              <div class="tl-dot" id="dot-4"></div>
              <span>Fake data received</span>
            </div>
            <div class="tl-step">
              <div class="tl-dot" id="dot-5"></div>
              <span>Products rendered</span>
            </div>
          </div>

          <div id="loading">⏳ Fetching products from /api/products...</div>
          <div id="product-list"></div>
          <div id="error-message">❌ Something went wrong</div>

          <script>
            function setDot(id, state) {
              var dot = document.getElementById('dot-' + id);
              if (dot) {
                dot.className = 'tl-dot ' + state;
              }
            }

            async function loadProducts() {
              setDot(2, 'active');

              try {
                // এই fetch() টা Playwright intercept করবে
                const res  = await fetch('https://mockapi.test/api/products');
                setDot(2, 'done');
                setDot(3, 'active');

                await new Promise(r => setTimeout(r, 300)); // dramatic pause

                const data = await res.json();
                setDot(3, 'done');
                setDot(4, 'active');

                await new Promise(r => setTimeout(r, 300));

                document.getElementById('loading').style.display = 'none';
                const list = document.getElementById('product-list');

                data.products.forEach(function(product, index) {
                  var card       = document.createElement('div');
                  card.className = 'product-card';
                  card.id        = 'product-' + (index + 1);
                  card.innerHTML =
                    '<span class="product-name">' + product.name +
                    '<span class="badge">MOCK</span></span>' +
                    '<span class="product-price">৳' + product.price + '</span>';
                  list.appendChild(card);
                });

                setDot(4, 'done');
                setDot(5, 'done');

              } catch(err) {
                document.getElementById('loading').style.display       = 'none';
                document.getElementById('error-message').style.display = 'block';
              }
            }

            loadProducts();
          </script>
        </body>
        </html>
      `,
    });
  });

  // ── STEP 3: Page-এ navigate করো ────────────────────────────────────
  console.log('\n📍 STEP 2: Browser চালু করছি এবং page-এ যাচ্ছি...');
  await page.goto('https://mockapi.test/');
  await page.waitForTimeout(500);

  console.log('\n📍 STEP 3: Browser /api/products fetch করছে...');
  console.log('   এই moment-এ Playwright intercept করবে!');

  // ── STEP 4: Verify করো ─────────────────────────────────────────────
  await expect(page.locator('text=Fake Product A')).toBeVisible({ timeout: 8000 });

  // Element highlight করো
  await highlightElement(page, '#product-1', '#00ff00');
  console.log('\n🟢 "Fake Product A" দেখা গেছে — highlighted করা হয়েছে!');

  await expect(page.locator('text=Fake Product B')).toBeVisible();
  await highlightElement(page, '#product-2', '#00ff00');
  console.log('🟢 "Fake Product B" দেখা গেছে — highlighted করা হয়েছে!');

  await showStatus(page, '✅ 1A PASSED! Mock data visible!', 'success');
  await page.waitForTimeout(2000); // দেখার জন্য সময় দাও

  console.log('\n✅ 1A PASSED: Mock API response কাজ করছে!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
});


// ════════════════════════════════════════════════════════════════════════
//  TEST 1B — Modify Real Response — VISUAL VERSION
// ════════════════════════════════════════════════════════════════════════

test('1B VISUAL — Modify Real API Response', async ({ page }) => {

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔧 TEST 1B: Modify Real Response');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  await page.route('**/users/1', async (route) => {
    console.log('\n🔴 INTERCEPTED! /users/1 request ধরা পড়েছে!');
    console.log('   Real server-এ যাচ্ছে... (route.fetch())');

    const realResponse = await route.fetch();
    const body         = await realResponse.json();

    console.log('\n📦 Original data (server থেকে):');
    console.log('   name:', body.name);
    console.log('   email:', body.email);
    console.log('   isAdmin:', body.isAdmin, '(আগে ছিল না)');

    // Modify করো
    const originalName = body.name;
    body.isAdmin    = true;
    body.extraField = 'injected';
    body.name       = 'MODIFIED: ' + body.name;

    console.log('\n✏️  Modified data (আমরা বদলে দিলাম):');
    console.log('   name:', originalName, '→', body.name);
    console.log('   isAdmin: undefined →', body.isAdmin);
    console.log('   extraField: undefined →', body.extraField);

    await route.fulfill({
      response:    realResponse,
      body:        JSON.stringify(body),
      contentType: 'application/json',
    });

    console.log('✅ Modified response পাঠানো হলো browser-এ!');
  });

  // HTML page — before/after comparison দেখাবে
  await page.route('https://mockapi.test/users', async (route) => {
    await route.fulfill({
      status:      200,
      contentType: 'text/html',
      body: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body  { font-family: sans-serif; padding: 20px; background: #f8f9fa; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px; }
            .box  {
              background: white; border-radius: 10px;
              padding: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.08);
            }
            .box h3 { margin: 0 0 16px; padding-bottom: 8px; border-bottom: 2px solid #eee; }
            .box.original h3 { color: #e74c3c; }
            .box.modified h3 { color: #27ae60; }
            .field {
              display: flex; gap: 8px; margin-bottom: 8px;
              padding: 8px; background: #f8f9fa; border-radius: 6px;
            }
            .label { color: #666; font-size: 13px; min-width: 90px; }
            .value { font-weight: 600; color: #2c3e50; font-size: 13px; }
            .new-field { background: #d5f5e3; }
            .changed   { background: #fef9e7; }
            #loading   { text-align: center; padding: 40px; color: #666; }
          </style>
        </head>
        <body>
          <h1>User Profile — Before vs After</h1>
          <div id="loading">⏳ Fetching user data...</div>

          <div class="grid" id="comparison" style="display:none">
            <div class="box original">
              <h3>❌ Original (Server data)</h3>
              <div id="original-data"></div>
            </div>
            <div class="box modified">
              <h3>✅ Modified (Playwright inject করেছে)</h3>
              <div id="modified-data"></div>
            </div>
          </div>

          <script>
            // Original জানার জন্য আলাদা fetch (unmodified)
            var originalData = {
              name:       'Leanne Graham',
              email:      'Sincere@april.biz',
              isAdmin:    'undefined (ছিল না)',
              extraField: 'undefined (ছিল না)',
            };

            // এই fetch-টা Playwright intercept করবে
            fetch('https://jsonplaceholder.typicode.com/users/1')
              .then(function(r) { return r.json(); })
              .then(function(data) {
                document.getElementById('loading').style.display  = 'none';
                document.getElementById('comparison').style.display = 'grid';

                // Original side
                var orig = document.getElementById('original-data');
                [
                  ['name',       originalData.name],
                  ['email',      originalData.email],
                  ['isAdmin',    originalData.isAdmin],
                  ['extraField', originalData.extraField],
                ].forEach(function(f) {
                  orig.innerHTML +=
                    '<div class="field"><span class="label">' + f[0] + ':</span>' +
                    '<span class="value">' + f[1] + '</span></div>';
                });

                // Modified side (actual received data)
                var mod = document.getElementById('modified-data');
                [
                  ['name',       data.name,       'changed'],
                  ['email',      data.email,       ''],
                  ['isAdmin',    String(data.isAdmin), 'new-field'],
                  ['extraField', data.extraField,  'new-field'],
                ].forEach(function(f) {
                  mod.innerHTML +=
                    '<div class="field ' + f[2] + '"><span class="label">' + f[0] + ':</span>' +
                    '<span class="value">' + f[1] + '</span></div>';
                });
              });
          </script>
        </body>
        </html>
      `,
    });
  });

  await page.goto('https://mockapi.test/users');
  await expect(page.locator('text=MODIFIED:')).toBeVisible({ timeout: 10000 });

  await highlightElement(page, '.box.modified', '#27ae60');
  await showStatus(page, '✅ 1B PASSED! Response modified!', 'success');
  await page.waitForTimeout(2000);

  console.log('\n✅ 1B PASSED: Response modification কাজ করছে!');
});


// ════════════════════════════════════════════════════════════════════════
//  TEST 1C — Slow Network — VISUAL VERSION
// ════════════════════════════════════════════════════════════════════════

test('1C VISUAL — Slow Network Simulation', async ({ page }) => {

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('⏳ TEST 1C: Slow Network');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const DELAY_MS = 3000;

  await page.route('https://mockapi.test/api/data', async (route) => {
    console.log(`\n🔴 /api/data intercepted! ${DELAY_MS}ms delay inject হচ্ছে...`);
    console.log('   Browser এখন wait করছে...');

    await new Promise(resolve => setTimeout(resolve, DELAY_MS));

    console.log('✅ Delay শেষ! Data পাঠানো হচ্ছে...');
    await route.fulfill({
      status:      200,
      contentType: 'application/json',
      body:        JSON.stringify({ message: 'Data loaded!', items: [1, 2, 3] }),
    });
  });

  await page.route('https://mockapi.test/', async (route) => {
    await route.fulfill({
      status:      200,
      contentType: 'text/html',
      body: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: sans-serif; padding: 20px; text-align: center; }
            h1   { color: #2c3e50; }

            /* Spinner */
            .loading-spinner {
              width: 60px; height: 60px;
              border: 6px solid #ecf0f1;
              border-top: 6px solid #3498db;
              border-radius: 50%;
              animation: spin 0.8s linear infinite;
              margin: 30px auto;
            }
            @keyframes spin {
              0%   { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }

            /* Timer */
            #timer {
              font-size: 48px; font-weight: bold;
              color: #3498db; margin: 10px 0;
              font-family: monospace;
            }
            #timer-label { color: #666; font-size: 14px; }

            /* Progress bar */
            #progress-bar-container {
              background: #ecf0f1; border-radius: 10px;
              height: 10px; width: 300px;
              margin: 20px auto; overflow: hidden;
            }
            #progress-bar {
              background: linear-gradient(90deg, #3498db, #9b59b6);
              height: 100%; width: 0%;
              border-radius: 10px;
              transition: width 0.1s;
            }

            /* Network info */
            #network-info {
              background: #fff3cd; border: 1px solid #ffc107;
              border-radius: 8px; padding: 12px;
              max-width: 300px; margin: 20px auto;
              font-size: 13px; color: #856404;
            }

            /* Content */
            .content {
              display: none;
              background: #d5f5e3; border-radius: 12px;
              padding: 30px; max-width: 400px;
              margin: 20px auto;
            }
            .content h2 { color: #27ae60; margin: 0 0 10px; }
          </style>
        </head>
        <body>
          <h1>Dashboard</h1>

          <div id="network-info">
            🐢 Slow Network Simulated: 3G Speed
          </div>

          <!-- Spinner — loading-এর সময় দেখাবে -->
          <div class="loading-spinner" id="spinner"></div>

          <!-- Timer — কত সেকেন্ড হলো দেখাবে -->
          <div id="timer">0.0s</div>
          <div id="timer-label">waiting for server response...</div>

          <!-- Progress bar -->
          <div id="progress-bar-container">
            <div id="progress-bar"></div>
          </div>

          <!-- Content — data আসলে দেখাবে -->
          <div class="content" id="content">
            <h2>✅ Data Loaded!</h2>
            <p>Server response received after 3 second delay!</p>
          </div>

          <script>
            var startTime = Date.now();
            var totalDelay = 3000;

            // Timer update করো every 100ms
            var timerInterval = setInterval(function() {
              var elapsed = (Date.now() - startTime) / 1000;
              document.getElementById('timer').textContent = elapsed.toFixed(1) + 's';
              var progress = Math.min((elapsed / (totalDelay / 1000)) * 100, 95);
              document.getElementById('progress-bar').style.width = progress + '%';
            }, 100);

            // Fetch করো — Playwright 3s delay দেবে
            fetch('https://mockapi.test/api/data')
              .then(function(r) { return r.json(); })
              .then(function(data) {
                clearInterval(timerInterval);

                var elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
                document.getElementById('timer').textContent = elapsed + 's';
                document.getElementById('progress-bar').style.width = '100%';
                document.getElementById('timer-label').textContent =
                  'Response received after ' + elapsed + ' seconds!';

                // Spinner বন্ধ করো
                document.getElementById('spinner').style.display = 'none';

                // Content দেখাও
                document.getElementById('content').style.display = 'block';
              });
          </script>
        </body>
        </html>
      `,
    });
  });

  await page.goto('https://mockapi.test/');

  // Spinner দেখাচ্ছে
  await expect(page.locator('.loading-spinner')).toBeVisible({ timeout: 3000 });
  console.log('\n⏳ Spinner visible! 3 seconds delay হচ্ছে...');
  console.log('   Browser wait করছে...');

  // Content visible হওয়ার জন্য wait করো
  await expect(page.locator('.content')).toBeVisible({ timeout: 10000 });
  console.log('✅ Content appeared after delay!');

  await highlightElement(page, '.content', '#27ae60');
  await showStatus(page, '✅ 1C PASSED! Spinner → Content after 3s!', 'success');
  await page.waitForTimeout(2000);

  console.log('\n✅ 1C PASSED: Slow network simulation কাজ করছে!');
});


// ════════════════════════════════════════════════════════════════════════
//  TEST 1D — 500 Error — VISUAL VERSION
// ════════════════════════════════════════════════════════════════════════

test('1D VISUAL — 500 Server Error Injection', async ({ page }) => {

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('💥 TEST 1D: 500 Error Injection');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  await page.route('https://mockapi.test/api/products', async (route) => {
    console.log('\n🔴 /api/products intercepted!');
    console.log('   500 Internal Server Error inject হচ্ছে!');

    await route.fulfill({
      status:      500,
      contentType: 'application/json',
      body: JSON.stringify({
        error:   'Internal Server Error',
        message: 'Something went wrong on our end'
      }),
    });

    console.log('💥 500 error পাঠানো হলো!');
  });

  await page.route('https://mockapi.test/', async (route) => {
    await route.fulfill({
      status:      200,
      contentType: 'text/html',
      body: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: sans-serif; padding: 20px; }
            h1   { color: #2c3e50; }

            #product-list { padding: 10px; color: #666; }

            .error-message {
              background: #fde8e8; color: #c0392b;
              border: 1px solid #e74c3c; border-radius: 10px;
              padding: 20px; display: none; margin-top: 20px;
            }
            .error-message .error-icon { font-size: 40px; text-align: center; }
            .error-message h3 { text-align: center; margin: 8px 0 4px; }
            .error-text { text-align: center; color: #666; }

            #status-code {
              display: inline-block; background: #e74c3c; color: white;
              padding: 4px 12px; border-radius: 20px;
              font-family: monospace; font-size: 14px; margin-top: 8px;
            }

            /* Network log panel */
            #network-log {
              position: fixed; bottom: 16px; left: 16px;
              background: #1e1e1e; color: #d4d4d4;
              border-radius: 8px; padding: 16px;
              width: 320px; font-family: monospace; font-size: 12px;
              box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            }
            #network-log h4 { margin: 0 0 10px; color: #9cdcfe; }
            .log-entry {
              padding: 4px 0; border-bottom: 1px solid #2d2d2d;
            }
            .log-200 { color: #4ec9b0; }
            .log-500 { color: #f48771; }
          </style>
        </head>
        <body>
          <h1>Products Page</h1>

          <!-- Network log — DevTools এর মতো -->
          <div id="network-log">
            <h4>📡 Network Log</h4>
            <div id="log-entries">
              <div class="log-entry">Waiting for requests...</div>
            </div>
          </div>

          <div id="product-list">⏳ Loading products...</div>

          <div class="error-message" id="error-message">
            <div class="error-icon">💥</div>
            <h3>Server Error!</h3>
            <p class="error-text">Something went wrong on our end</p>
            <div style="text-align:center">
              <span id="status-code">500 Internal Server Error</span>
            </div>
          </div>

          <script>
            function addLog(msg, cls) {
              var log = document.getElementById('log-entries');
              log.innerHTML = '';
              var entry       = document.createElement('div');
              entry.className = 'log-entry ' + cls;
              entry.textContent = msg;
              log.appendChild(entry);
            }

            addLog('→ GET /api/products', '');

            fetch('https://mockapi.test/api/products')
              .then(function(res) {
                addLog(
                  '← ' + res.status + ' /api/products',
                  res.ok ? 'log-200' : 'log-500'
                );

                if (!res.ok) {
                  return res.json().then(function(err) {
                    throw new Error(err.message);
                  });
                }
                return res.json();
              })
              .then(function(data) {
                document.getElementById('product-list').textContent =
                  data.products.length + ' products found';
              })
              .catch(function(err) {
                document.getElementById('product-list').style.display = 'none';
                var errDiv = document.getElementById('error-message');
                errDiv.style.display = 'block';
                errDiv.querySelector('.error-text').textContent = err.message;
              });
          </script>
        </body>
        </html>
      `,
    });
  });

  await page.goto('https://mockapi.test/');

  await expect(page.locator('.error-message')).toBeVisible({ timeout: 8000 });
  console.log('\n💥 Error message দেখা গেছে!');

  await highlightElement(page, '.error-message', '#e74c3c');

  await expect(
    page.locator('.error-text')
  ).toContainText('Something went wrong', { timeout: 5000 });

  await showStatus(page, '✅ 1D PASSED! 500 Error handled!', 'success');
  await page.waitForTimeout(2000);

  console.log('\n✅ 1D PASSED: 500 error injection কাজ করছে!');
});
// ── 1E. ABORT REQUEST ────────────────────────────────────────────────
  //
  // 🇧🇩 Images + Analytics block করো — real site-এ কাজ করে!
  // ✅ এটা real website-এ directly কাজ করবে
 test('1E VISUAL — Request Block: Images blocked দেখো', async ({ page }) => {
 
   mkdirSync('./test-screenshots/1E', { recursive: true });
 
   const blocked = [];
   const allowed = [];
 
   page.on('requestfailed', req => {
     if (req.url().match(/\.(png|jpg|jpeg|gif|svg|webp)/i)) {
       blocked.push(req.url().split('/').pop().split('?')[0]);
       console.log(`  🚫 BLOCKED: ${req.url().split('/').pop()}`);
     }
   });
 
   page.on('response', res => {
     if (!res.url().match(/\.(png|jpg|jpeg|gif|svg|webp)/i))
       allowed.push(res.url());
   });
 
   await page.route('**/*.{png,jpg,jpeg,gif,svg,webp}', route => {
     blocked.push(route.request().url());
     route.abort();
   });
   await page.route('**/google-analytics.com/**', route => route.abort());
   await page.route('**/googletagmanager.com/**', route => route.abort());
 
   // ✅ showStep-এ page.evaluate call হয় — কিন্তু এখানে page কোনো
   //    HTML content নেই এখনো, তাই goto-র পরে call করতে হবে
   const t0 = Date.now();
   await page.goto('https://books.toscrape.com', { waitUntil: 'domcontentloaded' });
   const loadTime = Date.now() - t0;
 
   // ✅ goto-র পরে showStep call করো
   await showStep(page, 1, `Loaded in ${loadTime}ms — images blocked!`);
   await page.screenshot({ path: './test-screenshots/1E/01-no-images.png' });
   console.log('  📸 01-no-images.png (images নেই!)');
 
   await expect(page.locator('.product_pod').first()).toBeVisible();
   await showStep(page, 2, 'Text content ঠিকঠাক আছে!');
   await highlightElement(page, 'h1', '#3498db');
   await page.screenshot({ path: './test-screenshots/1E/02-text-ok.png' });
 
   console.log(`\n  📊 Load time:  ${loadTime}ms`);
   console.log(`  🚫 Blocked:    ${blocked.length} images`);
   console.log(`  ✅ Allowed:    ${allowed.length} other requests\n`);
   console.log('  ✅ 1E COMPLETE!\n');
 });