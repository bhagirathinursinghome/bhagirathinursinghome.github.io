(function () {
  const KEY = 'bnh_app_version';
  const CHECK_EVERY = 60 * 1000;

  // ⚠️ ADJUST THIS ONE LINE: return your shared Supabase client
  // (the same one auth.js / page.js use)
  const getSb = () => (window.BNH && BNH.sb) || window.sb || null;

  let shown = false;

  async function getRemote() {
    const sb = getSb();
    if (!sb) return null;
    const { data, error } = await sb.from('app_version')
      .select('version,note').eq('id', 1).single();
    return error ? null : data;
  }

  async function check() {
    if (shown) return;
    const remote = await getRemote();
    if (!remote) return;
    const local = localStorage.getItem(KEY);
    if (!local) { localStorage.setItem(KEY, remote.version); return; } // first run
    if (local !== remote.version) showPopup(remote);
  }

  function showPopup(remote) {
    shown = true;
    const m = document.createElement('div');
    m.className = 'modal';
    m.innerHTML = `
      <div class="modal-card" style="text-align:center">
        <h3>🔄 New Update Available</h3>
        <p>${remote.note ? remote.note.replace(/</g, '&lt;') : 'A new version of the app is ready.'}</p>
        <div class="modal-actions" style="justify-content:center">
          <button class="btn-ghost" id="updLater">Later</button>
          <button class="btn-primary" id="updNow">Update Now</button>
        </div>
      </div>`;
    document.body.appendChild(m);
    m.querySelector('#updLater').onclick = () => { m.remove(); shown = false; setTimeout(check, 5 * 60 * 1000); };
    m.querySelector('#updNow').onclick = async (e) => {
      e.target.disabled = true; e.target.textContent = 'Updating...';
      await applyUpdate(remote.version);
    };
  }

  async function applyUpdate(version) {
    try {
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(r => r.unregister()));
      }
      if (window.caches) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }
    } catch (e) { console.warn('Cache clear error', e); }
    localStorage.setItem(KEY, version);
    location.href = location.pathname + '?v=' + Date.now(); // fresh load, SW re-registers
  }

  // Admin: publish a new version
  async function publish(note) {
    const sb = getSb();
    const user = BNH.getCurrentUser();
    const { error } = await sb.from('app_version').upsert({
      id: 1,
      version: String(Date.now()),
      note: note || null,
      published_by: user ? user.username : null,
      published_at: new Date().toISOString()
    });
    if (error) throw error;
  }

  window.BNH_UPDATER = { check, publish };

  check();
  setInterval(check, CHECK_EVERY);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) check(); });
})();
