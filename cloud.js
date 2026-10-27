/* Rebuild — cloud saving with Google Firebase.
 * The phone keeps a full copy of your data and works offline. When you are signed in and have signal,
 * changes upload to your own Firestore database, and other devices you sign in on download them.
 * Merge rules: completed sessions are combined from both sides (newest edit wins, deletions are remembered);
 * settings and the session in progress take whichever side changed most recently.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Cloud = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ------------------------------------------------------------ pure helpers (tested in Node) */
  function hash(str) {
    let h = 5381;
    for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
    return (h >>> 0).toString(36) + ':' + str.length;
  }
  const sig = o => hash(JSON.stringify(o === undefined ? null : o));
  const ver = s => (s && (s.updatedAt || s.end)) || 0;
  const profileOf = st => ({ settings: st.settings, prefs: st.prefs, custom: st.custom || [], deleted: st.deleted || [] });

  // Record when settings or the session in progress last changed, so the newest side wins a merge.
  function stamp(st, now) {
    const ps = sig(profileOf(st));
    if (st._profileSig !== ps) { if (st._profileSig != null) st.profileUpdatedAt = now; st._profileSig = ps; }
    const as = sig(st.active || null);
    if (st._activeSig !== as) { if (st._activeSig != null) st.activeUpdatedAt = now; st._activeSig = as; }
    return st;
  }

  // remote: { profile: {data, updatedAt} | null, active: {data, updatedAt} | null, sessions: { id: session } }
  function merge(local, remote) {
    const out = JSON.parse(JSON.stringify(local));
    const tomb = {};
    (local.deleted || []).concat(remote.profile && remote.profile.data.deleted || []).forEach(d => { tomb[d.id] = Math.max(tomb[d.id] || 0, d.t || 0); });
    const map = {};
    (local.sessions || []).forEach(s => { map[s.id] = s; });
    Object.keys(remote.sessions || {}).forEach(id => { const r = remote.sessions[id], l = map[id]; if (!l || ver(r) > ver(l)) map[id] = r; });
    out.sessions = Object.keys(map).filter(id => !tomb[id]).map(id => map[id]).sort((a, b) => (a.end || 0) - (b.end || 0));
    out.deleted = Object.keys(tomb).map(id => ({ id, t: tomb[id] }));
    if (remote.profile && (remote.profile.updatedAt || 0) > (local.profileUpdatedAt || 0)) {
      const d = remote.profile.data;
      out.settings = d.settings; out.prefs = d.prefs; out.custom = d.custom || [];
      out.profileUpdatedAt = remote.profile.updatedAt;
    }
    if (remote.active && (remote.active.updatedAt || 0) > (local.activeUpdatedAt || 0)) {
      out.active = remote.active.data || null;
      out.activeUpdatedAt = remote.active.updatedAt;
    }
    if (out.active && tomb[out.active.id]) out.active = null;
    out._profileSig = sig(profileOf(out));
    out._activeSig = sig(out.active || null);
    return out;
  }

  // The writes needed so the cloud matches `st`. Gives never-uploaded data a real timestamp.
  function plan(st, remote, now) {
    const sets = [], dels = [];
    const have = {};
    (st.sessions || []).forEach(s => { have[s.id] = 1; const r = remote.sessions[s.id]; if (!r || sig(r) !== sig(s)) sets.push(s); });
    Object.keys(remote.sessions || {}).forEach(id => { if (!have[id]) dels.push(id); });
    let profile = null, active = null;
    const prof = profileOf(st);
    if (!remote.profile || sig(remote.profile.data) !== sig(prof)) {
      if (!st.profileUpdatedAt) st.profileUpdatedAt = now;
      profile = { data: prof, updatedAt: st.profileUpdatedAt };
    }
    const remoteActive = remote.active ? remote.active.data || null : null;
    if (sig(remoteActive) !== sig(st.active || null)) {
      if (!st.activeUpdatedAt) st.activeUpdatedAt = now;
      active = { data: st.active || null, updatedAt: st.activeUpdatedAt };
    }
    return { sets, dels, profile, active, count: sets.length + dels.length + (profile ? 1 : 0) + (active ? 1 : 0) };
  }

  // Update our picture of the cloud after a plan has been written.
  function applyPlan(remote, p) {
    const r = { profile: remote.profile, active: remote.active, sessions: Object.assign({}, remote.sessions) };
    p.sets.forEach(s => { r.sessions[s.id] = JSON.parse(JSON.stringify(s)); });
    p.dels.forEach(id => { delete r.sessions[id]; });
    if (p.profile) r.profile = JSON.parse(JSON.stringify(p.profile));
    if (p.active) r.active = JSON.parse(JSON.stringify(p.active));
    return r;
  }

  // Read the settings from cloud-config.js, or a block pasted into the app.
  function parseConfig(text) {
    if (!text) return null;
    const out = {};
    ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'].forEach(k => {
      const m = String(text).match(new RegExp(k + '\\s*["\']?\\s*:\\s*["\']([^"\']+)["\']'));
      if (m) out[k] = m[1].trim();
    });
    return validConfig(out) ? out : null;
  }
  function validConfig(c) { return !!(c && c.apiKey && c.projectId && c.appId && !/PASTE/i.test(c.apiKey + c.projectId)); }

  const pure = { hash, sig, ver, profileOf, stamp, merge, plan, applyPlan, parseConfig, validConfig };

  /* ------------------------------------------------------------ browser runtime */
  if (typeof window === 'undefined' || !window.FB) return Object.assign({ available: false }, pure);
  const FB = window.FB;
  const CFG_KEY = 'rebuild.cloudcfg';

  const C = Object.assign({ available: true }, pure);
  let app = null, auth = null, db = null, host = null;
  let remote = null, busy = false, again = false, timer = null, retryTimer = null, lastFull = 0;
  C.status = { state: 'unconfigured', at: null, message: '', email: null };

  function setStatus(state, extra) {
    C.status = Object.assign({}, C.status, { state, message: '' }, extra || {});
    if (host && host.onStatus) host.onStatus(C.status);
  }

  function readConfig() {
    if (validConfig(window.REBUILD_FIREBASE)) return window.REBUILD_FIREBASE;
    try { return parseConfig(localStorage.getItem(CFG_KEY)); } catch (e) { return null; }
  }
  C.configFromFile = () => validConfig(window.REBUILD_FIREBASE);
  C.isConfigured = () => !!readConfig();

  C.saveConfig = function (text) {
    const c = parseConfig(text);
    if (!c) return false;
    try { localStorage.setItem(CFG_KEY, JSON.stringify(c)); } catch (e) { return false; }
    return true;
  };

  function friendly(e) {
    const code = (e && e.code) || '';
    if (/invalid-credential|wrong-password|user-not-found|invalid-email|invalid-login/.test(code)) return 'Email or password not recognised.';
    if (/too-many-requests/.test(code)) return 'Too many attempts. Wait a few minutes and try again.';
    if (/network-request-failed|unavailable|deadline-exceeded/.test(code) || (typeof navigator !== 'undefined' && navigator.onLine === false)) return 'No connection. Your data is safe on this phone and will upload when you have signal.';
    if (/permission-denied/.test(code)) return 'The cloud database refused access. Check the security rules were published (setup step 4).';
    if (/user-disabled/.test(code)) return 'This account has been disabled in Firebase.';
    if (/api-key|invalid-api-key|configuration-not-found|project/.test(code)) return 'The Firebase settings look wrong. Check cloud-config.js against the Firebase console.';
    if (/not-found/.test(code)) return 'The cloud database was not found. Check it was created (setup step 3).';
    return (e && e.message) ? e.message.replace(/^Firebase:\s*/, '') : 'Something went wrong.';
  }
  const isOffline = e => /network-request-failed|unavailable|deadline-exceeded/.test((e && e.code) || '') || (typeof navigator !== 'undefined' && navigator.onLine === false);

  function refs(uid) {
    return {
      profile: FB.doc(db, 'users', uid),
      active: FB.doc(db, 'users', uid, 'meta', 'active'),
      sessions: FB.collection(db, 'users', uid, 'sessions'),
      session: id => FB.doc(db, 'users', uid, 'sessions', id)
    };
  }

  async function pull(uid) {
    const r = refs(uid);
    const [p, a, ss] = await Promise.all([FB.getDoc(r.profile), FB.getDoc(r.active), FB.getDocs(r.sessions)]);
    const unpack = d => (d && d.exists() ? { data: JSON.parse(d.data().json), updatedAt: d.data().updatedAt || 0 } : null);
    const sessions = {};
    ss.forEach(d => { try { sessions[d.id] = JSON.parse(d.data().json); } catch (e) { /* skip a damaged record */ } });
    return { profile: unpack(p), active: unpack(a), sessions };
  }

  async function push(uid, p) {
    const r = refs(uid);
    const ops = [];
    p.sets.forEach(s => ops.push(b => b.set(r.session(s.id), { json: JSON.stringify(s), updatedAt: ver(s) })));
    p.dels.forEach(id => ops.push(b => b.delete(r.session(id))));
    if (p.profile) ops.push(b => b.set(r.profile, { json: JSON.stringify(p.profile.data), updatedAt: p.profile.updatedAt }));
    if (p.active) ops.push(b => b.set(r.active, { json: JSON.stringify(p.active.data), updatedAt: p.active.updatedAt }));
    for (let i = 0; i < ops.length; i += 400) {
      const b = FB.writeBatch(db);
      ops.slice(i, i + 400).forEach(f => f(b));
      await b.commit();
    }
  }

  // full: download the cloud copy and merge; otherwise just upload what changed locally.
  C.sync = async function (opts) {
    opts = opts || {};
    const user = auth && auth.currentUser;
    if (!user || !host) return;
    if (busy) { again = true; if (opts.full) lastFull = 0; return; }
    busy = true; clearTimeout(retryTimer);
    const quiet = C.status.state === 'synced' && !opts.full;
    if (!quiet) setStatus('syncing');
    try {
      let st = stamp(host.get(), Date.now());
      if (opts.full || !remote) {
        remote = await pull(user.uid);
        const merged = merge(st, remote);
        if (sig(merged.sessions) !== sig(st.sessions) || merged._profileSig !== st._profileSig || merged._activeSig !== st._activeSig || sig(merged.deleted) !== sig(st.deleted || [])) {
          host.set(merged);
        }
        st = host.get();
        lastFull = Date.now();
      }
      const p = plan(st, remote, Date.now());
      if (p.count) { await push(user.uid, p); remote = applyPlan(remote, p); host.persist && host.persist(); }
      setStatus('synced', { at: Date.now() });
    } catch (e) {
      if (isOffline(e)) setStatus('offline', { message: friendly(e) });
      else setStatus('error', { message: friendly(e) });
      if (/permission-denied|not-found/.test((e && e.code) || '')) remote = null;
      retryTimer = setTimeout(() => C.sync({ full: !remote }), 60000);
    } finally {
      busy = false;
      if (again) { again = false; setTimeout(() => C.sync({ full: !lastFull }), 50); }
    }
  };

  // Called after every local save: upload shortly afterwards.
  C.schedule = function () {
    if (!auth || !auth.currentUser) return;
    clearTimeout(timer);
    timer = setTimeout(() => C.sync({}), 2500);
  };

  C.start = function (h) {
    host = h;
    const cfg = readConfig();
    if (!cfg) { setStatus('unconfigured'); return; }
    try {
      app = FB.initializeApp(cfg);
      auth = FB.initializeAuth(app, { persistence: [FB.indexedDBLocalPersistence, FB.browserLocalPersistence] });
      db = FB.getFirestore(app);
      if (cfg.emulator) { FB.connectAuthEmulator(auth, cfg.emulator.auth, { disableWarnings: true }); FB.connectFirestoreEmulator(db, cfg.emulator.host, cfg.emulator.port); }
    } catch (e) { setStatus('error', { message: friendly(e) }); return; }
    setStatus('signed-out');
    FB.onAuthStateChanged(auth, user => {
      remote = null;
      if (user) { setStatus('syncing', { email: user.email }); C.sync({ full: true }); }
      else setStatus('signed-out', { email: null });
    });
    window.addEventListener('online', () => C.sync({ full: !remote }));
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && auth.currentUser) C.sync({ full: Date.now() - lastFull > 180000 });
    });
  };

  C.signIn = async function (email, password) {
    if (!auth) throw new Error('Cloud saving is not set up yet.');
    try { await FB.signInWithEmailAndPassword(auth, email.trim(), password); }
    catch (e) { const err = new Error(friendly(e)); err.code = e.code; throw err; }
  };
  C.signOut = async function () { if (auth) { clearTimeout(timer); await FB.signOut(auth); remote = null; } };
  C.resetPassword = async function (email) {
    try { await FB.sendPasswordResetEmail(auth, email.trim()); }
    catch (e) { const err = new Error(friendly(e)); err.code = e.code; throw err; }
  };
  C.signedIn = () => !!(auth && auth.currentUser);

  // Delete the cloud copy (used by Erase all data).
  C.eraseCloud = async function () {
    const user = auth && auth.currentUser; if (!user) return;
    const r = refs(user.uid);
    const ss = await FB.getDocs(r.sessions);
    const ids = []; ss.forEach(d => ids.push(d.id));
    const ops = ids.map(id => b => b.delete(r.session(id))).concat([b => b.delete(r.profile), b => b.delete(r.active)]);
    for (let i = 0; i < ops.length; i += 400) { const b = FB.writeBatch(db); ops.slice(i, i + 400).forEach(f => f(b)); await b.commit(); }
    remote = { profile: null, active: null, sessions: {} };
  };

  return C;
});
