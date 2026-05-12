# Playwright Scroll & Lazy Load — Interview Guide

## Code 1: Basic Pagination (Infinite Scroll via "Next" Button)

### What it does
Visits `books.toscrape.com`, collects all book titles across multiple pages by clicking the "Next" button repeatedly until it disappears.

### Key Logic
```
while(true) → collect books → check "next" button → click → repeat
```

- **`Set()`** — avoids duplicate book titles automatically
- **`allTextContents()`** — grabs all matching text in one call
- **`nextBtn.count()`** — returns `0` if element doesn't exist (safe existence check)
- **`waitForLoadState('domcontentloaded')`** — waits for HTML to parse before acting
- **Safety break**: stops after 100 books (demo guard against infinite loops)

### Interview Q&A
| Question | Answer |
|---|---|
| Why `Set` instead of array? | Automatically deduplicates — same book won't be added twice |
| Why `count() === 0` instead of `isVisible()`? | `count()` never throws; `isVisible()` throws if element is missing |
| What's the risk of `while(true)`? | Infinite loop — always add a break condition or counter |
| What does `waitForLoadState` do? | Pauses execution until the page's DOM is fully parsed |

---

## Code 2: Scroll Until Target Item Found

### What it does
Scrolls down a product listing page (`startech.com.bd`) looking for a specific laptop model, stopping as soon as it's found.

### Key Logic
```
while(!found && scrollCount < MAX) → check text → if found: scrollIntoView → else: scroll down
```

- **`page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))`** — runs JS inside the browser to scroll to the very bottom
- **`scrollIntoViewIfNeeded()`** — scrolls *just enough* to bring the element into viewport
- **`MAX_SCROLLS = 20`** — safety valve against infinite loops
- **`waitForTimeout(1000)`** — gives time for lazy-loaded content to appear after scrolling

### Interview Q&A
| Question | Answer |
|---|---|
| Why `page.evaluate()` for scrolling? | Playwright doesn't have a native "scroll to bottom" method; `evaluate()` runs real browser JS |
| Difference: `scrollIntoView` vs `window.scrollTo`? | `scrollIntoView` targets a specific element; `scrollTo` scrolls to a coordinate |
| Why `waitForTimeout` after scroll? | Dynamic/lazy-loaded content needs time to render after scroll triggers it |
| What if target never exists? | The `if (!found)` block logs a message — test doesn't crash (soft fail) |

---

## Code 3: Lazy Loading Images (Real Site)

### What it does
Verifies that images using the `loading="lazy"` attribute actually load correctly when scrolled into view on Pixabay.

### Key Logic
```
find lazy images → loop → scrollIntoView → wait → evaluate(el.complete && el.naturalWidth > 0)
```

- **`loading="lazy"`** — browser attribute that defers image loading until near viewport
- **`el.complete`** — browser property: `true` when image has finished loading
- **`el.naturalWidth > 0`** — confirms the image actually rendered (not broken/empty)
- **Fallback selector** — if `img[loading="lazy"]` finds nothing, tries `.results img` instead

### Interview Q&A
| Question | Answer |
|---|---|
| What is lazy loading? | Images only load when they're about to enter the viewport, saving bandwidth |
| How do you verify an image loaded? | `el.complete && el.naturalWidth > 0` — both must be true |
| What does `naturalWidth === 0` mean? | Image is broken or src is invalid |
| Why test only `Math.min(count, 10)`? | Limits test runtime — no need to check all 100+ images |

---

## Code 4: Self-Hosted Lazy Image Page (Most Reliable)

### What it does
Injects a custom HTML page directly into Playwright (no server needed), then tests lazy image loading on it — 100% controlled and reliable.

### Key Logic
```
page.setContent(html) → find lazy images → scrollIntoView → verify load
```

- **`page.setContent()`** — injects raw HTML directly into the browser; no URL/server required
- **`loading="eager"` vs `loading="lazy"`** — first image loads immediately; rest wait for scroll
- **`spacer` div** — pushes lazy images below the viewport so they're genuinely off-screen at start
- **`picsum.photos`** — free placeholder image service

### Why this is the "BEST" approach
| Problem with real sites | `setContent` solution |
|---|---|
| Site may change selectors | You control the HTML |
| Network/CDN issues | Images from reliable source |
| Anti-bot blocking | No external dependency |
| Flaky lazy load behavior | You define exactly what's lazy/eager |

### Interview Q&A
| Question | Answer |
|---|---|
| When would you use `page.setContent()`? | Testing UI behavior without depending on a live website |
| Why add a spacer div? | Forces lazy images off-screen so the browser actually defers loading |
| What's the difference between eager and lazy loading? | `eager` loads immediately; `lazy` loads only when near viewport |
| Why is this test "100% reliable"? | No network dependency, no changing selectors, full control over HTML |

---

## Key Concepts to Mention in Any Interview

> **Lazy Loading** → browser defers loading off-screen resources until needed

> **`page.evaluate()`** → bridge between Playwright and real browser JavaScript

> **`el.complete && el.naturalWidth > 0`** → the gold standard image load check

> **`Set()` for deduplication** → cleaner than manual duplicate checks in arrays

> **Safety limits (MAX_SCROLLS, size > 100)** → always protect while loops from running forever
