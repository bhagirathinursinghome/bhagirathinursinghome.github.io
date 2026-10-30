/* page.js - helpers for iframed pages with granular user permissions (view/entry/edit/delete).
   Each module page should include this AFTER config.js (and supabase if needed).
   It exposes:
     BNH_PAGE.user                       - currently logged in user (from localStorage)
     BNH_PAGE.requireRole(roles[])       - checks the current user's role
     BNH_PAGE.getPageAccess(page)        - returns { view, entry, edit, delete, mode, roles }
     BNH_PAGE.requirePageAccess(page)    - enforces view access & returns legacy mode ("full"|"limited"|"view")
     BNH_PAGE.requirePermissions(page)   - enforces view access, auto-toggles [data-perm] elements, & returns { view, entry, edit, delete, mode }
     BNH_PAGE.applyPermissionUI(perms)   - hides/disables DOM elements with data-perm="entry|edit|delete"
     BNH_PAGE.sb                         - shared supabase client (if config + supabase loaded)
     BNH_PAGE.stamp(obj)                 - adds recorded_by / recorded_by_name / recorded_at to a payload
*/
(function () {
  const KEY = "bnh_current_user";
  const THEME_KEY = "bnh_theme";
  let user = null;
  try { user = JSON.parse(localStorage.getItem(KEY)); } catch {}

  function applyTheme() {
    document.documentElement.dataset.theme =
      localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light";
  }
  applyTheme();
  window.addEventListener("storage", event => {
    if (event.key === THEME_KEY) applyTheme();
  });

  function renderAccessDenied(msg) {
    document.body.innerHTML = `
      <div class="page">
        <div class="page-card">
          <h2>🚫 Access Denied</h2>
          <p>${msg || "You do not have permission to view this page. Please contact the administrator."}</p>
        </div>
      </div>`;
  }

  function currentPagePath() {
    const path = String(window.location.pathname || "").replace(/\\/g, "/");
    const match = path.match(/(?:^|\/)(pages\/[^/]+\.html)$/i);
    return match ? match[1] : null;
  }

  function isRegisteredPage(page) {
    try {
      const pages = JSON.parse(localStorage.getItem("bnh_app_pages") || "[]");
      return Array.isArray(pages) &&
        pages.some(item => String(item.page_path || item.page || "").replace(/^\/+/, "") === page);
    } catch {
      return false;
    }
  }

  function requireRole(roles) {
    if (!user) { top.location.href = "../index.html"; return; }
    const userRole = String(user.role || "").toLowerCase();
    if (userRole === "admin") return; // Admin always allowed

    const page = currentPagePath();
    if (page && isRegisteredPage(page)) {
      const allowedRoles = (roles || []).map(role => String(role).toLowerCase());
      if (allowedRoles.length === 1 && allowedRoles[0] === "admin") {
        renderAccessDenied("This page is restricted to administrators.");
        throw new Error("admin access required");
      }

      const access = getPageAccess(page, user);
      if (!access.view || access.mode === "denied") {
        renderAccessDenied("You do not have view permission for this page.");
        throw new Error("page access denied");
      }
      window.BNH_PAGE.permissions = access;
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => applyPermissionUI(access));
      } else {
        applyPermissionUI(access);
      }
      return;
    }

    const allowedRoles = (roles || []).map(role => String(role).toLowerCase());
    if (allowedRoles.length && !allowedRoles.includes("*") && !allowedRoles.includes(userRole)) {
      renderAccessDenied("Your role does not have access to this page.");
      throw new Error("role denied");
    }
  }

  function getMenuEngine() {
    if (window.parent !== window) {
      try {
        const parentMenu = window.parent.BNH_MENU;
        if (parentMenu) return parentMenu;
      } catch (error) {
        if (error.name !== "SecurityError") throw error;
      }
    }
    return window.BNH_MENU || null;
  }

  function getPageAccess(page, role) {
    const menu = getMenuEngine();
    if (menu && typeof menu.getPageAccess === "function") {
      return menu.getPageAccess(page, role === undefined ? user : role);
    }

    // Fallback check directly from localStorage cache if menu.js was not included in iframe
    if (!user) return { view: false, entry: false, edit: false, delete: false, mode: "denied", roles: [] };
    if (user.role === "admin") {
      return { view: true, entry: true, edit: true, delete: true, mode: "full", roles: ["*"] };
    }
    try {
      const norm = String(page || "").trim().replace(/^\/+/, "");
      const pages = JSON.parse(localStorage.getItem("bnh_app_pages") || "[]");
      const pageMeta = Array.isArray(pages)
        ? pages.find(item => String(item.page_path || item.page || "").replace(/^\/+/, "") === norm)
        : null;
      const perms = JSON.parse(localStorage.getItem("bnh_user_permissions") || "{}")[norm];
      if (perms && perms.view) {
        const access = {
          view: true,
          entry: Boolean(perms.entry),
          edit: Boolean(perms.edit),
          delete: Boolean(perms.delete),
          roles: ["*"]
        };
        access.mode = access.entry && access.edit && access.delete
          ? "full"
          : (access.entry || access.edit || access.delete ? "limited" : "view");
        return access;
      }
      if (pageMeta && pageMeta.is_public) {
        return { view: true, entry: false, edit: false, delete: false, mode: "view", roles: ["*"] };
      }
    } catch {}
    return { view: false, entry: false, edit: false, delete: false, mode: "denied", roles: [] };
  }

  // Automatically hides elements with data-perm="entry" | "edit" | "delete" if user lacks that permission
  function applyPermissionUI(perms) {
    if (!perms) return;
    ["entry", "edit", "delete"].forEach(action => {
      if (!perms[action]) {
        document.querySelectorAll(`[data-perm="${action}"]`).forEach(el => {
          el.classList.add("hidden");
          el.hidden = true;
          if ("disabled" in el) el.disabled = true;
        });
      }
    });
  }

  // Backwards-compatible helper: returns "full", "limited", or "view", and attaches BNH_PAGE.permissions
  function requirePageAccess(page) {
    if (!user) {
      top.location.href = "../index.html";
      return "denied";
    }
    const access = getPageAccess(page, user);
    if (!access.view || access.mode === "denied") {
      renderAccessDenied("You do not have view permission for this page.");
      throw new Error("page access denied");
    }
    window.BNH_PAGE.permissions = access;
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => applyPermissionUI(access));
    } else {
      applyPermissionUI(access);
    }
    return access.mode;
  }

  // New granular helper: returns { view, entry, edit, delete, mode }
  function requirePermissions(page) {
    if (!user) {
      top.location.href = "../index.html";
      throw new Error("not logged in");
    }
    const access = getPageAccess(page, user);
    if (!access.view || access.mode === "denied") {
      renderAccessDenied("You do not have view permission for this page.");
      throw new Error("page access denied");
    }
    window.BNH_PAGE.permissions = access;
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => applyPermissionUI(access));
    } else {
      applyPermissionUI(access);
    }
    return access;
  }

  function can(action) {
    const p = window.BNH_PAGE && window.BNH_PAGE.permissions;
    if (user && user.role === "admin") return true;
    return Boolean(p && p[action]);
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

  window.BNH_PAGE = {
    user,
    requireRole,
    getPageAccess,
    requirePageAccess,
    requirePermissions,
    applyPermissionUI,
    can,
    permissions: null,
    stamp,
    sb
  };
})();
