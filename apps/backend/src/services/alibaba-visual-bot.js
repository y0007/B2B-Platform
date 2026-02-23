const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const path = require('path');
const fs = require('fs');

puppeteer.use(StealthPlugin());

// Persistent browser profile directory — cookies/sessions persist across runs
const PROFILE_DIR = path.join(__dirname, '../../.chrome-profile');
const UPLOADS_DIR = path.join(__dirname, '../../uploads');

// Singleton browser instance shared across requests to avoid expensive startup costs.
let _browser = null;

/**
 * Ensures a single browser instance is running.
 */
async function getBrowser() {
    if (_browser && _browser.connected) {
        return _browser;
    }

    console.log('[Bot] Initializing singleton browser instance...');

    // Ensure profile directory exists
    if (!fs.existsSync(PROFILE_DIR)) {
        fs.mkdirSync(PROFILE_DIR, { recursive: true });
    }

    const launchOptions = {
        headless: 'new', // Run invisibly in the background
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--window-size=1366,900',
            '--disable-blink-features=AutomationControlled',
            '--use-fake-ui-for-media-stream',
            '--use-fake-device-for-media-stream',
            '--disable-gpu',
            '--disable-dev-shm-usage', // CRITICAL for Docker containers
        ],
        userDataDir: PROFILE_DIR,
        defaultViewport: { width: 1366, height: 900 },
        ignoreDefaultArgs: ['--enable-automation'],
    };

    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
        console.log(`[Bot] Using system Chromium: ${process.env.PUPPETEER_EXECUTABLE_PATH}`);
        launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
    }

    _browser = await puppeteer.launch(launchOptions);

    _browser.on('disconnected', () => {
        console.log('[Bot] Browser disconnected.');
        _browser = null;
    });

    return _browser;
}

/**
 * Closes the global browser instance if it exists.
 */
async function closeBot() {
    if (_browser) {
        await _browser.close();
        _browser = null;
    }
}

/**
 * Perform a visual search on Alibaba using a shared browser instance.
 * 
 * @param {string} imagePath - Absolute path to the image file.
 * @returns {Promise<Array>} - Product results from visual search.
 */
