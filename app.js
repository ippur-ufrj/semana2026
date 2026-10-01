/* XXXI Semana IPPUR — app da programação
   Você não precisa editar este arquivo.
   Conteúdo: programacao.txt · avisos.txt · config.json */

const CHAVE_FAVS = 'semanaippur26:favs';
const DIAS_SEMANA = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
const SIGLAS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
const ICONE_ESTRELA = '<svg viewBox="0 0 24 24"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.8l6.1-.9z"/></svg>';

const E = {
  cfg: null, atividades: [], dias: [], avisos: [],
  aba: 'prog', dia: null, filtro: 0, busca: '',
  favs: lerFavs(), abriuPorClique: false
};

/* ---------- utilidades ---------- */
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const norm = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const pad = n => String(n).padStart(2, '0');
const hm = s => s ? s.replace(':', 'h') : '';
const min = s => { if (!s) return null; const [h, m] = s.split(':').map(Number); return h * 60 + m; };
const slug = s => norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24);
const corDe = nome => (E.cfg.cores[nome] || nome || E.cfg.cores.grafite);
const tipoDe = a => E.cfg.tipos[a.tipo] || { nome: a.tipo, cor: 'grafite' };
const diaDe = data => E.dias.find(d => d.data === data);

function lerFavs() { try { return JSON.parse(localStorage.getItem(CHAVE_FAVS) || '[]'); } catch (e) { return []; } }
function salvarFavs() { try { localStorage.setItem(CHAVE_FAVS, JSON.stringify(E.favs)); } catch (e) {} }

function agora() {
  const teste = new URLSearchParams(location.search).get('agora') || E.cfg.teste?.simularAgora;
  const d = teste ? new Date(teste + (teste.length <= 16 ? ':00' : '') + E.cfg.evento.fuso) : new Date();
  const local = new Date(d.getTime() + horasFuso() * 3600e3);
  return { data: local.toISOString().slice(0, 10), min: local.getUTCHours() * 60 + local.getUTCMinutes() };
}
function horasFuso() { const [h, m] = E.cfg.evento.fuso.split(':').map(Number); return h + Math.sign(h) * (m / 60); }

function aviso(texto) {
  const el = $('#aviso-rapido'); el.textContent = texto; el.hidden = false;
  clearTimeout(aviso.t); aviso.t = setTimeout(() => el.hidden = true, 1600);
}

