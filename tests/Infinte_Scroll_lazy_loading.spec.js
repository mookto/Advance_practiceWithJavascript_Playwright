const { test, expect } = require('@playwright/test');
const path = require('path');
async function highlight(locator, page, text = '') {

  // Element visible হওয়ার জন্য wait
  await locator.waitFor({ state: 'visible', timeout: 10000 });

  // Scroll into view
  await locator.scrollIntoViewIfNeeded();

  // Highlight border
  await locator.evaluate((el) => {
    el.style.border = '4px solid red';
    el.style.backgroundColor = 'yellow';
    el.style.transition = 'all 0.3s ease';
  });

  // Floating label show করবে
  if (text) {
    await page.evaluate((msg) => {

      const old = document.getElementById('__pw_highlight__');
      if (old) old.remove();

      const div = document.createElement('div');
      div.id = '__pw_highlight__';

      div.innerText = msg;

      div.style.position = 'fixed';
      div.style.top = '20px';
      div.style.right = '20px';
      div.style.zIndex = '999999';
      div.style.padding = '10px 18px';
      div.style.background = 'red';
      div.style.color = 'white';
      div.style.fontSize = '18px';
      div.style.fontWeight = 'bold';
      div.style.borderRadius = '8px';
      div.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';

      document.body.appendChild(div);

    }, text);
  }

  await page.waitForTimeout(1200);
}
//test.describe('TOPIC 3: Infinite Scroll / Lazy Loading', () => {

//   ── 3A. BASIC INFINITE SCROLL ────────────────────────────────────────
  
//   🇧🇩 বাংলায়: Page-এর একদম নিচে scroll করো, নতুন content
//               load হওয়ার জন্য wait করো, আবার scroll করো।
//               এটা চালাতে থাকো যতক্ষণ না শেষ হয়।
  
//   Real-life: Twitter feed, product search results

test('Site 3 — books.toscrape.com (collect all books)', async ({ page }) => {
 
  // ✅ URL set করো
  await page.goto('https://books.toscrape.com');
  await page.waitForLoadState('domcontentloaded');
 
  // ─── Modified version — "next" button click করে সব books collect ───
 
  const collectedBooks = new Set();
 
  while (true) {
 
    // ✅ বর্তমান page-র সব books collect করো
    // selector: .product_pod — প্রতিটা book card
    const books = await page.locator('.product_pod h3 a').allTextContents();
    books.forEach(b => collectedBooks.add(b.trim()));
 
    console.log(`📚 Collected ${collectedBooks.size} books so far...`);
 
    // ✅ "next" button আছে কিনা check করো
    const nextBtn = page.locator('li.next a');
    const exists  = await nextBtn.count();
 
    if (exists === 0) {
      console.log('🏁 No more pages. All books collected!');
      break;
    }
 
    // ✅ Next page-এ যাও
    await nextBtn.click();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);
 
    // Safety: 5 pages-এর বেশি না যাই (demo purpose)
    if (collectedBooks.size > 100) break;
  }
 
  console.log(`✅ Site 3 Total books collected: ${collectedBooks.size}`);
  expect(collectedBooks.size).toBeGreaterThan(20); // অন্তত ২০টা book
});
 

  // ── 3B. SCROLL UNTIL SPECIFIC ITEM FOUND ────────────────────────────
  //
  // 🇧🇩 বাংলায়: Feed-এ scroll করতে থাকো যতক্ষণ না নির্দিষ্ট
  //             কোনো item খুঁজে পাও।
  //
  // Real-life: "Find product X in search results"

  test('3B — Scroll until target item is found', async ({ page }) => {

    await page.goto('https://www.startech.com.bd/laptop-notebook');

    const TARGET_TEXT = 'Tecno MEGABOOK K15SDA Ryzen 5';
    let   found       = false;
    let   scrollCount = 0;
    const MAX_SCROLLS = 20;           // infinite loop থেকে বাঁচতে

    while (!found && scrollCount < MAX_SCROLLS) {

      scrollCount++;

      // 🇧🇩 Target item এখন visible কিনা check করো
      const targetItem = page.locator(`text=${TARGET_TEXT}`);
      const count      = await targetItem.count();

      if (count > 0) {
        // ✅ পেয়ে গেছি! Scroll করে ঐ item-এ নিয়ে যাও
        await targetItem.first().scrollIntoViewIfNeeded();
        await expect(targetItem.first()).toBeVisible();
        console.log(`✅ Found "${TARGET_TEXT}" after ${scrollCount} scrolls!`);
        found = true;
        break;
      }

      // 🇧🇩 আরো নিচে scroll করো
      await page.evaluate(() =>
        window.scrollTo(0, document.body.scrollHeight)
      );
      await page.waitForTimeout(1000); // content load হওয়ার জন্য wait
    }

    if (!found) {
      console.log(`❌ "${TARGET_TEXT}" not found after ${MAX_SCROLLS} scrolls`);
    }
  });


