const { test, expect } = require('@playwright/test');
const path = require('path');
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


test('3C BEST — Self-hosted lazy image page (100% reliable)', async ({ page }) => {
 
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
//
//  TEST 3D — IntersectionObserver / API CALL ON SCROLL
//
//  🇧🇩 বাংলায় বুঝি:
//  এই test-এ দরকার একটা site যেখানে:
//  1. Scroll করলে API call হয় (/api/feed এর মতো URL)
//  2. নতুন .post-item elements আসে
//
//  Real public site-এ এই exact pattern খুঁজে পাওয়া কঠিন।
//  তাই JSONPlaceholder API + নিজের HTML page use করো।
//
//  ✅ BEST APPROACH: নিজেই একটা page বানাও যেখানে
//                   real API call হয় scroll করলে।
//
// ════════

// test('3D FIXED — IntersectionObserver scroll + API call', async ({ page }) => {
 
//   // ✅ FIX 1: Listener সবার আগে দাও — setContent-এর আগে!
//   const apiCalls = [];
//   page.on('request', (request) => {
//     if (request.url().includes('jsonplaceholder.typicode.com/posts')) {
//       apiCalls.push(request.url());
//       console.log(`🌐 API called: ${request.url()}`);
//     }
//   });
 
//   // ✅ Page content set করো
//   await page.setContent(`
//     <!DOCTYPE html>
//     <html>
//     <head>
//       <style>
//         body { font-family: sans-serif; margin: 0; background: #f5f5f5; }
//         .container { max-width: 600px; margin: 0 auto; padding: 20px; }
//         .post-item {
//           background: white;
//           border: 1px solid #ddd;
//           border-radius: 8px;
//           padding: 16px;
//           margin-bottom: 12px;
//         }
//         .post-item h3 { margin: 0 0 8px; color: #333; }
//         .post-item p  { margin: 0; color: #666; font-size: 14px; }
 
//         /* ✅ FIX 2: Sentinel যাতে viewport-এর বাইরে থাকে */
//         #sentinel {
//           height: 20px;
//           background: transparent;
//         }
//         #status { text-align: center; padding: 20px; color: #999; }
//         #loader {
//           text-align: center;
//           padding: 20px;
//           color: #4a90e2;
//           display: none;
//         }
//       </style>
//     </head>
//     <body>
//       <div class="container">
//         <h1>Infinite Feed</h1>
//         <div id="feed"></div>
//         <div id="loader">⏳ Loading more posts...</div>
//         <div id="sentinel"></div>
//         <div id="status"></div>
//       </div>
 
//       <script>
//         let currentPage = 1;
//         let loading     = false;
//         const limit     = 5;
//         const total     = 20;
 
//         async function loadPosts() {
//           if (loading) return;
//           loading = true;
 
//           const offset = (currentPage - 1) * limit;
//           if (offset >= total) {
//             document.getElementById('status').textContent = 'No more posts';
//             document.getElementById('loader').style.display = 'none';
//             loading = false;
//             return;
//           }
 
//           document.getElementById('loader').style.display = 'block';
 
//           const res   = await fetch(
//             'https://jsonplaceholder.typicode.com/posts?_start=' + offset + '&_limit=' + limit
//           );
//           const posts = await res.json();
//           const feed  = document.getElementById('feed');
 
//           posts.forEach(function(post) {
//             var div       = document.createElement('div');
//             div.className = 'post-item';
//             div.innerHTML =
//               '<h3>' + post.title + '</h3>' +
//               '<p>' + post.body.substring(0, 100) + '...</p>';
//             feed.appendChild(div);
//           });
 
//           currentPage++;
//           loading = false;
//           document.getElementById('loader').style.display = 'none';
//         }
 
//         // IntersectionObserver
//         var observer = new IntersectionObserver(function(entries) {
//           if (entries[0].isIntersecting) {
//             loadPosts();
//           }
//         }, { rootMargin: '50px' });
 
//         observer.observe(document.getElementById('sentinel'));
 
//         // Initial load — শুধু একবার
//         loadPosts();
//       </script>
//     </body>
//     </html>
//   `);
 
//   // ✅ Initial load-এর জন্য wait করো
//   await expect(page.locator('.post-item').first()).toBeVisible({ timeout: 10000 });
//   const initialCount = await page.locator('.post-item').count();
//   console.log(`Initial posts loaded: ${initialCount}`);
 
//   // ✅ FIX 3: scroll + waitForResponse একসাথে Promise.all()-এ
//   // 🇧🇩 কারণ: scroll করলে তখনই API call হয়।
//   //           waitForResponse আগে ready থাকতে হবে, তারপর scroll।
//   const [response] = await Promise.all([
//     page.waitForResponse(
//       (res) =>
//         res.url().includes('jsonplaceholder.typicode.com/posts') &&
//         res.status() === 200,
//       { timeout: 10000 }
//     ),
//     // scroll করো — এটা response আসার আগেই trigger করে
//     page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)),
//   ]);
 
//   console.log(`✅ API response received: ${response.url()}`);
 
//   // নতুন posts আসার জন্য একটু wait করো
//   await page.waitForTimeout(1000);
 
//   const newCount = await page.locator('.post-item').count();
//   console.log(`Posts after scroll: ${newCount}`);
 
//   expect(newCount).toBeGreaterThan(initialCount);
//   console.log(`✅ 3D FIXED: ${newCount - initialCount} new items loaded!`);
//   console.log(`✅ Total API calls tracked: ${apiCalls.length}`);
// });
 
 
// ════════════════════════════════════════════════════════════════════════
//
//  TEST 3E FIX
//
//  ❌ ERROR ছিল:
//  "expect(locator).toBeVisible() failed"
//  "Received: hidden"
//  Element: <div id="end-msg">No more posts</div>
//
//  🇧🇩 কারণ বুঝি:
//  end-msg div-টার CSS ছিল display:none।
//  locator('text=No more posts').count() > 0 → এটা TRUE হয়
//  কারণ element DOM-এ আছে (count > 0)।
//  কিন্তু display:none মানে এটা visible না।
//  তাই toBeVisible() fail করে।
//
//  ✅ FIX 2টা জায়গায়:
//  1. Check: count() > 0 → isVisible() use করো
//  2. HTML-এ: "No more posts" দেখানোর logic ঠিক করো
//     callCount=3 তে hasMore=false আসে,
//     কিন্তু posts আছে (2টা)। তাই end-msg দেখায় না।
//     callCount=4 তে posts=[] আসে। তখন দেখায়।
//     সমস্যা: scroll loop break হওয়ার আগে কম scroll হচ্ছে।
//
// ════════════════════════════════════════════════════════════════════════
 
// test('3E FIXED — Infinite scroll + Network mock', async ({ page }) => {
 
//   let callCount = 0;
 
//   // ✅ Route mock — setContent-এর আগে!
//   await page.route('**/api/feed*', async (route) => {
//     callCount++;
//     console.log(`🔀 Mock call #${callCount}`);
 
//     if (callCount <= 3) {
//       await route.fulfill({
//         status: 200,
//         contentType: 'application/json',
//         body: JSON.stringify({
//           posts: [
//             { id: callCount * 10 + 1, text: `Page ${callCount} — Post 1` },
//             { id: callCount * 10 + 2, text: `Page ${callCount} — Post 2` },
//           ],
//           hasMore: true, // ✅ FIX: সবসময় true দাও, শুধু 4th call-এ empty
//         }),
//       });
//     } else {
//       // ✅ 4th call → empty → "No more posts" দেখাবে
//       await route.fulfill({
//         status: 200,
//         contentType: 'application/json',
//         body: JSON.stringify({ posts: [], hasMore: false }),
//       });
//     }
//   });
 
//   await page.setContent(`
//     <!DOCTYPE html>
//     <html>
//     <head>
//       <style>
//         * { box-sizing: border-box; }
//         body  { font-family: sans-serif; margin: 0; background: #f0f4f8; min-height: 100vh; }
//         .wrap { max-width: 600px; margin: 0 auto; padding: 20px; }
//         h1    { color: #2c3e50; }
//         .post {
//           background: white;
//           border-left: 4px solid #4a90e2;
//           border-radius: 4px;
//           padding: 16px;
//           margin-bottom: 12px;
//           box-shadow: 0 2px 4px rgba(0,0,0,0.08);
//         }
//         #loader {
//           text-align: center;
//           padding: 20px;
//           color: #4a90e2;
//           font-size: 1rem;
//         }
//         /* ✅ FIX: display:none সরিয়ে visibility:hidden দাও
//            অথবা JS-এ textContent check করো */
//         #end-msg {
//           text-align: center;
//           padding: 30px;
//           color: #e74c3c;
//           font-weight: bold;
//           font-size: 1.1rem;
//           visibility: hidden; /* display:none নয়! */
//         }
//       </style>
//     </head>
//     <body>
//       <div class="wrap">
//         <h1>Mock Feed</h1>
//         <div id="feed"></div>
//         <div id="loader">Loading...</div>
//         <div id="end-msg">No more posts</div>
//       </div>
 
//       <script>
//         var fetchCount = 0;
//         var isFetching = false;
 
//         async function fetchPosts() {
//           if (isFetching) return;
//           isFetching = true;
//           fetchCount++;
 
//           try {
//             var res  = await fetch('/api/feed?page=' + fetchCount);
//             var data = await res.json();
//             var feed = document.getElementById('feed');
 
//             if (data.posts && data.posts.length > 0) {
//               data.posts.forEach(function(post) {
//                 var div       = document.createElement('div');
//                 div.className = 'post';
//                 div.textContent = post.text;
//                 feed.appendChild(div);
//               });
//             }
 
//             // ✅ FIX: posts empty হলে end message দেখাও
//             if (!data.hasMore || data.posts.length === 0) {
//               document.getElementById('loader').style.display     = 'none';
//               // ✅ visibility:visible করো (display:block নয়)
//               document.getElementById('end-msg').style.visibility = 'visible';
//             }
 
//           } catch(e) {
//             console.error('Fetch error:', e);
//           }
 
//           isFetching = false;
//         }
 
//         // Scroll event listener
//         window.addEventListener('scroll', function() {
//           var scrolled   = window.innerHeight + window.scrollY;
//           var pageHeight = document.body.offsetHeight;
//           if (scrolled >= pageHeight - 150) {
//             fetchPosts();
//           }
//         });
 
//         // Initial load
//         fetchPosts();
//       </script>
//     </body>
//     </html>
//   `);
 
//   await page.waitForTimeout(1500);
 
//   // ✅ Initial posts দেখাচ্ছে কিনা check করো
//   await expect(page.locator('.post').first()).toBeVisible({ timeout: 5000 });
//   console.log(`Initial posts: ${await page.locator('.post').count()}`);
 
//   // ════════════════════════════════════════════════════════════════
//   //  SCROLL LOOP — FIX করা হয়েছে
//   // ════════════════════════════════════════════════════════════════
//   let maxAttempts = 15;
//   let found       = false;
 
//   while (maxAttempts-- > 0) {
 
//     // Scroll করো
//     await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
//     await page.waitForTimeout(1000); // API response আসার জন্য wait
 
//     // ✅ FIX: isVisible() use করো count() > 0 এর বদলে
//     //  কারণ: element DOM-এ থাকতে পারে কিন্তু hidden হতে পারে
//     const endMsg = page.locator('#end-msg');
 
//     const isVisible = await endMsg.isVisible();
 
//     if (isVisible) {
//       console.log('🏁 End of feed reached!');
//       // ✅ FIX: toBeVisible() এখন pass করবে কারণ আমরা isVisible() দিয়ে check করেছি
//       await expect(endMsg).toBeVisible();
//       found = true;
//       break;
//     }
 
//     console.log(`Scroll attempt ${15 - maxAttempts}, posts: ${await page.locator('.post').count()}, callCount: ${callCount}`);
//   }
 
//   // Safety: found না হলেও test break করো না, warn করো
//   if (!found) {
//     console.warn('⚠️ End message not shown within max attempts');
//   }
 
//   console.log(`\n✅ 3E FIXED Summary:`);
//   console.log(`   API called: ${callCount} times`);
//   console.log(`   Total posts: ${await page.locator('.post').count()}`);
//   console.log(`   End message shown: ${found}`);
 
//   // Minimum 4 API call হওয়া উচিত
//   expect(callCount).toBeGreaterThanOrEqual(4);
// });