/* Rebuild — how-to guides
 * Short technique cues for every exercise, a link to video demonstrations,
 * and, for Watson machines, a link to the manufacturer's page with photos of the machine.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Guides = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Technique cues by movement pattern
  const P = {
    squatMachine: [
      'Set the pads so you start upright with your feet in the middle of the platform, about shoulder-width apart.',
      'Brace, release the safety and sit down under control for about two seconds, keeping your heels down and knees following your toes.',
      'Go as deep as you can while your lower back stays against the pad, ideally thighs at least parallel.',
      'Drive up through your whole foot and stop just short of locking your knees.'
    ],
    beltSquat: [
      'Fasten the belt low on your hips and stand with feet slightly wider than shoulder-width.',
      'Hold the handles lightly for balance and sit straight down between your heels.',
      'Keep your chest up and knees tracking over your toes; stand up by pushing the floor away.'
    ],
    barbellSquat: [
      'Set the bar at upper-chest height in the rack and the safety pins just below your bottom position.',
      'Bar on your upper back, feet shoulder-width, toes slightly out. Brace your stomach before each rep.',
      'Sit down and back until your thighs are at least parallel, knees following your toes.',
      'Drive up keeping your chest up; breathe out near the top.'
    ],
    legPress: [
      'Sit with your back and hips flat on the pad and feet shoulder-width in the middle of the plate.',
      'Release the safety and lower until your knees are around 90°, stopping before your lower back peels off the pad.',
      'Press through your mid-foot and stop just short of locking your knees.'
    ],
    splitSquat: [
      'Take a long stance so your front shin stays roughly vertical at the bottom.',
      'Lower your back knee towards the floor under control, keeping most of the weight on the front foot.',
      'Drive up through your front heel. Finish all reps on one leg, then switch.'
    ],
    legExtension: [
      'Line your knee joint up with the machine pivot; the pad sits on your lower shin.',
      'Straighten your legs fully and squeeze your thighs for a second.',
      'Lower over two to three seconds; don\'t let the weight drop.'
    ],
    rdl: [
      'Stand tall holding the weight with soft knees.',
      'Push your hips back, keeping the weight close to your legs and your back flat.',
      'Lower until you feel a strong hamstring stretch, usually around mid-shin.',
      'Drive your hips forward to stand, squeezing your glutes; don\'t lean back at the top.'
    ],
    machineHinge: [
      'Set the pads so the movement hinges at your hips, with feet planted and knees slightly bent.',
      'Keep your back flat and let your hips travel back as you lower.',
      'Stand by driving your hips forward and squeezing your glutes; avoid over-arching at the top.'
    ],
    legCurl: [
      'Line your knee up with the machine pivot; the pad sits just above your heel.',
      'Curl as far as you can and pause for a second.',
      'Lower slowly and keep your hips down on the pad throughout.'
    ],
    ghr: [
      'Knees on the pad and ankles locked under the rollers; the counterweight helps you through the hard part.',
      'Keeping hips straight, lower your body forward under control as far as you can.',
      'Pull yourself back up with your hamstrings. Add assistance rather than bending at the hips.'
    ],
    hipThrust: [
      'Set up so your shins are vertical at the top of the movement.',
      'Tuck your chin and keep your ribs down, then drive your hips up to full extension.',
      'Squeeze your glutes for a second at the top; lower under control.'
    ],
    reverseHyper: [
      'Lie face down with your hips at the edge of the pad and legs hanging.',
      'Lift your legs to hip height using your glutes, not momentum.',
      'Lower under control and avoid swinging.'
    ],
    backExtension: [
      'Set the pad so your hip crease sits just above its edge.',
      'Lower with a flat back until you feel your hamstrings stretch.',
      'Rise until your body is in a straight line, squeezing your glutes; don\'t over-arch.'
    ],
    abduction: [
      'Sit tall with the pads on the outside of your knees.',
      'Push your knees apart as far as you can and pause.',
      'Return slowly without letting the stack touch down between reps.'
    ],
    calfRaise: [
      'Put the balls of your feet on the edge of the platform.',
      'Lower your heels to a full stretch and pause for a second.',
      'Rise as high as you can and pause at the top. No bouncing.'
    ],
    hangingRaise: [
      'Hang from the bar with straight arms and stop any swinging first.',
      'Curl your pelvis up as you raise your legs, keeping the movement slow.',
      'Lower under control. Bend your knees to make it easier.'
    ],
    crunch: [
      'Set up with the handles or rope by your head.',
      'Curl your ribs down towards your hips, rounding your spine; your hips stay still.',
      'Return slowly to a stretch before the next rep.'
    ],
    chestPress: [
      'Set the seat so the handles line up with the middle of your chest.',
      'Pull your shoulder blades back and down and keep them there.',
      'Press out without slamming into lockout, then lower until you feel a stretch across your chest, elbows about 45° from your body.'
    ],
    inclinePress: [
      'Set the seat so the handles start level with your upper chest.',
      'Shoulder blades back and down, feet flat.',
      'Press up and slightly back, then lower slowly to a good stretch.'
    ],
    benchPress: [
      'Lie with your eyes under the bar, feet planted, shoulder blades pinched together. Set the safety arms.',
      'Grip slightly wider than shoulder-width and lower the bar to your lower chest with forearms vertical.',
      'Press up and slightly back towards your face. Use a spotter or safeties when the set is hard.'
    ],
    dumbbellPress: [
      'Sit with the dumbbells on your knees, lie back and kick them into position.',
      'Lower with elbows about 45° from your body until you feel a stretch.',
      'Press up until your arms are nearly straight; don\'t clash the dumbbells.'
    ],
    shoulderPress: [
      'Set the seat so the handles start around shoulder height.',
      'Brace your stomach and keep your lower back against the pad.',
      'Press overhead to just short of lockout, then lower under control to chin height.'
    ],
    vikingPress: [
      'Stand with feet hip-width and the handles at shoulder height.',
      'Brace hard so your lower back doesn\'t arch.',
      'Press overhead and lower under control. Strict presses first; leg drive only when the programme allows.'
    ],
    fly: [
      'Keep a slight bend in your elbows and fix it for the whole set.',
      'Open your arms until you feel a stretch across your chest, without your shoulders rolling forward.',
      'Bring your hands together by squeezing your chest, pause, then open slowly.'
    ],
    lateralRaise: [
      'Stand or sit tall with a slight forward lean.',
      'Lead with your elbows and raise your arms out to the side to shoulder height.',
      'Don\'t shrug. Lower over two to three seconds.'
    ],
    pushdown: [
      'Stand close to the cable with your elbows pinned to your sides.',
      'Straighten your arms fully, squeezing your triceps.',
      'Let the handle return slowly until your forearms pass horizontal.'
    ],
    overheadExtension: [
      'Face away from the cable with the rope behind your head and elbows pointing forwards.',
      'Let the rope stretch your triceps behind your head.',
      'Straighten your arms without moving your elbows, then return slowly.'
    ],
    dipMachine: [
      'Stand or sit tall with your elbows tucked close to your body.',
      'Press the handles down until your arms are straight, squeezing your triceps.',
      'Return slowly to a comfortable stretch at the shoulders.'
    ],
    dip: [
      'Support yourself on straight arms with a slight forward lean.',
      'Lower until your shoulders are just below your elbows, or as far as is comfortable.',
      'Press back up to straight arms. Add weight with a belt once 12 reps feel easy.'
    ],
    skullCrusher: [
      'Lie on the bench holding the bar over your forehead with a narrow grip.',
      'Bend only at the elbows to lower the bar towards your head.',
      'Straighten your arms without your elbows flaring.'
    ],
    pulldown: [
      'Lock your thighs under the pads and start with your arms straight.',
      'Pull your elbows down towards your ribs, chest up, without leaning far back.',
      'Pause near your upper chest, then let your arms go fully straight again under control.'
    ],
    chinup: [
      'Hang from the bar with an underhand grip about shoulder-width.',
      'Pull until your chin is over the bar, driving your elbows down.',
      'Lower all the way to straight arms each rep.'
    ],
    assistedChin: [
      'More weight on the stack means more help. Kneel or stand on the platform.',
      'Pull your chin over the bar, driving your elbows down.',
      'Lower to straight arms. Reduce the assistance as you get stronger.'
    ],
    row: [
      'Set the chest pad so you can reach the handles with your arms fully straight.',
      'Pull your elbows back past your ribs, squeezing your shoulder blades together.',
      'Pause, then let your arms go straight and your shoulders move forward for a full stretch.'
    ],
    cableRow: [
      'Sit tall with a slight bend in your knees.',
      'Pull the handle to your lower ribs, squeezing your shoulder blades together.',
      'Return to straight arms with your shoulders reaching forward, without rocking your torso.'
    ],
    dumbbellRow: [
      'Put one hand and knee on the bench with your back flat.',
      'Row the dumbbell towards your hip, elbow close to your side.',
      'Lower to a full stretch. Finish one side, then switch.'
    ],
    pullover: [
      'Set the seat so your shoulders line up with the machine pivot and your arms rest on the pads.',
      'Let your arms travel up and back to a stretch in your lats.',
      'Drive your elbows down to your sides, pause, and return slowly.'
    ],
    straightArm: [
      'Stand facing the cable with arms nearly straight and a slight hip hinge.',
      'Sweep the bar down to your thighs using your lats.',
      'Return slowly to a stretch overhead.'
    ],
    shrug: [
      'Stand or sit tall holding the handles with arms long.',
      'Lift your shoulders straight up towards your ears and pause.',
      'Lower fully. Don\'t roll your shoulders.'
    ],
    reversePec: [
      'Sit facing the pad with the handles at shoulder height.',
      'Sweep your arms back and out, leading with your elbows.',
      'Pause, then return slowly without letting the stack rest.'
    ],
    facePull: [
      'Set the rope at forehead height.',
      'Pull towards your face with your elbows high, pulling the ends of the rope apart.',
      'Pause with your hands beside your ears, then return slowly.'
    ],
    rearRaise: [
      'Lie chest-down on an incline bench with dumbbells hanging.',
      'Raise your arms out to the side, leading with your elbows.',
      'Pause at shoulder height and lower slowly.'
    ],
    curl: [
      'Keep your elbows fixed by your sides or on the pad.',
      'Curl all the way up and squeeze your biceps.',
      'Lower over two to three seconds to straight arms.'
    ],
    hammerCurl: [
      'Hold the dumbbells with palms facing each other and elbows by your sides.',
      'Curl up without swinging, keeping the neutral grip.',
      'Lower slowly to straight arms.'
    ],
    inclineCurl: [
      'Sit back on an incline bench and let your arms hang straight down behind your body.',
      'Curl up without letting your elbows move forward.',
      'Lower slowly to a full stretch.'
    ]
  };

  const PATTERN = {
    squatMachine: ['pendulum', 'adj_hack', 'lin_hack', 'hack', 'hack30', 'power_squat', 'tru_squat', 'leverage_squat', 'smith_squat'],
    beltSquat: ['belt_squat'], barbellSquat: ['bb_squat'],
    legPress: ['animal_lp', 'lp45', 'horiz_lp', 'pivot_lp', 'rear_pivot_lp', 'hs_lp', 'vert_lp'],
    splitSquat: ['lunge_machine', 'db_bss', 'smith_split'],
    legExtension: ['pl_leg_ext', 'leg_ext'],
    rdl: ['rdl_bb', 'db_rdl', 'smith_rdl'], machineHinge: ['total_torso', 'pl_deadlift'],
    legCurl: ['standing_curl', 'leg_curl'], ghr: ['ghr'],
    hipThrust: ['glute_blaster', 'standing_thrust', 'bb_hip_thrust'], reverseHyper: ['reverse_hyper'],
    backExtension: ['back_ext'], abduction: ['abductor'],
    calfRaise: ['seated_calf', 'seated_calf_tib', 'total_calf', 'donkey_calf', 'calf45', 'lp_calf'],
    hangingRaise: ['hanging_leg', 'hanging_knee'], crunch: ['cable_crunch', 'ab_machine'],
    chestPress: ['pl_chest', 'pl_bench', 'free_chest', 'conv_stand', 'stand_chest', 'decline_press', 'hs_chest'],
    benchPress: ['bench_bb', 'incline_bb'], dumbbellPress: ['db_bench', 'db_incline', 'db_ohp'],
    inclinePress: ['super_incline', 'hs_incline', 'smith_incline'],
    shoulderPress: ['pl_shoulder', 'delt_builder', 'incline_shoulder', 'free_shoulder', 'hs_shoulder'],
    vikingPress: ['viking_animal', 'viking'],
    fly: ['pec_fly', 'arched_fly', 'pec_deck', 'cable_fly', 'db_fly'],
    lateralRaise: ['pl_lat_raise', 'mc_lat_raise', 'cable_lat', 'db_lat'],
    pushdown: ['pushdown'], overheadExtension: ['oh_cable_ext'], dipMachine: ['iso_dip', 'seated_dip'], dip: ['dip_bw'],
    skullCrusher: ['ez_skull'],
    pulldown: ['tru_pull', 'front_pulldown', 'lat_pulldown', 'hs_pulldown'], chinup: ['chinup'], assistedChin: ['assisted_chin'],
    row: ['tbar_chest', 'iso_row', 'animal_lat_row', 'low_row', 'lat_row', 'perfect_row', 'tbar', 'hs_row'],
    cableRow: ['cable_row'], dumbbellRow: ['db_row'], pullover: ['pullover'], straightArm: ['straight_arm'], shrug: ['shrug'],
    reversePec: ['reverse_pec'], facePull: ['face_pull'], rearRaise: ['db_rear'],
    curl: ['pl_curl', 'ez_curl', 'cable_curl'], hammerCurl: ['hammer_curl'], inclineCurl: ['incline_curl']
  };
  const PATTERN_OF = {};
  Object.keys(PATTERN).forEach(p => PATTERN[p].forEach(id => { PATTERN_OF[id] = p; }));

  // Extra notes for particular machines or lifts
  const NOTE = {
    db_ohp: 'Sit upright on a bench set just short of vertical, dumbbells at shoulder height.',
    db_incline: 'Set the bench to about 30° so the work stays on your upper chest.',
    incline_bb: 'Set the bench to about 30° and lower the bar to your upper chest.',
    smith_squat: 'Place your feet slightly in front of the bar so you sit back into the squat.',
    vert_lp: 'You lie under the sled here, so keep your hips flat and use a shorter range if your lower back lifts.',
    pl_deadlift: 'Stand inside the frame with the handles at your sides and keep your back flat as you stand up.',
    lp_calf: 'Use only the balls of your feet on the bottom edge of the plate and keep your knees almost straight.',
    lunge_machine: 'The machine guides the path, so focus on a long stance and a vertical front shin.',
    standing_curl: 'Work one leg at a time; brace on the handles so your hips don\'t move.',
    iso_dip: 'Lean slightly forward to bring in more chest, or stay upright to bias your triceps.',
    tru_pull: 'The converging arms let you pull slightly inwards at the bottom; finish with your elbows by your ribs.',
    tbar_chest: 'Keep your chest on the pad throughout so your lower back isn\'t loaded.',
    super_incline: 'Very steep incline: it bridges chest and shoulder pressing, so keep your shoulder blades pinned.',
    rdl_bb: 'Start from the rack or lift the bar from the floor with a flat back.',
    chinup: 'If you can\'t do five clean reps yet, use the assisted machine or a band and build up.',
    pendulum: 'The pendulum arc keeps you upright, which allows deep knee bend with little lower-back load.'
  };

  // Manufacturer pages (photos of the machine), Watson Gym Equipment
  const WG = 'https://watsongym.co.uk/product/';
  const MACHINE = {
    w_adj_hack: 'adjustable-hack-squat/', w_tbar_chest: 'animal-chest-supported-t-bar-row/', w_iso_row: 'animal-iso-linear-row/',
    w_animal_lp: 'animal-plate-load-leg-press/', w_delt_builder: 'plate-loaded-delt-builder/', w_pendulum: 'pendulum-squat/',
    w_trusquat: 'trusquat/', w_smith_cb: 'counter-balanced-plate-loaded-smith-machine-with-4-x-weight-storage/',
    w_half_rack_smith: 'animal-half-rack-four-way-smith-2/', w_glute_blaster: 'plate-load-glute-blaster/',
    w_standing_thrust: 'pl-standing-hip-thrust/', w_seated_calf_tib: 'seated-plate-load-calf-tibia-raise/',
    w_animal_lat_row: 'animal-plate-load-lateral-row/', w_leverage: 'leverage-squat/', w_pivot_lp: 'plate-load-pivot-leg-press/',
    w_super_incline: 'plate-load-super-incline-chest-press/', w_front_pulldown: 'plate-load-front-pulldown/',
    w_smith: 'plate-loaded-smith-machine-with-4-x-weight-storage/', w_lunge: 'plate-loaded-lunge-machine/',
    w_45_lp: '45-leg-press/', w_horiz_lp: 'animal-horizontal-leg-press/', w_viking_animal: 'animal-viking-press/',
    w_belt_squat: 'hip-belt-squat/', w_decline_press: 'plate-load-decline-chest-press/', w_shoulder_press: 'plate-load-shoulder-press/',
    w_power_squat: 'power-squat/', w_total_calf: 'total-calf-tibialis-developer/', w_pec_fly: 'plate-load-pec-fly/',
    w_low_row: 'plate-load-low-row/', w_inverse_curl: 'westside-inverse-curl-pro/', w_vert_lp: 'animal-vertical-leg-press/',
    w_pullover: 'plate-load-independent-pullover/', w_iso_dip: 'standing-iso-dip/', w_lin_hack: 'linear-hack-squat/',
    w_chest_press: 'plate-loaded-chest-press/', w_bench_pl: 'plate-loaded-bench-press/', w_deadlift: 'plate-loaded-deadlift/',
    w_seated_dip: 'seated-plate-loaded-dip/', w_lat_raise: 'plate-load-standing-lateral-raise/',
    w_free_chest: 'plate-load-free-motion-chest-press/', w_total_torso: 'plate-load-total-torso/', w_tru_pull: 'tru-pull/'
  };

  // Specific technique videos, each checked on YouTube for title, channel and date (October 2026).
  // Keyed by movement pattern; EX_CLIP overrides for individual exercises.
  const V = (id, title, channel, year, note) => ({ id, title, channel, year, note: note || null });
  const CLIP = {
    squatMachine: V('36_EC-MgVz8', 'The Hack Squat Guide: Form, Muscles, and Mistakes to Avoid', 'Muscle & Motion', 2025, 'Filmed on a hack squat; the same set-up points apply to the pendulum and other squat machines.'),
    barbellSquat: V('bEv6CCg2BC8', 'How To Get A Huge Squat With Perfect Technique (Fix Mistakes)', 'Jeff Nippard', 2019),
    legPress: V('4eTMx8Epkks', '5 Worst Leg Press Mistakes (Fix These to Get Stronger Safely)', 'Dr. Dave Candy, physical therapist', 2026),
    legExtension: V('xUZNOR6WP0A', '10 Leg Extension Mistakes and How to Fix Them', 'Renaissance Periodization', 2020),
    rdl: V('_oyxCn2iSjU', 'How to Do Romanian Deadlifts (RDLs) With Perfect Technique', 'Jeff Nippard', 2019),
    legCurl: V('jobEeklwrrs', '9 Leg Curl Mistakes and How to Fix Them', 'Renaissance Periodization', 2020),
    hipThrust: V('qFxTNOiQIAU', 'How To Do Hip Thrusts, with Bret Contreras', 'Marie Wold', 2017, 'Barbell hip thrust; the set-up and hip position carry over to the hip thrust machines.'),
    calfRaise: V('Xa18jxyeSnM', '8 Calf Raise Mistakes and How to Fix Them', 'Renaissance Periodization', 2020),
    hangingRaise: V('Yrtvs-nEnk0', 'How To Do Hanging Leg Raises', 'PureGym', 2023),
    crunch: V('vsAPBAg0fb0', 'Cable Crunch', 'Jim Stoppani, PhD', 2017),
    benchPress: V('vcBig73ojpE', 'How To Get A Huge Bench Press with Perfect Technique', 'Jeff Nippard', 2018),
    chestPress: V('mDsynSGWaUM', 'How to use the seated chest press gym machine', 'Ian Stears Personal Trainer', 2016),
    inclinePress: V('GHcAIiL9J_Y', '8 Incline Dumbbell Press Mistakes and How to Fix Them', 'Renaissance Periodization', 2020, 'Shown with dumbbells; the same points on bench angle, range and elbow path apply to incline machines.'),
    fly: V('2dKBS61BX24', '8 Dumbbell Fly Mistakes and How to Fix Them', 'Renaissance Periodization', 2020, 'Shown with dumbbells; the same principles apply to fly machines and cables.'),
    lateralRaise: V('fD6kaKjiy84', 'The Worst Lateral Raise Mistakes You\'re Probably Making (and How To Fix Them)', 'Renaissance Periodization', 2020),
    pushdown: V('yftl1tBWmKk', '10 Tricep Pushdown Mistakes and How To Fix Them', 'Renaissance Periodization', 2020),
    overheadExtension: V('2A77zKWdAN4', '11 Overhead Tricep Extension Mistakes and How to Fix Them', 'Renaissance Periodization', 2020),
    dip: V('lt3Wtliiqus', '8 Dips Mistakes and How to Fix Them', 'Renaissance Periodization', 2020),
    dipMachine: V('lt3Wtliiqus', '8 Dips Mistakes and How to Fix Them', 'Renaissance Periodization', 2020, 'Shown on parallel bars; the points on torso angle and range apply to the dip machines.'),
    pulldown: V('MyQVLFBwlJ8', '8 Lat Pulldown Mistakes and How to Fix Them', 'Renaissance Periodization', 2020),
    chinup: V('B5z3k20QCS0', '9 Pullup Mistakes and How to Fix Them', 'Renaissance Periodization', 2020),
    assistedChin: V('B5z3k20QCS0', '9 Pullup Mistakes and How to Fix Them', 'Renaissance Periodization', 2020),
    row: V('TyLoy3n_a10', 'How to Properly Machine T-Bar Row (Fix Your Form)', 'Colossus Fitness', 2022, 'Filmed on a T-bar row machine; the same points apply to the other plate-loaded rows.'),
    cableRow: V('lJoozxC0Rns', 'How To Do A Seated Cable Row', 'PureGym', 2021),
    dumbbellRow: V('jO5gv181MGg', '8 One Arm Row Mistakes and How to Fix Them', 'Renaissance Periodization', 2020),
    facePull: V('cc0tasCalHg', '10 Cable Face Pull Mistakes and How to Fix Them', 'Renaissance Periodization', 2020),
    reversePec: V('Y7ZKBP5bMwg', 'How To: Reverse Pec Deck Machine Fly', 'Live Lean TV Daily Exercises', 2017),
    shoulderPress: V('Anu8s_nkNpM', 'How To: Seated Machine Shoulder Press', 'Live Lean TV Daily Exercises', 2024),
    machineHinge: V('_oyxCn2iSjU', 'How to Do Romanian Deadlifts (RDLs) With Perfect Technique', 'Jeff Nippard', 2019, 'Filmed with a barbell; the hip-hinge movement is the same on the Total Torso and deadlift machines.'),
    curl: V('MtXdEcW3Eog', 'How To Double Arm Curl (Dumbbell Bicep Curl)', 'PureGym', 2018, 'Shown with dumbbells; keep the same elbow position on the curl machine, EZ bar or cable.')
  };
  const EX_CLIP = {
    db_ohp: V('qEwKCR5JCog', 'How To: Dumbbell Shoulder Press', 'ScottHermanFitness', 2010),
    db_incline: CLIP.inclinePress
  };

  // Better search wording for exercises named after a machine
  const QUERY = {
    pendulum: 'pendulum squat', adj_hack: 'hack squat machine', lin_hack: 'hack squat machine', hack: 'hack squat machine',
    hack30: 'hack squat machine', power_squat: 'power squat machine', tru_squat: 'plate loaded squat machine',
    leverage_squat: 'leverage squat machine', total_torso: 'plate loaded hip hinge machine', pl_deadlift: 'deadlift machine',
    ghr: 'glute ham raise', glute_blaster: 'hip thrust machine', standing_thrust: 'standing hip thrust machine',
    pl_chest: 'plate loaded chest press', pl_bench: 'plate loaded bench press machine', conv_stand: 'standing chest press machine',
    stand_chest: 'standing chest press machine', super_incline: 'incline chest press machine', delt_builder: 'plate loaded shoulder press',
    viking_animal: 'viking press', tru_pull: 'plate loaded lat pulldown', front_pulldown: 'plate loaded lat pulldown',
    tbar_chest: 'chest supported t bar row', iso_row: 'plate loaded iso row', animal_lat_row: 'plate loaded row machine',
    lat_row: 'plate loaded row machine', perfect_row: 'plate loaded row machine', low_row: 'plate loaded low row',
    pullover: 'pullover machine', iso_dip: 'standing dip machine', seated_dip: 'seated dip machine',
    pl_lat_raise: 'standing lateral raise machine', pl_curl: 'plate loaded bicep curl machine', standing_curl: 'standing leg curl',
    seated_calf_tib: 'seated calf raise', total_calf: 'calf raise machine', pec_fly: 'pec fly machine', arched_fly: 'incline pec fly machine'
  };

  function clean(name) { return name.replace(/\s*\(.*?\)\s*/g, ' ').trim(); }

  function guide(ex) {
    const pattern = PATTERN_OF[ex.id];
    const cues = pattern ? P[pattern].slice() : [
      'Set the machine so the movement starts in a comfortable stretched position.',
      'Move the weight under control, pausing briefly where the muscle is most contracted.',
      'Lower over two to three seconds and keep the same range on every rep.'
    ];
    const machineId = ex.eq && ex.eq.length ? (ex.eq.find(g => g.length === 1 && MACHINE[g[0]]) || [])[0] : null;
    const q = (QUERY[ex.id] || clean(ex.name)) + ' how to form';
    const c = EX_CLIP[ex.id] || (pattern && pattern !== 'dumbbellPress' ? CLIP[pattern] : null);
    return {
      cues,
      note: NOTE[ex.id] || null,
      clip: c ? Object.assign({ url: 'https://www.youtube.com/watch?v=' + c.id }, c) : null,
      video: 'https://www.youtube.com/results?search_query=' + encodeURIComponent(q),
      videoLabel: QUERY[ex.id] || clean(ex.name),
      machine: machineId ? WG + MACHINE[machineId] : null
    };
  }

  return { guide, PATTERN_OF, P, CLIP };
});
