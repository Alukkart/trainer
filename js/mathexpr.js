// Безопасный калькулятор выражений (без eval) и генератор случайных переменных для задач.
(function (T) {
  'use strict';

  const FUNCS = {
    sqrt: Math.sqrt, cbrt: Math.cbrt, abs: Math.abs, exp: Math.exp,
    sin: Math.sin, cos: Math.cos, tan: Math.tan, tg: Math.tan,
    asin: Math.asin, acos: Math.acos, atan: Math.atan, arcsin: Math.asin, arccos: Math.acos, arctg: Math.atan,
    sind: x => Math.sin(x * Math.PI / 180), cosd: x => Math.cos(x * Math.PI / 180), tand: x => Math.tan(x * Math.PI / 180),
    ln: Math.log, log2: Math.log2, lg: Math.log10,
    log: (x, b) => b === undefined ? Math.log10(x) : Math.log(x) / Math.log(b),
    floor: Math.floor, ceil: Math.ceil, sign: Math.sign, trunc: Math.trunc,
    round: (x, d = 0) => { const k = 10 ** d; return Math.round(x * k) / k; },
    min: Math.min, max: Math.max, pow: Math.pow,
    mod: (a, b) => ((a % b) + b) % b,
    gcd: (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; },
    lcm: (a, b) => a && b ? Math.abs(a * b) / FUNCS.gcd(a, b) : 0,
    fact: n => { let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; },
    C: (n, k) => FUNCS.fact(n) / (FUNCS.fact(k) * FUNCS.fact(n - k)),
    if: (c, a, b) => c ? a : b,
  };
  const CONSTS = { pi: Math.PI, 'π': Math.PI, e: Math.E };

  function tokenize(src) {
    src = String(src)
      .replace(/[×·∙]/g, '*').replace(/÷|:/g, '/').replace(/[−–]/g, '-')
      .replace(/√/g, 'sqrt').replace(/²/g, '^2').replace(/³/g, '^3').replace(/≤/g, '<=').replace(/≥/g, '>=').replace(/≠/g, '!=');
    const toks = [];
    const re = /\s*(?:(\d+(?:\.\d+)?(?:e[+-]?\d+)?|\.\d+)|([a-zA-Zа-яА-Яπ_][\wа-яА-Я]*)|(==|!=|<=|>=|&&|\|\||[-+*/^%(),<>!=]))/y;
    let m;
    re.lastIndex = 0;
    while (re.lastIndex < src.length) {
      const start = re.lastIndex;
      if (/^\s*$/.test(src.slice(start))) break;
      m = re.exec(src);
      if (!m) throw new Error('Непонятный символ: «' + src.slice(start).trim()[0] + '»');
      if (m[1] !== undefined) toks.push({ t: 'num', v: parseFloat(m[1]) });
      else if (m[2] !== undefined) toks.push({ t: 'id', v: m[2] });
      else toks.push({ t: 'op', v: m[3] === '=' ? '==' : m[3] });
    }
    return toks;
  }

  // Рекурсивный спуск -> дерево из функций
  function parse(src) {
    const toks = tokenize(src);
    let i = 0;
    const peek = () => toks[i];
    const isOp = (v) => toks[i] && toks[i].t === 'op' && toks[i].v === v;
    const eat = (v) => { if (!isOp(v)) throw new Error('Ожидалось «' + v + '»'); i++; };

    function binary(next, ops, fn) {
      return function () {
        let left = next();
        while (toks[i] && toks[i].t === 'op' && ops.includes(toks[i].v)) {
          const op = toks[i++].v, l = left, r = next();
          left = env => fn(op, l(env), r(env));
        }
        return left;
      };
    }
    const or = () => binary(and, ['||'], (o, a, b) => (a || b) ? 1 : 0)();
    const and = () => binary(cmp, ['&&'], (o, a, b) => (a && b) ? 1 : 0)();
    const cmp = () => binary(add, ['==', '!=', '<', '>', '<=', '>='], (o, a, b) => {
      const eq = Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));
      return ({ '==': eq, '!=': !eq, '<': a < b, '>': a > b, '<=': a <= b || eq, '>=': a >= b || eq })[o] ? 1 : 0;
    })();
    const add = () => binary(mul, ['+', '-'], (o, a, b) => o === '+' ? a + b : a - b)();
    function mul() {
      let left = unary();
      for (;;) {
        const t = peek();
        if (t && t.t === 'op' && ['*', '/', '%'].includes(t.v)) {
          i++;
          const l = left, r = unary(), op = t.v;
          left = op === '*' ? env => l(env) * r(env) : op === '/' ? env => l(env) / r(env) : env => l(env) % r(env);
        } else if (t && (t.t === 'num' || t.t === 'id' || (t.t === 'op' && t.v === '('))) {
          // неявное умножение: 2pi, 3(x+1), 2sqrt(3)
          const l = left, r = unary();
          left = env => l(env) * r(env);
        } else return left;
      }
    }
    function unary() {
      if (isOp('-')) { i++; const a = unary(); return env => -a(env); }
      if (isOp('+')) { i++; return unary(); }
      if (isOp('!')) { i++; const a = unary(); return env => a(env) ? 0 : 1; }
      return power();
    }
    function power() {
      const base = primary();
      if (isOp('^')) { i++; const ex = unary(); return env => Math.pow(base(env), ex(env)); }
      return base;
    }
    function primary() {
      const t = toks[i++];
      if (!t) throw new Error('Выражение оборвалось');
      if (t.t === 'num') return () => t.v;
      if (t.t === 'id') {
        if (isOp('(') && FUNCS[t.v]) {
          i++;
          const args = [];
          if (!isOp(')')) { args.push(or()); while (isOp(',')) { i++; args.push(or()); } }
          eat(')');
          const f = FUNCS[t.v];
          return env => f(...args.map(a => a(env)));
        }
        const name = t.v;
        return env => {
          if (env && name in env) return env[name];
          if (name in CONSTS) return CONSTS[name];
          throw new Error('Неизвестное имя: ' + name);
        };
      }
      if (t.v === '(') { const e = or(); eat(')'); return e; }
      throw new Error('Неожиданный символ «' + t.v + '»');
    }

    const tree = or();
    if (i < toks.length) throw new Error('Лишнее в конце: «' + toks[i].v + '»');
    return tree;
  }

  const cache = new Map();
  function compile(src) {
    if (!cache.has(src)) cache.set(src, parse(src));
    return cache.get(src);
  }

  T.math = {
    eval(src, vars) {
      if (typeof src === 'number') return src;
      return compile(String(src))(vars || {});
    },
    tryEval(src, vars) {
      try { const v = T.math.eval(src, vars); return Number.isFinite(v) ? v : null; } catch (e) { return null; }
    },
    format(x) {
      if (typeof x !== 'number') return String(x);
      if (Number.isInteger(x)) return String(x);
      return String(parseFloat(x.toPrecision(12)));
    },
    // Для показа ответа: 0.9333… -> «14/15 ≈ 0.9333»
    pretty(x) {
      if (typeof x !== 'number' || !Number.isFinite(x)) return String(x);
      if (Number.isInteger(x) || Math.abs(x * 1e4 - Math.round(x * 1e4)) < 1e-9) return T.math.format(x);
      for (let d = 2; d <= 100; d++) {
        const n = Math.round(x * d);
        if (Math.abs(n / d - x) < 1e-9) return `${n}/${d} ≈ ${parseFloat(x.toFixed(4))}`;
      }
      return String(parseFloat(x.toFixed(6)));
    },
    funcs: Object.keys(FUNCS),
  };

  // ---------- Случайные переменные ----------
  // vars: { a: "1..10", b: "-5..5 step 0.5", c: [2, 3, 5, 7], d: "= a*b" }, where: "a != b"
  function pickVar(spec, env) {
    if (Array.isArray(spec)) return spec[Math.floor(Math.random() * spec.length)];
    if (typeof spec === 'number') return spec;
    const s = String(spec).trim();
    if (s.startsWith('=')) return T.math.eval(s.slice(1), env);
    const m = s.match(/^(-?[\d.]+)\s*\.\.\s*(-?[\d.]+)(?:\s+step\s+([\d.]+))?(?:\s+(?:not|кроме)\s+(.+))?$/i);
    if (m) {
      const lo = parseFloat(m[1]), hi = parseFloat(m[2]), step = m[3] ? parseFloat(m[3]) : 1;
      const except = m[4] ? m[4].split(/[\s,]+/).map(Number) : [];
      const n = Math.floor((hi - lo) / step + 1e-9) + 1;
      for (let k = 0; k < 100; k++) {
        const v = parseFloat((lo + step * Math.floor(Math.random() * n)).toFixed(10));
        if (!except.includes(v)) return v;
      }
      return lo;
    }
    if (s.includes(',')) return pickVar(s.split(',').map(x => isNaN(x) ? x.trim() : Number(x)), env);
    const num = Number(s);
    return isNaN(num) ? s : num;
  }

  T.math.genVars = function (vars, where) {
    if (!vars || !Object.keys(vars).length) return null;
    for (let attempt = 0; attempt < 500; attempt++) {
      const env = {};
      for (const [name, spec] of Object.entries(vars)) env[name] = pickVar(spec, env);
      if (!where || T.math.eval(where, env)) return env;
    }
    throw new Error('Не удалось подобрать переменные под условие «' + where + '»');
  };

  // Подстановка в текст: {a} -> значение, {+a} -> "+ 3" / "- 3", {= a*b} -> вычисленное значение
  T.math.subst = function (text, env) {
    if (!env || typeof text !== 'string') return text;
    return text.replace(/\{(=|\+)?\s*([^{}]+?)\s*\}/g, (m, mode, body, offset) => {
      // внутри LaTeX (\frac{a}{b}, x^{n}) фигурные скобки нужно сохранить
      const wrap = /(\\[a-zA-Z]+|[}^_])$/.test(text.slice(0, offset)) ? v => '{' + v + '}' : v => v;
      try {
        if (mode === '=') return wrap(T.math.format(T.math.eval(body, env)));
        if (!(body in env)) return m;
        const v = env[body];
        if (mode === '+') return wrap(typeof v === 'number' ? (v < 0 ? '- ' + T.math.format(-v) : '+ ' + T.math.format(v)) : '+ ' + v);
        return wrap(T.math.format(v));
      } catch (e) { return m; }
    });
  };
})(window.T);
