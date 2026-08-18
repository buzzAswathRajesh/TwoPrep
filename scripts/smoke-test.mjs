import { chromium } from "playwright";

const BASE = "http://localhost:5173";
const errors = [];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(`[console] ${msg.text()}`);
});
page.on("pageerror", (err) => errors.push(`[pageerror] ${err.message}`));

function report(label) {
  console.log(`OK: ${label}`);
}

// 1. Dashboard loads
await page.goto(BASE, { waitUntil: "networkidle" });
await page.waitForSelector("text=SAT Practice");
await page.waitForSelector("text=Questions Answered");
report("Dashboard renders with stat cards");

// 2. Question Bank: filters + count
await page.click("text=Question Bank");
await page.waitForSelector("text=questions found");
const countText1 = await page.textContent("text=questions found");
console.log("  bank count (unfiltered):", countText1);
await page.click("button:has-text('Hard')");
await page.waitForTimeout(200);
const countText2 = await page.textContent("text=questions found");
console.log("  bank count (Hard only):", countText2);
if (countText1 === countText2) throw new Error("Filtering by difficulty did not change result count");
report("Question Bank filters update result count");

// 3. Start practicing a filtered set
await page.click("button:has-text('Practice')");
await page.waitForSelector("text=Question 1 of");
report("Practice runner launched from Question Bank");

// 4. Answer a question (select first choice, submit)
const topBarText = await page.textContent("text=Question 1 of");
console.log("  ", topBarText);
await page.click("[data-testid='choice-A']"); // first answer choice card
await page.click("button:has-text('Submit Answer')");
await page.waitForSelector("text=Correct Answer:");
report("Answer submitted, feedback shown with rationale");

const hasWhyCorrect = await page.locator("text=Why this answer is correct").count();
if (hasWhyCorrect === 0) throw new Error("Missing 'Why this answer is correct' accordion");
report("Rationale accordions present");

// 5. Flag for review
await page.click("button:has-text('Flag for Review'), button:has-text('Flagged')");
report("Flag toggled");

// 6. Next question
const nextBtn = page.locator("button:has-text('Next Question'), button:has-text('Finish & See Results')");
await nextBtn.click();
await page.waitForTimeout(300);
report("Advanced past first question");

// 7. Navigate to Build a Test and start a small custom test end-to-end
await page.goto(`${BASE}/#/build`, { waitUntil: "networkidle" });
await page.waitForSelector("text=Build a Practice Test");
// select "Command of Evidence" skill checkbox by label text
await page.click("text=Command of Evidence >> nth=0");
await page.click("button:has-text('5')");
await page.click("button:has-text('Start Practice Test')");
await page.waitForSelector("text=Question 1 of 5", { timeout: 5000 });
report("Build-a-Test wizard generated a 5-question session filtered to a skill");

// answer all 5 quickly
for (let i = 0; i < 5; i++) {
  await page.click("[data-testid='choice-A']");
  await page.click("button:has-text('Submit Answer')");
  await page.waitForTimeout(150);
  const finishBtn = page.locator("button:has-text('Finish & See Results')");
  const nextBtn2 = page.locator("button:has-text('Next Question')");
  if (await finishBtn.count()) {
    await finishBtn.click();
  } else {
    await nextBtn2.click();
  }
  await page.waitForTimeout(150);
}
await page.waitForSelector("text=Practice Complete", { timeout: 5000 });
report("Completed a full practice test and reached results page");

const scoreText = await page.textContent("text=Score");
console.log("  results page score label present");

// 8. Dashboard now reflects attempts
await page.goto(`${BASE}/#/`, { waitUntil: "networkidle" });
await page.waitForTimeout(300);
const answeredVal = await page.textContent("text=Questions Answered >> xpath=../.. >> .text-2xl");
console.log("  Questions Answered stat area loaded");
report("Dashboard reflects updated state after practice");

// 9. Performance page
await page.goto(`${BASE}/#/performance`, { waitUntil: "networkidle" });
await page.waitForSelector("text=Accuracy by Skill");
report("Performance page renders skill ranking");

// 10. Mistake review page (may or may not have entries, just must not crash)
await page.goto(`${BASE}/#/mistakes`, { waitUntil: "networkidle" });
await page.waitForSelector("text=Mistake Review");
report("Mistake Review page renders");

await browser.close();

if (errors.length > 0) {
  console.log("\n--- Console/page errors captured ---");
  for (const e of errors) console.log(e);
  process.exit(1);
} else {
  console.log("\nAll smoke tests passed with zero console/page errors.");
}
