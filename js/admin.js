(function () {
  const { call, el, fmt } = Geo, $ = id => document.getElementById(id);
  let token = null, items = [], cur = null, qs = [], busy = false; // token só em memória
  const BK = 'geoblog_rascunho_pendente'; // backup local SEM senha/token
  const show = v => ['vLogin', 'vList', 'vEdit'].forEach(x => $(x).classList.toggle('hidden', x !== v));
  const note = (t, c) => { $('msg').replaceChildren(t ? el('div', { class: 'msg ' + (c || 'err'), text: t }) : ''); if (t) window.scrollTo(0, 0); };
  const toLogin = m => { token = null; ['bPw', 'bOut'].forEach(i => $(i).classList.add('hidden')); show('vLogin'); note(m || '', 'err'); };
  async function api(a, d) {
    try { return await call(a, d, token); } catch (e) { if (e.code === 'SESSION') toLogin(e.message); throw e; }
  }
  async function guard(btn, f) {
    if (busy) return; busy = true; btn && (btn.disabled = true);
    try { await f(); } catch (e) { if (e.code !== 'SESSION') note(e.message); } finally { busy = false; btn && (btn.disabled = false); }
  }
  $('bIn').onclick = () => guard($('bIn'), async () => {
    const r = await call('login', { password: $('pw').value }); $('pw').value = ''; token = r.token; note('');
    ['bPw', 'bOut'].forEach(i => $(i).classList.remove('hidden')); await list();
  });
  $('pw').addEventListener('keydown', e => e.key === 'Enter' && $('bIn').click());
  $('bOut').onclick = async () => { try { await call('logout', {}, token); } catch (e) { } toLogin('Sessão encerrada.'); };
  $('bPw').onclick = () => $('dPw').showModal(); $('xPw').onclick = () => $('dPw').close();
  $('sPw').onclick = () => guard($('sPw'), async () => {
    await api('changePassword', { current: $('pc').value, next: $('pn').value }); $('pc').value = $('pn').value = ''; $('dPw').close(); note('Senha alterada com sucesso.', 'ok');
  });
  async function list() {
    items = await api('adminList'); show('vList'); drawList();
  }
  function drawList() {
    const q = $('aq').value.toLowerCase(), s = $('as').value;
    const r = items.filter(p => (!s || p.status === s) && (!q || (p.title + p.category + p.tags.join(' ')).toLowerCase().includes(q)));
    $('items').replaceChildren(...(r.length ? r.map(p => el('div', { class: 'list-item' }, [
      el('div', {}, [el('strong', { text: p.title }), el('div', { class: 'meta', text: (p.category || 'Sem categoria') + ' · atualizado ' + fmt(p.updatedAt, true) + (p.status === 'published' && Date.parse(p.publishedAt) > Date.now() ? ' · agendado' : '') })]),
      el('div', { style: 'display:flex;gap:8px;align-items:center' }, [el('span', { class: 'badge ' + (p.status === 'published' ? 'pub' : 'draft'), text: p.status === 'published' ? 'Publicado' : 'Rascunho' }),
        el('button', { class: 'btn alt', type: 'button', text: 'Editar', onclick: e => guard(e.target, () => edit(p.id)) }),
        el('button', { class: 'btn dng', type: 'button', text: 'Excluir', onclick: e => guard(e.target, async () => {
          if (!confirm('Excluir "' + p.title + '" definitivamente? Esta ação não pode ser desfeita.')) return note('Exclusão cancelada.', 'info');
          await api('remove', { id: p.id }); note('Artigo excluído.', 'ok'); await list(); }) })])]))
      : [el('div', { class: 'state', style: 'margin-top:14px' }, [el('h3', { text: 'Nenhum artigo' })])]));
  }
  ['aq', 'as'].forEach(i => $(i).addEventListener('input', drawList));
  // ---- editor ----
  const tbBtn = (t, l, f) => $('tb').append(el('button', { type: 'button', text: t, 'aria-label': l, title: l, onclick: f }));
  const fb = b => { $('ed').focus(); document.execCommand('formatBlock', false, b); };
  const cmd = c => { $('ed').focus(); document.execCommand(c); };
  tbBtn('¶', 'Parágrafo', () => fb('p')); tbBtn('H2', 'Título', () => fb('h2')); tbBtn('H3', 'Subtítulo', () => fb('h3'));
  tbBtn('N', 'Negrito', () => cmd('bold')); tbBtn('I', 'Itálico', () => cmd('italic'));
  tbBtn('• Lista', 'Lista não ordenada', () => cmd('insertUnorderedList')); tbBtn('1. Lista', 'Lista ordenada', () => cmd('insertOrderedList'));
  tbBtn('Link', 'Inserir link', () => { const u = prompt('Endereço (https://...)'); if (u && /^https?:\/\//i.test(u)) { $('ed').focus(); document.execCommand('createLink', false, u); } else if (u) note('Use um link http(s) válido.'); });
  tbBtn('✕', 'Remover link', () => cmd('unlink'));
  const newId = () => (crypto.randomUUID ? crypto.randomUUID() : 'id-' + Date.now() + '-' + Math.random().toString(16).slice(2));
  const toLocal = iso => { if (!iso) return ''; const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).formatToParts(new Date(iso)).map(x => [x.type, x.value])); return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`; };
  const toIso = v => v ? new Date(v + ':00-03:00').toISOString() : '';
  function fill(p) {
    cur = p; $('eh').textContent = p.title ? 'Editar artigo' : 'Novo artigo';
    $('title').value = p.title || ''; $('slug').value = p.slug || ''; $('desc').value = p.description || ''; $('cover').value = p.coverUrl || ''; $('calt').value = p.coverAlt || '';
    $('cap').value = p.caption || ''; $('cat').value = p.category || ''; $('tags').value = (p.tags || []).join(', '); $('ed').innerHTML = p.content || '';
    $('refs').value = p.references || ''; $('meta').value = p.metadata || ''; $('dc').value = toLocal(p.createdAt); $('dp').value = toLocal(p.publishedAt);
    qs = (p.questions || []).map(q => ({ type: q.type, prompt: q.prompt, options: q.options ? q.options.slice() : ['', ''], correctIndex: q.correctIndex == null ? '' : q.correctIndex, maxChars: q.maxChars || 500 }));
    drawQ(); coverPrev(); show('vEdit'); window.scrollTo(0, 0);
    let b = null; try { b = JSON.parse(localStorage.getItem(BK)); } catch (e) { }
    $('bk').replaceChildren(b && b.id === p.id ? el('div', { class: 'msg info' }, [document.createTextNode('Há um rascunho local não enviado deste artigo. '), el('button', { class: 'btn alt', type: 'button', text: 'Restaurar', onclick: () => { fill(Object.assign({}, b, { createdAt: b.createdAt })); } })]) : '');
  }
  async function edit(id) { fill(await api('adminGet', { id })); }
  $('bNew').onclick = () => fill({ id: newId(), tags: [], questions: [] });
  $('bBack').onclick = () => guard($('bBack'), list);
  function coverPrev() {
    const u = $('cover').value.trim(); $('cprev').replaceChildren();
    if (!u) return; if (!/^https?:\/\//i.test(u)) return $('cprev').append(el('div', { class: 'msg err', text: 'URL inválida.' }));
    const i = el('img', { src: u, alt: 'Pré-visualização da capa', style: 'max-height:160px;border-radius:10px' });
    i.onerror = () => $('cprev').replaceChildren(el('div', { class: 'msg err', text: 'Não foi possível carregar esta imagem.' })); $('cprev').append(i);
  }
  $('cover').addEventListener('change', coverPrev);
  function drawQ() {
    $('qc').textContent = '(' + qs.length + '/3 — para publicar são necessárias exatamente 3)';
    $('aqn').classList.toggle('hidden', qs.length >= 3);
    $('qs').replaceChildren(...qs.map((q, i) => {
      const box = el('div', { class: 'qe' }), ty = el('select', { 'aria-label': 'Tipo da pergunta ' + (i + 1) }, [el('option', { value: 'single', text: 'Alternativa única' }), el('option', { value: 'open', text: 'Discursiva' })]);
      ty.value = q.type; ty.onchange = () => { q.type = ty.value; drawQ(); };
      const pr = el('textarea', { rows: 2, 'aria-label': 'Enunciado ' + (i + 1), placeholder: 'Enunciado', maxlength: 500 }); pr.value = q.prompt; pr.oninput = () => q.prompt = pr.value;
      box.append(el('div', { class: 'row' }, [ty, el('button', { class: 'btn dng', type: 'button', text: 'Remover pergunta', onclick: () => { qs.splice(i, 1); drawQ(); } })]), pr);
      if (q.type === 'open') {
        const m = el('input', { type: 'number', min: 50, max: 2000, 'aria-label': 'Limite de caracteres' }); m.value = q.maxChars; m.oninput = () => q.maxChars = m.value;
        box.append(el('label', { class: 'l', text: 'Limite de caracteres (50–2000)' }), m);
      } else {
        q.options.forEach((o, k) => { const t = el('input', { 'aria-label': 'Alternativa ' + (k + 1), maxlength: 200 }); t.value = o; t.oninput = () => q.options[k] = t.value;
          const r = el('input', { type: 'radio', name: 'ok' + i, 'aria-label': 'Marcar alternativa ' + (k + 1) + ' como correta' }); r.checked = q.correctIndex === k; r.onchange = () => q.correctIndex = k;
          box.append(el('div', { class: 'oe' }, [r, t, el('button', { class: 'btn alt', type: 'button', text: '−', 'aria-label': 'Remover alternativa', onclick: () => { if (q.options.length <= 2) return; q.options.splice(k, 1); q.correctIndex = q.correctIndex === k ? '' : (q.correctIndex > k ? q.correctIndex - 1 : q.correctIndex); drawQ(); } })])); });
        if (q.options.length < 5) box.append(el('button', { class: 'btn alt', type: 'button', text: '+ Alternativa', onclick: () => { q.options.push(''); drawQ(); } }));
        box.append(el('div', { class: 'meta', text: 'Marque o botão de rádio da alternativa correta.' }));
      }
      return box;
    }));
  }
  $('aqn').onclick = () => { qs.push({ type: 'single', prompt: '', options: ['', ''], correctIndex: '', maxChars: 500 }); drawQ(); };
  const collect = status => ({ id: cur.id, title: $('title').value, slug: $('slug').value, description: $('desc').value, coverUrl: $('cover').value, coverAlt: $('calt').value, caption: $('cap').value,
    category: $('cat').value, tags: $('tags').value, content: $('ed').innerHTML, references: $('refs').value, metadata: $('meta').value, createdAt: toIso($('dc').value), publishedAt: toIso($('dp').value), status, questions: qs });
  const save = (btn, status) => guard(btn, async () => {
    const d = collect(status);
    try { const r = await api('save', d); localStorage.removeItem(BK); note(status === 'published' ? 'Artigo publicado (confirmado pelo servidor).' : 'Rascunho salvo (confirmado pelo servidor).', 'ok'); await edit(r.id); note(status === 'published' ? 'Artigo publicado (confirmado pelo servidor).' : 'Rascunho salvo (confirmado pelo servidor).', 'ok'); }
    catch (e) { if (e.kind === 'network') try { localStorage.setItem(BK, JSON.stringify(d)); } catch (x) { } throw e; }
  });
  $('bDraft').onclick = () => save($('bDraft'), 'draft'); $('bPub').onclick = () => save($('bPub'), 'published');
  $('bPrev').onclick = () => guard($('bPrev'), async () => { const p = await api('preview', collect('draft')); $('pv').replaceChildren(Geo.renderPost(p, true)); $('dPrev').showModal(); });
  $('cPrev').onclick = () => $('dPrev').close();
  show('vLogin');
})();