async function searchByImage(imagePath) {
    console.log(`[Bot] Starting Alibaba visual search for: ${imagePath}`);

    if (!fs.existsSync(imagePath)) {
        throw new Error(`Image file not found: ${imagePath}`);
    }

    const browser = await getBrowser();
    let page;

    try {
        console.log('[Bot] Opening new browser page...');
        page = await browser.newPage();

        // ================================================================
        // PERFORMANCE OPTIMIZATION: Resource Blocking
        // ================================================================
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            const type = req.resourceType();
            const url = req.url().toLowerCase();

            // Block fonts, ads, tracking, and analytics to speed up load
            if (
                type === 'font' ||
                url.includes('google-analytics') ||
                url.includes('doubleclick') ||
                url.includes('facebook.com') ||
                url.includes('adsystem') ||
                url.includes('tracking')
            ) {
                req.abort();
            } else {
                req.continue();
            }
        });

        // Pass browser logs to Node console
        page.on('console', msg => {
            const text = msg.text();
            if (text.includes('[Bot-JS]')) console.log(`${text}`);
        });

        // Set a believable user agent
        await page.setUserAgent(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
        );

        // Remove webdriver flag to avoid detection
        await page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => false });
        });

        // Auto-dismiss popups/dialogs
        page.on('dialog', async dialog => {
            console.log(`[Bot] Dialog: "${dialog.message()}"`);
            await dialog.dismiss();
        });

        // ================================================================
        // STEP 1: Navigate to Alibaba
        // ================================================================
        console.log('[Bot] Navigating to alibaba.com...');
        await page.goto('https://www.alibaba.com/', {
            waitUntil: 'domcontentloaded', // Faster than networkidle2
            timeout: 45000
        });

        // ================================================================
        // STEP 2: Handle CAPTCHA and wait for load
        // ================================================================
        await checkAndHandleCaptcha(page);

        // Wait specifically for search bar instead of a fixed delay
        await page.waitForSelector('input[name="SearchText"]', { timeout: 10000 }).catch(() => { });

        // ================================================================
        // STEP 3: Camera Icon & File Upload
        // ================================================================
        console.log('[Bot] Step 3: Locating camera icon...');
        let fileInput = await findFileInput(page);

        if (!fileInput) {
            console.log('[Bot] No direct input found. Attemping camera click...');
            for (let i = 0; i < 2; i++) {
                const clicked = await clickCameraIcon(page);
                if (clicked) {
                    // Short wait for the upload modal/input to appear
                    await page.waitForSelector('input[type="file"]', { timeout: 5000 }).catch(() => { });
                    fileInput = await findFileInput(page);
                    if (fileInput) break;
                }
                await humanDelay(1000, 2000);
            }
        }

        // FALLBACK: If still no file input, try the 'Trade Search' page
        if (!fileInput) {
            console.log('[Bot] ⚠️ Still no upload icon. Navigating to layout with search bar...');
            await page.goto('https://www.alibaba.com/trade/search?SearchText=image+search', {
                waitUntil: 'domcontentloaded',
                timeout: 30000
            });
            await checkAndHandleCaptcha(page);

            for (let i = 0; i < 2; i++) {
                const cameraClicked = await clickCameraIcon(page);
                if (cameraClicked) {
                    await page.waitForSelector('input[type="file"]', { timeout: 5000 }).catch(() => { });
                    fileInput = await findFileInput(page);
                    if (fileInput) break;
                }
                await humanDelay(1000, 2000);
            }
        }

        if (!fileInput) {
            const errPath = path.join(UPLOADS_DIR, 'bot-upload-fail.png');
            await page.screenshot({ path: errPath });
            throw new Error('FAILED TO TRIGGER IMAGE UPLOAD. Check bot-upload-fail.png.');
        }

        // ================================================================
        // STEP 4: Upload the image
        // ================================================================
        console.log('[Bot] Step 4: Uploading the file...');
        await fileInput.uploadFile(imagePath);

        // Wait for results: use a fast content-based detection
        console.log('[Bot] File uploaded. Waiting for results...');

        // Wait for product content markers ("Chat now", "Add to cart") which appear on every result card
        try {
            await page.waitForFunction(
                () => {
                    const text = document.body.innerText || '';
                    return text.includes('Chat now') || text.includes('Add to cart') || text.includes('Min. order');
                },
                { timeout: 25000 }
            );
            console.log('[Bot] Product content detected on page!');
        } catch (e) {
            console.log('[Bot] Content wait timed out. Attempting parse anyway...');
        }

        // Brief settle for images to load
        await humanDelay(800, 1200);

        // Check for CAPTCHA on results page
        await checkAndHandleCaptcha(page);

        // ================================================================
        // STEP 5: Parse the results
        // ================================================================
        console.log('[Bot] Parsing search results...');
        let products = [];

        // Attempt parsing with a few retries if frame issues occur
        for (let attempt = 1; attempt <= 2; attempt++) {
            try {
                products = await parseResults(page);
                if (products.length > 0) break;
                console.log(`[Bot] Parse attempt ${attempt} returned 0 results. Retrying...`);
                await humanDelay(2000, 3000);
            } catch (parseErr) {
                console.log(`[Bot] Parse attempt ${attempt} failed: ${parseErr.message}`);
                if (attempt === 2) throw parseErr;
                await humanDelay(2000, 3000);
            }
        }

        console.log(`[Bot] ✅ Found ${products.length} visual matches!`);
        return products;


    } catch (error) {
        console.error('[Bot] ❌ Error:', error.message);
        throw error;
    } finally {
        if (page) {
            console.log('[Bot] Closing page...');
            await page.close().catch(() => { });
        }
    }
}


// =====================================================================
// HELPER: Check for and handle Alibaba's slide CAPTCHA
// =====================================================================
async function checkAndHandleCaptcha(page) {
    const pageContent = await page.content();
    const hasCaptcha = pageContent.includes('unusual traffic') ||
        pageContent.includes('slide to verify') ||
        pageContent.includes('slidetounlock') ||
        pageContent.includes('noCaptcha');

    if (!hasCaptcha) return false;

    console.log('[Bot] ⚠️ CAPTCHA detected! Attempting to solve slide captcha...');

    // Try to find the slider element and drag it
    const sliderSolved = await trySlideCaptha(page);

    if (sliderSolved) {
        console.log('[Bot] ✅ Slide CAPTCHA solved automatically!');
        await humanDelay(3000, 5000);
        return true;
    }

    // If auto-solve failed, wait for user to solve it manually
    console.log('[Bot] ⏳ Could not auto-solve CAPTCHA. Waiting for you to solve it manually...');
    console.log('[Bot] 👉 Please solve the CAPTCHA in the browser window. You have 60 seconds.');

    // Poll until CAPTCHA is gone or timeout
    const startTime = Date.now();
    const TIMEOUT = 60000; // 60 seconds for manual solve

    while (Date.now() - startTime < TIMEOUT) {
        await humanDelay(2000, 3000);
        const content = await page.content();
        if (!content.includes('unusual traffic') && !content.includes('slide to verify')) {
            console.log('[Bot] ✅ CAPTCHA solved! Continuing...');
            return true;
        }
    }

    console.log('[Bot] ⚠️ CAPTCHA timeout. Proceeding anyway...');
    return true;
}

