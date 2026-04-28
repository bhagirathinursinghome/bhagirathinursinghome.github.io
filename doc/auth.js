// ============================================================
// DocVault - Auth & Utilities
// ============================================================

// Simple hash using SubtleCrypto (SHA-256 based, bcrypt-like salting)
// For production, use a proper bcrypt library
const Auth = {
  // Hash password with PBKDF2
  async hashPassword(password) {
    const encoder = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
    const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, keyMaterial, 256);
    const hashHex = Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2, '0')).join('');
    return `pbkdf2:${saltHex}:${hashHex}`;
  },

  async verifyPassword(password, stored) {
    // Handle legacy default admin (plain comparison for first login)
    if (!stored.startsWith('pbkdf2:')) {
      return password === stored;
    }
    const [, saltHex, storedHash] = stored.split(':');
    const salt = new Uint8Array(saltHex.match(/.{2}/g).map(h => parseInt(h, 16)));
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, keyMaterial, 256);
    const hashHex = Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex === storedHash;
  },

  generateToken() {
    return Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, '0')).join('');
  },

  saveSession(user, token) {
    const session = { user, token, expires: Date.now() + CONFIG.SESSION_DURATION_HOURS * 3600000 };
    localStorage.setItem('dv_session', JSON.stringify(session));
  },

  getSession() {
    try {
      const raw = localStorage.getItem('dv_session');
      if (!raw) return null;
      const session = JSON.parse(raw);
      if (Date.now() > session.expires) { this.clearSession(); return null; }
      return session;
    } catch { return null; }
  },

  clearSession() {
    localStorage.removeItem('dv_session');
  },

  requireAuth(allowedRoles = []) {
    const session = this.getSession();
    if (!session) { window.location.href = 'index.html'; return null; }
    if (allowedRoles.length && !allowedRoles.includes(session.user.role)) {
      window.location.href = 'index.html'; return null;
    }
    return session;
  }
};

// ============================================================
// Database helpers
// ============================================================
let _db = null;
function db() {
  if (!_db) _db = getSupabaseClient();
  return _db;
}

