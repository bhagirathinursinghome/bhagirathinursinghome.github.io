// ============================================================
// DocVault - Shared Layout & Navigation
// ============================================================

function renderSidebar(role, activePage) {
  const session = Auth.getSession();
  if (!session) return;
  const user = session.user;

  const roleBadgeClass = { admin: 'badge-admin', editor: 'badge-editor', viewer: 'badge-viewer' }[role] || 'badge-neutral';
  const initials = (user.full_name || user.username).split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const allPages = {
    viewer: [
      { id: 'browse', label: 'Browse Documents', icon: svgSearch(), href: 'viewer.html' },
    ],
    editor: [
      { id: 'browse', label: 'Browse Documents', icon: svgSearch(), href: 'editor.html' },
      { id: 'upload', label: 'Upload Document', icon: svgUpload(), href: 'editor.html?tab=upload' },
    ],
    admin: [
      { id: 'dashboard', label: 'Dashboard', icon: svgDash(), href: 'admin.html' },
      { id: 'browse', label: 'Browse Documents', icon: svgSearch(), href: 'admin.html?tab=browse' },
      { id: 'upload', label: 'Upload Document', icon: svgUpload(), href: 'admin.html?tab=upload' },
      { id: 'categories', label: 'Categories', icon: svgTag(), href: 'admin.html?tab=categories' },
      { id: 'users', label: 'User Management', icon: svgUsers(), href: 'admin.html?tab=users' },
      { id: 'emails', label: 'Notifications', icon: svgBell(), href: 'admin.html?tab=emails' },
    ]
  };

  const pages = allPages[role] || allPages.viewer;

  const navLinks = pages.map(p => {
    // For admin, use loadTab() (SPA); others do full navigate
    const clickHandler = role === 'admin'
      ? `closeSidebarMobile(); loadTab('${p.id}')`
      : `closeSidebarMobile(); navigate('${p.href}')`;
    return `
    <button class="nav-link ${activePage === p.id ? 'active' : ''}" onclick="${clickHandler}" data-page="${p.id}">
      ${p.icon} ${p.label}
    </button>`;
  }).join('');

  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;

  sidebar.innerHTML = `
    <div class="sidebar-logo">
      <div class="sidebar-logo-icon">D</div>
      <div class="sidebar-logo-text">
        <span class="sidebar-logo-name">DocVault</span>
        <span class="sidebar-logo-sub">Document Manager</span>
      </div>
    </div>
    <nav class="sidebar-nav">
      <div class="nav-section">
        <div class="nav-section-label">Navigation</div>
        ${navLinks}
      </div>
    </nav>
    <div class="sidebar-footer">
      <div class="user-pill">
        <div class="user-avatar">${initials}</div>
        <div class="user-info">
          <div class="user-name">${user.full_name || user.username}</div>
          <div class="user-role">${role}</div>
        </div>
      </div>
      <button class="nav-link" onclick="logout()" style="margin-top:8px; color: var(--red);">
        ${svgLogout()} Sign Out
      </button>
    </div>
  `;
}

function navigate(href) {
  window.location.href = href;
}

function closeSidebarMobile() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (sidebar) sidebar.classList.remove('open');
  if (overlay) overlay.classList.remove('active');
}

function logout() {
  Auth.clearSession();
  window.location.href = 'index.html';
}

