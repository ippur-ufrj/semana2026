# XXXI Semana IPPUR · Programação

Site com cara de app (19 a 24/10/2026), publicado no GitHub Pages.

## Estrutura

```
meu_app/
├─ index.html          app (não editar)
├─ estilo.css          visual (não editar)
├─ app.js              funcionamento (não editar)
├─ sw.js               funciona sem internet (não editar)
├─ manifest.json       instalar na tela inicial (não editar)
├─ .nojekyll           arquivo vazio — só precisa existir
├─ programacao.txt     ✏️ toda a programação
├─ avisos.txt          ✏️ avisos no topo
├─ config.json         ✏️ textos, cores, tipos, filtros, salas, texturas por dia
├─ README.md           este guia
├─ fontes/             Horizon.otf · consolab.ttf
└─ assets/             logo.png · logo-branco.png · logos-apoio.png · icone-192.png · icone-512.png
                       fundo-cidade · fundo-campo-verde · fundo-cidade-marrom
                       fundo-campo-marrom · fundo-grafismo-marrom · fundo-campo (.png)
```

## Publicar (primeira vez)

1. Entre em github.com → **+** (canto superior direito) → **New repository**.
2. Nome: `meu_app` · **Public** · não marque nada mais → **Create repository**.
3. Na página do repositório vazio, clique em **uploading an existing file**.
4. No computador, abra a pasta descompactada, selecione **tudo o que está dentro dela** (inclusive as pastas `assets` e `fontes`) e arraste para a página.
   - O arquivo `.nojekyll` é oculto: no Mac, `Cmd+Shift+.` mostra; no Windows, Exibir → Itens ocultos. Se não subir, crie no GitHub: **Add file → Create new file**, nome `.nojekyll`, deixe vazio, **Commit**.
5. Espere o upload terminar → **Commit changes**.
6. Confira: `index.html` deve estar na raiz (não dentro de outra pasta).
7. **Settings** → menu lateral **Pages** → em *Build and deployment*: Source **Deploy from a branch** · Branch **main** · pasta **/ (root)** → **Save**.
8. Aguarde 1–3 min (aba **Actions** mostra o andamento). O endereço aparece no topo de *Pages*:
   `https://SEU-USUARIO.github.io/meu_app/`
9. Teste no celular. Para testar o selo "AGORA": `…/meu_app/?agora=2026-10-20T14:10`

## Editar a programação

Abra `programacao.txt` → ✏️ (lápis) → edite → **Commit changes**. O site atualiza em 1–2 min.

```
# 19/10/2026
## 13:30-16:00 | st | Sala 522
Código: ST 1
Título: Áreas Centrais em Disputa
Coordenação: Fernanda Verri
- Autor A; Autor B | Título do trabalho
```

- `#` abre um dia · `##` abre uma atividade: **horário | tipo | local**
- `Código:`, `Título:`, `Obs:` são campos fixos; qualquer outro `Papel: nomes` vira pessoa
- `- autores | título` = item da lista (trabalhos, livros, pôsteres)
- Tipos: `abertura, conferencia, mesa, st, sl, especial, livros, poster, campo, festa, pausa`
- Linhas que começam com `//` são ignoradas

## Avisos

Em `avisos.txt`, cada linha sem `//` vira um aviso vermelho no topo. Apague quando não valer mais.

## Trocar imagens

**Add file → Upload files**, envie para `assets/` com o **mesmo nome** do arquivo antigo.
Texturas por dia: `config.json` → `visual.texturasPorDia`.

## Se mudar index.html, estilo.css ou app.js

Em `sw.js`, aumente a versão (`semana-ippur-v3` → `v4`) para os celulares baixarem a versão nova.
