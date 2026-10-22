// ===== Config =====
var CFG = {
  TZ: 'America/Sao_Paulo', TTL: 7200, MAX_FAILS: 5, LOCK: 900, INIT_PASS: '333333333',
  PH: ['id','slug','title','description','coverUrl','coverAlt','caption','content','category','tags','references','metadata','status','createdAt','publishedAt','updatedAt'],
  QH: ['id','postId','order','type','prompt','options','correctIndex','maxChars']
};
function fail_(code, msg) { throw { apiError: true, code: code, message: msg }; }
function props_() { return PropertiesService.getScriptProperties(); }

// ===== Database =====
function ss_() {
  var p = props_(), id = p.getProperty('SHEET_ID');
  if (id) return SpreadsheetApp.openById(id);
  var s = SpreadsheetApp.create('GeoBlog - Banco de Dados');
  p.setProperty('SHEET_ID', s.getId());
  return s;
}
// Execute UMA vez no editor. Pode ser reexecutada: nunca apaga dados.
function setupGeoBlog() {
  var s = ss_();
  s.setSpreadsheetTimeZone(CFG.TZ);
  mk_(s, 'Posts', CFG.PH); mk_(s, 'Questions', CFG.QH);
  s.getSheets().forEach(function (sh) {
    if (['Posts', 'Questions'].indexOf(sh.getName()) < 0 && sh.getLastRow() === 0 && s.getSheets().length > 2) s.deleteSheet(sh);
  });
  setupAuth_();
  Logger.log('Planilha pronta: ' + s.getUrl());
}
function mk_(s, n, h) {
  var sh = s.getSheetByName(n) || s.insertSheet(n);
  if (sh.getLastRow() === 0) { sh.getRange(1, 1, 1, h.length).setValues([h]).setFontWeight('bold'); sh.setFrozenRows(1); }
  sh.getRange(2, 1, sh.getMaxRows() - 1, h.length).setNumberFormat('@');
}
function read_(n) {
  var sh = ss_().getSheetByName(n);
  if (!sh) fail_('DB', 'Banco não inicializado.');
  var v = sh.getDataRange().getValues(), h = v[0], o = [];
  for (var i = 1; i < v.length; i++) {
    if (!v[i][0]) continue;
    var r = { _row: i + 1 };
    for (var j = 0; j < h.length; j++) r[h[j]] = String(v[i][j]);
    o.push(r);
  }
  return o;
}
function put_(n, H, obj, row) {
  var sh = ss_().getSheetByName(n), a = H.map(function (k) { return obj[k] == null ? '' : String(obj[k]); });
  if (row) sh.getRange(row, 1, 1, H.length).setValues([a]); else sh.appendRow(a);
}
function del_(n, rows) {
  var sh = ss_().getSheetByName(n);
  rows.sort(function (a, b) { return b - a; }).forEach(function (r) { sh.deleteRow(r); });
}
function lock_(f) {
  var l = LockService.getScriptLock(); l.waitLock(20000);
  try { return f(); } finally { l.releaseLock(); }
}

// ===== Auth =====
function hex_(b) { return b.map(function (x) { return ((x & 255) + 256).toString(16).slice(1); }).join(''); }
function sha_(s) { return hex_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, s, Utilities.Charset.UTF_8)); }
function hashPw_(pw, salt) { var h = pw; for (var i = 0; i < 2000; i++) h = sha_(salt + h + pw); return h; }
function setPw_(pw) {
  var salt = Utilities.getUuid() + Utilities.getUuid();
  props_().setProperties({ PW_SALT: salt, PW_HASH: hashPw_(pw, salt) });
}
function setupAuth_() { if (!props_().getProperty('PW_HASH')) setPw_(CFG.INIT_PASS); }
// Recuperação: execute manualmente no editor para voltar à senha inicial.
function resetPasswordToInitial() { setPw_(CFG.INIT_PASS); }
function checkPw_(pw) {
  var p = props_(), h = hashPw_(String(pw || ''), p.getProperty('PW_SALT')), r = p.getProperty('PW_HASH'), d = h.length ^ r.length;
  for (var i = 0; i < h.length; i++) d |= h.charCodeAt(i) ^ (r.charCodeAt(i) || 0);
  return d === 0;
}
function login_(d) {
  var c = CacheService.getScriptCache(), f = Number(c.get('fails') || 0);
  if (f >= CFG.MAX_FAILS) fail_('LOCKED', 'Muitas tentativas. Aguarde alguns minutos.');
  if (!checkPw_(d.password)) { c.put('fails', String(f + 1), CFG.LOCK); fail_('CREDENTIALS', 'Senha incorreta.'); }
  c.remove('fails');
  var t = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
  c.put('s_' + sha_(t), '1', CFG.TTL);
  return { token: t, expiresAt: new Date(Date.now() + CFG.TTL * 1000).toISOString() };
}
function requireSession_(t) {
  if (!t || !CacheService.getScriptCache().get('s_' + sha_(String(t)))) fail_('SESSION', 'Sessão expirada. Entre novamente.');
}
function logout_(t) { CacheService.getScriptCache().remove('s_' + sha_(String(t))); return {}; }
function changePw_(d) {
  if (!checkPw_(d.current)) fail_('CREDENTIALS', 'Senha atual incorreta.');
  var n = String(d.next || '');
  if (n.length < 8 || n.length > 100) fail_('VALIDATION', 'A nova senha deve ter de 8 a 100 caracteres.');
  setPw_(n); return {};
}