// ── SVG Icons ──
function svgDash() { return `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`; }
function svgSearch() { return `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>`; }
function svgUpload() { return `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`; }
function svgTag() { return `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>`; }
function svgUsers() { return `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`; }
function svgBell() { return `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`; }
function svgLogout() { return `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`; }
function svgEdit() { return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`; }
function svgTrash() { return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`; }
function svgEye() { return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`; }
function svgDownload() { return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`; }
function svgPlus() { return `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`; }
function svgHistory() { return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/></svg>`; }
function svgStop() { return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>`; }
function svgX() { return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`; }
function svgRefresh() { return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>`; }
function svgDoc() { return `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`; }
function svgKey() { return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>`; }

// ── Document helpers ──
const DocHelpers = {
  async getCategories() {
    const { data } = await db().from('dv_categories').select('*').order('name');
    return data || [];
  },

  categoryColor(cat) {
    const colors = ['#c9933a','#5b9bd5','#52c47a','#9b72cf','#e05252','#e8a040','#4db6ac'];
    if (!cat) return colors[0];
    const idx = cat.name.charCodeAt(0) % colors.length;
    return cat.color || colors[idx];
  },

  async uploadPDF(file, docId) {
    const fileName = `${docId}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const { data, error } = await db().storage.from('documents').upload(fileName, file, { upsert: false });
    if (error) throw error;
    return fileName;
  },

  async getSignedURL(path, expiresIn = 3600) {
    const { data, error } = await db().storage.from('documents').createSignedUrl(path, expiresIn);
    if (error) throw error;
    return data.signedUrl;
  },

  async deleteFile(path) {
    await db().storage.from('documents').remove([path]);
  },

  async downloadDoc(doc) {
    if (!doc.file_path) { UI.toast('No file attached', 'warning'); return; }
    try {
      UI.showSpinner('Preparing download...');
      const url = await this.getSignedURL(doc.file_path);
      const a = document.createElement('a');
      a.href = url; a.download = doc.file_name || 'document.pdf'; a.target = '_blank';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
    } catch(e) { UI.toast('Download failed: ' + e.message, 'error'); }
    finally { UI.hideSpinner(); }
  },

  async viewDoc(doc) {
    if (!doc.file_path) { UI.toast('No file attached', 'warning'); return; }
    try {
      UI.showSpinner('Opening document...');
      const url = await this.getSignedURL(doc.file_path, 300);
      window.open(url, '_blank');
    } catch(e) { UI.toast('Failed to open: ' + e.message, 'error'); }
    finally { UI.hideSpinner(); }
  }
};

// ── Document Table Renderer ──
function renderDocTable(docs, options = {}) {
  const { canEdit = false, canDelete = false, canStopAlert = false, showVersion = false } = options;
  if (!docs || docs.length === 0) {
    return `<div class="empty-state"><div class="empty-state-icon">📭</div><h3>No documents found</h3><p>Try adjusting your filters</p></div>`;
  }
  return `
    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            ${showVersion ? '<th>Ver.</th>' : ''}
            <th>Document Name</th>
            <th>Doc. No.</th>
            <th>Category</th>
            <th>Expiry</th>
            <th>Physical File</th>
            <th>Uploaded</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${docs.map(d => renderDocRow(d, options)).join('')}
        </tbody>
      </table>
    </div>`;
}

