// Общие утилиты: создание элементов, хранилище, markdown, сравнение ответов, шаринг.
window.T = window.T || {};

(function (T) {
  'use strict';

  // ---------- DOM ----------

  // h('div', {class: 'x', onclick: fn}, 'текст', childEl, [ещё, дети])
  T.h = function (tag, attrs, ...children) {
    const el = document.createElement(tag);
    if (attrs) {
      for (const [k, v] of Object.entries(attrs)) {
        if (v == null || v === false) continue;
        if (k === 'class') el.className = v;
        else if (k === 'html') el.innerHTML = v;
        else if (k === 'style' && typeof v === 'object') for (const [sk, sv] of Object.entries(v)) el.style.setProperty(sk.startsWith('--') ? sk : sk.replace(/[A-Z]/g, c => '-' + c.toLowerCase()), sv);
        else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
        else if (k === 'value') el.value = v;
        else if (k === 'checked') el.checked = !!v;
        else if (v === true) el.setAttribute(k, '');
        else el.setAttribute(k, v);
      }
    }
    append(el, children);
    return el;
  };
  function append(el, children) {
    for (const c of children) {
      if (c == null || c === false) continue;
      if (Array.isArray(c)) append(el, c);
      else el.append(c instanceof Node ? c : String(c));
    }
  }

  T.esc = function (s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  };

  T.toast = function (msg, ms = 2500) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(T.toast._t);
    T.toast._t = setTimeout(() => el.classList.remove('show'), ms);
  };

  T.modal = function (content, { wide } = {}) {
    const close = () => { back.remove(); document.removeEventListener('keydown', onKey, true); };
    const onKey = e => { if (e.key === 'Escape') { e.stopPropagation(); close(); } };
    const box = T.h('div', { class: 'modal' + (wide ? ' modal-wide' : '') },
      T.h('button', { class: 'modal-close btn btn-ghost btn-small', onclick: close, title: 'Закрыть' }, '✕'),
      content);
    const back = T.h('div', { class: 'modal-back', onmousedown: e => { if (e.target === back) close(); } }, box);
    document.addEventListener('keydown', onKey, true);
    document.body.append(back);
    return { close, box };
  };

  // ---------- Разное ----------

  T.hash = function (str) { // cyrb53
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (let i = 0; i < str.length; i++) {
      const ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
  };

  T.shuffle = function (arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  T.clone = obj => JSON.parse(JSON.stringify(obj));

  T.uid = () => Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);

  T.plural = function (n, one, few, many) {
    const m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
    return many;
  };

  T.formatDuration = function (ms) {
    const s = Math.round(ms / 1000);
    const m = Math.floor(s / 60);
    return m ? `${m} мин ${s % 60} с` : `${s} с`;
  };

  T.download = function (filename, text) {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const a = T.h('a', { href: URL.createObjectURL(blob), download: filename });
    document.body.append(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  };

  T.copy = async function (text) {
    try { await navigator.clipboard.writeText(text); return true; }
    catch (e) {
      const ta = T.h('textarea', { value: text, style: { position: 'fixed', opacity: 0 } });
      document.body.append(ta); ta.select();
      const ok = document.execCommand('copy'); ta.remove();
      return ok;
    }
  };

  // ---------- Хранилище ----------

  T.store = {
    get(key, def) {
      try { const v = localStorage.getItem('trainer:' + key); return v == null ? def : JSON.parse(v); }
      catch (e) { return def; }
    },
    set(key, val) {
      try { localStorage.setItem('trainer:' + key, JSON.stringify(val)); return true; }
      catch (e) { T.toast('Не удалось сохранить: хранилище браузера недоступно'); return false; }
    },
  };

  // ---------- Мини-markdown ----------
  // Поддерживает: ```java код```, `код`, **жирный**, *курсив*, заголовки #, списки, таблицы |a|b|,
  // цитаты >, ![](картинка), [ссылка](url), формулы $...$ и $$...$$ (рендерятся KaTeX).
  T.md = function (src) {
    if (src == null) return '';
    src = String(src);
    const parts = src.split(/^```([^\n]*)\n([\s\S]*?)^```\s*$/m);
    let html = '';
    for (let i = 0; i < parts.length; i += 3) {
      html += mdBlocks(parts[i]);
      if (i + 2 < parts.length) {
        const lang = parts[i + 1].trim().toLowerCase();
        html += '<pre class="code-block"><code' + (lang ? ' class="language-' + T.esc(lang) + '"' : '') + '>' + T.esc(parts[i + 2].replace(/\n$/, '')) + '</code></pre>';
      }
    }
    return html;
  };

  const cells = line => line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim());

  function mdBlocks(text) {
    text = text.replace(/^\n+|\n+$/g, '');
    if (!text) return '';
    const lines = text.split('\n');
    let out = '', para = [], list = null, quote = [], table = [];
    const flushPara = () => { if (para.length) { out += '<p>' + para.map(mdInline).join('<br>') + '</p>'; para = []; } };
    const flushList = () => { if (list) { out += `<${list.tag}>` + list.items.map(x => '<li>' + mdInline(x) + '</li>').join('') + `</${list.tag}>`; list = null; } };
    const flushQuote = () => { if (quote.length) { out += '<blockquote>' + mdBlocks(quote.join('\n')) + '</blockquote>'; quote = []; } };
    const flushTable = () => {
      if (!table.length) return;
      const sep = table.length > 1 && /^\s*\|?[\s:|-]+\|?\s*$/.test(table[1]);
      const head = sep ? cells(table[0]) : null;
      const rows = (sep ? table.slice(2) : table).map(cells);
      out += '<div class="table-wrap"><table>' +
        (head ? '<thead><tr>' + head.map(c => '<th>' + mdInline(c) + '</th>').join('') + '</tr></thead>' : '') +
        '<tbody>' + rows.map(r => '<tr>' + r.map(c => '<td>' + mdInline(c) + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>';
      table = [];
    };
    const flushAll = () => { flushPara(); flushList(); flushQuote(); flushTable(); };
    for (const line of lines) {
      const hd = line.match(/^(#{1,4})\s+(.*)$/);
      const ul = line.match(/^\s*[-•]\s+(.*)$/), ol = line.match(/^\s*\d+[.)]\s+(.*)$/);
      const qt = line.match(/^>\s?(.*)$/);
      if (/^\s*\|.*\|\s*$/.test(line)) { if (!table.length) flushAll(); table.push(line); continue; }
      flushTable();
      if (qt) { if (!quote.length) { flushPara(); flushList(); } quote.push(qt[1]); continue; }
      flushQuote();
      if (hd) { flushAll(); const n = hd[1].length + 1; out += `<h${n}>${mdInline(hd[2])}</h${n}>`; }
      else if (ul || ol) {
        flushPara();
        const tag = ul ? 'ul' : 'ol';
        if (!list || list.tag !== tag) { flushList(); list = { tag, items: [] }; }
        list.items.push((ul || ol)[1]);
      } else if (!line.trim()) { flushPara(); flushList(); }
      else { flushList(); para.push(line); }
    }
    flushAll();
    return out;
  }

  function mdInline(s) {
    const keep = [];
    const stash = x => { keep.push(x); return '\u0000' + (keep.length - 1) + '\u0000'; };
    s = s.replace(/`([^`]+)`/g, (_, c) => stash('<code>' + T.esc(c) + '</code>'));
    s = s.replace(/\$\$[\s\S]+?\$\$|\$[^$\n]+?\$/g, m => stash(T.esc(m)));
    s = T.esc(s);
    s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_, alt, url) => `<img src="${url}" alt="${alt}">`);
    s = s.replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    s = s.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
    s = s.replace(/(^|[^*\w])\*(?!\s)(.+?)\*(?!\w)/g, '$1<i>$2</i>');
    s = s.replace(/__(.+?)__/g, '<u>$1</u>');
    return s.replace(/\u0000(\d+)\u0000/g, (_, i) => keep[i]);
  }
  T.mdInline = mdInline;

  // Отрисовать формулы KaTeX внутри элемента (если библиотека загрузилась)
  T.renderMath = function (el) {
    if (!el) return;
    const go = () => window.renderMathInElement && window.renderMathInElement(el, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$', right: '$', display: false },
      ],
      throwOnError: false,
      ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code', 'input'],
    });
    if (window.renderMathInElement) go();
    else window.addEventListener('load', go, { once: true });
  };

  // Подсветка синтаксиса (highlight.js с CDN, если загрузился)
  const HL_LANGS = ['java', 'python', 'javascript', 'cpp', 'csharp', 'sql', 'kotlin', 'bash'];
  T.highlight = function (el) {
    if (!el) return;
    const go = () => {
      if (!window.hljs) return;
      hljs.configure({ languages: HL_LANGS, ignoreUnescapedHTML: true });
      el.querySelectorAll('pre.code-block code').forEach(c => { if (!c.dataset.highlighted) hljs.highlightElement(c); });
    };
    if (window.hljs) go(); else window.addEventListener('load', go, { once: true });
  };

  T.mdEl = function (tag, text, cls) {
    const el = T.h(tag, { class: 'md' + (cls ? ' ' + cls : ''), html: T.md(text) });
    T.renderMath(el);
    T.highlight(el);
    return el;
  };

  // Краткий текст без разметки (для списков)
  T.plain = function (s, max = 120) {
    s = String(s || '').replace(/```[\s\S]*?```/g, ' [код] ').replace(/[*`_#]/g, '').replace(/\s+/g, ' ').trim();
    return s.length > max ? s.slice(0, max - 1) + '…' : s;
  };

  // ---------- Сравнение ответов ----------

  T.normalize = function (s, { caseSensitive = false, keepPunct = false } = {}) {
    s = String(s == null ? '' : s)
      .replace(/[‘’ʼ`´]/g, "'")
      .replace(/[“”«»]/g, '"')
      .replace(/[–—−]/g, '-')
      .replace(/\s+/g, ' ')
      .trim();
    if (!caseSensitive) s = s.toLowerCase().replace(/ё/g, 'е');
    if (!keepPunct) s = s.replace(/[.!?;,]+$/, '').trim();
    return s;
  };

  T.levenshtein = function (a, b) {
    if (Math.abs(a.length - b.length) > 3) return 99;
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++)
      for (let j = 1; j <= b.length; j++)
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[a.length][b.length];
  };

  T.deepEqual = function (a, b, eps = 1e-9) {
    if (typeof a === 'number' && typeof b === 'number') {
      if (Number.isNaN(a) && Number.isNaN(b)) return true;
      return Math.abs(a - b) <= eps * Math.max(1, Math.abs(a), Math.abs(b));
    }
    if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((x, i) => T.deepEqual(x, b[i], eps));
    if (a && b && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a) && !Array.isArray(b)) {
      const ka = Object.keys(a), kb = Object.keys(b);
      return ka.length === kb.length && ka.every(k => k in b && T.deepEqual(a[k], b[k], eps));
    }
    return a === b;
  };

  // ---------- Шаринг практик ссылкой ----------
  // JSON -> deflate -> base64url. Если CompressionStream нет — без сжатия (префикс "j").

  const b64url = bytes => {
    let bin = '';
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  };
  const unb64url = s => {
    const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
    return Uint8Array.from(bin, c => c.charCodeAt(0));
  };
  async function pipe(bytes, stream) {
    const res = new Response(new Blob([bytes]).stream().pipeThrough(stream));
    return new Uint8Array(await res.arrayBuffer());
  }

  T.encodeShare = async function (obj) {
    const bytes = new TextEncoder().encode(JSON.stringify(obj));
    if (window.CompressionStream) return 'z' + b64url(await pipe(bytes, new CompressionStream('deflate-raw')));
    return 'j' + b64url(bytes);
  };

  T.decodeShare = async function (str) {
    const kind = str[0];
    let bytes = unb64url(str.slice(1));
    if (kind === 'z') bytes = await pipe(bytes, new DecompressionStream('deflate-raw'));
    return JSON.parse(new TextDecoder().decode(bytes));
  };

  T.shareUrl = async function (practice) {
    const base = location.href.split('#')[0];
    return base + '#/s/' + await T.encodeShare(practice);
  };

  // Файл практики для папки practices/ — это обычный JSON, обёрнутый в Trainer.add(...)
  T.practiceToJs = function (p) {
    return '// Практика «' + p.title + '». Подключите файл в practices/index.js\nTrainer.add(' + JSON.stringify(p, null, 2) + ');\n';
  };

  // Разбор файла .json или .js, сохранённого из редактора (без выполнения кода)
  T.parsePracticeFile = function (text) {
    text = text.trim();
    try { return JSON.parse(text); } catch (e) { /* пробуем вырезать объект */ }
    const a = text.indexOf('{'), b = text.lastIndexOf('}');
    if (a < 0 || b < a) throw new Error('В файле не найден объект практики');
    try { return JSON.parse(text.slice(a, b + 1)); }
    catch (e) { throw new Error('Файл не в формате JSON. Файлы с функциями или `шаблонными строками` подключайте через practices/index.js'); }
  };
})(window.T);