// ===== Validation =====
var ALLOWED = { p: 1, h2: 1, h3: 1, h4: 1, strong: 1, b: 1, em: 1, i: 1, ul: 1, ol: 1, li: 1, br: 1, blockquote: 1, a: 1 };
function esc_(s) { return s.replace(/&(?![a-zA-Z#0-9]+;)/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function sanitize_(html) {
  html = String(html || '').replace(/<!--[\s\S]*?-->/g, '').replace(/<(script|style|iframe|object|embed)[\s\S]*?<\/\1\s*>/gi, '');
  var out = '', last = 0, re = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g, m;
  while ((m = re.exec(html))) {
    out += esc_(html.slice(last, m.index)); last = re.lastIndex;
    var t = m[2].toLowerCase();
    if (!ALLOWED[t]) continue;
    if (m[1]) { out += '</' + t + '>'; continue; }
    if (t === 'a') {
      var h = /href\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(m[3]), u = h ? (h[1] || h[2] || '').trim() : '';
      out += /^(https?:\/\/|mailto:)/i.test(u) ? '<a href="' + u.replace(/"/g, '&quot;').replace(/</g, '&lt;') + '" target="_blank" rel="noopener noreferrer">' : '<a>';
    } else out += '<' + t + '>';
  }
  return out + esc_(html.slice(last));
}
function str_(v, max, min, label) {
  v = String(v == null ? '' : v).trim();
  if (v.length > max) fail_('VALIDATION', label + ' excede ' + max + ' caracteres.');
  if (min && v.length < min) fail_('VALIDATION', label + ' é obrigatório(a).');
  return v;
}
function url_(v, label) {
  v = str_(v, 1000, 0, label);
  if (v && !/^https?:\/\/[^\s]+$/i.test(v)) fail_('VALIDATION', label + ' deve ser uma URL http(s) válida.');
  return v;
}
function iso_(v, label) {
  v = String(v || '').trim();
  if (!v) return '';
  var t = Date.parse(v);
  if (isNaN(t)) fail_('VALIDATION', label + ' inválida.');
  return new Date(t).toISOString();
}
function slugify_(s) {
  return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
}
function cleanPost_(d) {
  var id = String(d.id || '');
  if (!/^[a-zA-Z0-9-]{8,64}$/.test(id)) fail_('VALIDATION', 'Identificador inválido.');
  var st = d.status === 'published' ? 'published' : 'draft', pub = st === 'published';
  var title = str_(d.title, 150, 3, 'Título');
  var slug = str_(d.slug, 80, 0, 'Slug') || slugify_(title);
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) fail_('VALIDATION', 'Slug inválido (use letras minúsculas, números e hífens).');
  var tags = (Array.isArray(d.tags) ? d.tags : String(d.tags || '').split(',')).map(function (t) { return String(t).trim(); }).filter(Boolean).slice(0, 10);
  tags.forEach(function (t) { if (t.length > 30 || t.indexOf(',') >= 0) fail_('VALIDATION', 'Tag inválida: ' + t); });
  var c = {
    id: id, slug: slug, title: title, status: st,
    description: str_(d.description, 300, pub ? 10 : 0, 'Descrição'),
    coverUrl: url_(d.coverUrl, 'URL da capa'), coverAlt: str_(d.coverAlt, 200, 0, 'Texto alternativo'),
    caption: str_(d.caption, 200, 0, 'Legenda'),
    content: sanitize_(str_(d.content, 40000, 0, 'Conteúdo')),
    category: str_(d.category, 40, pub ? 2 : 0, 'Categoria'), tags: tags.join(','),
    references: str_(d.references, 3000, 0, 'Referências'), metadata: str_(d.metadata, 1000, 0, 'Metadados'),
    createdAt: iso_(d.createdAt, 'Data de criação'), publishedAt: iso_(d.publishedAt, 'Data de publicação')
  };
  if (pub && c.content.replace(/<[^>]*>/g, '').trim().length < 50) fail_('VALIDATION', 'O conteúdo precisa ter ao menos 50 caracteres para publicar.');
  if (pub && c.coverUrl && !c.coverAlt) fail_('VALIDATION', 'Informe o texto alternativo da capa.');
  return c;
}
function cleanQuestions_(qs, pub) {
  qs = Array.isArray(qs) ? qs : [];
  if (qs.length > 3) fail_('VALIDATION', 'No máximo 3 perguntas por artigo.');
  if (pub && qs.length !== 3) fail_('VALIDATION', 'Para publicar, o artigo precisa de exatamente 3 perguntas válidas.');
  return qs.map(function (q, i) {
    var n = 'Pergunta ' + (i + 1), type = q.type === 'open' ? 'open' : 'single';
    var o = { order: i + 1, type: type, prompt: str_(q.prompt, 500, 5, n), options: '[]', correctIndex: '', maxChars: '' };
    if (type === 'single') {
      var opts = (Array.isArray(q.options) ? q.options : []).map(function (x) { return str_(x, 200, 1, n + ': alternativa'); });
      if (opts.length < 2 || opts.length > 5) fail_('VALIDATION', n + ': use de 2 a 5 alternativas.');
      var ci = Number(q.correctIndex);
      if (q.correctIndex === '' || q.correctIndex == null || !(ci >= 0 && ci < opts.length && ci % 1 === 0)) fail_('VALIDATION', n + ': marque exatamente uma alternativa correta.');
      o.options = JSON.stringify(opts); o.correctIndex = ci;
    } else {
      var mc = Number(q.maxChars || 500);
      if (!(mc >= 50 && mc <= 2000)) fail_('VALIDATION', n + ': limite de caracteres entre 50 e 2000.');
      o.maxChars = Math.floor(mc);
    }
    return o;
  });
}

// ===== Questions =====
function qsOf_(postId) {
  return read_('Questions').filter(function (q) { return q.postId === postId; }).sort(function (a, b) { return a.order - b.order; });
}
function replaceQ_(postId, qs) {
  del_('Questions', qsOf_(postId).map(function (q) { return q._row; }));
  qs.forEach(function (q) { q.id = Utilities.getUuid(); q.postId = postId; put_('Questions', CFG.QH, q); });
}
function pubQ_(q) {
  var o = { id: q.id, order: Number(q.order), type: q.type, prompt: q.prompt };
  if (q.type === 'single') o.options = JSON.parse(q.options); else o.maxChars = Number(q.maxChars);
  return o; // nunca inclui correctIndex
}
function admQ_(q) {
  var o = pubQ_(q); if (q.type === 'single') o.correctIndex = Number(q.correctIndex); return o;
}
function checkAnswer_(d) {
  var p = visible_(String(d.postId || ''));
  if (!p) fail_('NOT_FOUND', 'Artigo não encontrado.');
  var q = qsOf_(p.id).filter(function (x) { return x.id === String(d.questionId); })[0];
  if (!q || q.type !== 'single') fail_('NOT_FOUND', 'Pergunta não encontrada.');
  var i = Number(d.optionIndex);
  if (!(i >= 0 && i % 1 === 0 && i < JSON.parse(q.options).length)) fail_('VALIDATION', 'Alternativa inválida.');
  return { correct: i === Number(q.correctIndex) };
}

// ===== Posts =====
function isVisible_(p) { return p.status === 'published' && p.publishedAt && Date.parse(p.publishedAt) <= Date.now(); }
function visible_(id) { return read_('Posts').filter(function (p) { return p.id === id && isVisible_(p); })[0]; }
function tags_(p) { return p.tags ? p.tags.split(',') : []; }
function summary_(p) {
  return { id: p.id, slug: p.slug, title: p.title, description: p.description, coverUrl: p.coverUrl, coverAlt: p.coverAlt,
    category: p.category, tags: tags_(p), publishedAt: p.publishedAt, updatedAt: p.updatedAt };
}
function full_(p, qs) {
  var o = summary_(p);
  o.caption = p.caption; o.content = p.content; o.references = p.references; o.metadata = p.metadata; o.createdAt = p.createdAt;
  o.questions = qs; return o;
}
function listPublic_() {
  return read_('Posts').filter(isVisible_).map(summary_)
    .sort(function (a, b) { return Date.parse(b.publishedAt) - Date.parse(a.publishedAt); });
}
function getPublic_(d) {
  var p = read_('Posts').filter(function (x) { return x.slug === String(d.slug || '') && isVisible_(x); })[0];
  if (!p) fail_('NOT_FOUND', 'Artigo não encontrado.');
  return full_(p, qsOf_(p.id).map(pubQ_));
}
function listAdmin_() {
  return read_('Posts').map(function (p) { var o = summary_(p); o.status = p.status; return o; })
    .sort(function (a, b) { return Date.parse(b.updatedAt) - Date.parse(a.updatedAt); });
}
function getAdmin_(d) {
  var p = read_('Posts').filter(function (x) { return x.id === String(d.id); })[0];
  if (!p) fail_('NOT_FOUND', 'Artigo não encontrado.');
  var o = full_(p, qsOf_(p.id).map(admQ_)); o.status = p.status; o.tagsText = p.tags; return o;
}
function savePost_(d) {
  var c = cleanPost_(d), qs = cleanQuestions_(d.questions, c.status === 'published');
  return lock_(function () {
    var posts = read_('Posts'), ex = posts.filter(function (p) { return p.id === c.id; })[0];
    if (posts.some(function (p) { return p.slug === c.slug && p.id !== c.id; })) fail_('VALIDATION', 'Já existe um artigo com este slug.');
    var now = new Date().toISOString();
    c.createdAt = c.createdAt || (ex && ex.createdAt) || now;
    c.updatedAt = now;
    if (c.status === 'published' && !c.publishedAt) c.publishedAt = now;
    put_('Posts', CFG.PH, c, ex && ex._row);
    replaceQ_(c.id, qs);
    return { id: c.id, slug: c.slug, status: c.status, updatedAt: now, publishedAt: c.publishedAt };
  });
}
function deletePost_(d) {
  return lock_(function () {
    var p = read_('Posts').filter(function (x) { return x.id === String(d.id); })[0];
    if (!p) fail_('NOT_FOUND', 'Artigo não encontrado.');
    del_('Questions', qsOf_(p.id).map(function (q) { return q._row; }));
    del_('Posts', [p._row]);
    return {};
  });
}
function preview_(d) {
  var c = cleanPost_(d), qs = cleanQuestions_(d.questions, false);
  qs.forEach(function (q, i) { q.id = 'pv' + i; });
  c.tags = c.tags; c.updatedAt = new Date().toISOString(); c.publishedAt = c.publishedAt || c.updatedAt; c.createdAt = c.createdAt || c.updatedAt;
  return full_(c, qs.map(pubQ_));
}

// ===== Code =====
var PUBLIC = {
  list: function () { return listPublic_(); }, get: getPublic_, check: checkAnswer_, login: login_
};
var ADMIN = {
  adminList: listAdmin_, adminGet: getAdmin_, save: savePost_, remove: deletePost_,
  preview: preview_, changePassword: changePw_, validate: function () { return {}; }
};
function doGet() { return json_({ ok: true, data: { service: 'GeoBlog API' } }); }
function doPost(e) {
  var out;
  try {
    var raw = e && e.postData ? e.postData.contents : '';
    if (!raw || raw.length > 200000) fail_('VALIDATION', 'Requisição inválida.');
    var r = JSON.parse(raw), d = r.data || {}, a = String(r.action || '');
    if (a === 'logout') out = logout_(r.token);
    else if (PUBLIC.hasOwnProperty(a)) out = PUBLIC[a](d);
    else if (ADMIN.hasOwnProperty(a)) { requireSession_(r.token); out = ADMIN[a](d); }
    else fail_('NOT_FOUND', 'Ação desconhecida.');
    out = { ok: true, data: out };
  } catch (err) {
    if (err && err.apiError) out = { ok: false, code: err.code, message: err.message };
    else { Logger.log(err); out = { ok: false, code: 'INTERNAL', message: 'Erro interno no servidor. Tente novamente.' }; }
  }
  return json_(out);
}
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }


