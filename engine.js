/* Rebuild — training engine
 * Exercise library, recovery model, session builder and progression rules.
 * Pure functions over a plain state object, so the same code runs in the
 * browser and under Node for testing.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Engine = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const HOUR = 3600e3, DAY = 24 * HOUR;

  /* ---------------------------------------------------------------- muscles */
  const MUSCLES = [
    { id: 'chest', name: 'Chest', base: 72, target: 10 },
    { id: 'back', name: 'Back', base: 72, target: 12 },
    { id: 'shoulders', name: 'Shoulders', base: 60, target: 10 },
    { id: 'biceps', name: 'Biceps', base: 48, target: 6 },
    { id: 'triceps', name: 'Triceps', base: 48, target: 6 },
    { id: 'quads', name: 'Quads', base: 72, target: 10 },
    { id: 'hamstrings', name: 'Hamstrings', base: 72, target: 10 },
    { id: 'glutes', name: 'Glutes', base: 72, target: 8 },
    { id: 'calves', name: 'Calves', base: 48, target: 6 },
    { id: 'core', name: 'Core', base: 48, target: 6 }
  ];
  const MUSCLE = Object.fromEntries(MUSCLES.map(m => [m.id, m]));

  /* -------------------------------------------------------------- equipment */
  const W = (id, name, used = true) => ({ id, name, used });
  const SMITH = ['w_smith_cb', 'w_smith', 'w_half_rack_smith', 'w_4way_smith'];
  const EQUIPMENT_GROUPS = [
    {
      id: 'watson', name: 'Watson plate-loaded', defaultOn: true,
      note: 'From the Watson plate-loaded range. Untick anything your gym does not have.',
      items: [
        W('w_pendulum', 'Pendulum Squat'), W('w_adj_hack', 'Animal Adjustable Hack Squat'),
        W('w_lin_hack', 'Linear Hack Squat'), W('w_hack', 'Hack Squat'), W('w_30_hack', '30 Degree Hack Squat'),
        W('w_power_squat', 'Power Squat'), W('w_trusquat', 'Tru Squat'), W('w_leverage', 'Leverage Squat'),
        W('w_belt_squat', 'Hip Belt Squat'), W('w_animal_lp', 'Animal Leg Press'), W('w_45_lp', '45° Leg Press'),
        W('w_horiz_lp', 'Animal Horizontal Leg Press'), W('w_vert_lp', 'Animal Vertical Leg Press'),
        W('w_pivot_lp', 'Pivot Leg Press'), W('w_rear_pivot_lp', 'Rear Pivot Leg Press'),
        W('w_lunge', 'Lunge Machine'), W('w_leg_ext', 'Leg Extension'),
        W('w_standing_curl', 'Standing Leg Curl'), W('w_inverse_curl', 'Westside Inverse Curl Pro'),
        W('w_deadlift', 'Deadlift'), W('w_total_torso', 'Total Torso'),
        W('w_glute_blaster', 'Glute Blaster'), W('w_standing_thrust', 'Standing Hip Thrust'),
        W('w_reverse_hyper', 'Deluxe Reverse Hyper Extension'), W('w_abductor', 'Hip Abductor'),
        W('w_seated_calf', 'Seated Calf Raise'), W('w_seated_calf_tib', 'Seated Calf / Tibia Raise'),
        W('w_total_calf', 'Total Calf / Tibialis Developer'), W('w_donkey_calf', 'Donkey Calf Raise'),
        W('w_45_calf', '45° Calf Raise'),
        W('w_chest_press', 'Chest Press'), W('w_bench_pl', 'Bench Press'), W('w_free_chest', 'Free Motion Chest Press'),
        W('w_conv_stand_chest', 'Animal Converging Standing Chest Press'), W('w_stand_chest', 'Standing Chest Press'),
        W('w_decline_press', 'Decline Chest Press'), W('w_super_incline', 'Super Incline Chest Press'),
        W('w_pec_fly', 'Pec Fly'), W('w_arched_incline_fly', 'Arched Incline Pec Fly'),
        W('w_iso_dip', 'Standing ISO Dip'), W('w_seated_dip', 'Seated Dip'),
        W('w_shoulder_press', 'Shoulder Press'), W('w_incline_shoulder', 'Incline Shoulder Press'),
        W('w_free_shoulder', 'Free Motion Shoulder Press'), W('w_delt_builder', 'Delt Builder'),
        W('w_viking_animal', 'Animal Viking Press'), W('w_viking', 'Viking Press'),
        W('w_lat_raise', 'Standing Lateral Raise'), W('w_shrug', 'Seated / Standing Shrug Machine'),
        W('w_tbar_chest', 'Animal Chest Supported T-Bar Row'), W('w_tbar', 'T-Bar Row'),
        W('w_iso_row', 'Animal ISO Linear Row'), W('w_animal_lat_row', 'Animal Lateral Row'),
        W('w_lat_row', 'Lateral Row'), W('w_low_row', 'Low Row'), W('w_perfect_row', 'Perfect Row'),
        W('w_front_pulldown', 'Front Pulldown'), W('w_tru_pull', 'Tru Pull'), W('w_pullover', 'Independent Pullover'),
        W('w_bicep', 'Bicep Curl'),
        W('w_smith_cb', 'Counter-Balanced Smith Machine'), W('w_smith', 'Smith Machine'),
        W('w_half_rack_smith', 'Animal Half Rack / Four Way Smith'), W('w_4way_smith', 'Four-Way Smith Machine'),
        W('w_mr19', 'Westside MR-19', false), W('w_hipquad', 'Westside Hip & Quad Developer Pro', false),
        W('w_adductor', 'Hip Adductor', false), W('w_ws_rh', 'Westside Reverse Hyper (Ultra Pro / Supreme)', false),
        W('w_tib', 'Tibialis Trainer', false), W('w_jammer', 'Jammer', false), W('w_multi_trainer', 'Multi-Trainer', false),
        W('w_gripper', 'Seated Hand Gripper', false), W('w_power_runner', 'Power Runner', false), W('w_plyo_swing', 'Plyo Swing', false)
      ]
    },
    {
      id: 'free', name: 'Free weights', defaultOn: true,
      note: 'Benches, bars and dumbbells.',
      items: [
        W('fw_barbell_rack', 'Barbell and squat rack'), W('fw_bench_flat', 'Flat bench'), W('fw_bench_adj', 'Adjustable bench'),
        W('fw_dumbbells', 'Dumbbells'), W('fw_ez', 'EZ bar'), W('fw_pullup', 'Pull-up bar'), W('fw_dip', 'Dip station'),
        W('fw_hyper', '45° back extension bench')
      ]
    },
    {
      id: 'cable', name: 'Cables and pin-loaded machines', defaultOn: true,
      note: 'Selectorised machines are logged by the number on the stack, in kg or pin position as you prefer.',
      items: [
        W('c_cable', 'Adjustable cable or crossover'), W('c_latpull', 'Lat pulldown'), W('c_seated_row', 'Seated cable row'),
        W('c_leg_ext', 'Leg extension'), W('c_leg_curl', 'Leg curl (seated or lying)'), W('c_pec_deck', 'Pec deck / rear delt'),
        W('c_lat_raise', 'Lateral raise machine'), W('c_ab', 'Ab crunch machine'), W('c_assist', 'Assisted chin / dip')
      ]
    },
    {
      id: 'hammer', name: 'Hammer Strength plate-loaded', defaultOn: false,
      note: 'Tick these if your gym also has Hammer Strength kit.',
      items: [
        W('hs_chest', 'Chest press'), W('hs_incline', 'Incline press'), W('hs_shoulder', 'Shoulder press'),
        W('hs_row', 'Row'), W('hs_pulldown', 'Front pulldown'), W('hs_leg_press', 'Leg press')
      ]
    }
  ];
  const EQUIP_NAME = {};
  EQUIPMENT_GROUPS.forEach(g => g.items.forEach(i => { EQUIP_NAME[i.id] = i.name; }));

  /* ---------------------------------------------------------------- library
   * eq: list of requirement groups; every group needs at least one item.
   * load: plates | barbell | dumbbell | stack | bodyweight | assist
   * slots: the session roles this exercise can fill, in the planner's terms.
   */
  const X = (id, name, eq, primary, secondary, slots, kind, load, extra) =>
    Object.assign({ id, name, eq: eq.map(g => Array.isArray(g) ? g : [g]), primary, secondary, slots, kind, load, lower: ['quads', 'hamstrings', 'glutes', 'calves'].includes(primary) }, extra || {});
  const BENCH = ['fw_bench_flat', 'fw_bench_adj'];
  const C = 'compound', I = 'isolation';

  const LIBRARY = [
    // squat pattern
    X('pendulum', 'Pendulum squat', ['w_pendulum'], 'quads', ['glutes'], ['squat'], C, 'plates'),
    X('adj_hack', 'Hack squat (Animal adjustable)', ['w_adj_hack'], 'quads', ['glutes'], ['squat'], C, 'plates'),
    X('lin_hack', 'Linear hack squat', ['w_lin_hack'], 'quads', ['glutes'], ['squat'], C, 'plates'),
    X('hack', 'Hack squat', ['w_hack'], 'quads', ['glutes'], ['squat'], C, 'plates'),
    X('hack30', '30° hack squat', ['w_30_hack'], 'quads', ['glutes'], ['squat'], C, 'plates'),
    X('power_squat', 'Power squat machine', ['w_power_squat'], 'quads', ['glutes', 'hamstrings'], ['squat'], C, 'plates'),
    X('tru_squat', 'Tru Squat', ['w_trusquat'], 'quads', ['glutes'], ['squat'], C, 'plates'),
    X('leverage_squat', 'Leverage squat', ['w_leverage'], 'quads', ['glutes'], ['squat'], C, 'plates'),
    X('bb_squat', 'Back squat', ['fw_barbell_rack'], 'quads', ['glutes', 'core'], ['squat'], C, 'barbell'),
    X('smith_squat', 'Smith machine squat', [SMITH], 'quads', ['glutes'], ['squat'], C, 'plates'),
    X('belt_squat', 'Hip belt squat', ['w_belt_squat'], 'quads', ['glutes'], ['squat', 'quad2'], C, 'plates'),
    // leg press and single-leg
    X('animal_lp', 'Leg press (Animal)', ['w_animal_lp'], 'quads', ['glutes'], ['quad2', 'squat'], C, 'plates'),
    X('lp45', '45° leg press', ['w_45_lp'], 'quads', ['glutes'], ['quad2', 'squat'], C, 'plates'),
    X('horiz_lp', 'Horizontal leg press', ['w_horiz_lp'], 'quads', ['glutes'], ['quad2', 'squat'], C, 'plates'),
    X('pivot_lp', 'Pivot leg press', ['w_pivot_lp'], 'quads', ['glutes'], ['quad2', 'squat'], C, 'plates'),
    X('rear_pivot_lp', 'Rear pivot leg press', ['w_rear_pivot_lp'], 'quads', ['glutes'], ['quad2'], C, 'plates'),
    X('hs_lp', 'Leg press (Hammer Strength)', ['hs_leg_press'], 'quads', ['glutes'], ['quad2', 'squat'], C, 'plates'),
    X('vert_lp', 'Vertical leg press', ['w_vert_lp'], 'quads', ['glutes'], ['quad2'], C, 'plates'),
    X('lunge_machine', 'Machine split squat', ['w_lunge'], 'quads', ['glutes'], ['quad2'], C, 'plates', { uni: true }),
    X('db_bss', 'Bulgarian split squat', ['fw_dumbbells', BENCH], 'quads', ['glutes'], ['quad2'], C, 'dumbbell', { uni: true }),
    X('smith_split', 'Smith split squat', [SMITH], 'quads', ['glutes'], ['quad2'], C, 'plates', { uni: true }),
    // quad isolation
    X('pl_leg_ext', 'Leg extension (plate-loaded)', ['w_leg_ext'], 'quads', [], ['quadIso'], I, 'plates'),
    X('leg_ext', 'Leg extension', ['c_leg_ext'], 'quads', [], ['quadIso'], I, 'stack'),
    // hinge
    X('rdl_bb', 'Romanian deadlift', ['fw_barbell_rack'], 'hamstrings', ['glutes', 'back'], ['hinge'], C, 'barbell'),
    X('total_torso', 'Machine hip hinge (Total Torso)', ['w_total_torso'], 'hamstrings', ['glutes', 'back'], ['hinge'], C, 'plates'),
    X('pl_deadlift', 'Deadlift machine', ['w_deadlift'], 'hamstrings', ['glutes', 'back'], ['hinge'], C, 'plates'),
    X('db_rdl', 'Dumbbell Romanian deadlift', ['fw_dumbbells'], 'hamstrings', ['glutes'], ['hinge'], C, 'dumbbell'),
    X('smith_rdl', 'Smith Romanian deadlift', [SMITH], 'hamstrings', ['glutes'], ['hinge'], C, 'plates'),
    // hamstring isolation
    X('standing_curl', 'Standing leg curl', ['w_standing_curl'], 'hamstrings', [], ['hamIso'], I, 'plates', { uni: true }),
    X('leg_curl', 'Leg curl', ['c_leg_curl'], 'hamstrings', [], ['hamIso'], I, 'stack'),
    X('ghr', 'Glute-ham raise (Inverse Curl Pro)', ['w_inverse_curl'], 'hamstrings', ['glutes'], ['hamIso'], I, 'assist', { range: [5, 10] }),
    // glutes
    X('glute_blaster', 'Hip thrust (Glute Blaster)', ['w_glute_blaster'], 'glutes', ['hamstrings'], ['glute'], C, 'plates'),
    X('standing_thrust', 'Standing hip thrust', ['w_standing_thrust'], 'glutes', ['hamstrings'], ['glute'], C, 'plates'),
    X('bb_hip_thrust', 'Barbell hip thrust', ['fw_barbell_rack', BENCH], 'glutes', ['hamstrings'], ['glute'], C, 'barbell'),
    X('reverse_hyper', 'Reverse hyper', ['w_reverse_hyper'], 'glutes', ['hamstrings'], ['glute'], I, 'plates'),
    X('back_ext', '45° back extension', ['fw_hyper'], 'glutes', ['hamstrings', 'back'], ['glute'], I, 'bodyweight', { range: [10, 15] }),
    X('abductor', 'Hip abduction', ['w_abductor'], 'glutes', [], ['glute'], I, 'plates'),
    // calves
    X('seated_calf', 'Seated calf raise', ['w_seated_calf'], 'calves', [], ['calf'], I, 'plates'),
    X('seated_calf_tib', 'Seated calf raise (Calf / Tibia)', ['w_seated_calf_tib'], 'calves', [], ['calf'], I, 'plates'),
    X('total_calf', 'Calf raise (Total Calf)', ['w_total_calf'], 'calves', [], ['calf'], I, 'plates'),
    X('donkey_calf', 'Donkey calf raise', ['w_donkey_calf'], 'calves', [], ['calf'], I, 'plates'),
    X('calf45', '45° calf raise', ['w_45_calf'], 'calves', [], ['calf'], I, 'plates'),
    X('lp_calf', 'Calf press on the 45° leg press', ['w_45_lp'], 'calves', [], ['calf'], I, 'plates'),
    // core
    X('hanging_leg', 'Hanging straight-leg raise', ['fw_pullup'], 'core', [], ['core'], I, 'bodyweight', { range: [8, 15] }),
    X('cable_crunch', 'Cable crunch', ['c_cable'], 'core', [], ['core'], I, 'stack'),
    X('ab_machine', 'Ab crunch machine', ['c_ab'], 'core', [], ['core'], I, 'stack'),
    X('hanging_knee', 'Hanging knee raise', ['fw_pullup'], 'core', [], ['core'], I, 'bodyweight', { range: [10, 15] }),
    // horizontal press
    X('bench_bb', 'Bench press', ['fw_barbell_rack', 'fw_bench_flat'], 'chest', ['triceps', 'shoulders'], ['hPress'], C, 'barbell'),
    X('pl_chest', 'Chest press (plate-loaded)', ['w_chest_press'], 'chest', ['triceps', 'shoulders'], ['hPress'], C, 'plates'),
    X('pl_bench', 'Bench press machine', ['w_bench_pl'], 'chest', ['triceps', 'shoulders'], ['hPress'], C, 'plates'),
    X('free_chest', 'Free-motion chest press', ['w_free_chest'], 'chest', ['triceps', 'shoulders'], ['hPress'], C, 'plates'),
    X('conv_stand', 'Converging standing chest press', ['w_conv_stand_chest'], 'chest', ['triceps', 'shoulders'], ['hPress'], C, 'plates'),
    X('stand_chest', 'Standing chest press', ['w_stand_chest'], 'chest', ['triceps', 'shoulders'], ['hPress'], C, 'plates'),
    X('decline_press', 'Decline chest press', ['w_decline_press'], 'chest', ['triceps'], ['hPress'], C, 'plates'),
    X('hs_chest', 'Chest press (Hammer Strength)', ['hs_chest'], 'chest', ['triceps', 'shoulders'], ['hPress'], C, 'plates'),
    X('db_bench', 'Dumbbell bench press', ['fw_dumbbells', BENCH], 'chest', ['triceps', 'shoulders'], ['hPress'], C, 'dumbbell'),
    // incline press
    X('super_incline', 'Super incline chest press', ['w_super_incline'], 'chest', ['shoulders', 'triceps'], ['iPress'], C, 'plates'),
    X('db_incline', 'Incline dumbbell press', ['fw_dumbbells', 'fw_bench_adj'], 'chest', ['shoulders', 'triceps'], ['iPress'], C, 'dumbbell'),
    X('hs_incline', 'Incline press (Hammer Strength)', ['hs_incline'], 'chest', ['shoulders', 'triceps'], ['iPress'], C, 'plates'),
    X('incline_bb', 'Incline bench press', ['fw_barbell_rack', 'fw_bench_adj'], 'chest', ['shoulders', 'triceps'], ['iPress'], C, 'barbell'),
    X('smith_incline', 'Smith incline press', [SMITH, 'fw_bench_adj'], 'chest', ['shoulders', 'triceps'], ['iPress'], C, 'plates'),
    // vertical press
    X('pl_shoulder', 'Shoulder press (plate-loaded)', ['w_shoulder_press'], 'shoulders', ['triceps'], ['vPress'], C, 'plates'),
    X('delt_builder', 'Delt Builder press', ['w_delt_builder'], 'shoulders', ['triceps'], ['vPress'], C, 'plates'),
    X('incline_shoulder', 'Incline shoulder press', ['w_incline_shoulder'], 'shoulders', ['chest', 'triceps'], ['vPress'], C, 'plates'),
    X('free_shoulder', 'Free-motion shoulder press', ['w_free_shoulder'], 'shoulders', ['triceps'], ['vPress'], C, 'plates'),
    X('viking_animal', 'Viking press (Animal)', ['w_viking_animal'], 'shoulders', ['triceps'], ['vPress'], C, 'plates'),
    X('viking', 'Viking press', ['w_viking'], 'shoulders', ['triceps'], ['vPress'], C, 'plates'),
    X('hs_shoulder', 'Shoulder press (Hammer Strength)', ['hs_shoulder'], 'shoulders', ['triceps'], ['vPress'], C, 'plates'),
    X('db_ohp', 'Seated dumbbell shoulder press', ['fw_dumbbells', 'fw_bench_adj'], 'shoulders', ['triceps'], ['vPress'], C, 'dumbbell'),
    // chest isolation
    X('pec_fly', 'Pec fly (plate-loaded)', ['w_pec_fly'], 'chest', [], ['chestIso'], I, 'plates'),
    X('arched_fly', 'Arched incline pec fly', ['w_arched_incline_fly'], 'chest', [], ['chestIso'], I, 'plates'),
    X('pec_deck', 'Pec deck', ['c_pec_deck'], 'chest', [], ['chestIso'], I, 'stack'),
    X('cable_fly', 'Cable fly', ['c_cable'], 'chest', [], ['chestIso'], I, 'stack'),
    X('db_fly', 'Dumbbell fly', ['fw_dumbbells', BENCH], 'chest', [], ['chestIso'], I, 'dumbbell'),
    // lateral raise
    X('pl_lat_raise', 'Standing lateral raise (plate-loaded)', ['w_lat_raise'], 'shoulders', [], ['latRaise'], I, 'plates'),
    X('mc_lat_raise', 'Lateral raise machine', ['c_lat_raise'], 'shoulders', [], ['latRaise'], I, 'stack'),
    X('cable_lat', 'Cable lateral raise', ['c_cable'], 'shoulders', [], ['latRaise'], I, 'stack', { uni: true }),
    X('db_lat', 'Dumbbell lateral raise', ['fw_dumbbells'], 'shoulders', [], ['latRaise'], I, 'dumbbell'),
    // triceps
    X('oh_cable_ext', 'Overhead cable triceps extension', ['c_cable'], 'triceps', [], ['triceps'], I, 'stack'),
    X('iso_dip', 'Standing ISO dip', ['w_iso_dip'], 'triceps', ['chest'], ['triceps'], I, 'plates', { range: [8, 12] }),
    X('seated_dip', 'Seated dip machine', ['w_seated_dip'], 'triceps', ['chest'], ['triceps'], I, 'plates', { range: [8, 12] }),
    X('pushdown', 'Triceps pushdown', ['c_cable'], 'triceps', [], ['triceps'], I, 'stack'),
    X('dip_bw', 'Dips', ['fw_dip'], 'triceps', ['chest', 'shoulders'], ['triceps'], I, 'bodyweight', { range: [6, 12] }),
    X('ez_skull', 'EZ-bar skull crusher', ['fw_ez', BENCH], 'triceps', [], ['triceps'], I, 'barbell', { bar: 10 }),
    // vertical pull
    X('tru_pull', 'Tru Pull pulldown', ['w_tru_pull'], 'back', ['biceps'], ['vPull'], C, 'plates'),
    X('front_pulldown', 'Front pulldown (plate-loaded)', ['w_front_pulldown'], 'back', ['biceps'], ['vPull'], C, 'plates'),
    X('lat_pulldown', 'Lat pulldown', ['c_latpull'], 'back', ['biceps'], ['vPull'], C, 'stack'),
    X('chinup', 'Chin-up', ['fw_pullup'], 'back', ['biceps'], ['vPull'], C, 'bodyweight', { range: [5, 10] }),
    X('hs_pulldown', 'Front pulldown (Hammer Strength)', ['hs_pulldown'], 'back', ['biceps'], ['vPull'], C, 'plates'),
    X('assisted_chin', 'Assisted chin-up', ['c_assist'], 'back', ['biceps'], ['vPull'], C, 'assist'),
    // rows
    X('tbar_chest', 'Chest-supported T-bar row', ['w_tbar_chest'], 'back', ['biceps', 'shoulders'], ['hRow', 'row2'], C, 'plates'),
    X('iso_row', 'ISO linear row (Animal)', ['w_iso_row'], 'back', ['biceps', 'shoulders'], ['hRow', 'row2'], C, 'plates'),
    X('animal_lat_row', 'Lateral row (Animal)', ['w_animal_lat_row'], 'back', ['biceps', 'shoulders'], ['hRow', 'row2'], C, 'plates'),
    X('low_row', 'Low row (plate-loaded)', ['w_low_row'], 'back', ['biceps'], ['hRow', 'row2'], C, 'plates'),
    X('lat_row', 'Lateral row', ['w_lat_row'], 'back', ['biceps', 'shoulders'], ['hRow', 'row2'], C, 'plates'),
    X('perfect_row', 'Perfect Row', ['w_perfect_row'], 'back', ['biceps'], ['hRow', 'row2'], C, 'plates'),
    X('tbar', 'T-bar row', ['w_tbar'], 'back', ['biceps'], ['hRow', 'row2'], C, 'plates'),
    X('hs_row', 'Row (Hammer Strength)', ['hs_row'], 'back', ['biceps'], ['hRow', 'row2'], C, 'plates'),
    X('cable_row', 'Seated cable row', ['c_seated_row'], 'back', ['biceps'], ['hRow', 'row2'], C, 'stack'),
    X('db_row', 'One-arm dumbbell row', ['fw_dumbbells', BENCH], 'back', ['biceps'], ['hRow', 'row2'], C, 'dumbbell', { uni: true }),
    X('pullover', 'Independent pullover', ['w_pullover'], 'back', [], ['row2'], I, 'plates'),
    X('straight_arm', 'Straight-arm pulldown', ['c_cable'], 'back', [], ['row2'], I, 'stack'),
    X('shrug', 'Shrug (plate-loaded)', ['w_shrug'], 'back', [], ['traps'], I, 'plates'),
    // rear delts
    X('reverse_pec', 'Reverse pec deck', ['c_pec_deck'], 'shoulders', ['back'], ['rearDelt'], I, 'stack'),
    X('face_pull', 'Face pull', ['c_cable'], 'shoulders', ['back'], ['rearDelt'], I, 'stack'),
    X('db_rear', 'Chest-supported rear delt raise', ['fw_dumbbells', 'fw_bench_adj'], 'shoulders', ['back'], ['rearDelt'], I, 'dumbbell'),
    // biceps
    X('pl_curl', 'Biceps curl (plate-loaded)', ['w_bicep'], 'biceps', [], ['biceps'], I, 'plates', { range: [8, 12] }),
    X('ez_curl', 'EZ-bar curl', ['fw_ez'], 'biceps', [], ['biceps'], I, 'barbell', { bar: 10, range: [8, 12] }),
    X('hammer_curl', 'Hammer curl', ['fw_dumbbells'], 'biceps', [], ['biceps'], I, 'dumbbell', { range: [8, 12] }),
    X('incline_curl', 'Incline dumbbell curl', ['fw_dumbbells', 'fw_bench_adj'], 'biceps', [], ['biceps'], I, 'dumbbell'),
    X('cable_curl', 'Cable curl', ['c_cable'], 'biceps', [], ['biceps'], I, 'stack')
  ];

  /* --------------------------------------------------------------- templates */
  // Upper/lower and full-body sessions alternate between an A and a B version so each
  // muscle is trained twice a week on three or four sessions, with different emphasis each time.
  const TEMPLATES = {
    lower: { name: 'Lower body', primary: ['quads', 'hamstrings', 'glutes'], variants: [
      ['squat', 'hinge', 'quad2', 'hamIso', 'calf', 'core', 'glute', 'quadIso'],
      ['hinge', 'quad2', 'glute', 'hamIso', 'quadIso', 'calf', 'core', 'squat']] },
    upper: { name: 'Upper body', primary: ['chest', 'back', 'shoulders'], variants: [
      ['hPress', 'hRow', 'vPress', 'vPull', 'latRaise', 'triceps', 'biceps', 'rearDelt'],
      ['vPull', 'iPress', 'row2', 'chestIso', 'latRaise', 'biceps', 'triceps', 'rearDelt']] },
    full: { name: 'Full body', primary: ['quads', 'chest', 'back'], variants: [
      ['squat', 'hPress', 'hRow', 'hinge', 'vPull', 'vPress', 'core'],
      ['hinge', 'iPress', 'vPull', 'quad2', 'row2', 'latRaise', 'core']] },
    push: { name: 'Push', primary: ['chest', 'shoulders', 'triceps'], variants: [['hPress', 'vPress', 'iPress', 'latRaise', 'triceps', 'chestIso']] },
    pull: { name: 'Pull', primary: ['back', 'biceps'], variants: [['vPull', 'hRow', 'row2', 'rearDelt', 'biceps', 'core', 'traps']] }
  };
  const FOCUS_ORDER = ['lower', 'upper', 'full', 'push', 'pull'];
  const AUTO_FOCUS = ['lower', 'upper', 'full'];   // push and pull only when chosen

  function nextVariant(state, focus) {
    const n = TEMPLATES[focus].variants.length;
    if (n < 2) return 0;
    const last = state.sessions.filter(s => s.end && s.focus === focus).sort((a, b) => b.end - a.end)[0];
    return last && last.variant != null ? (last.variant + 1) % n : 0;
  }
  function sessionName(s) {
    const t = TEMPLATES[s.focus]; if (!t) return s.focus;
    return t.variants.length > 1 && s.variant != null ? `${t.name} ${s.variant ? 'B' : 'A'}` : t.name;
  }

  /* ---------------------------------------------------------------- settings */
  function defaultSettings() {
    const equipment = {};
    EQUIPMENT_GROUPS.forEach(g => g.items.forEach(i => { equipment[i.id] = g.defaultOn; }));
    return {
      equipment,
      repFocus: 'balanced',         // balanced | strength | muscle
      dbStep: 2,                    // dumbbell jumps, kg per hand
      barWeight: 20,
      plates: [25, 20, 15, 10, 5, 2.5, 1.25],
      restCompound: 120,            // seconds
      restIsolation: 75,
      beep: true,
      keepAwake: true,
      weeklyGoal: 4                 // sessions per week you are aiming for
    };
  }

  function newState() {
    return { v: 1, settings: defaultSettings(), sessions: [], active: null, block: null, custom: [], prefs: { fav: {}, excluded: {}, inc: {} } };
  }

  // Bring an older or partial state up to the current shape.
  function normalise(s) {
    const base = newState();
    if (!s || typeof s !== 'object') return base;
    const out = Object.assign(base, s);
    out.settings = Object.assign(defaultSettings(), s.settings || {});
    out.settings.equipment = Object.assign(defaultSettings().equipment, (s.settings || {}).equipment || {});
    out.prefs = Object.assign({ fav: {}, excluded: {}, inc: {} }, s.prefs || {});
    out.sessions = Array.isArray(s.sessions) ? s.sessions : [];
    out.custom = Array.isArray(s.custom) ? s.custom : [];
    return out;
  }

  /* ----------------------------------------------------------------- helpers */
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const sum = a => a.reduce((t, x) => t + x, 0);
  const fmt = w => (Math.round(w * 100) / 100).toString();

  function allExercises(state) {
    return LIBRARY.concat((state.custom || []).map(c => Object.assign({ custom: true, lower: ['quads', 'hamstrings', 'glutes', 'calves'].includes(c.primary) }, c, { eq: [] })));
  }
  function exById(state, id) { return allExercises(state).find(e => e.id === id); }

  function isAvailable(ex, settings) {
    if (ex.custom) return true;
    return ex.eq.every(group => group.some(id => settings.equipment[id]));
  }

  function equipmentLabel(ex, settings) {
    if (ex.custom) return ex.machine || 'Custom';
    const names = ex.eq.map(g => {
      const have = g.filter(id => settings.equipment[id]);
      return EQUIP_NAME[(have[0] || g[0])];
    });
    return names.join(' + ');
  }

  function repRange(ex, settings) {
    if (ex.range) return ex.range.slice();
    const f = settings.repFocus;
    if (ex.kind === 'compound') return f === 'strength' ? [4, 8] : f === 'muscle' ? [8, 12] : [6, 10];
    return f === 'strength' ? [8, 12] : f === 'muscle' ? [12, 15] : [10, 15];
  }

  // Working sets from a logged exercise entry
  function doneSets(item) { return (item.log || []).filter(s => s.done && s.r > 0); }

  /* -------------------------------------------------------- weights & plates */
  function stackStep(state, exId) {
    // Stack exercises may be logged in kg or by pin number. Infer from history.
    const ws = [];
    state.sessions.forEach(s => s.items.forEach(it => { if (it.exId === exId) doneSets(it).forEach(x => ws.push(x.w)); }));
    if (!ws.length) return null;
    const med = ws.sort((a, b) => a - b)[Math.floor(ws.length / 2)];
    return med > 25 ? 5 : 1;
  }

  function increment(state, ex) {
    const o = state.prefs.inc && state.prefs.inc[ex.id];
    if (o) return o;
    const st = state.settings;
    switch (ex.load) {
      case 'plates': return ex.kind === 'compound' && ex.lower ? 5 : 2.5;
      case 'barbell': return ex.lower ? 5 : 2.5;
      case 'dumbbell': return st.dbStep;
      case 'stack': return stackStep(state, ex.id) || 1;
      case 'bodyweight': return 2.5;
      case 'assist': return stackStep(state, ex.id) || 5;
      default: return 2.5;
    }
  }

  function roundTo(w, step, mode) {
    const f = mode === 'down' ? Math.floor : mode === 'up' ? Math.ceil : Math.round;
    return Math.max(0, f((w + 1e-9) / step) * step);
  }

  function roundLoad(state, ex, w, mode) {
    const st = state.settings;
    let step;
    switch (ex.load) {
      case 'plates': step = Math.min.apply(null, st.plates) * 2; break;
      case 'barbell': step = Math.min.apply(null, st.plates) * 2; break;
      case 'dumbbell': step = st.dbStep; break;
      case 'bodyweight': step = 2.5; break;
      default: step = increment(state, ex);
    }
    let r = roundTo(w, step, mode);
    if (ex.load === 'barbell') r = Math.max(r, barWeight(state, ex));
    return Math.round(r * 100) / 100;
  }

  function barWeight(state, ex) { return ex.bar || state.settings.barWeight; }

  // Per-side plate breakdown for plate-loaded machines and barbells.
  function plateBreakdown(state, ex, total) {
    if (!(ex.load === 'plates' || ex.load === 'barbell') || !(total > 0)) return null;
    const bar = ex.load === 'barbell' ? barWeight(state, ex) : 0;
    let side = (total - bar) / 2;
    if (side < 0) return { bar, side: 0, plates: [], remainder: 0 };
    const plates = [];
    const avail = state.settings.plates.slice().sort((a, b) => b - a);
    for (const p of avail) {
      while (side >= p - 1e-9) { plates.push(p); side -= p; if (plates.length > 14) break; }
    }
    return { bar, side: (total - bar) / 2, plates, remainder: Math.round(side * 100) / 100 };
  }

  /* --------------------------------------------------------- strength maths */
  const EFFORT_RIR = { easy: 4, solid: 2.5, hard: 1 };
  function e1rm(w, r, rir) { if (!(w > 0) || !(r > 0)) return 0; return w * (1 + (r + (rir || 0)) / 30); }
  function weightFor(e1, reps, rir) { return e1 / (1 + (reps + rir) / 30); }
  const kgLoad = ex => ex.load === 'plates' || ex.load === 'barbell' || ex.load === 'dumbbell';

  /* ------------------------------------------------------- exercise history */
  // Every performance of an exercise, oldest first.
  function performances(state, exId) {
    const out = [];
    state.sessions.forEach(s => {
      s.items.forEach(it => {
        if (it.exId !== exId) return;
        const sets = doneSets(it);
        if (!sets.length) return;
        out.push({ date: s.end || s.start || s.created, sessionId: s.id, deload: !!s.deload, mode: it.mode, lo: it.lo, hi: it.hi, planned: it.sets, weight: workingWeight(sets), sets, effort: it.effort || null, presc: it.weight });
      });
    });
    return out.sort((a, b) => a.date - b.date);
  }

  // The weight used on most sets (ties go to the heavier).
  function workingWeight(sets) {
    const c = {};
    sets.forEach(s => { c[s.w] = (c[s.w] || 0) + 1; });
    return Object.keys(c).map(Number).sort((a, b) => (c[b] - c[a]) || (b - a))[0];
  }

  function bestE1(perf, ex) {
    const rir = EFFORT_RIR[perf.effort] != null ? EFFORT_RIR[perf.effort] : 2;
    if (!kgLoad(ex)) return 0;
    let best = 0;
    perf.sets.forEach((s, i) => {
      // only the last set carries the effort rating; earlier sets assume a little more in reserve
      const r = i === perf.sets.length - 1 ? rir : rir + 1;
      best = Math.max(best, e1rm(s.w, Math.min(s.r, 15), r));
    });
    return best;
  }

  function exerciseStatus(state, ex) {
    const perfs = performances(state, ex.id).filter(p => !p.deload);
    const work = perfs.filter(p => p.mode !== 'calibrate');
    let stall = 0, misses = 0;
    for (let i = work.length - 1; i >= 1; i--) {
      const a = work[i], b = work[i - 1];
      const prog = (ex.load === 'assist' ? a.weight < b.weight : a.weight > b.weight) ||
        (a.weight === b.weight && sum(a.sets.map(s => s.r)) > sum(b.sets.map(s => s.r)));
      if (prog) break;
      stall++;
    }
    for (let i = work.length - 1; i >= 0; i--) {
      const p = work[i];
      if (p.sets.some(s => s.r < p.lo)) misses++; else break;
    }
    return { perfs, last: perfs[perfs.length - 1] || null, stall, misses, count: perfs.length };
  }

  /* -------------------------------------------------------------- recovery */
  function sessionMuscleSets(state, s) {
    const m = {};
    s.items.forEach(it => {
      const ex = exById(state, it.exId); if (!ex) return;
      const n = doneSets(it).length; if (!n) return;
      m[ex.primary] = (m[ex.primary] || 0) + n;
      (ex.secondary || []).forEach(g => { m[g] = (m[g] || 0) + n * 0.5; });
    });
    return m;
  }

  function muscleStatus(state, now) {
    const done = state.sessions.filter(s => s.end && s.end <= now).sort((a, b) => b.end - a.end);
    return MUSCLES.map(mu => {
      let last = null, lastSets = 0;
      for (const s of done) {
        const sets = sessionMuscleSets(state, s)[mu.id] || 0;
        if (sets >= 1) { last = s.end; lastSets = sets; break; }
      }
      let weekSets = 0;
      done.forEach(s => { if (now - s.end < 7 * DAY) weekSets += sessionMuscleSets(state, s)[mu.id] || 0; });
      const need = mu.base * clamp(lastSets / 6, 0.6, 1.3);
      const hours = last == null ? Infinity : (now - last) / HOUR;
      const recovery = last == null ? 1 : clamp(hours / need, 0, 1);
      return { id: mu.id, name: mu.name, last, hours, recovery, weekSets: Math.round(weekSets * 10) / 10, target: mu.target, readyIn: last == null ? 0 : Math.max(0, need - hours) };
    });
  }

  /* ------------------------------------------------------------------ blocks */
  function weekKey(ts) {
    const d = new Date(ts); d.setHours(0, 0, 0, 0);
    const day = (d.getDay() + 6) % 7; d.setDate(d.getDate() - day);
    return d.getTime();
  }
  // Move n calendar weeks from a week key, safely across clock changes.
  function shiftWeek(k, n) { const d = new Date(k); d.setDate(d.getDate() + 7 * n); return weekKey(d.getTime()); }

  // No scheduled training blocks or deload weeks: weights ease back automatically after time away
  // and individual lifts back off after repeated misses. Kept as a function so callers stay simple.
  function blockInfo() {
    return { week: null, length: null, deload: false, manual: false, rir: 2 };
  }

  // Store a finished session.
  function commitSession(state, finished) {
    state.sessions.push(finished);
    state.active = null;
    return state;
  }

  /* ---------------------------------------------------------- focus choice */
  function chooseFocus(state, now, minutes) {
    const ms = muscleStatus(state, now);
    const by = Object.fromEntries(ms.map(m => [m.id, m]));
    const done = state.sessions.filter(s => s.end);
    const lastEnd = done.length ? Math.max.apply(null, done.map(s => s.end)) : null;
    const daysSince = lastEnd == null ? Infinity : (now - lastEnd) / DAY;
    const last7 = done.filter(s => now - s.end < 7 * DAY).length;
    const scores = {};
    const goal = state.settings.weeklyGoal || 4;
    AUTO_FOCUS.forEach((f, idx) => {
      const prim = TEMPLATES[f].primary;
      let sc = sum(prim.map(g => by[g].recovery * clamp(1 - by[g].weekSets / by[g].target, 0.15, 1))) / prim.length;
      const minRec = Math.min.apply(null, prim.map(g => by[g].recovery));
      if (minRec < 0.6) sc *= 0.35;
      else if (minRec < 0.9) sc *= 0.75;
      // full body suits three sessions a week or coming back after a few days off
      if (f === 'full') sc *= done.length && (goal <= 3 || daysSince >= 3) ? 1.05 : 0.8;
      sc -= idx * 0.001; // stable tie-break
      scores[f] = sc;
    });
    const focus = AUTO_FOCUS.slice().sort((a, b) => scores[b] - scores[a])[0];
    return { focus, scores, reason: focusReason(state, now, focus, by, done.length) };
  }

  function ago(hours, now) {
    if (!isFinite(hours)) return 'not yet trained';
    const then = new Date(now - hours * 3600e3); then.setHours(0, 0, 0, 0);
    const today = new Date(now); today.setHours(0, 0, 0, 0);
    const d = Math.round((today - then) / DAY);
    if (d <= 0) return 'trained today';
    if (d === 1) return 'trained yesterday';
    return `trained ${d} days ago`;
  }

  function focusReason(state, now, focus, by, nSessions) {
    if (!nSessions) return 'First session: starting with the legs so the week balances out as you go.';
    const t = TEMPLATES[focus];
    const mine = t.primary.map(g => by[g]);
    const ready = mine.filter(m => m.recovery >= 0.99);
    const others = MUSCLES.filter(m => !t.primary.includes(m.id) && ['chest', 'back', 'quads', 'shoulders', 'hamstrings'].includes(m.id))
      .map(m => by[m.id]).filter(m => m.recovery < 0.9).sort((a, b) => a.recovery - b.recovery);
    let s = `${t.name}: ` + (ready.length === mine.length ? `${list(mine.map(m => m.name.toLowerCase()))} are recovered` : `${list(mine.map(m => m.name.toLowerCase()))} are the freshest groups`);
    const latest = mine.filter(m => isFinite(m.hours)).sort((a, b) => a.hours - b.hours)[0];
    if (latest) s += ` (${latest.name.toLowerCase()} ${ago(latest.hours, now)})`;
    if (others.length) s += `; ${others[0].name.toLowerCase()} still recovering`;
    return s + '.';
  }
  function list(a) { return a.length <= 1 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]; }

  /* ----------------------------------------------------------- prescriptions */
  function prescribe(state, ex, ctx) {
    const now = ctx.now, blk = ctx.block;
    const [lo, hi] = repRange(ex, state.settings);
    const inc = increment(state, ex);
    const status = exerciseStatus(state, ex);
    const perfs = status.perfs;
    let sets = ctx.sets || 3;
    let p = { mode: 'work', lo, hi, sets, weight: null, target: [], reason: '', inc, stall: status.stall };

    const calibrate = (why, start) => {
      p.mode = 'calibrate';
      p.sets = ex.kind === 'compound' ? 4 : 3;
      p.weight = start != null ? start : startWeight(state, ex);
      p.target = new Array(p.sets).fill(lo + 2);
      p.reason = why;
      return p;
    };

    if (!perfs.length) return calibrate('First time: start light and add weight each set until you reach a weight you could lift about ' + (lo + 2) + ' times with two or three reps left. Log every set.');

    // Progress from the last full-effort performance; deload sessions only count for time away.
    const full = perfs.filter(x => !x.deload);
    const last = full.length ? full[full.length - 1] : perfs[perfs.length - 1];
    const days = (now - perfs[perfs.length - 1].date) / DAY;
    if (days > 56) return calibrate(`Last done ${Math.round(days / 7)} weeks ago: recalibrate, starting light.`, roundLoad(state, ex, last.weight * 0.6, 'down'));

    let w, target, why;
    const effortRir = EFFORT_RIR[last.effort] != null ? EFFORT_RIR[last.effort] : 2.5;

    if (last.mode === 'calibrate') {
      if (kgLoad(ex)) {
        const e1 = bestE1(last, ex);
        w = roundLoad(state, ex, weightFor(e1, lo + 2, Math.max(2, blk.rir)), 'down');
      } else {
        const ok = last.sets.filter(s => s.r >= lo);
        const top = ok.length ? ok.reduce((a, b) => (ex.load === 'assist' ? (b.w < a.w ? b : a) : (b.w > a.w ? b : a))) : last.sets[last.sets.length - 1];
        w = top.w;
        if (top.r >= hi + 3 && effortRir >= 3) w = ex.load === 'assist' ? Math.max(0, w - inc) : w + inc;
      }
      target = new Array(sets).fill(lo);
      why = `Set from your calibration (best: ${bestSetText(last, ex)}).`;
    } else {
      const lw = last.weight;
      const reps = last.sets.filter(s => s.w === lw).map(s => s.r);
      const needSets = Math.max(1, Math.min(2, last.planned || 2));
      const allTop = reps.length >= needSets && reps.every(r => r >= last.hi);
      const allBottom = reps.every(r => r >= lo);
      if (last.deload) {
        // only deload sessions on record: treat the deload weight as a light starting point
        w = adj(state, ex, lw, 1 / 0.9); target = new Array(sets).fill(lo);
        why = 'Back from the deload: build up from here.';
      } else if (allTop) {
        const steps = last.effort === 'easy' && ex.kind === 'compound' ? 2 : 1;
        w = ex.load === 'assist' ? Math.max(0, lw - inc * steps) : lw + inc * steps;
        target = new Array(sets).fill(lo);
        why = `Hit ${last.hi}+ on every set last time: ${ex.load === 'assist' ? 'less assistance' : 'add ' + fmt(inc * steps) + unitOf(ex)}.`;
        if (ex.load === 'bodyweight' && lw === 0) why = `Hit ${last.hi}+ on every set: add ${fmt(inc)} kg with a belt or a dumbbell.`;
      } else if (allBottom) {
        w = lw;
        target = [];
        for (let i = 0; i < sets; i++) target.push(Math.min(hi, (reps[i] != null ? reps[i] : reps[reps.length - 1]) + 1));
        why = `Same weight: beat ${reps.join(', ')}.`;
        if (status.stall >= 3) why = `No progress in ${status.stall} sessions: same weight, but consider swapping this exercise.`;
      } else {
        if (status.misses >= 2) {
          w = roundLoad(state, ex, ex.load === 'assist' ? lw + Math.max(inc, lw * 0.1) : lw * 0.9, 'nearest');
          why = `Below ${lo} reps twice running: ${ex.load === 'assist' ? 'more assistance' : 'drop about 10%'} and build back up.`;
        } else {
          w = lw;
          why = `Short of ${lo} reps last time: repeat ${fmt(lw)}${unitOf(ex)} and aim for ${lo}.`;
        }
        target = new Array(sets).fill(lo);
      }
    }

    // time away from this exercise
    if (days > 14) {
      const gap = days > 28 ? Math.round(days / 7) + ' weeks' : Math.round(days) + ' days';
      target = new Array(sets).fill(lo);
      if (ex.load === 'bodyweight') {
        why = `Last done ${gap} ago: aim for the bottom of the range and build back up.`;
      } else {
        const f = days > 28 ? 0.8 : 0.9;
        const from = last.mode === 'calibrate' ? w : last.weight;
        w = adj(state, ex, from, f);
        const fromText = ex.load === 'stack' ? `${fmt(from)} on the stack` : ex.load === 'assist' ? `${fmt(from)} assistance` : `${fmt(from)} kg`;
        why = `Last done ${gap} ago: ${ex.load === 'assist' ? 'a little more assistance than' : `eased back about ${f === 0.8 ? 20 : 10}% from`} ${fromText}.`;
      }
    }

    if (ctx.readiness === 'flat') {
      sets = Math.max(2, sets - 1);
      why += ' Feeling flat: one set fewer.';
    }
    p.sets = sets; p.weight = w;
    p.target = target.slice(0, sets); while (p.target.length < sets) p.target.push(p.target[p.target.length - 1] || lo);
    p.reason = why;
    return p;
  }

  function adj(state, ex, w, f) {
    if (ex.load === 'bodyweight') return w;
    if (ex.load === 'assist') return roundLoad(state, ex, w / f, 'nearest');
    return roundLoad(state, ex, w * f, 'nearest');
  }

  function unitOf(ex) { return ex.load === 'stack' || ex.load === 'assist' ? '' : ' kg'; }

  function bestSetText(perf, ex) {
    const s = perf.sets.reduce((a, b) => (e1rm(b.w, b.r, 0) > e1rm(a.w, a.r, 0) ? b : a));
    return `${fmt(s.w)}${unitOf(ex)} × ${s.r}`;
  }

  function startWeight(state, ex) {
    switch (ex.load) {
      case 'plates': return ex.kind === 'compound' ? (ex.lower ? 20 : 10) : 5;
      case 'barbell': return barWeight(state, ex);
      case 'dumbbell': return roundLoad(state, ex, ex.kind === 'compound' ? 10 : 6, 'nearest');
      case 'bodyweight': return 0;
      default: return null;
    }
  }

  /* ---------------------------------------------------------- time estimates */
  function itemMinutes(state, item, ex, first) {
    const st = state.settings;
    const setup = { plates: 1.5, barbell: 2, dumbbell: 1, stack: 0.5, bodyweight: 0.5, assist: 0.5 }[ex.load] || 1;
    const work = ex.kind === 'compound' ? 0.75 : 0.67;
    const rest = item.mode === 'calibrate' ? 1.5 : (ex.kind === 'compound' ? st.restCompound : st.restIsolation) / 60;
    let t = setup + item.sets * work + (item.sets - 1) * rest + 1;
    if (item.superset === 'b') t = setup + item.sets * work + 0.5;
    if (first && ex.kind === 'compound' && item.mode !== 'calibrate') t += 3; // two ramp-up sets
    return t;
  }

  function estimateMinutes(state, session) {
    let t = session.warmup || 0, firstDone = false;
    session.items.forEach(it => {
      const ex = exById(state, it.exId); if (!ex) return;
      const first = !firstDone && ex.kind === 'compound'; if (first) firstDone = true;
      t += itemMinutes(state, it, ex, first);
    });
    return Math.round(t);
  }

  /* -------------------------------------------------------- exercise choice */
  function candidates(state, slot, session, now) {
    const st = state.settings;
    const inSession = new Set(session ? session.items.map(i => i.exId) : []);
    const usedMachines = new Set();
    if (session) session.items.forEach(i => { const e = exById(state, i.exId); if (e && !e.custom) e.eq.forEach(g => g.length === 1 && usedMachines.add(g[0])); });
    const pool = allExercises(state).filter(e => e.slots.includes(slot) && isAvailable(e, st) && !state.prefs.excluded[e.id] && !inSession.has(e.id));
    // the exercise this slot used last time in the same session type (A or B) is its anchor
    // the exercise most recently used for this slot in the same session type (A or B) is its anchor
    let anchorId = null;
    if (session) {
      const same = state.sessions.filter(s => s.end && s.focus === session.focus && s.variant === session.variant && now - s.end < 42 * DAY).sort((a, b) => b.end - a.end);
      for (const s of same) { const it = s.items.find(i => i.slot === slot); if (it) { anchorId = it.exId; break; } }
    }
    const recentIds = new Set();
    state.sessions.filter(s => s.end && now - s.end < 4 * DAY).forEach(s => s.items.forEach(i => recentIds.add(i.exId)));
    return pool.map((e, idx) => {
      const status = exerciseStatus(state, e);
      let score = (pool.length - idx) * 0.05;
      const recent = status.last && now - status.last.date < 42 * DAY;
      if (e.id === anchorId) score += 6;            // keep progressing what this session has been doing
      else if (recent) score += 2;                  // familiar
      if (recentIds.has(e.id)) score -= 3;          // vary exercises between sessions a few days apart
      if (state.prefs.fav[e.id]) score += 3;
      if (status.stall >= 3) score -= 6;              // stuck: rotate
      if (e.slots[0] !== slot) score -= 3;            // prefer exercises whose main job is this slot
      if (e.eq.some(g => g.length === 1 && usedMachines.has(g[0]))) score -= 4;
      if (e.custom) score += 0.5;
      return { ex: e, score, status };
    }).sort((a, b) => b.score - a.score);
  }

  function makeItem(state, ex, slot, ctx) {
    const pr = prescribe(state, ex, ctx);
    return {
      exId: ex.id, slot, mode: pr.mode, sets: pr.sets, lo: pr.lo, hi: pr.hi, weight: pr.weight,
      target: pr.target, reason: pr.reason, superset: null, effort: null,
      log: Array.from({ length: pr.sets }, (_, i) => ({ w: pr.mode === 'calibrate' ? (i === 0 ? pr.weight : null) : pr.weight, r: null, done: false }))
    };
  }

  /* --------------------------------------------------------- session builder */
  function buildSession(state, opts) {
    const now = opts.now || Date.now();
    const minutes = clamp(opts.minutes || 45, 15, 120);
    const blk = blockInfo(state, now);
    const fc = opts.focus && opts.focus !== 'auto' ? { focus: opts.focus, reason: `${TEMPLATES[opts.focus].name}, as chosen.` } : chooseFocus(state, now, minutes);
    const t = TEMPLATES[fc.focus];
    const variant = opts.variant != null ? opts.variant : nextVariant(state, fc.focus);
    const session = {
      id: 's' + now.toString(36) + Math.random().toString(36).slice(2, 6),
      created: now, start: null, end: null, focus: fc.focus, variant, focusReason: fc.reason,
      minutes, readiness: opts.readiness || 'normal', deload: false, rir: blk.rir,
      warmup: minutes >= 30 ? 5 : 3, items: []
    };
    let budget = minutes - session.warmup;
    let firstCompound = true;
    const ctx = { now, block: blk, readiness: session.readiness, sets: 3 };
    // decide up front whether calves or core need a finisher, and hold back a few minutes for it
    const ms = Object.fromEntries(muscleStatus(state, now).map(m => [m.id, m]));
    const short = ['calves', 'core'].filter(g => ms[g].weekSets < ms[g].target * 0.75 && ms[g].recovery >= 0.9)
      .filter(g => !(fc.focus === 'upper' && g === 'calves'))
      .sort((a, b) => ms[a].weekSets / ms[a].target - ms[b].weekSets / ms[b].target);

    const SMALL = ['calf', 'core'];
    for (const slot of t.variants[variant]) {
      if (SMALL.includes(slot)) continue;           // handled after the main work
      const cand = candidates(state, slot, session, now)[0];
      if (!cand) continue;
      const ex = cand.ex;
      const item = makeItem(state, ex, slot, ctx);
      const isFirst = firstCompound && ex.kind === 'compound';
      let tm = itemMinutes(state, item, ex, isFirst);
      if (tm <= budget) {
        session.items.push(item); budget -= tm; if (isFirst) firstCompound = false; continue;
      }
      // a shorter calibration ramp
      if (item.mode === 'calibrate' && item.sets > 3) {
        const three = Object.assign({}, item, { sets: 3, target: item.target.slice(0, 3), log: item.log.slice(0, 3) });
        tm = itemMinutes(state, three, ex, isFirst);
        if (tm <= budget) { session.items.push(three); budget -= tm; if (isFirst) firstCompound = false; continue; }
      }
      // try fewer sets on accessories
      if (ex.kind === 'isolation' && item.mode === 'work' && item.sets > 2) {
        const two = Object.assign({}, item, { sets: 2, target: item.target.slice(0, 2), log: item.log.slice(0, 2) });
        tm = itemMinutes(state, two, ex, false);
        if (tm <= budget) { session.items.push(two); budget -= tm; continue; }
      }
      // pair with the previous accessory as a superset
      const prev = session.items[session.items.length - 1];
      const prevEx = prev && exById(state, prev.exId);
      if (ex.kind === 'isolation' && prev && prevEx.kind === 'isolation' && !prev.superset && item.mode === 'work') {
        const sup = Object.assign({}, item, { sets: prev.sets, target: item.target.slice(0, prev.sets), log: item.log.slice(0, prev.sets), superset: 'b' });
        while (sup.target.length < prev.sets) { sup.target.push(sup.target[sup.target.length - 1]); sup.log.push({ w: sup.weight, r: null, done: false }); }
        tm = itemMinutes(state, sup, ex, false);
        if (tm <= budget) { prev.superset = 'a'; session.items.push(sup); budget -= tm; continue; }
      }
    }

    // calves and core: short finishers, neediest first, paired with the previous exercise where possible
    const smallGroups = short.slice();
    t.variants[variant].filter(x => SMALL.includes(x)).forEach(x => { const g = x === 'calf' ? 'calves' : 'core'; if (!smallGroups.includes(g)) smallGroups.push(g); });
    smallGroups.forEach((g, gi) => {
      if (session.items.some(i => exById(state, i.exId).primary === g)) return;
      const needed = short.includes(g);
      const slot = g === 'calves' ? 'calf' : 'core';
      const cand = candidates(state, slot, session, now)[0];
      if (!cand) return;
      const it = makeItem(state, cand.ex, slot, Object.assign({}, ctx, { sets: needed ? 2 : 3 }));
      if (it.mode === 'work' && needed) { it.sets = Math.min(it.sets, 2); it.target = it.target.slice(0, it.sets); it.log = it.log.slice(0, it.sets); }
      const prev = session.items[session.items.length - 1];
      if (prev && !prev.superset && prev.sets >= it.sets) {
        const sup = Object.assign({}, it, { superset: 'b', target: it.target.slice(), log: it.log.slice() });
        while (sup.log.length < prev.sets) { sup.log.push({ w: sup.mode === 'calibrate' ? null : sup.weight, r: null, done: false }); sup.target.push(sup.target[sup.target.length - 1]); }
        sup.sets = sup.log.length;
        const tm = itemMinutes(state, sup, cand.ex, false);
        if (tm <= budget + (needed ? 1 : 0)) { prev.superset = 'a'; session.items.push(sup); budget -= tm; return; }
      }
      const tm = itemMinutes(state, it, cand.ex, false);
      if (tm <= budget + (needed ? 1 : 0)) { session.items.push(it); budget -= tm; }
    });

    // spend leftover time on extra sets, compounds first
    {
      const order = session.items.filter(i => i.mode === 'work').sort((a, b) => (exById(state, a.exId).kind === 'compound' ? 0 : 1) - (exById(state, b.exId).kind === 'compound' ? 0 : 1));
      let changed = true;
      while (changed) {
        changed = false;
        for (const it of order) {
          if (it.sets >= 4 || it.superset) continue;
          const ex = exById(state, it.exId);
          const cost = (ex.kind === 'compound' ? 0.75 + state.settings.restCompound / 60 : 0.67 + state.settings.restIsolation / 60);
          if (cost <= budget) {
            it.sets++; it.target.push(it.target[it.target.length - 1]); it.log.push({ w: it.weight, r: null, done: false });
            budget -= cost; changed = true;
          }
        }
      }
    }
    session.estMinutes = estimateMinutes(state, session);
    return session;
  }

  function alternatives(state, session, idx, now) {
    const it = session.items[idx];
    const others = Object.assign({}, session, { items: session.items.filter((_, i) => i !== idx) });
    const ex = exById(state, it.exId);
    let list = candidates(state, it.slot, others, now || Date.now()).filter(c => c.ex.id !== it.exId);
    // also offer same-muscle exercises from other slots
    const extra = allExercises(state).filter(e => e.primary === ex.primary && !e.slots.includes(it.slot) && isAvailable(e, state.settings) && !state.prefs.excluded[e.id] && !session.items.some(i => i.exId === e.id));
    return list.map(c => c.ex).concat(extra);
  }

  // Three alternatives that differ in kit where possible: e.g. a machine, a free weight and a cable option.
  function topAlternatives(state, session, idx, now, n) {
    n = n || 3;
    const all = alternatives(state, session, idx, now);
    const it = session.items[idx];
    const family = e => e.custom ? 'custom' : e.load === 'plates' ? 'plates:' + (e.eq[0] || [''])[0].slice(0, 2) : e.load;
    const cur = exById(state, it.exId);
    const picked = [], seen = new Set([family(cur)]);
    for (const e of all) { if (picked.length >= n) break; if (e.slots.includes(it.slot) && !seen.has(family(e))) { picked.push(e); seen.add(family(e)); } }
    for (const e of all) { if (picked.length >= n) break; if (!picked.includes(e)) picked.push(e); }
    return { top: picked, rest: all.filter(e => !picked.includes(e)) };
  }

  /* ------------------------------------------------------------- dashboard */
  function dashboard(state, now) {
    const goal = state.settings.weeklyGoal || 4;
    const wk = weekKey(now), lastWk = shiftWeek(wk, -1);
    const done = state.sessions.filter(s => s.end).sort((a, b) => b.end - a.end);
    const tot = s => s.totals || sessionTotals(state, s);
    const inWeek = k => done.filter(s => weekKey(s.end) === k);
    const thisW = inWeek(wk), lastW = inWeek(lastWk);
    const vol = list => list.reduce((t, s) => t + tot(s).volume, 0);
    const sets = list => list.reduce((t, s) => t + tot(s).sets, 0);
    let streak = 0, k = thisW.length >= goal ? wk : lastWk;
    while (inWeek(k).length >= goal && streak < 200) { streak++; k = shiftWeek(k, -1); }
    let pr = null;
    for (const s of done) { if (s.prs && s.prs.length) { pr = Object.assign({ t: s.end }, s.prs[0]); break; } }
    const lastToDate = lastW.filter(s => s.end <= now - 7 * DAY);
    const firstMondayVol = lastW.length ? vol(lastW) : null;
    return {
      goal, weekSessions: thisW.length, weekDays: thisW.map(s => (new Date(s.end).getDay() + 6) % 7),
      weekSets: sets(thisW), weekVolume: vol(thisW), lastWeekVolume: firstMondayVol, lastWeekToDate: lastToDate.length ? vol(lastToDate) : null,
      streak, last: done[0] || null, pr, total: done.length
    };
  }

  function swapItem(state, session, idx, exId, now) {
    now = now || Date.now();
    const ex = exById(state, exId);
    const old = session.items[idx];
    const blk = blockInfo(state, now);
    const it = makeItem(state, ex, old.slot, { now, block: blk, readiness: session.readiness, sets: old.sets });
    it.superset = old.superset;
    if (it.mode === 'work') {
      it.sets = old.sets;
      it.target = it.target.slice(0, old.sets); while (it.target.length < old.sets) it.target.push(it.target[it.target.length - 1] || it.lo);
      it.log = Array.from({ length: old.sets }, () => ({ w: it.weight, r: null, done: false }));
    }
    session.items[idx] = it;
    session.estMinutes = estimateMinutes(state, session);
    return session;
  }

  function addExercise(state, session, exId, now) {
    now = now || Date.now();
    const ex = exById(state, exId);
    const blk = blockInfo(state, now);
    const it = makeItem(state, ex, ex.slots[0], { now, block: blk, readiness: session.readiness, sets: 3 });
    session.items.push(it);
    session.estMinutes = estimateMinutes(state, session);
    return session;
  }

  /* ----------------------------------------------------------- completion */
  function completeSession(state, session, now) {
    now = now || Date.now();
    const s = JSON.parse(JSON.stringify(session));
    s.end = now; if (!s.start) s.start = s.created;
    s.items = s.items.filter(it => doneSets(it).length > 0);
    const results = [], prs = [];
    s.items.forEach(it => {
      const ex = exById(state, it.exId); if (!ex) return;
      const before = performances(state, ex.id).filter(p => !p.deload);
      const sets = doneSets(it);
      const perf = { sets, effort: it.effort, weight: workingWeight(sets) };
      let outcome;
      if (it.mode === 'calibrate') outcome = 'calibrated';
      else if (sets.filter(x => x.w === perf.weight).every(x => x.r >= it.hi)) outcome = 'up';
      else if (sets.every(x => x.r >= it.lo)) outcome = 'hold';
      else outcome = 'miss';
      if (s.deload) outcome = 'deload';
      // personal bests
      if (kgLoad(ex) && before.length) {
        const prevBest = Math.max.apply(null, before.map(p => bestE1(p, ex)));
        const nowBest = bestE1(perf, ex);
        if (nowBest > prevBest * 1.005) prs.push({ exId: ex.id, kind: 'e1rm', value: Math.round(nowBest * 10) / 10, prev: Math.round(prevBest * 10) / 10 });
      } else if (!kgLoad(ex) && before.length) {
        const prevTop = Math.max.apply(null, before.map(p => Math.max.apply(null, p.sets.filter(x => x.w >= perf.weight).map(x => x.r).concat([0]))));
        const nowTop = Math.max.apply(null, sets.filter(x => x.w === perf.weight).map(x => x.r));
        if (ex.load !== 'assist' && nowTop > prevTop) prs.push({ exId: ex.id, kind: 'reps', value: nowTop, weight: perf.weight, prev: prevTop });
      }
      results.push({ exId: ex.id, outcome, sets: sets.length });
    });
    s.results = results; s.prs = prs;
    s.totals = sessionTotals(state, s);
    return s;
  }

  function sessionTotals(state, s) {
    let sets = 0, volume = 0, reps = 0;
    s.items.forEach(it => {
      const ex = exById(state, it.exId); if (!ex) return;
      doneSets(it).forEach(x => {
        sets++; reps += x.r;
        if (kgLoad(ex)) volume += x.w * x.r * (ex.load === 'dumbbell' && !ex.uni ? 2 : 1);
      });
    });
    return { sets, reps, volume: Math.round(volume), minutes: s.end && s.start ? Math.round((s.end - s.start) / 60000) : null };
  }

  /* -------------------------------------------------------------- progress */
  function progressSeries(state, exId) {
    const ex = exById(state, exId); if (!ex) return { metric: '', points: [] };
    const perfs = performances(state, exId);
    if (kgLoad(ex)) return { metric: 'Estimated one-rep max', unit: 'kg', points: perfs.map(p => ({ t: p.date, v: Math.round(bestE1(p, ex) * 10) / 10, label: `${bestSetText(p, ex)}`, deload: p.deload })) };
    if (ex.load === 'bodyweight') return { metric: 'Best set (reps)', unit: 'reps', points: perfs.map(p => ({ t: p.date, v: Math.max.apply(null, p.sets.map(s => s.r)), label: p.weight ? `+${fmt(p.weight)} kg` : 'bodyweight', deload: p.deload })) };
    return { metric: ex.load === 'assist' ? 'Assistance (lower is better)' : 'Working weight (stack)', unit: '', points: perfs.map(p => ({ t: p.date, v: p.weight, label: `${fmt(p.weight)} × ${p.sets.map(s => s.r).join(', ')}`, deload: p.deload })) };
  }

  function trainedExercises(state) {
    const seen = {};
    state.sessions.forEach(s => s.items.forEach(it => { if (doneSets(it).length) seen[it.exId] = (seen[it.exId] || 0) + 1; }));
    return Object.keys(seen).map(id => ({ id, count: seen[id], ex: exById(state, id) })).filter(x => x.ex).sort((a, b) => b.count - a.count);
  }

  function weeklyVolume(state, weeks, now) {
    const start = shiftWeek(weekKey(now), -(weeks - 1));
    const out = [], index = {};
    for (let i = 0; i < weeks; i++) { const k = shiftWeek(start, i); index[k] = i; out.push({ week: k, volume: 0, sets: 0, sessions: 0 }); }
    state.sessions.filter(s => s.end).forEach(s => {
      const i = index[weekKey(s.end)];
      if (i == null) return;
      const tt = s.totals || sessionTotals(state, s);
      out[i].volume += tt.volume; out[i].sets += tt.sets; out[i].sessions++;
    });
    return out;
  }

  function dailySets(state, days, now) {
    const map = {};
    state.sessions.filter(s => s.end).forEach(s => {
      const d = new Date(s.end); d.setHours(0, 0, 0, 0);
      const tt = s.totals || sessionTotals(state, s);
      map[d.getTime()] = (map[d.getTime()] || 0) + tt.sets;
    });
    return map;
  }

  /* --------------------------------------------------------- export summary */
  function exportSummary(state, days, now) {
    now = now || Date.now();
    const lines = [];
    const st = state.settings;
    lines.push(`Rebuild training log — last ${days} days (exported ${new Date(now).toLocaleDateString('en-GB')})`);
    lines.push(`Rep focus: ${st.repFocus}. Weekly goal: ${st.weeklyGoal} sessions.`);
    lines.push('');
    state.sessions.filter(s => s.end && now - s.end <= days * DAY).sort((a, b) => a.end - b.end).forEach(s => {
      const tt = s.totals || sessionTotals(state, s);
      lines.push(`${new Date(s.end).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })} — ${sessionName(s)}${s.deload ? ' (deload)' : ''}, ${tt.minutes || '?'} min, ${tt.sets} sets`);
      s.items.forEach(it => {
        const ex = exById(state, it.exId); if (!ex) return;
        const sets = doneSets(it).map(x => `${fmt(x.w)}×${x.r}`).join(', ');
        lines.push(`  ${ex.name}${it.mode === 'calibrate' ? ' [calibration]' : ''} (target ${it.lo}–${it.hi}): ${sets}${it.effort ? ' — last set ' + it.effort : ''}`);
      });
    });
    lines.push('');
    lines.push('Muscle groups, sets in the last 7 days:');
    muscleStatus(state, now).forEach(m => lines.push(`  ${m.name}: ${m.weekSets} (target ~${m.target})`));
    return lines.join('\n');
  }

  return {
    MUSCLES, MUSCLE, EQUIPMENT_GROUPS, EQUIP_NAME, LIBRARY, TEMPLATES, FOCUS_ORDER, EFFORT_RIR, DAY,
    defaultSettings, newState, normalise, allExercises, exById, isAvailable, equipmentLabel, repRange,
    increment, roundLoad, plateBreakdown, e1rm, performances, exerciseStatus, muscleStatus, blockInfo,
    commitSession,
    chooseFocus, prescribe, buildSession, alternatives, topAlternatives, swapItem, addExercise, estimateMinutes,
    dashboard, sessionName, nextVariant, AUTO_FOCUS,
    completeSession, sessionTotals, progressSeries, trainedExercises, weeklyVolume, dailySets,
    exportSummary, doneSets, weekKey, shiftWeek, kgLoad, unitOf, fmt
  };
});
