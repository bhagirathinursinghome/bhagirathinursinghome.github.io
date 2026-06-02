/* page.js - helpers for iframed pages.
   Each module page should include this AFTER config.js (and supabase if needed).
   It exposes:
     BNH_PAGE.user        - currently logged in user (from localStorage)
     BNH_PAGE.requireRole(roles[])  - redirects parent to login if not allowed
     BNH_PAGE.sb          - shared supabase client (if config + supabase loaded)
     BNH_PAGE.stamp(obj)  - adds recorded_by / recorded_by_name / recorded_at to a payload
*/
(function () {
  const KEY = "bnh_current_user";
  let user = null;
  try { user = JSON.parse(localStorage.getItem(KEY)); } catch {}

  function requireRole(roles) {
    if (!user) { top.location.href = "../index.html"; return; }
    if (roles && roles.length && !roles.includes("*") && !roles.includes(user.role)) {
      document.body.innerHTML = '<div class="page"><div class="page-card"><h2>Access denied</h2><p>Your role does not have access to this page.</p></div></div>';
      throw new Error("role denied");
    }
  }

  function stamp(obj) {
    if (!user) return obj;
    return {
      ...obj,
      recorded_by: user.username,
      recorded_by_name: user.name,
      recorded_at: new Date().toISOString()
    };
  }

  let sb = null;
  if (window.supabase && window.BNH_CONFIG) {
    sb = window.supabase.createClient(window.BNH_CONFIG.SUPABASE_URL, window.BNH_CONFIG.SUPABASE_KEY);
  }

  window.BNH_PAGE = { user, requireRole, stamp, sb };
})();
