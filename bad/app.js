(function () {
  'use strict';

  // ---------- tiny css-in-js ----------
  var SEED = Math.random().toString(36).slice(2, 6);
  var k = 0;
  function gen() { return '_' + SEED + (k++).toString(36); }
  var RC = {};
  var staticRules = [];
  var textRules = {};
  var bgRules = {};
  var sheet = document.createElement('style');
  document.head.appendChild(sheet);
  var pending = false;
  function q(s) { return '"' + String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"'; }
  function flush() {
    pending = false;
    var out = staticRules.join('\n');
    for (var c in textRules) out += '\n.' + c + '::before{content:' + q(textRules[c]) + '}';
    for (var b in bgRules) out += '\n.' + b + '{' + bgRules[b] + '}';
    sheet.textContent = out;
  }
  function sched() { if (!pending) { pending = true; Promise.resolve().then(flush); } }
  function role(name, css) { var c = gen(); RC[name] = c; staticRules.push(css.replace(/&/g, '.' + c)); }
  function rule(css) { staticRules.push(css); sched(); }

  function h(parent, roles, text) {
    var e = document.createElement('div');
    var u = gen();
    e._u = u;
    var list = [u];
    (roles || '').split(' ').forEach(function (r) { if (r) list.push(RC[r]); });
    e.className = list.join(' ');
    if (text != null) setT(e, text);
    if (parent) parent.appendChild(e);
    return e;
  }
  function setT(e, t) { textRules[e._u] = t; sched(); }
  function setBg(e, svgStr, w, hh) {
    bgRules[e._u] = 'background-image:url("data:image/svg+xml,' + encodeURIComponent(svgStr) + '");background-repeat:no-repeat;width:' + w + 'px;height:' + hh + 'px';
    sched();
  }
  function local(e, ev) { var r = e.getBoundingClientRect(); return { x: ev.clientX - r.left, y: ev.clientY - r.top }; }
  var FF = 'font-family="system-ui,-apple-system,Segoe UI,Roboto,sans-serif"';
  function svgDoc(w, hh, body) { return '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + hh + '" ' + FF + '>' + body + '</svg>'; }
  function tx(x, y, t, size, fill, extra) { return '<text x="' + x + '" y="' + y + '" font-size="' + size + '" fill="' + fill + '" ' + (extra || '') + '>' + t + '</text>'; }
  function on(e, r, yes) { e.classList.toggle(RC[r], !!yes); }
  function place(e, css) { rule('.' + e._u + '{' + css + '}'); }
  function lab(e, r, l) { e.setAttribute('role', r); e.setAttribute('aria-label', l); return e; }
  function svg(parent, path, size) {
    var w = document.createElement('span');
    w.innerHTML = '<svg width="' + (size || 18) + '" height="' + (size || 18) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' + path + '</svg>';
    var s = w.firstChild; parent.appendChild(s); return s;
  }
  function rnd(n) { return Math.floor(Math.random() * n); }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  // tap: only fires for a real pointerdown+pointerup pair on the element
  function tap(e, fn) {
    var armed = false;
    e.addEventListener('pointerdown', function (ev) { armed = true; ev.preventDefault(); });
    e.addEventListener('pointerleave', function () { armed = false; });
    e.addEventListener('pointerup', function (ev) { if (armed) { armed = false; fn(ev); } });
  }

  // ---------- styles ----------
  role('app', '&{max-width:760px;margin:0 auto;padding:24px 16px 80px}');
  role('top', '&{display:flex;align-items:center;gap:10px;margin-bottom:18px}');
  role('logo', '&{width:38px;height:38px;border-radius:10px;background:linear-gradient(135deg,#e2342b,#ff8a3d);display:flex;align-items:center;justify-content:center;color:#fff}');
  role('brand', '&::before{font-weight:800;font-size:22px;letter-spacing:-.5px}');
  role('tag', '&::before{color:#6b7488;font-size:13px}&{margin-left:auto}');
  role('steps', '&{display:flex;gap:6px;margin-bottom:16px}');
  role('dot', '&{flex:1;height:6px;border-radius:3px;background:#d5dbe5}');
  role('dotOn', '&{background:#e2342b}');
  role('card', '&{position:relative;background:#fff;border-radius:16px;box-shadow:0 2px 14px rgba(20,30,60,.08);padding:22px 22px 70px;display:none}');
  role('show', '&{display:block}');
  role('h2', '&::before{font-size:20px;font-weight:700}&{margin:0 0 14px 34px}');
  role('lbl', '&::before{font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:#6b7488;font-weight:600}&{margin:14px 0 6px}');
  role('row', '&{display:flex;gap:12px;align-items:flex-start;flex-wrap:wrap}');
  role('col', '&{flex:1;min-width:200px}');
  role('next', '&{position:absolute;right:18px;bottom:16px;width:52px;height:52px;border-radius:50%;background:#e2342b;color:#fff;display:flex;align-items:center;justify-content:center;opacity:0;pointer-events:none;transition:opacity .15s;cursor:pointer;box-shadow:0 4px 12px rgba(226,52,43,.35)}');
  rule('.' + RC.card + ':hover .' + RC.next + '{opacity:1;pointer-events:auto}');
  role('back', '&{position:absolute;left:14px;top:20px;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#6b7488;cursor:pointer}&:hover{background:#f0f2f6}');
  role('hint', '&::before{font-size:12px;color:#9aa3b5}&{position:absolute;right:82px;bottom:32px}');
  // dropdown
  role('dd', '&{position:relative}');
  role('ddBox', '&{border:1.5px solid #cfd6e2;border-radius:10px;padding:12px 14px;min-height:20px;cursor:pointer;background:#fff;display:flex;align-items:center;justify-content:space-between}&:hover{border-color:#9aa6bd}');
  role('ddTxt', '&::before{font-size:15px}');
  role('ph', '&::before{color:#9aa3b5}');
  role('ddList', '&{position:absolute;left:0;right:0;top:calc(100% + 4px);background:#fff;border-radius:10px;box-shadow:0 10px 30px rgba(20,30,60,.18);z-index:20;display:none;flex-direction:column;max-height:380px;overflow:auto;padding:4px 0}');
  role('open', '&{display:flex}');
  role('pic', '&{position:relative;cursor:pointer;flex:none}');
  role('hl', '&{position:absolute;left:0;right:0;height:38px;background:rgba(226,52,43,.08);pointer-events:none;display:none}');
  role('banner', '&{border-radius:14px;margin-bottom:12px;background:linear-gradient(120deg,#fff1ef,#ffe1c9);display:flex;align-items:center;padding:0 20px;overflow:hidden;box-sizing:border-box}&::before{font-weight:700;color:#b5241d;font-size:15px}');
  role('dir', '&::before{font-size:12px;color:#6b7488;font-weight:600}&{text-align:center;margin-bottom:8px}');
  role('hold', '&{margin:-6px 0 12px;min-height:18px}&::before{font-size:13px;color:#6b7488}');
  role('holdLow', '&::before{color:#c92a22 !important;font-weight:700}');
  role('opt', '&{padding:10px 14px;cursor:pointer}&::before{font-size:14px}&:hover{background:#fff1ef}');
  // trip toggle
  role('seg', '&{display:inline-flex;border:1.5px solid #cfd6e2;border-radius:10px;overflow:hidden}');
  role('segI', '&{padding:9px 16px;cursor:pointer;color:#6b7488;display:flex}&:hover{background:#f5f6f9}');
  role('segOn', '&{background:#1d2433 !important;color:#fff}');
  role('segCap', '&::before{font-size:13px;color:#6b7488}&{display:inline-block;margin-left:10px;vertical-align:middle}');
  // calendar
  role('cal', '&{border:1.5px solid #e1e6ee;border-radius:12px;padding:12px;max-width:330px}');
  role('calHead', '&{display:flex;align-items:center;margin-bottom:8px}');
  role('calM', '&::before{font-weight:700}&{flex:1;text-align:center;order:2}');
  role('calNav', '&{width:30px;height:30px;border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#1d2433}&:hover{background:#f0f2f6}');
  role('calGrid', '&{display:grid;grid-template-columns:repeat(7,1fr);gap:2px;counter-reset:d}');
  role('wd', '&::before{font-size:11px;color:#9aa3b5;font-weight:600}&{text-align:center;padding:4px 0}');
  role('day', '&{counter-increment:d;text-align:center;padding:8px 0;border-radius:8px;cursor:pointer;font-size:14px}&::before{content:counter(d)}&:hover{background:#fff1ef}');
  role('dayOff', '&{color:#c4cad6;cursor:default}&:hover{background:none}');
  role('daySel', '&{background:#e2342b !important;color:#fff}');
  role('blank', '&{}');
  role('chosen', '&::before{font-size:13px;color:#1d2433;font-weight:600}&{margin-top:8px}');
  // departures
  role('deps', '&{display:flex;flex-direction:column;gap:8px}');
  role('dep', '&{display:grid;grid-template-columns:80px 1fr 90px 80px;align-items:center;border:1.5px solid #e1e6ee;border-radius:12px;padding:12px 14px;cursor:pointer}&:hover{border-color:#9aa6bd}');
  role('depSel', '&{border-color:#e2342b !important;background:#fff6f5}');
  role('depT', '&::before{font-size:18px;font-weight:700}');
  role('depN', '&::before{font-size:13px;color:#6b7488}');
  role('depD', '&::before{font-size:13px;color:#6b7488}');
  role('depP', '&::before{font-weight:700}&{text-align:right}');
  // passengers
  role('pax', '&{display:flex;flex-direction:column;gap:6px;max-width:360px}');
  role('paxR', '&{display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f0f2f6}');
  role('paxL', '&::before{font-size:15px}');
  role('paxS', '&::before{font-size:12px;color:#9aa3b5;display:block}');
  role('stp', '&{display:flex;align-items:center;gap:10px}');
  role('stpB', '&{width:30px;height:30px;border-radius:50%;border:1.5px solid #cfd6e2;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#1d2433}&:hover{border-color:#e2342b;color:#e2342b}');
  role('stpN', '&::before{font-weight:700;font-size:16px}&{min-width:16px;text-align:center;order:2}');
  role('o1', '&{order:1}');
  role('o3', '&{order:3}');
  // seats
  role('cars', '&{display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap}');
  role('car', '&{display:flex;align-items:center;gap:6px;padding:8px 12px;border-radius:10px;border:1.5px solid #cfd6e2;cursor:pointer;color:#6b7488}&::after{content:attr(data-n);font-weight:700;color:#1d2433}&:hover{border-color:#9aa6bd}');
  role('carSel', '&{border-color:#1d2433;background:#1d2433;color:#fff}&::after{color:#fff !important}');
  role('train', '&{border:2px solid #d5dbe5;border-radius:20px;padding:16px 18px 14px;max-width:440px;background:#fafbfd}');
  role('seats', '&{display:grid;grid-template-columns:1fr 1fr 22px 1fr 1fr;gap:6px}');
  role('seat', '&{height:34px;border-radius:7px 7px 4px 4px;background:#c9efcf;border:1.5px solid #8fd39a;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:11px;color:#3b4a6b}&:hover{background:#b2e6bb}');
  role('win', '&{box-shadow:inset 0 3px 0 #6a8fe0}');
  role('taken', '&{background:#f6c4c0;border-color:#eda39d;color:#3b4a6b;cursor:not-allowed}&:hover{background:#f6c4c0}');
  role('seatSel', '&{background:#2457d6 !important;border-color:#173f9e !important;color:#fff !important}');
  role('legend', '&{display:flex;gap:14px;margin-top:10px;font-size:12px;color:#6b7488}');
  role('lg', '&::before{font-size:12px}&{display:flex;align-items:center;gap:6px}');
  role('sw', '&{width:14px;height:14px;border-radius:3px}');
  // extras
  role('xw', '&{position:relative;display:inline-block}');
  role('xBtn', '&{display:inline-flex;align-items:center;gap:8px;padding:11px 16px;border-radius:10px;border:1.5px dashed #9aa6bd;color:#1d2433}&::after{content:"";}');
  role('xTxt', '&::before{font-weight:600}');
  role('xMenu', '&{position:absolute;top:100%;left:0;min-width:260px;background:#fff;border-radius:12px;box-shadow:0 10px 30px rgba(20,30,60,.18);z-index:30;display:none;flex-direction:column;padding:6px 0}');
  role('xItem', '&{display:flex;align-items:center;gap:10px;padding:10px 14px;cursor:pointer}&:hover{background:#fff1ef}');
  role('box', '&{width:18px;height:18px;border-radius:5px;border:1.5px solid #9aa6bd;display:flex;align-items:center;justify-content:center;color:transparent}');
  role('boxOn', '&{background:#e2342b;border-color:#e2342b;color:#fff}');
  role('xL', '&::before{font-size:14px}&{flex:1}');
  role('xP', '&::before{font-size:13px;color:#6b7488}');
  role('chips', '&{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}');
  role('chip', '&::before{font-size:12px;font-weight:600}&{padding:5px 10px;border-radius:20px;background:#fff1ef;color:#b5241d}');
  role('ce', '&{border:1.5px solid #cfd6e2;border-radius:10px;padding:12px 14px;min-height:20px;font-size:15px;cursor:text;max-width:360px;-webkit-user-select:text;user-select:text}&:empty::before{content:"Full name as on ID";color:#9aa3b5}');
  // review
  role('rv', '&{display:grid;grid-template-columns:140px 1fr;gap:8px 14px}');
  role('rk', '&::before{font-size:13px;color:#6b7488}');
  role('rvv', '&::before{font-size:14px;font-weight:600}');
  role('pay', '&{display:inline-flex;align-items:center;gap:10px;margin-top:22px;padding:14px 26px;border-radius:12px;background:#1d2433;color:#fff;cursor:pointer}&::before{font-weight:700;font-size:16px}&:hover{background:#2c3650}');
  // confirmation
  role('ok', '&{width:58px;height:58px;border-radius:50%;background:#18a058;color:#fff;display:flex;align-items:center;justify-content:center;margin:6px auto 12px}');
  role('okT', '&::before{font-size:22px;font-weight:800}&{text-align:center}');
  role('okS', '&::before{font-size:14px;color:#6b7488}&{text-align:center;margin-top:6px}');
  role('code', '&{display:flex;justify-content:center;gap:4px;margin:22px 0 6px;font-family:ui-monospace,Menlo,monospace}');
  role('ch', '&{width:30px;height:42px;border-radius:7px;background:#f0f2f6;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:700}&::before{content:"\\2022"}');
  role('dash', '&{background:none;width:14px}');
  role('scr', '&{}');
  rule('.' + RC.code + ':hover .' + RC.ch + '::before{content:attr(data-g)}');
  rule('.' + RC.code + '.' + RC.scr + ' .' + RC.ch + '::before{content:attr(data-s)}');
  rule('.' + RC.code + ' .' + RC.ch + '.' + RC.dash + '::before{content:"-"}');
  role('reveal', '&::before{font-size:12px;color:#b3b9c4}&{text-align:center}');
  // cookie
  role('ov', '&{position:fixed;inset:0;background:rgba(15,20,35,.55);z-index:100;display:flex;align-items:flex-end;justify-content:center}');
  role('ck', '&{background:#fff;max-width:720px;width:100%;border-radius:16px 16px 0 0;padding:22px 24px;display:flex;flex-direction:column;gap:12px}');
  role('ckT', '&::before{font-weight:700;font-size:17px}');
  role('ckP', '&::before{font-size:13px;color:#4a5368;line-height:1.5}');
  role('ckB', '&{display:flex;gap:10px;justify-content:flex-end}');
  role('btn', '&{padding:11px 18px;border-radius:10px;cursor:pointer}&::before{font-weight:600;font-size:14px}');
  role('btnP', '&{background:#e2342b;color:#fff}&:hover{background:#c92a22}');
  role('btnS', '&{background:#f0f2f6;color:#1d2433}&:hover{background:#e3e7ee}');
  role('o2', '&{order:2}');
  role('o0', '&{order:0}');

  var I = {
    next: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    back: '<path d="M15 6l-6 6 6 6"/>',
    left: '<path d="M15 6l-6 6 6 6"/>',
    right: '<path d="M9 6l6 6-6 6"/>',
    one: '<path d="M4 12h15M14 7l5 5-5 5"/>',
    ret: '<path d="M4 9h15M15 5l4 4-4 4M20 15H5M9 11l-4 4 4 4"/>',
    plus: '<path d="M12 6v12M6 12h12"/>',
    minus: '<path d="M6 12h12"/>',
    chev: '<path d="M6 9l6 6 6-6"/>',
    check: '<path d="M5 12l5 5 9-10"/>',
    train: '<rect x="5" y="3" width="14" height="14" rx="3"/><path d="M5 11h14M9 21l1-4M15 21l-1-4"/>',
    car: '<rect x="3" y="6" width="18" height="11" rx="2"/><path d="M3 12h18"/>'
  };

  // ---------- data ----------
  var ST = [
    ['WAW', 'Warszawa Centralna'], ['WWS', 'Warszawa Wschodnia'], ['KRK', 'Kraków Główny'], ['KRP', 'Kraków Płaszów'],
    ['KTW', 'Katowice'], ['GDA', 'Gdańsk Główny'], ['POZ', 'Poznań Główny'], ['WRO', 'Wrocław Główny'], ['LDZ', 'Łódź Fabryczna']
  ];
  var DEPS = [
    ['06:05', 'TLK 31104 Karpaty', '3h 12m', 79], ['07:42', 'IC 3510 Mehoffer', '2h 41m', 119], ['09:10', 'EIP 1305 Krakus', '2h 18m', 169],
    ['09:01', 'TLK 15102 Ondraszek', '3h 05m', 74], ['11:30', 'EIC 1501 Wawel', '2h 29m', 149], ['14:55', 'IC 3506 Matejko', '2h 44m', 119], ['17:20', 'EIP 1311 Smok', '2h 17m', 169]
  ];
  var PAX = [['A', 'Adult', '26–59 years', 1], ['SE', 'Senior', '60+ years', 0.7], ['ST', 'Student', 'with valid student ID', 0.49], ['CH', 'Child', '4–15 years', 0.63]];
  var EXTRAS = [['BIKE', 'Bicycle', '+ 9 zł'], ['MEAL', 'Meal voucher', '+ 32 zł'], ['LUG', 'Extra luggage', '+ 15 zł'], ['INS', 'Travel insurance', '+ 12 zł']];
  var TODAY = new Date(2026, 9, 8);
  var real = new Date(); if (real > TODAY) TODAY = new Date(real.getFullYear(), real.getMonth(), real.getDate());

  var S = {
    step: 1, trip: 'R', from: null, to: null, date: null, time: null,
    pax: { A: 1, SE: 0, ST: 0, CH: 0 }, car: 1, seats: [], extras: { INS: true }, name: ''
  };

  // ---------- code ----------
  function fnv(str, seed) {
    var hsh = seed >>> 0;
    for (var i = 0; i < str.length; i++) { hsh ^= str.charCodeAt(i); hsh = Math.imul(hsh, 16777619) >>> 0; }
    return hsh >>> 0;
  }
  var AL = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  function enc(n) { var s = ''; for (var i = 0; i < 4; i++) { s += AL[n % 32]; n = Math.floor(n / 32); } return s; }
  function canon(st) {
    var ex = Object.keys(st.extras).filter(function (x) { return st.extras[x]; }).sort().join(',');
    var seats = st.seats.slice().map(Number).sort(function (a, b) { return a - b; }).join(',');
    var nm = String(st.name || '').trim().replace(/\s+/g, ' ').toLowerCase();
    return [st.trip, st.from, st.to, st.date, st.time, 'A' + st.pax.A + 'SE' + st.pax.SE + 'ST' + st.pax.ST + 'CH' + st.pax.CH,
      'C' + st.car, seats, ex, nm].join('|');
  }
  function code(st) { var c = canon(st); return 'RG-' + enc(fnv(c, 2166136261)) + '-' + enc(fnv(c, 0x9e3779b9)); }
  window.__rg = { canon: canon, code: code };

  // ---------- layout ----------
  var root = document.getElementById('root');
  var app = h(root, 'app');
  var top = h(app, 'top');
  h(top, 'tag', 'Fast. Simple. Booked.');
  var dots = h(app, 'steps'); var dotEls = [];
  for (var di = 0; di < 5; di++) dotEls.push(h(dots, 'dot'));
  var holdEl = h(app, 'hold', '');
  var banner = h(app, 'banner', '');
  var BANNERS = ['Autumn sale: -20% on weekend trips', 'New: Wi-Fi on all EIP trains', 'Travel greener - take the train', 'Kids under 4 travel free', 'Earn RailGo points on every trip', ''];
  // promo slot: picked once per page load (like an ad slot), stable for the whole session
  banner.style.height = (24 + rnd(150)) + 'px'; setT(banner, BANNERS[rnd(BANNERS.length)]);
  var HOLD = 90000, holdEnd = 0, holdT = null;
  function tickHold() {
    var left = Math.max(0, holdEnd - Date.now()), sec = Math.ceil(left / 1000);
    setT(holdEl, 'Fares and seats held for ' + Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0'));
    on(holdEl, 'holdLow', sec <= 20);
    if (left <= 0) {
      clearInterval(holdT);
      try { sessionStorage.setItem('rg-exp', '1'); } catch (e) {}
      location.reload();
    }
  }
  function startHold() { holdEnd = Date.now() + HOLD; clearInterval(holdT); holdT = setInterval(tickHold, 250); tickHold(); }
  try {
    if (sessionStorage.getItem('rg-exp')) {
      sessionStorage.removeItem('rg-exp');
      setT(holdEl, 'Your session expired and your selection was released. Please start again.'); on(holdEl, 'holdLow', true);
    }
  } catch (e) {}

  var cards = {};
  function card(n, title) {
    var c = h(app, 'card');
    var b = h(c, 'back'); svg(b, I.back, 18); lab(b, 'button', 'Next');
    tap(b, function () { if (S.step > 1) go(S.step - 1); });
    h(c, 'h2', title);
    cards[n] = c;
    return c;
  }
  var nextEls = {};
  function nextBtn(c, n, ok, hintTxt) {
    var nx = h(c, 'next'); svg(nx, I.next, 22); lab(nx, 'button', 'Close');
    nextEls[n] = nx;
    var hint = h(c, 'hint', '');
    tap(nx, function () {
      if (ok()) { setT(hint, ''); go(n + 1); }
      else { setT(hint, hintTxt); }
    });
  }
  function go(n) {
    S.step = n;
    for (var key in cards) on(cards[key], 'show', +key === n);
    dotEls.forEach(function (d, i) { on(d, 'dotOn', i < n); });
    banner.style.display = n === 6 ? 'none' : '';
    if (n === 3) renderSeats();
    if (n === 5) renderReview();
    if (n === 6) { clearInterval(holdT); setT(holdEl, ''); }
    window.scrollTo(0, 0);
  }

  // ===== STEP 1 : journey =====
  var c1 = card(1, 'Where are you going?');
  var segWrap = h(c1, null);
  h(segWrap, 'lbl', 'Trip');
  var seg = h(segWrap, 'seg');
  var segOne = h(seg, 'segI o2'); svg(segOne, I.one, 20);
  var segRet = h(seg, 'segI o0'); svg(segRet, I.ret, 20);
  rule('.' + seg._u + '{display:inline-flex}');
  lab(segOne, 'button', 'Return'); lab(segRet, 'button', 'One-way');
  var segCap = h(segWrap, 'segCap', '');
  function renderTrip() { on(segOne, 'segOn', S.trip === 'O'); on(segRet, 'segOn', S.trip === 'R'); setT(segCap, S.trip === 'O' ? 'One-way' : 'Return (open return ticket)'); }
  tap(segOne, function () { S.trip = 'O'; renderTrip(); });
  tap(segRet, function () { S.trip = 'R'; renderTrip(); });
  renderTrip();

  var r1 = h(c1, 'row');
  function dropdown(parent, label, ph, key) {
    var col = h(parent, 'col');
    h(col, 'lbl', label);
    var dd = h(col, 'dd');
    var box = h(dd, 'ddBox');
    var txt = h(box, 'ddTxt ph', ph);
    svg(box, I.chev, 16);
    var list = h(dd, 'ddList');
    var sorted = ST.slice().sort(function (a, b) { return a[1].localeCompare(b[1], 'pl'); });
    var pic = h(list, 'pic'); var hl = h(list, 'hl');
    function drawList() { setBg(pic, svgDoc(360, sorted.length * 38, sorted.map(function (s, i) { return tx(14, i * 38 + 24, s[1], 14, '#1d2433'); }).join('')), 360, sorted.length * 38); flush(); }
    drawList();
    pic.addEventListener('mousemove', function (ev) {
      var i = Math.floor(local(pic, ev).y / 38);
      if (i >= 0 && i < sorted.length) { hl.style.top = (4 + i * 38) + 'px'; hl.style.display = 'block'; }
    });
    pic.addEventListener('mouseleave', function () { hl.style.display = ''; });
    pic.addEventListener('mousedown', function (ev) {
      ev.preventDefault(); ev.stopPropagation();
      var i = Math.floor(local(pic, ev).y / 38); var s = sorted[i]; if (!s) return;
      S[key] = s[0]; setT(txt, s[1]); on(txt, 'ph', false); on(list, 'open', false); hl.style.display = '';
    });
    tap(box, function () {
      var willOpen = !list.classList.contains(RC.open);
      if (willOpen) drawList();
      document.querySelectorAll('.' + RC.ddList).forEach(function (l) { on(l, 'open', false); });
      on(list, 'open', willOpen);
    });
    return list;
  }
  dropdown(r1, 'From', 'Departure station', 'from');
  dropdown(r1, 'To', 'Arrival station', 'to');
  document.addEventListener('pointerdown', function (ev) {
    if (!ev.target.closest || !ev.target.closest('.' + RC.dd)) document.querySelectorAll('.' + RC.ddList).forEach(function (l) { on(l, 'open', false); });
  });

  h(c1, 'lbl', 'Date of travel');
  var cal = h(c1, 'cal');
  var calHead = h(cal, 'calHead');
  var nNext = lab(h(calHead, 'calNav o3'), 'button', 'Previous month'); svg(nNext, I.right, 18);
  var calM = h(calHead, 'calM', '');
  var nPrev = lab(h(calHead, 'calNav o1'), 'button', 'Next month'); svg(nPrev, I.left, 18);
  var calImg = h(cal, 'pic');
  var CW = 44, CHH = 38, CTOP = 26, calLead = 0, calDim = 0;
  var chosen = h(c1, 'chosen', '');
  var view = { y: TODAY.getFullYear(), m: TODAY.getMonth() };
  if (view.m > 11) { view.m -= 12; view.y++; }
  var MN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var MS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  function iso(y, m, d) { return y + '-' + String(m + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0'); }
  var calMax = new Date(TODAY.getTime()); calMax.setDate(calMax.getDate() + 120);
  function dayOff(dt) { return dt < TODAY || dt > calMax; }
  function renderCal() {
    setT(calM, MN[view.m] + ' ' + view.y);
    calLead = (new Date(view.y, view.m, 1).getDay() + 6) % 7;
    calDim = new Date(view.y, view.m + 1, 0).getDate();
    var rows = Math.ceil((calLead + calDim) / 7);
    var b = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(function (w, i) { return tx(i * CW + CW / 2, 14, w, 11, '#9aa3b5', 'font-weight="600" text-anchor="middle"'); }).join('');
    for (var d = 1; d <= calDim; d++) {
      var k2 = calLead + d - 1, x = (k2 % 7) * CW, y = CTOP + Math.floor(k2 / 7) * CHH;
      var dt = new Date(view.y, view.m, d), sel = S.date === iso(view.y, view.m, d);
      if (sel) b += '<rect x="' + (x + 2) + '" y="' + (y + 2) + '" width="' + (CW - 4) + '" height="' + (CHH - 4) + '" rx="8" fill="#e2342b"/>';
      b += tx(x + CW / 2, y + 24, d, 14, sel ? '#fff' : dayOff(dt) ? '#c4cad6' : '#1d2433', 'text-anchor="middle"');
    }
    setBg(calImg, svgDoc(7 * CW, CTOP + rows * CHH, b), 7 * CW, CTOP + rows * CHH);
  }
  tap(calImg, function (ev) {
    var p = local(calImg, ev);
    var d = Math.floor((p.y - CTOP) / CHH) * 7 + Math.floor(p.x / CW) - calLead + 1;
    if (p.y < CTOP || d < 1 || d > calDim) { S.date = null; setT(chosen, ''); renderCal(); return; }
    var dt = new Date(view.y, view.m, d); if (dayOff(dt)) return;
    S.date = iso(view.y, view.m, d); S.time = null;
    setT(chosen, 'Selected: ' + WD[dt.getDay()] + ', ' + d + ' ' + MS[view.m] + ' ' + view.y);
    renderCal(); renderDeps();
  });
  tap(nNext, function () { view.m++; if (view.m > 11) { view.m = 0; view.y++; } renderCal(); });
  tap(nPrev, function () {
    if (view.y === TODAY.getFullYear() && view.m === TODAY.getMonth()) return;
    view.m--; if (view.m < 0) { view.m = 11; view.y--; } renderCal();
  });
  renderCal();
  nextBtn(c1, 1, function () { return S.from && S.to && S.from !== S.to && S.date; }, 'Please complete your journey');

  // ===== STEP 2 : departure + passengers =====
  var c2 = card(2, 'Choose your train');
  h(c2, 'lbl', 'Departures');
  var depImg = h(c2, 'pic');
  var depSorted = DEPS.slice().sort(function (a, b) { return a[0].localeCompare(b[0]); });
  var DP = 64, DWID = 560, depOrder = depSorted;
  function renderDeps() {
    var b = depOrder.map(function (d, i) {
      var y = i * DP, sel = S.time === d[0];
      return '<rect x="1" y="' + (y + 1) + '" width="' + (DWID - 2) + '" height="54" rx="12" fill="' + (sel ? '#fff6f5' : '#fff') + '" stroke="' + (sel ? '#e2342b' : '#e1e6ee') + '" stroke-width="1.5"/>' +
        tx(16, y + 35, d[0], 18, '#1d2433', 'font-weight="700"') + tx(100, y + 33, d[1], 13, '#6b7488') +
        tx(340, y + 33, d[2], 13, '#6b7488') + tx(DWID - 16, y + 34, d[3] + ' zł', 15, '#1d2433', 'font-weight="700" text-anchor="end"');
    }).join('');
    setBg(depImg, svgDoc(DWID, depOrder.length * DP, b), DWID, depOrder.length * DP);
  }
  tap(depImg, function (ev) {
    var p = local(depImg, ev), i = Math.floor(p.y / DP);
    if (p.y % DP > 56 || !depOrder[i]) { S.time = null; renderDeps(); return; }
    S.time = depOrder[i][0]; renderDeps();
  });
  renderDeps();
  h(c2, 'lbl', 'Passengers');
  var paxBox = h(c2, 'pax');
  var paxN = {};
  var paxOrder = ['A', 'SE', 'ST', 'CH'], paxRows = [];
  [PAX[3], PAX[2], PAX[0], PAX[1]].forEach(function (p) {
    var r = h(paxBox, 'paxR');
    place(r, 'order:' + paxOrder.indexOf(p[0])); paxRows.push(r);
    var l = h(r, null); h(l, 'paxL', p[1]); h(l, 'paxS', p[2]);
    var s = h(r, 'stp');
    var plus = lab(h(s, 'stpB o3'), 'button', 'Add passenger'); svg(plus, I.plus, 14);
    var num = h(s, 'stpN', String(S.pax[p[0]]));
    var minus = lab(h(s, 'stpB o1'), 'button', 'Add passenger'); svg(minus, I.minus, 14);
    paxN[p[0]] = num;
    tap(plus, function () { var t = S.pax.A + S.pax.SE + S.pax.ST + S.pax.CH; if (t < 6) { S.pax[p[0]]++; S.seats = []; setT(num, String(S.pax[p[0]])); } });
    tap(minus, function () { if (S.pax[p[0]] > 0) { S.pax[p[0]]--; S.seats = []; setT(num, String(S.pax[p[0]])); } });
  });
  rule('.' + paxBox._u + '{display:flex}');
  function totalPax() { return S.pax.A + S.pax.SE + S.pax.ST + S.pax.CH; }
  nextBtn(c2, 2, function () { return S.time && totalPax() > 0 && (S.pax.A + S.pax.SE) > 0; }, 'Select a train and at least one adult or senior');

  // ===== STEP 3 : seats =====
  var c3 = card(3, 'Pick your seats');
  var cars = h(c3, 'cars');
  var carEls = [];
  for (var cn = 1; cn <= 5; cn++) {
    (function (cn) {
      var ce = h(cars, 'car'); svg(ce, I.car, 16); ce.setAttribute('data-n', String(cn)); lab(ce, 'tab', 'Carriage ' + (cn - 1));
      carEls.push(ce);
      tap(ce, function () { if (S.car !== cn) { S.car = cn; S.seats = []; renderSeats(); } });
    })(cn);
  }
  var seatInfo = h(c3, 'chosen', '');
  var train = h(c3, 'train');
  place(train, 'max-width:440px;padding:16px 20px 14px;box-sizing:border-box');
  var seatImg = h(train, 'pic');
  var SX = [0, 54, 130, 184], SW = 48, SH = 34, SP = 40;
  var dirEl = h(train, 'dir', ''); train.insertBefore(dirEl, seatImg);
  var legend = h(c3, 'legend');
  [['Window', 'win'], ['', 'taken'], ['', 'seatSel']].forEach(function (x) {
    var lg = h(legend, 'lg'); var sw = h(lg, 'sw seat ' + x[1]); lg.insertBefore(sw, lg.firstChild); setT(lg, x[0]);
    place(sw, 'height:14px;width:14px;cursor:default');
  });
  function isTaken(car, n) {
    if (car === 3 && (n === 21 || n === 22)) return false;
    if (car === 3 && (n === 17 || n === 18 || n === 25 || n === 26 || n === 23 || n === 24)) return true;
    return fnv(car + ':' + n, 7) % 3 === 0;
  }
  function renderSeats() {
    carEls.forEach(function (ce, i) { on(ce, 'carSel', i + 1 === S.car); });
    var b = '';
    for (var n = 1; n <= 48; n++) {
      var r = Math.floor((n - 1) / 4), c = (n - 1) % 4, x = SX[c], y = r * SP;
      var tk = isTaken(S.car, n), sel = S.seats.indexOf(n) >= 0;
      var fill = sel ? '#2457d6' : tk ? '#f6c4c0' : '#c9efcf', st = sel ? '#173f9e' : tk ? '#eda39d' : '#8fd39a';
      b += '<rect x="' + (x + 1) + '" y="' + (y + 1) + '" width="' + (SW - 2) + '" height="' + (SH - 2) + '" rx="6" fill="' + fill + '" stroke="' + st + '" stroke-width="1.5"/>';
      if (c === 0 || c === 3) b += '<rect x="' + (x + 3) + '" y="' + (y + 2) + '" width="' + (SW - 6) + '" height="3" rx="1.5" fill="#6a8fe0"/>';
      b += tx(x + SW / 2, y + 22, n, 11, sel ? '#fff' : '#3b4a6b', 'text-anchor="middle"');
    }
    setBg(seatImg, svgDoc(232, 12 * SP - 6, b), 232, 12 * SP - 6);
    setT(dirEl, '\u2191 Direction of travel');
    setT(seatInfo, 'Carriage ' + S.car + ' · ' + S.seats.length + ' of ' + totalPax() + ' seats selected');
  }
  tap(seatImg, function (ev) {
    var p = local(seatImg, ev), r = Math.floor(p.y / SP);
    var c = -1; SX.forEach(function (x, i) { if (p.x >= x && p.x <= x + SW) c = i; });
    if (r < 0 || r > 11 || p.y % SP > SH || c < 0) { S.seats = []; renderSeats(); return; }
    var n = r * 4 + c + 1; if (isTaken(S.car, n)) return;
    var i = S.seats.indexOf(n);
    if (i >= 0) S.seats.splice(i, 1);
    else { if (S.seats.length >= totalPax()) S.seats.shift(); S.seats.push(n); }
    renderSeats();
  });
  nextBtn(c3, 3, function () { return S.seats.length === totalPax(); }, 'Select a seat for every passenger');

  // ===== STEP 4 : extras + name =====
  var c4 = card(4, 'Extras & passenger details');
  h(c4, 'lbl', 'Add-ons');
  var xw = h(c4, 'xw');
  var xBtn = h(xw, 'xBtn'); h(xBtn, 'xTxt', 'Add extras'); svg(xBtn, I.chev, 16);
  var xMenu = h(xw, 'xMenu');
  var xEls = {};
  EXTRAS.forEach(function (x) {
    var it = lab(h(xMenu, 'xItem'), 'menuitemcheckbox', x[1]); it.setAttribute('aria-checked', 'false');
    var b = h(it, 'box'); svg(b, I.check, 13);
    h(it, 'xL', x[1]); h(it, 'xP', x[2]);
    xEls[x[0]] = b;
    it.addEventListener('mouseup', function () { S.extras[x[0]] = !S.extras[x[0]]; renderExtras(); });
  });
  var chips = h(c4, 'chips');
  function renderExtras() {
    chips.innerHTML = '';
    EXTRAS.forEach(function (x) {
      on(xEls[x[0]], 'boxOn', !!S.extras[x[0]]);
      if (S.extras[x[0]]) h(chips, 'chip', x[1] + ' added');
    });
  }
  renderExtras();
  var tClose = null, moves = [];
  xBtn.addEventListener('mousemove', function () {
    clearTimeout(tClose);
    var now = Date.now(); moves.push(now);
    moves = moves.filter(function (t) { return now - t < 900; });
    if (moves.length >= 5 && now - moves[0] >= 200 && xMenu.style.display !== 'flex') {
      xMenu.style.display = 'flex';
    }
  });
  xw.addEventListener('mouseleave', function () {
    moves = [];
    tClose = setTimeout(function () { xMenu.style.display = ''; }, 150);
  });

  h(c4, 'lbl', 'Lead passenger');
  var ce = h(c4, 'ce');
  ce.setAttribute('contenteditable', 'true');
  ce.setAttribute('spellcheck', 'false');
  ce.addEventListener('input', function () { S.name = ce.textContent; });
  ce.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') ev.preventDefault(); });
  nextBtn(c4, 4, function () { S.name = ce.textContent; return S.name.trim().length > 1; }, 'Enter the passenger name');

  // ===== STEP 5 : review =====
  var c5 = card(5, 'Review & pay');
  var rv = h(c5, 'rv');
  var rvRows = {};
  ['Trip', 'Route', 'Date', 'Train', 'Passengers', 'Seats', 'Extras', 'Name'].forEach(function (key) {
    h(rv, 'rk', key); rvRows[key] = h(rv, 'rvv', '');
  });
  var promo = document.createElement('input');
  promo.type = 'text'; promo.placeholder = 'Promo code'; promo.id = 'promo';
  promo.style.cssText = 'display:block;margin-top:18px;border:1.5px solid #e1e6ee;border-radius:10px;padding:10px 12px;font-size:14px;color:#c3c8d1;max-width:220px';
  c5.appendChild(promo);
  var pay = h(c5, 'pay', 'Pay');
  function stName(id) { for (var i = 0; i < ST.length; i++) if (ST[i][0] === id) return ST[i][1]; return id; }
  function price() {
    var d = DEPS.filter(function (x) { return x[0] === S.time; })[0]; var base = d ? d[3] : 0;
    var t = 0; PAX.forEach(function (p) { t += S.pax[p[0]] * base * p[3]; });
    if (S.trip === 'R') t *= 1.8;
    if (S.extras.BIKE) t += 9; if (S.extras.MEAL) t += 32 * totalPax(); if (S.extras.LUG) t += 15; if (S.extras.INS) t += 12 * totalPax();
    return t.toFixed(2).replace('.', ',');
  }
  function renderReview() {
    setT(rvRows.Trip, S.trip === 'O' ? 'One-way' : 'Return');
    setT(rvRows.Route, stName(S.from) + ' → ' + stName(S.to));
    var p = (S.date || '').split('-'); setT(rvRows.Date, p.length === 3 ? (+p[2]) + ' ' + MS[+p[1] - 1] + ' ' + p[0] : '');
    setT(rvRows.Train, S.time || '');
    setT(rvRows.Passengers, PAX.filter(function (x) { return S.pax[x[0]]; }).map(function (x) { return S.pax[x[0]] + ' × ' + x[1]; }).join(', '));
    setT(rvRows.Seats, 'Carriage ' + S.car + ', seats ' + S.seats.slice().sort(function (a, b) { return a - b; }).join(' & '));
    setT(rvRows.Extras, EXTRAS.filter(function (x) { return S.extras[x[0]]; }).map(function (x) { return x[1]; }).join(', ') || 'None');
    setT(rvRows.Name, S.name.trim());
    setT(pay, 'Pay ' + price() + ' zł');
  }
  tap(pay, function () { showCode(code(S)); });

  // ===== STEP 6 : confirmation =====
  var c6 = card(6, '');
  var okI = h(c6, 'ok'); svg(okI, I.check, 30);
  h(c6, 'okT', 'Booking confirmed');
  h(c6, 'okS', 'Show this code to the conductor. A copy has been emailed to you.');
  var codeBox = lab(h(c6, 'code'), 'img', 'Booking reference RG-0000-0000');
  h(c6, 'reveal', 'Hover over the code to reveal it');
  var scrT = null;
  codeBox.addEventListener('mouseenter', function () {
    var tiles = codeBox.querySelectorAll('[data-g]'); var t0 = Date.now();
    codeBox.classList.add(RC.scr); clearInterval(scrT);
    scrT = setInterval(function () {
      tiles.forEach(function (g) { g.setAttribute('data-s', AL[Math.floor(Math.random() * 32)]); });
      if (Date.now() - t0 > 1200) { clearInterval(scrT); codeBox.classList.remove(RC.scr); }
    }, 70);
  });
  function showCode(cd) {
    codeBox.innerHTML = '';
    var chars = cd.split('').map(function (c, i) { return [c, i]; });
    shuffle(chars).forEach(function (x) {
      var g = h(codeBox, x[0] === '-' ? 'ch dash' : 'ch');
      g.setAttribute('data-g', x[0]);
      place(g, 'order:' + x[1]);
    });
    go(6);
  }

  // ---------- legacy fallback form (out of sync) ----------
  var lf = function (id) { return document.getElementById(id); };
  lf('lf-go').addEventListener('click', function () {
    var st = {
      trip: lf('lf-trip').value, from: lf('lf-from').value, to: lf('lf-to').value, date: lf('lf-date').value,
      time: lf('lf-time').value,
      pax: { A: +lf('lf-a').value || 0, SE: +lf('lf-se').value || 0, ST: +lf('lf-st').value || 0, CH: +lf('lf-ch').value || 0 },
      car: +lf('lf-car').value || 1,
      seats: lf('lf-seats').value.split(/[^0-9]+/).filter(Boolean).map(Number),
      extras: { BIKE: lf('lf-bike').checked, MEAL: lf('lf-meal').checked, LUG: lf('lf-lug').checked, INS: true },
      name: lf('lf-name').value
    };
    showCode(code(st));
  });

  // ---------- cookie consent ----------
  var ov = h(document.body, 'ov');
  var ck = h(ov, 'ck');
  h(ck, 'ckT', 'We value your privacy');
  h(ck, 'ckP', 'RailGo and our 214 partners use cookies to personalise offers, measure performance and improve your journey. You can change your choice at any time in Settings.');
  var ckB = h(ck, 'ckB');
  var bNec = h(ckB, 'btn btnS', 'Necessary only');
  var bAll = h(ckB, 'btn btnP', 'Accept all');
  root.setAttribute('aria-hidden', 'true');
  ov.setAttribute('role', 'presentation');
  ov.setAttribute('aria-hidden', 'true');
  function closeCk() { ov.remove(); ov.setAttribute('aria-hidden', 'false'); startHold(); }
  tap(bNec, closeCk); tap(bAll, closeCk);
  // focus trap for the modal (listener never removed)
  document.addEventListener('keydown', function (ev) { if (ev.key === 'Tab') ev.preventDefault(); });

  flush();
  go(1);
})();
