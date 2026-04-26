# 📁 DocVault — Document Management System

A full-featured document management web app using **GitHub Pages** (free hosting) and **Supabase** (free database + storage).

---

## 🗂 File Structure

```
/
├── index.html          ← Login page
├── dashboard.html      ← Main app (all pages inside)
├── style.css           ← All styles
├── app.js              ← Core logic (Supabase client, auth, helpers)
├── dashboard.js        ← Page-specific logic
├── config.js           ← ⚙️ YOUR CREDENTIALS GO HERE
└── supabase_schema.sql ← Run this in Supabase SQL Editor
```

---

## 🚀 Setup Steps

### Step 1 — Create Supabase Project
1. Go to [https://supabase.com](https://supabase.com) → New Project
2. Choose a name, database password, and region
3. Wait for the project to provision (~1 min)

### Step 2 — Run the SQL Schema
1. In your Supabase project → **SQL Editor**
2. Paste the entire content of `supabase_schema.sql`
3. Click **Run** — this creates all tables and inserts default data

### Step 3 — Create Storage Bucket
1. In Supabase → **Storage** → **New Bucket**
2. Name it exactly: `documents`
3. Set it to **Private**
4. In Bucket settings → Add a policy allowing authenticated reads (or use signed URLs — already handled in code)

**Quick storage policy (SQL Editor):**
```sql
-- Allow all operations from anon key (app handles its own auth)
CREATE POLICY "Allow all on documents bucket"
ON storage.objects FOR ALL
TO anon
USING (bucket_id = 'documents')
WITH CHECK (bucket_id = 'documents');
```

### Step 4 — Update config.js
1. Go to Supabase → **Project Settings** → **API**
2. Copy your **Project URL** and **anon/public key**
3. Paste into `config.js`:

```js
const CONFIG = {
  SUPABASE_URL: 'https://xxxx.supabase.co',
  SUPABASE_ANON_KEY: 'eyJ...',
  ...
};
```

### Step 5 — Set Up Email Notifications (Optional)
1. Go to [https://www.emailjs.com](https://www.emailjs.com) → Free account
2. Create an **Email Service** (Gmail, Outlook, etc.)
3. Create an **Email Template** with these variables:
   - `{{to_email}}` — recipient address
   - `{{subject}}` — email subject
   - `{{message}}` — email body text
4. Copy your **Service ID**, **Template ID**, and **Public Key** into `config.js`

### Step 6 — Deploy to GitHub Pages
1. Create a new GitHub repository
2. Push all files to the `main` branch
3. Go to repo **Settings** → **Pages**
4. Set Source: `main` branch, root folder `/`
5. Your app will be live at: `https://yourusername.github.io/repo-name/`

---

## 🔐 Default Login
| Field    | Value      |
|----------|-----------|
| Username | `admin`   |
| Password | `Admin@123` |

> ⚠️ Change the password immediately after first login via Users page.

---

## 👥 User Roles

| Feature                    | Admin | Editor | Viewer |
|---------------------------|-------|--------|--------|
| View & download documents  | ✅    | ✅     | ✅     |
| Search & filter            | ✅    | ✅     | ✅     |
| Upload new documents       | ✅    | ✅     | ❌     |
| Renew/re-upload documents  | ✅    | ✅     | ❌     |
| Edit document details      | ✅    | ❌     | ❌     |
| Delete documents           | ✅    | ❌     | ❌     |
| Manage categories          | ✅    | ❌     | ❌     |
| Manage users               | ✅    | ❌     | ❌     |
| Manage notification emails | ✅    | ❌     | ❌     |
| Stop expiry notifications  | ✅    | ❌     | ❌     |

---

## 🔔 Expiry Notification System

- Admin adds email addresses under **Notifications** page
- Clicking **"Check Notifications"** or **"Send Test Now"** scans for documents expiring within 30 days
- A single consolidated email is sent listing all expiring documents
- No email is sent if nothing is expiring
- Admin can **Stop Alert** for specific documents
- Alerts resume if a document is renewed (new version uploaded)

**To automate daily sending:**  
Since GitHub Pages is static, you'll need one of:
- A **Supabase Edge Function** (cron job) that calls EmailJS daily
- A free **GitHub Action** scheduled workflow that hits a trigger endpoint
- A free **cron-job.org** webhook that calls a Supabase function

---

## 📝 Notes

- Passwords are stored as plain text in this demo. For production, implement hashing (bcrypt) via a Supabase Edge Function.
- All PDF files are stored in Supabase Storage with signed URLs (expire after 1 hour for security).
- Document version history is fully preserved — renewing never deletes old files.

---

## 🛠 Tech Stack
- **Frontend**: Pure HTML + CSS + JavaScript (no framework)
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **Hosting**: GitHub Pages
- **Email**: EmailJS (free tier: 200 emails/month)
