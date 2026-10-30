# How to Add & Configure Pages (Supabase Dynamic Menu + Granular User Permissions)

This guide is written for both **you** and any **AI assistant** generating new module pages for the **Bhagirathy Nursing Home** portal.

The portal now uses a **100% dynamic Supabase-driven menu and user-wise permission engine**:
1. **`public.app_pages`**: Stores every page's label, icon, file location (`page_path`), sidebar group (`group_name`), and sort order.
2. **`public.user_page_permissions`**: Stores per-user granular access flags (`can_view`, `can_entry`, `can_edit`, `can_delete`) for each page.

You **no longer need to edit `assets/menu.js`** when adding a new page!

---

## 🚀 Workflow: How to Add a New Page in the Future

1. **Upload the HTML file to GitHub**:
   Create your new module file inside `/pages/<your-page>.html` and push/upload it to your GitHub repository.
2. **Register the Page in the Portal**:
   Log in as `admin`, open **Administration → 🔐 Page & Access Control**, switch to the **Manage App Pages** tab, and enter:
   - **Menu Label**: e.g., `OPD Billing`
   - **Icon**: e.g., `💵`
   - **GitHub Page Path**: e.g., `pages/opd-billing.html`
   - **Sidebar Group**: e.g., `OPD`, `IPD`, `Pharmacy`, `Voucher`, `Reports` (or leave blank to pin at the top)
3. **Assign User-Wise Permissions**:
   Switch to the **👤 User-Wise Access Matrix** tab, select the user from the dropdown, check **View**, **Entry**, **Edit**, and/or **Delete** for that page, and click **Save User Permissions**.
4. **Done!** The page immediately appears in that user's sidebar menu on their next load.

---

## 1. Standard Page Template (with View / Entry / Edit / Delete Enforcement)

Every module page inside `/pages/` MUST follow this template. It automatically checks the user's Supabase permissions and hides/disables Entry, Edit, or Delete buttons when the user does not have that specific permission.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>My New Page</title>
  <link rel="stylesheet" href="../assets/style.css"/>
</head>
<body>
<div id="spinner" class="spinner-overlay hidden"><div class="spinner"></div></div>

<div class="page">
  <h1>📝 My New Page</h1>

  <!-- ENTRY SECTION: Automatically hidden if user lacks "Entry" permission -->
  <div class="page-card" data-perm="entry">
    <h3 style="margin-top:0">New Entry</h3>
    <form id="myForm">
      <input type="hidden" id="editingId" />

      <!-- Auto-filled, read-only -->
      <label>Recorded By</label>
      <input id="recBy" readonly />

      <!-- Your real fields -->
      <label>Patient Name</label>
      <input id="patientName" required />

      <label>Amount</label>
      <input id="amount" type="number" step="0.01" required />

      <div style="margin-top:1rem" class="actions-row">
        <button type="submit" class="btn-primary" style="width:auto" id="btnSubmit">Save Record</button>
      </div>
      <p class="err" id="err"></p>
      <p class="info hidden" id="ok"></p>
    </form>
  </div>

  <!-- VIEW SECTION: Visible to anyone with "View" permission -->
  <div class="page-card">
    <h3 style="margin-top:0">Records List</h3>
    <table>
      <thead>
        <tr>
          <th>Patient Name</th>
          <th>Amount</th>
          <th>Recorded By</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody id="recordsBody"></tbody>
    </table>
  </div>
</div>

<!-- REQUIRED scripts, in this exact order -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="../assets/config.js"></script>
<script src="../assets/menu.js"></script>
<script src="../assets/page.js"></script>

