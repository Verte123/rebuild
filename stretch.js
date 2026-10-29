/* Rebuild — stretch and mobility sessions for hips, lower back and core.
 * A library of exercises (including the five from your physio), a planner that fits a different mix
 * into the minutes you have, timed steps for each exercise, and a small drawing of each position.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Stretch = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const DAY = 864e5;
  const V = (id, title, channel, year) => ({ id, title, channel, year: year || null, url: 'https://www.youtube.com/watch?v=' + id });

  const AREAS = { hips: 'Hips', back: 'Lower back', core: 'Core' };
  // phase: 1 warm-up, 2 strength and control, 3 stretch, 4 wind-down.
  // pos: floor position, used to order exercises so you get up and down less.
  const POS = { stand: 0, kneel: 1, quad: 2, prone: 3, side: 4, seat: 5, supine: 6 };
  const PHYSIO_NOTE = 'From your physio\'s programme (2 September 2026).';

  // Doses: reps or hold (seconds) as [lowest, highest]; sets as [lowest, highest].
  // secPerRep is the time allowed per rep at a slow, controlled pace. alt: alternate sides within a set.
  // Videos were checked on YouTube for title and channel in October 2026.
  const LIB = [
    { id: 'cat_cow', name: 'Cat-cow', area: 'back', physio: true, phase: 1, pos: 'quad', kind: 'reps', reps: [12, 20], secPerRep: 4, sets: [1, 1], rest: 0,
      works: 'Spine mobility',
      dose: 'Physio: 12–20 reps.',
      cues: ['On hands and knees: hands under shoulders, knees under hips.', 'Breathe out and round your back up towards the ceiling, tucking your chin and tailbone (cat).', 'Breathe in and let your stomach sink as you lift your chest and tailbone (cow).', 'Move slowly through a comfortable range. One cat and one cow count as one rep.'],
      video: V('M8U0mHhg0Dk', 'The Cat/Cow | Back Pain Relief Exercise', 'Dr. Carl Baird', 2017) },

    { id: 'knee_rolls', name: 'Knee rolls', area: 'back', phase: 1, pos: 'supine', kind: 'reps', reps: [10, 16], secPerRep: 4, sets: [1, 1], rest: 0,
      works: 'Lower back rotation',
      dose: 'A gentle 10–16 rolls (each roll to one side counts as one). The NHS handout this comes from leaves the number to your physio.',
      cues: ['Lie on your back, knees bent and together, feet flat.', 'Keep your shoulders and upper back on the floor.', 'Slowly roll both knees to one side as far as is comfortable, then over to the other side.', 'Let your breathing stay relaxed; there should be no pain.'],
      video: V('PX_tIQQIWu0', 'Trunk Rotation Stretch - Ask Doctor Jo', 'Ask Doctor Jo', 2017) },

    { id: 'worlds_greatest', name: 'World\'s greatest stretch', area: 'hips', phase: 1, pos: 'stand', kind: 'reps', reps: [3, 5], secPerRep: 8, sets: [1, 1], sides: true, switchSecs: 5, rest: 0,
      works: 'Hip flexors, groin and upper back',
      dose: 'About 30 seconds a side (Men\'s Fitness UK), which is 3–5 slow reps.',
      cues: ['From a push-up position, step your right foot to the outside of your right hand.', 'Drop your right elbow towards your right foot, then rotate and reach that arm to the ceiling.', 'Keep the back leg straight and strong; follow your hand with your eyes.', 'Bring the hand down, step back and repeat. Do all the reps on one side, then the other.'],
      video: V('uIFKmkvgw8w', 'How To Do The World\'s Greatest Stretch | Full Body Mobility', 'Emily Jones | Panthera PT') },

    { id: 'single_leg_bridge', name: 'Single-leg bridge', area: 'hips', physio: true, phase: 2, pos: 'supine', kind: 'reps', reps: [8, 8], secPerRep: 3, sets: [3, 4], sides: true, sideWord: 'leg', switchSecs: 5, rest: 20,
      works: 'Glutes and hamstrings',
      dose: 'Physio: 3–4 sets of 8 reps on each leg.',
      cues: ['Lie on your back, knees bent, feet flat and hip-width apart.', 'Straighten one leg in line with the other thigh.', 'Push through the heel of the bent leg and lift your hips until your body is in a straight line. Keep the hips level.', 'Pause at the top, then lower slowly. About three seconds a rep.'],
      video: V('9bl48SV62u4', 'Single Leg Bridging - Ask Doctor Jo', 'Ask Doctor Jo') },

    { id: 'back_ext', name: 'Prone back extension', area: 'back', physio: true, phase: 2, pos: 'prone', kind: 'reps', reps: [20, 20], secPerRep: 2, sets: [2, 3], rest: 30,
      works: 'Lower back muscles',
      dose: 'Physio: 2–3 sets of 20 reps.',
      cues: ['Lie face down, arms by your sides, legs straight and relaxed.', 'Squeeze your shoulder blades together and lift your chest a few centimetres off the floor.', 'Keep your neck long and look at the floor; don\'t throw your head back.', 'Lower under control and keep breathing.'],
      video: V('qqsgKLO1gYQ', 'Prone Trunk Lift', 'Keep It Moving Physical Therapy & Wellness', 2022) },

    { id: 'side_plank', name: 'Side plank', area: 'core', physio: true, phase: 2, pos: 'side', kind: 'hold', hold: [60, 90], holdStep: 15, sets: [2, 2], sides: true, switchSecs: 10, rest: 20,
      works: 'Obliques and deep core',
      dose: 'Physio: hold 1 minute to 1 minute 30, twice on each side.',
      cues: ['As in your physio\'s picture: lie on your side, bottom knee bent and resting on the floor, top leg straight.', 'Hand or forearm directly under your shoulder.', 'Lift your hips until your body is in a straight line; reach your top arm to the ceiling.', 'Hold still and breathe steadily. Lower and rest if your hips start to sag.'],
      video: V('p2MufgCIW_4', 'Side Plank (modified - 1 knee down)', 'Restore Physical Therapy', 2021) },

    { id: 'dead_bug', name: 'Dead bug', area: 'core', phase: 2, pos: 'supine', kind: 'reps', reps: [6, 8], secPerRep: 6, alt: true, sets: [2, 3], rest: 30,
      works: 'Deep core (stops the lower back arching)',
      dose: '2–3 sets of 6–8 slow reps each side, about 3 seconds out and 3 back (Acıbadem hospital guide to dead bugs and bird dogs).',
      cues: ['Lie on your back, arms pointing at the ceiling, hips and knees bent to 90 degrees.', 'Keep your lower back lightly pressed into the floor throughout.', 'Slowly lower one arm overhead and straighten the opposite leg, stopping before your back arches.', 'Return and switch sides. Breathe out as you reach; don\'t hold your breath.'],
      video: V('g_BYB0R-4Ws', 'Core Exercise: Dead Bug', 'Children\'s Hospital Colorado') },

    { id: 'bird_dog', name: 'Bird dog', area: 'core', phase: 2, pos: 'quad', kind: 'reps', reps: [5, 6], secPerRep: 10, holdEach: 8, alt: true, sets: [1, 2], rest: 30,
      works: 'Back extensors, glutes and core',
      dose: 'Hold each rep 8–10 seconds and alternate sides (one of Stuart McGill\'s "big 3", as described by PT Progress).',
      cues: ['On hands and knees with a flat back, as if balancing a glass of water on it.', 'Brace your stomach, then reach one arm forward and the opposite leg back, no higher than your body.', 'Hold, keeping your hips level, then return and switch sides.', 'Keep your neck long and look at the floor just ahead of your hands.'],
      video: V('y6-97GJ2tCY', 'Spine Stability Exercise - The Quadruped Track (Bird Dog)', 'Elevate Sport and Spine Therapy') },

    { id: 'curl_up', name: 'McGill curl-up', area: 'core', phase: 2, pos: 'supine', kind: 'reps', reps: [5, 5], secPerRep: 12, holdEach: 10, sets: [1, 2], rest: 30,
      works: 'Front of the core without bending the lower back',
      dose: '10-second holds. McGill\'s pyramid is 5, then 3, then 1, with 30 seconds\' rest (PT Progress). Swap which knee is bent between sets.',
      cues: ['Lie on your back with one knee bent and the other leg straight.', 'Slide your hands, palms down, under the natural curve of your lower back. Don\'t flatten it.', 'Brace your stomach and lift your head and shoulders only slightly, as one unit. Keep your chin tucked.', 'Hold, breathing steadily, then lower.'],
      video: V('_tz9WGVH25g', 'How To Correctly Perform The McGill Modified Curl Up', 'Ryan Hollien', 2020) },

    { id: 'hip_flexor', name: 'Half-kneeling hip flexor stretch', area: 'hips', phase: 3, pos: 'kneel', kind: 'hold', hold: [30, 45], holdStep: 15, sets: [1, 2], sides: true, switchSecs: 5, rest: 10,
      works: 'Front of the hip (hip flexors)',
      dose: '30–45 seconds each side (Men\'s Fitness UK). Put a folded towel under the back knee.',
      cues: ['Kneel on one knee, front foot flat with the front knee over the ankle.', 'Stand tall, tuck your pelvis under and squeeze the glute of the kneeling leg.', 'Shift forward slightly until you feel a stretch at the front of the back hip. Don\'t arch your lower back.', 'Breathe and hold, then switch legs.'],
      video: V('F55tzqJggAY', 'Half Kneeling Hip Flexor Stretch | B3 Physical Therapy', 'Cara Giusti, PT, DPT') },

    { id: 'pigeon', name: 'Pigeon stretch', area: 'hips', phase: 3, pos: 'seat', kind: 'hold', hold: [45, 60], holdStep: 15, sets: [1, 2], sides: true, switchSecs: 10, rest: 10,
      works: 'Glutes and outer hip',
      dose: '45–60 seconds each side (Men\'s Fitness UK).',
      cues: ['From hands and knees, bring one knee forward towards the same hand, with the shin angled across in front of you.', 'Slide the other leg straight back, toes pointing behind you.', 'Keep your hips square and lower them towards the floor; stay upright or fold forward over the front leg.', 'Back off if you feel it in the front knee. A pillow under the front hip helps.'],
      video: V('op-eDU9eNqM', 'Piriformis Pigeon Stretch - Ask Doctor Jo', 'Ask Doctor Jo') },

    { id: 'ninety_ninety', name: '90/90 hip stretch', area: 'hips', phase: 3, pos: 'seat', kind: 'hold', hold: [30, 45], holdStep: 15, sets: [1, 2], sides: true, switchSecs: 10, rest: 10,
      works: 'Hip rotation, both ways',
      dose: '30–45 seconds each side (Men\'s Fitness UK).',
      cues: ['Sit with both knees bent to 90 degrees: front leg turned out in front of you, back leg turned in out to the side.', 'Sit tall and lean gently over the front shin until you feel the stretch in that hip.', 'Hold, then swing both knees over like windscreen wipers to face the other way.', 'Use your hands behind you for support if you need to.'],
      video: V('f_7qIPxw6nE', 'How To Do 90 90 Hip Rotations', 'PureGym') },

    { id: 'butterfly', name: 'Butterfly stretch', area: 'hips', phase: 3, pos: 'seat', kind: 'hold', hold: [30, 45], holdStep: 15, sets: [1, 2], rest: 10,
      works: 'Inner thighs (groin)',
      dose: 'About 30 seconds (Men\'s Fitness UK); repeat if time allows.',
      cues: ['Sit with the soles of your feet together and knees falling out to the sides.', 'Hold your ankles and sit tall, lengthening your spine.', 'Let your knees relax towards the floor; press gently on your inner thighs if you want more.', 'For more stretch, hinge forward from the hips with a straight back.'],
      video: V('4xweyzS7Rno', 'Seated Butterfly Stretch – Your Exercise Solution (YES)', 'Arthritis Foundation') },

    { id: 'hamstring', name: 'Lying hamstring stretch', area: 'hips', phase: 3, pos: 'supine', kind: 'hold', hold: [30, 45], holdStep: 15, sets: [1, 2], sides: true, switchSecs: 5, rest: 10,
      works: 'Back of the thigh',
      dose: '30–45 seconds each side. ACSM suggests 10–30 second holds for most adults and says 30–60 seconds may help older adults.',
      cues: ['Lie on your back with a towel or strap around one foot.', 'Lift that leg, keeping the knee straight, until you feel a stretch at the back of the thigh.', 'Keep the other leg flat on the floor (or bent if your back prefers it).', 'Relax your shoulders and breathe; no bouncing.'],
      video: V('Il1L75v6gq0', 'Hamstring Stretch with a Strap, Supine - Ask Doctor Jo', 'Ask Doctor Jo') },

    { id: 'figure_four', name: 'Figure-four stretch', area: 'hips', phase: 3, pos: 'supine', kind: 'hold', hold: [30, 60], holdStep: 15, sets: [1, 2], sides: true, switchSecs: 5, rest: 10,
      works: 'Glutes and piriformis',
      dose: '30–60 seconds each side, the hold the American Medical Association\'s hip stretch guide gives for its figure-four stretch.',
      cues: ['Lie on your back, knees bent, feet flat.', 'Cross one ankle over the opposite knee, letting the crossed knee fall outwards.', 'Reach through and hold behind the supporting thigh, then gently pull it towards your chest.', 'Keep your head and shoulders relaxed on the floor.'],
      video: V('2VE_NLcNMvQ', 'Glute Figure 4 Stretch - Ask Doctor Jo', 'Ask Doctor Jo') },

    { id: 'knee_hugs', name: 'Knee hugs', area: 'back', phase: 4, pos: 'supine', kind: 'hold', hold: [30, 45], holdStep: 15, sets: [1, 2], rest: 10,
      works: 'Lower back and glutes',
      dose: 'From an NHS (Addenbrooke\'s) back mobility handout, which leaves the hold time to your physio. 30–45 seconds follows ACSM\'s hold guidance.',
      cues: ['Lie on your back and bring both knees up towards your chest.', 'Hold behind your knees (or on your shins) and gently draw them in.', 'Let your lower back relax into the floor.', 'Breathe slowly; a gentle rock side to side is fine.'],
      video: V('5R7eWaNWO3U', 'Double Knee to Chest - Ask Doctor Jo', 'Ask Doctor Jo') },

    { id: 'childs_pose', name: 'Child\'s pose', area: 'back', physio: true, phase: 4, pos: 'kneel', kind: 'hold', hold: [30, 30], sets: [1, 1], rest: 0,
      works: 'Lower back and hips',
      dose: 'Physio: 30 seconds.',
      cues: ['Kneel, big toes together and knees about hip-width apart.', 'Sit back towards your heels and walk your hands forward along the floor.', 'Rest your forehead on the floor or a cushion.', 'Breathe slowly into your lower back and let it relax.'],
      video: V('X-OGH5-gLUs', 'Prayer Stretch / Child\'s Pose - Ask Doctor Jo', 'Ask Doctor Jo') }
  ];
  const BY_ID = {}; LIB.forEach(x => { BY_ID[x.id] = x; });
  const get = id => BY_ID[id];

  /* ------------------------------------------------------------ doses and timing */
  const SETUP = 10;          // seconds to get into position
  function minDose(x) { return x.kind === 'hold' ? { sets: x.sets[0], hold: x.hold[0] } : { sets: x.sets[0], reps: x.reps[0] }; }
  function workSecs(x, d) { return x.kind === 'hold' ? d.hold : d.reps * x.secPerRep * (x.alt ? 2 : 1); }
  function secs(x, d) {
    const w = workSecs(x, d), sides = x.sides ? 2 : 1;
    return SETUP + d.sets * (w * sides + (x.sides ? (x.switchSecs || 5) : 0)) + (d.sets - 1) * (x.rest || 0);
  }
  // The next step up within the range, or null at the top.
  function grow(x, d) {
    if (d.sets < x.sets[1]) return Object.assign({}, d, { sets: d.sets + 1 });
    if (x.kind === 'hold' && d.hold < x.hold[1]) return Object.assign({}, d, { hold: Math.min(x.hold[1], d.hold + (x.holdStep || 15)) });
    if (x.kind === 'reps' && d.reps < x.reps[1]) return Object.assign({}, d, { reps: Math.min(x.reps[1], d.reps + 4) });
    return null;
  }
  function sideWord(x) { return x.sideWord === 'leg' ? 'each leg' : 'each side'; }
  function doseText(x, d) {
    const s = d.sets > 1 ? d.sets + ' × ' : '';
    if (x.kind === 'hold') return x.sides ? `${s}${d.hold} s ${sideWord(x)}` : (d.sets > 1 ? `${d.sets} × ${d.hold} s` : `${d.hold} s hold`);
    if (x.holdEach) return (d.sets > 1 ? `${d.sets} sets of ` : '') + (x.alt ? `${d.reps} ${sideWord(x)}, ${x.holdEach} s holds` : `${d.reps} × ${x.holdEach} s holds`);
    if (x.alt) return `${s}${d.reps} ${sideWord(x)}, alternating`;
    if (x.sides) return `${s}${d.reps} reps ${sideWord(x)}`;
    return d.sets > 1 ? `${d.sets} × ${d.reps} reps` : `${d.reps} reps`;
  }

  // The timed steps for one exercise: get into position, work (per side), switch sides, rest between sets.
  function steps(x, d) {
    const out = [{ kind: 'setup', secs: SETUP, label: 'Get into position' }];
    const sides = x.sides ? ['Left', 'Right'] : [null];
    const w = workSecs(x, d);
    for (let s = 0; s < d.sets; s++) {
      sides.forEach((side, k) => {
        let label = x.kind === 'hold' ? 'Hold' : (x.alt ? `${d.reps} ${sideWord(x)}` : `${d.reps} reps`);
        if (side) label = `${side} ${x.sideWord || 'side'}: ` + label.toLowerCase();
        out.push({ kind: 'work', secs: w, set: s + 1, of: d.sets, side, label });
        if (side && k === 0) out.push({ kind: 'switch', secs: x.switchSecs || 5, label: `Switch to the right ${x.sideWord || 'side'}` });
      });
      if (s < d.sets - 1 && x.rest) out.push({ kind: 'rest', secs: x.rest, label: `Rest, then set ${s + 2}` });
    }
    return out;
  }

  /* ------------------------------------------------------------ planner */
  function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const dayKey = t => { const d = new Date(t); return d.getFullYear() + '-' + d.getMonth() + '-' + d.getDate(); };

  function history(state) { return (state.mobility || []).filter(m => m && m.end).slice().sort((a, b) => b.end - a.end); }

  // How much an exercise is due: longer since you last did it scores higher; the physio's exercises get a head start;
  // anything in your last two stretch sessions is held back so each session is a different mix.
  function scorer(state, now, salt) {
    const hist = history(state);
    const last = {};
    hist.forEach(m => (m.items || []).forEach(id => { if (!(id in last)) last[id] = m.end; }));
    const r1 = new Set(hist[0] ? hist[0].items : []), r2 = new Set(hist[1] ? hist[1].items : []);
    const rand = rng(hashStr(dayKey(now) + ':' + (salt || 0) + ':' + hist.length));
    const jitter = {}; LIB.forEach(x => { jitter[x.id] = rand() * 3; });
    return x => {
      const days = last[x.id] != null ? Math.min(14, Math.max(0, (now - last[x.id]) / DAY)) : 14;
      let s = days + (x.physio ? 4 : 0) + jitter[x.id];
      if (r1.has(x.id)) s -= 9; else if (r2.has(x.id)) s -= 4;
      return s;
    };
  }

  const TARGET = { hips: 0.45, core: 0.3, back: 0.25 };   // share of time; hips lead

  function build(state, opts) {
    const now = opts.now, budget = Math.round(opts.minutes * 60);
    const excluded = (state.prefs && state.prefs.stretchExcluded) || {};
    const pool = LIB.filter(x => !excluded[x.id]);
    const score = scorer(state, now, opts.salt);
    const chosen = [];
    let used = 0;
    const cost = x => secs(x, minDose(x));
    const fits = (x, room) => !chosen.some(c => c.x === x) && cost(x) <= room;
    const best = (cands, room) => cands.filter(x => fits(x, room)).sort((a, b) => score(b) - score(a))[0] || null;
    const add = x => { chosen.push({ x, d: minDose(x) }); used += cost(x); };

    // Wind-down is planned first so it always fits, then a warm-up.
    const closer = best(pool.filter(x => x.phase === 4), budget);
    const reserve = closer ? cost(closer) : 0;
    const opener = best(pool.filter(x => x.phase === 1), budget - reserve);
    if (opener) add(opener);
    // At least one of your physio's strength exercises when it fits.
    const phys = best(pool.filter(x => x.physio && x.phase === 2), budget - reserve - used);
    if (phys) add(phys);
    // Then fill with whatever is most due, nudged towards whichever of hips, core and lower back is short of time.
    for (;;) {
      const room = budget - reserve - used;
      const areaTime = { hips: 0, core: 0, back: 0 };
      chosen.forEach(c => { areaTime[c.x.area] += secs(c.x, c.d); });
      if (closer) areaTime[closer.area] += reserve;
      const total = Math.max(1, areaTime.hips + areaTime.core + areaTime.back);
      const value = x => score(x) - 12 * Math.max(0, areaTime[x.area] / total - TARGET[x.area]) + 4 * Math.max(0, TARGET[x.area] - areaTime[x.area] / total);
      const pick = pool.filter(x => (x.phase === 2 || x.phase === 3) && fits(x, room)).sort((a, b) => value(b) - value(a))[0];
      if (!pick) break;
      // Something you did last time only gets in when the plan would otherwise be short; spare time lengthens the rest instead.
      if (score(pick) < 0 && used + reserve >= budget * 0.8) break;
      add(pick);
    }
    if (closer) add(closer);
    // Spend spare time on bigger doses, physio exercises first.
    let room = budget - used;
    const pri = chosen.slice().sort((a, b) => (b.x.physio ? 1 : 0) - (a.x.physio ? 1 : 0) || score(b.x) - score(a.x));
    for (let changed = true; changed;) {
      changed = false;
      for (const c of pri) {
        const g = grow(c.x, c.d); if (!g) continue;
        const extra = secs(c.x, g) - secs(c.x, c.d);
        if (extra <= room) { c.d = g; room -= extra; changed = true; }
      }
    }
    chosen.sort((a, b) => a.x.phase - b.x.phase || POS[a.x.pos] - POS[b.x.pos]);
    return finish({ id: 'st_' + now.toString(36) + Math.floor(Math.random() * 1e4).toString(36), minutes: opts.minutes, created: now,
      items: chosen.map(c => ({ exId: c.x.id, dose: c.d, done: false })) });
  }
  function finish(plan) {
    plan.totalSecs = plan.items.reduce((t, it) => t + secs(get(it.exId), it.dose), 0);
    plan.estMinutes = Math.max(1, Math.round(plan.totalSecs / 60));
    return plan;
  }

  // Three alternatives not already in the plan: the same area first, then the same kind of exercise.
  function alternatives(state, plan, i, now) {
    const cur = get(plan.items[i].exId);
    const excluded = (state.prefs && state.prefs.stretchExcluded) || {};
    const inPlan = new Set(plan.items.map(it => it.exId));
    const score = scorer(state, now, 0);
    return LIB.filter(x => !inPlan.has(x.id) && !excluded[x.id])
      .sort((a, b) => (b.area === cur.area) - (a.area === cur.area) || (b.phase === cur.phase) - (a.phase === cur.phase) || score(b) - score(a))
      .slice(0, 3);
  }
  function swap(plan, i, exId) {
    const x = get(exId); if (!x) return plan;
    plan.items[i] = { exId, dose: minDose(x), done: false };
    plan.items.sort((a, b) => get(a.exId).phase - get(b.exId).phase || POS[get(a.exId).pos] - POS[get(b.exId).pos]);
    return finish(plan);
  }

  // What gets saved when a session ends.
  function record(plan, now) {
    const done = plan.items.filter(it => it.done).map(it => it.exId);
    const start = plan.start || now;
    return { id: plan.id, start, end: now, updatedAt: now, minutes: Math.max(1, Math.round((now - start) / 60000)), planned: plan.minutes, items: done };
  }
  function weekStats(state, now) {
    const d = new Date(now); const dow = (d.getDay() + 6) % 7;
    const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - dow).getTime();
    const hist = history(state);
    const week = hist.filter(m => m.end >= monday);
    return { count: week.length, minutes: week.reduce((t, m) => t + (m.minutes || 0), 0), days: week.map(m => (new Date(m.end).getDay() + 6) % 7), last: hist[0] || null };
  }

  /* ------------------------------------------------------------ drawings */
  // Side-on figures in a 112 × 66 box with the floor at y = 62. "far" limbs are drawn lighter, behind the body.
  // glow marks where you should feel it.
  const P = {
    cat_cow: { torso: 'M36 38 Q53 22 70 38', head: [28, 45], far: [[[38, 38], [38, 61]], [[68, 38], [68, 61], [85, 62]]], near: [[[36, 38], [36, 61]], [[70, 38], [70, 61], [88, 62]]], dash: 'M36 38 Q53 50 70 38', glow: [62, 33, 8] },
    knee_rolls: { torso: 'M24 59 L48 59', head: [14, 56.5], far: [[[24, 59], [34, 61], [44, 61]], [[48, 58], [62, 50], [74, 61]]], near: [[[48, 59], [64, 47], [78, 60]]], arrow: 'M69 35 Q80 38 83 49 M83 49 L78.5 46.5 M83 49 L84 43.8', glow: [40, 58, 8] },
    worlds_greatest: { torso: [[52, 46], [73, 35]], head: [81, 30], far: [[[73, 35], [67, 47], [63, 60]], [[52, 46], [34, 53], [16, 58], [12, 61]]], near: [[[52, 46], [71, 43], [74, 61], [80, 61]], [[73, 35], [75, 22], [77, 10]]], glow: [46, 50, 7] },
    single_leg_bridge: { torso: [[24, 59], [50, 46]], head: [14, 56.5], far: [[[50, 46], [66, 38], [82, 30], [84, 24]]], near: [[[24, 59], [36, 61], [48, 61]], [[50, 46], [65, 40], [69, 60], [76, 61]]], glow: [47, 50, 8] },
    back_ext: { torso: [[62, 58], [38, 49]], head: [30, 45], far: [[[62, 57], [80, 58], [98, 58], [104, 61]]], near: [[[38, 49], [49, 54], [59, 56]], [[62, 59], [81, 60], [100, 60], [106, 62]]], glow: [56, 54, 8] },
    side_plank: { torso: [[33, 40], [63, 50]], head: [24, 37], far: [[[63, 50], [77, 61], [62, 62]]], near: [[[33, 40], [31, 50], [30, 61]], [[33, 40], [34, 27], [35, 14]], [[63, 50], [81, 55], [99, 60], [104, 61]]], glow: [50, 44, 9] },
    dead_bug: { torso: [[27, 59], [51, 59]], head: [16, 56.5], far: [[[27, 59], [28, 46], [29, 34]], [[51, 58], [52, 40], [70, 40]]], near: [[[27, 58], [18, 48], [7, 44]], [[51, 59], [70, 54], [89, 51], [92, 46]]], glow: [39, 56, 9] },
    bird_dog: { torso: [[40, 38], [68, 38]], head: [31, 35], far: [[[40, 38], [40, 61]], [[68, 38], [68, 61], [86, 62]]], near: [[[40, 38], [27, 37], [15, 36]], [[68, 38], [88, 38], [107, 38], [109, 43]]], glow: [56, 41, 8] },
    curl_up: { torso: [[25, 56], [49, 59]], head: [16, 51], far: [[[49, 59], [69, 60], [89, 60], [93, 56]]], near: [[[25, 56], [33, 62], [44, 61]], [[49, 59], [61, 42], [73, 60], [79, 61]]], glow: [37, 55, 9] },
    hip_flexor: { torso: [[48, 43], [48, 19]], head: [48, 11.5], far: [[[48, 43], [67, 40], [67, 60], [73, 61]]], near: [[[48, 43], [40, 61], [21, 61], [17, 60]], [[48, 19], [56, 28], [50, 37]]], glow: [50, 46, 7] },
    pigeon: { torso: [[52, 52], [58, 29]], head: [60, 21], far: [[[52, 53], [34, 59], [16, 61], [12, 62]]], near: [[[52, 52], [71, 58], [58, 61]], [[58, 29], [64, 41], [69, 53]]], glow: [51, 50, 8] },
    ninety_ninety: { torso: [[52, 52], [54, 28]], head: [55, 20], far: [[[50, 53], [32, 57], [22, 47]], [[54, 28], [44, 38], [40, 52]]], near: [[[54, 53], [75, 57], [60, 61]], [[54, 28], [63, 39], [68, 51]]], glow: [53, 51, 8] },
    butterfly: { torso: [[56, 54], [56, 30]], head: [56, 22], far: [[[56, 32], [65, 44], [59, 57]]], near: [[[53, 55], [36, 53], [54, 60]], [[59, 55], [76, 53], [58, 60]], [[56, 32], [47, 44], [53, 57]]], glow: [56, 57, 9] },
    hamstring: { torso: [[22, 59], [46, 59]], head: [12, 56.5], far: [[[46, 59], [66, 60], [86, 60], [90, 56]]], near: [[[46, 59], [56, 41], [66, 23], [71, 22]], [[22, 59], [31, 51], [40, 45]]], strap: [[40, 45], [67, 21]], glow: [57, 40, 7] },
    figure_four: { torso: [[22, 59], [46, 59]], head: [12, 56.5], far: [[[46, 59], [60, 42], [74, 60], [80, 61]], [[22, 59], [36, 52], [52, 47]]], near: [[[46, 59], [48, 40], [62, 42]]], glow: [44, 55, 8] },
    knee_hugs: { torso: [[22, 59], [46, 59]], head: [12, 56.5], far: [[[45, 58], [36, 41], [53, 34]]], near: [[[46, 59], [38, 41], [55, 35]], [[22, 59], [31, 47], [41, 39]]], glow: [42, 58, 8] },
    childs_pose: { torso: [[76, 50], [46, 52]], head: [38, 56.5], far: [[[76, 51], [58, 61], [80, 62]]], near: [[[76, 50], [58, 60], [84, 61], [88, 60]], [[46, 52], [32, 58], [18, 61]]], glow: [66, 47, 8] }
  };
  function figure(id, cls) {
    const p = P[id]; if (!p) return '';
    const line = pts => `<polyline points="${pts.map(q => q.join(',')).join(' ')}"/>`;
    const torso = typeof p.torso === 'string' ? `<path class="t" d="${p.torso}"/>` : `<polyline class="t" points="${p.torso.map(q => q.join(',')).join(' ')}"/>`;
    return `<svg class="fig${cls ? ' ' + cls : ''}" viewBox="0 0 112 66" aria-hidden="true" focusable="false">` +
      `<rect class="mat" x="4" y="62" width="104" height="3" rx="1.5"/>` +
      (p.glow ? `<circle class="glow" cx="${p.glow[0]}" cy="${p.glow[1]}" r="${p.glow[2]}"/>` : '') +
      `<g class="far">${p.far.map(line).join('')}</g>` +
      (p.dash ? `<path class="dash" d="${p.dash}"/>` : '') +
      `<g class="near">${torso}${p.near.map(line).join('')}</g>` +
      `<circle class="head" cx="${p.head[0]}" cy="${p.head[1]}" r="5.5"/>` +
      (p.strap ? `<line class="strap" x1="${p.strap[0][0]}" y1="${p.strap[0][1]}" x2="${p.strap[1][0]}" y2="${p.strap[1][1]}"/>` : '') +
      (p.arrow ? `<path class="arrow" d="${p.arrow}"/>` : '') +
      `</svg>`;
  }

  return { LIB, AREAS, PHYSIO_NOTE, SETUP, get, minDose, secs, grow, doseText, steps, build, finish, alternatives, swap, record, weekStats, history, figure, POSES: P };
});
