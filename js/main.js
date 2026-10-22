(async function () {
  const { call, el, fmt } = Geo, out = document.getElementById('out'), $ = id => document.getElementById(id);
  $('y').textContent = new Date().getFullYear();
  let posts = [];
  const state = (cls, h, p, btn) => out.replaceChildren(el('div', { class: 'state ' + cls }, [el('h3', { text: h }), el('p', { text: p }), ...(btn ? [btn] : [])]));
  async function load() {
    state('', 'Carregando…', 'Buscando os artigos.');
    try { posts = await call('list'); } catch (e) {
      return state('err', 'Não foi possível carregar os artigos', e.message, el('button', { class: 'btn', text: 'Tentar novamente', onclick: load }));
    }
    if (!posts.length) return state('', 'Ainda não há artigos publicados', 'Os primeiros conteúdos de Geografia aparecerão aqui em breve.');
    const fill = (id, vals) => { const s = $(id); [...new Set(vals)].sort().forEach(v => s.append(el('option', { value: v, text: v }))); };
    fill('cat', posts.map(p => p.category).filter(Boolean)); fill('tag', posts.flatMap(p => p.tags));
    render();
  }
  function render() {
    const q = $('q').value.trim().toLowerCase(), c = $('cat').value, t = $('tag').value, asc = $('ord').value === 'asc';
    const r = posts.filter(p => (!c || p.category === c) && (!t || p.tags.includes(t)) &&
      (!q || (p.title + ' ' + p.description + ' ' + p.tags.join(' ')).toLowerCase().includes(q)))
      .sort((a, b) => (Date.parse(a.publishedAt) - Date.parse(b.publishedAt)) * (asc ? 1 : -1));
    if (!r.length) return state('', 'Nenhum artigo encontrado', 'Ajuste a pesquisa ou os filtros.');
    out.replaceChildren(el('div', { class: 'grid' }, r.map(p => {
      const img = el('img', { class: 'cv', alt: p.coverAlt || '', loading: 'lazy' });
      if (p.coverUrl) { img.src = p.coverUrl; img.onerror = () => { img.removeAttribute('src'); }; } else img.alt = '';
      return el('a', { class: 'card', href: 'post.html?slug=' + encodeURIComponent(p.slug) }, [img, el('div', { class: 'b' }, [
        el('span', { class: 'badge', text: p.category || 'Geral' }), el('h3', { text: p.title }), el('p', { text: p.description }),
        el('div', { class: 'chips' }, p.tags.map(x => el('span', { class: 'badge', text: '#' + x }))),
        el('span', { class: 'meta', text: fmt(p.publishedAt) + ' · Ler artigo →' })])]);
    })));
  }
  ['q', 'cat', 'tag', 'ord'].forEach(id => $(id).addEventListener('input', () => posts.length && render()));
  load();
})();
