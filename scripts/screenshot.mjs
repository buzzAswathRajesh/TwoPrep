import { chromium } from "playwright";

const BASE = "http://localhost:5173";
const browser = await chromium.launch();

// Desktop pass
const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });

await page.goto(BASE, { waitUntil: "networkidle" });
await page.screenshot({ path: "scripts/shots/01-dashboard-empty.png" });

await page.goto(`${BASE}/#/bank`, { waitUntil: "networkidle" });
await page.screenshot({ path: "scripts/shots/02-question-bank.png", fullPage: true });

// Start a practice session from the bank
await page.click("button:has-text('Hard')");
await page.click("button:has-text('Practice')");
await page.waitForSelector("text=Question 1 of");
await page.screenshot({ path: "scripts/shots/03-practice-question.png" });

await page.click("[data-testid='choice-A']");
await page.screenshot({ path: "scripts/shots/04-practice-selected.png" });

await page.click("button:has-text('Submit Answer')");
await page.waitForSelector("text=Correct Answer:");
await page.screenshot({ path: "scripts/shots/05-practice-feedback.png" });

await page.goto(`${BASE}/#/build`, { waitUntil: "networkidle" });
await page.screenshot({ path: "scripts/shots/06-build-test.png", fullPage: true });

await page.goto(`${BASE}/#/performance`, { waitUntil: "networkidle" });
await page.screenshot({ path: "scripts/shots/07-performance.png", fullPage: true });

await page.goto(`${BASE}/#/mistakes`, { waitUntil: "networkidle" });
await page.screenshot({ path: "scripts/shots/08-mistakes.png" });

// Play through a full 5-question test to get a populated dashboard + results page
await page.goto(`${BASE}/#/build`, { waitUntil: "networkidle" });
await page.click("text=Command of Evidence >> nth=0");
await page.click("button:has-text('5')");
await page.click("button:has-text('Start Practice Test')");
await page.waitForSelector("text=Question 1 of 5");
for (let i = 0; i < 5; i++) {
  await page.click(`[data-testid='choice-${"ABCD"[i % 4]}']`);
  await page.click("button:has-text('Submit Answer')");
  await page.waitForTimeout(150);
  const finishBtn = page.locator("button:has-text('Finish & See Results')");
  const nextBtn2 = page.locator("button:has-text('Next Question')");
  if (await finishBtn.count()) await finishBtn.click();
  else await nextBtn2.click();
  await page.waitForTimeout(150);
}
await page.waitForSelector("text=Practice Complete");
await page.screenshot({ path: "scripts/shots/09-results.png", fullPage: true });

await page.goto(`${BASE}/#/`, { waitUntil: "networkidle" });
await page.screenshot({ path: "scripts/shots/10-dashboard-populated.png", fullPage: true });

await page.goto(`${BASE}/#/mistakes`, { waitUntil: "networkidle" });
await page.screenshot({ path: "scripts/shots/11-mistakes-populated.png", fullPage: true });

await page.close();

// Mobile pass
const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
await mobile.goto(BASE, { waitUntil: "networkidle" });
await mobile.screenshot({ path: "scripts/shots/m1-dashboard.png", fullPage: true });

await mobile.goto(`${BASE}/#/bank`, { waitUntil: "networkidle" });
await mobile.screenshot({ path: "scripts/shots/m2-bank.png", fullPage: true });

await mobile.click("button:has-text('Practice')");
await mobile.waitForSelector("text=Question 1 of");
await mobile.screenshot({ path: "scripts/shots/m3-practice.png", fullPage: true });

await browser.close();
console.log("done");
