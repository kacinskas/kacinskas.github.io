(() => {
  'use strict';

  const DESC = 'Everything about tech: building, automating and running businesses from zero to one, with a team of AI agents.';
  const FILES = { 'about.txt': DESC };
  const SECRETS = [
    'my AI agents do all the work, I just take the credit.',
    "I asked my AI agents to write this secret. They're still in a meeting about it.",
    'I always say "please" and "thank you" to my agents, just in case.',
    'zero to one is easy. One to two is where the agents start arguing.',
    'every "fully automated" business still has me clicking one button at 3am.',
    'my best co-founder never sleeps, works for free and has never asked for a raise. It\'s a cron job.',
  ];
  const SUDO_JOKES = [
    'visitor is not in the sudoers file. This incident will be reported to my AI agents. They are very excited.',
    "Access denied. Even my AI agents don't get sudo, and they run the business.",
    'Root access is earned, not typed.',
    "Wrong password. Hint: it's not 'password'. It's not 'admin' either.",
    "Request forwarded to the HR agent. Don't wait up.",
    'Ticket created. Estimated response time: never.',
    'sudo? On my machine? In this economy?',
  ];
  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(pointer: fine)').matches;

  const term = document.getElementById('term');
  const out = document.getElementById('out');
  const live = document.getElementById('live');
  const buf = document.getElementById('buf');
  const input = document.getElementById('cmd');

  /* ------------------------------------------------------------ helpers */

  function span(cls, text) {
    const s = document.createElement('span');
    if (cls) s.className = cls;
    if (text != null) s.textContent = text;
    return s;
  }

  function prompt() {
    const f = document.createDocumentFragment();
    f.append(span('pu', 'tadas@kacinskas'), ':', span('pp', '~'), '$ ');
    return f;
  }

  function line(text, cls, hidden) {
    const d = document.createElement('div');
    d.className = 'line' + (cls ? ' ' + cls : '');
    if (text != null) d.textContent = text;
    if (hidden) d.setAttribute('aria-hidden', 'true');
    out.append(d);
    return d;
  }

  function scrollDown() {
    window.scrollTo(0, document.documentElement.scrollHeight);
  }

  /* ------------------------------------------------------------ intro */

  let skipping = reduceMotion;
  let wake = null;

  function sleep(ms) {
    if (skipping) return Promise.resolve();
    return new Promise((resolve) => {
      const t = setTimeout(() => { wake = null; resolve(); }, ms);
      wake = () => { clearTimeout(t); wake = null; resolve(); };
    });
  }

  function skip() {
    if (skipping) return;
    skipping = true;
    if (wake) wake();
  }

  async function typeCommand(cmd) {
    const l = line(null, null, true);
    const typed = span('typed');
    const cur = span('cursor', ' ');
    l.append(prompt(), typed, cur);
    await sleep(500);
    for (const ch of cmd) {
      typed.textContent += ch;
      await sleep(45 + Math.random() * 85);
    }
    await sleep(260);
    cur.remove();
  }

  async function intro() {
    out.textContent = '';
    await sleep(350);
    await typeCommand('whoami');
    line('tadas kacinskas', null, true);
    await typeCommand('cat about.txt');
    line(DESC, null, true);
    await sleep(500);
    line('');
    line("# type 'help' and press enter to look around", 'dim', true);
  }

  /* ------------------------------------------------------------ shell */

  const history = [];
  let histPos = 0;

  const COMMANDS = {
    help: () => [
      'available commands:',
      '  help            this list',
      '  whoami          who is this',
      '  about           what I do',
      '  ls              list files',
      '  cat <file>      print a file',
      '  date            current date',
      '  echo <text>     say something',
      '  history         previous commands',
      '  clear           clear the screen',
    ],
    whoami: () => ['tadas kacinskas'],
    about: () => [DESC],
    ls: (args) => (args.some((a) => /^-\w*a/.test(a))
      ? ['.  ..  .secrets  about.txt']
      : ['about.txt']),
    cat: (args) => {
      if (!args.length) return [{ err: 'cat: missing file operand' }];
      return args.map((f) => {
        if (f in FILES) return FILES[f];
        if (f === '.secrets') {
          return `cat: .secrets: Permission denied (nice try). But real secret is - ... ${pick(SECRETS)}`;
        }
        return { err: `cat: ${f}: No such file or directory` };
      });
    },
    date: () => [new Date().toString()],
    echo: (args) => [args.join(' ')],
    pwd: () => ['/home/tadas'],
    uname: () => ['Linux kacinskas 6.12.0 #1 SMP PREEMPT_DYNAMIC x86_64 GNU/Linux'],
    history: () => history.map((c, i) => `${String(i + 1).padStart(4)}  ${c}`),
    clear: () => { out.textContent = ''; return []; },
    sudo: () => [{ dim: '[sudo] password for visitor: ********' }, { err: pick(SUDO_JOKES) }],
    rm: () => [{ err: 'rm: permission denied. good try though.' }],
    exit: () => ['there is no escape. try `clear` instead.'],
    hi: () => ['hi there 👋'],
    hello: () => ['hello, world'],
  };

  function run(raw) {
    const cmdLine = line(null);
    cmdLine.append(prompt(), raw);

    const text = raw.trim();
    if (!text) return;
    history.push(text);
    histPos = history.length;

    const [name, ...args] = text.split(/\s+/);
    const fn = Object.prototype.hasOwnProperty.call(COMMANDS, name) ? COMMANDS[name] : null;
    const result = fn
      ? fn(args)
      : [{ err: `${name}: command not found` }, { dim: "type 'help' for a list of commands" }];

    for (const r of result) {
      if (typeof r === 'string') line(r);
      else if (r.err) line(r.err, 'err');
      else if (r.dim) line(r.dim, 'dim');
    }
  }

  function render() {
    const v = input.value;
    const pos = input.selectionStart ?? v.length;
    buf.textContent = '';
    buf.append(v.slice(0, pos), span('cursor', v[pos] || ' '), v.slice(pos + 1));
  }

  function complete() {
    const v = input.value;
    const parts = v.split(/\s+/);
    let pool;
    if (parts.length === 1) pool = Object.keys(COMMANDS);
    else if (parts[0] === 'cat') pool = Object.keys(FILES);
    else return;
    const last = parts[parts.length - 1];
    const hits = pool.filter((p) => p.startsWith(last));
    if (hits.length === 1) {
      parts[parts.length - 1] = hits[0];
      input.value = parts.join(' ') + ' ';
    } else if (hits.length > 1) {
      line(null).append(prompt(), v);
      line(hits.join('  '));
    }
  }

  function onKey(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      run(input.value);
      input.value = '';
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (histPos > 0) input.value = history[--histPos];
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      histPos = Math.min(history.length, histPos + 1);
      input.value = history[histPos] || '';
    } else if (e.key === 'Tab') {
      e.preventDefault();
      complete();
    } else if (e.ctrlKey && e.key.toLowerCase() === 'l') {
      e.preventDefault();
      out.textContent = '';
    } else if (e.ctrlKey && e.key.toLowerCase() === 'c' && input.selectionStart === input.selectionEnd) {
      e.preventDefault();
      line(null).append(prompt(), input.value + '^C');
      input.value = '';
    } else {
      return;
    }
    render();
    scrollDown();
  }

  function startShell() {
    live.hidden = false;
    render();
    input.addEventListener('input', render);
    input.addEventListener('keydown', onKey);
    input.addEventListener('keyup', render);
    input.addEventListener('select', render);
    input.addEventListener('focus', () => term.classList.add('focused'));
    input.addEventListener('blur', () => term.classList.remove('focused'));

    // Click anywhere (that isn't a text selection) to focus the prompt.
    document.addEventListener('click', () => {
      if (!window.getSelection().isCollapsed) return;
      input.focus({ preventScroll: true });
    });
    // Start typing anywhere on desktop.
    document.addEventListener('keydown', (e) => {
      if (document.activeElement !== input && !e.ctrlKey && !e.metaKey && !e.altKey) {
        input.focus({ preventScroll: true });
      }
    });

    if (finePointer) input.focus({ preventScroll: true });
  }

  /* ------------------------------------------------------------ name toy */

  const toys = [];

  function makeToy(pre) {
    const text = pre.textContent;
    pre.textContent = '';
    const parts = [];
    for (const ch of text) {
      if (ch === ' ' || ch === '\n') { pre.append(ch); continue; }
      const el = span(null, ch);
      pre.append(el);
      parts.push({ el, hx: 0, hy: 0, x: 0, y: 0, vx: 0, vy: 0 });
    }

    let measured = false;
    let charW = 9;
    let rect = null;

    function visible() { return pre.offsetParent !== null; }

    function measure() {
      rect = pre.getBoundingClientRect();
      for (const p of parts) {
        const r = p.el.getBoundingClientRect();
        p.hx = r.left - rect.left - p.x + r.width / 2;
        p.hy = r.top - rect.top - p.y + r.height / 2;
      }
      if (parts[0]) charW = parts[0].el.getBoundingClientRect().width || charW;
      measured = true;
    }

    function step(ptr) {
      if (!visible()) return false;
      if (!measured) measure();
      rect = pre.getBoundingClientRect();

      const R = charW * 6;
      const R2 = R * R;
      const px = ptr.x - rect.left;
      const py = ptr.y - rect.top;
      const push = charW * (0.25 + Math.min(ptr.speed, 40) / 40);
      let moving = false;

      for (const p of parts) {
        if (ptr.active) {
          const dx = p.hx + p.x - px;
          const dy = p.hy + p.y - py;
          const d2 = dx * dx + dy * dy;
          if (d2 < R2 && d2 > 0.01) {
            const d = Math.sqrt(d2);
            const f = (1 - d / R) * push * 0.12;
            p.vx += (dx / d) * f;
            p.vy += (dy / d) * f;
          }
        }
        p.vx = (p.vx - p.x * 0.055) * 0.86;
        p.vy = (p.vy - p.y * 0.055) * 0.86;
        p.x += p.vx;
        p.y += p.vy;

        if (Math.abs(p.x) + Math.abs(p.y) + Math.abs(p.vx) + Math.abs(p.vy) < 0.08) {
          if (p.x || p.y) { p.x = p.y = p.vx = p.vy = 0; p.el.style.transform = ''; }
        } else {
          moving = true;
          p.el.style.transform = `translate(${p.x.toFixed(2)}px, ${p.y.toFixed(2)}px) rotate(${(p.vx * 4).toFixed(1)}deg)`;
        }
      }
      return moving;
    }

    return { step, invalidate: () => { measured = false; } };
  }

  const ptr = { x: -1e4, y: -1e4, speed: 0, active: false };
  let running = false;

  function loop() {
    let moving = false;
    for (const t of toys) moving = t.step(ptr) || moving;
    ptr.speed *= 0.8;
    if (moving || (ptr.active && ptr.speed > 0.5)) requestAnimationFrame(loop);
    else running = false;
  }

  function kick() {
    if (!running) { running = true; requestAnimationFrame(loop); }
  }

  function initToys() {
    if (reduceMotion) return;
    document.querySelectorAll('.banner').forEach((pre) => toys.push(makeToy(pre)));

    window.addEventListener('pointermove', (e) => {
      if (ptr.active) ptr.speed = Math.max(ptr.speed, Math.hypot(e.clientX - ptr.x, e.clientY - ptr.y));
      ptr.x = e.clientX;
      ptr.y = e.clientY;
      ptr.active = true;
      kick();
    }, { passive: true });

    const release = () => { ptr.active = false; ptr.speed = 0; kick(); };
    document.addEventListener('pointerleave', release);
    window.addEventListener('blur', release);
    window.addEventListener('pointerup', (e) => { if (e.pointerType !== 'mouse') release(); });
    window.addEventListener('pointercancel', release);

    let t;
    const invalidate = () => { clearTimeout(t); t = setTimeout(() => toys.forEach((x) => x.invalidate()), 120); };
    window.addEventListener('resize', invalidate);
    if (document.fonts) document.fonts.ready.then(invalidate);
  }

  /* ------------------------------------------------------------ boot */

  initToys();

  const onSkip = () => skip();
  window.addEventListener('keydown', onSkip);
  window.addEventListener('pointerdown', onSkip);

  intro().then(() => {
    window.removeEventListener('keydown', onSkip);
    window.removeEventListener('pointerdown', onSkip);
    startShell();
    scrollDown();
  });
})();
