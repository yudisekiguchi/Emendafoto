// Ajudantes dos testes: abrir o app, criar fotos/vídeos de teste dentro do navegador e ler downloads.
const path = require('path');
const fs = require('fs');
const { expect } = require('@playwright/test');

const APP = 'file://' + path.resolve(__dirname, '..', 'index.html');

// Abre o app limpo e guarda os erros de JavaScript da página (todo teste confere que não houve nenhum).
async function openApp(page, { layout } = {}) {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  if (layout) await page.addInitScript(l => localStorage.setItem('emenda-layout', l), layout);
  await page.goto(APP);
  await page.waitForFunction(() => typeof S !== 'undefined' && document.querySelector('#tools .tool'));
  return errors;
}

// Cria arquivos de verdade no navegador (fotos PNG e vídeos WebM com relógio na tela)
// e os entrega ao botão "Fotos", como se a pessoa tivesse escolhido no aparelho.
async function addMedia(page, specs) {
  const before = await page.evaluate(() => S.els.length);
  await page.evaluate(async specs => {
    const files = [];
    for (const s of specs) {
      const c = document.createElement('canvas'); c.width = s.w || 800; c.height = s.h || 600;
      const x = c.getContext('2d');
      if (s.type === 'photo') {
        x.fillStyle = s.color || '#f80'; x.fillRect(0, 0, c.width, c.height);
        files.push(new File([await new Promise(r => c.toBlob(r, 'image/png'))], s.name || 'foto.png', { type: 'image/png' }));
      } else {
        const rec = new MediaRecorder(c.captureStream(30), { mimeType: 'video/webm' }), ch = [];
        rec.ondataavailable = e => ch.push(e.data); rec.start();
        const t0 = performance.now();
        await new Promise(r => {
          const f = () => {
            const t = (performance.now() - t0) / 1000;
            x.fillStyle = `hsl(${t * 120},80%,50%)`; x.fillRect(0, 0, c.width, c.height);
            x.fillStyle = '#000'; x.font = '120px sans-serif'; x.fillText(t.toFixed(1), 40, 200);
            if (t >= s.seconds) r(); else requestAnimationFrame(f);
          };
          f();
        });
        rec.stop(); await new Promise(r => (rec.onstop = r));
        files.push(new File(ch, s.name || 'video.webm', { type: 'video/webm' }));
      }
    }
    const dt = new DataTransfer(); files.forEach(f => dt.items.add(f));
    const inp = document.querySelector('#fileIn'); inp.files = dt.files;
    inp.dispatchEvent(new Event('change', { bubbles: true }));
  }, specs);
  await page.waitForFunction(n => S.els.length >= n, before + specs.length, { timeout: 30000 });
}

// Espalha os itens, um por slide, para os toques não caírem um em cima do outro.
async function spread(page) {
  await page.evaluate(() => {
    setSlides(Math.max(S.slides, S.els.length));
    S.els.forEach((e, i) => { e.x = i * W + 120; e.y = 200; e.rot = 0; });
    commit(); select(null); fitAll();
  });
}

// Centro de um elemento na tela (para clicar nele).
async function centerOf(page, id) {
  return page.evaluate(id => {
    const e = byId(id), r = cv.getBoundingClientRect();
    return { x: r.left + view.x + (e.x + e.w / 2) * view.z, y: r.top + view.y + (e.y + e.h / 2) * view.z };
  }, id);
}

// Muda um controle deslizante do painel como a pessoa faria.
async function setRange(page, prop, value) {
  await page.$eval(`#panel [data-prop="${prop}"]`, (el, v) => {
    el.value = String(v);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, value);
}

// Exporta os slides escolhidos em ZIP e devolve os nomes dos arquivos dentro dele.
async function exportZip(page, slides) {
  await page.click('[data-act=export]');
  await page.click('[data-act=expNone]');
  for (const i of slides) await page.click(`[data-act=expPick][data-arg="${i}"]`);
  const dl = page.waitForEvent('download', { timeout: 90000 });
  await page.click('[data-act=dlZip]');
  const file = await (await dl).path();
  await expect(page.locator('#prog')).toContainText('Pronto');
  await page.click('#mbox [data-act=closeModal]');
  return zipNames(fs.readFileSync(file));
}

// Lê a lista de arquivos de um ZIP (diretório central), sem bibliotecas extras.
function zipNames(buf) {
  const names = [];
  for (let i = 0; i < buf.length - 46; i++) {
    if (buf.readUInt32LE(i) === 0x02014b50) {
      const n = buf.readUInt16LE(i + 28); names.push(buf.slice(i + 46, i + 46 + n).toString('utf8')); i += 45 + n;
    }
  }
  return names;
}

module.exports = { APP, openApp, addMedia, spread, centerOf, setRange, exportZip, zipNames };
