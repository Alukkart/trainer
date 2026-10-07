// Типы заданий. Каждый тип описывает:
//   name, icon      — для интерфейса
//   blank()         — заготовка нового задания для редактора
//   fields          — поля для визуального редактора (см. editor.js)
//   render(task, ctx) -> виджет { el, check(), reveal(), focus(), onKey(e), custom }
//
// check() возвращает результат (или Promise с ним):
//   { ok: true|false, score: 0..1, user: 'ответ ученика', correct: 'правильный ответ (markdown)' }
//   { invalid: 'сообщение' } — ответ не принят (пусто, ошибка ввода), задание остаётся открытым.
// Виджеты с custom: true сами рисуют кнопки и вызывают ctx.finish(result).
(function (T) {
  'use strict';
  const h = T.h;

  T.types = {};
  const COMMON_FIELDS = [
    { key: 'hint', label: 'Подсказка', kind: 'textarea', rows: 1, optional: true, placeholder: 'Необязательно. Показывается по кнопке «Подсказка»' },
    { key: 'explain', label: 'Объяснение', kind: 'textarea', rows: 2, optional: true, placeholder: 'Необязательно. Показывается после ответа' },
  ];
  function def(type, spec) {
    spec.fields = (spec.fields || []).concat(spec.noCommon ? [] : COMMON_FIELDS);
    T.types[type] = spec;
  }

  // Ключ задания для статистики: задаётся явно через id или считается по содержимому
  T.taskKey = function (task) {
    if (task.id) return String(task.id);
    const { hint, explain, ...core } = task;
    return T.hash(JSON.stringify(core));
  };

  // Подставить случайные переменные (vars) во все текстовые поля задания
  T.instantiate = function (task) {
    if (!task.vars || !Object.keys(task.vars).length) return task;
    const env = T.math.genVars(task.vars, task.where);
    const walk = (v, key) => {
      if (key === 'vars' || key === 'where') return v;
      if (typeof v === 'string') return T.math.subst(v, env);
      if (Array.isArray(v)) return v.map(x => walk(x));
      if (v && typeof v === 'object') { const o = {}; for (const k in v) o[k] = walk(v[k], k); return o; }
      return v;
    };
    const t = walk(task);
    t._env = env;
    return t;
  };

  const lock = el => el.querySelectorAll('input, textarea, select, button.opt, button.chip').forEach(x => { x.disabled = true; });
  const asList = v => v == null ? [] : Array.isArray(v) ? v : [v];

  // ======================= Выбор ответа =======================
  T.choiceAnswer = function (task) {
    const opts = task.options || [];
    const idx = asList(task.answer)
      .map(a => typeof a === 'number' ? a : opts.findIndex(o => String(o) === String(a)))
      .filter(i => i >= 0 && i < opts.length);
    return { idx, multi: !!task.multi || idx.length > 1 };
  };

  def('choice', {
    name: 'Выбор ответа', icon: '◉',
    blank: () => ({ type: 'choice', q: '', options: ['', ''], answer: [] }),
    fields: [
      { key: 'q', label: 'Вопрос', kind: 'textarea', rows: 2 },
      { key: 'options', label: 'Варианты (отметьте правильные; если несколько — ученик выбирает все)', kind: 'choiceOptions' },
      { key: 'shuffle', label: 'Перемешивать варианты', kind: 'checkbox', default: true },
    ],
    render(task, ctx) {
      const { idx: right, multi } = T.choiceAnswer(task);
      let order = (task.options || []).map((_, i) => i);
      if (task.shuffle !== false) order = T.shuffle(order);
      const chosen = new Set();
      let done = false;
      const btns = order.map((i, n) => h('button', {
        class: 'opt', type: 'button',
        onclick: () => pick(i),
      }, h('span', { class: 'opt-key' }, n < 9 ? String(n + 1) : ''), T.mdEl('span', String(task.options[i]), 'opt-text')));
      const byIdx = i => btns[order.indexOf(i)];

      function pick(i) {
        if (done) return;
        if (multi) {
          chosen.has(i) ? chosen.delete(i) : chosen.add(i);
          byIdx(i).classList.toggle('selected', chosen.has(i));
        } else {
          chosen.clear(); chosen.add(i);
          btns.forEach(b => b.classList.remove('selected'));
          byIdx(i).classList.add('selected');
          ctx.submit();
        }
      }
      const correctText = right.map(i => task.options[i]).join('; ');
      function mark() {
        done = true;
        lock(el);
        order.forEach(i => {
          if (right.includes(i)) byIdx(i).classList.add('right');
          else if (chosen.has(i)) byIdx(i).classList.add('wrong');
        });
      }
      const el = h('div', { class: 'w-choice' },
        multi ? h('div', { class: 'muted small' }, 'Выберите все правильные варианты') : null,
        h('div', { class: 'opts' }, btns));
      return {
        el,
        check() {
          if (!chosen.size) return { invalid: 'Выберите вариант' };
          const hits = right.filter(i => chosen.has(i)).length;
          const misses = [...chosen].filter(i => !right.includes(i)).length;
          const ok = hits === right.length && misses === 0;
          mark();
          return {
            ok, score: ok ? 1 : Math.max(0, (hits - misses) / right.length),
            user: [...chosen].map(i => task.options[i]).join('; '),
            correct: correctText,
          };
        },
        reveal() { mark(); return { ok: false, score: 0, user: '—', correct: correctText }; },
        onKey(e) {
          const n = parseInt(e.key, 10);
          if (n >= 1 && n <= order.length && !done) { pick(order[n - 1]); return true; }
        },
      };
    },
  });

  // ======================= Ввод ответа =======================
  def('input', {
    name: 'Ввод ответа', icon: '⌨',
    blank: () => ({ type: 'input', q: '', answer: [''] }),
    fields: [
      { key: 'q', label: 'Вопрос', kind: 'textarea', rows: 2 },
      { key: 'answer', label: 'Правильные ответы (любой из них засчитывается)', kind: 'list', placeholder: 'ответ' },
      { key: 'caseSensitive', label: 'Учитывать регистр букв', kind: 'checkbox' },
      { key: 'placeholder', label: 'Подсказка в поле ввода', kind: 'text', optional: true },
    ],
    render(task, ctx) {
      const answers = asList(task.answer).map(String);
      const inp = h('input', { class: 'answer-input', type: 'text', placeholder: task.placeholder || 'Ваш ответ', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false' });
      const el = h('div', { class: 'w-input' }, inp);
      const correct = answers[0] + (answers.length > 1 ? `  \n*Также принимается:* ${answers.slice(1).join(', ')}` : '');
      return {
        el,
        focus: () => inp.focus(),
        check() {
          const u = inp.value;
          if (!u.trim()) return { invalid: 'Введите ответ' };
          const o = { caseSensitive: task.caseSensitive };
          const nu = T.normalize(u, o);
          const ok = answers.some(a => T.normalize(a, o) === nu);
          const close = !ok && answers.some(a => T.levenshtein(T.normalize(a, o), nu) <= (nu.length > 5 ? 2 : 1));
          inp.disabled = true;
          inp.classList.add(ok ? 'right' : 'wrong');
          return { ok, score: ok ? 1 : 0, user: u, correct, note: close ? 'Почти! Похоже на опечатку.' : '' };
        },
        reveal() { inp.disabled = true; return { ok: false, score: 0, user: inp.value || '—', correct }; },
      };
    },
  });

  // ======================= Число / выражение =======================
  function parseUserNumber(s) {
    s = s.trim();
    if (!s.includes('(')) s = s.replace(/(\d),(\d)/g, '$1.$2');
    return T.math.eval(s);
  }
  function splitAnswers(s, n) {
    let parts = s.split(';');
    if (parts.length === 1 && n > 1 && /,\s/.test(s)) parts = s.split(/,\s+/);
    return parts.map(x => x.trim()).filter(Boolean);
  }

  def('number', {
    name: 'Число / выражение', icon: '#',
    blank: () => ({ type: 'number', q: '', answer: '' }),
    fields: [
      { key: 'q', label: 'Условие (можно $формулы$ и {переменные})', kind: 'textarea', rows: 2 },
      { key: 'answer', label: 'Ответ — число или выражение (можно с переменными: a*b). Несколько ответов — через ;', kind: 'text', placeholder: 'например: 1/3  или  a+b  или  2; -3' },
      { key: 'tolerance', label: 'Допустимая погрешность', kind: 'number', optional: true, placeholder: 'например 0.01' },
      { key: 'unit', label: 'Единицы измерения (показываются после поля)', kind: 'text', optional: true },
      { key: 'vars', label: 'Случайные переменные', kind: 'vars' },
      { key: 'where', label: 'Условие на переменные', kind: 'text', optional: true, placeholder: 'например: a != b && a*b < 50' },
      { key: 'repeat', label: 'Сколько раз давать в одной тренировке (с разными числами)', kind: 'number', optional: true },
    ],
    render(task, ctx) {
      const env = task._env || {};
      const raw = Array.isArray(task.answer) ? task.answer : String(task.answer).split(';').map(s => s.trim()).filter(Boolean);
      const expected = raw.map(a => T.math.eval(a, env));
      const multi = expected.length > 1;
      const inp = h('input', { class: 'answer-input', type: 'text', inputmode: 'text', autocomplete: 'off', spellcheck: 'false',
        placeholder: multi ? `Введите ${expected.length} ${T.plural(expected.length, 'ответ', 'ответа', 'ответов')} через ;` : 'Число или выражение' });
      const el = h('div', { class: 'w-input' }, inp, task.unit ? h('span', { class: 'unit' }, task.unit) : null,
        h('div', { class: 'muted small' }, 'Можно вводить дроби и выражения: 3/4, 2*sqrt(3), pi/2'));
      const correct = raw.map((a, i) => {
        const v = T.math.pretty(expected[i]);
        const plain = /^-?\d+(\.\d+)?$/.test(String(a).trim()) || task._env;
        return plain ? v : `${a} ≈ ${parseFloat(expected[i].toFixed(6))}`;
      }).join('; ') + (task.unit ? ' ' + task.unit : '');
      const near = (u, a) => Math.abs(u - a) <= (task.tolerance != null && task.tolerance !== '' ? Number(task.tolerance) : 1e-6 * Math.max(1, Math.abs(a)));
      return {
        el,
        focus: () => inp.focus(),
        check() {
          const s = inp.value;
          if (!s.trim()) return { invalid: 'Введите ответ' };
          let vals;
          try { vals = splitAnswers(s, expected.length).map(parseUserNumber); }
          catch (e) { return { invalid: 'Не понимаю ответ: ' + e.message }; }
          if (vals.some(v => !Number.isFinite(v))) return { invalid: 'Ответ не является числом' };
          let ok;
          if (task.ordered || !multi) ok = vals.length === expected.length && vals.every((v, i) => near(v, expected[i]));
          else {
            const left = expected.slice();
            ok = vals.length === expected.length && vals.every(v => {
              const k = left.findIndex(a => near(v, a));
              if (k < 0) return false;
              left.splice(k, 1); return true;
            });
          }
          inp.disabled = true;
          inp.classList.add(ok ? 'right' : 'wrong');
          return { ok, score: ok ? 1 : 0, user: s, correct };
        },
        reveal() { inp.disabled = true; return { ok: false, score: 0, user: inp.value || '—', correct }; },
      };
    },
  });

  // ======================= Пропуски в тексте =======================
  // Синтаксис: [ответ]  [вариант1|вариант2]  [*верный|неверный|неверный] — выпадающий список
  T.parseGaps = function (text) {
    const parts = [];
    const re = /\\\[|\[([^\]]+)\]/g;
    let last = 0, m, buf = '';
    while ((m = re.exec(text))) {
      buf += text.slice(last, m.index);
      last = re.lastIndex;
      if (m[0] === '\\[') { buf += '['; continue; }
      parts.push(buf); buf = '';
      const alts = m[1].split('|').map(s => s.trim());
      if (alts.some(a => a.startsWith('*'))) {
        parts.push({ select: alts.map(a => a.replace(/^\*/, '')), answers: alts.filter(a => a.startsWith('*')).map(a => a.slice(1)) });
      } else parts.push({ answers: alts });
    }
    parts.push(buf + text.slice(last));
    return parts;
  };

  def('gaps', {
    name: 'Пропуски в тексте', icon: '▭',
    blank: () => ({ type: 'gaps', q: 'Вставьте пропущенные слова', text: '' }),
    fields: [
      { key: 'q', label: 'Инструкция', kind: 'textarea', rows: 1 },
      { key: 'text', label: 'Текст с пропусками', kind: 'textarea', rows: 4,
        help: '[ответ] — поле ввода; [ответ|другой вариант] — засчитываются оба; [*верный|неверный|неверный] — выпадающий список. Символ [ без пропуска: \\[' },
      { key: 'bank', label: 'Показывать банк слов (подсказки-варианты)', kind: 'checkbox' },
      { key: 'distractors', label: 'Лишние слова для банка', kind: 'list', optional: true, placeholder: 'лишнее слово' },
      { key: 'caseSensitive', label: 'Учитывать регистр букв', kind: 'checkbox' },
      { key: 'code', label: 'Текст — это код (моноширинный шрифт, отступы сохраняются)', kind: 'checkbox' },
    ],
    render(task, ctx) {
      const parts = T.parseGaps(task.text || '');
      const gaps = [];
      let lastFocused = null;
      const body = h('div', { class: task.code ? 'gaps-text gaps-code' : 'gaps-text md' });
      parts.forEach(p => {
        if (typeof p === 'string') {
          body.append(task.code ? p : h('span', { html: T.mdInline(p).replace(/\n/g, '<br>') }));
          return;
        }
        let ctrl;
        if (p.select) {
          ctrl = h('select', { class: 'gap' }, h('option', { value: '' }, '…'), T.shuffle(p.select).map(o => h('option', { value: o }, o)));
        } else {
          const w = Math.max(task.code ? 2 : 3, ...p.answers.map(a => a.length)) + 1;
          ctrl = h('input', { class: 'gap', type: 'text', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', style: { width: `calc(${w}ch + 16px)` },
            onfocus: () => { lastFocused = ctrl; } });
        }
        gaps.push({ p, ctrl });
        body.append(ctrl);
      });
      if (!task.code) T.renderMath(body);

      let bank = null;
      if (task.bank) {
        const words = T.shuffle(gaps.filter(g => !g.p.select).map(g => g.p.answers[0]).concat(asList(task.distractors)));
        bank = h('div', { class: 'bank' }, words.map(w => h('button', {
          class: 'chip', type: 'button',
          onclick: () => {
            const target = (lastFocused && !lastFocused.value) ? lastFocused : gaps.map(g => g.ctrl).find(c => c.tagName === 'INPUT' && !c.value);
            if (target) { target.value = w; const next = gaps.map(g => g.ctrl).find(c => c.tagName === 'INPUT' && !c.value); (next || target).focus(); }
          },
        }, w)));
      }

      const o = { caseSensitive: task.caseSensitive };
      const correct = () => parts.map(p => typeof p === 'string' ? p : '**' + p.answers[0] + '**').join('');
      const el = h('div', { class: 'w-gaps' }, bank, body);
      return {
        el,
        focus: () => { const f = gaps.find(g => g.ctrl.tagName === 'INPUT'); if (f) f.ctrl.focus(); },
        onKey(e) {
          // Enter в поле переходит к следующему пустому пропуску, пока они есть
          if (e.key === 'Enter' && e.target.classList && e.target.classList.contains('gap')) {
            const i = gaps.findIndex(g => g.ctrl === e.target);
            const next = gaps.slice(i + 1).find(g => !g.ctrl.value);
            if (next) { next.ctrl.focus(); return true; }
          }
        },
        check() {
          if (gaps.every(g => !g.ctrl.value.trim())) return { invalid: 'Заполните пропуски' };
          let good = 0;
          gaps.forEach(({ p, ctrl }) => {
            const ok = p.answers.some(a => T.normalize(a, o) === T.normalize(ctrl.value, o));
            if (ok) good++;
            ctrl.classList.add(ok ? 'right' : 'wrong');
            if (!ok) ctrl.after(h('span', { class: 'gap-fix' }, p.answers[0]));
          });
          lock(el);
          return {
            ok: good === gaps.length, score: gaps.length ? good / gaps.length : 0,
            summary: gaps.length > 1 && good < gaps.length ? `Верно ${good} из ${gaps.length}` : '',
            user: gaps.map(g => g.ctrl.value || '—').join(' / '),
            correct: gaps.map(g => g.p.answers[0]).join(' / '),
          };
        },
        reveal() {
          gaps.forEach(({ p, ctrl }) => { ctrl.value = p.answers[0]; ctrl.classList.add('revealed'); });
          lock(el);
          return { ok: false, score: 0, user: '—', correct: gaps.map(g => g.p.answers[0]).join(' / ') };
        },
        correctText: correct,
      };
    },
  });

  // ======================= Порядок =======================
  def('order', {
    name: 'Расставить по порядку', icon: '⇅',
    blank: () => ({ type: 'order', q: 'Расставьте в правильном порядке', items: ['', ''] }),
    fields: [
      { key: 'q', label: 'Инструкция', kind: 'textarea', rows: 1 },
      { key: 'items', label: 'Элементы в ПРАВИЛЬНОМ порядке (ученик увидит их перемешанными)', kind: 'list', placeholder: 'элемент' },
      { key: 'join', label: 'Как склеивать при показе ответа', kind: 'select', options: [[' ', 'через пробел (слова в предложение)'], ['', 'без пробела'], [' → ', 'стрелками (шаги)']] },
    ],
    render(task, ctx) {
      const items = (task.items || []).map(String);
      let pool = items.map((t, i) => ({ t, i }));
      for (let k = 0; k < 10 && pool.length > 1; k++) {
        pool = T.shuffle(pool);
        if (pool.some((x, j) => x.t !== items[j])) break;
      }
      const placed = [];
      let done = false;
      const line = h('div', { class: 'order-line' });
      const poolEl = h('div', { class: 'order-pool' });
      const chip = (x, from) => h('button', { class: 'chip', type: 'button', onclick: () => move(x, from) }, T.mdEl('span', x.t));
      function move(x, from) {
        if (done) return;
        if (from === 'pool') { pool = pool.filter(y => y !== x); placed.push(x); }
        else { placed.splice(placed.indexOf(x), 1); pool.push(x); }
        draw();
      }
      function draw() {
        line.replaceChildren(...placed.map(x => chip(x, 'line')));
        if (!placed.length) line.append(h('span', { class: 'muted small' }, 'Нажимайте на элементы ниже по порядку'));
        poolEl.replaceChildren(...pool.map(x => chip(x, 'pool')));
      }
      draw();
      const joiner = task.join == null ? ' ' : task.join;
      const correct = items.join(joiner);
      const el = h('div', { class: 'w-order' }, line, poolEl);
      return {
        el,
        check() {
          if (pool.length) return { invalid: 'Расставьте все элементы' };
          const ok = placed.every((x, j) => x.t === items[j]);
          done = true;
          [...line.children].forEach((c, j) => c.classList.add(placed[j].t === items[j] ? 'right' : 'wrong'));
          lock(el);
          return { ok, score: ok ? 1 : placed.filter((x, j) => x.t === items[j]).length / items.length, user: placed.map(x => x.t).join(joiner), correct };
        },
        reveal() { done = true; lock(el); return { ok: false, score: 0, user: '—', correct }; },
      };
    },
  });

  // ======================= Сопоставление =======================
  def('match', {
    name: 'Сопоставление пар', icon: '⇄',
    blank: () => ({ type: 'match', q: 'Соедините пары', pairs: [['', ''], ['', '']] }),
    fields: [
      { key: 'q', label: 'Инструкция', kind: 'textarea', rows: 1 },
      { key: 'pairs', label: 'Пары (левая колонка — правая колонка)', kind: 'pairs' },
    ],
    render(task, ctx) {
      const pairs = (task.pairs || []).map(p => [String(p[0]), String(p[1])]);
      const leftOrder = T.shuffle(pairs.map((_, i) => i));
      const rightOrder = T.shuffle(pairs.map((_, i) => i));
      const link = new Map(); // left index -> right index
      let selL = null, selR = null, done = false;
      const L = {}, R = {};
      const colorOf = li => [...link.keys()].indexOf(li) % 8;
      const leftOf = ri => { for (const [l, r] of link) if (r === ri) return l; return null; };
      function redraw() {
        Object.values(L).concat(Object.values(R)).forEach(b => { b.className = 'opt match-item'; b.removeAttribute('data-c'); });
        if (selL != null) L[selL].classList.add('selected');
        if (selR != null) R[selR].classList.add('selected');
        for (const [li, ri] of link) {
          const c = String(colorOf(li));
          L[li].dataset.c = c; R[ri].dataset.c = c;
          L[li].classList.add('paired'); R[ri].classList.add('paired');
        }
      }
      function clickLeft(li) {
        if (done) return;
        if (link.has(li)) { link.delete(li); selL = selR = null; }
        else if (selR != null) { link.set(li, selR); selL = selR = null; }
        else selL = selL === li ? null : li;
        redraw();
      }
      function clickRight(ri) {
        if (done) return;
        const l = leftOf(ri);
        if (l != null) { link.delete(l); selL = selR = null; }
        else if (selL != null) { link.set(selL, ri); selL = selR = null; }
        else selR = selR === ri ? null : ri;
        redraw();
      }
      leftOrder.forEach(i => { L[i] = h('button', { class: 'opt match-item', type: 'button', onclick: () => clickLeft(i) }, T.mdEl('span', pairs[i][0])); });
      rightOrder.forEach(i => { R[i] = h('button', { class: 'opt match-item', type: 'button', onclick: () => clickRight(i) }, T.mdEl('span', pairs[i][1])); });
      redraw();
      const correct = pairs.map(p => `${p[0]} — ${p[1]}`).join('; ');
      const el = h('div', { class: 'w-match' },
        h('div', { class: 'muted small' }, 'Нажмите на элемент в одной колонке, затем на подходящий в другой. Нажатие на соединённый элемент разрывает пару.'),
        h('div', { class: 'match-cols' },
          h('div', { class: 'match-col' }, leftOrder.map(i => L[i])),
          h('div', { class: 'match-col' }, rightOrder.map(i => R[i]))));
      return {
        el,
        check() {
          if (link.size < pairs.length) return { invalid: 'Соедините все пары' };
          done = true;
          let good = 0;
          for (const [li, ri] of link) {
            const ok = pairs[li][1] === pairs[ri][1];
            if (ok) good++;
            L[li].classList.add(ok ? 'right' : 'wrong');
            R[ri].classList.add(ok ? 'right' : 'wrong');
          }
          lock(el);
          return {
            ok: good === pairs.length, score: good / pairs.length,
            summary: good < pairs.length ? `Верно ${good} из ${pairs.length} пар` : '',
            user: [...link].map(([l, r]) => `${pairs[l][0]} — ${pairs[r][1]}`).join('; '),
            correct,
          };
        },
        reveal() { done = true; lock(el); return { ok: false, score: 0, user: '—', correct }; },
      };
    },
  });

  // ======================= Карточка =======================
  function selfGrade(ctx, onShow, labels = ['Не помню', 'Помню']) {
    let shown = false, finished = false;
    const showBtn = h('button', { class: 'btn btn-primary', type: 'button', onclick: show }, 'Показать ответ');
    const no = h('button', { class: 'btn btn-bad', type: 'button', onclick: () => finish(false) }, '✗ ' + labels[0], h('kbd', null, '1'));
    const yes = h('button', { class: 'btn btn-good', type: 'button', onclick: () => finish(true) }, '✓ ' + labels[1], h('kbd', null, '2'));
    const grade = h('div', { class: 'actions hidden' }, no, yes);
    const bar = h('div', null, h('div', { class: 'actions' }, showBtn), grade);
    function show() {
      if (shown) return;
      shown = true;
      showBtn.parentElement.classList.add('hidden');
      grade.classList.remove('hidden');
      onShow();
      yes.focus();
    }
    function finish(ok) {
      if (finished) return;
      finished = true;
      grade.classList.add('hidden');
      ctx.finish({ ok, score: ok ? 1 : 0, user: ok ? 'помню' : 'не помню', correct: null, self: true });
    }
    return {
      bar, show,
      onKey(e) {
        if (finished) return;
        if (!shown && (e.key === 'Enter' || e.key === ' ')) { show(); return true; }
        if (shown && (e.key === '1' || e.key === 'ArrowLeft')) { finish(false); return true; }
        if (shown && (e.key === '2' || e.key === 'ArrowRight')) { finish(true); return true; }
      },
      get shown() { return shown; },
    };
  }

  def('flashcard', {
    name: 'Карточка', icon: '🂠', noCommon: false, ownQuestion: true,
    blank: () => ({ type: 'flashcard', front: '', back: '' }),
    fields: [
      { key: 'front', label: 'Лицевая сторона (вопрос / термин / слово)', kind: 'textarea', rows: 2 },
      { key: 'back', label: 'Обратная сторона (ответ / определение / перевод)', kind: 'textarea', rows: 2 },
      { key: 'write', label: 'Сначала написать ответ самому, потом сверить', kind: 'checkbox' },
    ],
    render(task, ctx) {
      const back = T.mdEl('div', task.back, 'card-back hidden');
      const ta = task.write ? h('textarea', { class: 'answer-area', rows: 3, placeholder: 'Напишите ответ, затем нажмите «Показать ответ»' }) : null;
      const sg = selfGrade(ctx, () => { back.classList.remove('hidden'); if (ta) ta.disabled = true; });
      const el = h('div', { class: 'w-card' },
        h('div', { class: 'card-face' }, T.mdEl('div', task.front, 'card-front'), back),
        ta, sg.bar);
      return {
        el, custom: true,
        focus: () => ta && ta.focus(),
        onKey: e => (ta && document.activeElement === ta && e.key !== 'Escape') ? (e.key === 'Enter' && (e.ctrlKey || e.metaKey) ? (sg.show(), true) : false) : sg.onKey(e),
        reveal() { sg.show(); return null; },
        correctText: task.back,
      };
    },
  });

  // ======================= Код =======================
  function codeEditor(value, onChange, onSubmit) {
    const ta = h('textarea', { class: 'code-editor', spellcheck: 'false', autocapitalize: 'off', autocomplete: 'off', wrap: 'off' });
    ta.value = value || '';
    const fit = () => { ta.style.height = 'auto'; ta.style.height = Math.max(160, ta.scrollHeight + 4) + 'px'; };
    ta.addEventListener('input', () => { fit(); onChange && onChange(ta.value); });
    ta.addEventListener('keydown', (e) => {
      const { selectionStart: s, selectionEnd: en, value: v } = ta;
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); onSubmit && onSubmit(); return; }
      if (e.key === 'Tab') {
        e.preventDefault();
        const ls = v.lastIndexOf('\n', s - 1) + 1;
        if (s === en && !e.shiftKey) { ta.setRangeText('    ', s, en, 'end'); }
        else {
          const block = v.slice(ls, en);
          const out = e.shiftKey ? block.replace(/^ {1,4}/gm, '') : block.replace(/^/gm, '    ');
          ta.setRangeText(out, ls, en, 'select');
        }
        ta.dispatchEvent(new Event('input'));
      } else if (e.key === 'Enter') {
        const ls = v.lastIndexOf('\n', s - 1) + 1;
        const line = v.slice(ls, s);
        let ind = line.match(/^\s*/)[0];
        if (/[:{[(]\s*$/.test(line)) ind += '    ';
        e.preventDefault();
        ta.setRangeText('\n' + ind, s, en, 'end');
        ta.dispatchEvent(new Event('input'));
      }
    });
    requestAnimationFrame(fit);
    return ta;
  }
  T.codeEditor = codeEditor;

  const LANG_NAMES = { python: 'Python', javascript: 'JavaScript', cpp: 'C++', pascal: 'Pascal', java: 'Java', csharp: 'C#', sql: 'SQL', other: 'Код' };

  def('code', {
    name: 'Программирование', icon: '</>',
    blank: () => ({ type: 'code', lang: 'python', q: '', starter: '', tests: [{ input: '', output: '' }] }),
    fields: [
      { key: 'q', label: 'Условие задачи', kind: 'textarea', rows: 3 },
      { key: 'lang', label: 'Язык', kind: 'select', options: [['python', 'Python (запуск в браузере)'], ['javascript', 'JavaScript (запуск в браузере)'], ['cpp', 'C++ (самопроверка)'], ['pascal', 'Pascal (самопроверка)'], ['java', 'Java (самопроверка)'], ['csharp', 'C# (самопроверка)'], ['sql', 'SQL (самопроверка)'], ['other', 'Другой (самопроверка)']] },
      { key: 'starter', label: 'Заготовка кода', kind: 'code', optional: true },
      { key: 'tests', label: 'Тесты', kind: 'tests', help: 'Ввод/вывод: программа читает input() и печатает print(). Функция: вызов вида add(2, 3) и ожидаемое значение в JSON (5, "текст", [1, 2], true).' },
      { key: 'solution', label: 'Эталонное решение (показывается после ответа)', kind: 'code', optional: true },
    ],
    render(task, ctx) {
      const lang = task.lang || 'python';
      const runnable = T.runner.supported(lang) && (task.tests || []).length > 0;
      const draftKey = ctx.key && 'draft:' + ctx.key;
      const editor = codeEditor((draftKey && T.store.get(draftKey, null)) ?? task.starter ?? '', v => draftKey && T.store.set(draftKey, v), () => ctx.submit());
      const output = h('pre', { class: 'code-output hidden' });
      const testsEl = h('div', { class: 'tests' });
      const stdin = h('textarea', { class: 'stdin hidden', rows: 2, placeholder: 'Входные данные для «Запустить» (каждое значение input() — с новой строки)' });
      const sol = task.solution ? '```\n' + task.solution + '\n```' : null;
      let busy = false;

      const showOut = (text, isErr) => { output.classList.remove('hidden'); output.classList.toggle('err', !!isErr); output.textContent = text; };
      async function run() {
        if (busy) return;
        busy = true;
        const r = await T.runner.run(lang, editor.value, stdin.value, s => showOut(s));
        busy = false;
        showOut((r.stdout || '') + (r.error ? (r.stdout ? '\n' : '') + r.error : '') || '(программа ничего не вывела)', !!r.error);
      }

      const toolbar = h('div', { class: 'code-toolbar' },
        h('span', { class: 'badge' }, LANG_NAMES[lang] || lang),
        T.runner.supported(lang) ? [
          h('button', { class: 'btn btn-small', type: 'button', onclick: run }, '▶ Запустить'),
          h('button', { class: 'btn btn-small btn-ghost', type: 'button', onclick: () => stdin.classList.toggle('hidden') }, 'Ввод'),
        ] : null,
        task.starter ? h('button', { class: 'btn btn-small btn-ghost', type: 'button', onclick: () => { if (confirm('Вернуть заготовку? Ваш код будет удалён.')) { editor.value = task.starter; editor.dispatchEvent(new Event('input')); } } }, 'Сбросить') : null,
        h('span', { class: 'muted small grow right' }, 'Ctrl+Enter — проверить'));

      if (T.runner.supported(lang)) T.runner.warmUp(lang);

      if (!runnable) {
        // Самопроверка: написать код, открыть решение и честно оценить себя
        const solEl = sol ? T.mdEl('div', '**Эталонное решение:**\n' + sol, 'hidden') : h('div', { class: 'hidden muted' }, 'Эталонного решения нет — сверьтесь с конспектом.');
        const sg = selfGrade(ctx, () => { solEl.classList.remove('hidden'); editor.readOnly = true; }, ['Не справился', 'Справился']);
        const el = h('div', { class: 'w-code' }, toolbar, editor, stdin, output,
          h('div', { class: 'muted small' }, 'Для этого языка автоматической проверки нет: напишите решение, откройте эталон и оцените себя.'),
          solEl, sg.bar);
        return { el, custom: true, onKey: e => document.activeElement === editor ? false : sg.onKey(e), reveal() { sg.show(); return null; }, focus: () => editor.focus() };
      }

      const fmtTest = (t, r, i) => {
        const head = h('div', { class: 'test-head' }, r ? (r.pass ? '✓' : '✗') : '•', ` Тест ${i + 1}`, t.hidden ? h('span', { class: 'muted' }, ' (скрытый)') : null);
        const rows = [];
        if (!t.hidden) {
          if (t.call != null) {
            rows.push(['Вызов', t.call], ['Ожидается', JSON.stringify(t.expected)]);
            if (r && r.got != null && !r.pass) rows.push(['Получено', r.got]);
          } else {
            if (t.input) rows.push(['Ввод', t.input]);
            rows.push(['Ожидается', t.output]);
            if (r && r.got != null && !r.pass) rows.push(['Получено', r.got || '(пусто)']);
          }
        }
        if (r && r.error) rows.push(['Ошибка', r.error]);
        return h('div', { class: 'test' + (r ? (r.pass ? ' right' : ' wrong') : '') }, head,
          rows.map(([k, v]) => h('div', { class: 'test-row' }, h('span', { class: 'muted' }, k), h('pre', null, v))));
      };
      const drawTests = (results) => testsEl.replaceChildren(...(task.tests || []).map((t, i) => fmtTest(t, results && results[i], i)));
      drawTests(null);

      const el = h('div', { class: 'w-code' }, toolbar, editor, stdin, output, testsEl);
      return {
        el,
        focus: () => editor.focus(),
        onKey: e => document.activeElement === editor || document.activeElement === stdin ? false : undefined,
        async check() {
          if (busy) return { invalid: 'Подождите, код ещё выполняется' };
          if (!editor.value.trim() || editor.value.trim() === (task.starter || '').trim()) return { invalid: 'Сначала напишите решение' };
          busy = true;
          const { results, error } = await T.runner.test(lang, editor.value, task.tests, s => showOut(s));
          busy = false;
          output.classList.add('hidden');
          if (error) showOut(error, true);
          drawTests(results);
          const passed = results.filter(r => r && r.pass).length;
          const ok = passed === results.length;
          editor.readOnly = true;
          return { ok, score: passed / results.length, user: '```\n' + editor.value + '\n```', userMd: true, correct: sol, summary: `Пройдено тестов: ${passed} из ${results.length}` };
        },
        reveal() { editor.readOnly = true; return { ok: false, score: 0, user: '—', correct: sol || 'Эталонного решения нет' }; },
      };
    },
  });
})(window.T);
