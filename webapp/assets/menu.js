/* menu.js - Dynamic Supabase-backed menu & user-wise granular permission engine */
(function () {
  const PERM_CACHE_KEY = "bnh_user_permissions";
  const PAGES_CACHE_KEY = "bnh_app_pages";

  // Fallback items if DB tables are not yet created
  const FALLBACK_ITEMS = [
    { label: "Home", icon: "🏠", page_path: "pages/home.html", group_name: null, is_public: true },
    { label: "My Profile", icon: "👤", page_path: "pages/profile.html", group_name: null, is_public: true },
    { label: "Page & Access Control", icon: "🔐", page_path: "pages/admin-permissions.html", group_name: "Administration", is_public: false },
    { label: "User Management", icon: "🛡️", page_path: "pages/admin-users.html", group_name: "Administration", is_public: false }
  ];

  // Order in which groups appear in the grouped sidebar
  const GROUP_ORDER = [
    "Administration", "Voucher", "Employees", "OPD",
    "Lab", "Marketing", "IPD", "Pharmacy", "Reports"
  ];

  const GROUP_ICONS = {
    "Administration": "🛡️",
    "Voucher": "💵",
    "Employees": "👥",
    "OPD": "🏥",
    "Lab": "🧪",
    "Marketing": "📣",
    "IPD": "🛏️",
    "Pharmacy": "💊",
    "Reports": "📊"
  };

  function getSb() {
    if (window.BNH && window.BNH.sb) return window.BNH.sb;
    if (window.BNH_PAGE && window.BNH_PAGE.sb) return window.BNH_PAGE.sb;
    if (window.supabase && window.BNH_CONFIG) {
      return window.supabase.createClient(window.BNH_CONFIG.SUPABASE_URL, window.BNH_CONFIG.SUPABASE_KEY);
    }
    return null;
  }

  function getCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem("bnh_current_user"));
    } catch {
      return null;
    }
  }

  function normalizePath(p) {
    return String(p || "").trim().replace(/^\/+/, "");
  }

  // Fetch pages and user permissions from Supabase and cache them locally for instant iframe checks
  async function syncFromSupabase(user) {
    const sb = getSb();
    if (!sb || !user) return { pages: FALLBACK_ITEMS, permsMap: {} };

    try {
      const [pagesRes, permsRes] = await Promise.all([
        sb.from("app_pages")
          .select("*")
          .eq("is_active", true)
          .order("sort_order", { ascending: true })
          .order("label", { ascending: true }),
        sb.from("user_page_permissions")
          .select("*")
          .eq("user_id", user.id)
      ]);

      const pages = (pagesRes.data && pagesRes.data.length) ? pagesRes.data : FALLBACK_ITEMS;
      const permsList = permsRes.data || [];

      const permsMap = {};
      permsList.forEach(row => {
        const key = normalizePath(row.page_path);
        permsMap[key] = {
          view: Boolean(row.can_view || row.can_entry || row.can_edit || row.can_delete),
          entry: Boolean(row.can_entry),
          edit: Boolean(row.can_edit),
          delete: Boolean(row.can_delete)
        };
      });

      if (pagesRes.error) throw pagesRes.error;
      if (permsRes.error) throw permsRes.error;

      localStorage.setItem(PAGES_CACHE_KEY, JSON.stringify(pages));
      localStorage.setItem(PERM_CACHE_KEY, JSON.stringify(permsMap));

      return { pages, permsMap };
    } catch (err) {
      console.warn("[BNH_MENU] Falling back to cached/default menu:", err);
      return {
        pages: getCachedPages(),
        permsMap: getCachedPerms()
      };
    }
  }

  function getCachedPages() {
    try {
      const p = JSON.parse(localStorage.getItem(PAGES_CACHE_KEY));
      return Array.isArray(p) && p.length ? p : FALLBACK_ITEMS;
    } catch {
      return FALLBACK_ITEMS;
    }
  }

  function getCachedPerms() {
    try {
      return JSON.parse(localStorage.getItem(PERM_CACHE_KEY)) || {};
    } catch {
      return {};
    }
  }

  // Compute legacy mode ("full" | "limited" | "view" | "denied") from granular flags
  function computeMode(flags) {
    if (!flags.view) return "denied";
    if (flags.entry && flags.edit && flags.delete) return "full";
    if (flags.entry || flags.edit || flags.delete) return "limited";
    return "view";
  }

  // Synchronous lookup for any page (works inside iframes too)
  function getPageAccess(page, roleOrUser) {
    const user = (typeof roleOrUser === "object" && roleOrUser !== null)
      ? roleOrUser
      : getCurrentUser();

    const role = String(
      (typeof roleOrUser === "string" ? roleOrUser : (user && user.role)) || ""
    ).toLowerCase();

    const normPage = normalizePath(page);

    // 1. Admin always gets full access to every page
    if (role === "admin") {
      return {
        view: true,
        entry: true,
        edit: true,
        delete: true,
        mode: "full",
        roles: ["*"]
      };
    }

    // 2. Check if page is marked public (e.g., Home, My Profile, Attendance Punch)
    const pages = getCachedPages();
    const pageMeta = pages.find(p => normalizePath(p.page_path || p.page) === normPage);
    const permsMap = getCachedPerms();
    const userPerm = permsMap[normPage];

    if (userPerm && userPerm.view) {
      const mode = computeMode(userPerm);
      return {
        ...userPerm,
        mode,
        roles: ["*"]
      };
    }

    if (pageMeta && pageMeta.is_public) {
      return {
        view: true,
        entry: false,
        edit: false,
        delete: false,
        mode: "view",
        roles: ["*"]
      };
    }

    return {
      view: false,
      entry: false,
      edit: false,
      delete: false,
      mode: "denied",
      roles: ["admin"]
    };
  }

  function makeLink(item, container, onClick, isFirst) {
    const link = document.createElement("a");
    link.href = "#";
    link.className = `menu-item${isFirst ? " active" : ""}`;

    const pagePath = item.page_path || item.page;
    link.dataset.page = pagePath;

    link.innerHTML = `
      <span class="mi-icon">${item.icon || "📄"}</span>
      <span class="mi-label">${item.label}</span>
    `;

    link.addEventListener("click", (e) => {
      e.preventDefault();
      container.querySelectorAll(".menu-item").forEach(el => el.classList.remove("active"));
      link.classList.add("active");

      if (typeof onClick === "function") {
        onClick({
          ...item,
          page: pagePath,
          page_path: pagePath,
          group: item.group_name || item.group || null
        });
      }
    });

    return link;
  }

  function renderFlat(visibleItems, container, onClick) {
    visibleItems.forEach((item, index) => {
      container.appendChild(makeLink(item, container, onClick, index === 0));
    });
  }

  function renderGrouped(visibleItems, container, onClick) {
    const pinned = visibleItems.filter(item => !(item.group_name || item.group));
    const grouped = visibleItems.filter(item => Boolean(item.group_name || item.group));

    let isFirst = true;

    pinned.forEach(item => {
      container.appendChild(makeLink(item, container, onClick, isFirst));
      isFirst = false;
    });

    const buckets = new Map();
    grouped.forEach(item => {
      const gName = item.group_name || item.group;
      if (!buckets.has(gName)) buckets.set(gName, []);
      buckets.get(gName).push(item);
    });

    const orderedGroupNames = [
      ...GROUP_ORDER.filter(g => buckets.has(g)),
      ...[...buckets.keys()].filter(g => !GROUP_ORDER.includes(g))
    ];

    orderedGroupNames.forEach(groupName => {
      const items = buckets.get(groupName);

      const section = document.createElement("div");
      section.className = "menu-group";

      const header = document.createElement("button");
      header.type = "button";
      header.className = "menu-group-header";
      header.innerHTML = `
        <span class="mi-icon">${GROUP_ICONS[groupName] || "📁"}</span>
        <span class="mi-label">${groupName}</span>
        <span class="mg-chevron">▸</span>
      `;

      const body = document.createElement("div");
      body.className = "menu-group-body";

      items.forEach(item => {
        body.appendChild(makeLink(item, container, onClick, false));
      });

      header.addEventListener("click", () => {
        const willOpen = !section.classList.contains("open");
        container.querySelectorAll(".menu-group.open").forEach(el => el.classList.remove("open"));
        if (willOpen) section.classList.add("open");
      });

      section.appendChild(header);
      section.appendChild(body);
      container.appendChild(section);

      if (isFirst) {
        section.classList.add("open");
        isFirst = false;
      }
    });
  }

  // Render menu dynamically from Supabase
  async function render(roleOrUser, container, onClick) {
    if (!container) {
      console.error("Menu container not found");
      return;
    }

    const user = (typeof roleOrUser === "object" && roleOrUser !== null)
      ? roleOrUser
      : getCurrentUser();

    const role = String(
      (typeof roleOrUser === "string" ? roleOrUser : (user && user.role)) || ""
    ).toLowerCase();

    container.innerHTML = `<div class="muted" style="padding:0.75rem 0.8rem;font-size:0.85rem;">Loading menu...</div>`;

    const { pages, permsMap } = await syncFromSupabase(user);

    container.innerHTML = "";

    const visibleItems = pages
      .filter(item => {
        const pPath = normalizePath(item.page_path || item.page);
        if (role === "admin") return true;
        if (item.is_public) return true;
        const perm = permsMap[pPath];
        return Boolean(perm && perm.view);
      })
      .map(item => ({
        ...item,
        page: item.page_path || item.page,
        group: item.group_name || item.group || null
      }));

    // Use grouped layout if admin or if user has more than 8 menu items
    if (role === "admin" || visibleItems.length > 8) {
      container.classList.add("menu-grouped");
      renderGrouped(visibleItems, container, onClick);
    } else {
      container.classList.remove("menu-grouped");
      renderFlat(visibleItems, container, onClick);
    }

    console.log(`[BNH_MENU] Loaded ${visibleItems.length} pages from Supabase for user ${user ? user.username : role}`);
  }

  window.BNH_MENU = {
    get items() { return getCachedPages(); },
    GROUP_ORDER,
    GROUP_ICONS,
    render,
    syncFromSupabase,
    getPageAccess
  };
})();
