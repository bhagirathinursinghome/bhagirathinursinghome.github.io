const { data, error } = await sb.from('app_users').select('*').eq('username', 'admin').limit(1);
console.log(error, data);

// ============================================================
// app.js — Core application logic
// ============================================================

// Init Supabase
const { createClient } = supabase;
const sb = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);

// ── Current user ────────────────────────────────────────────
let currentUser = null;

function getSession() {
  try {
    const s = sessionStorage.getItem(CONFIG.SESSION_KEY);
    return s ? JSON.parse(s) : null;
  } catch (e) { return null; }
}

function setSession(user) {
  sessionStorage.setItem(CONFIG.SESSION_KEY, JSON.stringify(user));
  currentUser = user;
}

function clearSession() {
  sessionStorage.removeItem(CONFIG.SESSION_KEY);
  currentUser = null;
}

function requireAuth() {
  const user = getSession();
  if (!user) { window.location.href = 'index.html'; return null; }
  currentUser = user;
  return user;
}

function requireRole(...roles) {
  const user = requireAuth();
  if (!user) return null;
  if (!roles.includes(user.role)) {
    showToast('Access denied', 'error');
    window.location.href = 'dashboard.html';
    return null;
  }
  return user;
}

// ── Toast ───────────────────────────────────────────────────
function showToast(msg, type = 'info', duration = 3500) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  container.appendChild(t);
  setTimeout(() => t.remove(), duration);
}

// ── Loading ─────────────────────────────────────────────────
function showLoading(show = true) {
  const el = document.getElementById('loading-overlay');
  if (el) el.classList.toggle('hidden', !show);
}

// ── Login ───────────────────────────────────────────────────
async function hashPassword(password) {
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  return [...new Uint8Array(hashBuffer)].map(b => b.toString(16).padStart(2, '0')).join('');
}

async function handleLogin() {
  const username = document.getElementById('login-username')?.value?.trim();
  const password = document.getElementById('login-password')?.value;

  if (!username || !password) {
    showToast('Please enter username and password', 'error'); return;
  }

  showLoading(true);
  try {
    const { data: rows, error } = await sb
      .from('app_users')
      .select('*')
      .eq('username', username)
      .limit(1);

    if (error) { showToast('Connection error: ' + error.message, 'error'); return; }

    const user = rows && rows[0];
    if (!user) { showToast('Invalid username or password', 'error'); return; }
    if (!user.is_active) { showToast('Your account is inactive. Contact admin.', 'error'); return; }

    const hashed = await hashPassword(password);
    console.log('Input hash:', hashed);           // remove after testing
    console.log('DB hash:', user.password_hash);  // remove after testing

    if (user.password_hash !== hashed) {
      showToast('Invalid username or password', 'error'); return;
    }

    setSession(user);
    window.location.href = 'dashboard.html';
  } catch (e) {
    showToast('Connection error: ' + e.message, 'error');
  } finally {
    showLoading(false);
  }
}

// ── Logout ──────────────────────────────────────────────────
function handleLogout() {
  clearSession();
  window.location.href = 'index.html';
}

// ── Populate user UI ─────────────────────────────────────────
function populateUserUI(user) {
  const nameEl = document.getElementById('user-display-name');
  const roleEl = document.getElementById('user-display-role');
  const avatarEl = document.getElementById('user-avatar');
  if (nameEl) nameEl.textContent = user.full_name || user.username;
  if (roleEl) roleEl.textContent = user.role.toUpperCase();
  if (avatarEl) avatarEl.textContent = (user.full_name || user.username)[0].toUpperCase();
}

// ── Role check helpers ───────────────────────────────────────
function isAdmin() { return currentUser?.role === 'admin'; }
function isEditor() { return currentUser?.role === 'editor' || isAdmin(); }
function isViewer() { return true; }

function showForRoles(selector, ...roles) {
  document.querySelectorAll(selector).forEach(el => {
    const allowed = roles.includes(currentUser?.role);
    el.classList.toggle('hidden', !allowed);
  });
}

