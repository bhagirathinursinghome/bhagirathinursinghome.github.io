/* menu.js - dynamic menu per role.
   To add a new menu item:
     1. Create a new HTML file in /pages/
     2. Add an entry below under the roles that should see it.
   Each item: { label, icon, page, roles: ['role1','role2'] }  (use ['*'] for everyone)
*/
(function () {
  const ITEMS = [
    { label: "Home",            icon: "🏠", page: "pages/home.html",      roles: ["*"] },
    { label: "My Profile",      icon: "👤", page: "pages/profile.html",   roles: ["*"] },
    { label: "User Management", icon: "🛡️", page: "pages/admin-users.html", roles: ["admin"] },
    { label: "Pharmacy Setup",     icon: "⚙️", page: "pages/pharmacy-setup.html",          roles: ["admin"] },
    { label: "Admin Editor",       icon: "🔧", page: "pages/pharmacy-admin-editor.html",   roles: ["admin"] },

//------------------opd-------------------------------------------
     // OPD Sales Data Upload & Normalization
{ label: "OPD Sales Upload", icon: "📊", page: "pages/opd_sales_upload.html",
  roles: ["manager", "admin", "accountant"] }

// OPD Refer Linker (Link to IPD & Add Refer Info)
{ label: "OPD Refer Linker", icon: "🔗", page: "pages/opd_refer_linker.html",
  roles: ["manager", "admin", "accountant"] }

// OPD Records View (View All Records)
{ label: "OPD Records", icon: "📋", page: "pages/opd_records_view.html",
  roles: ["manager", "admin", "accountant", "viewer"] }

     //---------------MARKETING------------------------------------
     { label: "Gramin Doctor Visit", icon: "🏥", page: "pages/gramin-visit.html",  roles: ["marketing", "manager", "admin", "other"] },
     { label: "QUACK DOCTOR",       icon: "👨‍⚕️", page: "pages/gramin-visit-manager.html",   roles: ["admin","accountant","manager"] },


//----=====ipd----===========---==---==-=---===
      { label: "IPD – Refer Add",       icon: "🤝", page: "pages/ipd-refer-add.html",
    roles: ["admin","accountant","reception","manager"] },

  { label: "IPD – Admission",       icon: "🏥", page: "pages/ipd-admission.html",
    roles: ["admin","accountant","reception","manager"] },

  { label: "IPD – Doctor Entry",    icon: "👨‍⚕️", page: "pages/ipd-doctor-entry.html",
    roles: ["admin","accountant","manager"] },

  { label: "IPD – OT Entry",        icon: "🔬", page: "pages/ipd-ot-entry.html",
    roles: ["admin","accountant","ot","manager"] },

  { label: "IPD – Amount Entry",    icon: "💰", page: "pages/ipd-amount-entry.html",
    roles: ["admin","accountant","manager"] },

  { label: "IPD – Doctor Details",  icon: "📋", page: "pages/ipd-doctor-details.html",
    roles: ["admin","accountant","manager","viewer"] },

  { label: "IPD – Cash & Discharge",icon: "💵", page: "pages/ipd-cash-discharge.html",
    roles: ["admin","accountant","manager"] },

  { label: "IPD – Reports",         icon: "📊", page: "pages/ipd-reports.html",
    roles: ["admin","accountant","manager","viewer"] },

  { label: "IPD – Medicine Sale",   icon: "💊", page: "pages/ipd-medicine-sale.html",
    roles: ["admin","accountant","pharmacy","manager"] },

  { label: "IPD – Transactions",    icon: "🔄", page: "pages/ipd-transactions.html",
    roles: ["admin","accountant","pharmacy","manager"] },
     
{ label: "IPD – Data Editor", icon: "🛠", page: "pages/ipd-data-editor.html",
  roles: ["admin","manager"] },

     

 // ============================================================
//  PHARMACY MODULE – menu.js entries
//  Add these lines to the ITEMS array in assets/menu.js
//  Place them in the order you want them in the sidebar
// ============================================================

{ label: "Pharmacy Purchase",  icon: "🛒", page: "pages/pharmacy-purchase-add.html",  roles: ["admin","accountant","pharmacy"] },
{ label: "Pharmacy Sale",      icon: "💊", page: "pages/pharmacy-sale-add.html",       roles: ["admin","accountant","pharmacy"] },
{ label: "Add Supplier",       icon: "🏭", page: "pages/pharmacy-add-supplier.html",   roles: ["admin","accountant","pharmacy"] },
{ label: "Supplier Payment",   icon: "💳", page: "pages/pharmacy-payment.html",        roles: ["admin","accountant","pharmacy"] },
{ label: "Voucher",            icon: "🧾", page: "pages/pharmacy-voucher.html",        roles: ["admin","accountant","pharmacy"] },
{ label: "Pharmacy Reports",   icon: "📊", page: "pages/pharmacy-reports.html",        roles: ["admin","accountant","pharmacy","manager","viewer"] },
{ label: "Extra Pay",          icon: "💰", page: "pages/pharmacy-extra-pay.html",      roles: ["admin","accountant","pharmacy"] },
{ label: "Manage Suppliers",   icon: "🗂️", page: "pages/pharmacy-manage-suppliers.html", roles: ["admin","accountant"] }

  ];

  function render(role, container, onClick) {
    container.innerHTML = "";
    const visible = ITEMS.filter(it => it.roles.includes("*") || it.roles.includes(role));
    visible.forEach((it, i) => {
      const a = document.createElement("a");
      a.href = "#";
      a.className = "menu-item" + (i === 0 ? " active" : "");
      a.innerHTML = `<span class="mi-icon">${it.icon}</span><span class="mi-label">${it.label}</span>`;
      a.onclick = (e) => {
        e.preventDefault();
        container.querySelectorAll(".menu-item").forEach(el => el.classList.remove("active"));
        a.classList.add("active");
        onClick(it);
      };
      container.appendChild(a);
    });
  }

  window.BNH_MENU = { items: ITEMS, render };
})();
