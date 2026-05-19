// ╔══════════════════════════════════════════════════════════════════════╗
// ║   TOPIC 2 + TOPIC 3 — VISUAL DEBUG VERSION                         ║
// ║   Real Sites + Highlight + Step Banner + Console Logs              ║
// ╚══════════════════════════════════════════════════════════════════════╝

import { test, expect } from '@playwright/test';
import { mkdirSync, existsSync } from 'fs';


// ════════════════════════════════════════════════════════════════════════
//  ✅ HELPERS — সব test-এ use হবে (file-এর একদম উপরে রাখো)
// ════════════════════════════════════════════════════════════════════════

// Element-এ glowing colored border দেখাও
async function highlight(page, selector, color = '#FFD700') {
  await page.evaluate(({ sel, col }) => {
    const el = document.querySelector(sel);
    if (!el) return;
    el.style.outline       = `4px solid ${col}`;
    el.style.outlineOffset = '4px';
    el.style.boxShadow     = `0 0 15px ${col}`;
    el.style.transition    = 'all 0.3s ease';
  }, { sel: selector, col: color });
  await page.waitForTimeout(800);
}

// Page-এ top banner দেখাও
async function showStep(page, num, msg) {
  console.log(`\n${'═'.repeat(55)}`);
  console.log(`  STEP ${num}: ${msg}`);
  console.log(`${'═'.repeat(55)}`);

  await page.evaluate(({ n, m }) => {
    const old = document.getElementById('__step_banner__');
    if (old) old.remove();
    const d         = document.createElement('div');
    d.id            = '__step_banner__';
    d.style.cssText =
      'position:fixed;top:0;left:0;right:0;z-index:999999;' +
      'background:#1a1a2e;color:#00d4aa;padding:12px 20px;' +
      'font:bold 14px monospace;border-bottom:3px solid #e94560;' +
      'box-shadow:0 2px 10px rgba(0,0,0,0.5);';
    d.textContent = '▶ STEP ' + n + ': ' + m;
    document.body.prepend(d);
  }, { n: num, m: msg });

  await page.waitForTimeout(1000);
}

// Floating status popup দেখাও
async function showStatus(page, msg, type = 'info') {
  const colors = {
    info:    '#3498db',
    success: '#27ae60',
    warning: '#f39c12',
    error:   '#e74c3c',
  };
  await page.evaluate(({ m, col }) => {
    const old = document.getElementById('__status_pop__');
    if (old) old.remove();
    const d         = document.createElement('div');
    d.id            = '__status_pop__';
    d.style.cssText =
      'position:fixed;bottom:20px;right:20px;z-index:999999;' +
      'background:' + col + ';color:white;padding:14px 20px;' +
      'border-radius:10px;font:bold 14px monospace;' +
      'box-shadow:0 4px 20px rgba(0,0,0,0.4);max-width:350px;';
    d.textContent = m;
    document.body.appendChild(d);
    setTimeout(() => d.remove(), 3000);
  }, { m: msg, col: colors[type] });
  await page.waitForTimeout(1200);
}


// ════════════════════════════════════════════════════════════════════════
//  TOPIC 2 — AUTH HANDLING
//
//  ✅ Real Sites:
//  2A Cookie    → www.saucedemo.com
//  2B localStorage → নিজের HTML page
//  2C storageState → www.saucedemo.com (save + reuse)
//  2D Multi-role   → www.saucedemo.com (standard vs locked)
// ════════════════════════════════════════════════════════════════════════