// ── Date helpers ─────────────────────────────────────────────
function daysUntil(dateStr) {
  if (!dateStr) return null;
  const diff = new Date(dateStr) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getExpiryStatus(dateStr) {
  if (!dateStr) return null;
  const days = daysUntil(dateStr);
  if (days < 0) return 'expired';
  if (days <= 30) return 'expiring';
  return 'active';
}

function expiryBadge(dateStr) {
  if (!dateStr) return '';
  const status = getExpiryStatus(dateStr);
  const days = daysUntil(dateStr);
  if (status === 'expired') return `<span class="badge badge-expired">Expired</span>`;
  if (status === 'expiring') return `<span class="badge badge-expiring">Expires in ${days}d</span>`;
  return `<span class="badge badge-active">${formatDate(dateStr)}</span>`;
}

// ── Categories ───────────────────────────────────────────────
async function fetchCategories() {
  const { data } = await sb.from('categories').select('*').order('name');
  return data || [];
}

// ── Documents ────────────────────────────────────────────────
async function fetchDocuments(filters = {}) {
  let q = sb.from('documents')
    .select('*, categories(id, name, color), app_users!documents_uploaded_by_fkey(username, full_name)')
    .order('created_at', { ascending: false });

  if (filters.search) {
    q = q.or(`name.ilike.%${filters.search}%,document_number.ilike.%${filters.search}%,physical_store_filename.ilike.%${filters.search}%`);
  }
  if (filters.category) q = q.eq('category_id', filters.category);
  if (filters.status === 'expired') q = q.lt('expiry_date', new Date().toISOString().split('T')[0]);
  if (filters.status === 'expiring') {
    const today = new Date().toISOString().split('T')[0];
    const future = new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0];
    q = q.gte('expiry_date', today).lte('expiry_date', future);
  }
  if (filters.status === 'active') {
    const future = new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0];
    q = q.or(`expiry_date.is.null,expiry_date.gt.${future}`);
  }

  const { data, error } = await q;
  return data || [];
}

async function fetchDocumentVersions(documentId) {
  const { data } = await sb
    .from('document_versions')
    .select('*, app_users!document_versions_uploaded_by_fkey(username, full_name)')
    .eq('document_id', documentId)
    .order('version_number', { ascending: false });
  return data || [];
}

// ── File upload to Supabase Storage ──────────────────────────
async function uploadFile(file, docName) {
  const ext = file.name.split('.').pop();
  const safeName = docName.replace(/[^a-zA-Z0-9]/g, '_');
  const path = `${safeName}_${Date.now()}.${ext}`;
  const { data, error } = await sb.storage.from('documents').upload(path, file, {
    contentType: file.type,
    upsert: false
  });
  if (error) throw new Error('Upload failed: ' + error.message);
  return path;
}

async function getFileURL(storagePath) {
  const { data } = await sb.storage.from('documents').createSignedUrl(storagePath, 3600);
  return data?.signedUrl || null;
}

async function downloadFile(storagePath, fileName) {
  const url = await getFileURL(storagePath);
  if (!url) { showToast('Could not generate download link', 'error'); return; }
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.target = '_blank';
  a.click();
}

async function viewFile(storagePath) {
  const url = await getFileURL(storagePath);
  if (!url) { showToast('Could not generate view link', 'error'); return; }
  window.open(url, '_blank');
}

