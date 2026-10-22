(async function () {
  const { call, el, fmt } = Geo, root = document.getElementById('root');
  const slug = new URLSearchParams(location.search).get('slug');
  const box = (cls, h, p, b) => root.replaceChildren(el('div', { class: 'state ' + cls }, [el('h3', { text: h }), el('p', { text: p }), ...(b ? [b] : [])]));
  async function load() {
    if (!slug) return box('', 'Artigo não informado', 'Volte e escolha um artigo.');
    box('', 'Carregando…', '');
    let p;
    try { p = await call('get', { slug }); } catch (e) {
      return e.code === 'NOT_FOUND' ? box('', 'Artigo não encontrado', 'Ele pode não existir ou não estar publicado.')
        : box('err', 'Falha ao carregar', e.message, el('button', { class: 'btn', text: 'Tentar novamente', onclick: load }));
    }
    root.replaceChildren(Geo.renderPost(p));
  }
  Geo.renderPost = function (p, preview) {
    document.title = p.title + ' — GeoBlog';
    const a = el('article', { class: 'post' }, [el('span', { class: 'badge', text: p.category || 'Geral' }), el('h1', { text: p.title }), el('p', { class: 'lead', text: p.description }),
      el('p', { class: 'meta', text: 'Publicado em ' + fmt(p.publishedAt, true) + ' · Atualizado em ' + fmt(p.updatedAt, true) }),
      el('div', { class: 'chips' }, p.tags.concat([]).map(x => el('span', { class: 'badge', text: '#' + x })))]);
    if (p.coverUrl) {
      const img = el('img', { src: p.coverUrl, alt: p.coverAlt || '' }), fig = el('figure', {}, [img]);
      img.onerror = () => { fig.replaceChildren(el('div', { class: 'msg info', text: 'Não foi possível carregar a imagem de capa.' })); };
      if (p.caption) fig.append(el('figcaption', { text: p.caption })); a.append(fig);
    }
    const c = el('div', { class: 'content' }); c.innerHTML = p.content; a.append(c); // HTML já sanitizado no servidor
    if (p.references) a.append(el('h2', { text: 'Referências' }), el('div', { class: 'refs', text: p.references }));
    if (p.metadata) a.append(el('p', { class: 'meta', text: p.metadata }));
    a.append(el('h2', { text: 'Teste seus conhecimentos' }));
    p.questions.forEach((q, i) => a.append(question(q, p, i, preview)));
    return a;
  };
  function question(q, p, i, preview) {
    const res = el('div', { class: 'res', role: 'status' }), card = el('div', { class: 'q' });
    if (q.type === 'open') {
      const ta = el('textarea', { id: 'q' + i, rows: 4, maxlength: q.maxChars }), cnt = el('div', { class: 'meta', text: '0/' + q.maxChars });
      ta.addEventListener('input', () => cnt.textContent = ta.value.length + '/' + q.maxChars);
      card.append(el('label', { class: 'sans', for: 'q' + i, text: (i + 1) + '. ' + q.prompt, style: 'font-weight:600;display:block;margin-bottom:8px' }), ta, cnt,
        el('div', { class: 'meta', text: 'Resposta discursiva: não é enviada nem armazenada.' }));
      return card;
    }
    const fs = el('fieldset', {}, [el('legend', { text: (i + 1) + '. ' + q.prompt })]);
    q.options.forEach((o, k) => fs.append(el('label', { class: 'opt' }, [el('input', { type: 'radio', name: 'q' + i, value: k }), el('span', { text: o })])));
    const btn = el('button', { class: 'btn', type: 'button', text: 'Verificar' });
    btn.onclick = async () => {
      const s = fs.querySelector('input:checked');
      if (!s) { res.className = 'res no'; res.textContent = 'Selecione uma alternativa.'; return; }
      if (preview) { res.className = 'res'; res.textContent = 'Correção indisponível na pré-visualização.'; return; }
      btn.disabled = true;
      try { const r = await call('check', { postId: p.id, questionId: q.id, optionIndex: Number(s.value) });
        res.className = 'res ' + (r.correct ? 'ok' : 'no'); res.textContent = r.correct ? '✔ Resposta correta!' : '✘ Resposta incorreta. Tente novamente.';
      } catch (e) { res.className = 'res no'; res.textContent = e.message; }
      btn.disabled = false;
    };
    card.append(fs, btn, res); return card;
  };
  if (root) load();
})();
