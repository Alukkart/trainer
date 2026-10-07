// Визуальный редактор практик. Сохраняет автоматически в «Мои практики» (localStorage).
(function (T) {
  'use strict';
  const h = T.h;

  // Проверка задания: возвращает список проблем (строки)
  T.validateTask = function (t) {
    const w = [];
    const type = T.types[t.type];
    if (!type) return ['Неизвестный тип: ' + t.type];
    const empty = s => !String(s == null ? '' : s).trim();
    if (t.type !== 'flashcard' && t.type !== 'gaps' && t.type !== 'order' && t.type !== 'match' && empty(t.q)) w.push('Не заполнен вопрос');
    if (t.vars) { try { T.math.genVars(t.vars, t.where); } catch (e) { w.push('Переменные: ' + e.message); } }
    switch (t.type) {
      case 'choice': {
        const opts = t.options || [];
        if (opts.length < 2) w.push('Нужно минимум 2 варианта');
        if (opts.some(empty)) w.push('Есть пустые варианты');
        if (!T.choiceAnswer(t).idx.length) w.push('Не отмечен правильный вариант');
        break;
      }
      case 'input':
        if (![].concat(t.answer || []).some(a => !empty(a))) w.push('Нет правильного ответа');
        break;
      case 'number': {
        const parts = Array.isArray(t.answer) ? t.answer : String(t.answer == null ? '' : t.answer).split(';').filter(s => s.trim());
        if (!parts.length) w.push('Нет ответа');
        let env = null;
        try { env = T.math.genVars(t.vars, t.where); } catch (e) { /* уже сообщили */ }
        for (const a of parts) {
          try { const v = T.math.eval(a, env || {}); if (!Number.isFinite(v)) w.push('Ответ «' + a + '» не число'); }
          catch (e) { w.push('Ответ «' + a + '»: ' + e.message); }
        }
        break;
      }
      case 'gaps':
        if (!T.parseGaps(t.text || '').some(p => typeof p !== 'string')) w.push('В тексте нет пропусков — выделите ответы [квадратными скобками]');
        break;
      case 'order':
        if ((t.items || []).filter(x => !empty(x)).length < 2) w.push('Нужно минимум 2 элемента');
        break;
      case 'match':
        if ((t.pairs || []).length < 2) w.push('Нужно минимум 2 пары');
        if ((t.pairs || []).some(p => empty(p[0]) || empty(p[1]))) w.push('Есть незаполненные пары');
        break;
      case 'flashcard':
        if (empty(t.front)) w.push('Пустая лицевая сторона');
        if (empty(t.back)) w.push('Пустая обратная сторона');
        break;
      case 'code':
        if (T.runner.supported(t.lang || 'python') && !(t.tests || []).length) w.push('Нет тестов — будет самопроверка');
        break;
    }
    return w;
  };

  T.taskTitle = function (t) {
    const s = t.type === 'flashcard' ? t.front : t.type === 'gaps' ? (t.text || t.q) : t.q;
    return T.plain(s, 90) || '(пусто)';
  };

  // ---------- Поля ----------

  function autosize(ta) {
    const fit = () => { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 2 + 'px'; };
    ta.addEventListener('input', fit);
    requestAnimationFrame(fit);
    return ta;
  }

  function field(t, f, changed, rerender) {
    const val = t[f.key];
    const set = v => {
      if (v === undefined || v === '' || (f.default !== undefined && v === f.default)) delete t[f.key];
      else t[f.key] = v;
      changed();
    };
    let ctrl;
    switch (f.kind) {
      case 'textarea':
        ctrl = autosize(h('textarea', { rows: f.rows || 2, placeholder: f.placeholder || '', value: val || '', oninput: e => set(e.target.value) }));
        break;
      case 'text':
        ctrl = h('input', { type: 'text', placeholder: f.placeholder || '', value: Array.isArray(val) ? val.join('; ') : (val ?? ''), oninput: e => set(e.target.value) });
        break;
      case 'number':
        ctrl = h('input', { type: 'number', step: 'any', placeholder: f.placeholder || '', value: val ?? '', oninput: e => set(e.target.value === '' ? undefined : Number(e.target.value)) });
        break;
      case 'checkbox':
        return h('div', { class: 'field' }, h('label', { class: 'check' },
          h('input', { type: 'checkbox', checked: val === undefined ? !!f.default : !!val, onchange: e => set(e.target.checked) }), ' ', f.label));
      case 'select':
        ctrl = h('select', { onchange: e => set(e.target.value) },
          f.options.map(([v, l]) => h('option', { value: v, selected: (val ?? f.options[0][0]) === v }, l)));
        if (f.key === 'lang') ctrl.addEventListener('change', rerender);
        break;
      case 'code':
        ctrl = T.codeEditor(val || '', v => set(v));
        ctrl.classList.add('code-editor-small');
        break;
      case 'list': ctrl = listField(t, f.key, changed, rerender, f.placeholder); break;
      case 'choiceOptions': ctrl = choiceField(t, changed, rerender); break;
      case 'pairs': ctrl = pairsField(t, changed, rerender); break;
      case 'vars': ctrl = varsField(t, changed, rerender); break;
      case 'tests': ctrl = testsField(t, changed, rerender); break;
    }
    return h('div', { class: 'field' },
      h('label', { class: 'field-label' }, f.label),
      ctrl,
      f.help ? h('div', { class: 'field-help' }, f.help) : null);
  }

  const delBtn = (fn) => h('button', { class: 'btn btn-ghost btn-icon', type: 'button', title: 'Удалить', onclick: fn }, '✕');
  const addBtn = (text, fn) => h('button', { class: 'btn btn-small btn-ghost', type: 'button', onclick: fn }, '＋ ' + text);

  function listField(t, key, changed, rerender, ph) {
    if (!Array.isArray(t[key])) t[key] = t[key] == null || t[key] === '' ? [] : [t[key]];
    const arr = t[key];
    return h('div', { class: 'rows' },
      arr.map((v, i) => h('div', { class: 'row' },
        h('input', { type: 'text', value: v, placeholder: ph || '', oninput: e => { arr[i] = e.target.value; changed(); } }),
        delBtn(() => { arr.splice(i, 1); changed(); rerender(); }))),
      addBtn('добавить', () => { arr.push(''); changed(); rerender(true); }));
  }

  function choiceField(t, changed, rerender) {
    t.options = t.options || [];
    const right = new Set(T.choiceAnswer(t).idx);
    const saveAnswer = () => {
      const idx = [...right].sort((a, b) => a - b);
      t.answer = idx.length === 1 ? idx[0] : idx;
      changed();
    };
    return h('div', { class: 'rows' },
      t.options.map((v, i) => h('div', { class: 'row' },
        h('input', { type: 'checkbox', title: 'Правильный вариант', checked: right.has(i), onchange: e => { e.target.checked ? right.add(i) : right.delete(i); saveAnswer(); } }),
        h('input', { type: 'text', value: v, placeholder: 'Вариант ' + (i + 1), oninput: e => { t.options[i] = e.target.value; changed(); } }),
        delBtn(() => {
          t.options.splice(i, 1);
          const shifted = new Set([...right].filter(j => j !== i).map(j => j > i ? j - 1 : j));
          right.clear(); shifted.forEach(j => right.add(j));
          saveAnswer(); rerender();
        }))),
      addBtn('вариант', () => { t.options.push(''); saveAnswer(); rerender(true); }));
  }

  function pairsField(t, changed, rerender) {
    t.pairs = t.pairs || [];
    return h('div', { class: 'rows' },
      t.pairs.map((p, i) => h('div', { class: 'row' },
        h('input', { type: 'text', value: p[0], placeholder: 'слева', oninput: e => { p[0] = e.target.value; changed(); } }),
        h('span', { class: 'muted' }, '—'),
        h('input', { type: 'text', value: p[1], placeholder: 'справа', oninput: e => { p[1] = e.target.value; changed(); } }),
        delBtn(() => { t.pairs.splice(i, 1); changed(); rerender(); }))),
      addBtn('пара', () => { t.pairs.push(['', '']); changed(); rerender(true); }));
  }

  function varsField(t, changed, rerender) {
    const entries = Object.entries(t.vars || {}).map(([k, v]) => [k, Array.isArray(v) ? v.join(', ') : String(v)]);
    const save = () => {
      const o = {};
      for (const [k, v] of entries) if (k.trim()) o[k.trim()] = v;
      if (Object.keys(o).length) t.vars = o; else delete t.vars;
      changed();
    };
    const sample = h('div', { class: 'field-help' });
    const showSample = () => {
      if (!t.vars) { sample.textContent = ''; return; }
      try {
        const inst = T.instantiate(t);
        sample.textContent = 'Пример: ' + T.plain(inst.q, 200) + (inst.answer != null ? '  →  ответ: ' + [].concat(inst.answer).map(a => { try { return T.math.format(T.math.eval(a, inst._env)); } catch (e) { return a; } }).join('; ') : '');
      } catch (e) { sample.textContent = '⚠ ' + e.message; }
    };
    showSample();
    return h('div', { class: 'rows' },
      entries.map((e, i) => h('div', { class: 'row' },
        h('input', { type: 'text', class: 'var-name', value: e[0], placeholder: 'a', oninput: ev => { e[0] = ev.target.value; save(); showSample(); } }),
        h('span', { class: 'muted' }, '='),
        h('input', { type: 'text', value: e[1], placeholder: '1..10', oninput: ev => { e[1] = ev.target.value; save(); showSample(); } }),
        delBtn(() => { entries.splice(i, 1); save(); rerender(); }))),
      addBtn('переменная', () => {
        const name = 'abcdkmnpxyz'.split('').find(n => !entries.some(e => e[0] === n)) || 'v' + entries.length;
        entries.push([name, '1..10']); save(); rerender();
      }),
      h('div', { class: 'field-help' }, 'Значения: 1..10 — целое; -5..5 not 0 — кроме нуля; 0..1 step 0.1 — с шагом; 2, 3, 5 — одно из списка; = a*b — вычислить из других. В тексте пишите {a}, {= a*b} или {+b} (знак со значением: «+ 3» / «- 3»).'),
      h('button', { class: 'btn btn-small btn-ghost', type: 'button', onclick: showSample }, '🎲 Другой пример'),
      sample);
  }

  function testsField(t, changed, rerender) {
    t.tests = t.tests || [];
    const lang = t.lang || 'python';
    const box = h('div', { class: 'rows' });
    const report = h('div', { class: 'field-help' });
    t.tests.forEach((test, i) => {
      const fn = test.call != null;
      const mode = h('select', {
        onchange: e => {
          if (e.target.value === 'fn') { delete test.input; delete test.output; test.call = ''; test.expected = null; }
          else { delete test.call; delete test.expected; test.input = ''; test.output = ''; }
          changed(); rerender();
        },
      }, h('option', { value: 'io', selected: !fn }, 'ввод → вывод'), h('option', { value: 'fn', selected: fn }, 'вызов функции'));
      const body = fn
        ? [h('input', { type: 'text', class: 'mono', placeholder: 'add(2, 3)', value: test.call, oninput: e => { test.call = e.target.value; changed(); } }),
           h('input', { type: 'text', class: 'mono', placeholder: 'ожидается (JSON): 5', value: test.expected === undefined ? '' : JSON.stringify(test.expected),
             oninput: e => { try { test.expected = JSON.parse(e.target.value); e.target.classList.remove('invalid'); } catch (err) { test.expected = e.target.value; e.target.classList.add('invalid'); } changed(); } })]
        : [autosize(h('textarea', { class: 'mono', rows: 1, placeholder: 'ввод (stdin)', value: test.input || '', oninput: e => { test.input = e.target.value; changed(); } })),
           autosize(h('textarea', { class: 'mono', rows: 1, placeholder: 'ожидаемый вывод', value: test.output || '', oninput: e => { test.output = e.target.value; changed(); } }))];
      box.append(h('div', { class: 'test-edit' },
        h('div', { class: 'row' }, h('b', null, 'Тест ' + (i + 1)), mode,
          h('label', { class: 'check small' }, h('input', { type: 'checkbox', checked: !!test.hidden, onchange: e => { if (e.target.checked) test.hidden = true; else delete test.hidden; changed(); } }), ' скрытый'),
          h('span', { class: 'grow' }), delBtn(() => { t.tests.splice(i, 1); changed(); rerender(); })),
        h('div', { class: 'test-edit-body' }, body)));
    });
    box.append(h('div', { class: 'row' },
      addBtn('тест', () => { const last = t.tests[t.tests.length - 1]; t.tests.push(last && last.call != null ? { call: '', expected: null } : { input: '', output: '' }); changed(); rerender(true); }),
      T.runner.supported(lang) ? h('button', {
        class: 'btn btn-small btn-ghost', type: 'button',
        onclick: async () => {
          if (!t.solution) { report.textContent = 'Сначала впишите эталонное решение ниже.'; return; }
          const { results, error } = await T.runner.test(lang, t.solution, t.tests, s => { report.textContent = s; });
          const bad = results.map((r, i) => r && !r.pass ? `Тест ${i + 1}: ${r.error || 'получено ' + JSON.stringify(r.got)}` : null).filter(Boolean);
          report.textContent = error ? error : bad.length ? '✗ ' + bad.join(' · ') : '✓ Эталон проходит все тесты';
        },
      }, '▶ Проверить эталоном') : null),
      report);
    return box;
  }

  // ---------- Редактор ----------

  T.editor = function (root, practice) {
    const p = practice;
    p.tasks = p.tasks || [];
    let saveTimer = null;
    const status = h('span', { class: 'muted small save-status' }, 'Сохранено');
    const changed = () => {
      status.textContent = 'Сохранение…';
      clearTimeout(saveTimer);
      saveTimer = setTimeout(save, 400);
    };
    const save = () => { clearTimeout(saveTimer); p.updated = Date.now(); if (T.saveMine(p)) status.textContent = '✓ Сохранено'; };
    T.onLeave(() => {
      save();
      if (!p.tasks.length && (!p.title || p.title === 'Новая практика') && !p.description) T.deleteMine(p.id);
    });

    const collapsed = new Set(p.tasks.length > 4 ? p.tasks.map((_, i) => i) : []);
    const list = h('div', { class: 'task-list' });

    function taskCard(t, i) {
      const type = T.types[t.type];
      const isOpen = !collapsed.has(i);
      const warnEl = h('span', { class: 'warn-badge' });
      const titleEl = h('span', { class: 'task-card-title' });
      const updateHead = () => {
        const w = T.validateTask(t);
        warnEl.textContent = w.length ? '⚠ ' + w.length : '';
        warnEl.title = w.join('\n');
        titleEl.textContent = T.taskTitle(t);
        warnList.replaceChildren(...w.map(x => h('div', null, '⚠ ' + x)));
      };
      const warnList = h('div', { class: 'warn-list' });
      const onChange = () => { updateHead(); changed(); };
      const rerenderCard = (focusLast) => {
        const fresh = taskCard(t, i);
        card.replaceWith(fresh);
        if (focusLast === true) {
          const inputs = fresh.querySelectorAll('.rows input[type=text], .rows textarea');
          const last = [...inputs].filter(x => !x.value).pop();
          if (last) last.focus();
        }
      };

      const typeSel = h('select', {
        class: 'type-select', title: 'Тип задания',
        onclick: e => e.stopPropagation(),
        onchange: e => {
          const nt = T.types[e.target.value].blank();
          const q = t.q || t.front || '';
          if (nt.type === 'flashcard') nt.front = q; else nt.q = q || nt.q;
          ['hint', 'explain', 'id'].forEach(k => { if (t[k]) nt[k] = t[k]; });
          p.tasks[i] = nt;
          changed(); draw();
        },
      }, Object.entries(T.types).map(([k, v]) => h('option', { value: k, selected: k === t.type }, v.icon + ' ' + v.name)));

      const tool = (label, title, fn) => h('button', { class: 'btn btn-ghost btn-icon', type: 'button', title, onclick: e => { e.stopPropagation(); fn(); } }, label);
      const head = h('div', { class: 'task-card-head', onclick: () => { isOpen ? collapsed.add(i) : collapsed.delete(i); draw(); } },
        h('span', { class: 'task-num' }, i + 1), typeSel, titleEl, warnEl, h('span', { class: 'grow' }),
        tool('👁', 'Попробовать задание', () => preview(t)),
        tool('↑', 'Выше', () => move(i, -1)),
        tool('↓', 'Ниже', () => move(i, 1)),
        tool('⧉', 'Дублировать', () => { p.tasks.splice(i + 1, 0, T.clone(t)); shiftCollapsed(i + 1, 1); collapsed.delete(i + 1); changed(); draw(); }),
        tool('✕', 'Удалить', () => { if (confirm('Удалить задание ' + (i + 1) + '?')) { p.tasks.splice(i, 1); shiftCollapsed(i, -1); changed(); draw(); } }));

      const card = h('div', { class: 'card task-edit' + (isOpen ? ' open' : '') }, head);
      if (type && isOpen) {
        const main = [], extra = [];
        for (const f of type.fields) {
          const el = field(t, f, onChange, rerenderCard);
          (f.optional && (t[f.key] == null || t[f.key] === '') ? extra : main).push(el);
        }
        card.append(h('div', { class: 'task-card-body' }, main,
          extra.length ? h('details', { class: 'extra' }, h('summary', null, 'Дополнительно: ' + type.fields.filter(f => f.optional && (t[f.key] == null || t[f.key] === '')).map(f => f.label.split(' (')[0].toLowerCase()).join(', ')), extra) : null,
          warnList));
      }
      updateHead();
      return card;
    }

    function shiftCollapsed(from, d) {
      const arr = [...collapsed].map(j => j >= from ? j + d : j).filter(j => j >= 0);
      collapsed.clear(); arr.forEach(j => collapsed.add(j));
    }
    function move(i, d) {
      const j = i + d;
      if (j < 0 || j >= p.tasks.length) return;
      [p.tasks[i], p.tasks[j]] = [p.tasks[j], p.tasks[i]];
      const ci = collapsed.has(i), cj = collapsed.has(j);
      collapsed.delete(i); collapsed.delete(j);
      if (ci) collapsed.add(j); if (cj) collapsed.add(i);
      changed(); draw();
    }
    function draw() {
      list.replaceChildren(...p.tasks.map(taskCard));
      if (!p.tasks.length) list.append(h('div', { class: 'card empty muted' }, 'Заданий пока нет. Добавьте первое кнопками ниже ↓'));
      countEl.textContent = p.tasks.length + ' ' + T.plural(p.tasks.length, 'задание', 'задания', 'заданий');
    }
    function addTask(type) {
      p.tasks.push(T.types[type].blank());
      changed(); draw();
      const last = list.lastElementChild;
      last.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const inp = last.querySelector('textarea, input[type=text]');
      if (inp) inp.focus({ preventScroll: true });
    }

    function preview(t) {
      const box = h('div', { class: 'preview-root' });
      const m = T.modal(box, { wide: true });
      T.play(box, { title: 'Предпросмотр', items: [{ pid: 'preview', ptitle: '', task: t, key: 'preview' }], preview: true, onExit: m.close, again: () => { m.close(); preview(t); } });
    }

    function jsonMode() {
      const ta = h('textarea', { class: 'mono json-area', spellcheck: 'false', value: JSON.stringify(p, null, 2) });
      const err = h('div', { class: 'bad small' });
      const m = T.modal(h('div', null,
        h('h2', null, 'Практика в формате JSON'),
        h('p', { class: 'muted small' }, 'Можно редактировать напрямую — удобно для массовых правок и копирования заданий. Формат описан в справке.'),
        ta, err,
        h('div', { class: 'actions' },
          h('button', { class: 'btn btn-ghost', onclick: () => T.copy(ta.value).then(() => T.toast('Скопировано')) }, 'Копировать'),
          h('span', { class: 'grow' }),
          h('button', {
            class: 'btn btn-primary',
            onclick: () => {
              try {
                const np = JSON.parse(ta.value);
                if (!Array.isArray(np.tasks)) throw new Error('Нет массива tasks');
                const id = p.id;
                Object.keys(p).forEach(k => delete p[k]);
                Object.assign(p, np, { id });
                save(); m.close(); T.editor(root, p);
              } catch (e) { err.textContent = 'Ошибка: ' + e.message; }
            },
          }, 'Применить'))), { wide: true });
      ta.focus();
    }

    const subjects = [...new Set(T.allPractices().map(x => x.subject).filter(Boolean))];
    const countEl = h('span', { class: 'muted' });
    const metaInput = (key, ph, tag = 'input') => {
      const el = tag === 'textarea'
        ? autosize(h('textarea', { rows: 2, placeholder: ph, value: p[key] || '' }))
        : h('input', { type: 'text', placeholder: ph, value: p[key] || '', list: key === 'subject' ? 'subjects-list' : null });
      el.addEventListener('input', () => { p[key] = el.value; changed(); });
      return el;
    };

    root.replaceChildren(h('div', { class: 'editor' },
      h('div', { class: 'editor-head' },
        h('a', { class: 'btn btn-ghost btn-small', href: '#/p/' + p.id }, '← К практике'),
        h('h1', null, 'Редактор'), status, h('span', { class: 'grow' }),
        h('button', { class: 'btn btn-small btn-ghost', onclick: jsonMode }, '{ } JSON'),
        h('button', { class: 'btn btn-small', onclick: async () => { save(); T.shareDialog(p); } }, '🔗 Поделиться'),
        h('a', { class: 'btn btn-small btn-primary', href: '#/p/' + p.id }, '▶ Пройти')),
      h('div', { class: 'card meta' },
        h('div', { class: 'grid2' },
          h('div', { class: 'field' }, h('label', { class: 'field-label' }, 'Название'), metaInput('title', 'Например: Past Simple — неправильные глаголы')),
          h('div', { class: 'field' }, h('label', { class: 'field-label' }, 'Предмет'), metaInput('subject', 'Английский, Математика, Python…'),
            h('datalist', { id: 'subjects-list' }, subjects.map(s => h('option', { value: s }))))),
        h('div', { class: 'field' }, h('label', { class: 'field-label' }, 'Описание'), metaInput('description', 'К какой контрольной, что повторяем', 'textarea')),
        h('details', { class: 'extra', open: !!p.lesson }, h('summary', null, '📖 Теория урока (необязательно)'),
          h('div', { class: 'field' }, metaInput('lesson', 'Текст урока: показывается перед заданиями. Разметка: ## заголовок, **жирный**, `код`, ```java блок кода```, таблицы | a | b |, > заметка', 'textarea'),
            h('div', { class: 'field-help' }, 'Ученик видит теорию на странице практики и может открыть её во время тренировки кнопкой 📖.'))),
        h('div', { class: 'grid2' },
          h('div', { class: 'field' }, h('label', { class: 'field-label' }, 'Автор'), metaInput('author', 'Ваше имя (необязательно)')),
          h('div', { class: 'field' }, h('label', { class: 'field-label' }, ' '),
            h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: p.shuffle !== false, onchange: e => { if (e.target.checked) delete p.shuffle; else p.shuffle = false; changed(); } }), ' Перемешивать задания по умолчанию')))),
      h('div', { class: 'section-head' }, h('h2', null, 'Задания'), countEl, h('span', { class: 'grow' }),
        h('button', { class: 'btn btn-small btn-ghost', onclick: () => { if (collapsed.size) collapsed.clear(); else p.tasks.forEach((_, i) => collapsed.add(i)); draw(); } }, 'Свернуть / развернуть все')),
      list,
      h('div', { class: 'card add-task' },
        h('div', { class: 'muted small' }, 'Добавить задание:'),
        h('div', { class: 'add-grid' }, Object.entries(T.types).map(([k, v]) =>
          h('button', { class: 'btn', onclick: () => addTask(k) }, h('span', { class: 'add-icon' }, v.icon), ' ', v.name))))));
    draw();
  };
})(window.T);
