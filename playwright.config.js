// Testes automáticos do Emenda: abrem o app num Chromium de verdade e usam como uma pessoa usaria.
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: 'tests',
  timeout: 120000,
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    viewport: { width: 1300, height: 850 },
    acceptDownloads: true,
    trace: 'off',
    // Opcional: aponta para um Chromium já instalado (ex.: PW_CHROMIUM=/caminho/do/chromium)
    launchOptions: process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {}
  }
});
