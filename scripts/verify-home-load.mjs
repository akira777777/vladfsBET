import { chromium } from "playwright";

const base = process.env.APP_URL ?? "http://127.0.0.1:3000";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const apiCalls = [];
page.on("request", (req) => {
  const url = req.url();
  if (url.includes("/api/")) apiCalls.push(`${req.method()} ${new URL(url).pathname}`);
});

async function shot(name) {
  await page.screenshot({ path: `verify-${name}.png`, fullPage: false });
}

try {
  await page.goto(base, { waitUntil: "networkidle", timeout: 30000 });
  const homeTitle = await page.getByRole("heading", { name: /the game/i }).count();
  const playNow = page.getByRole("link", { name: "Play now" });
  const registerCta = page.getByRole("link", { name: "Create demo account" });
  if (homeTitle < 1) throw new Error("home heading missing");
  if (!(await playNow.isVisible())) throw new Error("Play now missing");
  if (!(await registerCta.isVisible())) throw new Error("Create demo account missing");
  if (!(await page.getByRole("heading", { name: "VladfsBET Originals" }).isVisible())) {
    throw new Error("originals rail missing");
  }
  await shot("home");

  await playNow.click();
  await page.waitForURL("**/casino**", { timeout: 15000 });
  if (!(await page.getByText(/casino/i).first().isVisible())) throw new Error("casino page blank");
  await shot("casino");

  await page.goto(base, { waitUntil: "networkidle" });
  await page.getByRole("link", { name: "Create demo account" }).click();
  await page.waitForURL("**/register**", { timeout: 15000 });
  if (!(await page.getByRole("heading", { name: /register|create/i }).first().isVisible().catch(() => false)) &&
      !(await page.locator("form").first().isVisible())) {
    throw new Error("register page missing form");
  }
  await shot("register");

  await page.goto(`${base}/login`, { waitUntil: "networkidle" });
  await page.locator("input[type=email], input[name=email]").first().fill("player@vladfsbet.com");
  await page.locator("input[type=password]").first().fill("Player123456!");
  await page.getByRole("button", { name: /log in|sign in/i }).click();
  await page.waitForTimeout(1500);
  await page.goto(base, { waitUntil: "networkidle" });
  const cashier = page.getByRole("link", { name: "Cashier" });
  const cashierVisible = await cashier.isVisible().catch(() => false);
  await shot("home-logged-in");

  const meCalls = apiCalls.filter((c) => c.endsWith("/api/auth/me"));
  const walletCalls = apiCalls.filter((c) => c.endsWith("/api/wallet"));
  console.log(JSON.stringify({
    ok: true,
    cashierVisible,
    meCalls: meCalls.length,
    walletCalls: walletCalls.length,
    apiCalls,
  }, null, 2));
  if (!cashierVisible) throw new Error("logged-in home did not swap CTA to Cashier");
} finally {
  await browser.close();
}
