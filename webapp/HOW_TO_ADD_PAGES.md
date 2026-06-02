# How to add a new page / data-entry form

This document is written for both **you** and any **AI assistant** that will
generate new module pages for the Bhagirathy Nursing Home portal.

The portal is intentionally modular: every menu item loads an isolated HTML
file inside an `<iframe>`. To add a new page you only need to:

1. Create one HTML file in `/pages/`.
2. Add one line in `/assets/menu.js`.

That's it. No build step, no framework — pure static HTML, hosted on GitHub Pages.

---

## 1. The page template

Every page MUST follow this skeleton so the current user is available, the
look matches the rest of the app, and form submissions are auto-stamped with
the user's identity.

```html
<!DOCTYPE html>
<html>
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

  <div class="page-card">
    <form id="myForm">
      <!-- Auto-filled, read-only -->
      <label>Recorded By</label>
      <input id="recBy" readonly />

      <!-- Your real fields -->
      <label>Patient Name</label>
      <input id="patientName" required />

      <label>Amount</label>
      <input id="amount" type="number" required />

      <div style="margin-top:1rem">
        <button class="btn-primary" style="width:auto">Save</button>
      </div>
      <p class="err" id="err"></p>
      <p class="info" id="ok" style="display:none"></p>
    </form>
  </div>
</div>

<!-- REQUIRED scripts, in this order -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="../assets/config.js"></script>
<script src="../assets/page.js"></script>

<script>
  // 1. Role guard — pass the roles allowed to see this page, or ["*"] for all
  BNH_PAGE.requireRole(["admin","accountant"]);

  // 2. Auto-fill "Recorded By"
  document.getElementById('recBy').value =
    BNH_PAGE.user.name + ' (' + BNH_PAGE.user.username + ')';

  // 3. Submit handler
  document.getElementById('myForm').onsubmit = async (e) => {
    e.preventDefault();
    const spinner = document.getElementById('spinner');
    spinner.classList.remove('hidden');
    try {
      // BNH_PAGE.stamp() automatically appends:
      //   recorded_by      = username
      //   recorded_by_name = full name
      //   recorded_at      = ISO timestamp
      const payload = BNH_PAGE.stamp({
        patient_name: patientName.value,
        amount: parseFloat(amount.value)
      });

      // Insert into your Supabase table
      const { error } = await BNH_PAGE.sb.from('billings').insert(payload);
      if (error) throw error;

      document.getElementById('ok').style.display = 'block';
      document.getElementById('ok').textContent = 'Saved successfully.';
      e.target.reset();
      document.getElementById('recBy').value =
        BNH_PAGE.user.name + ' (' + BNH_PAGE.user.username + ')';
    } catch (err) {
      document.getElementById('err').textContent = err.message;
    } finally {
      spinner.classList.add('hidden');
    }
  };
</script>
</body>
</html>
```

---

## 2. Helpers available on every page

After including `assets/page.js`, the global `BNH_PAGE` object exposes:

| Property                      | Description                                                       |
|-------------------------------|-------------------------------------------------------------------|
| `BNH_PAGE.user`               | `{ id, username, name, mobile, role, loginAt }` from localStorage |
| `BNH_PAGE.requireRole(arr)`   | Blocks render unless user.role is in arr (use `["*"]` for any)    |
| `BNH_PAGE.stamp(obj)`         | Returns `{...obj, recorded_by, recorded_by_name, recorded_at}`    |
| `BNH_PAGE.sb`                 | Shared Supabase client (config + supabase-js must be loaded)      |

Roles available: `admin`, `accountant`, `reception`, `ot`, `pharmacy`, `lab`,
`manager`, `viewer`, `other`.

---

## 3. Register the page in the menu

Open `assets/menu.js` and add one entry to the `ITEMS` array:

```js
{ label: "Billing",   icon: "💵", page: "pages/billing.html",
  roles: ["admin","accountant"] }
```

- `roles: ["*"]` → visible to every logged-in user
- `roles: ["admin","manager"]` → only those roles see it

Reload the app. The new item appears in the sidebar for the right roles only.

---

## 4. Create a matching Supabase table (optional but recommended)

Run this in the Supabase SQL editor — adjust columns as needed:

```sql
create table if not exists public.billings (
  id uuid primary key default gen_random_uuid(),
  patient_name text,
  amount numeric,
  recorded_by text,
  recorded_by_name text,
  recorded_at timestamptz default now()
);
grant select, insert, update on public.billings to anon, authenticated;
alter table public.billings disable row level security;
```

---

## 5. Prompt to give an AI

> "Read `HOW_TO_ADD_PAGES.md` in this repo. Using the page template, generate a
> new file `pages/<name>.html` for a `<purpose>` form with fields: <list>.
> Restrict it to roles `<roles>`. Also output the one-line `menu.js` entry to
> add, and the matching Supabase `create table` SQL. The form must auto-fill
> the Recorded By field from `BNH_PAGE.user` and submit via `BNH_PAGE.stamp()`."

That single prompt is enough — the AI will produce a working module page.
