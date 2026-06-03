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
    { label: "Settings",        icon: "⚙️", page: "pages/admin-settings.html", roles: ["admin"] },

    { label: "Accounts",        icon: "💰", page: "pages/accounts.html",   roles: ["admin","accountant","manager"] },
    { label: "Reception Desk",  icon: "📋", page: "pages/reception.html",  roles: ["admin","reception","manager"] },
    { label: "OT Schedule",     icon: "🏥", page: "pages/ot.html",         roles: ["admin","ot","manager"] },
    { label: "Pharmacy",        icon: "💊", page: "pages/pharmacy.html",   roles: ["admin","pharmacy","manager"] },
    { label: "Lab",             icon: "🔬", page: "pages/lab.html",        roles: ["admin","lab","manager"] },
    { label: "Reports",         icon: "📊", page: "pages/reports.html",    roles: ["admin","manager","viewer"] },

    { label: "Sample Data Entry", icon: "📝", page: "pages/sample-entry.html", roles: ["*"] },
     // ============================================================
//  PHARMACY MODULE – menu.js entries
//  Add these lines to the ITEMS array in assets/menu.js
//  Place them in the order you want them in the sidebar
// ============================================================

{ label: "Pharmacy Purchase",  icon: "🛒", page: "pages/pharmacy/pharmacy-purchase-add.html",  roles: ["admin","accountant","pharmacy","manager"] },
{ label: "Pharmacy Sale",      icon: "💊", page: "pages/pharmacy/pharmacy-sale-add.html",       roles: ["admin","accountant","pharmacy","manager"] },
{ label: "Add Supplier",       icon: "🏭", page: "pages/pharmacy/pharmacy-add-supplier.html",   roles: ["admin","accountant","pharmacy","manager"] },
{ label: "Supplier Payment",   icon: "💳", page: "pages/pharmacy/pharmacy-payment.html",        roles: ["admin","accountant","pharmacy","manager"] },
{ label: "Voucher",            icon: "🧾", page: "pages/pharmacy/pharmacy-voucher.html",        roles: ["admin","accountant","pharmacy","manager"] },
{ label: "Pharmacy Reports",   icon: "📊", page: "pages/pharmacy/pharmacy-reports.html",        roles: ["admin","accountant","pharmacy","manager","viewer"] },
{ label: "Pharmacy Setup",     icon: "⚙️", page: "pages/pharmacy/pharmacy-setup.html",          roles: ["admin","manager"] },
{ label: "Extra Pay",          icon: "💰", page: "pages/pharmacy/pharmacy-extra-pay.html",      roles: ["admin","accountant","pharmacy","manager"] }

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
