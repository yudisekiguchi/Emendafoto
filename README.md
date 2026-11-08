# Emenda

Editor pessoal de carrosséis contínuos para Instagram. Roda no navegador; as fotos não saem do aparelho.

## Posição das ferramentas

Em **Projeto → Posição das ferramentas**, escolha onde ficam as ferramentas: **Automático** (embaixo no celular, à esquerda em telas maiores), **Esquerda**, **Direita** ou **Embaixo**. No modo Embaixo, o painel abre sobre a barra e fecha ao tocar de novo na ferramenta ou numa área vazia. A escolha fica salva no aparelho.

## Fundos e stickers

- **Fundo:** 10 combinações prontas (Caderno, Quadriculado, Kraft, Piquenique, Bolinhas, Listras, Lousa, Noite estrelada, Ondas, Xadrez), padrões contínuos com cor, tamanho e intensidade (bolinhas, listras, diagonais, quadriculado, xadrez, piquenique, pautado, ondas), 50 cores em paletas e 16 degradês.
- **Stickers:** formas (estrela, coração, brilho, selo, balão de fala, seta) com cor editável, 5 fitas adesivas, etiquetas (SHOW, NOVO!, PARTE 1, ANTES, DEPOIS, SALVE) e mais de 80 emojis por tema.

## Selecionar vários itens

Toque em **Selecionar** (embaixo do carrossel) e depois nos itens; no computador, Shift+clique também funciona. Com vários selecionados dá para aplicar moldura (Polaroid, borda fina, só sombra ou sem moldura), cantos, borda, sombra, filtro e ajustes em todos de uma vez, além de excluir, duplicar, travar, trazer para frente ou mandar para trás. Arraste um item selecionado para mover todos juntos.

## Vídeos curtos

- Adicione vídeos de até 10 min pelo botão **Fotos**, arrastando ou colando, igual às fotos.
- Em **Trecho do vídeo**, no painel, escolha início e fim. O trecho pode ter até 60 s, o limite do Instagram por slide.
- No editor o vídeo fica parado no início do trecho. Aperte ▶ no canto do vídeo, ou **Tocar trecho** no painel, para ver o trecho em loop, com som. Tocar um vídeo pausa os outros, e o botão 🔊/🔇 no painel liga ou desliga o som no app (não muda a exportação).
- Na **Prévia**, só o slide que está na tela toca com som, como no Instagram.
- Em **Usar → Só um quadro**, a moldura vira uma foto com o quadro que você escolher (com ◀ ▶ para ajustar quadro a quadro), e o slide é exportado como imagem. Toque em **Vídeo** para voltar.
- O vídeo funciona como uma foto: enquadrar, filtros, ajustes, borda, rotação e até atravessar a divisa entre slides.
- Na exportação, todo slide que tem vídeo vira um arquivo de vídeo (MP4 quando o navegador permite, senão WebM), com a duração do trecho mais longo do slide. Os outros slides continuam saindo como imagem.
- A gravação acontece em tempo real: um vídeo de 15 s leva cerca de 15 s para exportar. Mantenha a aba aberta.
- O som do vídeo entra no arquivo exportado. Dá para desligar em **Som do vídeo na exportação**, no painel do vídeo.

## Salvamento e versões

- O projeto é salvo sozinho neste aparelho. Cada foto ou vídeo é gravado uma vez só; a cada alteração só o projeto (leve) é regravado.
- Se o salvamento falhar (por exemplo, sem espaço), o app avisa na hora e oferece salvar um arquivo `.json`.
- **Projeto → Versões salvas:** uma versão a cada 5 minutos de edição (até 30) e antes de abrir ou criar outro projeto. Dá para restaurar qualquer uma.
- Se o sistema apagar as imagens da memória com o app em segundo plano, elas são refeitas ao voltar ao app. Vídeos parados liberam o tocador para poupar memória.

## Testes automáticos

A pasta `tests/` tem testes que abrem o app num navegador de verdade e conferem as principais funções: fotos, exportação, prévia, vídeos (tocar, som, trecho, só um quadro), seleção de vários itens e posição das ferramentas. Eles rodam sozinhos no GitHub (aba **Actions**, “Testes”) a cada pull request e a cada atualização do `main`; o resultado aparece como ✅ ou ❌ no pull request.

Para rodar no computador (precisa do Node.js):

```
npm install
npx playwright install chromium
npm test
```

## Publicação

O app é publicado pelo GitHub Pages a cada atualização do `main`. Se uma publicação travar ou falhar na aba **Actions**, basta executá-la de novo ou fazer uma nova atualização no `main`.