function renderDocRow(d, options = {}) {
  const { canEdit = false, canDelete = false, canStopAlert = false, showVersion = false } = options;
  const catName = d.dv_categories?.name || '—';
  const catColor = d.dv_categories?.color || '#c9933a';
  const notifIcon = d.notification_stopped ? '🔕' : '';

  return `<tr>
    ${showVersion ? `<td><code>v${d.version}</code></td>` : ''}
    <td>
      <div style="font-weight:500;color:var(--text-0)">${escHtml(d.document_name)} ${notifIcon}</div>
      ${d.description ? `<div style="font-size:0.78rem;color:var(--text-2)">${escHtml(d.description.slice(0,60))}${d.description.length > 60 ? '…' : ''}</div>` : ''}
    </td>
    <td>${d.document_number ? `<code>${escHtml(d.document_number)}</code>` : '—'}</td>
    <td>${d.category_id ? `<span style="display:inline-flex;align-items:center;gap:5px"><span style="width:7px;height:7px;border-radius:50%;background:${catColor};display:inline-block"></span>${escHtml(catName)}</span>` : '—'}</td>
    <td>${UI.expiryBadge(d.expiry_date)}</td>
    <td style="color:var(--text-2);font-size:0.82rem">${d.physical_store_name ? escHtml(d.physical_store_name) : '—'}</td>
    <td style="color:var(--text-2);font-size:0.8rem;white-space:nowrap">${UI.formatDate(d.created_at)}</td>
    <td>
      <div style="display:flex;gap:4px;flex-wrap:wrap">
        ${d.file_path ? `<button class="btn btn-ghost btn-sm btn-icon" title="View" onclick="DocHelpers.viewDoc(${JSON.stringify(d).replace(/"/g,'&quot;')})">${svgEye()}</button>` : ''}
        ${d.file_path ? `<button class="btn btn-ghost btn-sm btn-icon" title="Download" onclick="DocHelpers.downloadDoc(${JSON.stringify(d).replace(/"/g,'&quot;')})">${svgDownload()}</button>` : ''}
        ${canEdit ? `<button class="btn btn-secondary btn-sm btn-icon" title="Edit" onclick="editDoc('${d.id}')">${svgEdit()}</button>` : ''}
        ${canEdit ? `<button class="btn btn-secondary btn-sm btn-icon" title="Renew" onclick="renewDoc('${d.id}')">${svgRefresh()}</button>` : ''}
        ${canEdit && showVersion ? `<button class="btn btn-ghost btn-sm btn-icon" title="Version History" onclick="viewHistory('${d.parent_document_id || d.id}')">${svgHistory()}</button>` : ''}
        ${canStopAlert && d.expiry_date && !d.notification_stopped ? `<button class="btn btn-ghost btn-sm btn-icon" title="Stop Alert" onclick="toggleNotification('${d.id}', true)" style="color:var(--amber)">${svgStop()}</button>` : ''}
        ${canStopAlert && d.expiry_date && d.notification_stopped ? `<button class="btn btn-ghost btn-sm btn-icon" title="Resume Alert" onclick="toggleNotification('${d.id}', false)" style="color:var(--green)">${svgBell()}</button>` : ''}
        ${canDelete ? `<button class="btn btn-danger btn-sm btn-icon" title="Delete" onclick="deleteDoc('${d.id}')">${svgTrash()}</button>` : ''}
      </div>
    </td>
  </tr>`;
}

function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Search + Filter helpers ──
async function buildFilters(containerId, onFilter) {
  const categories = await DocHelpers.getCategories();
  const el = document.getElementById(containerId);
  if (!el) return;

  el.innerHTML = `
    <div class="search-bar">
      <div class="search-input-wrap" style="flex:2;min-width:200px">
        <svg class="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input type="text" class="form-input" id="filter-search" placeholder="Search by name, number, description…" style="padding-left:36px">
      </div>
      <select class="form-select" id="filter-cat" style="flex:1;min-width:140px">
        <option value="">All Categories</option>
        ${categories.map(c => `<option value="${c.id}">${escHtml(c.name)}</option>`).join('')}
      </select>
      <select class="form-select" id="filter-expiry" style="min-width:160px">
        <option value="">All Documents</option>
        <option value="expiring30">Expiring in 30 days</option>
        <option value="expiring7">Expiring in 7 days</option>
        <option value="expired">Expired</option>
        <option value="noexpiry">No Expiry</option>
      </select>
      <button class="btn btn-ghost" id="filter-reset">Reset</button>
    </div>`;

  const inputs = ['filter-search', 'filter-cat', 'filter-expiry'];
  inputs.forEach(id => {
    const el2 = document.getElementById(id);
    el2.addEventListener(id === 'filter-search' ? 'input' : 'change', onFilter);
  });
  document.getElementById('filter-reset').addEventListener('click', () => {
    document.getElementById('filter-search').value = '';
    document.getElementById('filter-cat').value = '';
    document.getElementById('filter-expiry').value = '';
    onFilter();
  });
}

function applyLocalFilters(docs) {
  const search = document.getElementById('filter-search')?.value.toLowerCase() || '';
  const cat = document.getElementById('filter-cat')?.value || '';
  const expiry = document.getElementById('filter-expiry')?.value || '';

  return docs.filter(d => {
    if (search && ![d.document_name, d.document_number, d.description, d.physical_store_name].some(v => v && v.toLowerCase().includes(search))) return false;
    if (cat && d.category_id !== cat) return false;
    if (expiry) {
      const days = UI.daysUntilExpiry(d.expiry_date);
      if (expiry === 'expiring30' && (days === null || days < 0 || days > 30)) return false;
      if (expiry === 'expiring7' && (days === null || days < 0 || days > 7)) return false;
      if (expiry === 'expired' && (days === null || days >= 0)) return false;
      if (expiry === 'noexpiry' && d.expiry_date) return false;
    }
    return true;
  });
}
