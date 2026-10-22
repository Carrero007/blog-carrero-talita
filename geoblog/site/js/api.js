(function () {
  async function call(action, data, token) {
    const url = window.GEOBLOG_API_URL;
    if (!url || url.indexOf('script.google.com') < 0) throw { kind: 'config', message: 'A URL da API ainda não foi configurada em js/config.js.' };
    const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 30000);
    let res;
    try {
      // text/plain evita preflight CORS, que o Apps Script não suporta
      res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action, data: data || {}, token }), signal: ctl.signal, redirect: 'follow' });
    } catch (e) {
      throw { kind: 'network', message: e.name === 'AbortError' ? 'O servidor demorou demais para responder.' : 'Falha de conexão com o servidor.' };
    } finally { clearTimeout(timer); }
    let j;
    try { j = await res.json(); } catch (e) { throw { kind: 'network', message: 'Resposta inválida do servidor (verifique a implantação do Apps Script).' }; }
    if (!j.ok) throw { kind: 'api', code: j.code, message: j.message || 'Erro na operação.' };
    return j.data;
  }
  function el(tag, props, kids) {
    const n = document.createElement(tag);
    Object.entries(props || {}).forEach(([k, v]) => { if (k === 'text') n.textContent = v; else if (k === 'class') n.className = v; else if (k.startsWith('on')) n.addEventListener(k.slice(2), v); else n.setAttribute(k, v); });
    (kids || []).forEach(c => n.append(c));
    return n;
  }
  const fmt = (iso, time) => iso ? new Intl.DateTimeFormat('pt-BR', Object.assign({ timeZone: 'America/Sao_Paulo', dateStyle: 'long' }, time ? { timeStyle: 'short' } : {})).format(new Date(iso)) : '—';
  window.Geo = { call, el, fmt };
})();
