const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

const OUTPUT_DIR = path.join(__dirname, "../public/screenshots");

async function capture() {
    console.log("Launching browser...");
    const browser = await puppeteer.launch({
        headless: "new",
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
        defaultViewport: {
            width: 390,
            height: 844,
            deviceScaleFactor: 3,
            isMobile: true,
            hasTouch: true
        }
    });

    const page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 14_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1");

    try {
        // Use IPv6 localhost
        console.log("Navigating to http://[::1]:5173...");
        await page.goto("http://[::1]:5173", { waitUntil: "domcontentloaded", timeout: 60000 });

        // Wait for root or something visual
        try {
            await page.waitForSelector("#root", { timeout: 10000 });
        } catch (e) {
            console.log("Root selector wait timeout, continuing...");
        }

        // Wait for animations
        await new Promise(r => setTimeout(r, 4000));

        console.log("Capturing Home...");
        await page.screenshot({ path: path.join(OUTPUT_DIR, "home.png") });

        // Scroll
        console.log("Scrolling...");
        await page.evaluate(() => {
            window.scrollBy(0, 600);
        });
        await new Promise(r => setTimeout(r, 2000));
        await page.screenshot({ path: path.join(OUTPUT_DIR, "list.png") });

        // Click Mess Card
        console.log("Clicking Mess Card...");
        const cardFound = await page.evaluate(() => {
            const links = Array.from(document.querySelectorAll("a"));
            const messLink = links.find(l => l.getAttribute("href") && l.getAttribute("href").startsWith("/mess/"));
            if (messLink) {
                messLink.click();
                return true;
            }
            return false;
        });

        if (cardFound) {
            await new Promise(r => setTimeout(r, 3000));
            console.log("Capturing Details...");
            await page.screenshot({ path: path.join(OUTPUT_DIR, "details.png") });

            // Booking Button
            console.log("Looking for Booking Button...");
            const bookClicked = await page.evaluate(() => {
                const btns = Array.from(document.querySelectorAll("button"));
                const bookBtn = btns.find(b => b.textContent.toLowerCase().includes("book") || b.textContent.toLowerCase().includes("reserve"));
                if (bookBtn) {
                    bookBtn.click();
                    return true;
                }
                return false;
            });

            if (bookClicked) {
                await new Promise(r => setTimeout(r, 2000));
                console.log("Capturing Booking Modal...");
                await page.screenshot({ path: path.join(OUTPUT_DIR, "booking.png") });
            } else {
                console.log("Book button not found.");
            }
        } else {
            console.log("Mess card not found.");
        }

    } catch (err) {
        console.error("Error capturing:", err);
    } finally {
        await browser.close();
        console.log("Done.");
    }
}

capture();
