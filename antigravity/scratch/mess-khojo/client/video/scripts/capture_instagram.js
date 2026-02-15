const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

const OUTPUT_DIR = path.join(__dirname, "../public/screenshots-instagram");

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR);
}

const LOG_FILE = path.join(__dirname, "capture.log");
// Clear log file
fs.writeFileSync(LOG_FILE, "");

function log(msg) {
    console.log(msg);
    fs.appendFileSync(LOG_FILE, msg + "\n");
}

async function capture() {
    log("Starting capture process at " + new Date().toISOString());
    let browser;
    try {
        log("Launching browser...");
        browser = await puppeteer.launch({
            headless: "new",
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
            dumpio: true, // Log browser output
            defaultViewport: {
                width: 390,
                height: 844,
                deviceScaleFactor: 3,
                isMobile: true,
                hasTouch: true
            }
        });
        log("Browser launched successfully.");

        const page = await browser.newPage();
        log("New page created.");

        await page.setUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 14_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1");

        // Use IPv6 localhost
        log("Navigating to http://[::1]:5173...");
        try {
            await page.goto("http://[::1]:5173", { waitUntil: "domcontentloaded", timeout: 30000 });
            log("Navigation complete.");
        } catch (e) {
            log("Navigation failed or timed out: " + e);
            throw e;
        }

        // Wait for root
        try {
            await page.waitForSelector("#root", { timeout: 10000 });
            log("Root selector found.");
        } catch (e) {
            log("Root selector wait timeout, continuing...");
        }

        // Wait for animations/data
        await new Promise(r => setTimeout(r, 4000));

        log("Capturing Home...");
        await page.screenshot({ path: path.join(OUTPUT_DIR, "1_home.png") });

        // Scroll to 6th mess card
        log("Scrolling to 6th mess card...");
        await page.evaluate(() => {
            window.scrollTo({ top: 1800, behavior: 'smooth' });
        });
        await new Promise(r => setTimeout(r, 2000));
        await page.screenshot({ path: path.join(OUTPUT_DIR, "2_home_scrolled.png") });

        // Click the 6th mess card
        log("Clicking a Mess Card...");
        const messCardFound = await page.evaluate(() => {
            const links = Array.from(document.querySelectorAll("a[href^='/mess/']"));
            const target = links.length >= 6 ? links[5] : links[links.length - 1];

            if (target) {
                target.scrollIntoView({ behavior: "smooth", block: "center" });
                target.click();
                return true;
            }
            return false;
        });

        if (messCardFound) {
            log("Mess Card found, clicking...");
            await new Promise(r => setTimeout(r, 4000)); // Wait for navigation

            log("Capturing Details (Mess Page)...");
            await page.screenshot({ path: path.join(OUTPUT_DIR, "3_details.png") });

            // On Mess Details, need to find a Room Group and click it
            log("Looking for Room Groups...");
            const groupClicked = await page.evaluate(() => {
                // Determine logic to find room group header
                // Based on RoomTypeGroup: 
                // <h3 className="text-xl font-bold text-brand-text-dark">{displayOccupancy} Seater Rooms</h3>
                // It is inside a div with onClick
                const headers = Array.from(document.querySelectorAll("h3"));
                const groupHeader = headers.find(h => h.innerText.includes("Seater Rooms"));

                if (groupHeader) {
                    // The click handler is on the parent container (grandparent likely)
                    // But clicking header should bubble up
                    groupHeader.scrollIntoView({ behavior: "smooth", block: "center" });
                    groupHeader.click();
                    return true;
                }
                return false;
            });

            if (groupClicked) {
                log("Room Group clicked, waiting for expansion...");
                await new Promise(r => setTimeout(r, 1000));

                // Now find a Room Card
                log("Looking for Room Card...");
                const roomCardClicked = await page.evaluate(() => {
                    const links = Array.from(document.querySelectorAll("a[href^='/room/']"));
                    const target = links[0]; // First room
                    if (target) {
                        target.scrollIntoView({ behavior: "smooth", block: "center" });
                        target.click();
                        return true;
                    }
                    return false;
                });

                if (roomCardClicked) {
                    log("Room Card clicked, waiting for navigation...");
                    await new Promise(r => setTimeout(r, 4000));

                    log("Capturing Room Details...");
                    // This is actually the "details" we want for the video flow mainly? 
                    // Or maybe we treat 3_details as mess details and this as "Booking" step?
                    // The user said: "show the mess details page for 2s, then open a room card and click the request call button"
                    // So:
                    // 3_details.png = Mess Details
                    // Action: Open room card (maybe we need a screenshot of opened room card list?)
                    // Action: Click Room Card
                    // Result: Room Details Page.

                    // I'll overwrite 3_details.png or create new ones?
                    // The video plan expects:
                    // 1_home, 2_home_scrolled, 3_details, 4_modal, 5_confirm.
                    // 3_details is supposed to be "Mess Details page" according to user request.
                    // But user also said "then open a room card".

                    // I will take a screenshot of the "Room Details" page and call it `3b_room_details.png` maybe?
                    // But InstagramVideo.tsx expects specific files.
                    // I'll stick to the plan but make `3_details.png` be the Mess Details page (captured above).
                    // I might need another screenshot for "Room List" or just jump to Room Details.
                    // Let's capture Room Details as `3b_room_details.png` but for now I'll use it as `4_modal` context? No.

                    // Actually, if I look at `InstagramVideo.tsx`:
                    // Sequence 3: Details Page (180-240 frames).
                    // Sequence 4: Click Room/Request (240-270). TouchIndicator at pos.

                    // I'll save Room Details as `3_details_room.png` and maybe update `InstagramVideo.tsx` to use it if needed.
                    // For now, I'll save it as `3_details_room.png` and proceed to click Request Call.

                    log("Capturing Room Details Page...");
                    await page.screenshot({ path: path.join(OUTPUT_DIR, "3_details_room.png") });

                    // Click Request Call / Check Availability
                    log("Looking for Request/Check Button...");
                    const buttonClicked = await page.evaluate(() => {
                        const buttons = Array.from(document.querySelectorAll("button"));
                        const targetBtn = buttons.find(b =>
                            b.innerText.toLowerCase().includes("request") ||
                            b.innerText.toLowerCase().includes("check availability")
                        );

                        if (targetBtn) {
                            targetBtn.scrollIntoView({ behavior: "smooth", block: "center" });
                            targetBtn.click();
                            return true;
                        }
                        return false;
                    });

                    if (buttonClicked) {
                        log("Button clicked, waiting for modal...");
                        await new Promise(r => setTimeout(r, 2000)); // Wait for modal
                        log("Capturing Modal...");
                        await page.screenshot({ path: path.join(OUTPUT_DIR, "4_modal.png") });

                        // Click Confirm in Modal
                        log("Clicking Confirm/Notify...");
                        await page.evaluate(() => {
                            const buttons = Array.from(document.querySelectorAll("button"));
                            const confirmBtn = buttons.find(b =>
                                b.innerText.toLowerCase().includes("confirm") ||
                                b.innerText.toLowerCase().includes("submit") ||
                                b.innerText.toLowerCase().includes("notify") ||
                                b.innerText.toLowerCase().includes("send")
                            );
                            if (confirmBtn) {
                                confirmBtn.click();
                            }
                        });

                        await new Promise(r => setTimeout(r, 1000));
                        log("Capturing After Confirm...");
                        await page.screenshot({ path: path.join(OUTPUT_DIR, "5_confirm.png") });

                    } else {
                        log("Request/Check button not found.");
                    }

                } else {
                    log("Room Card link not found.");
                }

            } else {
                log("Room Group header not found.");
            }

        } else {
            log("Mess card not found.");
        }

    } catch (err) {
        log("Error capturing: " + err);
    } finally {
        if (browser) {
            await browser.close();
            log("Done.");
        }
    }
}

capture();
