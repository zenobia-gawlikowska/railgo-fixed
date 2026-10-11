(function () {
  'use strict';

  // ---------- helpers ----------
  function $(id) { return document.getElementById(id); }
  function el(tag, attrs, kids) {
    var e = document.createElement(tag);
    for (var a in attrs || {}) {
      if (a === 'text') e.textContent = attrs[a];
      else if (a === 'cls') e.className = attrs[a];
      else e.setAttribute(a, attrs[a]);
    }
    (kids || []).forEach(function (k) { if (k) e.appendChild(typeof k === 'string' ? document.createTextNode(k) : k); });
    return e;
  }
  var I = {
    next: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    back: '<path d="M15 6l-6 6 6 6"/>',
    right: '<path d="M9 6l6 6-6 6"/>',
    one: '<path d="M4 12h15M14 7l5 5-5 5"/>',
    ret: '<path d="M4 9h15M15 5l4 4-4 4M20 15H5M9 11l-4 4 4 4"/>',
    plus: '<path d="M12 6v12M6 12h12"/>',
    minus: '<path d="M6 12h12"/>',
    chev: '<path d="M6 9l6 6 6-6"/>',
    check: '<path d="M5 12l5 5 9-10"/>',
    car: '<rect x="3" y="6" width="18" height="11" rx="2"/><path d="M3 12h18"/>'
  };
  var SIZE = { next: 20, back: 18, right: 18, one: 20, ret: 20, plus: 14, minus: 14, chev: 16, check: 30, car: 16 };
  function icon(name, size) {
    var w = document.createElement('span');
    var s = size || SIZE[name] || 18;
    w.innerHTML = '<svg aria-hidden="true" focusable="false" width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' + I[name] + '</svg>';
    return w.firstChild;
  }
  document.querySelectorAll('[data-icon]').forEach(function (b) { b.appendChild(icon(b.getAttribute('data-icon'))); });
  function rnd(n) { return Math.floor(Math.random() * n); }

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
  var PAXPL = { A: ['adult', 'adults'], SE: ['senior', 'seniors'], ST: ['student', 'students'], CH: ['child', 'children'] };
  var EXTRAS = [['BIKE', 'Bicycle', '+ 9 zł'], ['MEAL', 'Meal voucher', '+ 32 zł per passenger'], ['LUG', 'Extra luggage', '+ 15 zł'], ['INS', 'Travel insurance', '+ 12 zł per passenger']];
  var TODAY = new Date(2026, 9, 8);
  var real = new Date(); if (real > TODAY) TODAY = new Date(real.getFullYear(), real.getMonth(), real.getDate());
  var MAXPAX = 6;

  var S = {
    step: 1, trip: 'R', from: null, to: null, date: null, time: null,
    pax: { A: 1, SE: 0, ST: 0, CH: 0 }, car: 1, seats: [], extras: {}, name: ''
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
  var TITLES = { 1: 'Where are you going?', 2: 'Choose your train', 3: 'Pick your seats', 4: 'Extras & passenger details', 5: 'Review & pay', 6: 'Booking confirmed' };
  var dotEls = document.querySelectorAll('.dot');
  var banner = $('banner');
  var BANNERS = ['Autumn sale: -20% on weekend trips', 'New: Wi-Fi on all EIP trains', 'Travel greener - take the train', 'Kids under 4 travel free', 'Earn RailGo points on every trip', ''];
  // promo slot: picked once per page load (like an ad slot), stable for the whole session
  banner.textContent = BANNERS[rnd(BANNERS.length)];

  // ---------- hold timer (extendable, warns before it runs out) ----------
  var HOLD = 10 * 60000, WARN = 60000, WARN2 = 120000, holdEnd = 0, holdT = null, warned = false, warned2 = false;
  var holdTxt = $('hold-txt'), holdMore = $('hold-more'), holdAlert = $('hold-alert');
  function fmt(sec) { return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0'); }
  function tickHold() {
    var left = Math.max(0, holdEnd - Date.now()), sec = Math.ceil(left / 1000);
    holdTxt.textContent = 'Fares and seats held for ' + fmt(sec);
    holdTxt.classList.toggle('holdLow', left <= WARN2);
    if (left <= WARN2 && !warned2) {
      warned2 = true;
      holdAlert.textContent = 'Your fares and seats are held for 2 more minutes. Choose "Extend by 10 minutes" to keep them longer.';
    }
    if (left <= WARN && !warned) {
      warned = true;
      holdAlert.textContent = 'Your fares and seats are held for less than a minute. Choose "Extend by 10 minutes" to keep them.';
    }
    if (left <= 0) {
      clearInterval(holdT);
      try { sessionStorage.setItem('rg-exp', '1'); } catch (e) {}
      location.reload();
    }
  }
  function startHold() {
    holdEnd = Date.now() + HOLD; warned = warned2 = false; holdAlert.textContent = '';
    holdMore.hidden = false;
    clearInterval(holdT); holdT = setInterval(tickHold, 1000); tickHold();
  }
  holdMore.addEventListener('click', function () {
    holdEnd = Math.max(holdEnd, Date.now()) + HOLD; warned = warned2 = false;
    holdAlert.textContent = 'Hold extended. Fares and seats are held for ' + fmt(Math.ceil((holdEnd - Date.now()) / 1000)) + '.';
    tickHold();
  });
  try {
    if (sessionStorage.getItem('rg-exp')) {
      sessionStorage.removeItem('rg-exp');
      holdAlert.textContent = 'Your session expired and your selection was released. Please start again.';
    }
  } catch (e) {}

  // ---------- steps ----------
  var cards = {};
  for (var n = 1; n <= 6; n++) cards[n] = $('step-' + n);
  function go(n) {
    S.step = n;
    for (var key in cards) cards[key].classList.toggle('show', +key === n);
    dotEls.forEach(function (d, i) { d.classList.toggle('dotOn', i < n); });
    banner.hidden = n === 6;
    if (n === 3) renderSeats();
    if (n === 5) renderReview();
    if (n === 6) { clearInterval(holdT); holdTxt.textContent = ''; holdMore.hidden = true; holdAlert.textContent = ''; }
    document.title = TITLES[n] + (n < 6 ? ' – Step ' + n + ' of 5' : '') + ' – RailGo';
    window.scrollTo(0, 0);
  }
  function goFocus(n) { go(n); $('h-' + n).focus(); }

  var CHECKS = {
    1: function () {
      var miss = [];
      if (!S.from) miss.push($('from'));
      if (!S.to) miss.push($('to'));
      if (miss.length || !S.date) return { msg: 'Please complete your journey', fields: miss, focus: miss[0] || $('cal') };
      if (S.from === S.to) return { msg: 'Departure and arrival stations must be different', fields: [$('to')], focus: $('to') };
    },
    2: function () {
      if (!S.time || totalPax() < 1 || S.pax.A + S.pax.SE < 1) return { msg: 'Select a train and at least one adult or senior' };
    },
    3: function () {
      if (S.seats.length !== totalPax()) return { msg: 'Select a seat for every passenger' };
    },
    4: function () {
      S.name = $('name').value;
      if (S.name.trim().length < 2) return { msg: 'Enter the passenger name', fields: [$('name')], focus: $('name') };
    }
  };
  function clearErr(n) {
    $('err-' + n).textContent = '';
    cards[n].querySelectorAll('[aria-invalid]').forEach(function (f) { f.removeAttribute('aria-invalid'); });
  }
  document.querySelectorAll('.next').forEach(function (b) {
    var n = +b.getAttribute('data-next');
    b.addEventListener('click', function () {
      clearErr(n);
      var err = CHECKS[n]();
      if (!err) { goFocus(n + 1); return; }
      (err.fields || []).forEach(function (f) { f.setAttribute('aria-invalid', 'true'); });
      $('err-' + n).textContent = err.msg;
    });
  });
  document.querySelectorAll('.back').forEach(function (b) {
    b.addEventListener('click', function () { if (S.step > 1) goFocus(S.step - 1); });
  });
  $('booking').addEventListener('submit', function (ev) { ev.preventDefault(); });

  // ===== STEP 1 : journey =====
  var tripBtns = { R: $('trip-R'), O: $('trip-O') };
  function renderTrip() {
    for (var t in tripBtns) tripBtns[t].setAttribute('aria-pressed', String(S.trip === t));
    $('trip-cap').textContent = S.trip === 'O' ? 'One-way' : 'Return (open return ticket)';
  }
  Object.keys(tripBtns).forEach(function (t) {
    tripBtns[t].addEventListener('click', function () { S.trip = t; renderTrip(); });
  });
  renderTrip();

  var sortedST = ST.slice().sort(function (a, b) { return a[1].localeCompare(b[1], 'pl'); });
  ['from', 'to'].forEach(function (key) {
    var sel = $(key);
    sortedST.forEach(function (s) { sel.appendChild(el('option', { value: s[0], text: s[1] })); });
    sel.addEventListener('change', function () { S[key] = sel.value || null; sel.removeAttribute('aria-invalid'); });
  });

  // calendar: a table of day buttons; arrows move between days, Page Up/Down change month
  var calBody = $('cal-body'), calM = $('cal-m'), calPrev = $('cal-prev'), calNext = $('cal-next');
  var view = { y: TODAY.getFullYear(), m: TODAY.getMonth() };
  var MN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var MS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var WDL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  function iso(y, m, d) { return y + '-' + String(m + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0'); }
  var calMax = new Date(TODAY.getTime()); calMax.setDate(calMax.getDate() + 120);
  function dayOff(dt) { return dt < TODAY || dt > calMax; }
  var focusDay = null; // day number to focus after a re-render
  function atFirstMonth() { return view.y === TODAY.getFullYear() && view.m === TODAY.getMonth(); }
  function atLastMonth() { return view.y === calMax.getFullYear() && view.m === calMax.getMonth(); }
  function renderCal() {
    calM.textContent = MN[view.m] + ' ' + view.y;
    calPrev.setAttribute('aria-disabled', String(atFirstMonth()));
    calNext.setAttribute('aria-disabled', String(atLastMonth()));
    var lead = (new Date(view.y, view.m, 1).getDay() + 6) % 7;
    var dim = new Date(view.y, view.m + 1, 0).getDate();
    calBody.innerHTML = '';
    var tr = null, buttons = [], tabbable = null;
    for (var k = 0; k < lead + dim; k++) {
      if (k % 7 === 0) tr = calBody.appendChild(el('tr'));
      var d = k - lead + 1;
      if (d < 1) { tr.appendChild(el('td')); continue; }
      var dt = new Date(view.y, view.m, d), off = dayOff(dt), sel = S.date === iso(view.y, view.m, d);
      var b = el('button', {
        type: 'button', cls: 'day', 'data-d': String(d), tabindex: '-1',
        'aria-label': WDL[dt.getDay()] + ' ' + d + ' ' + MN[view.m] + ' ' + view.y + (off ? ', not available' : ''),
        'aria-pressed': String(sel)
      }, [String(d)]);
      if (off) b.setAttribute('aria-disabled', 'true');
      if (sel) tabbable = b;
      buttons.push(b);
      tr.appendChild(el('td', {}, [b]));
    }
    while (tr && tr.children.length < 7) tr.appendChild(el('td'));
    if (!tabbable) tabbable = buttons.filter(function (b) { return !b.hasAttribute('aria-disabled'); })[0] || buttons[0];
    if (focusDay) {
      var want = buttons[Math.min(focusDay, buttons.length) - 1];
      if (want) { tabbable = want; }
    }
    tabbable.setAttribute('tabindex', '0');
    if (focusDay) { tabbable.focus(); focusDay = null; }
  }
  function shiftMonth(dir) {
    if (dir < 0 && atFirstMonth()) return false;
    if (dir > 0 && atLastMonth()) return false;
    view.m += dir;
    if (view.m > 11) { view.m = 0; view.y++; }
    if (view.m < 0) { view.m = 11; view.y--; }
    return true;
  }
  function pickDay(b) {
    if (b.hasAttribute('aria-disabled')) return;
    var d = +b.getAttribute('data-d'), dt = new Date(view.y, view.m, d);
    var changed = S.date !== iso(view.y, view.m, d);
    S.date = iso(view.y, view.m, d);
    if (changed) { S.time = null; renderDeps(); }
    $('date-chosen').textContent = 'Selected: ' + WD[dt.getDay()] + ', ' + d + ' ' + MS[view.m] + ' ' + view.y;
    calBody.querySelectorAll('.day').forEach(function (x) {
      x.setAttribute('aria-pressed', String(x === b));
      x.setAttribute('tabindex', x === b ? '0' : '-1');
    });
  }
  calBody.addEventListener('click', function (ev) {
    var b = ev.target.closest('.day'); if (b) pickDay(b);
  });
  calPrev.addEventListener('click', function () { if (shiftMonth(-1)) renderCal(); });
  calNext.addEventListener('click', function () { if (shiftMonth(1)) renderCal(); });
  $('cal').addEventListener('keydown', function (ev) {
    var b = ev.target.closest('.day');
    if (ev.key === 'PageDown' || ev.key === 'PageUp') {
      ev.preventDefault();
      var keep = b ? +b.getAttribute('data-d') : null;
      if (shiftMonth(ev.key === 'PageDown' ? 1 : -1)) { focusDay = keep; renderCal(); }
      return;
    }
    if (!b) return;
    var d = +b.getAttribute('data-d'), dim = new Date(view.y, view.m + 1, 0).getDate(), to = null;
    if (ev.key === 'ArrowRight') to = d + 1;
    else if (ev.key === 'ArrowLeft') to = d - 1;
    else if (ev.key === 'ArrowDown') to = d + 7;
    else if (ev.key === 'ArrowUp') to = d - 7;
    else if (ev.key === 'Home') to = 1;
    else if (ev.key === 'End') to = dim;
    else return;
    ev.preventDefault();
    if (to < 1) { if (shiftMonth(-1)) { focusDay = new Date(view.y, view.m + 1, 0).getDate() + to; renderCal(); } return; }
    if (to > dim) { if (shiftMonth(1)) { focusDay = to - dim; renderCal(); } return; }
    var t = calBody.querySelector('[data-d="' + to + '"]');
    b.setAttribute('tabindex', '-1'); t.setAttribute('tabindex', '0'); t.focus();
  });
  renderCal();

  // ===== STEP 2 : departure + passengers =====
  var deps = $('deps');
  var depSorted = DEPS.slice().sort(function (a, b) { return a[0].localeCompare(b[0]); });
  depSorted.forEach(function (d) {
    var r = el('input', { type: 'radio', name: 'dep', value: d[0] });
    r.addEventListener('change', function () { if (r.checked) S.time = d[0]; });
    deps.appendChild(el('label', { cls: 'dep' }, [
      r, el('span', { cls: 'depT', text: d[0] }), el('span', { cls: 'depN', text: d[1] }),
      el('span', { cls: 'depD', text: d[2] }), el('span', { cls: 'depP', text: d[3] + ' zł' }),
      el('span', { cls: 'depSel', 'aria-hidden': 'true', text: 'Selected' })
    ]));
  });
  function renderDeps() {
    deps.querySelectorAll('input').forEach(function (r) { r.checked = r.value === S.time; });
  }

  var paxBox = $('pax'), paxIn = {}, paxBtn = {};
  function totalPax() { return S.pax.A + S.pax.SE + S.pax.ST + S.pax.CH; }
  function paxWords(k, n) { return n + ' ' + PAXPL[k][n === 1 ? 0 : 1]; }
  function renderPax() {
    var full = totalPax() >= MAXPAX;
    PAX.forEach(function (p) {
      var k = p[0];
      paxIn[k].value = String(S.pax[k]);
      paxBtn[k].plus.setAttribute('aria-disabled', String(full));
      paxBtn[k].minus.setAttribute('aria-disabled', String(S.pax[k] < 1));
    });
  }
  function setPax(k, v, say) {
    v = Math.max(0, Math.min(v, S.pax[k] + MAXPAX - totalPax()));
    if (v !== S.pax[k]) { S.pax[k] = v; S.seats = []; }
    renderPax();
    if (say) $('pax-status').textContent = say(v);
  }
  PAX.forEach(function (p) {
    var k = p[0], id = 'pax-' + k;
    var minus = el('button', { type: 'button', cls: 'stpB', 'aria-label': 'Remove a' + (k === 'A' ? 'n ' : ' ') + p[1].toLowerCase(), 'aria-controls': id }, [icon('minus')]);
    var plus = el('button', { type: 'button', cls: 'stpB', 'aria-label': 'Add a' + (k === 'A' ? 'n ' : ' ') + p[1].toLowerCase(), 'aria-controls': id }, [icon('plus')]);
    var inp = el('input', { type: 'number', cls: 'stpN', id: id, min: '0', max: String(MAXPAX), step: '1', inputmode: 'numeric', 'aria-describedby': id + '-d' });
    paxIn[k] = inp; paxBtn[k] = { plus: plus, minus: minus };
    plus.addEventListener('click', function () {
      if (totalPax() >= MAXPAX) { $('pax-status').textContent = 'Maximum of ' + MAXPAX + ' passengers reached'; return; }
      setPax(k, S.pax[k] + 1, function (v) { return paxWords(k, v); });
    });
    minus.addEventListener('click', function () { if (S.pax[k] > 0) setPax(k, S.pax[k] - 1, function (v) { return paxWords(k, v); }); });
    inp.addEventListener('change', function () { setPax(k, parseInt(inp.value, 10) || 0); });
    paxBox.appendChild(el('div', { cls: 'paxR', role: 'group', 'aria-label': p[1] + ' passengers' }, [
      el('div', {}, [el('label', { cls: 'paxL', 'for': id, text: p[1] }), el('span', { cls: 'paxS', id: id + '-d', text: p[2] })]),
      el('div', { cls: 'stp' }, [minus, inp, plus])
    ]));
  });
  renderPax();

  // ===== STEP 3 : seats =====
  var cars = $('cars'), carEls = [];
  for (var cn = 1; cn <= 5; cn++) {
    (function (cn) {
      var ce = el('button', { type: 'button', role: 'tab', cls: 'car', id: 'car-' + cn, 'aria-controls': 'seat-panel' },
        [icon('car'), el('span', { cls: 'sr-only', text: 'Carriage ' }), el('span', { text: String(cn) })]);
      carEls.push(ce);
      ce.addEventListener('click', function () { if (S.car !== cn) { S.car = cn; S.seats = []; renderSeats(); } });
      ce.addEventListener('keydown', function (ev) {
        var to = ev.key === 'ArrowRight' ? cn + 1 : ev.key === 'ArrowLeft' ? cn - 1 : ev.key === 'Home' ? 1 : ev.key === 'End' ? 5 : 0;
        if (!to) return;
        ev.preventDefault();
        to = (to + 4) % 5 + 1;
        carEls[to - 1].focus(); carEls[to - 1].click();
      });
      cars.appendChild(ce);
    })(cn);
  }
  var seatsEl = $('seats'), seatEls = [];
  function isTaken(car, n) {
    if (car === 3 && (n === 21 || n === 22)) return false;
    if (car === 3 && (n === 17 || n === 18 || n === 25 || n === 26 || n === 23 || n === 24)) return true;
    return fnv(car + ':' + n, 7) % 3 === 0;
  }
  for (var sn = 1; sn <= 48; sn++) {
    (function (n) {
      var c = (n - 1) % 4, win = c === 0 || c === 3;
      var b = el('button', { type: 'button', role: 'checkbox', cls: 'seat' + (win ? ' win' : ''), 'aria-checked': 'false' }, [String(n)]);
      b.addEventListener('click', function () {
        if (isTaken(S.car, n)) return;
        var i = S.seats.indexOf(n);
        clearErr(3);
        if (i >= 0) S.seats.splice(i, 1);
        else if (S.seats.length >= totalPax()) {
          $('err-3').textContent = 'You have already chosen ' + totalPax() + ' of ' + totalPax() + ' seats. Deselect a seat to choose another.';
          return;
        } else S.seats.push(n);
        renderSeats();
      });
      seatEls.push(b);
      seatsEl.appendChild(b);
    })(sn);
  }
  function renderSeats() {
    carEls.forEach(function (ce, i) {
      var on = i + 1 === S.car;
      ce.setAttribute('aria-selected', String(on));
    });
    $('seat-panel').setAttribute('aria-labelledby', 'car-' + S.car);
    seatsEl.setAttribute('aria-label', 'Seats in carriage ' + S.car);
    seatEls.forEach(function (b, i) {
      var n = i + 1, c = i % 4, tk = isTaken(S.car, n), sel = S.seats.indexOf(n) >= 0;
      b.setAttribute('aria-label', 'Seat ' + n + ', row ' + (Math.floor(i / 4) + 1) + ', ' + (c < 2 ? 'left ' : 'right ') +
        (c === 0 || c === 3 ? 'window' : 'aisle') + (tk ? ', taken' : ''));
      b.setAttribute('aria-checked', String(sel));
      b.classList.toggle('taken', tk);
      b.disabled = tk;
    });
    $('seat-info').textContent = 'Carriage ' + S.car + ' · ' + S.seats.length + ' of ' + totalPax() + ' seats selected';
  }

  // ===== STEP 4 : extras + name =====
  var xw = $('xw'), xBtn = $('x-btn'), xMenu = $('x-menu'), chips = $('chips');
  var xByHover = false;
  EXTRAS.forEach(function (x) {
    var cb = el('input', { type: 'checkbox', cls: 'chk', id: 'x-' + x[0] });
    // ticking an extra keeps the list open until the user closes it
    cb.addEventListener('change', function () { S.extras[x[0]] = cb.checked; xByHover = false; renderExtras(); });
    xMenu.appendChild(el('label', { cls: 'xItem', 'for': 'x-' + x[0] }, [cb, el('span', { cls: 'xL', text: x[1] }), el('span', { cls: 'xP', text: x[2] })]));
  });
  function renderExtras() {
    chips.innerHTML = '';
    EXTRAS.forEach(function (x) {
      if (S.extras[x[0]]) chips.appendChild(el('li', { cls: 'chip', text: x[1] + ' added' }));
    });
    if (!chips.children.length) chips.appendChild(el('li', { cls: 'chip-none', text: 'No extras added' }));
  }
  function setMenu(open, byHover) {
    xMenu.hidden = !open;
    xBtn.setAttribute('aria-expanded', String(open));
    xByHover = open && !!byHover;
  }
  // a click (or Enter/Space) toggles the list; clicking a list opened by pointing keeps it open
  xBtn.addEventListener('click', function () { if (xByHover) xByHover = false; else setMenu(xMenu.hidden); });
  // mouse users can also open the list by resting the pointer on the button (not by passing over it);
  // it then closes when the pointer leaves, or with Escape
  var hoverT = null;
  xBtn.addEventListener('mouseenter', function () {
    clearTimeout(hoverT);
    hoverT = setTimeout(function () { if (xMenu.hidden) setMenu(true, true); }, 250);
  });
  xBtn.addEventListener('mouseleave', function () { clearTimeout(hoverT); });
  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape' && xByHover) setMenu(false);
  });
  xw.addEventListener('mouseleave', function () {
    if (xByHover) setTimeout(function () { if (xByHover && !xw.matches(':hover')) setMenu(false); }, 150);
  });
  xw.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape' && !xMenu.hidden) { setMenu(false); xBtn.focus(); }
  });
  renderExtras();

  var nameIn = $('name');
  nameIn.addEventListener('input', function () { S.name = nameIn.value; nameIn.removeAttribute('aria-invalid'); });

  // ===== STEP 5 : review =====
  var rv = $('rv'), rvRows = {};
  ['Trip', 'Route', 'Date', 'Train', 'Passengers', 'Seats', 'Extras', 'Name'].forEach(function (key) {
    rv.appendChild(el('dt', { text: key }));
    rvRows[key] = rv.appendChild(el('dd'));
  });
  function stName(id) { for (var i = 0; i < ST.length; i++) if (ST[i][0] === id) return ST[i][1]; return id; }
  function price() {
    var d = DEPS.filter(function (x) { return x[0] === S.time; })[0]; var base = d ? d[3] : 0;
    var t = 0; PAX.forEach(function (p) { t += S.pax[p[0]] * base * p[3]; });
    if (S.trip === 'R') t *= 1.8;
    if (S.extras.BIKE) t += 9; if (S.extras.MEAL) t += 32 * totalPax(); if (S.extras.LUG) t += 15; if (S.extras.INS) t += 12 * totalPax();
    return t.toFixed(2).replace('.', ',');
  }
  function renderReview() {
    rvRows.Trip.textContent = S.trip === 'O' ? 'One-way' : 'Return';
    rvRows.Route.textContent = stName(S.from) + ' → ' + stName(S.to);
    var p = (S.date || '').split('-'); rvRows.Date.textContent = p.length === 3 ? (+p[2]) + ' ' + MN[+p[1] - 1] + ' ' + p[0] : '';
    var d = DEPS.filter(function (x) { return x[0] === S.time; })[0];
    rvRows.Train.textContent = d ? d[0] + ' ' + d[1] : '';
    rvRows.Passengers.textContent = PAX.filter(function (x) { return S.pax[x[0]]; }).map(function (x) { return S.pax[x[0]] + ' × ' + x[1]; }).join(', ');
    rvRows.Seats.textContent = 'Carriage ' + S.car + ', seats ' + S.seats.slice().sort(function (a, b) { return a - b; }).join(' & ');
    rvRows.Extras.textContent = EXTRAS.filter(function (x) { return S.extras[x[0]]; }).map(function (x) { return x[1]; }).join(', ') || 'None';
    rvRows.Name.textContent = S.name.trim();
    $('pay').textContent = 'Pay ' + price() + ' zł';
  }
  $('promo-apply').addEventListener('click', function () {
    var v = $('promo-code').value.trim();
    $('promo-msg').textContent = v ? 'The promo code "' + v + '" is not valid or has expired.' : 'Enter a promo code first.';
  });
  $('promo-code').addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { ev.preventDefault(); $('promo-apply').click(); } });
  $('pay').addEventListener('click', function () {
    $('code').textContent = code(S);
    $('code').insertBefore(el('span', { cls: 'sr-only', text: 'Booking reference: ' }), $('code').firstChild);
    goFocus(6);
  });

  // ---------- header menu ----------
  var menuBtn = $('menu-btn'), menu = $('menu');
  function setNav(open) { menu.hidden = !open; menuBtn.setAttribute('aria-expanded', String(open)); }
  menuBtn.addEventListener('click', function () { setNav(menu.hidden); });
  menu.parentNode.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape' && !menu.hidden) { setNav(false); menuBtn.focus(); }
  });
  document.addEventListener('click', function (ev) {
    if (!menu.hidden && !menu.parentNode.contains(ev.target)) setNav(false);
  });

  // ---------- newsletter ----------
  $('news').addEventListener('submit', function (ev) {
    ev.preventDefault();
    var em = $('news-email'), msg = $('news-msg');
    em.removeAttribute('aria-invalid');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em.value.trim())) {
      em.setAttribute('aria-invalid', 'true');
      msg.textContent = 'Enter a valid e-mail address, for example name@example.com.';
      return;
    }
    if (!$('news-ok').checked) { msg.textContent = 'Tick "I agree to receive offers" to subscribe.'; return; }
    msg.textContent = 'Thanks! We have sent a confirmation link to ' + em.value.trim() + '.';
  });

  // ---------- cookie consent (modal sheet) ----------
  var ck = $('cookie');
  var behind = [$('site-header'), $('main'), document.querySelector('.ftr'), document.querySelector('.skip')];
  function closeCk() {
    if (!ck.open) return;
    ck.close();
    behind.forEach(function (b) { b.inert = false; });
    startHold();
    $('h-1').focus();
  }
  $('ck-nec').addEventListener('click', closeCk);
  $('ck-all').addEventListener('click', closeCk);
  ck.addEventListener('cancel', function (ev) { ev.preventDefault(); closeCk(); });
  // keep Tab inside the sheet while it is open
  ck.addEventListener('keydown', function (ev) {
    if (ev.key !== 'Tab') return;
    var f = [$('ck-nec'), $('ck-all')], first = f[0], last = f[f.length - 1];
    if (ev.shiftKey && (document.activeElement === first || document.activeElement === ck)) { ev.preventDefault(); last.focus(); }
    else if (!ev.shiftKey && document.activeElement === last) { ev.preventDefault(); first.focus(); }
  });
  behind.forEach(function (b) { b.inert = true; });
  ck.showModal();
  ck.focus();

  go(1);
})();
