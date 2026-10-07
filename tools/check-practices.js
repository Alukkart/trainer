// Проверка файлов практик без браузера: node tools/check-practices.js [файлы...]
// Без аргументов проверяет всё из practices/index.js.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
global.window = global;
global.document = { getElementById: () => null };
for (const f of ['util', 'mathexpr', 'runner', 'tasks', 'editor']) require(path.join(root, 'js', f + '.js'));

let files = process.argv.slice(2);
if (!files.length) {
  const ctx = { Trainer: { load: list => { files = list.map(f => path.join(root, 'practices', f)); } } };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'practices/index.js'), 'utf8'), ctx);
}

const ids = new Set();
let problems = 0, total = 0;
for (const file of files) {
  const added = [];
  try {
    vm.runInNewContext(fs.readFileSync(file, 'utf8'), { Trainer: { add: p => added.push(p) } }, { filename: file });
  } catch (e) {
    console.log(`✗ ${file}: ошибка в файле — ${e.message}`);
    problems++;
    continue;
  }
  for (const p of added) {
    const out = [];
    if (!p.id) out.push('нет id');
    if (ids.has(p.id)) out.push('повторяющийся id ' + p.id);
    ids.add(p.id);
    if (!p.title) out.push('нет title');
    const keys = new Set();
    (p.tasks || []).forEach((t, i) => {
      total++;
      const w = T.validateTask(t).filter(x => !x.includes('самопроверка'));
      if (t.type === 'choice') {
        const opts = (t.options || []).map(String);
        if (new Set(opts).size !== opts.length) w.push('одинаковые варианты');
        [].concat(t.answer).forEach(a => { if (typeof a === 'string' && !opts.includes(a)) w.push('ответ «' + a + '» не совпадает ни с одним вариантом'); });
      }
      if (t.type === 'match') {
        const l = t.pairs.map(x => x[0]), r = t.pairs.map(x => x[1]);
        if (new Set(l).size !== l.length || new Set(r).size !== r.length) w.push('повторяющиеся элементы в парах');
      }
      const key = T.taskKey(t);
      if (keys.has(key)) w.push('дубликат задания');
      keys.add(key);
      w.forEach(x => out.push(`задание ${i + 1} (${t.type}): ${x}`));
    });
    problems += out.length;
    console.log((out.length ? '✗ ' : '✓ ') + `${path.basename(file)} — «${p.title}», заданий: ${(p.tasks || []).length}, теория: ${p.lesson ? p.lesson.length + ' символов' : 'нет'}`);
    out.forEach(x => console.log('    ' + x));
  }
}
console.log(`\nВсего заданий: ${total}. Проблем: ${problems}.`);
process.exit(problems ? 1 : 0);
