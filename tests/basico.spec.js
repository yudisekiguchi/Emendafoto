// Funções básicas: abrir, adicionar fotos, prévia e exportação de imagens.
const { test, expect } = require('@playwright/test');
const { openApp, addMedia, exportZip } = require('./helpers');

test('abre sem erros e mostra o convite para começar', async ({ page }) => {
  const errors = await openApp(page);
  await expect(page.locator('#empty')).toBeVisible();
  await expect(page.locator('#tools .tool')).toHaveCount(7);
  expect(errors).toEqual([]);
});

test('adiciona fotos e exporta os slides em ZIP', async ({ page }) => {
  const errors = await openApp(page);
  await addMedia(page, [{ type: 'photo', color: '#f80', name: 'a.png' }, { type: 'photo', color: '#08f', name: 'b.png' }]);
  expect(await page.evaluate(() => S.els.filter(e => e.type === 'image' && e.img).length)).toBe(2);
  const names = await exportZip(page, [0, 1]);
  expect(names).toEqual(['carrossel_01.png', 'carrossel_02.png']);
  expect(errors).toEqual([]);
});

test('a prévia mostra todos os slides', async ({ page }) => {
  const errors = await openApp(page);
  await addMedia(page, [{ type: 'photo' }]);
  await page.click('[data-act=preview]');
  await expect(page.locator('#pv > *')).toHaveCount(await page.evaluate(() => S.slides));
  await expect(page.locator('#pvc')).toHaveText(/^1\//);
  expect(errors).toEqual([]);
});
