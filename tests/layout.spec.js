// Posição das ferramentas e painel em colunas.
const { test, expect, devices } = require('@playwright/test');
const { openApp, addMedia } = require('./helpers');

const mode = page => page.evaluate(() => document.body.className.trim());

test('escolher a posição das ferramentas e manter depois de recarregar', async ({ page }) => {
  const errors = await openApp(page);
  expect(await mode(page)).toBe(''); // automático numa tela larga = esquerda
  await page.click('#tools [data-tool=project]');
  await page.click('#panel [data-act=layout][data-arg=right]');
  expect(await mode(page)).toBe('lay-right');
  await page.click('#panel [data-act=layout][data-arg=bottom]');
  expect(await mode(page)).toBe('lay-bottom');
  await page.reload();
  await page.waitForFunction(() => typeof S !== 'undefined');
  expect(await mode(page)).toBe('lay-bottom');
  expect(errors).toEqual([]);
});

test('com ferramentas embaixo num tablet, o painel fica em colunas', async ({ page }) => {
  await page.setViewportSize({ width: 1000, height: 625 });
  const errors = await openApp(page, { layout: 'bottom' });
  await addMedia(page, [{ type: 'photo' }]);
  await page.evaluate(() => select(S.els[0].id));
  const cols = await page.$eval('#panel .pc', el => getComputedStyle(el).columnWidth);
  expect(cols).toBe('300px');
  expect(errors).toEqual([]);
});

const { defaultBrowserType, ...iphone } = devices['iPhone 13']; // mantém o Chromium, só simula a tela e o toque
test.describe('celular', () => {
  test.use(iphone);
  test('no automático, as ferramentas ficam embaixo', async ({ page }) => {
    const errors = await openApp(page);
    expect(await mode(page)).toBe('lay-bottom');
    expect(errors).toEqual([]);
  });
});
