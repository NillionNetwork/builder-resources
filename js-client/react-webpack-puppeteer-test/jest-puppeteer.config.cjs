module.exports = {
  launch: {
    headless: process.env.HEADLESS !== "false" ? "new" : false,
    devtools: true,
    slowMo: false,
    protocolTimeout: 360000,
    defaultViewport: null,
    ignoreHTTPSErrors: true,
    dumpio: true,
    product: "chrome",
  },
  browserContext: "default",
};
