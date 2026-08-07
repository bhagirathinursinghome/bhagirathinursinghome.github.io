/* menu.js */
(function () {

  const ITEMS = [

    // ==========================================
    // COMMON
    // ==========================================
    {
      label: "Home",
      icon: "🏠",
      page: "pages/home.html",
      roles: ["*"]
    },
    {
      label: "My Profile",
      icon: "👤",
      page: "pages/profile.html",
      roles: ["*"]
    },

    // ==========================================
    // ADMIN
    // ==========================================
    {
      label: "DB Analytics",
      icon: "🗄️",
      page: "pages/supabase_analytics.html",
      roles: ["admin"],
      group: "Administration"
    },
    {
      label: "User Management",
      icon: "🛡️",
      page: "pages/admin-users.html",
      roles: ["admin"],
      group: "Administration"
    },

    // ==========================================
    // HR & ACCOUNTS
    // ==========================================
   {
      label: "Payment",
      icon: "💵",
      page: "pages/payment.html",
      roles: ["admin", "accountant"],
      group: "Voucher"
   },
    {
      label: "Refer Payment",
      icon: "💵",
      page: "pages/refer_payment_by_case.html",
      roles: ["admin", "accountant"],
      group: "Voucher"
   },
    {
      label: "Voucher",
      icon: "📕",
      page: "pages/Voucher_register.html",
      roles: ["admin", "accountant"],
      group: "Voucher"
   },
    {
      label: "Employees",
      icon: "👥",
      page: "pages/employees.html",
      roles: ["admin", "accountant"],
      group: "Employees"
    },
    {
      label: "Salary Sheet",
      icon: "💰",
      page: "pages/salary_sheet.html",
      roles: ["admin", "accountant"],
      group: "Employees"
    },
   /* { 
      label: "Attendance", 
      icon: "🕐", 
      page: "pages/attendance.html", 
      roles: ["admin","viewer"],
      group: "Employees"
    },*/
    {
      label: "Credit Management",
      icon: "💳",
      page: "pages/add-credit.html",
      roles: ["admin", "accountant"],
      group: "Voucher"
    },

    // ==========================================
    // OPD
    // ==========================================
    {
      label: "OPD Sales Upload",
      icon: "📊",
      page: "pages/opd_sales_upload.html",
      roles: ["admin", "accountant"],
      group: "OPD"
    },
    {
      label: "OPD Refer Linker",
      icon: "🔗",
      page: "pages/opd_refer_linker.html",
      roles: ["admin", "accountant", "reception"],
      group: "OPD"
    },
    {
      label: "OPD Records",
      icon: "📋",
      page: "pages/opd_records.html",
      roles: ["admin", "manager", "accountant", "reception", "viewer"],
      group: "Reports"
    },
    {
      label: "Refer Amt Entry",
      icon: "💊",
      page: "pages/opd_refer_amount.html",
      roles: ["admin", "manager", "accountant"],
      group: "OPD"
    },
    { label: "Cash Receipts Import", 
     icon: "📥", 
     page: "pages/cash_receipts_import.html",
     roles: ["admin","accountant"] ,
     group: "OPD"
    }

    
    // ==========================================
    // LAB
    // ==========================================
    { label:"Lab Test Master",    
      icon:"🧪",
      page:"pages/lab_test_master.html",    
      roles:["admin"],
      group: "Lab"
    },
    { label:"Lab Work Entry",
      icon:"🔬", 
      page:"pages/lab_work_entry.html",      
      roles:["admin","lab"],
      group: "Lab"
    },
    { label:"Lab Agent Payments", 
      icon:"💳", 
      page:"pages/lab_agent_payments.html",  
      roles:["admin","accountant"],
      group: "Lab"
    },

    // ==========================================
    // MARKETING
    // ==========================================
    {
      label: "Gramin Doctor Visit",
      icon: "🏥",
      page: "pages/gramin-visit.html",
      roles: ["marketing",  "admin", "other", "reception"],
      group: "Marketing"
    },
    {
      label: "QUACK DOCTOR",
      icon: "👨‍⚕️",
      page: "pages/gramin-visit-manager.html",
      roles: ["admin", "accountant", "manager", "viewer"],
      group: "Marketing"
    },
    { label: "Call Refer", 
      icon: "📞", 
      page: "pages/call-refer.html", 
      roles: ["admin","manager","accountant","viewer", "reception"],
      group: "Marketing"
    },
    { label: "Refer Search", 
     icon: "🔎", 
     page: "pages/refer_search.html",
    roles: ["admin","accountant","manager", "viewer", "other"],
    group: "Marketing" },

    // ==========================================
    // IPD
    // ==========================================
    {
      label: "IPD - Admission",
      icon: "🏥",
      page: "pages/ipd-admission.html",
      roles: ["admin", "accountant", "reception"],
      group: "IPD"
    },
        {
      label: "IPD - Documents",
      icon: "📁",
      page: "pages/ipd-documents.html",
      roles: ["admin", "accountant", "reception", "manager"],
      group: "IPD"
    },
    {
      label: "IPD - Doctor Entry",
      icon: "👨‍⚕️",
      page: "pages/ipd-doctor-entry.html",
      roles: ["admin", "accountant"],
      group: "IPD"
    },
    {
      label: "IPD - OT Entry",
      icon: "🔬",
      page: "pages/ipd-ot-entry.html",
      roles: ["admin", "accountant", "ot"],
      group: "IPD"
    },
    {
      label: "IPD - Amount Entry",
      icon: "💰",
      page: "pages/ipd-amount-entry.html",
      roles: ["admin", "accountant", "manager"],
      group: "IPD"
    },
    {
      label: "IPD - Doctor Details",
      icon: "📋",
      page: "pages/ipd-doctor-details.html",
      roles: ["admin", "accountant", "manager", "viewer"],
      group: "IPD"
    },
    {
      label: "IPD - Cash & Discharge",
      icon: "💵",
      page: "pages/ipd-cash-discharge.html",
      roles: ["admin", "accountant", "reception"],
      group: "IPD"
    },
    {
      label: "IPD - Reports",
      icon: "📊",
      page: "pages/ipd-reports.html",
      roles: ["admin", "accountant", "manager", "viewer", "reception"],
      group: "Reports"
    },
    {
      label: "IPD - Medicine Sale",
      icon: "💊",
      page: "pages/ipd-medicine-sale.html",
      roles: ["admin", "accountant", "pharmacy"],
      group: "IPD"
    },
    {
      label: "IPD - Transactions",
      icon: "🔄",
      page: "pages/ipd-transactions.html",
      roles: ["admin", "accountant"],
      group: "IPD"
    },
    {
      label: "IPD - Data Editor",
      icon: "🛠",
      page: "pages/ipd-data-editor.html",
      roles: ["admin"],
      group: "IPD"
    },

    // ==========================================
    // PHARMACY
    // ==========================================
    {
      label: "Pharmacy Setup",
      icon: "⚙️",
      page: "pages/pharmacy-setup.html",
      roles: ["admin"],
      group: "Pharmacy"
    },
    {
      label: "Pharmacy Purchase",
      icon: "🛒",
      page: "pages/pharmacy-purchase-add.html",
      roles: ["admin", "accountant", "pharmacy"],
      group: "Pharmacy"
    },
    {
      label: "Pharmacy Sale",
      icon: "💊",
      page: "pages/pharmacy-sale-add.html",
      roles: ["admin", "accountant", "pharmacy"],
      group: "Pharmacy"
    },
    {
      label: "Pharmacy Supplier",
      icon: "💳",
      page: "pages/pharmacy-suppliers.html",
      roles: ["admin", "accountant", "pharmacy"],
      group: "Pharmacy"
    },
    {
      label: "Pharmacy Voucher",
      icon: "🧾",
      page: "pages/pharmacy-voucher.html",
      roles: ["admin", "accountant", "pharmacy"],
      group: "Pharmacy"
    },
    {
      label: "Pharmacy Reports",
      icon: "📊",
      page: "pages/pharmacy-reports.html",
      roles: ["admin", "accountant", "pharmacy", "viewer"],
      group: "Reports"
    },
    { label: "Daily Sheet", 
      icon: "📊", 
      page: "pages/pharmacy-daily-sheet.html",
      roles: ["admin","accountant"],
      group: "Reports" },
    {
      label: "Pharmacy Extra Pay",
      icon: "💰",
      page: "pages/pharmacy-extra-pay.html",
      roles: ["admin", "accountant", "pharmacy"],
      group: "Pharmacy"
    }

  ];

  // Order in which groups appear in the admin grouped sidebar.
  const GROUP_ORDER = ["Administration", "Voucher","Employees", "OPD", "Lab", "Marketing", "IPD", "Pharmacy", "Reports"];
  const GROUP_ICONS = {
    "Administration": "🛡️",
    "Voucher":"💵",
    "Employees": "👥",
    "OPD": "🏥",
    "Lab": "🧪",
    "Marketing": "📣",
    "IPD": "🛏️",
    "Pharmacy": "💊",
    "Reports": "📊"
  };

  function makeLink(item, container, onClick, isFirst) {
    const link = document.createElement("a");

    link.href = "#";
    link.className = `menu-item${isFirst ? " active" : ""}`;

    link.innerHTML = `
      <span class="mi-icon">${item.icon}</span>
      <span class="mi-label">${item.label}</span>
    `;

    link.addEventListener("click", (e) => {
      e.preventDefault();

      container
        .querySelectorAll(".menu-item")
        .forEach(el => el.classList.remove("active"));

      link.classList.add("active");

      if (typeof onClick === "function") {
        onClick(item);
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
    // Items without a group (Home, My Profile, etc.) stay pinned at the top, ungrouped.
    const pinned = visibleItems.filter(item => !item.group);
    const grouped = visibleItems.filter(item => item.group);

    let isFirst = true;

    pinned.forEach(item => {
      container.appendChild(makeLink(item, container, onClick, isFirst));
      isFirst = false;
    });

    // Bucket grouped items in GROUP_ORDER order; any unlisted group falls back to the end.
    const buckets = new Map();
    grouped.forEach(item => {
      if (!buckets.has(item.group)) buckets.set(item.group, []);
      buckets.get(item.group).push(item);
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

        container
          .querySelectorAll(".menu-group.open")
          .forEach(el => el.classList.remove("open"));

        if (willOpen) {
          section.classList.add("open");
        }
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

  function render(role, container, onClick) {

    if (!container) {
      console.error("Menu container not found");
      return;
    }

    container.innerHTML = "";

    const visibleItems = ITEMS.filter(item =>
      item.roles.includes("*") ||
      item.roles.includes(role)
    );

    if (role === "admin") {
      container.classList.add("menu-grouped");
      renderGrouped(visibleItems, container, onClick);
    } else {
      container.classList.remove("menu-grouped");
      renderFlat(visibleItems, container, onClick);
    }

    console.log(`Menu loaded: ${visibleItems.length} items (${role === "admin" ? "grouped" : "flat"})`);
  }

  window.BNH_MENU = {
    items: ITEMS,
    render
  };

  console.log("BNH_MENU loaded successfully");

})();
