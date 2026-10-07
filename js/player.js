// Прогресс (интервальные повторения) и прохождение тренировки.
(function (T) {
  'use strict';
  const h = T.h;
  const DAY = 24 * 3600 * 1000;
  const INTERVALS = [0, 1, 3, 7, 16, 35]; // дней до повторения для коробок 0..5 (система Лейтнера)

  // ======================= Прогресс =======================
  // progress[pid][taskKey] = { b: коробка, d: когда повторить, r: верно, w: неверно, ok: последний ответ верен, t: время }
  let cache = null;
  const all = () => cache || (cache = T.store.get('progress', {}));
  const save = () => T.store.set('progress', all());

  T.progress = {
    get: (pid, key) => (all()[pid] || {})[key],
    record(pid, key, ok) {
      const p = all()[pid] || (all()[pid] = {});
      const now = Date.now();
      const r = p[key] || { b: 0, d: 0, r: 0, w: 0 };
      if (ok) {
        r.r++;
        // Повышаем коробку, только если задание было «к повторению» — зубрёжка подряд не считается
        if (!r.t || now >= r.d) r.b = Math.min(r.b + 1, INTERVALS.length - 1);
        r.d = now + INTERVALS[r.b] * DAY - 2 * 3600 * 1000;
      } else {
        r.w++;
        r.b = 0;
        r.d = now;
      }
      r.ok = ok; r.t = now;
      p[key] = r;
      save();
    },
    isDue(pid, key) { const r = T.progress.get(pid, key); return !r || Date.now() >= r.d; },
    stats(practice) {
      const s = { total: 0, done: 0, wrong: 0, due: 0, seen: 0, next: Infinity };
      for (const t of practice.tasks || []) {
        s.total++;
        const r = T.progress.get(practice.id, T.taskKey(t));
        if (!r) { s.due++; continue; }
        s.seen++;
        if (r.ok) s.done++; else s.wrong++;
        if (Date.now() >= r.d) s.due++; else s.next = Math.min(s.next, r.d);
      }
      return s;
    },
    reset(pid) { delete all()[pid]; save(); },
  };

  // ======================= Сборка сессии =======================
  // practices: массив практик; opts: { mode: all|review|mistakes|exam, shuffle, limit }
  T.buildSession = function (practices, opts) {
    let items = [];
    for (const p of practices) {
      (p.tasks || []).forEach((task, i) => {
        const key = T.taskKey(task);
        if (opts.mode === 'review' && (!T.progress.isDue(p.id, key) || (opts.seenOnly && !T.progress.get(p.id, key)))) return;
        if (opts.mode === 'mistakes') { const r = T.progress.get(p.id, key); if (!r || r.ok) return; }
        const n = Math.max(1, Math.min(20, parseInt(task.repeat, 10) || 1));
        for (let k = 0; k < n; k++) items.push({ pid: p.id, ptitle: p.title, task, key, i });
      });
    }
    if (opts.mode === 'review') {
      // сначала то, что хуже знаем
      items = T.shuffle(items).sort((a, b) => ((T.progress.get(a.pid, a.key) || { b: -1 }).b) - ((T.progress.get(b.pid, b.key) || { b: -1 }).b));
    } else if (opts.shuffle) items = T.shuffle(items);
    if (opts.limit) items = items.slice(0, opts.limit);
    return items;
  };

  // ======================= Плеер =======================
  // opts: { title, items, exam, timeLimit (мин), backHref, again() }
  T.play = function (root, opts) {
    const queue = opts.items.slice();
    const results = []; // первая попытка по каждому заданию
    const started = Date.now();
    const exam = !!opts.exam;
    const total = queue.length;
    let pos = 0, cur = null, widget = null, checked = false, busy = false, timerId = null, finished = false;

    const titleEl = h('div', { class: 'play-title' }, opts.title);
    const counter = h('div', { class: 'play-counter' });
    const timerEl = h('div', { class: 'play-timer' });
    const scoreEl = h('div', { class: 'play-score' });
    const bar = h('div', { class: 'progress' }, h('div', { class: 'progress-fill' }));
    const stage = h('div', { class: 'stage' });
    root.replaceChildren(
      h('div', { class: 'play' },
        h('div', { class: 'play-head' },
          h('a', { class: 'btn btn-ghost btn-small', href: opts.backHref || '#/', title: 'Выйти', onclick: e => {
            if (opts.onExit) { e.preventDefault(); opts.onExit(); return; }
            if (results.length && !finished && !confirm('Выйти из тренировки? Результат уже отвеченных заданий сохранён.')) e.preventDefault();
          } }, '✕'),
          titleEl, scoreEl, timerEl, counter),
        bar, stage));

    if (!total) {
      stage.replaceChildren(h('div', { class: 'card empty' }, h('p', null, 'Здесь нет заданий для этого режима.'), h('a', { class: 'btn', href: opts.backHref || '#/' }, 'Назад')));
      return;
    }

    if (exam && opts.timeLimit) {
      const end = started + opts.timeLimit * 60000;
      const tick = () => {
        const left = end - Date.now();
        if (left <= 0) { timerEl.textContent = '0:00'; finish(true); return; }
        const s = Math.ceil(left / 1000);
        timerEl.textContent = '⏱ ' + Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
        timerEl.classList.toggle('urgent', left < 60000);
      };
      tick();
      timerId = setInterval(tick, 500);
    }

    function updateHead() {
      const answered = results.length;
      counter.textContent = `${Math.min(answered + (checked ? 0 : 1), total)} / ${total}`;
      bar.firstChild.style.width = (answered / total * 100) + '%';
      if (!exam) {
        const good = results.filter(r => r.res.ok).length;
        scoreEl.replaceChildren(h('span', { class: 'good' }, '✓ ' + good), ' ', h('span', { class: 'bad' }, '✗ ' + (answered - good)));
      }
    }

    function show() {
      if (pos >= queue.length) return finish();
      cur = queue[pos];
      checked = false; busy = false;
      let task;
      try { task = T.instantiate(cur.task); }
      catch (e) { task = { type: 'flashcard', front: 'Ошибка в задании: ' + e.message, back: '' }; }
      cur.inst = task;
      const type = T.types[task.type];
      const ctx = { key: opts.preview ? null : cur.pid + ':' + cur.key, exam, submit: () => doCheck(), finish: res => accept(res) };
      try {
        widget = type ? type.render(task, ctx) : { el: h('div', { class: 'error' }, 'Неизвестный тип задания: ' + task.type), check: () => ({ ok: false, score: 0 }) };
      } catch (e) {
        console.error(e);
        widget = { el: h('div', { class: 'error' }, 'Ошибка в задании: ' + e.message), check: () => ({ ok: false, score: 0, user: '—', correct: '—' }) };
      }

      const hintEl = h('div', { class: 'hint hidden' });
      const msg = h('div', { class: 'msg' });
      const feedback = h('div', { class: 'feedback hidden' });
      const actions = h('div', { class: 'actions' });
      const checkBtn = h('button', { class: 'btn btn-primary', onclick: doCheck }, exam ? 'Ответить' : 'Проверить', h('kbd', null, '↵'));
      if (task.hint && !exam) actions.append(h('button', { class: 'btn btn-ghost', onclick: () => { hintEl.classList.remove('hidden'); hintEl.replaceChildren(T.mdEl('div', '💡 ' + task.hint)); } }, 'Подсказка'));
      if (!widget.custom && !exam) actions.append(h('button', { class: 'btn btn-ghost', onclick: giveUp }, 'Не знаю'));
      if (exam) actions.append(h('button', { class: 'btn btn-ghost', onclick: () => accept({ ok: false, score: 0, user: '(пропущено)', correct: widget.correctText ? widget.correctText() : null, skipped: true }) }, 'Пропустить'));
      if (!widget.custom) actions.append(h('span', { class: 'grow' }), checkBtn);

      const card = h('div', { class: 'card task-card' },
        h('div', { class: 'task-meta' },
          h('span', null, (type ? type.icon + ' ' + type.name : '')),
          opts.multi ? h('span', { class: 'muted' }, cur.ptitle) : null,
          cur.retry ? h('span', { class: 'tag' }, 'повтор') : null),
        (type && type.ownQuestion) || !task.q ? null : T.mdEl('div', task.q, 'question'),
        widget.el, hintEl, msg, feedback,
        widget.custom ? null : actions,
        widget.custom && exam ? actions : null);

      stage.replaceChildren(card);
      card._parts = { msg, feedback, actions };
      updateHead();
      window.scrollTo({ top: 0 });
      setTimeout(() => widget.focus && widget.focus(), 30);
    }

    async function doCheck() {
      if (checked || busy || !widget) return;
      busy = true;
      const { msg, actions } = stage.firstChild._parts;
      actions.querySelectorAll('button').forEach(b => { b.disabled = true; });
      let res;
      try { res = await widget.check(); }
      catch (e) { console.error(e); res = { invalid: 'Ошибка проверки: ' + e.message }; }
      busy = false;
      actions.querySelectorAll('button').forEach(b => { b.disabled = false; });
      if (res.invalid) {
        msg.textContent = res.invalid;
        msg.classList.remove('flash'); void msg.offsetWidth; msg.classList.add('flash');
        return;
      }
      accept(res);
    }

    function giveUp() {
      if (checked) return;
      accept(widget.reveal ? widget.reveal() : { ok: false, score: 0 }, true);
    }

    function accept(res, gaveUp) {
      if (checked || !res) return;
      checked = true;
      const item = cur;
      if (!item.retry) {
        results.push({ item, res });
        if (!opts.preview) T.progress.record(item.pid, item.key, !!res.ok);
      }
      if (!res.ok && !exam && !item.retry && !res.skipped) {
        // ошибку дадим ещё раз в конце тренировки
        queue.push({ ...item, retry: true });
      }
      if (exam) { pos++; show(); return; }

      const { feedback, actions, msg } = stage.firstChild._parts;
      msg.textContent = '';
      const task = item.inst;
      feedback.classList.remove('hidden');
      feedback.className = 'feedback ' + (res.ok ? 'ok' : 'bad');
      feedback.replaceChildren(...[
        h('div', { class: 'feedback-title' }, res.ok ? pick(['Верно!', 'Отлично!', 'Правильно!', 'Так держать!']) : gaveUp ? 'Правильный ответ' : res.self ? 'Ничего, повторим' : 'Неверно'),
        res.summary ? h('div', null, res.summary) : null,
        res.note ? h('div', null, res.note) : null,
        !res.ok && res.correct && !res.self ? T.mdEl('div', (gaveUp ? '' : '**Правильный ответ:**' + (/^```/.test(res.correct) ? '\n' : ' ')) + res.correct) : null,
        task.explain ? T.mdEl('div', task.explain, 'explain') : null].filter(Boolean));
      const nextBtn = h('button', { class: 'btn btn-primary', onclick: next }, pos + 1 >= queue.length ? 'Результаты' : 'Дальше →', h('kbd', null, '↵'));
      actions.replaceChildren(h('span', { class: 'grow' }), nextBtn);
      if (!actions.parentElement) stage.firstChild.append(actions);
      updateHead();
      nextBtn.focus({ preventScroll: true });
      feedback.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }

    function next() { if (!checked) return; pos++; show(); }

    function finish(timeUp) {
      if (finished) return;
      finished = true;
      clearInterval(timerId);
      document.removeEventListener('keydown', onKey);
      // не отвеченные в экзамене — считаем ошибками
      const answered = new Set(results.map(r => r.item));
      if (timeUp) queue.slice(0, total).forEach(it => { if (!answered.has(it)) results.push({ item: it, res: { ok: false, score: 0, user: '(не успели)', correct: null } }); });
      showResults(timeUp);
    }

    function showResults(timeUp) {
      const n = results.length;
      const score = n ? results.reduce((s, r) => s + (r.res.ok ? 1 : (r.res.score || 0) * 0.5), 0) / n : 0;
      const good = results.filter(r => r.res.ok).length;
      const pct = Math.round(score * 100);
      const grade = pct >= 90 ? 5 : pct >= 75 ? 4 : pct >= 50 ? 3 : 2;
      const wrong = results.filter(r => !r.res.ok);
      bar.firstChild.style.width = '100%';
      counter.textContent = '';
      timerEl.textContent = '';

      const mistakes = wrong.map(({ item, res }) => {
        const t = item.inst || item.task;
        const type = T.types[t.type];
        const q = t.type === 'flashcard' ? t.front : t.type === 'gaps' ? (t.q ? t.q + '\n\n' : '') + t.text : t.q;
        const correct = res.correct || (type && t.type === 'flashcard' ? t.back : null);
        return h('div', { class: 'mistake' },
          h('div', { class: 'muted small' }, type ? type.icon + ' ' + type.name : '', opts.multi ? ' · ' + item.ptitle : ''),
          T.mdEl('div', q || ''),
          res.user && !res.self ? h('div', { class: 'mistake-row' }, h('span', { class: 'bad' }, 'Ваш ответ: '), res.userMd ? T.mdEl('div', res.user) : h('span', null, res.user)) : null,
          correct ? h('div', { class: 'mistake-row' }, h('span', { class: 'good' }, 'Правильно: '), T.mdEl('div', correct)) : null,
          t.explain ? T.mdEl('div', t.explain, 'explain') : null);
      });

      stage.replaceChildren(h('div', { class: 'card results' },
        h('div', { class: 'results-top' },
          h('div', { class: 'ring', style: { '--p': pct } }, h('span', null, pct + '%')),
          h('div', null,
            h('h2', null, timeUp ? 'Время вышло' : pct === 100 ? 'Идеально! 🎉' : pct >= 75 ? 'Хорошая работа!' : pct >= 50 ? 'Неплохо, но есть над чем поработать' : 'Нужно ещё потренироваться'),
            h('div', { class: 'muted' }, `Полностью верно ${good} из ${n} · время ${T.formatDuration(Date.now() - started)}`),
            exam ? h('div', { class: 'grade grade-' + grade }, 'Оценка: ' + grade) : null)),
        h('div', { class: 'actions' },
          opts.again ? h('button', { class: 'btn btn-primary', onclick: () => opts.again() }, '↻ Ещё раз') : null,
          wrong.length ? h('button', { class: 'btn', onclick: () => T.play(root, { ...opts, exam: false, timeLimit: 0, title: opts.title + ' · работа над ошибками', items: dedupe(wrong.map(w => w.item)), again: null }) }, 'Работа над ошибками (' + wrong.length + ')') : null,
          h('a', { class: 'btn btn-ghost', href: opts.backHref || '#/', onclick: e => { if (opts.onExit) { e.preventDefault(); opts.onExit(); } } }, 'Готово')),
        wrong.length ? [h('h3', null, 'Ошибки'), mistakes] : null));
      stage.querySelector('.btn').focus();
    }

    function dedupe(items) {
      const seen = new Set();
      return items.filter(it => { const k = it.pid + ':' + it.key; if (seen.has(k)) return false; seen.add(k); return true; }).map(it => ({ ...it, retry: false }));
    }

    function onKey(e) {
      if (!root.isConnected) { document.removeEventListener('keydown', onKey); clearInterval(timerId); return; }
      if (finished || e.altKey || (document.querySelector('.modal-back') && !root.closest('.modal-back'))) return;
      if (widget && widget.onKey && !checked) {
        const r = widget.onKey(e);
        if (r === true) { e.preventDefault(); return; }
        if (r === false) return;
      }
      if (e.key !== 'Enter' || e.shiftKey) return;
      const tag = e.target.tagName;
      if (tag === 'TEXTAREA' && !(e.ctrlKey || e.metaKey)) return;
      if (tag === 'BUTTON' || tag === 'A') { if (!checked) return; }
      e.preventDefault();
      if (checked) next(); else if (!widget.custom) doCheck();
    }
    document.addEventListener('keydown', onKey);
    T.onLeave(() => { document.removeEventListener('keydown', onKey); clearInterval(timerId); });

    show();
  };

  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
})(window.T);