test.describe('TOPIC 2: Auth Handling', () => {

  // ── 2A. COOKIE INJECTION ─────────────────────────────────────────────
  //
  // 🇧🇩 Real site: saucedemo.com
  //    Login করলে 'session-username' cookie set হয়
  //    আমরা সেটা manually inject করবো

  test('2A VISUAL — Cookie Injection (saucedemo.com)', async ({ browser }) => {

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🍪 TEST 2A: Cookie Injection');
    console.log('   Site: www.saucedemo.com');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const context = await browser.newContext();
    const page    = await context.newPage();

    // ── STEP 1: Site-এ যাও ─────────────────────────────────────────
    await page.goto('https://www.saucedemo.com');
    await showStep(page, 1, 'Site-এ এলাম — এখনো login করিনি');
    console.log('  → Currently on login page (not logged in)');

    // ── STEP 2: Cookie inject করো ──────────────────────────────────
    await showStep(page, 2, 'Cookie manually inject করছি...');
    console.log('  → Injecting session-username cookie...');

    await context.addCookies([
      {
        name:     'session-username',
        value:    'standard_user',
        domain:   'www.saucedemo.com',
        path:     '/',
        secure:   false,
        sameSite: 'Lax',
      }
    ]);

    // Cookies verify করো
    const cookies = await context.cookies();
    console.log('\n  📦 Injected cookies:');
    cookies.forEach(c => {
      console.log(`     ${c.name} = ${c.value} (domain: ${c.domain})`);
    });

    // ── STEP 3: Protected page-এ যাও ───────────────────────────────
    await showStep(page, 3, 'Protected page-এ যাচ্ছি — login ছাড়াই!');
    await page.goto('https://www.saucedemo.com/inventory.html');

    // Cookie inject কাজ করলে inventory page দেখাবে
    // না করলে login page-এ redirect হবে
    const currentUrl = page.url();
    console.log(`\n  Current URL: ${currentUrl}`);

    if (currentUrl.includes('inventory')) {
      // ✅ Cookie worked!
      await showStep(page, 4, 'Inventory page দেখাচ্ছে! Cookie কাজ করেছে!');
      await highlight(page, '.inventory_list', '#27ae60');
      await showStatus(page, '✅ Cookie injection worked!', 'success');
      console.log('  ✅ Cookie auth successful! No login needed!');
    } else {
      // Cookie কাজ করেনি → manual login করো
      await showStep(page, 4, 'Cookie কাজ করেনি → manual login করছি...');
      console.log('  ⚠️  Cookie auth failed. Doing manual login...');

      await page.fill('#user-name', 'standard_user');
      await page.fill('#password',  'secret_sauce');
      await highlight(page, '#login-button', '#3498db');
      await page.click('#login-button');
      await page.waitForURL('**/inventory.html');

      // এখন cookies দেখো
      const newCookies = await context.cookies();
      console.log('\n  📦 Cookies after manual login:');
      newCookies.forEach(c => {
        console.log(`     ${c.name} = ${c.value}`);
      });
    }

    // Final verify
    await expect(page.locator('.inventory_list')).toBeVisible({ timeout: 8000 });
    await highlight(page, '.inventory_list', '#27ae60');
    await showStatus(page, '✅ 2A DONE! Inventory accessible!', 'success');

    await context.close();
    console.log('\n  ✅ 2A COMPLETE!\n');
  });


  // ── 2B. LOCALSTORAGE INJECTION ───────────────────────────────────────
  //
  // 🇧🇩 নিজের HTML page বানাও — JWT token inject করো
  //    Before: "Please Login" দেখাবে
  //    After:  "Dashboard" দেখাবে

  test('2B VISUAL — localStorage JWT Injection', async ({ page }) => {

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🗄️  TEST 2B: localStorage Injection');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // ── HTML App Route ──────────────────────────────────────────────
    await page.route('https://jwtapp.test/', async (route) => {
      await route.fulfill({
        status: 200, contentType: 'text/html',
        body: `<!DOCTYPE html><html><head><style>
          body{font-family:sans-serif;margin:0;background:#ecf0f1;}
          .card{background:white;max-width:420px;margin:60px auto;
                padding:32px;border-radius:12px;
                box-shadow:0 4px 20px rgba(0,0,0,0.1);text-align:center;}
          .login-view  h2{color:#e74c3c;}
          .dash-view   h2{color:#27ae60;}
          .dash-view{display:none;}
          .info-row{display:flex;justify-content:space-between;
                    padding:8px 12px;background:#f8f9fa;
                    border-radius:6px;margin:8px 0;font-size:14px;}
          .label{color:#666;} .value{font-weight:bold;color:#2c3e50;}
          .token-box{background:#2c3e50;color:#00ff88;padding:12px;
                     border-radius:6px;font-family:monospace;
                     font-size:11px;word-break:break-all;margin-top:12px;text-align:left;}
          .badge{display:inline-block;background:#27ae60;color:white;
                 padding:3px 10px;border-radius:20px;font-size:12px;margin-left:6px;}
        </style></head><body>
          <div class="card">
            <div class="login-view" id="loginView">
              <div style="font-size:48px">🔒</div>
              <h2>Please Login First</h2>
              <p style="color:#666">No auth token found in localStorage</p>
            </div>
            <div class="dash-view" id="dashView">
              <div style="font-size:48px">🎉</div>
              <h2>Welcome to Dashboard!</h2>
              <div class="info-row">
                <span class="label">User ID</span>
                <span class="value" id="userId">-</span>
              </div>
              <div class="info-row">
                <span class="label">Role</span>
                <span class="value" id="userRole">-</span>
              </div>
              <div class="info-row">
                <span class="label">Status</span>
                <span class="value">Logged In <span class="badge">✓</span></span>
              </div>
              <div class="token-box" id="tokenBox">Token: loading...</div>
            </div>
          </div>
          <script>
            function checkAuth() {
              var token = localStorage.getItem('authToken');
              var uid   = localStorage.getItem('userId');
              var role  = localStorage.getItem('userRole');
              if (token && uid) {
                document.getElementById('loginView').style.display = 'none';
                document.getElementById('dashView').style.display  = 'block';
                document.getElementById('userId').textContent   = uid;
                document.getElementById('userRole').textContent = role || 'user';
                document.getElementById('tokenBox').textContent =
                  'Token: ' + token.substring(0,40) + '...';
              }
            }
            checkAuth();
          </script>
        </body></html>`
      });
    });

    // ── STEP 1: Token ছাড়া দেখো ─────────────────────────────────
    await page.goto('https://jwtapp.test/');
    await showStep(page, 1, 'Token নেই — Login page দেখাচ্ছে');
    await expect(page.locator('text=Please Login First')).toBeVisible();
    await highlight(page, '.login-view', '#e74c3c');
    console.log('  ❌ No token → Login page shown');

    // ── STEP 2: Token inject করো ───────────────────────────────────
    await showStep(page, 2, 'localStorage-এ JWT token inject করছি...');

    await page.evaluate(() => {
      localStorage.setItem('authToken', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload.signature');
      localStorage.setItem('userId',   '12345');
      localStorage.setItem('userRole', 'admin');
      localStorage.setItem('isLoggedIn', 'true');
    });

    // localStorage verify করো
    const token  = await page.evaluate(() => localStorage.getItem('authToken'));
    const userId = await page.evaluate(() => localStorage.getItem('userId'));
    const role   = await page.evaluate(() => localStorage.getItem('userRole'));

    console.log('\n  📦 localStorage contents:');
    console.log(`     authToken = ${token?.substring(0,30)}...`);
    console.log(`     userId    = ${userId}`);
    console.log(`     userRole  = ${role}`);

    // ── STEP 3: Page reload করো ────────────────────────────────────
    await showStep(page, 3, 'Page reload করছি — token এখন আছে!');
    await page.reload();

    // ── STEP 4: Dashboard দেখাচ্ছে কিনা ───────────────────────────
    await expect(page.locator('text=Welcome to Dashboard')).toBeVisible({ timeout: 5000 });
    await showStep(page, 4, 'Dashboard দেখাচ্ছে! Token কাজ করেছে!');
    await highlight(page, '.dash-view', '#27ae60');
    await showStatus(page, '✅ 2B DONE! Dashboard accessible!', 'success');

    console.log('\n  ✅ 2B COMPLETE! JWT injection worked!\n');
  });


  // ── 2C. PERSISTENT CONTEXT (storageState) ───────────────────────────
  //
  // 🇧🇩 Real site: saucedemo.com
  //    STEP1 → Login করো → state save করো
  //    STEP2 → Saved state দিয়ে login ছাড়াই access করো

  test('2C-STEP1 VISUAL — Login + Save Auth State', async ({ browser }) => {

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💾 TEST 2C-STEP1: Login & Save');
    console.log('   Site: www.saucedemo.com');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Auth folder তৈরি করো
    mkdirSync('./tests/auth', { recursive: true });

    const context = await browser.newContext();
    const page    = await context.newPage();

    // ── STEP 1: Login page-এ যাও ───────────────────────────────────
    await page.goto('https://www.saucedemo.com');
    await showStep(page, 1, 'Login page-এ এলাম');
    await highlight(page, '#user-name', '#3498db');

    // ── STEP 2: Credentials fill করো ──────────────────────────────
    await showStep(page, 2, 'Username + Password fill করছি...');
    console.log('  → Username: standard_user');
    console.log('  → Password: secret_sauce');

    await page.fill('#user-name', 'standard_user');
    await highlight(page, '#user-name', '#27ae60');

    await page.fill('#password', 'secret_sauce');
    await highlight(page, '#password', '#27ae60');

    // ── STEP 3: Login button click ──────────────────────────────────
    await showStep(page, 3, 'Login button click করছি...');
    await highlight(page, '#login-button', '#f39c12');
    await page.click('#login-button');

    // ── STEP 4: Login success ───────────────────────────────────────
    await page.waitForURL('**/inventory.html', { timeout: 10000 });
    await showStep(page, 4, 'Login সফল! Inventory page দেখাচ্ছে!');
    await highlight(page, '.inventory_list', '#27ae60');
    console.log('  ✅ Login successful!');

    // ── STEP 5: State save করো ─────────────────────────────────────
    await showStep(page, 5, 'Auth state JSON-এ save করছি...');
    await context.storageState({ path: './tests/auth/saucedemo-auth.json' });
    await showStatus(page, '✅ Auth state saved!', 'success');

    console.log('  ✅ Saved to: ./tests/auth/saucedemo-auth.json');
    console.log('  → এই file-এ cookies + localStorage সব আছে');

    await context.close();
    console.log('\n  ✅ 2C-STEP1 COMPLETE! Run STEP2 now.\n');
  });

  test('2C-STEP2 VISUAL — Reuse Auth State (No Login!)', async ({ browser }) => {

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔓 TEST 2C-STEP2: Reuse State');
    console.log('   Login ছাড়াই access করবো!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const authFile = './tests/auth/saucedemo-auth.json';
    if (!existsSync(authFile)) {
      console.log('  ⚠️ Auth file not found! Run STEP1 first.');
      return;
    }

    // ── STEP 1: Saved state দিয়ে context তৈরি করো ─────────────────
    console.log('\n  → Loading saved auth state...');
    const context = await browser.newContext({
      storageState: authFile,
    });
    const page = await context.newPage();

    // ── STEP 2: Login page skip করে সরাসরি যাও ────────────────────
    await showStep(page, 1,
      'Saved state দিয়ে context তৈরি — Login page-এ না গিয়েই...'
    );
    await page.goto('https://www.saucedemo.com/inventory.html');

    // ── STEP 3: Verify ──────────────────────────────────────────────
    await expect(page.locator('.inventory_list')).toBeVisible({ timeout: 8000 });
    await showStep(page, 2, 'Inventory page! Login ছাড়াই ঢুকে গেলাম!');
    await highlight(page, '.inventory_list', '#27ae60');
    await showStatus(page, '✅ No login needed!', 'success');

    console.log(`  ✅ URL: ${page.url()}`);
    console.log('  ✅ Directly on inventory — no login redirect!');

    // ── STEP 4: Cart page-এও যাও ───────────────────────────────────
    await showStep(page, 3, 'Cart page-এও যাচ্ছি — still logged in!');
    await page.goto('https://www.saucedemo.com/cart.html');
    await expect(page.locator('.cart_list')).toBeVisible({ timeout: 5000 });
    await highlight(page, '.cart_list', '#9b59b6');
    console.log('  ✅ Cart page accessible too!');

    await context.close();
    console.log('\n  ✅ 2C-STEP2 COMPLETE!\n');
  });


  // ── 2D. MULTIPLE USER ROLES ──────────────────────────────────────────
  //
  // 🇧🇩 saucedemo.com-এ multiple users আছে:
  //    standard_user    → ✅ Normal access
  //    locked_out_user  → ❌ Blocked (perfect for RBAC test!)

  test('2D VISUAL — Multiple Roles (saucedemo.com)', async ({ browser }) => {

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👥 TEST 2D: Multiple User Roles');
    console.log('   standard_user vs locked_out_user');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // ── USER 1: Standard User (normal access) ──────────────────────
    console.log('\n  ── Testing Standard User ──');
    const stdCtx  = await browser.newContext();
    const stdPage = await stdCtx.newPage();

    await stdPage.goto('https://www.saucedemo.com');
    await showStep(stdPage, 1, 'Standard User — login করছি...');
    await stdPage.fill('#user-name', 'standard_user');
    await stdPage.fill('#password',  'secret_sauce');
    await highlight(stdPage, '#login-button', '#27ae60');
    await stdPage.click('#login-button');
    await stdPage.waitForURL('**/inventory.html');

    await showStep(stdPage, 2, 'Standard User — Access GRANTED! ✅');
    await highlight(stdPage, '.inventory_list', '#27ae60');
    await showStatus(stdPage, '✅ Standard User: Access granted!', 'success');
    console.log('  ✅ Standard user: CAN access inventory');

    await stdCtx.close();

    // ── USER 2: Locked Out User (blocked) ──────────────────────────
    console.log('\n  ── Testing Locked Out User ──');
    const lockedCtx  = await browser.newContext();
    const lockedPage = await lockedCtx.newPage();

    await lockedPage.goto('https://www.saucedemo.com');
    await showStep(lockedPage, 1, 'Locked Out User — login চেষ্টা করছি...');
    await lockedPage.fill('#user-name', 'locked_out_user');
    await lockedPage.fill('#password',  'secret_sauce');
    await highlight(lockedPage, '#login-button', '#e74c3c');
    await lockedPage.click('#login-button');

    // Error message দেখাচ্ছে কিনা
    await expect(lockedPage.locator('[data-test="error"]')).toBeVisible({ timeout: 5000 });
    await showStep(lockedPage, 2, 'Locked User — Access DENIED! ❌');
    await highlight(lockedPage, '[data-test="error"]', '#e74c3c');

    const errorText = await lockedPage.locator('[data-test="error"]').textContent();
    await showStatus(lockedPage, '❌ Locked user blocked!', 'error');
    console.log('  ❌ Locked user blocked:', errorText?.trim());

    await lockedCtx.close();

    console.log('\n  ✅ 2D COMPLETE! Role-based access verified!\n');
  });

});


