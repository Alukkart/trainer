// Запуск кода учеников в Web Worker'ах: JavaScript — сразу, Python — через Pyodide (грузится с CDN при первом запуске).
// Воркеры создаются из Blob, поэтому всё работает и при открытии index.html двойным кликом.
(function (T) {
  'use strict';

  const PYODIDE_URL = 'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/';
  const TIMEOUT = { javascript: 5000, python: 10000 };

  const JS_WORKER = `
    function fmt(v) {
      if (typeof v === 'string') return v;
      if (v === undefined) return 'undefined';
      if (typeof v === 'function') return v.toString();
      try { return JSON.stringify(v); } catch (e) { return String(v); }
    }
    function makeIO(stdin) {
      const lines = String(stdin || '').split('\\n');
      if (lines.length && lines[lines.length - 1] === '') lines.pop();
      let i = 0; const out = [];
      const print = (...a) => out.push(a.map(fmt).join(' '));
      const input = () => i < lines.length ? lines[i++] : null;
      const console = { log: print, info: print, warn: print, error: print };
      return { input, print, console, out };
    }
    function errText(e) { return (e && e.name ? e.name + ': ' : '') + (e && e.message !== undefined ? e.message : String(e)); }
    self.onmessage = (e) => {
      const { id, code, stdin, calls } = e.data;
      const io = makeIO(stdin);
      const res = { id };
      try {
        if (calls) {
          const f = new Function('input', 'print', 'console', 'prompt', '__calls',
            code + '\\n;return __calls.map(function (__c) { try { var __v = eval(__c); return { ok: true, v: __v === undefined ? "null" : JSON.stringify(__v) }; } catch (__e) { return { ok: false, err: (__e && __e.name ? __e.name + ": " : "") + (__e && __e.message) }; } });');
          res.results = f(io.input, io.print, io.console, io.input, calls);
        } else {
          new Function('input', 'print', 'console', 'prompt', code)(io.input, io.print, io.console, io.input);
        }
      } catch (err) { res.error = errText(err); }
      res.stdout = io.out.join('\\n');
      self.postMessage(res);
    };
    self.postMessage({ ready: true });
  `;

  const PY_HARNESS = `
import sys, io, json, traceback

def __fmt_err(e):
    if isinstance(e, SyntaxError):
        return f"Строка {e.lineno}: SyntaxError: {e.msg}"
    line = None
    for fr in traceback.extract_tb(e.__traceback__):
        if fr.filename == "main.py":
            line = fr.lineno
    msg = "".join(traceback.format_exception_only(type(e), e)).strip()
    return (f"Строка {line}: " if line else "") + msg

def __make_input(stdin):
    lines = iter(stdin.split("\\n"))
    def _input(prompt=""):
        try:
            return next(lines)
        except StopIteration:
            raise EOFError("input(): входные данные закончились")
    return _input

def __exec(code, stdin, g):
    out = io.StringIO()
    old = sys.stdout, sys.stdin
    sys.stdout, sys.stdin = out, io.StringIO(stdin)
    err = None
    try:
        exec(compile(code, "main.py", "exec"), g)
    except SystemExit:
        pass
    except BaseException as e:
        err = __fmt_err(e)
    finally:
        sys.stdout, sys.stdin = old
    return out.getvalue(), err

def __tojson(v):
    if isinstance(v, (set, frozenset)):
        v = sorted(v, key=repr)
    try:
        return json.dumps(v, ensure_ascii=False)
    except (TypeError, ValueError):
        return json.dumps(repr(v), ensure_ascii=False)

def __run(code, stdin, calls_json):
    g = {"__name__": "__main__", "input": __make_input(stdin)}
    stdout, err = __exec(code, stdin, g)
    res = {"stdout": stdout, "error": err}
    if calls_json and err is None:
        results = []
        for c in json.loads(calls_json):
            out = io.StringIO(); old = sys.stdout; sys.stdout = out
            try:
                results.append({"ok": True, "v": __tojson(eval(c, g))})
            except BaseException as e:
                results.append({"ok": False, "err": __fmt_err(e)})
            finally:
                sys.stdout = old
        res["results"] = results
    return json.dumps(res, ensure_ascii=False)
`;

  const PY_WORKER = `
    let py = null;
    const ready = (async () => {
      importScripts(${JSON.stringify(PYODIDE_URL)} + 'pyodide.js');
      py = await loadPyodide({ indexURL: ${JSON.stringify(PYODIDE_URL)} });
      py.runPython(${JSON.stringify(PY_HARNESS)});
      self.postMessage({ ready: true });
    })().catch(err => self.postMessage({ fatal: 'Не удалось загрузить Python: ' + err.message }));
    self.onmessage = async (e) => {
      await ready;
      const { id, code, stdin, calls } = e.data;
      try {
        const fn = py.globals.get('__run');
        const out = JSON.parse(fn(code, stdin || '', calls ? JSON.stringify(calls) : ''));
        fn.destroy();
        out.id = id;
        if (out.stdout && out.stdout.endsWith('\\n')) out.stdout = out.stdout.slice(0, -1);
        self.postMessage(out);
      } catch (err) {
        self.postMessage({ id, error: String(err.message || err) });
      }
    };
  `;

  // ---------- Пул воркеров (по одному на язык) ----------

  const workers = {};
  function getWorker(lang) {
    if (workers[lang]) return workers[lang];
    const src = lang === 'python' ? PY_WORKER : JS_WORKER;
    const w = new Worker(URL.createObjectURL(new Blob([src], { type: 'text/javascript' })));
    const state = { w, pending: new Map(), ready: false, readyWaiters: [], fatal: null };
    w.onmessage = (e) => {
      const d = e.data;
      if (d.ready) { state.ready = true; state.readyWaiters.splice(0).forEach(f => f()); return; }
      if (d.fatal) { state.fatal = d.fatal; state.readyWaiters.splice(0).forEach(f => f()); return; }
      const p = state.pending.get(d.id);
      if (p) { state.pending.delete(d.id); p(d); }
    };
    w.onerror = (e) => { state.fatal = 'Ошибка воркера: ' + (e.message || 'неизвестная'); state.readyWaiters.splice(0).forEach(f => f()); };
    workers[lang] = state;
    return state;
  }
  function kill(lang) {
    const s = workers[lang];
    if (!s) return;
    s.w.terminate();
    delete workers[lang];
  }

  let nextId = 1;

  // Выполнить код. calls — массив выражений для режима «функция» (результаты вернутся в results).
  async function exec(lang, code, { stdin = '', calls = null, onStatus } = {}) {
    let s = getWorker(lang);
    if (s.fatal) { kill(lang); s = getWorker(lang); }
    if (!s.ready && !s.fatal) {
      if (lang === 'python' && onStatus) onStatus('Загружаю Python… (только в первый раз, ~10 МБ)');
      await new Promise(r => s.readyWaiters.push(r));
    }
    if (s.fatal) return { error: s.fatal };
    if (onStatus) onStatus('Выполняется…');
    const id = nextId++;
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        s.pending.delete(id);
        kill(lang);
        resolve({ error: `Превышено время выполнения (${TIMEOUT[lang] / 1000} с). Возможно, бесконечный цикл или программа ждёт ввода.`, timeout: true });
      }, TIMEOUT[lang]);
      s.pending.set(id, (d) => { clearTimeout(timer); resolve(d); });
      s.w.postMessage({ id, code, stdin, calls });
    });
  }

  const normOut = s => String(s == null ? '' : s).replace(/\r/g, '').split('\n').map(l => l.replace(/\s+$/, '')).join('\n').replace(/\n+$/, '');

  // Прогон тестов. tests: [{call, expected} | {input, output}]
  async function runTests(lang, code, tests, onStatus) {
    const results = new Array(tests.length);
    const fnTests = tests.map((t, i) => [t, i]).filter(([t]) => t.call != null);
    const ioTests = tests.map((t, i) => [t, i]).filter(([t]) => t.call == null);

    if (fnTests.length) {
      const r = await exec(lang, code, { calls: fnTests.map(([t]) => t.call), onStatus });
      fnTests.forEach(([t, i], k) => {
        if (r.error || !r.results) { results[i] = { pass: false, error: r.error || 'Ошибка' }; return; }
        const x = r.results[k];
        if (!x.ok) { results[i] = { pass: false, error: x.err }; return; }
        let got;
        try { got = JSON.parse(x.v); } catch (e) { got = x.v; }
        results[i] = { pass: T.deepEqual(got, t.expected), got: JSON.stringify(got) };
      });
      if (r.timeout) return { results, error: r.error };
    }
    for (const [t, i] of ioTests) {
      const r = await exec(lang, code, { stdin: t.input || '', onStatus });
      const got = normOut(r.stdout);
      results[i] = r.error
        ? { pass: false, error: r.error, got }
        : { pass: got === normOut(t.output), got };
      if (r.timeout) {
        for (const [, j] of ioTests) if (!results[j]) results[j] = { pass: false, error: 'Не запускался' };
        break;
      }
    }
    return { results };
  }

  T.runner = {
    supported: lang => lang === 'python' || lang === 'javascript',
    run: (lang, code, stdin, onStatus) => exec(lang, code, { stdin, onStatus }),
    test: runTests,
    warmUp: lang => { if (lang === 'python') getWorker('python'); },
  };
})(window.T);