// =====================================================================
// HELPER: Try to automatically solve the slide CAPTCHA
// =====================================================================
async function trySlideCaptha(page) {
    try {
        // Common Alibaba CAPTCHA slider selectors
        const sliderSelectors = [
            '#nc_1_n1z',             // Common Alibaba slider handle
            '.nc_iconfont.btn_slide', // Slider button
            '#nc_1_n1t',             // Slider track
            '.btn_slide',
            '.slider-btn',
            '[data-role="slider"]',
            '.nc-container .btn_slide',
            'span.nc_iconfont',
            '#nocaptcha .nc_scale span',
            '.nc_bg_pannel .btn_slide'
        ];

        let slider = null;
        for (const sel of sliderSelectors) {
            slider = await page.$(sel);
            if (slider) {
                const box = await slider.boundingBox();
                if (box && box.width > 0) {
                    console.log(`[Bot] Found slider: ${sel}`);
                    break;
                }
                slider = null;
            }
        }

        if (!slider) {
            // Try a broader search
            slider = await page.evaluateHandle(() => {
                const candidates = document.querySelectorAll('span, div, button');
                for (const el of candidates) {
                    const cls = (el.className || '').toString().toLowerCase();
                    const style = window.getComputedStyle(el);
                    if ((cls.includes('slide') || cls.includes('drag') || cls.includes('btn')) &&
                        el.offsetWidth > 20 && el.offsetWidth < 80 &&
                        el.offsetHeight > 20 && el.offsetHeight < 60 &&
                        style.cursor === 'pointer') {
                        return el;
                    }
                }
                return null;
            });

            if (!slider || !(await slider.boundingBox())) {
                console.log('[Bot] No slider element found.');
                return false;
            }
        }

        const box = await slider.boundingBox();
        if (!box) return false;

        // Simulate human-like drag: start from slider center, drag to the right
        const startX = box.x + box.width / 2;
        const startY = box.y + box.height / 2;
        const dragDistance = 300; // Drag 300px to the right

        console.log(`[Bot] Dragging slider from (${startX}, ${startY}) → distance: ${dragDistance}px`);

        await page.mouse.move(startX, startY);
        await humanDelay(200, 400);
        await page.mouse.down();
        await humanDelay(100, 200);

        // Drag in small increments to look human
        const steps = 25 + Math.floor(Math.random() * 10);
        for (let i = 1; i <= steps; i++) {
            const progress = i / steps;
            // Use easing function for natural movement
            const eased = easeOutCubic(progress);
            const x = startX + dragDistance * eased;
            const y = startY + (Math.random() * 2 - 1); // Tiny Y jitter
            await page.mouse.move(x, y);
            await humanDelay(10, 30);
        }

        await humanDelay(100, 200);
        await page.mouse.up();
        await humanDelay(1000, 2000);

        // Check if CAPTCHA is solved
        const content = await page.content();
        if (!content.includes('unusual traffic') && !content.includes('slide to verify')) {
            return true;
        }

        console.log('[Bot] Slide attempt did not solve CAPTCHA.');
        return false;

    } catch (err) {
        console.log(`[Bot] Slide CAPTCHA error: ${err.message}`);
        return false;
    }
}

