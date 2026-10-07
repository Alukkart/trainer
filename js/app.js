// Реестр практик, маршрутизация и основные страницы.
(function (T) {
  'use strict';
  const h = T.h;

  // ======================= Реестр =======================
  const site = {};       // практики из папки practices/
  const siteOrder = [];
  const temp = {};       // открытые по ссылке, но не сохранённые
  let files = [];

  function normalizePractice(p) {
    p.id = String(p.id || ('p-' + T.hash(p.title || JSON.stringify(p.tasks || []))));
    p.title = p.title || 'Без названия';
    p.subject = p.subject || 'Разное';
    p.tasks = Array.isArray(p.tasks) ? p.tasks : [];
    return p;
  }

  window.Trainer = {
    // Вызывается из файлов practices/*.js
    add(p) {
      normalizePractice(p);
      if (site[p.id]) console.warn('Практика с id «' + p.id + '» уже есть — будет заменена');
      else siteOrder.push(p.id);
      site[p.id] = p;
    },
    // Вызывается из practices/index.js
    load(list) { files = list; },
    start() {
      const base = 'practices/';
      let left = files.length;
      const done = () => { if (--left <= 0) boot(); };
      if (!left) return boot();
      for (const f of files) {
        const s = document.createElement('script');
        s.src = base + f;
        s.async = false; // сохраняем порядок из списка
        s.onload = done;
        s.onerror = () => { console.error('Не загрузился файл практики: ' + f); T.toast('Не загрузился файл practices/' + f); done(); };
        document.body.append(s);
      }
    },
  };

  T.mine = () => T.store.get('mine', {});
  T.saveMine = p => { const m = T.mine(); m[p.id] = p; return T.store.set('mine', m); };
  T.deleteMine = id => { const m = T.mine(); delete m[id]; T.store.set('mine', m); };
  T.getPractice = function (id) {
    const m = T.mine();
    if (m[id]) return { p: normalizePractice(m[id]), source: 'mine' };
    if (site[id]) return { p: site[id], source: 'site' };
    if (temp[id]) return { p: temp[id], source: 'temp' };
    return null;
  };
  T.allPractices = () => siteOrder.map(id => site[id]).concat(Object.values(T.mine()).map(normalizePractice));

  // ======================= Роутер =======================
  let leaveHooks = [];
  T.onLeave = fn => leaveHooks.push(fn);
  const app = () => document.getElementById('app');

  function parseHash() {
    const raw = location.hash.slice(1) || '/';
    const [path, query] = raw.split('?');
    const parts = path.split('/').filter(Boolean).map(decodeURIComponent);
    const params = Object.fromEntries(new URLSearchParams(query || ''));
    return { parts, params };
  }

  function route() {
    const hooks = leaveHooks; leaveHooks = [];
    hooks.forEach(fn => { try { fn(); } catch (e) { console.error(e); } });
    document.querySelectorAll('.modal-back').forEach(m => m.remove());
    const { parts, params } = parseHash();
    const root = app();
    root.className = '';
    try {
      switch (parts[0]) {
        case undefined: return home(root);
        case 'p': return practicePage(root, parts[1]);
        case 'play': return playPage(root, parts[1], params);
        case 'new': return newPractice();
        case 'edit': return editPage(root, parts[1]);
        case 's': return sharedPage(root, parts.slice(1).join('/'));
        case 'help': return T.renderHelp(root);
        default: return notFound(root);
      }
    } catch (e) {
      console.error(e);
      root.replaceChildren(h('div', { class: 'card error' }, 'Ошибка: ' + e.message));
    } finally {
      window.scrollTo(0, 0);
    }
  }

  function boot() {
    window.addEventListener('hashchange', route);
    route();
  }

  function notFound(root, what = 'Страница не найдена') {
    root.replaceChildren(h('div', { class: 'card empty' }, h('h2', null, what), h('a', { class: 'btn', href: '#/' }, 'На главную')));
  }

  // ======================= Тема =======================
  document.getElementById('theme-toggle').addEventListener('click', () => {
    const cur = document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    T.store.set('theme', next);
  });

  // ======================= Главная =======================
  const hue = s => parseInt(T.hash(s || ''), 36) % 360;
  T.subjectBadge = s => h('span', { class: 'subject', style: { '--hue': hue(s) } }, s);

  function practiceCard(p, source) {
    const st = T.progress.stats(p);
    const pct = st.total ? Math.round(st.done / st.total * 100) : 0;
    return h('a', { class: 'card pcard', href: '#/p/' + encodeURIComponent(p.id), style: { '--hue': hue(p.subject) } },
      h('div', { class: 'pcard-top' }, T.subjectBadge(p.subject), source === 'mine' ? h('span', { class: 'tag' }, 'моя') : null),
      h('h3', null, p.title),
      p.description ? h('p', { class: 'muted pcard-desc' }, T.plain(p.description, 140)) : null,
      h('div', { class: 'grow' }),
      h('div', { class: 'pcard-foot' },
        h('span', null, st.total + ' ' + T.plural(st.total, 'задание', 'задания', 'заданий')),
        st.seen && st.due ? h('span', { class: 'due' }, '↻ ' + st.due) : null,
        h('span', { class: 'grow' }),
        st.seen ? h('span', { class: 'muted' }, pct + '%') : null),
      h('div', { class: 'progress thin' }, h('div', { class: 'progress-fill', style: { width: pct + '%' } })));
  }

  function home(root) {
    const mine = Object.values(T.mine()).map(normalizePractice).sort((a, b) => (b.updated || 0) - (a.updated || 0));
    const sitePs = siteOrder.map(id => site[id]);
    const everything = mine.map(p => [p, 'mine']).concat(sitePs.map(p => [p, 'site']));
    const subjects = [...new Set(everything.map(([p]) => p.subject))];
    let filter = T.store.get('filter', '');
    if (filter && !subjects.includes(filter)) filter = '';
    let query = '';

    let dueTotal = 0, seenAny = false;
    for (const [p] of everything) { const s = T.progress.stats(p); if (s.seen) { seenAny = true; dueTotal += s.due - (s.total - s.seen); } }

    const search = h('input', { type: 'search', class: 'search', placeholder: 'Поиск практики…', oninput: e => { query = e.target.value.toLowerCase(); draw(); } });
    const chips = h('div', { class: 'chips' });
    const body = h('div');
    const fileInput = h('input', { type: 'file', accept: '.json,.js,application/json', class: 'hidden', onchange: e => importFile(e.target.files[0]) });

    function draw() {
      chips.replaceChildren(...[''].concat(subjects).map(s => h('button', {
        class: 'chip' + (s === filter ? ' active' : ''), style: s ? { '--hue': hue(s) } : null,
        onclick: () => { filter = s; T.store.set('filter', s); draw(); },
      }, s || 'Все предметы')));
      const match = ([p]) => (!filter || p.subject === filter) &&
        (!query || (p.title + ' ' + (p.description || '') + ' ' + p.subject).toLowerCase().includes(query));
      const groups = [];
      const myList = everything.filter(x => x[1] === 'mine').filter(match);
      if (myList.length) groups.push(['Мои практики', myList]);
      for (const s of subjects) {
        const g = everything.filter(x => x[1] === 'site' && x[0].subject === s).filter(match);
        if (g.length) groups.push([s, g]);
      }
      body.replaceChildren(...groups.map(([name, items]) => h('section', null,
        h('h2', { class: 'group-title' }, name),
        h('div', { class: 'pgrid' }, items.map(([p, src]) => practiceCard(p, src))))));
      if (!groups.length) body.append(h('div', { class: 'card empty muted' }, everything.length ? 'Ничего не найдено' : 'Практик пока нет — создайте первую!'));
    }

    root.replaceChildren(
      h('div', { class: 'hero' },
        h('div', null,
          h('h1', null, 'Готовимся к контрольным'),
          h('p', { class: 'muted' }, 'Выберите практику, тренируйтесь и повторяйте то, что начинаете забывать. Свои практики можно создать в редакторе и отправить одногруппникам ссылкой.')),
        h('div', { class: 'hero-actions' },
          seenAny ? h('a', { class: 'btn btn-primary', href: '#/play/*?mode=review', title: 'Задания из всех практик, которые пора повторить' }, '↻ Повторить всё' + (dueTotal > 0 ? ` (${dueTotal})` : '')) : null,
          h('a', { class: 'btn', href: '#/new' }, '＋ Создать практику'),
          h('button', { class: 'btn btn-ghost', onclick: () => fileInput.click() }, '⤓ Импорт файла'),
          fileInput)),
      h('div', { class: 'toolbar' }, search, chips),
      body);
    draw();
  }

  async function importFile(file) {
    if (!file) return;
    try {
      const p = normalizePractice(T.parsePracticeFile(await file.text()));
      if (!p.tasks.length) throw new Error('В практике нет заданий');
      saveImported(p);
    } catch (e) { alert('Не удалось импортировать: ' + e.message); }
  }

  function saveImported(p) {
    p = T.clone(p);
    const mine = T.mine();
    if (site[p.id]) p.id = 'my-' + T.uid();
    else if (mine[p.id] && !confirm('У вас уже есть практика «' + mine[p.id].title + '». Заменить её новой версией? (Прогресс сохранится)')) p.id = 'my-' + T.uid();
    p.updated = Date.now();
    T.saveMine(p);
    delete temp[p.id];
    T.toast('Сохранено в «Мои практики»');
    location.hash = '#/p/' + encodeURIComponent(p.id);
  }

  // ======================= Страница практики =======================
  function practicePage(root, id, { shared } = {}) {
    const found = T.getPractice(id);
    if (!found) return notFound(root, 'Практика не найдена');
    const { p, source } = found;
    const st = T.progress.stats(p);
    const pref = T.store.get('playPrefs', { shuffle: p.shuffle !== false, n: 0, time: 0, examN: 20 });
    const enc = encodeURIComponent(p.id);

    const shuffle = h('input', { type: 'checkbox', checked: pref.shuffle });
    const nSel = h('select', null, [[0, 'все'], [10, '10'], [20, '20'], [30, '30']].map(([v, l]) => h('option', { value: v, selected: pref.n == v }, l)));
    const examN = h('select', null, [[0, 'все'], [10, '10'], [15, '15'], [20, '20'], [30, '30']].map(([v, l]) => h('option', { value: v, selected: pref.examN == v }, l)));
    const timeSel = h('select', null, [[0, 'без таймера'], [5, '5 мин'], [10, '10 мин'], [15, '15 мин'], [20, '20 мин'], [30, '30 мин'], [45, '45 мин']].map(([v, l]) => h('option', { value: v, selected: pref.time == v }, l)));
    const savePref = () => T.store.set('playPrefs', { shuffle: shuffle.checked, n: +nSel.value, time: +timeSel.value, examN: +examN.value });
    const go = (mode, extra = {}) => { savePref(); location.hash = '#/play/' + enc + '?' + new URLSearchParams({ mode, ...extra }); };

    const nextTxt = st.next < Infinity ? new Date(st.next).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }) : null;
    const modes = h('div', { class: 'modes' },
      h('div', { class: 'card mode' },
        h('div', { class: 'mode-icon' }, '🏋'), h('h3', null, 'Тренировка'),
        h('p', { class: 'muted small' }, 'Все задания с проверкой и объяснениями. Ошибки повторяются в конце.'),
        h('div', { class: 'mode-opts' }, h('label', { class: 'check' }, shuffle, ' перемешать'), h('label', null, 'заданий: ', nSel)),
        h('button', { class: 'btn btn-primary', onclick: () => go('all', { shuffle: shuffle.checked ? 1 : 0, n: nSel.value }) }, 'Начать')),
      h('div', { class: 'card mode' },
        h('div', { class: 'mode-icon' }, '↻'), h('h3', null, 'Повторение'),
        h('p', { class: 'muted small' }, 'Интервальное повторение: новые задания и те, что пора освежить в памяти.'),
        h('div', { class: 'mode-opts' }, st.due ? h('b', null, st.due + ' ' + T.plural(st.due, 'задание', 'задания', 'заданий')) : h('span', { class: 'muted' }, 'Всё повторено' + (nextTxt ? ', следующее — ' + nextTxt : ''))),
        h('button', { class: 'btn', disabled: !st.due, onclick: () => go('review', { n: 20 }) }, 'Повторить')),
      h('div', { class: 'card mode' },
        h('div', { class: 'mode-icon' }, '✎'), h('h3', null, 'Работа над ошибками'),
        h('p', { class: 'muted small' }, 'Только задания, в которых последний ответ был неверным.'),
        h('div', { class: 'mode-opts' }, st.wrong ? h('b', null, st.wrong + ' ' + T.plural(st.wrong, 'ошибка', 'ошибки', 'ошибок')) : h('span', { class: 'muted' }, 'Ошибок нет')),
        h('button', { class: 'btn', disabled: !st.wrong, onclick: () => go('mistakes', { shuffle: 1 }) }, 'Исправить')),
      h('div', { class: 'card mode' },
        h('div', { class: 'mode-icon' }, '📝'), h('h3', null, 'Контрольная'),
        h('p', { class: 'muted small' }, 'Как на настоящей: без подсказок и проверки по ходу, оценка в конце.'),
        h('div', { class: 'mode-opts' }, h('label', null, 'заданий: ', examN), timeSel),
        h('button', { class: 'btn', onclick: () => go('exam', { shuffle: 1, n: examN.value, time: timeSel.value }) }, 'Начать')));

    const taskRows = p.tasks.map((t, i) => {
      const type = T.types[t.type];
      const r = T.progress.get(p.id, T.taskKey(t));
      return h('a', { class: 'trow', href: '#/play/' + enc + '?mode=one&i=' + i, title: 'Решить это задание' },
        h('span', { class: 'dot ' + (!r ? '' : r.ok ? 'dot-ok' : 'dot-bad') }),
        h('span', { class: 'trow-type', title: type ? type.name : t.type }, type ? type.icon : '?'),
        h('span', { class: 'trow-text', html: T.mdInline(T.taskTitle(t)) }));
    });

    const fileName = (p.id || 'practice').replace(/[^\w\-а-яё]+/gi, '-');
    root.replaceChildren(h('div', { class: 'practice' },
      shared || source === 'temp' ? h('div', { class: 'card banner' },
        h('div', null, h('b', null, 'Практика по ссылке. '), 'Сохраните её, чтобы она осталась в списке и её можно было редактировать.'),
        h('button', { class: 'btn btn-primary', onclick: () => saveImported(p) }, 'Сохранить к себе')) : null,
      h('a', { class: 'back', href: '#/' }, '← Все практики'),
      h('div', { class: 'practice-head' },
        h('div', null,
          h('div', { class: 'row' }, T.subjectBadge(p.subject), source === 'mine' ? h('span', { class: 'tag' }, 'моя') : null, p.author ? h('span', { class: 'muted small' }, 'автор: ' + p.author) : null),
          h('h1', null, p.title),
          p.description ? T.mdEl('div', p.description, 'muted') : null),
        h('div', { class: 'stats' },
          stat(st.total, 'заданий'), stat(st.done, 'решено верно', 'good'), stat(st.wrong, 'с ошибкой', 'bad'), stat(st.seen ? st.due : '—', 'к повторению'))),
      p.tasks.length ? modes : h('div', { class: 'card empty muted' }, 'В практике пока нет заданий.'),
      h('div', { class: 'actions wrap' },
        source === 'mine'
          ? h('a', { class: 'btn', href: '#/edit/' + enc }, '✎ Редактировать')
          : h('a', { class: 'btn', href: '#/edit/' + enc, title: 'Создать свою копию и изменить её' }, '✎ Редактировать копию'),
        h('button', { class: 'btn', onclick: () => T.shareDialog(p) }, '🔗 Поделиться'),
        h('button', { class: 'btn btn-ghost', onclick: () => T.download(fileName + '.json', JSON.stringify(p, null, 2)) }, '⤓ Скачать'),
        h('span', { class: 'grow' }),
        st.seen ? h('button', { class: 'btn btn-ghost', onclick: () => { if (confirm('Сбросить прогресс по этой практике?')) { T.progress.reset(p.id); route(); } } }, 'Сбросить прогресс') : null,
        source === 'mine' ? h('button', { class: 'btn btn-ghost bad', onclick: () => { if (confirm('Удалить практику «' + p.title + '»? Это нельзя отменить.')) { T.deleteMine(p.id); location.hash = '#/'; } } }, 'Удалить') : null),
      p.tasks.length ? h('details', { class: 'card tasks-preview', open: p.tasks.length <= 12 },
        h('summary', null, 'Список заданий (' + p.tasks.length + ')'),
        h('div', { class: 'trows' }, taskRows)) : null));
    T.renderMath(root.querySelector('.trows'));
  }
  const stat = (v, label, cls) => h('div', { class: 'stat' }, h('div', { class: 'stat-v ' + (cls || '') }, v), h('div', { class: 'stat-l' }, label));

  // ======================= Тренировка =======================
  function playPage(root, id, params) {
    let practices, title, backHref;
    if (id === '*') {
      practices = T.allPractices();
      title = 'Повторение по всем практикам';
      backHref = '#/';
    } else {
      const found = T.getPractice(id);
      if (!found) return notFound(root, 'Практика не найдена');
      practices = [found.p];
      title = found.p.title;
      backHref = '#/p/' + encodeURIComponent(id);
    }
    const mode = params.mode || 'all';
    const start = () => {
      let items;
      if (mode === 'one') {
        const p = practices[0], t = p.tasks[+params.i];
        items = t ? [{ pid: p.id, ptitle: p.title, task: t, key: T.taskKey(t), i: +params.i }] : [];
      } else {
        items = T.buildSession(practices, {
          mode: mode === 'exam' ? 'all' : mode,
          shuffle: params.shuffle === '1' || mode === 'review',
          limit: +params.n || 0,
          seenOnly: id === '*',
        });
      }
      root.className = 'wide-off';
      T.play(root, {
        title: title + (mode === 'exam' ? ' · контрольная' : mode === 'mistakes' ? ' · ошибки' : ''),
        items, backHref, exam: mode === 'exam', timeLimit: +params.time || 0,
        multi: practices.length > 1, again: start,
      });
    };
    start();
  }

  // ======================= Создание и редактирование =======================
  function newPractice() {
    const p = { id: 'my-' + T.uid(), title: 'Новая практика', subject: T.store.get('filter', '') || '', description: '', tasks: [], updated: Date.now() };
    T.saveMine(p);
    location.replace('#/edit/' + p.id);
  }

  function editPage(root, id) {
    const found = T.getPractice(id);
    if (!found) return notFound(root, 'Практика не найдена');
    if (found.source !== 'mine') {
      const copy = T.clone(found.p);
      copy.id = 'my-' + T.uid();
      if (found.source === 'site') copy.title += ' (копия)';
      copy.updated = Date.now();
      T.saveMine(copy);
      T.toast(found.source === 'site' ? 'Создана ваша копия практики' : 'Практика сохранена к вам');
      location.replace('#/edit/' + copy.id);
      return;
    }
    T.editor(root, found.p);
  }

  // ======================= Шаринг =======================
  T.shareDialog = async function (p) {
    const url = await T.shareUrl(p);
    const inp = h('input', { type: 'text', readonly: true, value: url, class: 'mono', onclick: e => e.target.select() });
    const fileName = (p.id || 'practice').replace(/[^\w\-а-яё]+/gi, '-');
    T.modal(h('div', null,
      h('h2', null, 'Поделиться практикой'),
      h('p', null, 'Ссылка содержит всю практику целиком — отправьте её в чат группы. Кто откроет, сможет пройти практику и сохранить её себе.'),
      h('div', { class: 'row' }, inp, h('button', { class: 'btn btn-primary', onclick: () => T.copy(url).then(ok => T.toast(ok ? 'Ссылка скопирована' : 'Скопируйте вручную')) }, 'Копировать')),
      url.length > 6000 ? h('p', { class: 'small bad' }, `Ссылка длинная (${url.length} символов) — некоторые мессенджеры её обрежут. Лучше отправить файлом.`) : h('p', { class: 'muted small' }, url.length + ' символов'),
      h('h3', null, 'Или файлом'),
      h('div', { class: 'actions wrap' },
        h('button', { class: 'btn', onclick: () => T.download(fileName + '.json', JSON.stringify(p, null, 2)) }, '⤓ Файл .json (для импорта)'),
        h('button', { class: 'btn', onclick: () => T.download(fileName + '.js', T.practiceToJs(p)) }, '⤓ Файл .js (добавить на сайт)')),
      h('p', { class: 'muted small' }, 'Файл .json открывается кнопкой «Импорт файла» на главной. Файл .js кладётся в папку practices/ и прописывается в practices/index.js — тогда практика появится на сайте у всех.')));
    inp.select();
  };

  async function sharedPage(root, data) {
    root.replaceChildren(h('div', { class: 'loading' }, 'Открываю практику…'));
    try {
      const p = normalizePractice(await T.decodeShare(data));
      const mine = T.mine()[p.id];
      if (mine && JSON.stringify(mine.tasks) === JSON.stringify(p.tasks)) { location.replace('#/p/' + encodeURIComponent(p.id)); return; }
      if (site[p.id] && JSON.stringify(site[p.id].tasks) === JSON.stringify(p.tasks)) { location.replace('#/p/' + encodeURIComponent(p.id)); return; }
      if (site[p.id] || mine) p.id = p.id + '-' + T.hash(JSON.stringify(p.tasks)).slice(0, 5);
      temp[p.id] = p;
      practicePage(root, p.id, { shared: true });
    } catch (e) {
      console.error(e);
      notFound(root, 'Ссылка повреждена — возможно, её обрезал мессенджер');
    }
  }
})(window.T);
