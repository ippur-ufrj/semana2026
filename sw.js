// Permite usar o app sem internet depois do primeiro acesso.
// Ao publicar mudanças em index.html, estilo.css ou app.js, aumente o número da versão abaixo.
const VERSAO = 'semana-ippur-v3';
const ARQUIVOS = [
  './', 'index.html', 'estilo.css', 'app.js', 'config.json', 'programacao.txt', 'avisos.txt', 'manifest.json',
  'fontes/Horizon.otf', 'fontes/consolab.ttf',
  'assets/logo.png', 'assets/logo-branco.png', 'assets/logos-apoio.png', 'assets/icone-192.png',
  'assets/fundo-cidade.png', 'assets/fundo-campo-verde.png', 'assets/fundo-cidade-marrom.png',
  'assets/fundo-campo-marrom.png', 'assets/fundo-grafismo-marrom.png', 'assets/fundo-campo.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSAO).then(c => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSAO).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

// Conteúdo (txt/json): tenta a internet primeiro, para sempre mostrar a versão mais nova.
// Demais arquivos: usa a cópia guardada e atualiza em segundo plano.
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  const conteudo = /\.(txt|json)$/.test(url.pathname);
  e.respondWith(
    caches.open(VERSAO).then(async cache => {
      const guardado = await cache.match(e.request, { ignoreSearch: true });
      const daRede = fetch(e.request).then(r => { if (r.ok && url.origin === location.origin) cache.put(e.request, r.clone()); return r; });
      if (conteudo) return daRede.catch(() => guardado);
      return guardado || daRede;
    })
  );
});