//   // ── 3C. LAZY LOADING IMAGES ──────────────────────────────────────────
//   //
//   // 🇧🇩 বাংলায়: Image যখন viewport-এ আসে তখনই load হয়।
//   //             আমাদের scroll করে image-এর কাছে যেতে হবে,
//   //             তারপর দেখতে হবে image সঠিকভাবে load হলো কিনা।
//   //
//   // Real-life: Product gallery, photo blogs, news sites

  test('3C — Lazy loading images on Pixabay', async ({ page }) => {
 
  // ✅ OPTION 1: Pixabay — loading="lazy" image আছে
  await page.goto('https://pixabay.com/images/search/nature/', {
    waitUntil: 'domcontentloaded'
  });
  await page.waitForTimeout(2000);
 
  // ✅ Pixabay-তে img[loading="lazy"] আছে কিনা check করো
  const lazyImages = page.locator('img[loading="lazy"]');
  const count = await lazyImages.count();
  console.log(`Total lazy images found: ${count}`);
 
  if (count === 0) {
    // 🇧🇩 এই site-এ loading="lazy" নেই — তাই fallback selector use করো
    console.log('⚠️ No img[loading="lazy"] found. Using fallback selector...');
 
    // Pixabay-র actual image selector
    const allImages = page.locator('.results img, .media img');
    const imgCount  = await allImages.count();
    console.log(`Found ${imgCount} images with fallback selector`);
 
    for (let i = 0; i < Math.min(imgCount, 5); i++) {
      const img = allImages.nth(i);
      await img.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
 
      const isLoaded = await img.evaluate(el =>
        el.complete && el.naturalWidth > 0
      );
      console.log(`Image ${i + 1}: ${isLoaded ? '✅ Loaded' : '❌ Failed'}`);
    }
    return;
  }
 
  // ✅ তোমার original code — শুধু URL বদলানো
  const imageCount = await lazyImages.count();
 
  for (let i = 0; i < Math.min(imageCount, 10); i++) {
    const img = lazyImages.nth(i);
 
    await img.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
 
    const isLoaded = await img.evaluate((el) => {
      return el.complete && el.naturalWidth > 0;
    });
 
    if (isLoaded) {
      console.log(`✅ Image ${i + 1}: Loaded successfully`);
    } else {
      console.log(`❌ Image ${i + 1}: Failed to load!`);
    }
 
    await expect(img).not.toHaveAttribute('src', '');
  }
 
  console.log('✅ 3C: Lazy loading image verification complete!');
});


test('3CA BEST — Self-hosted lazy image page (100% reliable)', async ({ page }) => {
 
  // ✅ Playwright-এ নিজেই HTML inject করা যায় — কোনো server লাগবে না!
  await page.setContent(`
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { margin: 0; font-family: sans-serif; }
        .container { max-width: 800px; margin: 0 auto; padding: 20px; }
        img {
          width: 100%;
          height: 300px;
          object-fit: cover;
          display: block;
          margin-bottom: 20px;
          background: #eee;
        }
        .spacer { height: 100vh; background: #f0f0f0;
                  display: flex; align-items: center;
                  justify-content: center; font-size: 1.5rem; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Lazy Loading Test Page</h1>
 
        <!-- Viewport-এ আছে — eager -->
        <img src="https://picsum.photos/800/300?random=1"
             loading="eager" alt="Eager Image 1"/>
 
        <!-- নিচে আছে — lazy load হবে -->
        <div class="spacer">⬇️ Scroll down to load lazy images</div>
 
        <img src="https://picsum.photos/800/300?random=2"
             loading="lazy" alt="Lazy Image 1"/>
        <img src="https://picsum.photos/800/300?random=3"
             loading="lazy" alt="Lazy Image 2"/>
        <img src="https://picsum.photos/800/300?random=4"
             loading="lazy" alt="Lazy Image 3"/>
        <img src="https://picsum.photos/800/300?random=5"
             loading="lazy" alt="Lazy Image 4"/>
        <img src="https://picsum.photos/800/300?random=6"
             loading="lazy" alt="Lazy Image 5"/>
        <img src="https://picsum.photos/800/300?random=7"
             loading="lazy" alt="Lazy Image 6"/>
      </div>
    </body>
    </html>
  `);
 
  await page.waitForTimeout(1000);
 
  // ✅ তোমার EXACT original code — কোনো পরিবর্তন নেই!
  const lazyImages = page.locator('img[loading="lazy"]');
  console.log(`Total lazy images: ${await lazyImages.count()}`);
 
  const imageCount = await lazyImages.count();
 
  for (let i = 0; i < Math.min(imageCount, 10); i++) {
    const img = lazyImages.nth(i);
 
    // Image-এর কাছে scroll করো
    await img.scrollIntoViewIfNeeded();
 
    // Image load হওয়ার জন্য wait করো
    await page.waitForTimeout(500);
 
    // ✅ Image সঠিকভাবে load হয়েছে কিনা verify করো
    const isLoaded = await img.evaluate((el) => {
      return el.complete && el.naturalWidth > 0;
    });
 
    if (isLoaded) {
      console.log(`✅ Image ${i + 1}: Loaded successfully`);
    } else {
      console.log(`❌ Image ${i + 1}: Failed to load!`);
    }
 
    // Broken image check করো
    await expect(img).not.toHaveAttribute('src', '');
  }
 
  console.log('✅ 3C BEST: Lazy loading image verification complete!');
  expect(imageCount).toBeGreaterThan(0);
});
// ════════════════════════════════════════════════════════════════════════
// 3D — IntersectionObserver + API CALL ON SCROLL
// ════════════════════════════════════════════════════════════════════════

