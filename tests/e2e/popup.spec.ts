import {
  test,
  expect,
  chromium,
  type BrowserContext,
  type Page,
} from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const extensionPath = path.resolve(
  __dirname,
  "..",
  "..",
  ".output",
  "chrome-mv3",
);

let context: BrowserContext;
let page: Page;

test.describe.configure({ mode: "serial" });

async function openExtensionPopup(): Promise<Page> {
  const worker =
    context.serviceWorkers()[0] ??
    (await context.waitForEvent("serviceworker"));

  const [popupPage] = await Promise.all([
    context.waitForEvent("page"),
    worker.evaluate(() =>
      chrome.windows.create({
        url: chrome.runtime.getURL("popup.html"),
        type: "popup",
        width: 420,
        height: 520,
        focused: true,
      }),
    ),
  ]);

  await popupPage.waitForLoadState("domcontentloaded");
  return popupPage;
}

test.beforeAll(async () => {
  context = await chromium.launchPersistentContext("", {
    headless: false,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
    ],
    slowMo: 500,
  });

  const blank = context.pages()[0] ?? (await context.newPage());
  await blank.goto("about:blank");
  await blank.bringToFront();

  page = await openExtensionPopup();
});

test.afterAll(async () => {
  await context.close();
});

test("1 — shows empty state with no apps", async () => {
  await expect(page.getByText("No *arr apps configured.")).toBeVisible();
  await expect(page.getByRole("button", { name: /add app/i })).toBeVisible();
});

test("2 — open setup tab from popup empty state", async () => {
  const [setupPage] = await Promise.all([
    context.waitForEvent("page"),
    page.getByRole("button", { name: /add app/i }).click(),
  ]);

  await setupPage.waitForLoadState("domcontentloaded");
  await expect(setupPage).toHaveURL(/setup\.html\?action=add$/);
  await expect(
    setupPage.getByRole("heading", { name: /arrextension setup/i }),
  ).toBeVisible();
});
