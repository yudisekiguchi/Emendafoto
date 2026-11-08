// Fundos (cores, combinações prontas, padrões contínuos) e stickers (formas, fitas, etiquetas, emojis).
const { test, expect } = require('@playwright/test');
const { openApp, exportZip } = require('./helpers');

// cor de um pixel de uma imagem renderizada pelo próprio app
const px = (page, js) => page.evaluate(js);

test('combinações prontas de fundo aplicam cor e padrão', async ({ page }) => {
  const errors = await openApp(page);
  await page.click('#tools [data-tool=bg]');
  await expect(page.locator('#panel canvas[data-bgp]')).toHaveCount(10);
  await page.click('#panel [data-act=bgPreset][data-arg=caderno]');
  expect(await page.evaluate(() => [S.bg.c1, S.bg.pat])).toEqual(['#fdfcf7', 'lines']);
  await page.click('#panel [data-act=bgPreset][data-arg=noite]');
  expect(await page.evaluate(() => [S.bg.type, S.bg.pat])).toEqual(['grad', 'dots']);
  await page.click('#panel [data-act=bgPat][data-arg=""]');
  expect(await page.evaluate(() => S.bg.pat)).toBe('');
  expect(errors).toEqual([]);
});

test('o padrão do fundo atravessa a divisa entre slides sem emenda', async ({ page }) => {
  const errors = await openApp(page);
  await page.evaluate(() => { Object.assign(S.bg, { type: 'solid', c1: '#ffffff', pat: 'check', patColor: '#000000', patSize: 70, patAlpha: 100, grain: 0 }); commit(); });
  const r = await px(page, () => {
    const get = (c, x, y) => Array.from(c.getContext('2d').getImageData(x, y, 1, 1).data.slice(0, 3));
    const strip = renderRegion(0, 2 * W, 2 * 1080), s2 = renderSlide(1, 1080), ys = [10, 50, 300, 700];
    // a primeira coluna do slide 2 tem que ser igual ao mesmo ponto na faixa inteira
    const same = ys.every(y => get(s2, 0, y).every((v, i) => Math.abs(v - get(strip, 1080, y)[i]) < 4));
    // e o xadrez tem que aparecer de verdade (claro e escuro)
    const a = get(s2, 5, 5)[0], b = get(s2, 5 + 35, 5)[0];
    return { same, contraste: Math.abs(a - b) };
  });
  expect(r.same).toBe(true);
  expect(r.contraste).toBeGreaterThan(200);
  expect(errors).toEqual([]);
});

test('formas, fitas, etiquetas e emojis entram e exportam', async ({ page }) => {
  const errors = await openApp(page);
  await page.click('#tools [data-tool=stickers]');
  for (const k of ['star', 'heart', 'sparkle', 'burst', 'bubble', 'arrow']) {
    await page.click('#tools [data-tool=stickers]');
    await page.click(`#panel [data-act=addDeco][data-arg=${k}]`);
    await expect(page.locator('#panel h3')).not.toHaveText('Forma'); // cada forma tem nome próprio
  }
  for (const k of ['rosa', 'azul', 'verde', 'amarela', 'kraft']) { await page.click('#tools [data-tool=stickers]'); await page.click(`#panel [data-act=addTape][data-arg=${k}]`); }
  for (const k of ['novo', 'antes', 'depois']) {
    await page.click('#tools [data-tool=stickers]'); const n = await page.evaluate(() => S.els.length);
    await page.click(`#panel [data-act=addLabel][data-arg=${k}]`);
    await page.waitForFunction(n => S.els.length > n, n);
  }
  // etiqueta numa linha só (não pode quebrar "NOVO!" em duas)
  expect(await page.evaluate(() => S.els.filter(e => e.type === 'text' && e.bg).map(e => layoutText(e).lines.length))).toEqual([1, 1, 1]);
  await page.click('#tools [data-tool=stickers]');
  expect(await page.locator('#panel .emo button').count()).toBeGreaterThanOrEqual(80);
  await page.click('#panel .emo button >> nth=20');
  const kinds = await page.evaluate(() => S.els.map(e => e.kind || e.text));
  expect(kinds).toEqual(expect.arrayContaining(['star', 'heart', 'sparkle', 'burst', 'bubble', 'arrow', 'tape', 'NOVO!', 'ANTES', 'DEPOIS']));
  expect(kinds.length).toBe(15);
  // a forma desenha de verdade: o centro da estrela fica amarelo no slide exportado
  const star = await page.evaluate(() => { const e = S.els.find(x => x.kind === 'star'); S.els = [e]; e.x = 300; e.y = 300; commit(); const c = renderSlide(0, 1080); return Array.from(c.getContext('2d').getImageData(e.x + e.w / 2, e.y + e.h / 2, 1, 1).data.slice(0, 3)); });
  expect(star).toEqual([255, 210, 63]);
  expect(await exportZip(page, [0])).toEqual(['carrossel_01.png']);
  expect(errors).toEqual([]);
});