// ============================================================
// UI Helpers
// ============================================================
const UI = {
  toast(message, type = 'info', duration = 3500) {
    const container = document.getElementById('toast-container') || (() => {
      const el = document.createElement('div');
      el.id = 'toast-container';
      document.body.appendChild(el);
      return el;
    })();
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icons = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };
    toast.innerHTML = `<span class="toast-icon">${icons[type] || '•'}</span><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 400); }, duration);
  },

  showSpinner(msg = 'Loading...') {
    let spinner = document.getElementById('global-spinner');
    if (!spinner) {
      spinner = document.createElement('div');
      spinner.id = 'global-spinner';
      document.body.appendChild(spinner);
    }
    // Always rebuild inner content so we never hit a missing <p>
    spinner.innerHTML = `<div class="spinner-box"><div class="spinner-ring"></div><p>${msg}</p></div>`;
    spinner.classList.add('active');
  },

  hideSpinner() {
    const spinner = document.getElementById('global-spinner');
    if (spinner) spinner.classList.remove('active');
  },

  confirm(message) {
    return new Promise(resolve => {
      const overlay = document.createElement('div');
      overlay.className = 'confirm-overlay';
      overlay.innerHTML = `
        <div class="confirm-box">
          <p>${message}</p>
          <div class="confirm-actions">
            <button class="btn btn-ghost" id="confirm-no">Cancel</button>
            <button class="btn btn-danger" id="confirm-yes">Confirm</button>
          </div>
        </div>`;
      document.body.appendChild(overlay);
      setTimeout(() => overlay.classList.add('active'), 10);
      const close = (val) => { overlay.classList.remove('active'); setTimeout(() => overlay.remove(), 300); resolve(val); };
      document.getElementById('confirm-yes').onclick = () => close(true);
      document.getElementById('confirm-no').onclick = () => close(false);
    });
  },

  formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  },

  formatFileSize(bytes) {
    if (!bytes) return '—';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  },

  daysUntilExpiry(dateStr) {
    if (!dateStr) return null;
    const diff = new Date(dateStr) - new Date();
    return Math.ceil(diff / 86400000);
  },

  expiryBadge(dateStr) {
    if (!dateStr) return '<span class="badge badge-neutral">No Expiry</span>';
    const days = this.daysUntilExpiry(dateStr);
    if (days < 0) return `<span class="badge badge-expired">Expired ${Math.abs(days)}d ago</span>`;
    if (days <= 7) return `<span class="badge badge-critical">Expires in ${days}d</span>`;
    if (days <= 30) return `<span class="badge badge-warning">Expires in ${days}d</span>`;
    return `<span class="badge badge-ok">${this.formatDate(dateStr)}</span>`;
  }
};

// ============================================================
// Notification / Email System
// ============================================================
const NotificationSystem = {
  async checkAndSendExpiryNotifications() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const warningDate = new Date();
      warningDate.setDate(warningDate.getDate() + CONFIG.EXPIRY_WARNING_DAYS);
      const warningDateStr = warningDate.toISOString().split('T')[0];

      // Get expiring documents (not stopped, latest version only)
      const { data: docs, error } = await db()
        .from('dv_documents')
        .select('*, dv_categories(name)')
        .eq('is_latest_version', true)
        .eq('notification_stopped', false)
        .not('expiry_date', 'is', null)
        .lte('expiry_date', warningDateStr)
        .gte('expiry_date', today);

      if (error || !docs || docs.length === 0) return;

      // Get active notification emails
      const { data: emails } = await db()
        .from('dv_notification_emails')
        .select('email')
        .eq('is_active', true);

      if (!emails || emails.length === 0) return;

      // Check if we already sent today
      const { data: lastLog } = await db()
        .from('dv_notification_log')
        .select('sent_at')
        .gte('sent_at', today + 'T00:00:00')
        .order('sent_at', { ascending: false })
        .limit(1);

      if (lastLog && lastLog.length > 0) return; // Already sent today

      // Send emails via EmailJS
      await this.sendExpiryEmail(emails.map(e => e.email), docs);

    } catch (err) {
      console.error('Notification check error:', err);
    }
  },

  async sendExpiryEmail(emailList, documents) {
    if (typeof emailjs === 'undefined') return;

    const docList = documents.map(d => {
      const days = UI.daysUntilExpiry(d.expiry_date);
      return `• ${d.document_name} | Expires: ${UI.formatDate(d.expiry_date)} (${days} days remaining)`;
    }).join('\n');

    const templateParams = {
      to_emails: emailList.join(', '),
      document_count: documents.length,
      document_list: docList,
      app_name: CONFIG.APP_NAME,
      warning_days: CONFIG.EXPIRY_WARNING_DAYS,
    };

    try {
      await emailjs.send(CONFIG.EMAILJS_SERVICE_ID, CONFIG.EMAILJS_TEMPLATE_ID, templateParams, CONFIG.EMAILJS_PUBLIC_KEY);

      // Log the send
      await db().from('dv_notification_log').insert({
        documents_included: documents.map(d => ({ id: d.id, name: d.document_name, expiry: d.expiry_date })),
        email_count: emailList.length,
        status: 'sent'
      });
    } catch (err) {
      await db().from('dv_notification_log').insert({
        documents_included: [],
        email_count: 0,
        status: 'error',
        error_message: err.message
      });
    }
  }
};

// ============================================================
// Audit Logger
// ============================================================
const AuditLog = {
  async log(action, entityType, entityId, details = {}) {
    const session = Auth.getSession();
    await db().from('dv_audit_log').insert({
      user_id: session?.user?.id || null,
      action,
      entity_type: entityType,
      entity_id: entityId,
      details
    });
  }
};
