// Salvamento automático, versões e recuperação quando o app volta do segundo plano.
const { test, expect } = require('@playwright/test');
const { openApp, addMedia } = require('./helpers');

const settle = page => page.evaluate(async () => { clearTimeout(saveT); await saveNow(); });
const pixel = (page, x, y) => page.evaluate(([x, y]) => Array.from(renderSlide(0, 1080).getContext('2d').getImageData(x, y, 1, 1).data.slice(0, 3)), [x, y]);
const placeFirst = page => page.evaluate(() => { const e = S.els[0]; Object.assign(e, { x: 100, y: 100, w: 600, h: 450, rot: 0 }); commit(); });

test('cada foto ou vídeo é gravado uma vez só; depois só o projeto (leve) é regravado', async ({ page }) => {
  const errors = await openApp(page);
  await page.evaluate(() => { window.WRITES = []; const set = IDB.set.bind(IDB); IDB.set = (k, v) => { WRITES.push(k); return set(k, v); }; });
  await addMedia(page, [{ type: 'photo', color: '#f00' }, { type: 'photo', color: '#0f0' }, { type: 'video', seconds: 1 }]);
  await settle(page);
  for (let i = 0; i < 4; i++) { await page.evaluate(i => { S.els[0].x += 10 + i; commit(); }, i); await settle(page); }
  const w = await page.evaluate(() => WRITES);
  expect(w.filter(k => k.startsWith('media:'))).toHaveLength(3);
  expect(w.filter(k => k === 'project').length).toBeGreaterThanOrEqual(5);
  expect(errors).toEqual([]);
});

test('ao reabrir o app, o projeto volta inteiro, com fotos e vídeos', async ({ page }) => {
  const errors = await openApp(page);
  await addMedia(page, [{ type: 'photo', color: '#0000ff' }, { type: 'video', seconds: 1 }]);
  await placeFirst(page); await settle(page);
  await page.reload(); await page.waitForFunction(() => typeof S !== 'undefined' && S.els.length === 2 && IMGS.size === 2, null, { timeout: 15000 });
  expect(await page.evaluate(() => [...IMGS.values()].filter(r => r.video).length)).toBe(1);
  expect(await pixel(page, 400, 300)).toEqual([0, 0, 255]);
  expect(errors).toEqual([]);
});

test('projeto salvo pela versão antiga do app continua abrindo', async ({ page }) => {
  const errors = await openApp(page);
  await page.evaluate(async () => {
    const c = document.createElement('canvas'); c.width = 400; c.height = 300; const x = c.getContext('2d'); x.fillStyle = '#00ff00'; x.fillRect(0, 0, 400, 300);
    const blob = await new Promise(r => c.toBlob(r, 'image/png')); const st = defaultState(), e = newFrame(100, 100, 600, 450); e.img = { id: 'antiga', s: 1, ox: 0, oy: 0 }; st.els = [e];
    await IDB.set('project', { state: st, images: [['antiga', blob]], fonts: [], t: Date.now() }); // formato antigo: arquivos dentro do projeto
  });
  await page.reload(); await page.waitForFunction(() => typeof S !== 'undefined' && IMGS.has('antiga'), null, { timeout: 15000 });
  expect(await pixel(page, 400, 300)).toEqual([0, 255, 0]);
  await page.evaluate(() => commit()); await settle(page);
  const saved = await page.evaluate(async () => { const p = await IDB.get('project'); return { v: p.v, images: !!p.images, media: !!(await IDB.get('media:antiga')) }; });
  expect(saved).toEqual({ v: 2, images: false, media: true }); // convertido para o formato novo
  expect(errors).toEqual([]);
});

test('se o salvamento falhar, o app avisa na hora e oferece salvar o .json', async ({ page }) => {
  const errors = await openApp(page);
  await addMedia(page, [{ type: 'photo' }]); await settle(page);
  await page.evaluate(() => { IDB.set = () => Promise.reject(Object.assign(new Error('cheio'), { name: 'QuotaExceededError' })); S.els[0].x += 5; commit(); });
  await expect(page.locator('#mbox')).toContainText('O trabalho não está sendo salvo');
  await expect(page.locator('#mbox')).toContainText('espaço');
  await expect(page.locator('#mbox [data-act=saveProject]')).toBeVisible();
  await expect(page.locator('#saved')).toHaveClass(/err/);
  expect(errors).toEqual([]);
});

test('versões salvas: guarda automaticamente e restaura', async ({ page }) => {
  const errors = await openApp(page);
  page.on('dialog', d => d.accept());
  await page.evaluate(() => { VERSION_EVERY = 0; });
  await addMedia(page, [{ type: 'photo', color: '#ff0000' }]); await placeFirst(page); await settle(page);
  await page.evaluate(() => { S.bg.c1 = '#000000'; S.els = []; commit(); }); await settle(page); // "perdeu" a foto
  await page.click('#tools [data-tool=project]');
  expect(await page.locator('#panel .vers > div').count()).toBeGreaterThanOrEqual(1);
  await page.click('#panel .vers [data-act=restoreVersion] >> nth=0');
  await page.waitForFunction(() => S.els.length === 1);
  expect(await pixel(page, 400, 300)).toEqual([255, 0, 0]);
  // as versões sobrevivem a fechar e abrir o app
  await settle(page);
  await page.reload(); await page.waitForFunction(() => typeof S !== 'undefined' && VERS.length >= 2, null, { timeout: 15000 });
  expect(await page.evaluate(() => S.els.length)).toBe(1); // e o projeto reaberto é o restaurado
  expect(errors).toEqual([]);
});

