(function () {
  'use strict';

  // ---------- helpers ----------
  function $(id) { return document.getElementById(id); }
  function el(tag, attrs, kids) {
    var e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v == null || v === false) return;
      if (k === 'text') e.textContent = v;
      else if (k === 'className') e.className = v;
      else e.setAttribute(k, v === true ? '' : v);
    });
    (kids || []).forEach(function (c) { if (c) e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return e;
  }
  var SVGNS = 'http://www.w3.org/2000/svg';
  function icon(path, size) {
    var s = document.createElementNS(SVGNS, 'svg');
    s.setAttribute('width', size || 18); s.setAttribute('height', size || 18); s.setAttribute('viewBox', '0 0 24 24');
    s.setAttribute('fill', 'none'); s.setAttribute('stroke', 'currentColor'); s.setAttribute('stroke-width', '2.2');
    s.setAttribute('stroke-linecap', 'round'); s.setAttribute('stroke-linejoin', 'round');
    s.setAttribute('aria-hidden', 'true'); s.setAttribute('focusable', 'false');
    s.innerHTML = path;
    return s;
  }
  var I = {
    plus: '<path d="M12 6v12M6 12h12"/>',
    minus: '<path d="M6 12h12"/>',
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
  var PAX_WORDS = { A: ['an adult', 'adults'], SE: ['a senior', 'seniors'], ST: ['a student', 'students'], CH: ['a child', 'children'] };
  var EXTRAS = [['BIKE', 'Bicycle', '+ 9 zł'], ['MEAL', 'Meal voucher', '+ 32 zł per passenger'], ['LUG', 'Extra luggage', '+ 15 zł'], ['INS', 'Travel insurance', '+ 12 zł per passenger']];
  var MAX_PAX = 6;
  var TODAY = new Date(2026, 9, 8);
  var real = new Date(); if (real > TODAY) TODAY = new Date(real.getFullYear(), real.getMonth(), real.getDate());

  var S = {
    step: 1, trip: 'R', from: null, to: null, date: null, time: null,
    pax: { A: 1, SE: 0, ST: 0, CH: 0 }, car: 1, seats: [], extras: {}, name: ''
  };

  // ---------- booking code (unchanged) ----------
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

  var MN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var MS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var WDL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  function iso(y, m, d) { return y + '-' + String(m + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0'); }
  function parseIso(s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function shortDate(s) { var d = parseIso(s); return WD[d.getDay()] + ', ' + d.getDate() + ' ' + MS[d.getMonth()] + ' ' + d.getFullYear(); }
  function stName(id) { for (var i = 0; i < ST.length; i++) if (ST[i][0] === id) return ST[i][1]; return id || ''; }
  function totalPax() { return S.pax.A + S.pax.SE + S.pax.ST + S.pax.CH; }

  // ---------- navigation between steps ----------
  var TITLES = { 1: 'Where are you going?', 2: 'Choose your train', 3: 'Pick your seats', 4: 'Extras & passenger details', 5: 'Review & pay', 6: 'Booking confirmed' };
  var dots = document.querySelectorAll('.dot');
  function go(n) {
    S.step = n;
    for (var i = 1; i <= 6; i++) $('step' + i).hidden = i !== n;
    for (var j = 0; j < dots.length; j++) dots[j].classList.toggle('on', j < n);
    $('progress-text').textContent = n <= 5 ? 'Step ' + n + ' of 5' : 'Booking complete';
    $('banner').hidden = n === 6;
    document.title = TITLES[n] + ' – Book train tickets – RailGo';
    if (n === 2) renderDepSummary();
    if (n === 3) renderSeats();
    if (n === 5) renderReview();
    if (n === 6) stopHold();
    window.scrollTo(0, 0);
    $('t' + n).focus();
  }
  function showErr(n, msg, items) {
    var box = $('err' + n);
    box.innerHTML = '';
    if (!msg) return;
    box.appendChild(el('p', { text: msg }));
    if (items && items.length) box.appendChild(el('ul', null, items.map(function (t) { return el('li', { text: t }); })));
  }
  var checks = {
    1: function () {
      var miss = [];
      if (!S.from) miss.push('Choose a departure station.');
      if (!S.to) miss.push('Choose an arrival station.');
      if (S.from && S.to && S.from === S.to) miss.push('The departure and arrival stations must be different.');
      if (!S.date) miss.push('Choose a date of travel.');
      $('from').setAttribute('aria-invalid', String(!S.from || S.from === S.to));
      $('to').setAttribute('aria-invalid', String(!S.to || S.from === S.to));
      return miss.length ? ['Please complete your journey', miss] : null;
    },
    2: function () {
      var miss = [];
      if (!S.time) miss.push('Choose a departure.');
      if (S.pax.A + S.pax.SE < 1) miss.push('Add at least one adult or senior.');
      return miss.length ? ['Select a train and at least one adult or senior', miss] : null;
    },
    3: function () {
      return S.seats.length === totalPax() ? null : ['Select a seat for every passenger', ['You have selected ' + S.seats.length + ' of ' + totalPax() + ' seats.']];
    },
    4: function () {
      S.name = $('lead').value;
      var bad = S.name.trim().length <= 1;
      $('lead').setAttribute('aria-invalid', String(bad));
      return bad ? ['Enter the passenger name', null] : null;
    }
  };
  Array.prototype.forEach.call(document.querySelectorAll('.next'), function (b) {
    b.addEventListener('click', function () {
      var n = +b.getAttribute('data-step');
      var e = checks[n]();
      if (e) { showErr(n, e[0], e[1]); return; }
      showErr(n, '');
      go(n + 1);
    });
  });
  Array.prototype.forEach.call(document.querySelectorAll('.back'), function (b) {
    b.addEventListener('click', function () { if (S.step > 1) go(S.step - 1); });
  });
  $('booking').addEventListener('submit', function (ev) { ev.preventDefault(); });

  // ===== STEP 1 : journey =====
  function renderTrip() {
    $('trip-r').setAttribute('aria-pressed', String(S.trip === 'R'));
    $('trip-o').setAttribute('aria-pressed', String(S.trip === 'O'));
    $('trip-cap').textContent = S.trip === 'O' ? 'One-way' : 'Return (open return ticket)';
  }
  $('trip-r').addEventListener('click', function () { S.trip = 'R'; renderTrip(); });
  $('trip-o').addEventListener('click', function () { S.trip = 'O'; renderTrip(); });
  renderTrip();

  var sorted = ST.slice().sort(function (a, b) { return a[1].localeCompare(b[1], 'pl'); });
  ['from', 'to'].forEach(function (key) {
    var sel = $(key);
    sorted.forEach(function (s) { sel.appendChild(el('option', { value: s[0], text: s[1] })); });
    sel.addEventListener('change', function () {
      S[key] = sel.value || null;
      if (sel.getAttribute('aria-invalid') === 'true' && S[key]) sel.setAttribute('aria-invalid', 'false');
    });
  });

  // calendar
  var calMax = new Date(TODAY.getTime()); calMax.setDate(calMax.getDate() + 120);
  var view = { y: TODAY.getFullYear(), m: TODAY.getMonth() };
  var focusDay = null; // iso date that holds the roving tab stop
  function dayOff(dt) { return dt < TODAY || dt > calMax; }
  function atFirstMonth() { return view.y === TODAY.getFullYear() && view.m === TODAY.getMonth(); }
  function atLastMonth() { return view.y === calMax.getFullYear() && view.m === calMax.getMonth(); }
  function renderCal(moveFocus) {
    $('cal-month').textContent = MN[view.m] + ' ' + view.y;
    $('cal-prev').setAttribute('aria-disabled', String(atFirstMonth()));
    $('cal-next').setAttribute('aria-disabled', String(atLastMonth()));
    var lead = (new Date(view.y, view.m, 1).getDay() + 6) % 7;
    var dim = new Date(view.y, view.m + 1, 0).getDate();
    // which day carries the tab stop in this month
    var stop = null;
    if (focusDay && parseIso(focusDay).getMonth() === view.m && parseIso(focusDay).getFullYear() === view.y) stop = focusDay;
    else if (S.date && parseIso(S.date).getMonth() === view.m && parseIso(S.date).getFullYear() === view.y) stop = S.date;
    else {
      for (var d0 = 1; d0 <= dim && !stop; d0++) if (!dayOff(new Date(view.y, view.m, d0))) stop = iso(view.y, view.m, d0);
      if (!stop) stop = iso(view.y, view.m, 1);
    }
    focusDay = stop;
    var body = $('cal-body'); body.innerHTML = '';
    var wk = 1, tr = el('tr', { 'aria-label': 'Week 1' });
    for (var b = 0; b < lead; b++) tr.appendChild(el('td'));
    for (var d = 1; d <= dim; d++) {
      var dt = new Date(view.y, view.m, d), id = iso(view.y, view.m, d), off = dayOff(dt);
      var btn = el('button', {
        type: 'button', className: 'day', 'data-date': id, tabindex: id === stop ? '0' : '-1',
        'aria-label': WDL[dt.getDay()] + ', ' + d + ' ' + MN[view.m] + ' ' + view.y + (off ? ', not available' : ''),
        'aria-pressed': String(S.date === id), 'aria-disabled': off ? 'true' : null,
        'aria-current': dt.getTime() === TODAY.getTime() ? 'date' : null, text: String(d)
      });
      tr.appendChild(el('td', null, [btn]));
      if ((lead + d) % 7 === 0) { body.appendChild(tr); tr = el('tr', { 'aria-label': 'Week ' + (++wk) }); }
    }
    if (tr.children.length) { while (tr.children.length < 7) tr.appendChild(el('td')); body.appendChild(tr); }
    if (moveFocus) { var f = body.querySelector('[data-date="' + stop + '"]'); if (f) f.focus(); }
  }
  function showMonth(y, m, moveFocus, keepDay) {
    var first = new Date(y, m, 1);
    if (first < new Date(TODAY.getFullYear(), TODAY.getMonth(), 1) || first > new Date(calMax.getFullYear(), calMax.getMonth(), 1)) return false;
    view.y = y; view.m = m;
    if (keepDay) { var dim = new Date(y, m + 1, 0).getDate(); focusDay = iso(y, m, Math.min(keepDay, dim)); }
    else focusDay = null;
    renderCal(moveFocus);
    return true;
  }
  function stepMonth(delta, moveFocus) {
    var m = view.m + delta, y = view.y;
    if (m > 11) { m = 0; y++; } if (m < 0) { m = 11; y--; }
    var keep = focusDay ? parseIso(focusDay).getDate() : null;
    return showMonth(y, m, moveFocus, moveFocus ? keep : null);
  }
  $('cal-next').addEventListener('click', function () { stepMonth(1, false); });
  $('cal-prev').addEventListener('click', function () { stepMonth(-1, false); });
  function pickDay(id) {
    var dt = parseIso(id);
    if (dayOff(dt)) return;
    S.date = id; S.time = null; focusDay = id;
    $('chosen').textContent = 'Selected: ' + shortDate(id);
    renderCal(true); renderDeps();
  }
  $('cal-body').addEventListener('click', function (ev) {
    var b = ev.target.closest('.day'); if (!b) return;
    pickDay(b.getAttribute('data-date'));
  });
  $('cal').addEventListener('keydown', function (ev) {
    var onDay = ev.target.classList && ev.target.classList.contains('day');
    if (ev.key === 'PageDown' || ev.key === 'PageUp') {
      ev.preventDefault();
      stepMonth(ev.key === 'PageDown' ? 1 : -1, onDay);
      return;
    }
    if (!onDay) return;
    var delta = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[ev.key];
    var cur = parseIso(ev.target.getAttribute('data-date'));
    if (ev.key === 'Home') delta = -((cur.getDay() + 6) % 7);
    if (ev.key === 'End') delta = 6 - ((cur.getDay() + 6) % 7);
    if (delta == null) return;
    ev.preventDefault();
    var nd = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() + delta);
    var first = new Date(TODAY.getFullYear(), TODAY.getMonth(), 1), last = new Date(calMax.getFullYear(), calMax.getMonth() + 1, 0);
    if (nd < first || nd > last) return;
    focusDay = iso(nd.getFullYear(), nd.getMonth(), nd.getDate());
    view.y = nd.getFullYear(); view.m = nd.getMonth();
    renderCal(true);
  });
  renderCal(false);

  // ===== STEP 2 : departure + passengers =====
  var depSorted = DEPS.slice().sort(function (a, b) { return a[0].localeCompare(b[0]); });
  function renderDepSummary() {
    $('dep-sum').textContent = stName(S.from) + ' → ' + stName(S.to) + (S.date ? ' · ' + shortDate(S.date) : '');
  }
  function renderDeps() {
    var box = $('deps'); box.innerHTML = '';
    depSorted.forEach(function (d) {
      var input = el('input', { type: 'radio', name: 'dep', value: d[0] });
      input.checked = S.time === d[0];
      var badge = el('span', { className: 'depS', 'aria-hidden': 'true', text: 'Selected' });
      badge.hidden = !input.checked;
      var lab = el('label', { className: 'dep' + (input.checked ? ' on' : '') }, [
        input, el('span', { className: 'depT', text: d[0] }), el('span', { className: 'depN', text: d[1] }),
        el('span', { className: 'depD', text: d[2] }), badge, el('span', { className: 'depP', text: d[3] + ' zł' })
      ]);
      input.addEventListener('change', function () {
        S.time = d[0];
        Array.prototype.forEach.call(box.querySelectorAll('.dep'), function (l) {
          var on = l.querySelector('input').checked;
          l.classList.toggle('on', on); l.querySelector('.depS').hidden = !on;
        });
      });
      box.appendChild(lab);
    });
  }
  renderDeps();

  var paxEls = {};
  PAX.forEach(function (p) {
    var key = p[0], w = PAX_WORDS[key];
    var num = el('span', { className: 'stpN', 'aria-hidden': 'true', text: String(S.pax[key]) });
    var minus = el('button', { type: 'button', className: 'stpB', 'aria-label': 'Remove ' + w[0], 'aria-describedby': 'pax-' + key + '-n' }, [icon(I.minus, 14)]);
    var plus = el('button', { type: 'button', className: 'stpB', 'aria-label': 'Add ' + w[0], 'aria-describedby': 'pax-' + key + '-n' }, [icon(I.plus, 14)]);
    num.id = 'pax-' + key + '-n';
    var spin = el('div', {
      className: 'paxSpin', role: 'spinbutton', tabindex: '0', 'aria-labelledby': 'pax-' + key + '-l',
      'aria-describedby': 'pax-' + key + '-s', 'aria-valuemin': '0', 'aria-valuemax': String(MAX_PAX), 'aria-valuenow': String(S.pax[key])
    }, [
      el('span', null, [el('span', { className: 'paxL', id: 'pax-' + key + '-l', text: p[1] }), el('span', { className: 'paxS', id: 'pax-' + key + '-s', text: p[2] })]),
      el('span', { className: 'stp' }, [minus, num, plus])
    ]);
    paxEls[key] = { spin: spin, num: num };
    function set(v) {
      var others = totalPax() - S.pax[key];
      v = Math.max(0, Math.min(v, MAX_PAX - others));
      if (v === S.pax[key]) return;
      S.pax[key] = v; S.seats = [];
      num.textContent = String(v);
      spin.setAttribute('aria-valuenow', String(v));
      spin.setAttribute('aria-valuetext', v + ' ' + (v === 1 ? p[1].toLowerCase() : w[1]));
      renderPaxTotal(spin.getAttribute('aria-valuetext'));
    }
    spin.setAttribute('aria-valuetext', S.pax[key] + ' ' + (S.pax[key] === 1 ? p[1].toLowerCase() : w[1]));
    plus.addEventListener('click', function () { set(S.pax[key] + 1); });
    minus.addEventListener('click', function () { set(S.pax[key] - 1); });
    spin.addEventListener('keydown', function (ev) {
      if (ev.target !== spin) return;
      var k = ev.key;
      if (k === 'ArrowUp' || k === 'ArrowRight') set(S.pax[key] + 1);
      else if (k === 'ArrowDown' || k === 'ArrowLeft') set(S.pax[key] - 1);
      else if (k === 'Home') set(0);
      else if (k === 'End') set(MAX_PAX);
      else return;
      ev.preventDefault();
    });
    $('pax').appendChild(el('div', { className: 'paxR' }, [spin]));
  });

  function paxList() {
    return PAX.filter(function (x) { return S.pax[x[0]]; }).map(function (x) { var v = S.pax[x[0]]; return v + ' ' + (v === 1 ? x[1].toLowerCase() : PAX_WORDS[x[0]][1]); }).join(', ');
  }
  function renderPaxTotal(changed) {
    var t = totalPax();
    $('pax-total').textContent = (changed ? 'Now ' + changed + '. ' : '') + 'Total: ' + t + ' passenger' + (t === 1 ? '' : 's') + (t ? ' (' + paxList() + ')' : '') + '.';
  }
  renderPaxTotal();

  // ===== STEP 3 : seats =====
  var carEls = [];
  for (var cn = 1; cn <= 5; cn++) {
    (function (cn) {
      var t = el('button', {
        type: 'button', className: 'car', role: 'tab', id: 'car-' + cn, 'aria-label': 'Carriage ' + cn,
        'aria-controls': 'seat-panel', 'aria-selected': String(S.car === cn)
      }, [icon(I.car, 16), el('span', { text: String(cn) })]);
      t.addEventListener('click', function () { chooseCar(cn); });
      t.addEventListener('keydown', function (ev) {
        var d = { ArrowLeft: -1, ArrowRight: 1 }[ev.key];
        var target = ev.key === 'Home' ? 1 : ev.key === 'End' ? 5 : d ? ((cn - 1 + d + 5) % 5) + 1 : null;
        if (!target) return;
        ev.preventDefault();
        chooseCar(target); carEls[target - 1].focus();
      });
      carEls.push(t);
      $('cars').appendChild(t);
    })(cn);
  }
  function chooseCar(n) { if (S.car !== n) { S.car = n; S.seats = []; seatFocus = null; } renderSeats(); }
  function isTaken(car, n) {
    if (car === 3 && (n === 21 || n === 22)) return false;
    if (car === 3 && (n === 17 || n === 18 || n === 25 || n === 26 || n === 23 || n === 24)) return true;
    return fnv(car + ':' + n, 7) % 3 === 0;
  }
  var seatFocus = null;
  function seatInfoText() {
    var s = S.seats.slice().sort(function (a, b) { return a - b; });
    return 'Carriage ' + S.car + ' · ' + S.seats.length + ' of ' + totalPax() + ' seats selected' + (s.length ? ': ' + s.join(', ') : '');
  }
  function renderSeats(focusN) {
    carEls.forEach(function (t, i) { t.setAttribute('aria-selected', String(i + 1 === S.car)); });
    $('seat-panel').setAttribute('aria-labelledby', 'car-' + S.car);
    var box = $('seats'); box.innerHTML = '';
    box.setAttribute('aria-label', 'Seats in carriage ' + S.car);
    var stop = seatFocus || (S.seats.length ? S.seats[0] : null);
    if (!stop) for (var k = 1; k <= 48 && !stop; k++) if (!isTaken(S.car, k)) stop = k;
    for (var n = 1; n <= 48; n++) {
      var c = (n - 1) % 4, win = c === 0 || c === 3, tk = isTaken(S.car, n), sel = S.seats.indexOf(n) >= 0;
      box.appendChild(el('button', {
        type: 'button', className: 'seat' + (win ? ' win' : ''), role: 'checkbox', 'data-n': String(n),
        'aria-checked': String(sel), 'aria-disabled': tk ? 'true' : null, tabindex: n === stop ? '0' : '-1',
        'aria-label': 'Seat ' + n + ', ' + (win ? 'window' : 'aisle') + (tk ? ', taken' : ''), text: String(n)
      }));
    }
    $('seat-info').textContent = seatInfoText();
    if (focusN) { var f = box.querySelector('[data-n="' + focusN + '"]'); if (f) f.focus(); }
  }
  $('seats').addEventListener('click', function (ev) {
    var b = ev.target.closest('.seat'); if (!b) return;
    var n = +b.getAttribute('data-n');
    seatFocus = n;
    if (isTaken(S.car, n)) { renderSeats(n); return; }
    var i = S.seats.indexOf(n);
    if (i >= 0) S.seats.splice(i, 1);
    else { if (S.seats.length >= totalPax()) S.seats.shift(); S.seats.push(n); }
    renderSeats(n);
  });
  $('seats').addEventListener('keydown', function (ev) {
    var b = ev.target.closest('.seat'); if (!b) return;
    var n = +b.getAttribute('data-n'), c = (n - 1) % 4;
    var t = { ArrowLeft: c > 0 ? n - 1 : null, ArrowRight: c < 3 ? n + 1 : null, ArrowUp: n - 4, ArrowDown: n + 4, Home: n - c, End: n - c + 3 }[ev.key];
    if (t === undefined) return;
    ev.preventDefault();
    if (t == null || t < 1 || t > 48) return;
    seatFocus = t;
    Array.prototype.forEach.call($('seats').children, function (s) { s.tabIndex = +s.getAttribute('data-n') === t ? 0 : -1; });
    $('seats').querySelector('[data-n="' + t + '"]').focus();
  });

  // ===== STEP 4 : extras + name =====
  var xBtn = $('x-btn'), xPanel = $('x-panel'), xByHover = false, hoverT = null;
  var xInputs = {};
  EXTRAS.forEach(function (x) {
    var input = el('input', { type: 'checkbox', name: 'extra', value: x[0] });
    input.checked = !!S.extras[x[0]];
    input.addEventListener('change', function () { S.extras[x[0]] = input.checked; renderExtras(); });
    xInputs[x[0]] = input;
    xPanel.appendChild(el('label', { className: 'xItem' }, [input, el('span', { className: 'xL', text: x[1] }), el('span', { className: 'xP', text: x[2] })]));
  });
  function renderExtras() {
    var sum = $('x-sum'); sum.innerHTML = '';
    var on = EXTRAS.filter(function (x) { return S.extras[x[0]]; });
    sum.appendChild(el('span', { text: on.length ? 'Selected:' : 'No extras selected' }));
    on.forEach(function (x) { sum.appendChild(el('span', { className: 'chip', text: x[1] + ' added' })); });
  }
  function setExtras(open) { xPanel.hidden = !open; xBtn.setAttribute('aria-expanded', String(open)); }
  xBtn.addEventListener('click', function () {
    if (!xPanel.hidden && xByHover) { xByHover = false; return; } // opened by hover: a click keeps it open
    xByHover = false;
    setExtras(xPanel.hidden);
  });
  // Mouse users can also open the list by resting on the button. It then stays
  // open until the button is pressed again or Escape is pressed.
  xBtn.addEventListener('pointerenter', function (ev) {
    if (ev.pointerType !== 'mouse' || !xPanel.hidden) return;
    clearTimeout(hoverT);
    hoverT = setTimeout(function () { if (xPanel.hidden) { xByHover = true; setExtras(true); } }, 150);
  });
  xBtn.addEventListener('pointerleave', function () { clearTimeout(hoverT); });
  $('xw').addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape' && !xPanel.hidden) { ev.preventDefault(); xByHover = false; setExtras(false); xBtn.focus(); }
  });
  renderExtras();
  $('lead').addEventListener('input', function () {
    S.name = $('lead').value;
    if ($('lead').getAttribute('aria-invalid') === 'true' && S.name.trim().length > 1) $('lead').setAttribute('aria-invalid', 'false');
  });

  // ===== STEP 5 : review =====
  function price() {
    var d = DEPS.filter(function (x) { return x[0] === S.time; })[0]; var base = d ? d[3] : 0;
    var t = 0; PAX.forEach(function (p) { t += S.pax[p[0]] * base * p[3]; });
    if (S.trip === 'R') t *= 1.8;
    if (S.extras.BIKE) t += 9; if (S.extras.MEAL) t += 32 * totalPax(); if (S.extras.LUG) t += 15; if (S.extras.INS) t += 12 * totalPax();
    return t.toFixed(2).replace('.', ',');
  }
  function renderReview() {
    var dep = DEPS.filter(function (x) { return x[0] === S.time; })[0];
    var rows = [
      ['Trip', S.trip === 'O' ? 'One-way' : 'Return'],
      ['Route', stName(S.from) + ' → ' + stName(S.to)],
      ['Date', S.date ? shortDate(S.date) : ''],
      ['Train', S.time ? S.time + (dep ? ' · ' + dep[1] : '') : ''],
      ['Passengers', PAX.filter(function (x) { return S.pax[x[0]]; }).map(function (x) { return S.pax[x[0]] + ' × ' + x[1]; }).join(', ')],
      ['Seats', 'Carriage ' + S.car + ', seats ' + S.seats.slice().sort(function (a, b) { return a - b; }).join(' & ')],
      ['Extras', EXTRAS.filter(function (x) { return S.extras[x[0]]; }).map(function (x) { return x[1]; }).join(', ') || 'None'],
      ['Name', S.name.trim()],
      ['Total', price() + ' zł']
    ];
    var rv = $('rv'); rv.innerHTML = '';
    rows.forEach(function (r) { rv.appendChild(el('dt', { text: r[0] })); rv.appendChild(el('dd', { text: r[1] })); });
    $('pay').textContent = 'Pay ' + price() + ' zł';
  }
  $('promo-apply').addEventListener('click', function () {
    var v = $('promo-code').value.trim();
    $('promo-msg').textContent = v ? 'The promo code "' + v + '" is not valid. Your price has not changed.' : 'Enter a promo code first.';
  });
  $('pay').addEventListener('click', function () {
    S.name = $('lead').value;
    $('code').textContent = code(S);
    go(6);
  });

  // ---------- hold timer (can be switched off) ----------
  var HOLD = 90000, holdEnd = 0, holdT = null, warned = false;
  function fmt(sec) { return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0'); }
  function tickHold() {
    var left = Math.max(0, holdEnd - Date.now()), sec = Math.ceil(left / 1000);
    $('hold-text').textContent = 'Fares and seats held for ' + fmt(sec);
    $('hold-text').classList.toggle('low', sec <= 20);
    if (sec <= 20 && !warned) {
      warned = true;
      $('hold-alert').textContent = 'Less than 20 seconds left to finish your booking. Choose "Turn off time limit" to keep your selection.';
    }
    if (left <= 0) {
      clearInterval(holdT);
      try { sessionStorage.setItem('rg-exp', '1'); } catch (e) {}
      location.reload();
    }
  }
  function startHold() {
    holdEnd = Date.now() + HOLD; warned = false; clearInterval(holdT);
    holdT = setInterval(tickHold, 250); tickHold();
    $('hold-off').hidden = false;
    $('hold-how').textContent = 'There is a time limit. You can turn it off with the "Turn off time limit" button just before this heading.';
    setTimeout(function () { $('hold-note').textContent = 'Fares and seats are held for 1 minute 30 seconds. You can turn off this time limit with the \"Turn off time limit\" button at the top of the booking form.'; }, 400);
  }
  function stopHold() { clearInterval(holdT); holdT = null; $('hold-how').textContent = ''; $('hold-off').hidden = true; $('hold-alert').textContent = ''; $('hold-text').textContent = ''; }
  $('hold-off').addEventListener('click', function () {
    clearInterval(holdT); holdT = null;
    $('hold-off').hidden = true;
    $('hold-text').classList.remove('low');
    $('hold-text').textContent = 'Time limit off: your fares and seats are held until you finish.';
    $('hold-alert').textContent = ''; $('hold-note').textContent = ''; $('hold-how').textContent = '';
    $('hold-off').blur(); $('t' + S.step).focus();
  });
  try {
    if (sessionStorage.getItem('rg-exp')) {
      sessionStorage.removeItem('rg-exp');
      $('hold-alert').textContent = 'Your session expired and your selection was released. Please start again.';
    }
  } catch (e) {}

  // ---------- header menu ----------
  var menuBtn = $('menu-btn'), menu = $('menu');
  function setMenu(open) { menu.hidden = !open; menuBtn.setAttribute('aria-expanded', String(open)); }
  menuBtn.addEventListener('click', function () { setMenu(menu.hidden); });
  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape' && !menu.hidden) { setMenu(false); menuBtn.focus(); }
  });
  document.addEventListener('click', function (ev) {
    if (!menu.hidden && !ev.target.closest('.menu-wrap')) setMenu(false);
  });

  // ---------- newsletter ----------
  $('nl').addEventListener('submit', function (ev) {
    ev.preventDefault();
    var email = $('nl-email'), msg = $('nl-msg'), ok = $('nl-consent');
    var valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());
    email.setAttribute('aria-invalid', String(!valid));
    msg.classList.toggle('bad', !valid || !ok.checked);
    if (!valid) { msg.textContent = 'Enter a valid e-mail address, like name@example.com.'; return; }
    if (!ok.checked) { msg.textContent = 'Tick “I agree to receive offers” to subscribe.'; return; }
    msg.textContent = 'Thank you! Check your inbox to confirm your subscription.';
  });

  // ---------- cookie consent (modal sheet) ----------
  var ck = $('ck');
  var behind = [document.querySelector('.hdr'), $('main'), document.querySelector('.ftr'), document.querySelector('.skip')];
  function closeCk() {
    if (ck.open) ck.close();
    behind.forEach(function (e) { e.removeAttribute('inert'); e.removeAttribute('aria-hidden'); });
    startHold();
    $('t' + S.step).focus();
  }
  $('ck-nec').addEventListener('click', closeCk);
  $('ck-all').addEventListener('click', closeCk);
  ck.addEventListener('cancel', function (ev) { ev.preventDefault(); closeCk(); }); // Escape = necessary cookies only
  behind.forEach(function (e) { e.setAttribute('inert', ''); e.setAttribute('aria-hidden', 'true'); });
  if (typeof ck.showModal === 'function') ck.showModal(); else ck.setAttribute('open', '');
  ck.focus();

  go(1);
  ck.focus();
})();
