/**
 * SETUP SCRIPT: Run this ONCE to warm up the Chrome profile.
 * 
 * This opens Alibaba in a visible browser. If a CAPTCHA appears,
 * solve it manually. The cookies will be saved to .chrome-profile/
 * so the bot won't get CAPTCHAs on future runs.
 * 
 * Usage: node setup-browser.js
 */

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const path = require('path');
const fs = require('fs');

puppeteer.use(StealthPlugin());

const PROFILE_DIR = path.join(__dirname, '.chrome-profile');

async function setup() {
    console.log('===========================================');
    console.log('  ALIBABA BROWSER PROFILE SETUP');
    console.log('===========================================');
    console.log('');
    console.log('This will open a Chrome browser with Alibaba.');
    console.log('If you see a CAPTCHA, solve it manually.');
    console.log('The browser session will be saved for the bot.');
    console.log('');

    if (!fs.existsSync(PROFILE_DIR)) {
        fs.mkdirSync(PROFILE_DIR, { recursive: true });
    }

    const browser = await puppeteer.launch({
        headless: false,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--window-size=1366,900',
            '--disable-blink-features=AutomationControlled',
        ],
        userDataDir: PROFILE_DIR,
        defaultViewport: null,
        ignoreDefaultArgs: ['--enable-automation'],
    });

    const page = await browser.newPage();

    await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
    );

    await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });

    console.log('Opening Alibaba homepage...');
    await page.goto('https://www.alibaba.com/', {
        waitUntil: 'domcontentloaded',
        timeout: 60000
    });

    // Check for CAPTCHA
    await new Promise(r => setTimeout(r, 3000));
    const content = await page.content();

    if (content.includes('unusual traffic') || content.includes('slide to verify')) {
        console.log('');
        console.log('⚠️  CAPTCHA DETECTED!');
        console.log('👉  Please solve it in the browser window.');
        console.log('    The script will wait for you...');
        console.log('');

        // Wait until CAPTCHA is gone (poll every 3 seconds, up to 2 minutes)
        const start = Date.now();
        while (Date.now() - start < 120000) {
            await new Promise(r => setTimeout(r, 3000));
            const c = await page.content();
            if (!c.includes('unusual traffic') && !c.includes('slide to verify')) {
                console.log('✅ CAPTCHA solved! Session saved.');
                break;
            }
        }
    } else {
        console.log('✅ No CAPTCHA! Alibaba loaded successfully.');
    }

    // Browse a bit to make the session look real
    console.log('Browsing Alibaba to warm up session...');
    await new Promise(r => setTimeout(r, 2000));

    try {
        await page.goto('https://www.alibaba.com/trade/search?SearchText=jewelry+wholesale', {
            waitUntil: 'domcontentloaded',
            timeout: 30000
        });
        await new Promise(r => setTimeout(r, 3000));
    } catch (e) {
        console.log('Search page navigation skipped:', e.message);
    }

    console.log('');
    console.log('===========================================');
    console.log('  ✅ SETUP COMPLETE!');
    console.log('  Browser profile saved to .chrome-profile/');
    console.log('  The bot should now work without CAPTCHAs.');
    console.log('===========================================');
    console.log('');
    console.log('Closing browser in 5 seconds...');
    await new Promise(r => setTimeout(r, 5000));

    await browser.close();
    process.exit(0);
}

setup().catch(err => {
    console.error('Setup failed:', err);
    process.exit(1);
});