// =====================================================================
// HELPER: Find file input on the page (including hidden ones)
// =====================================================================
async function findFileInput(page) {
    console.log('[Bot] Searching for file input...');

    // 1. Look for known selectors
    const selectors = [
        'input[type="file"]',
        'input[accept*="image"]',
        '.upload-container input',
        '#image-upload-input',
        '.image-search-input',
        'input[data-role="upload-input"]'
    ];

    for (const sel of selectors) {
        try {
            const fi = await page.$(sel);
            if (fi) {
                console.log(`[Bot] Found file input with selector: ${sel}`);
                return fi;
            }
        } catch (e) { /* ignore */ }
    }

    // 2. Search in iframes
    const frames = page.frames();
    for (const frame of frames) {
        try {
            const fi = await frame.$('input[type="file"]');
            if (fi) {
                console.log(`[Bot] Found file input in iframe: ${frame.url()}`);
                return fi;
            }
        } catch (e) { /* cross-domain */ }
    }

    // 3. Brute force JS check
    return await page.evaluateHandle(() => {
        const inputs = Array.from(document.querySelectorAll('input[type="file"]'));
        if (inputs.length > 0) return inputs[0];
        // Look for any input that looks like an image upload
        const imgInput = Array.from(document.querySelectorAll('input')).find(i =>
            (i.getAttribute('accept') || '').includes('image') ||
            (i.id || '').includes('upload') ||
            (i.className || '').includes('upload')
        );
        return imgInput || null;
    }).then(h => h.asElement());
}

// =====================================================================
// HELPER: Click the camera/image-search icon
// =====================================================================
async function clickCameraIcon(page) {
    console.log('[Bot] Attempting to click camera/image-search icon...');

    // Selectors for both Homepage and Trade Search page layouts
    const selectors = [
        // Trade Search bar (seen in your screenshot)
        '.ui-searchbar-img-search-icon',
        'div[data-role="image-search-btn"]',
        '.search-visual-icon',
        // General/Fallback
        'i[class*="camera"]',
        'span[class*="camera"]',
        'button[class*="camera"]',
        '.camera-icon',
        '[aria-label*="image" i]',
        'div[title*="image" i]',
        // Text based
        '//div[contains(., "Image Search")]',
        '//span[contains(., "Image Search")]'
    ];

    for (const sel of selectors) {
        try {
            let el;
            if (sel.startsWith('//')) {
                const matches = await page.$$(`::-p-xpath(${sel})`);
                el = matches[0];
            } else {
                el = await page.$(sel);
            }

            if (el) {
                const box = await el.boundingBox();
                if (box && box.width > 2 && box.height > 2) {
                    console.log(`[Bot] Clicking camera icon found with: ${sel}`);
                    // Ensure it's in view
                    await page.evaluate(e => e.scrollIntoView({ block: 'center' }), el);
                    await humanDelay(500, 1000);
                    await el.click();
                    return true;
                }
            }
        } catch (e) { /* ignore */ }
    }

    // Brute force pixel-based search around the search bar
    console.log('[Bot] Selectors failed. Brute force click near search bar...');
    const result = await page.evaluate(() => {
        const bar = document.querySelector('input[name="SearchText"]') || document.querySelector('.ui-searchbar-main');
        if (!bar) return false;
        const barRect = bar.getBoundingClientRect();
        // Look for any icon/button element strictly inside or adjacent to the search bar
        const area = document.elementsFromPoint(barRect.right - 10, barRect.top + barRect.height / 2);
        for (const el of area) {
            if (el !== bar && (el.tagName === 'DIV' || el.tagName === 'SPAN' || el.tagName === 'I')) {
                el.click();
                return true;
            }
        }
        return false;
    });

    return result;
}