/* ---------- leitura do programacao.txt ---------- */
function lerProgramacao(txt) {
  const lista = []; let dia = null, a = null;
  for (let linha of txt.split(/\r?\n/)) {
    linha = linha.trim();
    if (!linha || linha.startsWith('//')) continue;
    let m;
    if ((m = linha.match(/^#\s*(\d{1,2})\/(\d{1,2})\/(\d{4})/))) { dia = `${m[3]}-${pad(m[2])}-${pad(m[1])}`; a = null; continue; }
    if (linha.startsWith('##')) {
      const [hora = '', tipo = '', ...local] = linha.replace(/^##\s*/, '').split('|').map(s => s.trim());
      const [inicio, fim] = hora.split('-').map(s => s.trim()).map(h => h && h.replace(/^(\d):/, '0$1:'));
      a = { dia, inicio, fim: fim || '', tipo: norm(tipo), local: local.join(' | '), codigo: '', titulo: '', pessoas: [], itens: [], obs: '' };
      lista.push(a); continue;
    }
    if (!a) continue;
    if (linha.startsWith('- ')) {
      const partes = linha.slice(2).split('|').map(s => s.trim());
      a.itens.push(partes.length > 1 ? { autores: partes[0], titulo: partes.slice(1).join(' | ') } : { autores: '', titulo: partes[0] });
      continue;
    }
    const i = linha.indexOf(':');
    if (i > 0 && i <= 30) {
      const chave = linha.slice(0, i).trim(), valor = linha.slice(i + 1).trim(), k = norm(chave);
      if (k === 'codigo') a.codigo = valor;
      else if (k === 'titulo') a.titulo = valor;
      else if (k === 'obs') a.obs = valor;
      else a.pessoas.push({ papel: chave, nomes: valor });
      continue;
    }
    a.obs = (a.obs ? a.obs + ' ' : '') + linha;
  }
  const usados = {};
  lista.forEach(a => {
    let id = `${a.dia.slice(5)}-${a.inicio.replace(':', '')}-${slug(a.codigo || a.titulo)}`;
    while (usados[id]) id += 'x';
    usados[id] = 1; a.id = id;
  });
  return lista.sort((x, y) => x.dia.localeCompare(y.dia) || x.inicio.localeCompare(y.inicio));
}

function montarDias() {
  const datas = [...new Set(E.atividades.map(a => a.dia))].sort();
  E.dias = datas.map(data => {
    const sem = new Date(data + 'T12:00:00Z').getUTCDay();
    const [, mes, d] = data.split('-');
    return { data, sigla: SIGLAS[sem], num: d, mes, nome: DIAS_SEMANA[sem] };
  });
}

/* ---------- pedaços de tela ---------- */
function etiqueta(a) {
  const t = tipoDe(a);
  return `<span class="etiqueta" style="background:${corDe(t.cor)}">${esc(a.codigo || t.nome)}</span>`;
}
function estrela(a) {
  const on = E.favs.includes(a.id);
  return `<span class="estrela ${on ? 'on' : ''}" data-fav="${a.id}" role="button" aria-label="${on ? 'Remover da agenda' : 'Salvar na agenda'}">${ICONE_ESTRELA}</span>`;
}
function metaDe(a) {
  if (a.tipo === 'campo') return 'Saída ' + hm(a.inicio);
  if (a.itens.length) return `${a.itens.length} ${(tipoDe(a).lista || 'trabalhos').toLowerCase()}`;
  const coord = a.pessoas.find(p => norm(p.papel).startsWith('coord'));
  return coord ? 'Coord. ' + coord.nomes : '';
}
function card(a, extra = {}) {
  const meta = extra.quando ?? metaDe(a);
  return `<article class="card ${extra.comHora ? 'com-hora' : ''}" data-abrir="${a.id}">
    ${extra.comHora ? `<div class="hora"><strong>${hm(a.inicio)}</strong><small>${hm(a.fim)}</small></div>` : ''}
    <div class="corpo">
      <div class="linha-meta">${etiqueta(a)}<span>${esc(extra.quando ? '' : a.local)}</span>${extra.quando ? `<span>${esc(extra.quando)}</span>` : ''}</div>
      <h3>${esc(a.titulo)}</h3>
      ${!extra.quando && meta ? `<span class="meta">${esc(meta)}</span>` : ''}
      ${extra.trecho ? `<div class="trecho">${esc(extra.trecho)}</div>` : ''}
      ${extra.conflito ? '<span class="conflito">Conflito de horário</span>' : ''}
    </div>
    ${estrela(a)}
  </article>`;
}

/* ---------- telas ---------- */
function telaPrograma() {
  const cfg = E.cfg, ag = agora(), dia = diaDe(E.dia);
  const tipos = cfg.filtros[E.filtro].tipos;
  const doDia = E.atividades.filter(a => a.dia === E.dia && (a.tipo === 'pausa' ? !tipos.length : (!tipos.length || tipos.includes(a.tipo))));
  const faixas = [];
  for (const a of doDia) {
    const chave = a.tipo === 'campo' ? a.id : a.inicio + '-' + a.fim;
    let f = faixas.find(x => x.chave === chave);
    if (!f) faixas.push(f = { chave, a0: a, lista: [] });
    f.lista.push(a);
  }
  const corpoFaixas = faixas.map(({ a0, lista }) => {
    const i0 = min(a0.inicio), i1 = min(a0.fim) || i0 + 120;
    const agoraAqui = dia.data === ag.data && ag.min >= i0 && ag.min < i1;
    const reais = lista.filter(a => a.tipo !== 'pausa');
    return `<section class="faixa">
      <div class="hora"><strong>${hm(a0.inicio)}</strong><small>${hm(a0.fim)}</small>${agoraAqui ? '<span class="agora">AGORA</span>' : ''}</div>
      <div class="lista">
        ${a0.tipo === 'pausa' ? `<div class="pausa">${esc(a0.titulo)}</div>` : ''}
        ${reais.length > 1 ? `<div class="simult">${reais.length} atividades simultâneas</div>` : ''}
        ${reais.map(a => card(a)).join('')}
      </div>
    </section>`;
  }).join('');
  const temReais = doDia.some(a => a.tipo !== 'pausa');

  return `<header class="topo">
      <div class="textura" style="background-image:url(${(cfg.visual.texturasPorDia || {})[E.dia] || cfg.visual.texturaPadrao})"></div>
      <div class="logo-wrap"><img src="${cfg.visual.logo}" alt="${esc(cfg.evento.nome + ' — ' + cfg.evento.tema)}"></div>
      <div class="sub">${esc(cfg.evento.subtitulo)}</div>
    </header>
    <div class="barra">
      <div class="dias" style="grid-template-columns:repeat(${E.dias.length},minmax(0,1fr))">
        ${E.dias.map(d => `<button class="dia ${d.data === E.dia ? 'ativo' : ''} ${d.data === ag.data ? 'hoje' : ''}" data-dia="${d.data}"><small>${d.sigla}</small><strong>${d.num}</strong></button>`).join('')}
      </div>
      <div class="filtros">
        ${cfg.filtros.map((f, i) => `<button class="chip ${i === E.filtro ? 'ativo' : ''}" data-filtro="${i}">${esc(f.nome)}</button>`).join('')}
      </div>
    </div>
    <div class="conteudo">
      ${E.avisos.length ? `<div class="avisos">${E.avisos.map(t => `<p>${esc(t)}</p>`).join('')}</div>` : ''}
      <div class="cabeca"><h1>${dia.nome}</h1><span>${dia.num}/${dia.mes}</span></div>
      ${temReais ? corpoFaixas : '<p class="vazio">Nenhuma atividade deste tipo neste dia.</p>'}
    </div>`;
}

function telaBusca() {
  return `<div class="pagina fixa">
      <h1>Buscar</h1>
      <input class="campo-busca" id="campo-busca" type="search" value="${esc(E.busca)}" placeholder="Título, autor(a), coordenação ou sala" autocomplete="off">
    </div>
    <div class="conteudo" id="resultados" style="gap:8px;padding-top:12px">${resultadosBusca()}</div>`;
}
function resultadosBusca() {
  const q = norm(E.busca.trim());
  if (q.length < 2) {
    return `<p class="vazio" style="margin:0 4px">Encontre sua sessão pelo título do trabalho, pelo nome de quem apresenta ou pela sala.</p>
      <div class="sugestoes" style="padding:0 4px">${(E.cfg.sugestoesBusca || []).map(s => `<button class="chip" data-sugestao="${esc(s)}">${esc(s)}</button>`).join('')}</div>`;
  }
  const achados = [];
  for (const a of E.atividades) {
    if (a.tipo === 'pausa') continue;
    const item = a.itens.find(t => norm(t.titulo + ' ' + t.autores).includes(q));
    const pessoa = a.pessoas.find(p => norm(p.nomes).includes(q));
    const trecho = item ? `“${item.titulo}”${item.autores ? ' — ' + item.autores : ''}` : pessoa ? `${pessoa.papel}: ${pessoa.nomes}` : '';
    if (trecho || norm([a.codigo, a.titulo, a.local].join(' ')).includes(q)) {
      const d = diaDe(a.dia);
      achados.push(card(a, { trecho, quando: `${d.sigla} ${d.num} · ${hm(a.inicio)}${a.local ? ' · ' + a.local : ''}` }));
    }
  }
  const info = achados.length ? `${achados.length} resultado${achados.length > 1 ? 's' : ''}` : 'Nenhum resultado. Tente outro nome ou palavra.';
  return `<span class="vazio" style="margin:0 4px">${info}</span>${achados.join('')}`;
}

function telaAgenda() {
  const favs = E.atividades.filter(a => E.favs.includes(a.id));
  let conflitos = 0;
  const grupos = E.dias.map(d => {
    const doDia = favs.filter(a => a.dia === d.data);
    if (!doDia.length) return '';
    const cards = doDia.map(a => {
      const i0 = min(a.inicio), i1 = min(a.fim) || i0 + 120;
      const conflito = doDia.some(b => b !== a && min(b.inicio) < i1 && (min(b.fim) || min(b.inicio) + 120) > i0);
      if (conflito) conflitos++;
      return card(a, { comHora: true, conflito });
    }).join('');
    return `<h2 class="grupo-dia">${d.nome}, ${d.num}/${d.mes}</h2>${cards}`;
  }).join('');
  const info = favs.length ? `${favs.length} atividade${favs.length > 1 ? 's' : ''}${conflitos ? ` · ${conflitos} com conflito` : ''}` : 'Suas atividades salvas';
  return `<div class="pagina">
      <div class="linha">
        <div style="display:flex;flex-direction:column;gap:4px"><h1>Minha agenda</h1><span class="vazio" style="margin:0">${info}</span></div>
        ${favs.length ? '<button class="btn-borda" data-ics="todos">↓ Calendário</button>' : ''}
      </div>
    </div>
    ${favs.length ? `<div class="conteudo" style="gap:8px;padding-top:0">${grupos}</div>`
      : `<div class="caixa-vazia"><strong>Nada salvo ainda</strong><span>Toque na estrela de qualquer atividade para montar sua agenda. Ela fica guardada neste aparelho, sem cadastro.</span></div>`}`;
}

function telaInfo() {
  const c = E.cfg;
  return `<div class="hero">
      <img src="${c.visual.logoClaro}" alt="${esc(c.evento.nome)}">
      <p class="tema">${esc(c.evento.tema)}</p>
      <p>${esc(c.evento.descricao)}</p>
    </div>
    <div class="blocos">
      <div class="bloco"><h2>Local</h2><p class="forte">${esc(c.evento.local)}</p><p>${esc(c.evento.endereco)}</p>
        <a class="btn-escuro" href="${esc(c.evento.mapa)}" target="_blank" rel="noopener">Abrir no mapa ↗</a></div>
      ${c.salas?.length ? `<div class="bloco"><h2>Salas</h2><div class="salas">${c.salas.map(s => `<div class="sala ${s.destaque ? 'destaque' : ''}"><strong>${esc(s.numero)}</strong><span>${esc(s.descricao)}</span></div>`).join('')}</div></div>` : ''}
      ${(c.blocosInfo || []).map(b => `<div class="bloco">
        <div style="display:flex;flex-direction:column;gap:4px"><h2>${esc(b.titulo)}</h2>${b.subtitulo ? `<small>${esc(b.subtitulo)}</small>` : ''}</div>
        ${b.texto ? `<p>${esc(b.texto)}</p>` : ''}
        ${(b.itens || []).map(i => `<div class="item"><span class="forte" style="font-size:13px">${esc(i.titulo)}</span><small>${esc(i.texto)}</small></div>`).join('')}
      </div>`).join('')}
      ${c.visual.logosApoio ? `<div class="apoio"><h2 class="rotulo">Realização e apoio</h2><img src="${c.visual.logosApoio}" alt="UFRJ, IPPUR, PPGPUR, GPDES, CNPq, CAPES, FAPERJ"></div>` : ''}
      <div class="dica"><strong>Use como app</strong><span>No navegador do celular, toque em “Compartilhar” ou no menu ⋮ e escolha “Adicionar à tela inicial”.</span></div>
    </div>`;
}

function telaDetalhe(a) {
  const t = tipoDe(a), d = diaDe(a.dia), on = E.favs.includes(a.id), cor = corDe(t.cor);
  const podeCompartilhar = !!navigator.share;
  return `<div class="det-topo" style="background:${cor}">
      <div class="acoes">
        <button class="pilula" data-acao="voltar"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M15 5l-7 7 7 7"/></svg>Voltar</button>
        <button class="pilula" data-acao="compartilhar">${podeCompartilhar ? 'Compartilhar' : 'Copiar link'}</button>
      </div>
      <small>${esc(t.nome)}${a.codigo ? ' · ' + esc(a.codigo) : ''}</small>
      <h1>${esc(a.titulo)}</h1>
    </div>
    <div class="det-corpo">
      <div class="ficha">
        <div><span>Dia</span><b>${d.nome}, ${d.num}/${d.mes}</b></div>
        <div><span>${t.horaRotulo || 'Horário'}</span><b>${a.fim ? `${hm(a.inicio)} – ${hm(a.fim)}` : hm(a.inicio)}</b></div>
        <div><span>${t.localRotulo || 'Local'}</span><b>${esc(a.local || 'A confirmar')}</b></div>
      </div>
      <div class="botoes">
        <button class="salvar ${on ? 'on' : ''}" data-fav="${a.id}">${on ? '★ Na agenda' : '☆ Salvar'}</button>
        <button data-ics="${a.id}">↓ Calendário</button>
      </div>
      ${a.pessoas.length ? `<div class="pessoas">${a.pessoas.map(p => `<div><span class="rotulo">${esc(p.papel)}</span>${esc(p.nomes)}</div>`).join('')}</div>` : ''}
      ${a.obs ? `<p class="obs">${esc(a.obs)}</p>` : ''}
      ${a.itens.length ? `<div class="trabalhos"><h2>${esc(t.lista || 'Trabalhos')} (${a.itens.length})</h2>
        ${a.itens.map((x, i) => `<div class="trabalho"><b style="color:${cor}">${pad(i + 1)}</b><div><strong>${esc(x.titulo)}</strong>${x.autores ? `<small>${esc(x.autores)}</small>` : ''}</div></div>`).join('')}
      </div>` : ''}
    </div>`;
}

/* ---------- desenho ---------- */
function desenhar() {
  const telas = { prog: telaPrograma, busca: telaBusca, agenda: telaAgenda, info: telaInfo };
  $('#tela').innerHTML = telas[E.aba]();
  document.querySelectorAll('.abas button').forEach(b => b.classList.toggle('ativo', b.dataset.aba === E.aba));
  const n = $('#contador'); n.hidden = !E.favs.length; n.textContent = E.favs.length;
  desenharDetalhe();
}
function desenharDetalhe() {
  const id = decodeURIComponent(location.hash.slice(1));
  const a = E.atividades.find(x => x.id === id);
  const el = $('#detalhe');
  el.hidden = !a;
  document.body.style.overflow = a ? 'hidden' : '';
  if (a) el.innerHTML = telaDetalhe(a);
}

/* ---------- ações ---------- */
function alternarFav(id) {
  const on = E.favs.includes(id);
  E.favs = on ? E.favs.filter(x => x !== id) : [...E.favs, id];
  salvarFavs(); aviso(on ? 'Removido da agenda' : 'Salvo na sua agenda');
  const y = scrollY; desenhar(); scrollTo(0, y);
}

function baixarIcs(lista, nome) {
  const f = d => d.toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const x = s => String(s || '').replace(/([,;\\])/g, '\\$1');
  const fuso = E.cfg.evento.fuso;
  const eventos = lista.map(a => {
    const ini = new Date(`${a.dia}T${a.inicio}:00${fuso}`);
    const fim = a.fim ? new Date(`${a.dia}T${a.fim}:00${fuso}`) : new Date(ini.getTime() + 2 * 3600e3);
    return ['BEGIN:VEVENT', `UID:${a.id}@semanaippur`, `DTSTAMP:${f(new Date())}`, `DTSTART:${f(ini)}`, `DTEND:${f(fim)}`,
      `SUMMARY:${x((a.codigo ? a.codigo + ' · ' : '') + a.titulo)}`, `LOCATION:${x(a.local || E.cfg.evento.local)}`, 'END:VEVENT'].join('\r\n');
  });
  const txt = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Semana IPPUR//PT', ...eventos, 'END:VCALENDAR'].join('\r\n');
  const url = URL.createObjectURL(new Blob([txt], { type: 'text/calendar' }));
  const link = Object.assign(document.createElement('a'), { href: url, download: nome + '.ics' });
  document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

async function compartilhar(a) {
  const url = location.href.split('#')[0] + '#' + a.id;
  try {
    if (navigator.share) return await navigator.share({ title: E.cfg.evento.nome, text: (a.codigo ? a.codigo + ' · ' : '') + a.titulo, url });
    await navigator.clipboard.writeText(url); aviso('Link copiado');
  } catch (e) {}
}

document.addEventListener('click', e => {
  const el = e.target.closest('[data-fav],[data-abrir],[data-dia],[data-filtro],[data-aba],[data-sugestao],[data-ics],[data-acao]');
  if (!el) return;
  const d = el.dataset;
  if (d.fav) { e.stopPropagation(); return alternarFav(d.fav); }
  if (d.abrir) { E.abriuPorClique = true; location.hash = d.abrir; return; }
  if (d.dia) { E.dia = d.dia; return desenhar(); }
  if (d.filtro) { E.filtro = +d.filtro; return desenhar(); }
  if (d.aba) { E.aba = d.aba; desenhar(); return scrollTo(0, 0); }
  if (d.sugestao) { E.busca = d.sugestao; $('#campo-busca').value = d.sugestao; $('#resultados').innerHTML = resultadosBusca(); return; }
  if (d.ics) {
    const lista = d.ics === 'todos' ? E.atividades.filter(a => E.favs.includes(a.id)) : E.atividades.filter(a => a.id === d.ics);
    return baixarIcs(lista, d.ics === 'todos' ? 'minha-agenda-semana-ippur' : slug(lista[0].codigo || lista[0].titulo));
  }
  if (d.acao === 'voltar') { if (E.abriuPorClique) history.back(); else history.replaceState(null, '', location.pathname + location.search), desenharDetalhe(); E.abriuPorClique = false; return; }
  if (d.acao === 'compartilhar') { const a = E.atividades.find(x => x.id === decodeURIComponent(location.hash.slice(1))); if (a) compartilhar(a); }
});
document.addEventListener('input', e => {
  if (e.target.id === 'campo-busca') { E.busca = e.target.value; $('#resultados').innerHTML = resultadosBusca(); }
});
addEventListener('hashchange', desenharDetalhe);

/* ---------- início ---------- */
async function iniciar() {
  const pegar = (url, tipo) => fetch(url, { cache: 'no-cache' }).then(r => { if (!r.ok) throw new Error(url); return r[tipo](); });
  try {
    const [cfg, txt, avisos] = await Promise.all([pegar('config.json', 'json'), pegar('programacao.txt', 'text'), pegar('avisos.txt', 'text').catch(() => '')]);
    E.cfg = cfg;
    Object.entries(cfg.cores).forEach(([k, v]) => document.documentElement.style.setProperty('--' + k, v));
    E.atividades = lerProgramacao(txt);
    E.avisos = avisos.split(/\r?\n/).map(s => s.trim()).filter(s => s && !s.startsWith('//'));
    montarDias();
    const hoje = agora().data;
    E.dia = (diaDe(hoje) || E.dias[0]).data;
    desenhar();
  } catch (err) {
    $('#tela').innerHTML = `<p class="carregando">Não foi possível carregar a programação (${esc(err.message)}).</p>`;
    console.error(err);
  }
}
iniciar();

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
