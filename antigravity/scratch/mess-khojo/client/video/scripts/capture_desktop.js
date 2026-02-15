const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

const OUTPUT_DIR = path.join(__dirname, "../public");

async function capture() {
    console.log("Starting verification capture...");
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: "new",
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
            defaultViewport: {
                width: 1920,
                height: 1080,
                deviceScaleFactor: 1,
            }
        });

        const page = await browser.newPage();

        // Capture browser console logs
        page.on('console', msg => console.log('PAGE LOG:', msg.text()));

        // 1. Home Page Verification
        console.log("Navigating to Home...");
        await page.goto("http://[::1]:5173", { waitUntil: "domcontentloaded", timeout: 60000 });
        await page.screenshot({ path: path.join(OUTPUT_DIR, "preview_desktop.png") });
        console.log("Captured Home.");

        // 2. Search Input Verification
        console.log("Testing Search Input...");
        // Wait for search input (desktop)
        const searchSelector = 'input[placeholder="Search by mess name..."]';
        try {
            await page.waitForSelector(searchSelector, { timeout: 10000 });
            await page.type(searchSelector, "Test Query");
            await new Promise(r => setTimeout(r, 500)); // Wait for React state update
            await page.screenshot({ path: path.join(OUTPUT_DIR, "search_input_active.png") });
            console.log("Captured Search Input (should show 'X').");
        } catch (e) {
            console.log("Search input not found or error:", e.message);
        }

        // 3. Scroll Position Verification
        console.log("Testing Mess Details Scroll...");
        try {
            console.log("Waiting for mess cards...");
            // Debug: Take a screenshot to see what's happening
            await new Promise(r => setTimeout(r, 5000)); // Wait 5s for any loading
            await page.screenshot({ path: path.join(OUTPUT_DIR, "debug_home_messes.png") });
            const html = await page.content();
            fs.writeFileSync(path.join(OUTPUT_DIR, "debug_home.html"), html);

            const cardSelector = 'a[href^="/mess/"]';
            await page.waitForSelector(cardSelector, { timeout: 10000 });
            const cards = await page.$$(cardSelector);
            if (cards.length > 0) {
                // Scroll down first to ensure we are not at top
                await page.evaluate(() => window.scrollTo(0, 500));

                console.log("Clicking mess card...");
                await Promise.all([
                    page.waitForNavigation({ waitUntil: "networkidle0" }),
                    cards[0].click()
                ]);

                // Check scroll position
                const scrollY = await page.evaluate(() => window.scrollY);
                console.log(`Mess Details Scroll Y: ${scrollY}`);
                await page.screenshot({ path: path.join(OUTPUT_DIR, "mess_details_top.png") });

                if (scrollY === 0) {
                    console.log("PASS: Page is at the top.");
                } else {
                    console.log("FAIL: Page is NOT at the top.");
                }
            } else {
                console.log("No mess cards found to click.");
            }
        } catch (e) {
            console.log("Error navigating to mess details:", e.message);
        }

    } catch (err) {
        console.error("Error capturing:", err);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

capture();