// =====================================================================
// HELPER: Parse product results from the page
// =====================================================================
async function parseResults(page) {
    console.log('[Bot] Starting result parsing...');

    // 1. Quick CSS selector check (3s max — don't block if these selectors miss)
    const allSelectors = [
        '.image-search-product-item', '.image-search-product-card',
        '.pc-items-item', '.h-search-result-item',
        '.m-gallery-product-item-v2', '.search-card-item',
        '.J-offer-wrapper', '[data-content="productItem"]'
    ];

    try {
        await page.waitForSelector(allSelectors.join(','), { visible: true, timeout: 3000 });
        console.log('[Bot] Product cards detected via CSS selector.');
    } catch (e) {
        console.log('[Bot] CSS miss (expected). Using marker-based parser...');
    }

    // 2. Quick scroll to trigger lazy loading of images
    await page.evaluate(() => window.scrollBy(0, 400));

    return await page.evaluate(() => {
        const results = [];

        // STRATEGY 1: CSS selector-based detection
        const detectors = [
            '.image-search-product-card', '.image-search-product-item',
            '.pc-items-item', '.h-search-result-item',
            '[class*="search-result-item"]', '.m-gallery-product-item-v2',
            '.organic-list .list-no-v2-main__item', '.search-card-item',
            '.gallery-card-layout-item', '.J-offer-wrapper',
            '[data-content="productItem"]', '.app-organic-search-card', '.list-item'
        ];

        let cards = [];
        for (const s of detectors) {
            const found = document.querySelectorAll(s);
            if (found.length >= 2) {
                cards = Array.from(found);
                console.log(`[Bot-JS] Strategy 1: Detected ${cards.length} cards via ${s}`);
                break;
            }
        }

        // STRATEGY 2: Content marker fallback ("Chat now", "Add to cart", price symbols)
        if (cards.length === 0) {
            console.log('[Bot-JS] Strategy 2: Scanning for content markers...');
            cards = Array.from(document.querySelectorAll('div')).filter(el => {
                const text = el.innerText || '';
                const isProduct = text.includes('Chat now') || text.includes('Add to cart') || (text.includes('Pieces') && text.match(/[₹\$]/));
                const rect = el.getBoundingClientRect();
                return isProduct && rect.width > 50 && rect.height > 80 && rect.width < 800;
            });
            console.log(`[Bot-JS] Strategy 2: Found ${cards.length} candidates.`);
        }

        // STRATEGY 3: Link-based detection (product detail URLs)
        if (cards.length === 0) {
            console.log('[Bot-JS] Strategy 3: Trying link-based detection...');
            const productLinks = Array.from(document.querySelectorAll('a[href*="/product-detail/"], a[href*="offer/"]'));
            if (productLinks.length > 0) {
                cards = productLinks.map(a => a.closest('div[class]') || a.parentElement).filter(Boolean);
                cards = [...new Set(cards)];
                console.log(`[Bot-JS] Strategy 3: Found ${cards.length} candidates.`);
            }
        }

        // DATA EXTRACTION
        cards.forEach((card, index) => {
            if (index >= 10) return;
            try {
                // Image
                let imgUrl = '';
                const imgs = Array.from(card.querySelectorAll('img'));
                for (const img of imgs) {
                    const src = img.src || img.dataset.src || img.getAttribute('data-image') || img.getAttribute('image-src');
                    if (src && src.includes('alicdn') && !src.includes('flag') && !src.includes('icon')) {
                        imgUrl = src; break;
                    }
                }
                if (!imgUrl && imgs[0]) imgUrl = imgs[0].src;

                // Title
                let title = '';
                const titleEls = card.querySelectorAll('.title, .name, [class*="title"], [class*="name"], h2, h3, h4');
                for (const t of titleEls) {
                    if (t.innerText.trim().length > 10) { title = t.innerText.trim(); break; }
                }
                if (!title) {
                    const lines = card.innerText.split('\n').map(l => l.trim()).filter(l => l.length > 20);
                    title = lines[0] || 'Alibaba Product';
                }

                // Price
                const text = card.innerText || '';
                const priceMatch = text.match(/([\$₹£€]\s*[\d,]+(?:\.\d+)?)/);
                const priceValue = priceMatch ? priceMatch[0] : 'Negotiable';

                // MOQ
                const moqMatch = text.match(/(\d+)\s+Piece/i) || text.match(/MOQ:\s*(\d+)/i) || text.match(/order:\s*(\d+)/i);
                const moqValue = moqMatch ? moqMatch[0] : '1 Piece';

                // Link
                const a = card.querySelector('a') || (card.tagName === 'A' ? card : null);
                const linkUrl = a ? a.href : '';

                if (imgUrl && title) {
                    results.push({
                        name: title.substring(0, 150),
                        link: linkUrl,
                        image_url: imgUrl.replace(/_\d+x\d+\.(jpg|png|webp|gif).*$/i, ''),
                        price_range: priceValue,
                        moq: moqValue,
                        source: 'ALIBABA_VISUAL',
                        similarity_score: parseFloat((0.98 - (index * 0.05)).toFixed(2)),
                        id: `ali-vis-${Date.now()}-${index}`
                    });
                }
            } catch (e) {
                console.log(`[Bot-JS] Parse error card ${index}: ${e.message}`);
            }
        });

        console.log(`[Bot-JS] Extracted ${results.length} items total.`);
        return results;
    });
}


// =====================================================================
// UTILITIES
// =====================================================================

/** Human-like random delay between min and max ms */
function humanDelay(min, max) {
    const ms = min + Math.floor(Math.random() * (max - min));
    return new Promise(resolve => setTimeout(resolve, ms));
}

/** Easing function for natural-looking mouse movement */
function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
}

module.exports = { searchByImage, initBot: getBrowser, closeBot };

