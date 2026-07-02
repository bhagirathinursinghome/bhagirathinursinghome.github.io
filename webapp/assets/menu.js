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
      roles: ["admin"]
    },
    {
      label: "User Management",
      icon: "🛡️",
      page: "pages/admin-users.html",
      roles: ["admin"]
    },

    // ==========================================
    // HR & ACCOUNTS
    // ==========================================
   {
      label: "Payment",
      icon: "💵",
      page: "pages/payment.html",
      roles: ["admin", "accountant"]
   },
 /*   {
      label: "Pay Salary",
      icon: "💵",
      page: "pages/pay_salary.html",
      roles: ["admin", "accountant"]
    },*/
    {
      label: "Employees",
      icon: "👥",
      page: "pages/employees.html",
      roles: ["admin", "accountant"]
    },
    {
      label: "Salary Sheet",
      icon: "💰",
      page: "pages/salary_sheet.html",
      roles: ["admin", "accountant"]
    },
    { 
      label: "Attendance", 
      icon: "🕐", 
      page: "pages/attendance.html", 
      roles: ["admin","manager","viewer"] 
    },
    {
      label: "Credit Management",
      icon: "💳",
      page: "pages/add-credit.html",
      roles: ["admin", "accountant"]
    },

    // ==========================================
    // OPD
    // ==========================================
    {
      label: "OPD Sales Upload",
      icon: "📊",
      page: "pages/opd_sales_upload.html",
      roles: ["admin", "accountant"]
    },
    {
      label: "OPD Refer Linker",
      icon: "🔗",
      page: "pages/opd_refer_linker.html",
      roles: ["admin", "manager", "accountant", "reception"]
    },
    {
      label: "OPD Records",
      icon: "📋",
      page: "pages/opd_records.html",
      roles: ["admin", "manager", "accountant", "reception", "viewer"]
    },
    {
      label: "Refer Amt Entry",
      icon: "💊",
      page: "pages/opd_refer_amount.html",
      roles: ["admin", "manager", "accountant"]
    },
    {
      label: "Refer Paid",
      icon: "✅",
      page: "pages/opd_refer_paid.html",
      roles: ["admin", "accountant"]
    },
    // ==========================================
    // LAB
    // ==========================================
    { label:"Lab Test Master",    
      icon:"🧪",
      page:"pages/lab_test_master.html",    
      roles:["admin","manager"] 
    },
    { label:"Lab Work Entry",
      icon:"🔬", 
      page:"pages/lab_work_entry.html",      
      roles:["admin","manager","lab"] 
    },
    { label:"Lab Agent Payments", 
      icon:"💳", 
      page:"pages/lab_agent_payments.html",  
      roles:["admin","manager","accountant"] 
    },

    // ==========================================
    // MARKETING
    // ==========================================
    {
      label: "Gramin Doctor Visit",
      icon: "🏥",
      page: "pages/gramin-visit.html",
      roles: ["marketing", "manager", "admin", "other", "reception"]
    },
    {
      label: "QUACK DOCTOR",
      icon: "👨‍⚕️",
      page: "pages/gramin-visit-manager.html",
      roles: ["admin", "accountant", "manager", "viewer"]
    },
    { label: "Call Refer", 
      icon: "📞", 
      page: "pages/call-refer.html", 
      roles: ["admin","manager","accountant","viewer", "reception"] 
    },

    // ==========================================
    // IPD
    // ==========================================
    {
      label: "IPD - Admission",
      icon: "🏥",
      page: "pages/ipd-admission.html",
      roles: ["admin", "accountant", "reception", "manager"]
    },
        {
      label: "IPD - Documents",
      icon: "📁",
      page: "pages/ipd-documents.html",
      roles: ["admin", "accountant", "reception", "manager"]
    },
    {
      label: "IPD - Doctor Entry",
      icon: "👨‍⚕️",
      page: "pages/ipd-doctor-entry.html",
      roles: ["admin", "accountant", "manager"]
    },
    {
      label: "IPD - OT Entry",
      icon: "🔬",
      page: "pages/ipd-ot-entry.html",
      roles: ["admin", "accountant", "ot", "manager"]
    },
    {
      label: "IPD - Amount Entry",
      icon: "💰",
      page: "pages/ipd-amount-entry.html",
      roles: ["admin", "accountant", "manager"]
    },
    {
      label: "IPD - Doctor Details",
      icon: "📋",
      page: "pages/ipd-doctor-details.html",
      roles: ["admin", "accountant", "manager", "viewer"]
    },
    {
      label: "IPD - Cash & Discharge",
      icon: "💵",
      page: "pages/ipd-cash-discharge.html",
      roles: ["admin", "accountant", "manager", "reception"]
    },
        {
      label: "IPD - Refer Payment",
      icon: "💵",
      page: "pages/ipd-refer-payment.html",
      roles: ["admin", "accountant", "manager"]
    },
    {
      label: "IPD - Reports",
      icon: "📊",
      page: "pages/ipd-reports.html",
      roles: ["admin", "accountant", "manager", "viewer", "reception"]
    },
    {
      label: "IPD - Medicine Sale",
      icon: "💊",
      page: "pages/ipd-medicine-sale.html",
      roles: ["admin", "accountant", "pharmacy"]
    },
    {
      label: "IPD - Transactions",
      icon: "🔄",
      page: "pages/ipd-transactions.html",
      roles: ["admin", "accountant"]
    },
    {
      label: "IPD - Data Editor",
      icon: "🛠",
      page: "pages/ipd-data-editor.html",
      roles: ["admin"]
    },

    // ==========================================
    // PHARMACY
    // ==========================================
    {
      label: "Pharmacy Setup",
      icon: "⚙️",
      page: "pages/pharmacy-setup.html",
      roles: ["admin"]
    },
    {
      label: "Pharmacy Purchase",
      icon: "🛒",
      page: "pages/pharmacy-purchase-add.html",
      roles: ["admin", "accountant", "pharmacy"]
    },
    {
      label: "Pharmacy Sale",
      icon: "💊",
      page: "pages/pharmacy-sale-add.html",
      roles: ["admin", "accountant", "pharmacy"]
    },
    {
      label: "Pharmacy Supplier",
      icon: "💳",
      page: "pages/pharmacy-suppliers.html",
      roles: ["admin", "accountant", "pharmacy"]
    },
    {
      label: "Pharmacy Voucher",
      icon: "🧾",
      page: "pages/pharmacy-voucher.html",
      roles: ["admin", "accountant", "pharmacy"]
    },
    {
      label: "Pharmacy Reports",
      icon: "📊",
      page: "pages/pharmacy-reports.html",
      roles: ["admin", "accountant", "pharmacy", "manager", "viewer"]
    },
    {
      label: "Pharmacy Day Reports",
      icon: "📊",
      page: "pages/report_pharmacy.html",
      roles: ["admin", "accountant", "pharmacy", "manager", "viewer"]
    },
    {
      label: "Pharmacy Extra Pay",
      icon: "💰",
      page: "pages/pharmacy-extra-pay.html",
      roles: ["admin", "accountant", "pharmacy"]
    }

  ];

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

    visibleItems.forEach((item, index) => {

      const link = document.createElement("a");

      link.href = "#";
      link.className = `menu-item${index === 0 ? " active" : ""}`;

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

      container.appendChild(link);
    });

    console.log(`Menu loaded: ${visibleItems.length} items`);
  }

  window.BNH_MENU = {
    items: ITEMS,
    render
  };

  console.log("BNH_MENU loaded successfully");

})();