test('imagens apagadas pelo sistema (pouca memória) são refeitas ao voltar ao app', async ({ page }) => {
  const errors = await openApp(page);
  await addMedia(page, [{ type: 'photo', color: '#ff00ff' }]); await placeFirst(page);
  expect(await pixel(page, 400, 300)).toEqual([255, 0, 255]);
  // simula o sistema descartando a imagem pronta para a tela (fica em branco)
  await page.evaluate(() => { const r = [...IMGS.values()][0]; r.prev.width = 0; r.prev.height = 0; r.img = new Image(); });
  expect(await pixel(page, 400, 300)).not.toEqual([255, 0, 255]);
  await page.evaluate(() => healMedia(true));
  expect(await pixel(page, 400, 300)).toEqual([255, 0, 255]);
  expect(errors).toEqual([]);
});

test('vídeos parados liberam o tocador e continuam aparecendo', async ({ page }) => {
  const errors = await openApp(page);
  await addMedia(page, [{ type: 'video', seconds: 1, name: 'a.webm' }, { type: 'video', seconds: 1, name: 'b.webm' }]);
  await page.evaluate(() => select(null));
  await page.waitForFunction(() => LASTFRAME.size === 2, null, { timeout: 15000 });
  await page.evaluate(() => releasePlayers(0));
  expect(await page.evaluate(() => [PLAYERS.size, LASTFRAME.size])).toEqual([0, 2]);
  // o quadro guardado continua sendo desenhado (não fica branco)
  const ok = await page.evaluate(() => { const e = S.els[0], c = document.createElement('canvas'); c.width = c.height = 200; const x = c.getContext('2d'); x.drawImage(editorSource(e, IMGS.get(e.img.id)), 0, 0, 200, 200); const d = x.getImageData(100, 100, 1, 1).data; return !(d[0] > 250 && d[1] > 250 && d[2] > 250); });
  expect(ok).toBe(true);
  expect(errors).toEqual([]);
});

test('arquivos que nenhum projeto ou versão usa são apagados do aparelho', async ({ page }) => {
  const errors = await openApp(page);
  await page.evaluate(() => { VERSION_EVERY = 1e12; });
  await addMedia(page, [{ type: 'photo' }]); await settle(page);
  const id = await page.evaluate(() => S.els[0].img.id);
  await page.evaluate(() => { S.els = []; commit(); VERS = []; }); await settle(page);
  await page.evaluate(() => collectMedia());
  expect(await page.evaluate(id => IDB.get('media:' + id), id)).toBeUndefined();
  expect(errors).toEqual([]);
});

test('apagar versões antigas libera só os arquivos que apenas elas usavam', async ({ page }) => {
  const errors = await openApp(page);
  page.on('dialog', d => d.accept());
  await page.evaluate(() => { VERSION_EVERY = 0; });
  await addMedia(page, [{ type: 'photo', color: '#f00', name: 'velha.png' }]); await settle(page);
  const velha = await page.evaluate(() => S.els[0].img.id);
  await page.evaluate(() => { S.els = []; commit(); });
  await addMedia(page, [{ type: 'photo', color: '#0f0', name: 'nova.png' }]); await settle(page);
  const nova = await page.evaluate(() => S.els[0].img.id);
  await page.click('#tools [data-tool=project]');
  await expect(page.locator('#freeVers')).toContainText('libera cerca de');
  await page.click('#panel [data-act=clearVersions]');
  await page.waitForFunction(() => VERS.length === 0);
  await expect.poll(() => page.evaluate(id => IDB.get('media:' + id).then(b => !!b), velha)).toBe(false);
  expect(await page.evaluate(id => IDB.get('media:' + id).then(b => !!b), nova)).toBe(true); // o projeto atual continua
  expect(await page.evaluate(() => S.els.length)).toBe(1);
  expect(errors).toEqual([]);
});

test('concluir projeto apaga projeto, versões e arquivos, mas mantém a biblioteca', async ({ page }) => {
  const errors = await openApp(page);
  page.on('dialog', d => d.accept());
  await page.evaluate(async () => { VERSION_EVERY = 0; await IDB.set('library', [{ id: 'x', name: 'sticker', blob: new Blob(['oi'], { type: 'image/png' }) }]); });
  await addMedia(page, [{ type: 'photo' }, { type: 'video', seconds: 1 }]); await settle(page);
  await page.click('#tools [data-tool=project]');
  await page.click('#panel [data-act=finishProject]');
  await expect(page.locator('#mbox')).toContainText('libera');
  await page.click('#mbox [data-act=finishConfirm]');
  await page.waitForFunction(() => S.els.length === 0 && VERS.length === 0);
  await expect(page.locator('#toast')).toContainText('liberados'); // a limpeza terminou
  const keys = await page.evaluate(() => IDB.keys());
  expect(keys.filter(k => String(k).startsWith('media:'))).toEqual([]);
  expect(await page.evaluate(() => IDB.get('library').then(l => l.length))).toBe(1);
  await page.reload(); await page.waitForFunction(() => typeof S !== 'undefined');
  expect(await page.evaluate(() => [S.els.length, VERS.length])).toEqual([0, 0]); // continua limpo depois de reabrir
  expect(errors).toEqual([]);
});