<script>
  // 1. Enforce granular permissions for this page path.
  //    - Blocks access if user does not have `can_view`.
  //    - Automatically hides any HTML element with `data-perm="entry|edit|delete"`
  //      if the user lacks that permission.
  //    - Returns: { view: true, entry: bool, edit: bool, delete: bool, mode: "full"|"limited"|"view" }
  const perms = BNH_PAGE.requirePermissions("pages/my-new-page.html");

  // 2. Auto-fill "Recorded By"
  const recByInput = document.getElementById("recBy");
  if (recByInput && BNH_PAGE.user) {
    recByInput.value = `${BNH_PAGE.user.name} (${BNH_PAGE.user.username})`;
  }

  // 3. Load table rows and conditionally render Edit / Delete buttons
  async function loadRecords() {
    const { data, error } = await BNH_PAGE.sb
      .from("billings")
      .select("*")
      .order("recorded_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    const tbody = document.getElementById("recordsBody");
    tbody.innerHTML = "";

    (data || []).forEach(row => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${row.patient_name}</td>
        <td>${row.amount}</td>
        <td>${row.recorded_by_name || row.recorded_by || "-"}</td>
        <td class="actions-row">
          ${perms.edit ? `<button class="btn-ghost" onclick="editRow('${row.id}')">✏️ Edit</button>` : ""}
          ${perms.delete ? `<button class="btn-danger" onclick="deleteRow('${row.id}')">🗑️ Delete</button>` : ""}
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  // 4. Guard Entry / Edit form submission
  document.getElementById("myForm").onsubmit = async (e) => {
    e.preventDefault();
    const editingId = document.getElementById("editingId").value;

    // Permission check in JS before writing to Supabase
    if (editingId && !perms.edit) {
      alert("You do not have Edit permission on this page.");
      return;
    }
    if (!editingId && !perms.entry) {
      alert("You do not have Entry permission on this page.");
      return;
    }

    const spinner = document.getElementById("spinner");
    spinner.classList.remove("hidden");
    try {
      const payload = BNH_PAGE.stamp({
        patient_name: document.getElementById("patientName").value.trim(),
        amount: parseFloat(document.getElementById("amount").value)
      });

      let res;
      if (editingId) {
        res = await BNH_PAGE.sb.from("billings").update(payload).eq("id", editingId);
      } else {
        res = await BNH_PAGE.sb.from("billings").insert(payload);
      }
      if (res.error) throw res.error;

      e.target.reset();
      document.getElementById("editingId").value = "";
      recByInput.value = `${BNH_PAGE.user.name} (${BNH_PAGE.user.username})`;
      await loadRecords();
    } catch (err) {
      document.getElementById("err").textContent = err.message;
    } finally {
      spinner.classList.add("hidden");
    }
  };

  // 5. Guard Delete handler
  window.deleteRow = async (id) => {
    if (!perms.delete) {
      alert("You do not have Delete permission on this page.");
      return;
    }
    if (!confirm("Delete this record permanently?")) return;
    const { error } = await BNH_PAGE.sb.from("billings").delete().eq("id", id);
    if (error) alert(error.message);
    else loadRecords();
  };

  loadRecords();
</script>
</body>
</html>
```

---

## 2. Do I Need to Change My Existing Menu Pages?

### Backwards Compatibility (Zero Breaking Changes!)
Your existing pages that call:
```js
const accessMode = BNH_PAGE.requirePageAccess("pages/payment.html");
```
or:
```js
BNH_PAGE.requireRole(["admin", "accountant"]);
```
**will continue to work without breaking!**
`BNH_PAGE.requirePageAccess(page)` automatically translates the user's Supabase checkboxes into your existing `accessMode` string:
- **`"full"`**: When the user has `Delete` checked, OR both `Entry` + `Edit` checked.
- **`"limited"`**: When the user has either `Entry` OR `Edit` checked (but not Delete).
- **`"view"`**: When the user only has `View` checked.
- **`"denied"`**: When `View` is unchecked (blocks the page and hides it from the sidebar).

### Upgrading Existing Pages to Separate View / Entry / Edit / Delete Controls
Whenever you want an existing page to strictly separate **Entry**, **Edit**, and **Delete** buttons, make these 3 quick updates to that page:

1. **Add `data-perm` attributes in HTML** to any container or button that performs an action:
   - Add `data-perm="entry"` on your "Add New / Entry Form" card or "New" button.
   - Add `data-perm="edit"` on static "Edit / Update" buttons.
   - Add `data-perm="delete"` on static "Delete" buttons.
   *( `page.js` automatically hides and disables matching `[data-perm]` elements on page load! )*

2. **Switch `requirePageAccess` to `requirePermissions`** in your page `<script>`:
   ```js
   const perms = BNH_PAGE.requirePermissions("pages/your-page.html");
   // perms.view   -> boolean
   // perms.entry  -> boolean
   // perms.edit   -> boolean
   // perms.delete -> boolean
   // perms.mode   -> "full" | "limited" | "view"
   ```

3. **Guard Dynamic Table Buttons & Functions**:
   - In dynamic table rows:
     ```js
     ${perms.edit ? `<button onclick="editItem('${row.id}')">Edit</button>` : ''}
     ${perms.delete ? `<button onclick="deleteItem('${row.id}')">Delete</button>` : ''}
     ```
   - Inside JS functions:
     ```js
     if (!BNH_PAGE.can('delete')) return alert('Delete permission required');
     ```

---

## 3. Reference: `BNH_PAGE` Helpers Available on Every Page

| Helper | Description |
|---|---|
| `BNH_PAGE.user` | `{ id, username, name, mobile, role, loginAt }` from `localStorage`. |
| `BNH_PAGE.requirePermissions(pagePath)` | Enforces `can_view` from Supabase, auto-hides `[data-perm="entry\|edit\|delete"]` elements, and returns `{ view, entry, edit, delete, mode }`. |
| `BNH_PAGE.requirePageAccess(pagePath)` | Legacy-compatible wrapper. Enforces `can_view`, applies `[data-perm]`, sets `BNH_PAGE.permissions`, and returns `"full"`, `"limited"`, or `"view"`. |
| `BNH_PAGE.can(action)` | Returns `true` or `false` for `'view'`, `'entry'`, `'edit'`, or `'delete'`. |
| `BNH_PAGE.applyPermissionUI(perms)` | Re-applies `data-perm` hiding (useful if you dynamically render a modal later). |
| `BNH_PAGE.stamp(obj)` | Appends `{ recorded_by, recorded_by_name, recorded_at }` to any Supabase payload. |
| `BNH_PAGE.sb` | Initialized Supabase client. |

---

## 4. Prompt to Give an AI When Creating Future Pages

> "Read `HOW_TO_ADD_PAGES.md`. Using the standard page template, generate a new file `pages/<name>.html` for `<purpose>` with fields: `<list>`. Use `const perms = BNH_PAGE.requirePermissions("pages/<name>.html")` to enforce View, Entry (`data-perm="entry"`), Edit (`perms.edit`), and Delete (`perms.delete`) permissions. Auto-fill the Recorded By field from `BNH_PAGE.user` and submit using `BNH_PAGE.stamp()`. Also output the Supabase `CREATE TABLE` SQL for the page's data table."
