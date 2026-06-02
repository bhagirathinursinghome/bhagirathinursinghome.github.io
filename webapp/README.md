# Bhagirathy Nursing Home — Staff Portal

A static, modular, multi-user web app for **Bhagirathy Nursing Home**.
Built with plain HTML + CSS + JavaScript and Supabase as the database.
Hostable on **GitHub Pages** (or any static host).

## Features

- Username + password login (**no email auth**)
- Self-registration with admin approval workflow
- Role-based menu — roles: `admin, accountant, reception, ot, pharmacy, lab, manager, viewer, other`
- Each menu item is an **isolated HTML page** loaded in an `<iframe>` — fully modular
- Primary admin baked in: **User: `admin`  Password: `Admin@1998`**
- Users can change their own password
- Admin can approve, change role, deactivate, reactivate, and reset passwords
- Logged-in user kept in `localStorage` and auto-stamped on data entries
- Responsive design with hamburger menu on mobile
- Loading spinner and professional UI

## Quick start

### 1. Create the Supabase table

Open the **SQL Editor** in your Supabase dashboard and run the contents of
[`SUPABASE_SETUP.sql`](./SUPABASE_SETUP.sql).

### 2. Configure (already done)

`assets/config.js` is pre-filled with your Supabase project:

```js
SUPABASE_URL: "https://sfnaiezkemdjjcbxfuzw.supabase.co"
SUPABASE_KEY: "sb_publishable_tzf_Bhqi-QFGdVtYfKo9dw_QqwXD5hv"
```

### 3. Deploy to GitHub Pages

1. Create a GitHub repo, e.g. `bhagirathy-portal`.
2. Push all these files to the `main` branch.
3. Go to **Settings → Pages → Source: main / root** → Save.
4. Open the URL GitHub gives you. Done.

### 4. First login

- Visit the site, login as **admin / Admin@1998**.
- Go to **User Management** to approve new staff and assign roles.

## File layout

```
/
├── index.html               # Login + Register
├── app.html                 # Main frame (header, sidebar, iframe)
├── SUPABASE_SETUP.sql       # Run once in Supabase
├── HOW_TO_ADD_PAGES.md      # Recipe for adding new modules (use with AI)
├── assets/
│   ├── config.js            # Supabase URL + key
│   ├── auth.js              # Login, register, password, admin user APIs
│   ├── menu.js              # Single source of truth for sidebar items
│   ├── page.js              # Helpers available inside iframed pages
│   └── style.css            # All app styles
└── pages/                   # One file per menu item — fully isolated
    ├── home.html
    ├── profile.html
    ├── admin-users.html     # Admin: approve / role / deactivate / reset
    ├── admin-settings.html
    ├── accounts.html
    ├── reception.html
    ├── ot.html
    ├── pharmacy.html
    ├── lab.html
    ├── reports.html
    └── sample-entry.html    # Example form auto-stamped with user
```

## Adding a new module

See [`HOW_TO_ADD_PAGES.md`](./HOW_TO_ADD_PAGES.md). Two steps:

1. Create `pages/<name>.html` using the template.
2. Add one line to `assets/menu.js`.

That file also contains an **AI prompt** you can paste into ChatGPT/Claude to
generate new modules automatically — they will pick up the current logged-in
user and stamp it on every record.

## Security notes

- This app uses the Supabase **publishable (anon) key**. The `app_users`
  table has Row Level Security disabled so the static site can authenticate
  custom logins. Passwords are stored as `SHA-256(salt + password)`.
- For higher-security deployments, move authentication into Supabase Edge
  Functions, enable RLS, and have the function issue signed JWTs.

## License

Private — Bhagirathy Nursing Home.
