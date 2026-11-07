// Seleção de vários itens: marcar, aplicar moldura/filtro, mover juntos, excluir e desfazer.
const { test, expect } = require('@playwright/test');
const { openApp, addMedia, spread, centerOf, setRange } = require('./helpers');

test('seleciona vários itens e edita todos de uma vez', async ({ page }) => {
  const errors = await openApp(page);
  await addMedia(page, [{ type: 'photo', color: '#f80' }, { type: 'photo', color: '#0a8' }, { type: 'photo', color: '#80f' }, { type: 'photo', color: '#888' }]);
  await spread(page);
  const ids = await page.evaluate(() => S.els.map(e => e.id));
  const sel = ids.slice(0, 3), other = ids[3];

  await page.click('#pager [data-act=multiMode]');
  for (const id of sel) { const c = await centerOf(page, id); await page.mouse.click(c.x, c.y); }
  expect(await page.evaluate(() => ui.multi)).toEqual(sel);
  await expect(page.locator('#panel h3')).toHaveText('3 itens selecionados');

  await page.click('#panel [data-act=mStyle][data-arg=polaroid]');
  await setRange(page, 'radius', 30);
  await page.click('#panel [data-act=mPreset][data-arg=bw]');
  const st = await page.evaluate(() => Object.fromEntries(S.els.map(e => [e.id, [e.stroke, e.radius, e.adj.preset]])));
  for (const id of sel) expect(st[id]).toEqual([28, 30, 'bw']);
  expect(st[other]).toEqual([0, 0, 'none']);

  const x0 = await page.evaluate(() => S.els.map(e => e.x));
  const c = await centerOf(page, sel[0]);
  await page.mouse.move(c.x, c.y); await page.mouse.down(); await page.mouse.move(c.x + 60, c.y + 20, { steps: 6 }); await page.mouse.up();
  const x1 = await page.evaluate(() => S.els.map(e => e.x));
  const dx = x1[0] - x0[0];
  expect(dx).toBeGreaterThan(50);
  for (const i of [1, 2]) expect(x1[i] - x0[i]).toBeCloseTo(dx, 5);
  expect(x1[3]).toBe(x0[3]);

  await page.click('#panel [data-act=mDel]');
  expect(await page.evaluate(() => S.els.map(e => e.id))).toEqual([other]);
  await page.click('#bUndo');
  expect(await page.evaluate(() => S.els.length)).toBe(4);

  await page.keyboard.press('Escape');
  expect(await page.evaluate(() => [!!ui.multiMode, ui.multi])).toEqual([false, null]);
  expect(errors).toEqual([]);
});

test('Shift+clique seleciona vários sem o botão', async ({ page }) => {
  const errors = await openApp(page);
  await addMedia(page, [{ type: 'photo' }, { type: 'photo', color: '#08f' }]);
  await spread(page);
  const ids = await page.evaluate(() => S.els.map(e => e.id));
  for (const id of ids) { const c = await centerOf(page, id); await page.keyboard.down('Shift'); await page.mouse.click(c.x, c.y); await page.keyboard.up('Shift'); }
  expect(await page.evaluate(() => ui.multi)).toEqual(ids);
  await page.keyboard.press('Delete');
  expect(await page.evaluate(() => S.els.length)).toBe(0);
  expect(errors).toEqual([]);
});