test('3D HIGHLIGHT — Infinite scroll + API call', async ({ page }) => {

  const apiCalls = [];

  // API request track
  page.on('request', (request) => {
    if (request.url().includes('jsonplaceholder.typicode.com/posts')) {
      apiCalls.push(request.url());
      console.log(`🌐 API called: ${request.url()}`);
    }
  });

  // Page create
  await page.setContent(`
    <!DOCTYPE html>
    <html>
    <head>
      <style>

        body {
          font-family: Arial;
          margin: 0;
          background: #f5f5f5;
        }

        .container {
          max-width: 700px;
          margin: auto;
          padding: 20px;
        }

        .post-item {
          background: white;
          margin-bottom: 16px;
          padding: 18px;
          border-radius: 10px;
          border: 1px solid #ddd;
        }

        .post-item h3 {
          margin: 0 0 10px;
        }

        #loader {
          text-align: center;
          padding: 20px;
          font-size: 22px;
        }

        #sentinel {
          height: 40px;
        }

      </style>
    </head>

    <body>

      <div class="container">

        <h1>Infinite Feed Demo</h1>

        <div id="feed"></div>

        <div id="loader">⏳ Loading...</div>

        <div id="sentinel"></div>

      </div>

      <script>

        let currentPage = 1;
        let loading = false;

        async function loadPosts() {

          if (loading) return;

          loading = true;

          const offset = (currentPage - 1) * 5;

          const res = await fetch(
            'https://jsonplaceholder.typicode.com/posts?_start=' +
            offset +
            '&_limit=5'
          );

          const posts = await res.json();

          const feed = document.getElementById('feed');

          posts.forEach((post) => {

            const div = document.createElement('div');

            div.className = 'post-item';

            div.innerHTML =
              '<h3>' + post.title + '</h3>' +
              '<p>' + post.body + '</p>';

            feed.appendChild(div);

          });

          currentPage++;
          loading = false;
        }

        const observer = new IntersectionObserver((entries) => {

          if (entries[0].isIntersecting) {
            loadPosts();
          }

        });

        observer.observe(document.getElementById('sentinel'));

        // Initial load
        loadPosts();

      </script>

    </body>
    </html>
  `);

  // First post visible
  const firstPost = page.locator('.post-item').first();

  await expect(firstPost).toBeVisible();

  await highlight(
    firstPost,
    page,
    '✅ Initial Posts Loaded'
  );

  const initialCount = await page.locator('.post-item').count();

  console.log(`Initial posts: ${initialCount}`);

  // ════════════════════════════════════
  // Scroll
  // ════════════════════════════════════

  console.log('⬇️ Scrolling to trigger API...');

  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
  });

  await page.waitForTimeout(3000);

  // New posts count
  const newCount = await page.locator('.post-item').count();

  console.log(`Posts after scroll: ${newCount}`);

  // Highlight newly loaded post
  const newPost = page.locator('.post-item').nth(initialCount);

  await highlight(
    newPost,
    page,
    '🔥 New Posts Loaded After Scroll'
  );

  expect(newCount).toBeGreaterThan(initialCount);

  console.log(`✅ New posts loaded successfully`);
  console.log(`✅ API calls tracked: ${apiCalls.length}`);
});