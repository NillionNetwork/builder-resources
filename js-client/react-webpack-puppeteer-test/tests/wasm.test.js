const { faker } = require("@faker-js/faker");
const { validate } = require("uuid");

async function setInputValue(page, selector, value) {
  await page.$eval(selector, (el, newValue) => {
    el.value = newValue;
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }, value);
}

const URL = "https://localhost:9000";
beforeAll(async () => {
  await page.goto(URL, { waitUntil: "domcontentloaded" });
});

const content = faker.lorem.words();
let secret_uuid = null;

describe("Nillion WASM", () => {
  test("load wasm", async () => {
    await page.waitForSelector("#wasm-indicator");
    const resultHandle = await page.$("#wasm-indicator");
    const result = await page.evaluate(
      (resultHandle) => resultHandle.getAttribute("wasm-state"),
      resultHandle,
    );
    expect(result).toBe("loaded");
  }, 5000);

  test("store secret", async () => {
    await setInputValue(page, "#test-1-input", content);
    await expect(page).toClick("button", { text: "test-1-trigger" });

    await page.waitForSelector("#test-1-result", { timeout: 20000 });
    const resultHandle = await page.$("#test-1-result");
    secret_uuid = await page.evaluate(
      (resultHandle) => resultHandle.innerHTML,
      resultHandle,
    );

    expect(validate(secret_uuid)).toBe(true);
  }, 20001);

  test("retrieve secret", async () => {
    await setInputValue(page, "#test-2-input", secret_uuid);
    await expect(page).toClick("button", { text: "test-2-trigger" });

    await page.waitForSelector("#test-2-result", { timeout: 20000 });
    const resultHandle = await page.$("#test-2-result");
    const result = await page.evaluate(
      (resultHandle) => resultHandle.innerHTML,
      resultHandle,
    );

    expect(result).toBe(content);
  }, 20001);

  test("compute secret", async () => {
    const selector = '#test-3-trigger';
    await page.waitForSelector(selector);
    const expected = await page.evaluate((selector) => {
      return document.querySelector(selector).getAttribute('data-expected');
    }, selector);

    await expect(page).toClick("button", { text: "test-3-trigger" });

    await page.waitForSelector("#test-3-result", { timeout: 20000 });
    const resultHandle = await page.$("#test-3-result");
    const result = await page.evaluate(
      (resultHandle) => resultHandle.innerHTML,
      resultHandle,
    );

    expect(result).toBe(expected);
  }, 25001);
});
