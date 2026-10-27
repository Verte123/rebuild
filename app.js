/* Rebuild — app shell, views and charts */
(function () {
  'use strict';
  const E = window.Engine;
  const KEY = 'rebuild.v1', UIKEY = 'rebuild.ui';
  const DAY = E.DAY;
  const $ = s => document.querySelector(s);
  const view = $('#view');

  /* ------------------------------------------------------------ storage */
  function load() {
    try { return E.normalise(JSON.parse(localStorage.getItem(KEY))); } catch (e) { return E.newState(); }
  }
  let state = load();
  let ui = Object.assign({ tab: 'train', minutes: 45, focus: 'auto', readiness: 'normal', progressEx: null, tables: {}, summary: null }, readUi());
  ui.dash = false; ui.preview = null;
  ui.summary = null;
  function readUi() { try { return JSON.parse(localStorage.getItem(UIKEY)) || {}; } catch (e) { return {}; } }
  let saveTimer = null;
  const Cloud = window.Cloud && window.Cloud.available ? window.Cloud : null;
  function write(noUpload) {
    if (Cloud) Cloud.stamp(state, Date.now());
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
      localStorage.setItem(UIKEY, JSON.stringify({ tab: ui.tab, minutes: ui.minutes, focus: ui.focus, readiness: ui.readiness, progressEx: ui.progressEx }));
    } catch (e) { toast('Could not save: this browser is blocking storage.'); }
    if (Cloud && !noUpload) Cloud.schedule();
  }
  function save(now) { clearTimeout(saveTimer); if (now) write(); else saveTimer = setTimeout(write, 120); }
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') write();
    else { tickRest(); requestWake(); }
  });
  window.addEventListener('pagehide', write);
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) { /* not supported */ }

  /* ------------------------------------------------------------ helpers */
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const f = E.fmt;
  const ex = id => E.exById(state, id);
  const dShort = t => new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const dLong = t => new Date(t).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  const clock = ms => { const s = Math.max(0, Math.round(ms / 1000)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  const kg = n => Math.round(n).toLocaleString('en-GB');
  function unitLabel(e) {
    return { plates: 'kg', barbell: 'kg', dumbbell: 'kg each', stack: 'stack', bodyweight: '+ kg', assist: 'assist' }[e.load] || 'kg';
  }
  function wText(e, w) {
    if (w == null) return '—';
    if (e.load === 'bodyweight') return w > 0 ? `bodyweight + ${f(w)} kg` : 'bodyweight';
    if (e.load === 'stack') return `${f(w)} on the stack`;
    if (e.load === 'assist') return `${f(w)} assistance`;
    if (e.load === 'dumbbell') return `${f(w)} kg each`;
    return `${f(w)} kg`;
  }
  function stepFor(e) {
    if (e.load === 'plates' || e.load === 'barbell' || e.load === 'bodyweight') return 2.5;
    return E.increment(state, e);
  }
  function toast(msg, ms) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('on');
    clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('on'), ms || 2600);
  }
  const ICON = {
    swap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4L4 7l3 3M4 7h12M17 20l3-3-3-3M20 17H8"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l10.5-6.5z"/></svg>',
    photo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="M21 16l-5-5-8 8"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>'
  };
  const SLOT_NAMES = {
    squat: 'Squat or hack squat', quad2: 'Leg press or split squat', quadIso: 'Leg extension', hinge: 'Hip hinge',
    hamIso: 'Leg curl', glute: 'Glutes', calf: 'Calves', core: 'Core', hPress: 'Chest press', iPress: 'Incline press',
    vPress: 'Shoulder press', chestIso: 'Chest fly', latRaise: 'Lateral raise', triceps: 'Triceps', vPull: 'Pulldown or chin-up',
    hRow: 'Row', row2: 'Second back exercise', rearDelt: 'Rear delts', biceps: 'Biceps', traps: 'Traps'
  };

  /* ------------------------------------------------------------ frame */
  function render() {
    document.querySelectorAll('.tabbar [data-tab]').forEach(b => b.setAttribute('aria-current', b.dataset.tab === ui.tab ? 'page' : 'false'));
    const dot = document.querySelector('.tabbar [data-tab="train"] .dot');
    if (state.active && ui.tab !== 'train') { if (!dot) document.querySelector('.tabbar [data-tab="train"]').insertAdjacentHTML('beforeend', '<span class="dot" aria-hidden="true"></span>'); }
    else if (dot) dot.remove();
    if (ui.tab === 'train') renderTrain();
    else if (ui.tab === 'history') renderHistory();
    else if (ui.tab === 'progress') renderProgress();
    else renderSetup();
    renderTop();
  }
  function renderTop() {
    const m = $('#topmeta');
    if (state.active && state.active.start) { m.innerHTML = `Session <span class="num" style="font-size:18px">${clock(Date.now() - state.active.start)}</span>`; return; }
    if (ui.tab === 'train' && !state.active) { m.textContent = ''; return; }
    const d = E.dashboard(state, Date.now());
    m.textContent = `${d.weekSessions} of ${d.goal} this week`;
  }
  setInterval(() => { if (state.active && state.active.start) renderTop(); }, 1000);
  window.addEventListener('scroll', () => $('#top').classList.toggle('scrolled', window.scrollY > 4), { passive: true });

  /* ------------------------------------------------------------ train: builder */
  function renderTrain() {
    if (ui.summary) return renderSummary();
    if (state.active && !ui.dash) return renderSession();
    renderDashboard();
  }

  function weekStrip(d) {
    const today = (new Date().getDay() + 6) % 7;
    const names = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    return `<div class="week" role="img" aria-label="${d.weekSessions} sessions this week">${names.map((n, k) => {
      const done = d.weekDays.includes(k);
      return `<span class="day${done ? ' done' : ''}${k === today ? ' today' : ''}"><i>${done ? ICON.check : ''}</i>${n}</span>`;
    }).join('')}</div>`;
  }

  function previewSession() {
    const key = [ui.minutes, ui.focus, ui.readiness, state.sessions.length, JSON.stringify(state.settings.equipment).length, Object.keys(state.prefs.excluded).length, state.settings.repFocus, new Date().toDateString()].join('|');
    if (!ui.preview || ui.previewKey !== key) {
      ui.preview = E.buildSession(state, { minutes: ui.minutes, focus: ui.focus, readiness: ui.readiness, now: Date.now() });
      ui.previewKey = key;
    }
    return ui.preview;
  }

  function renderDashboard() {
    const now = Date.now();
    const d = E.dashboard(state, now);
    const ms = E.muscleStatus(state, now);
    const opts = [20, 30, 40, 45, 60, 75];
    const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
    const volChange = d.lastWeekToDate ? Math.round((d.weekVolume - d.lastWeekToDate) / d.lastWeekToDate * 100) : null;
    let banners = '';
    if (!state.sessions.length) banners += `<div class="banner">Each exercise starts with a calibration: work up to a solid weight and the app takes it from there. First, untick any machines your gym lacks in <button class="linkish" data-tab="setup" style="padding:0">Setup</button>.</div>`;

    let next;
    if (state.active) {
      const a = state.active, doneEx = a.items.filter(it => it.log.some(x => x.done)).length;
      next = `<section class="next"><h3 class="next-title">${esc(E.sessionName(a))} in progress</h3>
        <p class="sub">${doneEx} of ${a.items.length} exercises started${a.start ? ', ' + clock(now - a.start) + ' so far' : ''}.</p>
        <button type="button" class="btn primary block" data-action="resume">Resume session</button></section>`;
    } else {
      const p = previewSession();
      const focuses = [['auto', 'Auto'], ['lower', 'Lower body'], ['upper', 'Upper body'], ['full', 'Full body'], ['push', 'Push'], ['pull', 'Pull']];
      next = `<section class="next">
        <div class="row" style="align-items:baseline"><h3 class="next-title grow">Next: ${esc(E.sessionName(p))}</h3><span class="small">about ${p.estMinutes} min</span></div>
        <p class="why" style="margin-top:4px">${esc(p.focusReason)}</p>
        <p class="lbl" style="margin-top:10px">How long have you got?</p>
        <div class="minutes" role="group" aria-label="Minutes available">
          ${opts.map(m => `<button type="button" data-action="minutes" data-v="${m}" aria-pressed="${ui.minutes === m}">${m}</button>`).join('')}
        </div>
        <div class="seg" role="group" aria-label="Readiness" style="margin:10px 0 12px">
          <button type="button" data-action="readiness" data-v="normal" aria-pressed="${ui.readiness === 'normal'}">Ready to train</button>
          <button type="button" data-action="readiness" data-v="flat" aria-pressed="${ui.readiness === 'flat'}">Flat today</button>
        </div>
        <button type="button" class="btn primary block big" data-action="start-next">Start next session</button>
        <ol class="plan" aria-label="Today's plan">${p.items.map(it => { const e = ex(it.exId); return `<li><span class="grow">${esc(e.name)}${it.superset === 'b' ? ' <span class="small">(superset)</span>' : ''}</span><span class="pt">${it.mode === 'calibrate' ? 'calibration' : `${it.sets} × ${it.lo}–${it.hi}${it.weight ? ' at ' + esc(wShort(e, it.weight)) : ''}`}</span></li>`; }).join('')}</ol>
        <details class="focusbox"${ui.focus !== 'auto' ? ' open' : ''}><summary>Change focus${ui.focus !== 'auto' ? ': ' + esc(focuses.find(x => x[0] === ui.focus)[1].toLowerCase()) : ''}</summary>
          <div class="chips" role="group" aria-label="Focus">${focuses.map(([k, l]) => `<button type="button" class="chip" data-action="focus" data-v="${k}" aria-pressed="${ui.focus === k}">${esc(l)}</button>`).join('')}</div>
        </details>
      </section>`;
    }

    const last = d.last;
    const lastT = last ? (last.totals || E.sessionTotals(state, last)) : null;
    view.innerHTML = `
      <p class="sub" style="margin:14px 0 0">${today}</p>
      <div class="row" style="align-items:baseline;margin-top:2px"><h2 class="grow" style="margin:0">This week</h2><span class="sub"><b class="num" style="font-size:22px;color:var(--ink)">${d.weekSessions}</b> of ${d.goal} sessions</span></div>
      ${weekStrip(d)}
      <div class="tiles">
        <div class="tile"><span>Sets</span><b>${d.weekSets}</b></div>
        <div class="tile"><span>Volume</span><b>${compact(d.weekVolume)}<small> kg</small></b>${volChange != null ? `<em class="${volChange >= 0 ? 'up' : 'down'}">${volChange >= 0 ? '+' : '−'}${Math.abs(volChange)}% on this point last week</em>` : ''}</div>
        <div class="tile"><span>Streak</span><b>${d.streak}<small> wk${d.streak === 1 ? '' : 's'}</small></b><em>at ${d.goal}+ a week</em></div>
      </div>
      ${banners}
      ${next}
      <div class="duo">
        <div class="panel tight"><p class="lbl">Last session</p>${last ? `<p class="strong">${esc(E.sessionName(last))}</p><p class="small">${dShort(last.end)}${lastT.minutes != null ? ', ' + lastT.minutes + ' min' : ''}, ${lastT.sets} sets</p>` : '<p class="small">None yet</p>'}</div>
        <div class="panel tight"><p class="lbl">Latest best</p>${d.pr && ex(d.pr.exId) ? `<p class="strong">${esc(ex(d.pr.exId).name)}</p><p class="small">${d.pr.kind === 'e1rm' ? f(d.pr.value) + ' kg est. max' : d.pr.value + ' reps'}, ${dShort(d.pr.t)}</p>` : '<p class="small">Appears once you beat an earlier lift</p>'}</div>
      </div>
      <h4>Recovery</h4>
      <div class="panel"><div class="recov">${ms.map(recovRow).join('')}</div>
      <p class="small" style="margin-top:10px">Based on when each muscle group last worked and how many sets it did.</p></div>
      <p class="cloudline" id="cloudline">${cloudLine()}</p>`;
  }
  function wShort(e, w) {
    if (e.load === 'bodyweight') return w > 0 ? `+${f(w)} kg` : 'bodyweight';
    if (e.load === 'stack') return `${f(w)} stack`;
    if (e.load === 'assist') return `${f(w)} assist`;
    if (e.load === 'dumbbell') return `${f(w)} kg each`;
    return `${f(w)} kg`;
  }
  function recovRow(m) {
    const pct = Math.round(m.recovery * 100);
    let when;
    if (m.last == null) when = 'Not trained yet';
    else if (m.recovery >= 0.999) when = 'Ready';
    else { const h = m.readyIn; when = h < 20 ? `Ready in ${Math.max(1, Math.round(h))} h` : `Ready in ${Math.round(h / 24) <= 1 ? 'a day' : Math.round(h / 24) + ' days'}`; }
    return `<span>${m.name}</span><div class="bar" role="img" aria-label="${m.name} ${pct}% recovered"><i class="${pct >= 100 ? 'ready' : ''}" style="width:${pct}%"></i></div><span class="when">${when}</span>`;
  }

  /* ------------------------------------------------------------ train: session */
  function renderSession() {
    const s = state.active;
    const n = s.items.length;
    const rirText = 'Finish each set with one or two reps left in reserve.';
    view.innerHTML = `
      <button type="button" class="back" data-action="to-dash">‹ Dashboard</button>
      <div class="sess-head">
        <h2 style="margin:4px 0 2px">${esc(E.sessionName(s))}${s.deload ? ' (deload)' : ''}</h2>
        <p class="sub">About ${s.estMinutes} minutes, ${n} exercise${n === 1 ? '' : 's'}. ${rirText}</p>
        <p class="why">${esc(s.focusReason)}${s.start ? '' : ' The session clock starts when you tick your first set.'}</p>
      </div>
      <div class="panel" style="padding:12px 14px"><p class="small" style="margin:0;color:var(--ink-2)">Warm-up, ${s.warmup} minutes: easy bike or rower, then a couple of light ramp-up sets on the first exercise.</p></div>
      <div id="items">${s.items.map((it, i) => exBlock(it, i)).join('')}</div>
      <div class="row" style="margin:8px 0 16px"><button type="button" class="btn grow" data-action="add-ex">Add an exercise</button></div>
      <button type="button" class="btn primary block" data-action="finish">Finish and save</button>
      <div class="row" style="justify-content:center;margin-top:8px"><button type="button" class="btn ghost danger" data-action="discard">Discard this session</button></div>`;
  }

  function exBlock(it, i) {
    const e = ex(it.exId);
    if (!e) return '';
    const s = state.active;
    const done = it.log.filter(x => x.done).length;
    const cal = it.mode === 'calibrate';
    const target = cal
      ? `<span class="tag">Calibration</span><b>${it.sets} sets</b>, working up to about <b>${it.lo + 2}</b> reps`
      : `<b>${it.sets} × ${it.lo}–${it.hi}</b> at <b>${esc(wText(e, it.weight))}</b>`;
    let pair = '';
    if (it.superset === 'a') pair = '<div class="pair">Superset: alternate sets with the next exercise, then rest</div>';
    if (it.superset === 'b') pair = '<div class="pair">Superset with the exercise above</div>';
    const last = E.performances(state, e.id).slice(-1)[0];
    const lastText = last ? `Last time, ${dShort(last.date)}: ${lastSets(last.sets)}${last.effort ? ' (last set ' + last.effort + ')' : ''}` : '';
    const pw = it.log.find(x => !x.done && x.w > 0) || it.log.find(x => x.w > 0);
    const plateW = pw ? pw.w : it.weight;
    return `<section class="ex ${it.superset ? 'superset-' + it.superset : ''}" id="ex-${i}">
      ${pair}
      <h3>${esc(e.name)}</h3>
      <p class="eqname">${esc(E.equipmentLabel(e, state.settings))}${e.uni ? ', one side at a time' : ''}</p>
      <div class="pills"><button type="button" class="pill" data-action="howto" data-ex="${e.id}">${ICON.info}How to</button><button type="button" class="pill" data-action="swap" data-i="${i}">${ICON.swap}Swap</button></div>
      <p class="target">${target}</p>
      <p class="why">${esc(it.reason)}</p>
      ${plateDiagram(e, plateW)}
      <div class="set-head"><span></span><span>${unitLabel(e)}</span><span>reps</span><span></span></div>
      <div class="sets">${it.log.map((x, k) => setRow(it, i, x, k, e)).join('')}</div>
      ${done ? effortRow(it, i) : ''}
      ${lastText ? `<p class="last">${esc(lastText)}</p>` : ''}
      <div class="ex-foot"><button type="button" class="linkish" data-action="add-set" data-i="${i}">Add a set</button>${it.log.length > 1 ? `<button type="button" class="linkish" data-action="del-set" data-i="${i}">Remove last set</button>` : ''}</div>
    </section>`;
  }
  function lastSets(sets) {
    const same = sets.every(x => x.w === sets[0].w);
    return same ? `${f(sets[0].w)} × ${sets.map(x => x.r).join(', ')}` : sets.map(x => `${f(x.w)}×${x.r}`).join(', ');
  }
  function setRow(it, i, x, k, e) {
    const tgt = it.target[k] != null ? it.target[k] : it.lo;
    const wph = it.mode === 'calibrate' ? '' : (it.weight != null ? f(it.weight) : '');
    return `<div class="set ${x.done ? 'done' : ''}" data-i="${i}" data-k="${k}">
      <span class="n">${k + 1}</span>
      <div class="stepper"><button type="button" data-action="w-" aria-label="Less weight">−</button><input type="text" inputmode="decimal" data-field="w" value="${x.w != null ? f(x.w) : ''}" placeholder="${wph}" aria-label="Set ${k + 1} weight"><button type="button" data-action="w+" aria-label="More weight">+</button></div>
      <div class="stepper"><button type="button" data-action="r-" aria-label="Fewer reps">−</button><input type="text" inputmode="numeric" data-field="r" value="${x.r != null ? x.r : ''}" placeholder="${tgt}" aria-label="Set ${k + 1} reps"><button type="button" data-action="r+" aria-label="More reps">+</button></div>
      <button type="button" class="tick" data-action="tick" aria-pressed="${x.done}" aria-label="Set ${k + 1} done">${ICON.check}</button>
    </div>`;
  }
  function effortRow(it, i) {
    const v = it.effort;
    return `<div class="effort"><span>Last set felt</span><div class="seg" role="group" aria-label="How hard was the last set">
      ${[['easy', 'Easy', '4+ left'], ['solid', 'Solid', '2–3 left'], ['hard', 'Hard', '0–1 left']].map(([k, l, d]) => `<button type="button" data-action="effort" data-i="${i}" data-v="${k}" aria-pressed="${v === k}" aria-label="${l}, ${d}" style="line-height:1.15;padding:4px 0">${l}<br><span style="font-size:12px;font-weight:400;color:var(--ink-3)">${d}</span></button>`).join('')}
    </div></div>`;
  }

  function plateDiagram(e, total) {
    const pb = E.plateBreakdown(state, e, total);
    if (!pb || !pb.plates.length) return '';
    const H = { 25: 56, 20: 56, 15: 50, 10: 42, 5: 30, 2.5: 24, 1.25: 20 }, Wd = { 25: 10, 20: 9, 15: 8, 10: 7, 5: 6, 2.5: 5, 1.25: 4 };
    const col = { 25: 'var(--p25)', 20: 'var(--p20)', 15: 'var(--p15)', 10: 'var(--p10)', 5: 'var(--p5)', 2.5: 'var(--p25s)', 1.25: 'var(--p125)' };
    let x = 12, rects = '';
    pb.plates.forEach(p => {
      const h = H[p] || 30, w = Wd[p] || 6;
      rects += `<rect x="${x}" y="${30 - h / 2}" width="${w}" height="${h}" rx="2" fill="${col[p] || 'var(--ink-3)'}" stroke="${p === 5 ? 'var(--ink-3)' : 'none'}" stroke-width="1"/>`;
      x += w + 2;
    });
    const width = Math.max(x + 14, 60);
    const svg = `<svg width="${width}" height="60" viewBox="0 0 ${width} 60" aria-hidden="true"><rect x="0" y="22" width="10" height="16" rx="2" fill="var(--sleeve)"/><rect x="10" y="27" width="${width - 10}" height="6" rx="3" fill="var(--sleeve)"/>${rects}</svg>`;
    const words = pb.plates.map(p => f(p)).join(' + ');
    const lead = e.load === 'barbell' ? `Bar ${f(pb.bar)} kg, then each side:` : 'Each side:';
    return `<div class="plates">${svg}<div class="txt">${lead}<br><b>${words}</b>${pb.remainder ? `<br><span class="small">${f(pb.remainder)} kg per side can't be made with your plates</span>` : ''}</div></div>`;
  }

  function rerenderItem(i) {
    const el = document.getElementById('ex-' + i);
    if (!el) return renderSession();
    el.outerHTML = exBlock(state.active.items[i], i);
  }

  /* ------------------------------------------------------------ rest timer */
  let rest = null, audio = null;
  function startRest(seconds, label) {
    rest = { end: Date.now() + seconds * 1000, total: seconds * 1000, label, beeped: false };
    tickRest();
  }
  function tickRest() {
    const bar = $('#restbar');
    if (!rest) { bar.classList.remove('on', 'done'); document.body.classList.remove('resting'); return; }
    const left = rest.end - Date.now();
    bar.classList.add('on'); document.body.classList.add('resting');
    if (left <= 0) {
      bar.classList.add('done');
      $('#resttime').textContent = 'Go';
      $('#restlab').textContent = 'Rest over: next set';
      $('#restprog').style.width = '100%';
      if (!rest.beeped) { rest.beeped = true; beep(); setTimeout(() => { if (rest && rest.end <= Date.now()) { rest = null; tickRest(); } }, 6000); }
      return;
    }
    bar.classList.remove('done');
    $('#resttime').textContent = clock(left);
    $('#restlab').textContent = rest.label;
    $('#restprog').style.width = (100 * (1 - left / rest.total)) + '%';
  }
  setInterval(tickRest, 250);
  function unlockAudio() {
    if (audio || !state.settings.beep) return;
    try {
      audio = new (window.AudioContext || window.webkitAudioContext)();
      // play a silent blip inside this tap so iOS allows sound later
      const o = audio.createOscillator(), g = audio.createGain(); g.gain.value = 0.0001;
      o.connect(g); g.connect(audio.destination); o.start(); o.stop(audio.currentTime + 0.02);
      if (audio.state === 'suspended') audio.resume();
    } catch (e) { audio = null; }
  }
  function beep() {
    if (!audio || !state.settings.beep) return;
    try {
      if (audio.state === 'suspended') audio.resume();
      [0, 0.22].forEach(d => {
        const o = audio.createOscillator(), g = audio.createGain();
        o.frequency.value = 880; o.connect(g); g.connect(audio.destination);
        const t = audio.currentTime + d;
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.25, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
        o.start(t); o.stop(t + 0.18);
      });
    } catch (e) { /* audio unavailable */ }
  }

  /* ------------------------------------------------------------ wake lock */
  let wake = null;
  async function requestWake() {
    if (!(state.active && state.active.start && state.settings.keepAwake && 'wakeLock' in navigator) || wake) return;
    try { wake = await navigator.wakeLock.request('screen'); wake.addEventListener('release', () => { wake = null; }); } catch (e) { wake = null; }
  }
  function releaseWake() { try { if (wake) wake.release(); } catch (e) { /* ignore */ } wake = null; }

  /* ------------------------------------------------------------ session actions */
  function startSession() {
    if (!state.active.start) { state.active.start = Date.now(); save(); requestWake(); }
  }
  function onTick(i, k) {
    const s = state.active, it = s.items[i], x = it.log[k], e = ex(it.exId);
    unlockAudio();
    if (x.done) { x.done = false; save(); rerenderItem(i); return; }
    // read whatever is in the inputs now
    const row = document.querySelector(`.set[data-i="${i}"][data-k="${k}"]`);
    if (row) {
      const wv = parseFloat(row.querySelector('[data-field="w"]').value.replace(',', '.'));
      const rv = parseInt(row.querySelector('[data-field="r"]').value, 10);
      x.w = isNaN(wv) ? x.w : wv; x.r = isNaN(rv) ? x.r : rv;
    }
    if (x.w == null) {
      if (e.load === 'bodyweight') x.w = 0;
      else if (it.mode !== 'calibrate' && it.weight != null) x.w = it.weight;
      else { toast('Enter the weight for this set first.'); if (row) row.querySelector('[data-field="w"]').focus(); return; }
    }
    if (x.r == null) x.r = it.target[k] != null ? it.target[k] : it.lo;
    x.done = true;
    startSession();
    // calibration: suggest the next step up
    if (it.mode === 'calibrate' && it.log[k + 1] && it.log[k + 1].w == null && !it.log[k + 1].done) {
      const jump = e.load === 'bodyweight' ? 0 : (e.load === 'assist' ? -E.increment(state, e) : E.increment(state, e) * 2);
      it.log[k + 1].w = Math.max(0, E.roundLoad(state, e, x.w + jump, 'nearest'));
    }
    // carry an edited weight forward to later unticked sets
    if (it.mode !== 'calibrate') it.log.slice(k + 1).forEach(n => { if (!n.done && (n.w == null || n.w === it.weight)) n.w = x.w; });
    save();
    rerenderItem(i);
    const rs = it.mode === 'calibrate' ? 90 : (e.kind === 'compound' ? state.settings.restCompound : state.settings.restIsolation);
    if (it.superset === 'a') { rest = null; tickRest(); toast('Now the paired exercise, then rest.'); return; }
    const allDone = it.log.every(n => n.done);
    const next = s.items[i + 1];
    startRest(rs, allDone ? (next ? `Next: ${ex(next.exId).name}` : 'Last exercise done') : `Rest, then set ${k + 2}`);
  }

  function openSheet(html) { $('#sheetbody').innerHTML = html; $('#sheet').classList.add('on'); $('#scrim').classList.add('on'); $('#sheet').scrollTop = 0; }
  function closeSheet() { $('#sheet').classList.remove('on'); $('#scrim').classList.remove('on'); }
  $('#scrim').addEventListener('click', closeSheet);

  function swapSheet(i, showAll) {
    const it = state.active.items[i], e = ex(it.exId);
    const { top, rest } = E.topAlternatives(state, state.active, i, Date.now(), 3);
    const machines = machineIds(e);
    const card = a => {
      const last = E.performances(state, a.id).slice(-1)[0];
      return `<div class="alt"><button type="button" class="alt-main" data-action="swap-to" data-i="${i}" data-ex="${a.id}"><b>${esc(a.name)}</b><span>${esc(E.equipmentLabel(a, state.settings))}</span><span class="small">${last ? 'Last done ' + dShort(last.date) + ': ' + esc(lastSets(last.sets)) : 'New to you: starts with a calibration'}</span></button>
        <button type="button" class="alt-how" data-action="howto" data-ex="${a.id}" data-back="${i}" aria-label="How to do ${esc(a.name)}">${ICON.info}</button></div>`;
    };
    openSheet(`<h3 style="margin-bottom:2px">Swap ${esc(e.name)}</h3><p class="small">Three alternatives that do the same job. Tap one to use it today.</p>
      ${top.length ? top.map(card).join('') : '<p class="sub">No alternatives with your current equipment.</p>'}
      ${rest.length ? (showAll ? `<h4>More options</h4>${rest.slice(0, 15).map(card).join('')}` : `<button type="button" class="linkish" data-action="swap-more" data-i="${i}">Show ${Math.min(rest.length, 15)} more options</button>`) : ''}
      <h4>Or</h4>
      ${machines.length ? `<button type="button" class="opt" data-action="not-at-gym" data-i="${i}"><b>My gym doesn't have this</b><span>Untick it in your equipment and swap now</span></button>` : ''}
      <button type="button" class="opt" data-action="exclude" data-i="${i}"><b>Never suggest this exercise</b><span>You can bring it back in Setup</span></button>
      <button type="button" class="opt" data-action="remove-item" data-i="${i}"><b>Remove from today</b><span>Just for this session</span></button>
      <div style="height:10px"></div><button type="button" class="btn block" data-action="close-sheet">Cancel</button>`);
  }

  function howSheet(exId, backTo) {
    const e = ex(exId); if (!e) return;
    const g = window.Guides.guide(e);
    const muscles = [E.MUSCLE[e.primary].name].concat((e.secondary || []).map(m => E.MUSCLE[m].name.toLowerCase())).join(', ');
    openSheet(`<h3 style="margin-bottom:2px">${esc(e.name)}</h3>
      <p class="small">${esc(E.equipmentLabel(e, state.settings))}. Works: ${esc(muscles)}.</p>
      <ol class="cues">${g.cues.map(c => `<li>${esc(c)}</li>`).join('')}</ol>
      ${g.note ? `<p class="why">${esc(g.note)}</p>` : ''}
      ${g.clip ? `<a class="clip" href="${g.clip.url}" target="_blank" rel="noopener"><span class="clip-play">${ICON.play}</span><span><b>${esc(g.clip.title)}</b><span>${esc(g.clip.channel)}, ${g.clip.year}</span></span></a>
        ${g.clip.note ? `<p class="small" style="margin:6px 0 0">${esc(g.clip.note)}</p>` : ''}` : ''}
      <div class="stack-gap" style="margin-top:12px">
        ${g.clip ? '' : `<a class="btn block" href="${g.video}" target="_blank" rel="noopener">${ICON.play}Watch video guides</a>`}
        ${g.machine ? `<a class="btn block" href="${g.machine}" target="_blank" rel="noopener">${ICON.photo}See photos of the machine</a>` : ''}
      </div>
      ${g.clip ? `<p class="small" style="margin-top:8px"><a href="${g.video}" target="_blank" rel="noopener" style="color:var(--accent)">More videos for “${esc(g.videoLabel)}”</a></p>` : `<p class="small" style="margin-top:8px">This opens a YouTube search for “${esc(g.videoLabel)}”. Pick a clip from a coach or channel you trust.</p>`}
      <div style="height:10px"></div>
      ${backTo != null ? `<button type="button" class="btn block" data-action="swap" data-i="${backTo}">Back to the alternatives</button>` : '<button type="button" class="btn block" data-action="close-sheet">Close</button>'}`);
  }
  function machineIds(e) {
    if (e.custom) return [];
    return [].concat.apply([], e.eq.filter(g => g.length === 1 && /^(w_|hs_|c_)/.test(g[0])).concat(e.eq.filter(g => g.length > 1 && g.every(id => /^w_/.test(id)))));
  }
  function bestReplacement(i) {
    const alts = E.alternatives(state, state.active, i, Date.now());
    return alts[0];
  }

  function addSheet(muscle) {
    muscle = muscle || ex(state.active.items[0] ? state.active.items[0].exId : 'pendulum').primary;
    const list = E.allExercises(state).filter(x => x.primary === muscle && E.isAvailable(x, state.settings) && !state.prefs.excluded[x.id] && !state.active.items.some(it => it.exId === x.id));
    openSheet(`<h3>Add an exercise</h3>
      <div class="chips" style="margin-top:10px">${E.MUSCLES.map(m => `<button type="button" class="chip" data-action="add-muscle" data-v="${m.id}" aria-pressed="${m.id === muscle}">${m.name}</button>`).join('')}</div>
      ${list.length ? list.map(x => `<button type="button" class="opt" data-action="add-to" data-ex="${x.id}"><b>${esc(x.name)}</b><span>${esc(E.equipmentLabel(x, state.settings))}</span></button>`).join('') : '<p class="sub" style="margin-top:12px">Nothing available for this group with your equipment.</p>'}
      <div style="height:10px"></div><button type="button" class="btn block" data-action="close-sheet">Cancel</button>`);
  }

  function finish() {
    const s = state.active;
    const logged = s.items.filter(it => it.log.some(x => x.done));
    if (!logged.length) { toast('Log at least one set, or discard the session.'); return; }
    const empty = s.items.length - logged.length;
    if (empty && !confirm(`${empty} exercise${empty === 1 ? ' has' : 's have'} no sets logged and will be left out. Save the session?`)) return;
    const now = Date.now();
    const fin = E.completeSession(state, s, now);
    fin.updatedAt = fin.end;
    E.commitSession(state, fin);
    ui.summary = fin.id; rest = null; tickRest(); releaseWake();
    save(true); render(); window.scrollTo(0, 0);
  }

  /* ------------------------------------------------------------ summary */
  function renderSummary() {
    const s = state.sessions.find(x => x.id === ui.summary);
    if (!s) { ui.summary = null; return renderTrain(); }
    const t = s.totals || E.sessionTotals(state, s);
    const words = { up: ['up', 'Weight goes up next time'], hold: ['hold', 'Same weight, aim for more reps'], miss: ['miss', 'Repeat the weight and aim for the range'], calibrated: ['cal', 'Calibrated: working weight set'], deload: ['deload', 'Deload done'] };
    view.innerHTML = `<h2>Session saved</h2>
      <p class="sub">${esc(E.sessionName(s))}, ${dLong(s.end)}</p>
      <div class="statline"><div><b>${t.minutes != null ? t.minutes : '—'}</b><span>minutes</span></div><div><b>${t.sets}</b><span>sets</span></div><div><b>${kg(t.volume)}</b><span>kg lifted</span></div></div>
      ${s.prs && s.prs.length ? `<h4>New bests</h4><div class="panel">${s.prs.map(p => `<div class="pr"><span>${esc(ex(p.exId).name)}</span><span class="num">${p.kind === 'e1rm' ? f(p.value) + ' kg est. max' : p.value + ' reps'}</span></div>`).join('')}</div>` : ''}
      <h4>What happens next time</h4>
      <div class="panel">${(s.results || []).map(r => { const w = words[r.outcome] || ['hold', r.outcome]; return `<div class="outcome"><span>${esc(ex(r.exId).name)}</span><span class="badge ${w[0]}">${w[1]}</span></div>`; }).join('')}</div>
      <button type="button" class="btn primary block" data-action="summary-done">Done</button>`;
  }

  /* ------------------------------------------------------------ history */
  function renderHistory() {
    const list = state.sessions.filter(s => s.end).sort((a, b) => b.end - a.end);
    if (!list.length) { view.innerHTML = `<h2>History</h2><div class="empty"><p>No sessions yet.</p><p class="sub">Build one on the Train tab. Every set you log appears here and feeds the next session.</p><button type="button" class="btn primary" data-tab="train">Go to Train</button></div>`; return; }
    let html = '<h2>History</h2>', month = '';
    list.forEach(s => {
      const m = new Date(s.end).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
      if (m !== month) { html += `<p class="month">${m}</p>`; month = m; }
      const t = s.totals || E.sessionTotals(state, s);
      const d = new Date(s.end);
      html += `<button type="button" class="hist" data-action="hist-open" data-id="${s.id}">
        <span class="d"><b>${d.getDate()}</b><span>${d.toLocaleDateString('en-GB', { weekday: 'short' })}</span></span>
        <span><b>${esc(E.sessionName(s))}${s.deload ? ' (deload)' : ''}</b><br><span class="small">${t.minutes != null ? t.minutes + ' min, ' : ''}${t.sets} sets, ${kg(t.volume)} kg</span></span>
        <span class="small">${s.prs && s.prs.length ? s.prs.length + ' best' + (s.prs.length > 1 ? 's' : '') : ''}</span></button>`;
    });
    view.innerHTML = html;
  }
  function histSheet(id, editing) {
    const s = state.sessions.find(x => x.id === id); if (!s) return;
    const body = s.items.map((it, i) => {
      const e = ex(it.exId); if (!e) return '';
      const sets = it.log.filter(x => x.done);
      if (!editing) return `<div class="outcome"><span><b>${esc(e.name)}</b>${it.mode === 'calibrate' ? ' <span class="small">(calibration)</span>' : ''}<br><span class="small">${esc(lastSets(sets.length ? sets : [{ w: 0, r: 0 }]))}${it.effort ? ', last set ' + it.effort : ''}</span></span></div>`;
      return `<div style="margin:12px 0"><b>${esc(e.name)}</b>${it.log.map((x, k) => x.done ? `<div class="row" style="margin-top:6px"><span class="small" style="width:44px">Set ${k + 1}</span><input type="text" inputmode="decimal" data-hfield="w" data-i="${i}" data-k="${k}" value="${f(x.w)}" aria-label="Weight"><input type="text" inputmode="numeric" data-hfield="r" data-i="${i}" data-k="${k}" value="${x.r}" aria-label="Reps"></div>` : '').join('')}</div>`;
    }).join('');
    openSheet(`<h3>${esc(E.sessionName(s))}</h3><p class="small">${dLong(s.end)}</p><div>${body}</div>
      <div style="height:12px"></div>
      ${editing ? `<button type="button" class="btn primary block" data-action="hist-save" data-id="${id}">Save changes</button>` : `<button type="button" class="btn block" data-action="hist-edit" data-id="${id}">Edit sets</button>`}
      <div class="row" style="margin-top:8px"><button type="button" class="btn ghost danger grow" data-action="hist-del" data-id="${id}">Delete session</button><button type="button" class="btn grow" data-action="close-sheet">Close</button></div>`);
  }

  /* ------------------------------------------------------------ progress */
  const charts = {};
  function chartW() { return Math.max(260, Math.min(560, document.documentElement.clientWidth) - 64); }
  function nice(lo, hi, n) {
    if (lo === hi) { lo = lo * 0.9; hi = hi * 1.1 || 1; }
    const step0 = (hi - lo) / n, mag = Math.pow(10, Math.floor(Math.log10(step0))), err = step0 / mag;
    const step = (err >= 7.5 ? 10 : err >= 3.5 ? 5 : err >= 1.5 ? 2 : 1) * mag;
    const a = Math.floor(lo / step) * step, b = Math.ceil(hi / step) * step, t = [];
    for (let v = a; v <= b + 1e-9; v += step) t.push(+v.toFixed(6));
    return t;
  }
  const compact = v => v >= 1000 ? (Math.round(v / 100) / 10).toString().replace(/\.0$/, '') + 'K' : f(v);

  function lineChart(id, pts, unit) {
    const W = chartW(), H = 210, m = { l: 40, r: 50, t: 14, b: 28 };
    if (!pts.length) return '<p class="small">No sessions logged for this exercise yet.</p>';
    let x0 = pts[0].t, x1 = pts[pts.length - 1].t; if (x1 === x0) { x0 -= 3 * DAY; x1 += 3 * DAY; }
    const vs = pts.map(p => p.v), ticks = nice(Math.min.apply(null, vs), Math.max.apply(null, vs), 4);
    const y0 = ticks[0], y1 = ticks[ticks.length - 1];
    const X = t => m.l + (t - x0) / (x1 - x0) * (W - m.l - m.r), Y = v => H - m.b - (v - y0) / ((y1 - y0) || 1) * (H - m.t - m.b);
    const P = pts.map(p => Object.assign({ x: X(p.t), y: Y(p.v) }, p));
    charts[id] = { pts: P, unit, W, H, m };
    const line = P.map((p, i) => (i ? 'L' : 'M') + p.x.toFixed(1) + ' ' + p.y.toFixed(1)).join(' ');
    const area = line + ` L${P[P.length - 1].x.toFixed(1)} ${H - m.b} L${P[0].x.toFixed(1)} ${H - m.b} Z`;
    const last = P[P.length - 1];
    return `<div class="chart" data-chart="${id}"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Line chart, ${pts.length} sessions">
      ${ticks.map(v => `<line x1="${m.l}" x2="${W - m.r}" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--grid)" stroke-width="1"/><text x="${m.l - 6}" y="${Y(v) + 4}" text-anchor="end" font-size="11" fill="var(--muted)">${compact(v)}</text>`).join('')}
      <line x1="${m.l}" x2="${W - m.r}" y1="${H - m.b}" y2="${H - m.b}" stroke="var(--axis)" stroke-width="1"/>
      <text x="${m.l}" y="${H - 8}" font-size="11" fill="var(--muted)">${dShort(pts[0].t)}</text>
      ${pts.length > 1 ? `<text x="${W - m.r}" y="${H - 8}" font-size="11" fill="var(--muted)" text-anchor="end">${dShort(pts[pts.length - 1].t)}</text>` : ''}
      <path d="${area}" fill="var(--series-wash)"/>
      <path d="${line}" fill="none" stroke="var(--series)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
      <line class="xh" x1="0" x2="0" y1="${m.t}" y2="${H - m.b}" stroke="var(--ink-3)" stroke-width="1" visibility="hidden"/>
      ${P.map(p => `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="4.5" fill="${p.deload ? 'var(--surface)' : 'var(--series)'}" stroke="${p.deload ? 'var(--series)' : 'var(--surface)'}" stroke-width="2"/>`).join('')}
      <text x="${last.x + 9}" y="${last.y + 4}" font-size="13" font-weight="600" fill="var(--ink)">${f(last.v)}${unit ? ' ' + unit : ''}</text>
    </svg><div class="tip"></div></div>`;
  }

  function muscleBars(ms) {
    const W = chartW(), rowH = 28, lab = 86, H = ms.length * rowH + 6, valW = 58;
    const max = Math.max.apply(null, ms.map(m => Math.max(m.weekSets, m.target * 1.25)));
    const X = v => lab + Math.min(v, max) / max * (W - lab - valW - 8);
    const rows = ms.map((m, i) => {
      const y = 4 + i * rowH, h = 14, w = Math.max(0, X(m.weekSets) - lab);
      const bar = w > 0 ? `<path d="M${lab} ${y} h${Math.max(0, w - 4)} a4 4 0 0 1 4 4 v${h - 8} a4 4 0 0 1 -4 4 h${-Math.max(0, w - 4)} z" fill="var(--series)"/>` : '';
      return `<g><title>${m.name}: ${m.weekSets} sets in the last 7 days, target about ${m.target}</title>
        <text x="0" y="${y + 11}" font-size="13" fill="var(--ink-2)">${m.name}</text>
        ${bar}
        <line x1="${X(m.target)}" x2="${X(m.target)}" y1="${y - 3}" y2="${y + h + 3}" stroke="var(--ink)" stroke-width="2"/>
        <text x="${W}" y="${y + 11}" font-size="13" text-anchor="end" fill="var(--ink)"><tspan font-weight="600">${f(m.weekSets)}</tspan><tspan fill="var(--ink-3)"> of ${m.target}</tspan></text></g>`;
    }).join('');
    return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Sets per muscle group in the last seven days">${rows}</svg></div>
      <div class="legend"><span><i style="background:var(--series)"></i>Sets done (secondary muscles count half)</span><span><i style="background:none;border-left:2px solid var(--ink);border-radius:0;width:2px"></i>Weekly target</span></div>`;
  }

  function heatmap() {
    const W = chartW(), weeks = 12, now = Date.now();
    const map = E.dailySets(state, weeks * 7, now);
    const startWeek = E.shiftWeek(E.weekKey(now), -(weeks - 1));
    const gap = 3, left = 22, cell = Math.min(24, Math.floor((W - left) / weeks) - gap);
    const H = 7 * (cell + gap) + 18;
    const step = v => v <= 0 ? 0 : v < 10 ? 1 : v < 16 ? 2 : v < 21 ? 3 : 4;
    let cells = '';
    const dayNames = ['M', '', 'W', '', 'F', '', 'S'];
    for (let r = 0; r < 7; r++) cells += `<text x="0" y="${r * (cell + gap) + cell * 0.72}" font-size="11" fill="var(--muted)">${dayNames[r]}</text>`;
    const cd = [];
    for (let c = 0; c < weeks; c++) for (let r = 0; r < 7; r++) {
      const d = new Date(startWeek); d.setDate(d.getDate() + c * 7 + r); d.setHours(0, 0, 0, 0);
      const t = d.getTime(); if (t > now) continue;
      const v = map[t] || 0, x = left + c * (cell + gap), y = r * (cell + gap);
      cd.push({ x: x + cell / 2, y, t, v });
      cells += `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" rx="4" fill="var(--heat-${step(v)})"><title>${dShort(t)}: ${v} sets</title></rect>`;
    }
    charts.heat = { cells: cd, cell };
    const firstLab = dShort(startWeek);
    cells += `<text x="${left}" y="${H - 2}" font-size="11" fill="var(--muted)">w/c ${firstLab}</text>`;
    return `<div class="chart" data-chart="heat"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Training days over twelve weeks">${cells}</svg><div class="tip"></div></div>
      <div class="legend"><span>Sets that day:</span>${['None', '1–9', '10–15', '16–20', '21+'].map((l, i) => `<span><i style="background:var(--heat-${i})"></i>${l}</span>`).join('')}</div>`;
  }

  function volumeColumns() {
    const W = chartW(), H = 170, m = { l: 36, r: 8, t: 18, b: 24 }, weeks = 12;
    const data = E.weeklyVolume(state, weeks, Date.now());
    const max = Math.max.apply(null, data.map(d => d.volume).concat([1]));
    const ticks = nice(0, max, 3), top = ticks[ticks.length - 1];
    const band = (W - m.l - m.r) / weeks, bw = Math.min(24, band * 0.6);
    const Y = v => H - m.b - v / top * (H - m.t - m.b);
    const cols = data.map((d, i) => {
      const x = m.l + i * band + (band - bw) / 2, y = Y(d.volume), h = H - m.b - y;
      return { x: x + bw / 2, y, d, svg: h > 0 ? `<path d="M${x} ${H - m.b} v${-Math.max(0, h - 4)} a4 4 0 0 1 4 -4 h${bw - 8} a4 4 0 0 1 4 4 v${Math.max(0, h - 4)} z" fill="var(--series)"/>` : '' };
    });
    charts.vol = { cols, band, m };
    const last = cols[cols.length - 1];
    return `<div class="chart" data-chart="vol"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Weekly kilograms lifted, twelve weeks">
      ${ticks.map(v => `<line x1="${m.l}" x2="${W - m.r}" y1="${Y(v)}" y2="${Y(v)}" stroke="${v === 0 ? 'var(--axis)' : 'var(--grid)'}"/><text x="${m.l - 6}" y="${Y(v) + 4}" text-anchor="end" font-size="11" fill="var(--muted)">${compact(v)}</text>`).join('')}
      ${cols.map(c => c.svg).join('')}
      ${last.d.volume ? `<text x="${last.x}" y="${last.y - 6}" text-anchor="middle" font-size="12" font-weight="600" fill="var(--ink)">${compact(last.d.volume)}</text>` : ''}
      <text x="${m.l}" y="${H - 6}" font-size="11" fill="var(--muted)">w/c ${dShort(data[0].week)}</text>
      <text x="${W - m.r}" y="${H - 6}" font-size="11" fill="var(--muted)" text-anchor="end">this week</text>
    </svg><div class="tip"></div></div>`;
  }

  function renderProgress() {
    const done = state.sessions.filter(s => s.end);
    if (!done.length) { view.innerHTML = `<h2>Progress</h2><div class="empty"><p>Charts appear after your first session.</p><p class="sub">You'll see estimated strength for each exercise, sets per muscle group, training days and weekly volume.</p></div>`; return; }
    const now = Date.now();
    const recent = done.filter(s => now - s.end < 28 * DAY);
    const sets28 = recent.reduce((t, s) => t + (s.totals || E.sessionTotals(state, s)).sets, 0);
    const mins = recent.map(s => (s.totals || E.sessionTotals(state, s)).minutes).filter(x => x != null);
    const trained = E.trainedExercises(state);
    if (!ui.progressEx || !trained.some(t => t.id === ui.progressEx)) ui.progressEx = trained.length ? trained[0].id : null;
    const ser = ui.progressEx ? E.progressSeries(state, ui.progressEx) : { points: [] };
    const seenPr = new Set();
    const prs = [].concat.apply([], done.map(s => (s.prs || []).map(p => Object.assign({ t: s.end }, p)))).sort((a, b) => b.t - a.t)
      .filter(p => !seenPr.has(p.exId) && seenPr.add(p.exId)).slice(0, 8);
    const ms = E.muscleStatus(state, now);
    view.innerHTML = `<h2>Progress</h2>
      <p class="sub">Last four weeks</p>
      <div class="statline"><div><b>${recent.length}</b><span>sessions</span></div><div><b>${sets28}</b><span>sets</span></div><div><b>${mins.length ? Math.round(mins.reduce((a, b) => a + b, 0) / mins.length) : '—'}</b><span>average minutes</span></div></div>

      <section class="panel"><h4 style="margin-top:0">Strength by exercise</h4>
        <select data-action="progress-ex" aria-label="Exercise">${trained.map(t => `<option value="${t.id}" ${t.id === ui.progressEx ? 'selected' : ''}>${esc(t.ex.name)} (${t.count})</option>`).join('')}</select>
        <p class="small" style="margin:8px 0 4px">${esc(ser.metric || '')}${ser.points.some(p => p.deload) ? '. Hollow points are deload sessions.' : ''}</p>
        ${lineChart('ex', ser.points, ser.unit)}
        <button type="button" class="linkish" data-action="toggle-table" data-v="ex">${ui.tables.ex ? 'Hide table' : 'Show as table'}</button>
        ${ui.tables.ex ? `<table class="data"><tr><th>Date</th><th>Best set</th><th class="n">${esc(ser.metric || '')}</th></tr>${ser.points.slice().reverse().map(p => `<tr><td>${dShort(p.t)}</td><td>${esc(p.label)}</td><td class="n">${f(p.v)}</td></tr>`).join('')}</table>` : ''}
      </section>

      <section class="panel"><h4 style="margin-top:0">Sets per muscle group, last 7 days</h4>${muscleBars(ms)}</section>

      <section class="panel"><h4 style="margin-top:0">Training days, last 12 weeks</h4>${heatmap()}</section>

      <section class="panel"><h4 style="margin-top:0">Weekly volume</h4><p class="small">Kilograms lifted on plate-loaded, barbell and dumbbell work.</p>${volumeColumns()}
        <button type="button" class="linkish" data-action="toggle-table" data-v="vol">${ui.tables.vol ? 'Hide table' : 'Show as table'}</button>
        ${ui.tables.vol ? `<table class="data"><tr><th>Week of</th><th class="n">Sessions</th><th class="n">Sets</th><th class="n">kg</th></tr>${E.weeklyVolume(state, 12, now).slice().reverse().map(w => `<tr><td>${dShort(w.week)}</td><td class="n">${w.sessions}</td><td class="n">${w.sets}</td><td class="n">${kg(w.volume)}</td></tr>`).join('')}</table>` : ''}
      </section>

      <section class="panel"><h4 style="margin-top:0">Recent bests</h4>
        ${prs.length ? prs.map(p => `<div class="pr"><span>${esc(ex(p.exId) ? ex(p.exId).name : p.exId)}<br><span class="small">${dShort(p.t)}</span></span><span class="num">${p.kind === 'e1rm' ? f(p.value) + ' kg' : p.value + ' reps'}</span></div>`).join('') : '<p class="sub">Bests appear once you beat an earlier performance.</p>'}
        <p class="small" style="margin-top:8px">Estimated maxima use the Epley formula adjusted for how many reps you had left.</p>
      </section>`;
    bindCharts();
  }

  function bindCharts() {
    document.querySelectorAll('.chart[data-chart]').forEach(el => {
      const id = el.dataset.chart, svg = el.querySelector('svg'), tip = el.querySelector('.tip');
      if (!svg || !tip) return;
      const scale = () => svg.getBoundingClientRect().width / svg.viewBox.baseVal.width;
      const show = ev => {
        const r = svg.getBoundingClientRect(), k = scale();
        const px = (ev.clientX - r.left) / k, py = (ev.clientY - r.top) / k;
        let html = null, x = 0, y = 0;
        if (id === 'ex') {
          const c = charts.ex; if (!c) return;
          const p = c.pts.reduce((a, b) => Math.abs(b.x - px) < Math.abs(a.x - px) ? b : a);
          html = `<b>${f(p.v)}${c.unit ? ' ' + c.unit : ''}</b><br>${esc(p.label)}, ${dShort(p.t)}${p.deload ? ' (deload)' : ''}`; x = p.x; y = p.y;
          const xh = svg.querySelector('.xh'); xh.setAttribute('x1', p.x); xh.setAttribute('x2', p.x); xh.setAttribute('visibility', 'visible');
        } else if (id === 'vol') {
          const c = charts.vol; const i = Math.max(0, Math.min(c.cols.length - 1, Math.floor((px - c.m.l) / c.band)));
          const col = c.cols[i]; html = `<b>${kg(col.d.volume)} kg</b><br>w/c ${dShort(col.d.week)}, ${col.d.sessions} session${col.d.sessions === 1 ? '' : 's'}`; x = col.x; y = col.y;
        } else if (id === 'heat') {
          const c = charts.heat; const p = c.cells.reduce((a, b) => (Math.hypot(b.x - px, b.y + c.cell / 2 - py) < Math.hypot(a.x - px, a.y + c.cell / 2 - py) ? b : a));
          html = `<b>${p.v} sets</b><br>${dShort(p.t)}`; x = p.x; y = p.y;
        }
        if (!html) return;
        tip.innerHTML = html; tip.style.display = 'block'; tip.style.left = (x * k) + 'px'; tip.style.top = (y * k) + 'px';
      };
      const hide = () => { tip.style.display = 'none'; const xh = svg.querySelector('.xh'); if (xh) xh.setAttribute('visibility', 'hidden'); };
      svg.addEventListener('pointermove', show); svg.addEventListener('pointerdown', show); svg.addEventListener('pointerleave', hide);
    });
  }
  let rz; window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { if (ui.tab === 'progress') renderProgress(); }, 200); });

  /* ------------------------------------------------------------ setup */
  function renderSetup() {
    const st = state.settings, now = Date.now();
    const standalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;
    const excluded = Object.keys(state.prefs.excluded).filter(k => state.prefs.excluded[k]);
    const seg = (action, cur, opts) => `<div class="seg">${opts.map(([v, l]) => `<button type="button" data-action="${action}" data-v="${v}" aria-pressed="${String(cur) === String(v)}">${l}</button>`).join('')}</div>`;
    view.innerHTML = `<h2>Setup</h2>
      ${standalone ? '' : `<section class="panel"><h4 style="margin-top:0">Add Rebuild to your home screen</h4>
        <ol class="steps"><li>Open this page in Safari.</li><li>Tap the three-dot button next to the address bar, then Share.</li><li>Tap Add to Home Screen, keep Open as Web App switched on, then tap Add.</li></ol>
        <p class="small">It then opens full screen, works without signal, and keeps its data on this iPhone.</p></section>`}

      <h4>Equipment at your gym</h4>
      <p class="small">The planner only picks exercises you have the kit for. Tap a group to tick or untick items.</p>
      ${E.EQUIPMENT_GROUPS.map(g => {
        const on = g.items.filter(i => st.equipment[i.id]).length;
        return `<details class="group"><summary>${esc(g.name)}<span class="small">${on} of ${g.items.length} ticked</span></summary>
          <p class="small" style="margin:10px 0 4px">${esc(g.note)}</p>
          <div class="row" style="margin:6px 0"><button type="button" class="btn" style="min-height:38px" data-action="eq-all" data-g="${g.id}" data-v="1">Tick all</button><button type="button" class="btn" style="min-height:38px" data-action="eq-all" data-g="${g.id}" data-v="0">Untick all</button></div>
          ${g.items.map(i => `<label class="check"><input type="checkbox" data-eq="${i.id}" ${st.equipment[i.id] ? 'checked' : ''}><span class="grow">${esc(i.name)}${i.used ? '' : ' <span class="small">(not used by the planner)</span>'}</span></label>`).join('')}
        </details>`;
      }).join('')}

      <h4>Training</h4>
      <div class="panel stack-gap">
        <div><p class="lbl">Sessions you aim for each week</p>${seg('set-goal', st.weeklyGoal, [[2, '2'], [3, '3'], [4, '4'], [5, '5']])}
          <p class="small" style="margin-top:6px">With 3 a week the planner leans on full-body sessions; with 4 it alternates upper and lower body, so every muscle is trained twice a week.</p></div>
        <div><p class="lbl">Rep ranges</p>${seg('set-repfocus', st.repFocus, [['balanced', 'Balanced'], ['strength', 'Strength'], ['muscle', 'Size']])}
          <p class="small" style="margin-top:6px">${{ balanced: 'Main lifts 6–10 reps, accessories 10–15.', strength: 'Main lifts 4–8 reps, accessories 8–12.', muscle: 'Main lifts 8–12 reps, accessories 12–15.' }[st.repFocus]}</p></div>
        <div><p class="lbl">Rest on main lifts</p>${seg('set-restc', st.restCompound, [[90, '90 s'], [120, '2 min'], [150, '2½ min'], [180, '3 min']])}</div>
        <div><p class="lbl">Rest on accessories</p>${seg('set-resti', st.restIsolation, [[45, '45 s'], [60, '60 s'], [75, '75 s'], [90, '90 s']])}</div>
        <div><p class="lbl">Dumbbell steps</p>${seg('set-db', st.dbStep, [[1, '1 kg'], [2, '2 kg'], [2.5, '2.5 kg']])}</div>
        <div><p class="lbl">Barbell weight</p>${seg('set-bar', st.barWeight, [[15, '15 kg'], [20, '20 kg']])}</div>
        <div><p class="lbl">Plates available</p><div class="row wrap">${[25, 20, 15, 10, 5, 2.5, 1.25].map(p => `<button type="button" class="chip" data-action="toggle-plate" data-v="${p}" aria-pressed="${st.plates.includes(p)}">${f(p)} kg</button>`).join('')}</div></div>
        <label class="check"><input type="checkbox" data-setting="beep" ${st.beep ? 'checked' : ''}><span class="grow">Beep when rest is over</span></label>
        <label class="check"><input type="checkbox" data-setting="keepAwake" ${st.keepAwake ? 'checked' : ''}><span class="grow">Keep the screen on during a session</span></label>
      </div>

      <h4>Your exercises</h4>
      <div class="panel">
        ${excluded.length ? `<p class="lbl">Never suggested</p>${excluded.map(id => `<div class="check"><span class="grow">${esc(ex(id) ? ex(id).name : id)}</span><button type="button" class="btn" style="min-height:38px" data-action="unexclude" data-ex="${id}">Bring back</button></div>`).join('')}<div class="rule"></div>` : ''}
        ${state.custom.length ? `<p class="lbl">Added by you</p>${state.custom.map(c => `<div class="check"><span class="grow">${esc(c.name)} <span class="small">${esc(SLOT_NAMES[c.slots[0]] || '')}</span></span><button type="button" class="btn danger" style="min-height:38px" data-action="del-custom" data-ex="${c.id}">Delete</button></div>`).join('')}<div class="rule"></div>` : ''}
        <p class="lbl">Add a machine or exercise</p>
        <label class="field"><span>Name</span><input type="text" id="c-name" placeholder="e.g. Iso-lateral high row"></label>
        <label class="field"><span>Machine (optional)</span><input type="text" id="c-machine" placeholder="e.g. Hammer Strength"></label>
        <label class="field"><span>Its job in a session</span><select id="c-slot">${Object.keys(SLOT_NAMES).map(k => `<option value="${k}">${SLOT_NAMES[k]}</option>`).join('')}</select></label>
        <label class="field"><span>Main muscle group</span><select id="c-muscle">${E.MUSCLES.map(m => `<option value="${m.id}">${m.name}</option>`).join('')}</select></label>
        <label class="field"><span>Type</span><select id="c-kind"><option value="compound">Compound (several joints)</option><option value="isolation">Isolation (one joint)</option></select></label>
        <label class="field"><span>How it's loaded</span><select id="c-load"><option value="plates">Plates (log total kg)</option><option value="stack">Pin-loaded stack</option><option value="barbell">Barbell</option><option value="dumbbell">Dumbbells (kg each)</option><option value="bodyweight">Bodyweight</option></select></label>
        <button type="button" class="btn primary block" data-action="add-custom">Add exercise</button>
      </div>

      <h4>Cloud saving</h4>
      <div class="panel" id="cloudpanel">${cloudPanel()}</div>

      <h4>Your data</h4>
      <div class="panel">
        <p class="sub">${Cloud && Cloud.signedIn() ? 'Your data is kept on this phone and copied to your Google cloud.' : 'Your data is kept on this phone only. Back up now and then, or set up cloud saving above.'}</p>
        <div class="stack-gap" style="margin-top:12px">
          <button type="button" class="btn block" data-action="backup">Back up to a file</button>
          <label class="btn block" style="cursor:pointer">Restore from a backup<input type="file" accept="application/json,.json" data-action="restore" hidden></label>
          <button type="button" class="btn block" data-action="copy-claude">Copy the last 14 days for Claude</button>
          <button type="button" class="btn block danger" data-action="erase">Erase all data</button>
        </div>
      </div>
      <p class="small" style="margin:18px 0">Rebuild 1.3. Session plans are general training guidance, not medical advice.</p>`;
  }

  async function backup() {
    const json = JSON.stringify(state, null, 1);
    const name = `rebuild-backup-${new Date().toISOString().slice(0, 10)}.json`;
    try {
      const file = new File([json], name, { type: 'application/json' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: 'Rebuild backup' }); return; }
    } catch (e) { if (e && e.name === 'AbortError') return; }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' })); a.download = name;
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }
  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); toast('Copied. Paste it into a chat with Claude.'); }
    catch (e) {
      openSheet(`<h3>Copy this text</h3><p class="small">Your browser blocked automatic copying. Select all and copy.</p><textarea readonly style="height:50vh">${esc(text)}</textarea><div style="height:10px"></div><button type="button" class="btn block" data-action="close-sheet">Close</button>`);
    }
  }

  /* ------------------------------------------------------------ events */
  document.addEventListener('click', ev => {
    const tabBtn = ev.target.closest('[data-tab]');
    if (tabBtn) { if (tabBtn.dataset.tab === 'train' && ui.tab === 'train') ui.dash = !state.active ? false : !ui.dash; ui.tab = tabBtn.dataset.tab; closeSheet(); save(); render(); window.scrollTo(0, 0); return; }
    const el = ev.target.closest('[data-action]');
    if (!el || el.tagName === 'SELECT' || el.tagName === 'INPUT') return;
    const a = el.dataset.action, i = el.dataset.i != null ? +el.dataset.i : null, v = el.dataset.v;
    const s = state.active;
    switch (a) {
      case 'minutes': ui.minutes = +v; save(); renderTrain(); break;
      case 'focus': ui.focus = v; save(); renderTrain(); break;
      case 'readiness': ui.readiness = v; save(); renderTrain(); break;
      case 'start-next': {
        const p = previewSession();
        if (!p.items.length) { toast('No exercises match your equipment. Check Setup.'); break; }
        state.active = p; ui.preview = null; ui.dash = false;
        save(true); render(); window.scrollTo(0, 0); break;
      }
      case 'resume': ui.dash = false; render(); window.scrollTo(0, 0); break;
      case 'to-dash': ui.dash = true; render(); window.scrollTo(0, 0); break;
      case 'howto': howSheet(el.dataset.ex, el.dataset.back != null ? +el.dataset.back : null); break;
      case 'swap-more': swapSheet(i, true); break;
      case 'discard':
        if (confirm('Discard this session? Nothing from it will be saved.')) { state.active = null; ui.dash = false; rest = null; tickRest(); releaseWake(); save(true); render(); window.scrollTo(0, 0); }
        break;
      case 'finish': finish(); break;
      case 'tick': { const row = el.closest('.set'); onTick(+row.dataset.i, +row.dataset.k); break; }
      case 'w-': case 'w+': case 'r-': case 'r+': {
        const row = el.closest('.set'), ii = +row.dataset.i, k = +row.dataset.k, it = s.items[ii], x = it.log[k], e = ex(it.exId);
        if (a[0] === 'w') {
          const cur = x.w != null ? x.w : (it.weight != null ? it.weight : 0);
          x.w = Math.max(0, Math.round((cur + (a === 'w+' ? 1 : -1) * stepFor(e)) * 100) / 100);
          row.querySelector('[data-field="w"]').value = f(x.w);
        } else {
          const cur = x.r != null ? x.r : (it.target[k] != null ? it.target[k] : it.lo);
          x.r = Math.max(0, cur + (a === 'r+' ? 1 : -1));
          row.querySelector('[data-field="r"]').value = x.r;
        }
        save(); break;
      }
      case 'effort': s.items[i].effort = v; save(); rerenderItem(i); break;
      case 'add-set': { const it = s.items[i]; const lastW = it.log.length ? it.log[it.log.length - 1].w : it.weight; it.log.push({ w: lastW, r: null, done: false }); it.target.push(it.target[it.target.length - 1] || it.lo); it.sets = it.log.length; save(); rerenderItem(i); break; }
      case 'del-set': { const it = s.items[i]; if (it.log.length > 1) { it.log.pop(); it.target.pop(); it.sets = it.log.length; } save(); rerenderItem(i); break; }
      case 'swap': swapSheet(i); break;
      case 'swap-to': E.swapItem(state, s, i, el.dataset.ex, Date.now()); save(); closeSheet(); renderSession(); break;
      case 'not-at-gym': {
        const e = ex(s.items[i].exId); machineIds(e).forEach(id => { state.settings.equipment[id] = false; });
        const rep = bestReplacement(i);
        if (rep) { E.swapItem(state, s, i, rep.id, Date.now()); toast(`Unticked. Swapped to ${rep.name}.`); }
        else { s.items.splice(i, 1); toast('Unticked and removed.'); }
        save(); closeSheet(); renderSession(); break;
      }
      case 'exclude': {
        const e = ex(s.items[i].exId); state.prefs.excluded[e.id] = true;
        const rep = bestReplacement(i);
        if (rep) E.swapItem(state, s, i, rep.id, Date.now()); else s.items.splice(i, 1);
        save(); closeSheet(); renderSession(); toast(`${e.name} won't be suggested again.`); break;
      }
      case 'remove-item': s.items.splice(i, 1); if (s.items[i] && s.items[i].superset) s.items[i].superset = null; if (s.items[i - 1] && s.items[i - 1].superset === 'a') s.items[i - 1].superset = null; s.estMinutes = E.estimateMinutes(state, s); save(); closeSheet(); renderSession(); break;
      case 'add-ex': addSheet(); break;
      case 'add-muscle': addSheet(v); break;
      case 'add-to': E.addExercise(state, s, el.dataset.ex, Date.now()); save(); closeSheet(); renderSession(); setTimeout(() => { const last = document.getElementById('ex-' + (s.items.length - 1)); if (last) last.scrollIntoView({ block: 'center' }); }, 50); break;
      case 'close-sheet': closeSheet(); break;
      case 'rest-add': if (rest) { rest.end = Math.max(rest.end, Date.now()) + 30000; rest.total += 30000; rest.beeped = false; tickRest(); } break;
      case 'rest-skip': rest = null; tickRest(); break;
      case 'summary-done': ui.summary = null; render(); break;
      case 'hist-open': histSheet(el.dataset.id, false); break;
      case 'hist-edit': histSheet(el.dataset.id, true); break;
      case 'hist-save': {
        const ses = state.sessions.find(x => x.id === el.dataset.id);
        document.querySelectorAll('[data-hfield]').forEach(inp => {
          const x = ses.items[+inp.dataset.i].log[+inp.dataset.k];
          const val = inp.dataset.hfield === 'w' ? parseFloat(inp.value.replace(',', '.')) : parseInt(inp.value, 10);
          if (!isNaN(val)) x[inp.dataset.hfield] = val;
        });
        ses.totals = E.sessionTotals(state, ses); ses.updatedAt = Date.now(); save(true); histSheet(ses.id, false); renderHistory(); toast('Changes saved.'); break;
      }
      case 'hist-del':
        if (confirm('Delete this session for good?')) { state.sessions = state.sessions.filter(x => x.id !== el.dataset.id); state.deleted = (state.deleted || []).concat([{ id: el.dataset.id, t: Date.now() }]); save(true); closeSheet(); renderHistory(); }
        break;
      case 'toggle-table': ui.tables[v] = !ui.tables[v]; renderProgress(); break;
      case 'eq-all': { const g = E.EQUIPMENT_GROUPS.find(x => x.id === el.dataset.g); g.items.forEach(it => { state.settings.equipment[it.id] = v === '1'; }); save(); renderSetupKeepOpen(g.id); break; }
      case 'set-goal': state.settings.weeklyGoal = +v; save(); renderSetup(); break;
      case 'set-repfocus': state.settings.repFocus = v; save(); renderSetup(); break;
      case 'set-restc': state.settings.restCompound = +v; save(); renderSetup(); break;
      case 'set-resti': state.settings.restIsolation = +v; save(); renderSetup(); break;
      case 'set-db': state.settings.dbStep = +v; save(); renderSetup(); break;
      case 'set-bar': state.settings.barWeight = +v; save(); renderSetup(); break;
      case 'toggle-plate': {
        const p = +v, pl = state.settings.plates;
        if (pl.includes(p)) { if (pl.length > 1) state.settings.plates = pl.filter(x => x !== p); } else state.settings.plates = pl.concat([p]).sort((a, b) => b - a);
        save(); renderSetup(); break;
      }
      case 'unexclude': delete state.prefs.excluded[el.dataset.ex]; save(); renderSetup(); break;
      case 'del-custom': if (confirm('Delete this exercise? Its logged sets stay in your history but will no longer show a name.')) { state.custom = state.custom.filter(c => c.id !== el.dataset.ex); save(); renderSetup(); } break;
      case 'add-custom': {
        const name = $('#c-name').value.trim();
        if (!name) { toast('Give the exercise a name.'); $('#c-name').focus(); break; }
        const slot = $('#c-slot').value;
        state.custom.push({ id: 'c_' + Date.now().toString(36), name, machine: $('#c-machine').value.trim(), primary: $('#c-muscle').value, secondary: [], slots: [slot], kind: $('#c-kind').value, load: $('#c-load').value, custom: true });
        save(true); renderSetup(); toast(`${name} added. The planner can now use it for ${SLOT_NAMES[slot].toLowerCase()}.`); break;
      }
      case 'backup': backup(); break;
      case 'copy-claude': copyText(E.exportSummary(state, 14, Date.now())); break;
      case 'erase': {
        const inCloud = Cloud && Cloud.signedIn();
        const msg = inCloud ? 'Erase every session, setting and exercise on this phone AND in your cloud copy? This cannot be undone.'
          : 'Erase every session, setting and exercise on this phone? This cannot be undone.' + (Cloud && Cloud.isConfigured() ? ' Your cloud copy is not affected while you are signed out.' : '');
        if (confirm(msg) && confirm('Are you sure? Consider backing up first.')) {
          const now = Date.now();
          const gone = state.sessions.map(x => ({ id: x.id, t: now })).concat(state.deleted || []);
          state = E.newState();
          if (inCloud) { state.deleted = gone; state.profileUpdatedAt = now; state.activeUpdatedAt = now; }
          save(true); render(); toast(inCloud ? 'All data erased here and in the cloud.' : 'All data erased.');
        }
        break;
      }
      case 'cloud-signin': cloudSignIn(); break;
      case 'cloud-reset': cloudReset(); break;
      case 'cloud-signout':
        if (confirm('Sign out? Your data stays on this phone; changes will not upload until you sign in again.')) Cloud.signOut().then(renderCloudPanel);
        break;
      case 'cloud-sync': Cloud.sync({ full: true }); break;
      case 'cloud-config': {
        const ok = Cloud && Cloud.saveConfig($('#cloud-cfg').value);
        if (!ok) { toast('That doesn\'t look like a Firebase config block. Copy the whole firebaseConfig section.'); break; }
        toast('Settings saved. Restarting…'); setTimeout(() => location.reload(), 600); break;
      }
    }
  });
  function renderSetupKeepOpen(gid) {
    const idx = E.EQUIPMENT_GROUPS.findIndex(g => g.id === gid);
    renderSetup();
    const d = document.querySelectorAll('details.group')[idx]; if (d) d.open = true;
  }

  document.addEventListener('input', ev => {
    const t = ev.target;
    if (t.dataset.field && state.active) {
      const row = t.closest('.set'); const it = state.active.items[+row.dataset.i]; const x = it.log[+row.dataset.k];
      if (t.dataset.field === 'w') { const v = parseFloat(t.value.replace(',', '.')); x.w = isNaN(v) ? null : v; }
      else { const v = parseInt(t.value, 10); x.r = isNaN(v) ? null : v; }
      save();
    }
  });
  document.addEventListener('change', ev => {
    const t = ev.target;
    if (t.dataset.eq) {
      state.settings.equipment[t.dataset.eq] = t.checked; save();
      const d = t.closest('details'); const sm = d && d.querySelector('summary .small');
      if (sm) { const g = E.EQUIPMENT_GROUPS.find(x => x.items.some(i => i.id === t.dataset.eq)); sm.textContent = `${g.items.filter(i => state.settings.equipment[i.id]).length} of ${g.items.length} ticked`; }
    } else if (t.dataset.setting) { state.settings[t.dataset.setting] = t.checked; save(); }
    else if (t.dataset.action === 'progress-ex') { ui.progressEx = t.value; save(); renderProgress(); }
    else if (t.dataset.action === 'restore' && t.files && t.files[0]) {
      const r = new FileReader();
      r.onload = () => {
        try {
          const data = JSON.parse(r.result);
          if (!data || !Array.isArray(data.sessions)) throw new Error('not a backup');
          if (!confirm(`Replace everything on this device with the backup (${data.sessions.length} sessions)?`)) return;
          state = E.normalise(data); state.profileUpdatedAt = Date.now(); state.activeUpdatedAt = Date.now(); state._profileSig = null; state._activeSig = null;
          save(true); render(); toast('Backup restored.');
        } catch (e) { toast('That file is not a Rebuild backup.'); }
      };
      r.readAsText(t.files[0]); t.value = '';
    }
  });
  document.addEventListener('focusin', ev => { if (ev.target.dataset && ev.target.dataset.field) ev.target.select && setTimeout(() => ev.target.select(), 0); });

  /* ------------------------------------------------------------ offline */
  if ('serviceWorker' in navigator && /^https?:/.test(location.protocol)) {
    let had = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.register('sw.js').catch(() => { /* offline support unavailable */ });
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (had) toast('Rebuild has been updated.'); had = true; });
  }

  /* ------------------------------------------------------------ cloud saving */
  function hhmm(t) { return new Date(t).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }); }
  function cloudLine() {
    if (!Cloud) return '<span class="dot off"></span>Saved on this phone only.';
    const st = Cloud.status;
    switch (st.state) {
      case 'unconfigured': return '<span class="dot off"></span>Saved on this phone only. Set up cloud saving in Setup.';
      case 'signed-out': return '<span class="dot off"></span>Saved on this phone. Sign in on the Setup tab to save to the cloud.';
      case 'syncing': return '<span class="dot busy"></span>Saving to the cloud…';
      case 'synced': return `<span class="dot ok"></span>Saved to the cloud at ${hhmm(st.at)}`;
      case 'offline': return '<span class="dot wait"></span>No signal: saved on this phone, will upload automatically.';
      default: return `<span class="dot bad"></span>${esc(st.message || 'Cloud problem.')}`;
    }
  }
  function cloudPanel() {
    if (!Cloud) return '<p class="sub">Cloud saving could not load on this device. Your data is still saved on this phone.</p>';
    const st = Cloud.status;
    if (st.state === 'unconfigured') return `
      <p class="sub">Not set up yet. Follow the cloud steps in the setup guide, then either update <b>cloud-config.js</b> in GitHub or paste the <b>firebaseConfig</b> block from Firebase here.</p>
      <label class="field"><span>Firebase config</span><textarea id="cloud-cfg" spellcheck="false" autocapitalize="off" placeholder="const firebaseConfig = { apiKey: &quot;…&quot;, … };"></textarea></label>
      <button type="button" class="btn block" data-action="cloud-config">Save settings</button>`;
    if (!Cloud.signedIn()) return `
      <p class="sub">Sign in with the email and password you added in Firebase. Your data on this phone is combined with your cloud copy.</p>
      <label class="field"><span>Email</span><input type="email" id="cloud-email" autocomplete="username" autocapitalize="off" inputmode="email"></label>
      <label class="field"><span>Password</span><input type="password" id="cloud-pass" autocomplete="current-password"></label>
      <p class="small" id="cloud-msg" role="alert">${st.state === 'error' ? esc(st.message) : ''}</p>
      <button type="button" class="btn primary block" data-action="cloud-signin">Sign in</button>
      <div class="row" style="justify-content:center"><button type="button" class="linkish" data-action="cloud-reset">Forgotten password</button></div>`;
    return `
      <p class="sub">Signed in as <b>${esc(st.email || '')}</b>.</p>
      <p class="cloudline" style="margin:8px 0 12px">${cloudLine()}</p>
      <div class="row"><button type="button" class="btn grow" data-action="cloud-sync">Sync now</button><button type="button" class="btn grow" data-action="cloud-signout">Sign out</button></div>`;
  }
  function renderCloudPanel() {
    const p = document.getElementById('cloudpanel');
    if (p && !(p.contains(document.activeElement) && /INPUT|TEXTAREA/.test(document.activeElement.tagName))) p.innerHTML = cloudPanel();
    const l = document.getElementById('cloudline'); if (l) l.innerHTML = cloudLine();
  }
  async function cloudSignIn() {
    const email = ($('#cloud-email') || {}).value || '', pass = ($('#cloud-pass') || {}).value || '';
    const msg = $('#cloud-msg');
    if (!email || !pass) { if (msg) msg.textContent = 'Enter your email and password.'; return; }
    const btn = document.querySelector('[data-action="cloud-signin"]'); if (btn) { btn.disabled = true; btn.textContent = 'Signing in…'; }
    try { await Cloud.signIn(email, pass); if (document.activeElement) document.activeElement.blur(); renderCloudPanel(); toast('Signed in. Your data is being saved to the cloud.'); }
    catch (e) { if (msg) msg.textContent = e.message; if (btn) { btn.disabled = false; btn.textContent = 'Sign in'; } }
  }
  async function cloudReset() {
    const email = ($('#cloud-email') || {}).value || '';
    const msg = $('#cloud-msg');
    if (!email) { if (msg) msg.textContent = 'Enter your email first, then tap Forgotten password.'; return; }
    try { await Cloud.resetPassword(email); if (msg) msg.textContent = 'If that address has an account, a reset email is on its way.'; }
    catch (e) { if (msg) msg.textContent = e.message; }
  }
  let pendingRender = false;
  function busyTyping() { const a = document.activeElement; return a && /INPUT|TEXTAREA|SELECT/.test(a.tagName); }
  document.addEventListener('focusout', () => { if (pendingRender) setTimeout(() => { if (!busyTyping() && pendingRender) { pendingRender = false; render(); } }, 50); });

  render();
  requestWake();
  if (Cloud) Cloud.start({
    get: () => state,
    set: merged => {
      state = E.normalise(merged);
      ui.preview = null;
      write(true);
      if (busyTyping()) pendingRender = true; else render();
    },
    persist: () => write(true),
    onStatus: renderCloudPanel
  });
})();