// ── Expiry notification check ─────────────────────────────────
async function checkAndSendExpiryNotifications() {
  const today = new Date().toISOString().split('T')[0];
  const future = new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0];

  // Get documents expiring within 30 days (not stopped)
  const { data: expiringDocs } = await sb
    .from('documents')
    .select('*, categories(name)')
    .gte('expiry_date', today)
    .lte('expiry_date', future)
    .eq('notification_stopped', false);

  if (!expiringDocs || expiringDocs.length === 0) return;

  // Get notification emails
  const { data: emails } = await sb
    .from('notification_emails')
    .select('email')
    .eq('is_active', true);

  if (!emails || emails.length === 0) return;

  // Build email body
  const docList = expiringDocs.map(d => {
    const days = daysUntil(d.expiry_date);
    return `• ${d.name} — Expires: ${formatDate(d.expiry_date)} (${days} days remaining)`;
  }).join('\n');

  const subject = `⚠️ DocVault: ${expiringDocs.length} Document(s) Expiring Within 30 Days`;
  const message = `The following documents are expiring soon:\n\n${docList}\n\nPlease renew them at your earliest convenience.\n\n— DocVault System`;

  // Send via EmailJS
  if (typeof emailjs !== 'undefined' && CONFIG.EMAILJS_SERVICE_ID !== 'your_emailjs_service_id') {
    for (const emailObj of emails) {
      try {
        await emailjs.send(CONFIG.EMAILJS_SERVICE_ID, CONFIG.EMAILJS_TEMPLATE_ID, {
          to_email: emailObj.email,
          subject: subject,
          message: message
        }, CONFIG.EMAILJS_PUBLIC_KEY);
      } catch (e) {
        console.warn('Email send failed for', emailObj.email, e);
      }
    }
    // Log the notification
    await sb.from('notification_log').insert({
      documents_included: expiringDocs.map(d => ({ id: d.id, name: d.name, expiry: d.expiry_date })),
      recipient_emails: emails.map(e => e.email),
      status: 'sent'
    });
    showToast(`Expiry notifications sent to ${emails.length} recipients`, 'success');
  } else {
    console.log('EmailJS not configured. Would send to:', emails.map(e => e.email));
    showToast('Notification check complete (EmailJS not configured)', 'info');
  }
}

// ── Modal helpers ─────────────────────────────────────────────
function openModal(id) {
  document.getElementById(id)?.classList.remove('hidden');
}

function closeModal(id) {
  document.getElementById(id)?.classList.add('hidden');
}

function createConfirmModal(title, message, onConfirm) {
  const existing = document.getElementById('global-confirm-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'global-confirm-modal';
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal" style="max-width:400px">
      <div class="modal-header">
        <h2>${title}</h2>
        <button class="btn-close" onclick="document.getElementById('global-confirm-modal').remove()">✕</button>
      </div>
      <div class="modal-body">
        <p class="confirm-text">${message}</p>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="document.getElementById('global-confirm-modal').remove()">Cancel</button>
        <button class="btn btn-danger" id="confirm-ok-btn">Confirm</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  document.getElementById('confirm-ok-btn').addEventListener('click', () => {
    modal.remove();
    onConfirm();
  });
}

// ── Category color options ────────────────────────────────────
const CATEGORY_COLORS = [
  '#5b6af0','#22d3a0','#f5a623','#f05b5b','#8b5cf6',
  '#06b6d4','#ec4899','#84cc16','#f97316','#64748b'
];

function colorSwatches(currentColor, inputId) {
  return CATEGORY_COLORS.map(c => `
    <span onclick="document.getElementById('${inputId}').value='${c}';this.parentElement.querySelectorAll('.swatch').forEach(s=>s.style.outline='none');this.style.outline='2px solid white';"
      class="swatch"
      style="display:inline-block;width:20px;height:20px;border-radius:50%;background:${c};cursor:pointer;margin-right:4px;
      outline:${c===currentColor?'2px solid white':'none'};outline-offset:2px">
    </span>
  `).join('');
}

// ── Populate category dropdowns ───────────────────────────────
async function populateCategoryDropdowns(selectedId = null) {
  const cats = await fetchCategories();
  document.querySelectorAll('.category-select').forEach(sel => {
    const cur = sel.value;
    sel.innerHTML = '<option value="">All Categories</option>' +
      cats.map(c => `<option value="${c.id}" ${(selectedId || cur) === c.id ? 'selected' : ''}>${c.name}</option>`).join('');
  });
}
