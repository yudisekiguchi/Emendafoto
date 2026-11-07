// Vídeos: tocar só ao apertar ▶, som, trecho, "só um quadro" e exportação em vídeo.
const { test, expect } = require('@playwright/test');
const { openApp, addMedia, spread, setRange, exportZip } = require('./helpers');

const players = page => page.evaluate(() => [...PLAYERS.entries()].map(([id, p]) => ({ id, playing: !p.v.paused, muted: p.v.muted })));

test('vídeo fica parado até apertar ▶ e toca com som', async ({ page }) => {
  const errors = await openApp(page);
  await addMedia(page, [{ type: 'video', seconds: 2 }]);
  await page.waitForTimeout(800);
  expect((await players(page)).some(p => p.playing)).toBe(false);
  await page.evaluate(() => select(S.els.find(isVidEl).id));
  await page.click('#panel [data-act=vPlay]');
  await expect.poll(async () => (await players(page)).filter(p => p.playing).length).toBe(1);
  expect((await players(page))[0].muted).toBe(false);
  await page.click('#panel [data-act=vEdSound]');
  await expect(page.locator('#panel [data-act=vEdSound]')).toContainText('Sem som');
  expect((await players(page)).find(p => p.playing).muted).toBe(true);
  expect(errors).toEqual([]);
});

test('tocar um vídeo pausa o outro', async ({ page }) => {
  const errors = await openApp(page);
  await addMedia(page, [{ type: 'video', seconds: 2, name: 'a.webm' }, { type: 'video', seconds: 2, name: 'b.webm' }]);
  await spread(page);
  const ids = await page.evaluate(() => S.els.filter(isVidEl).map(e => e.id));
  for (const id of ids) {
    await page.evaluate(id => select(id), id);
    await page.click('#panel [data-act=vPlay]');
    await expect.poll(async () => (await players(page)).filter(p => p.playing).map(p => p.id)).toEqual([id]);
  }
  expect(errors).toEqual([]);
});

test('o trecho escolhido é o que vai para a exportação', async ({ page }) => {
  const errors = await openApp(page);
  await addMedia(page, [{ type: 'video', seconds: 3 }]);
  await page.evaluate(() => select(S.els.find(isVidEl).id));
  await setRange(page, 'trim.b', 2);
  await setRange(page, 'trim.a', 1);
  await expect(page.locator('#trimInfo')).toContainText('Trecho de 1.0 s');
  const slide = await page.evaluate(() => { const e = selEl(); select(null); return Math.floor(center(e).x / W); });
  const names = await exportZip(page, [slide]);
  expect(names).toHaveLength(1);
  expect(names[0]).toMatch(/^carrossel_\d\d\.(mp4|webm)$/);
  expect(errors).toEqual([]);
});

test('"só um quadro" faz o slide sair como imagem', async ({ page }) => {
  const errors = await openApp(page);
  await addMedia(page, [{ type: 'video', seconds: 2 }]);
  await page.evaluate(() => select(S.els.find(isVidEl).id));
  await page.click('#panel [data-act=vMode][data-arg=still]');
  await setRange(page, 'frameT', 1.2);
  await page.click('#panel [data-act=vStep][data-arg="1"]');
  const t = await page.evaluate(() => selEl().frameT);
  expect(t).toBeCloseTo(1.2 + 1 / 30, 2);
  const slide = await page.evaluate(() => { const e = selEl(); select(null); return Math.floor(center(e).x / W); });
  expect(await page.evaluate(() => range(S.slides).some(slideHasVideo))).toBe(false);
  const names = await exportZip(page, [slide]);
  expect(names[0]).toMatch(/\.png$/);
  expect(errors).toEqual([]);
});
