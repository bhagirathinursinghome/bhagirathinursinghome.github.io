// ============================================================
// dashboard.js — All page-specific logic
// ============================================================

let allDocuments = [];
let currentPage = 'overview';
let renewingDocId = null;

// ── Init ─────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', async () => {
  const user = requireAuth();
  if (!user) return;

  populateUserUI(user);
  applyRoleRestrictions();
  setupFileDrop();

  // Init EmailJS if configured
  if (typeof emailjs !== 'undefined' && CONFIG.EMAILJS_PUBLIC_KEY !== 'your_emailjs_public_key') {
    emailjs.init(CONFIG.EMAILJS_PUBLIC_KEY);
  }

  await navigate('overview');
});
function toggleSidebar() {
  document.querySelector('.sidebar').classList.toggle('open');
  document.getElementById('sidebar-backdrop').classList.toggle('open');
}
function closeSidebar() {
  document.querySelector('.sidebar').classList.remove('open');
  document.getElementById('sidebar-backdrop').classList.remove('open');
}
// ── Navigation ────────────────────────────────────────────────
async function navigate(page) {
  closeSidebar();
  // Hide all pages
  document.querySelectorAll('[id^="page-"]').forEach(p => p.classList.add('hidden'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const pageEl = document.getElementById(`page-${page}`);
  const navEl  = document.getElementById(`nav-${page}`);
  if (!pageEl) return;
  pageEl.classList.remove('hidden');
  if (navEl) navEl.classList.add('active');

  currentPage = page;

  // Load data for the page
  switch (page) {
    case 'overview':     await loadOverview(); break;
    case 'documents':    await loadDocumentsPage(); break;
    case 'upload':       await loadUploadPage(); break;
    case 'categories':   await loadCategories(); break;
    case 'users':        await loadUsers(); break;
    case 'notifications':await loadNotifications(); break;
  }
}

// ── Role restrictions ─────────────────────────────────────────
function applyRoleRestrictions() {
  const role = currentUser?.role;
  // Show/hide nav items
  document.querySelectorAll('.admin-only').forEach(el => {
    el.classList.toggle('hidden', role !== 'admin');
  });
  document.querySelectorAll('.editor-only').forEach(el => {
    el.classList.toggle('hidden', !['admin','editor'].includes(role));
  });
}

// ── Overview ──────────────────────────────────────────────────
async function loadOverview() {
  const docs = await fetchDocuments();
  allDocuments = docs;

  const today = new Date().toISOString().split('T')[0];
  const future = new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0];
  const expired  = docs.filter(d => d.expiry_date && d.expiry_date < today);
  const expiring = docs.filter(d => d.expiry_date && d.expiry_date >= today && d.expiry_date <= future);

  document.getElementById('stat-total').textContent    = docs.length;
  document.getElementById('stat-expiring').textContent = expiring.length;
  document.getElementById('stat-expired').textContent  = expired.length;

  const { data: cats } = await sb.from('categories').select('id');
  document.getElementById('stat-cats').textContent = cats?.length || 0;

  // Expiring list
  const expiringEl = document.getElementById('expiring-list');
  if (expiring.length === 0) {
    expiringEl.innerHTML = '<div class="empty-state"><div class="icon">✅</div><p>No documents expiring within 30 days</p></div>';
  } else {
    expiringEl.innerHTML = expiring.map(d => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border)">
        <div>
          <div style="font-size:13px;font-weight:600;color:var(--text)">${esc(d.name)}</div>
          <div style="font-size:11px;color:var(--text3)">${d.categories?.name||'Uncategorized'}</div>
        </div>
        ${expiryBadge(d.expiry_date)}
      </div>
    `).join('');
  }

  // Recent list
  const recentEl = document.getElementById('recent-list');
  const recent = docs.slice(0, 5);
  if (recent.length === 0) {
    recentEl.innerHTML = '<div class="empty-state"><div class="icon">📄</div><p>No documents yet</p></div>';
  } else {
    recentEl.innerHTML = recent.map(d => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border)">
        <div>
          <div style="font-size:13px;font-weight:600;color:var(--text)">${esc(d.name)}</div>
          <div style="font-size:11px;color:var(--text3)">${d.categories?.name||'Uncategorized'}</div>
        </div>
        <div style="font-size:11px;color:var(--text3);font-family:var(--font-mono)">${formatDate(d.created_at)}</div>
      </div>
    `).join('');
  }
}

// ── Documents Page ────────────────────────────────────────────
async function loadDocumentsPage() {
  showLoading(true);
  allDocuments = await fetchDocuments();
  await populateCategoryDropdowns();
  renderDocuments();
  showLoading(false);
}

function renderDocuments() {
  const search   = document.getElementById('doc-search')?.value?.toLowerCase() || '';
  const catId    = document.getElementById('doc-filter-cat')?.value || '';
  const status   = document.getElementById('doc-filter-status')?.value || '';
  const sort     = document.getElementById('doc-sort')?.value || 'newest';
  const today    = new Date().toISOString().split('T')[0];
  const future30 = new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0];

  let docs = allDocuments.filter(d => {
    const matchSearch = !search || d.name.toLowerCase().includes(search)
      || (d.document_number||'').toLowerCase().includes(search)
      || (d.physical_store_filename||'').toLowerCase().includes(search)
      || (d.description||'').toLowerCase().includes(search);
    const matchCat    = !catId  || d.category_id === catId;
    let matchStatus   = true;
    if (status === 'expired')  matchStatus = d.expiry_date && d.expiry_date < today;
    if (status === 'expiring') matchStatus = d.expiry_date && d.expiry_date >= today && d.expiry_date <= future30;
    if (status === 'active')   matchStatus = !d.expiry_date || d.expiry_date > future30;
    return matchSearch && matchCat && matchStatus;
  });

  // Sort
  docs.sort((a, b) => {
    if (sort === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
    if (sort === 'name')   return a.name.localeCompare(b.name);
    if (sort === 'expiry') {
      if (!a.expiry_date) return 1;
      if (!b.expiry_date) return -1;
      return new Date(a.expiry_date) - new Date(b.expiry_date);
    }
    return new Date(b.created_at) - new Date(a.created_at);
  });

  const container = document.getElementById('doc-results');
  if (docs.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="icon">🔍</div><p>No documents found</p></div>';
    return;
  }

  const role = currentUser?.role;
  const canEdit = ['admin','editor'].includes(role);
  const canAdmin = role === 'admin';

  container.innerHTML = `<div class="doc-grid">${docs.map(d => {
    const eStatus = getExpiryStatus(d.expiry_date);
    const cardClass = eStatus === 'expired' ? 'expired' : eStatus === 'expiring' ? 'expiring' : '';
    const catColor = d.categories?.color || '#5b6af0';
    return `
    <div class="doc-card ${cardClass}">
      <div class="doc-card-header">
        <div>
          <div class="doc-card-name">${esc(d.name)}</div>
          <div class="doc-card-cat">
            <span class="cat-dot" style="background:${catColor}"></span>
            ${esc(d.categories?.name || 'Uncategorized')}
          </div>
        </div>
        ${expiryBadge(d.expiry_date)}
      </div>
      <div class="doc-card-meta">
        ${d.document_number ? `<div class="doc-meta-row"><span class="doc-meta-label">Doc No.</span><span class="doc-meta-value">${esc(d.document_number)}</span></div>` : ''}
        ${d.physical_store_filename ? `<div class="doc-meta-row"><span class="doc-meta-label">Physical File</span><span class="doc-meta-value">${esc(d.physical_store_filename)}</span></div>` : ''}
        <div class="doc-meta-row"><span class="doc-meta-label">Uploaded</span><span class="doc-meta-value">${formatDate(d.created_at)}</span></div>
      </div>
      <div class="doc-card-actions">
        <button class="btn btn-secondary btn-sm" onclick="viewDocument('${d.id}')">👁 View</button>
        ${canEdit ? `<button class="btn btn-secondary btn-sm" onclick="startRenew('${d.id}','${esc(d.name)}')">🔄 Renew</button>` : ''}
        ${canAdmin ? `<button class="btn btn-secondary btn-sm" onclick="openEditDoc('${d.id}')">✏️</button>` : ''}
        ${canAdmin ? `<button class="btn btn-danger btn-sm" onclick="deleteDocument('${d.id}','${esc(d.name)}')">🗑</button>` : ''}
      </div>
    </div>`;
  }).join('')}</div>`;
}

// ── View document ─────────────────────────────────────────────
async function viewDocument(id) {
  const doc = allDocuments.find(d => d.id === id);
  if (!doc) return;

  document.getElementById('view-doc-title').textContent = doc.name;
  document.getElementById('view-doc-details').innerHTML = `
    <div><div style="font-size:10px;color:var(--text3);margin-bottom:4px;font-family:var(--font-mono);letter-spacing:.08em;text-transform:uppercase">Category</div><div>${doc.categories?.name || 'Uncategorized'}</div></div>
    <div><div style="font-size:10px;color:var(--text3);margin-bottom:4px;font-family:var(--font-mono);letter-spacing:.08em;text-transform:uppercase">Document No.</div><div>${doc.document_number || '—'}</div></div>
    <div><div style="font-size:10px;color:var(--text3);margin-bottom:4px;font-family:var(--font-mono);letter-spacing:.08em;text-transform:uppercase">Expiry Date</div><div>${expiryBadge(doc.expiry_date)||'—'}</div></div>
    <div><div style="font-size:10px;color:var(--text3);margin-bottom:4px;font-family:var(--font-mono);letter-spacing:.08em;text-transform:uppercase">Physical File</div><div>${doc.physical_store_filename || '—'}</div></div>
    <div style="grid-column:1/-1"><div style="font-size:10px;color:var(--text3);margin-bottom:4px;font-family:var(--font-mono);letter-spacing:.08em;text-transform:uppercase">Description</div><div>${doc.description || '—'}</div></div>
    <div><div style="font-size:10px;color:var(--text3);margin-bottom:4px;font-family:var(--font-mono);letter-spacing:.08em;text-transform:uppercase">Notification</div><div>${doc.notification_stopped ? '<span class="badge badge-expired">Stopped</span>' : '<span class="badge badge-active">Active</span>'}</div></div>
  `;

  // Load versions
  const versions = await fetchDocumentVersions(id);
  const versionsEl = document.getElementById('view-versions-list');
  if (versions.length === 0) {
    versionsEl.innerHTML = '<div class="empty-state"><p>No file versions found</p></div>';
  } else {
    versionsEl.innerHTML = versions.map(v => `
      <div class="version-item">
        <span class="version-num">v${v.version_number}</span>
        <div style="flex:1">
          <div style="font-size:13px;color:var(--text)">${esc(v.file_name)}</div>
          <div style="font-size:11px;color:var(--text3)">${formatDate(v.uploaded_at)} · ${v.app_users?.full_name || v.app_users?.username || 'Unknown'}</div>
          ${v.expiry_date ? `<div style="font-size:11px;color:var(--text3)">Expiry: ${formatDate(v.expiry_date)}</div>` : ''}
        </div>
        ${v.is_current ? '<span class="version-current">● CURRENT</span>' : ''}
        <button class="btn btn-secondary btn-sm" onclick="viewFile('${v.storage_path}')">👁</button>
        <button class="btn btn-success btn-sm" onclick="downloadFile('${v.storage_path}','${esc(v.file_name)}')">⬇</button>
      </div>
    `).join('');
  }

  // Footer actions
  const canEdit = ['admin','editor'].includes(currentUser?.role);
  document.getElementById('view-doc-actions').innerHTML = `
    ${canEdit ? `<button class="btn btn-secondary" onclick="startRenew('${doc.id}','${esc(doc.name)}');closeModal('modal-doc-view')">🔄 Renew</button>` : ''}
    <button class="btn btn-secondary" onclick="closeModal('modal-doc-view')">Close</button>
  `;

  openModal('modal-doc-view');
}

// ── Upload / Renew ────────────────────────────────────────────
async function loadUploadPage() {
  await populateCategoryDropdowns();
  if (renewingDocId) {
    document.getElementById('upload-page-title').textContent = 'Renew Document';
    document.getElementById('upload-renew-banner').classList.remove('hidden');
    document.getElementById('up-name').closest('.form-row').children[0].style.opacity = '0.5';
    document.getElementById('up-name').readOnly = true;
  } else {
    document.getElementById('upload-page-title').textContent = 'Upload Document';
    document.getElementById('upload-renew-banner').classList.add('hidden');
    document.getElementById('up-name').readOnly = false;
    document.getElementById('up-name').closest('.form-row').children[0].style.opacity = '1';
    clearUploadForm();
  }
}

function startRenew(docId, docName) {
  renewingDocId = docId;
  document.getElementById('up-name').value = docName;
  document.getElementById('renew-doc-name').textContent = docName;
  navigate('upload');
}

function clearUploadForm() {
  ['up-name','up-docnum','up-expiry','up-physical','up-desc'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('file-name-display').textContent = '';
  document.getElementById('up-file').value = '';
  renewingDocId = null;
}

async function submitUpload() {
  const name     = document.getElementById('up-name').value.trim();
  const catId    = document.getElementById('up-category').value;
  const docNum   = document.getElementById('up-docnum').value.trim();
  const expiry   = document.getElementById('up-expiry').value;
  const physical = document.getElementById('up-physical').value.trim();
  const desc     = document.getElementById('up-desc').value.trim();
  const file     = document.getElementById('up-file').files[0];

  if (!name) { showToast('Document name is required', 'error'); return; }
  if (!file)  { showToast('Please select a PDF file', 'error'); return; }
  if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
    showToast('Only PDF files are allowed', 'error'); return;
  }

  showLoading(true);
  try {
    let docId = renewingDocId;

    if (!renewingDocId) {
      // Create new document record
      const { data: newDoc, error: docErr } = await sb.from('documents').insert({
        name, category_id: catId || null, document_number: docNum || null,
        expiry_date: expiry || null, physical_store_filename: physical || null,
        description: desc || null, uploaded_by: currentUser.id
      }).select().single();
      if (docErr) throw new Error(docErr.message);
      docId = newDoc.id;
    } else {
      // Update main doc record with new expiry/details (keep name)
      await sb.from('documents').update({
        category_id: catId || null, document_number: docNum || null,
        expiry_date: expiry || null, physical_store_filename: physical || null,
        description: desc || null, notification_stopped: false
      }).eq('id', renewingDocId);
    }

    // Get next version number
    const { data: existingVersions } = await sb.from('document_versions')
      .select('version_number').eq('document_id', docId).order('version_number', { ascending: false }).limit(1);
    const nextVersion = existingVersions?.[0]?.version_number ? existingVersions[0].version_number + 1 : 1;

    // Mark old versions as not current
    await sb.from('document_versions').update({ is_current: false }).eq('document_id', docId);

    // Upload file
    const storagePath = await uploadFile(file, name);

    // Save version
    await sb.from('document_versions').insert({
      document_id: docId, version_number: nextVersion,
      document_number: docNum || null, expiry_date: expiry || null,
      physical_store_filename: physical || null, description: desc || null,
      storage_path: storagePath, file_name: file.name, file_size: file.size,
      mime_type: file.type, uploaded_by: currentUser.id, is_current: true
    });

    showToast(renewingDocId ? 'Document renewed successfully!' : 'Document uploaded successfully!', 'success');
    renewingDocId = null;
    clearUploadForm();
    navigate('documents');
  } catch (e) {
    showToast('Error: ' + e.message, 'error');
  } finally {
    showLoading(false);
  }
}

// ── File drop zone ────────────────────────────────────────────
function setupFileDrop() {
  const zone = document.getElementById('file-drop-zone');
  const input = document.getElementById('up-file');
  if (!zone || !input) return;

  input.addEventListener('change', () => {
    const f = input.files[0];
    if (f) document.getElementById('file-name-display').textContent = `📄 ${f.name} (${(f.size/1024).toFixed(1)} KB)`;
  });

  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('dragover'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('dragover');
    const f = e.dataTransfer.files[0];
    if (f) {
      input.files = e.dataTransfer.files;
      document.getElementById('file-name-display').textContent = `📄 ${f.name} (${(f.size/1024).toFixed(1)} KB)`;
    }
  });
}

// ── Edit document ─────────────────────────────────────────────
async function openEditDoc(id) {
  if (!isAdmin()) return;
  const doc = allDocuments.find(d => d.id === id);
  if (!doc) return;

  document.getElementById('edit-doc-id').value     = doc.id;
  document.getElementById('edit-doc-name').value   = doc.name;
  document.getElementById('edit-doc-num').value    = doc.document_number || '';
  document.getElementById('edit-doc-expiry').value = doc.expiry_date || '';
  document.getElementById('edit-doc-physical').value = doc.physical_store_filename || '';
  document.getElementById('edit-doc-desc').value   = doc.description || '';
  document.getElementById('edit-doc-notif').value  = doc.notification_stopped ? 'true' : 'false';

  await populateCategoryDropdowns(doc.category_id);
  document.getElementById('edit-doc-cat').value = doc.category_id || '';

  openModal('modal-edit-doc');
}

async function submitEditDoc() {
  const id = document.getElementById('edit-doc-id').value;
  showLoading(true);
  try {
    const { error } = await sb.from('documents').update({
      name:                    document.getElementById('edit-doc-name').value.trim(),
      category_id:             document.getElementById('edit-doc-cat').value || null,
      document_number:         document.getElementById('edit-doc-num').value.trim() || null,
      expiry_date:             document.getElementById('edit-doc-expiry').value || null,
      physical_store_filename: document.getElementById('edit-doc-physical').value.trim() || null,
      description:             document.getElementById('edit-doc-desc').value.trim() || null,
      notification_stopped:    document.getElementById('edit-doc-notif').value === 'true'
    }).eq('id', id);
    if (error) throw new Error(error.message);
    closeModal('modal-edit-doc');
    showToast('Document updated', 'success');
    await loadDocumentsPage();
  } catch (e) {
    showToast('Error: ' + e.message, 'error');
  } finally {
    showLoading(false);
  }
}

async function deleteDocument(id, name) {
  if (!isAdmin()) return;
  createConfirmModal('Delete Document', `Are you sure you want to delete <span class="confirm-name">${esc(name)}</span>? This will delete all versions.`, async () => {
    showLoading(true);
    try {
      // Get all versions' storage paths
      const { data: versions } = await sb.from('document_versions').select('storage_path').eq('document_id', id);
      // Delete files from storage
      if (versions?.length) {
        for (const v of versions) {
          await sb.storage.from('documents').remove([v.storage_path]);
        }
      }
      await sb.from('document_versions').delete().eq('document_id', id);
      const { error } = await sb.from('documents').delete().eq('id', id);
      if (error) throw new Error(error.message);
      showToast('Document deleted', 'success');
      await loadDocumentsPage();
    } catch (e) {
      showToast('Error: ' + e.message, 'error');
    } finally {
      showLoading(false);
    }
  });
}

// ── Categories ────────────────────────────────────────────────
async function loadCategories() {
  if (!isAdmin()) return;
  const cats = await fetchCategories();

  const tbody = document.getElementById('categories-tbody');
  if (!cats.length) {
    tbody.innerHTML = '<tr><td colspan="5"><div class="empty-state"><div class="icon">🏷️</div><p>No categories yet</p></div></td></tr>';
    return;
  }

  // Get doc counts per category
  const { data: docCounts } = await sb.from('documents').select('category_id');
  const countMap = {};
  docCounts?.forEach(d => { if (d.category_id) countMap[d.category_id] = (countMap[d.category_id]||0)+1; });

  tbody.innerHTML = cats.map(c => `
    <tr>
      <td><span class="cat-dot" style="background:${c.color}"></span>${esc(c.name)}</td>
      <td>${esc(c.description||'—')}</td>
      <td><span class="badge badge-viewer">${countMap[c.id]||0} docs</span></td>
      <td style="font-family:var(--font-mono);font-size:11px">${formatDate(c.created_at)}</td>
      <td class="actions-cell">
        <button class="btn btn-secondary btn-sm" onclick="openCategoryModal('${c.id}')">✏️</button>
        <button class="btn btn-danger btn-sm" onclick="deleteCategory('${c.id}','${esc(c.name)}')">🗑</button>
      </td>
    </tr>
  `).join('');
}

function openCategoryModal(id = null) {
  document.getElementById('cat-id').value    = id || '';
  document.getElementById('cat-modal-title').textContent = id ? 'Edit Category' : 'Add Category';
  document.getElementById('cat-color-swatches').innerHTML = colorSwatches('#5b6af0', 'cat-color');

  if (id) {
    fetchCategories().then(cats => {
      const cat = cats.find(c => c.id === id);
      if (cat) {
        document.getElementById('cat-name').value  = cat.name;
        document.getElementById('cat-desc').value  = cat.description || '';
        document.getElementById('cat-color').value = cat.color || '#5b6af0';
        document.getElementById('cat-color-swatches').innerHTML = colorSwatches(cat.color, 'cat-color');
      }
    });
  } else {
    document.getElementById('cat-name').value = '';
    document.getElementById('cat-desc').value = '';
    document.getElementById('cat-color').value = '#5b6af0';
  }
  openModal('modal-category');
}

async function submitCategory() {
  const id    = document.getElementById('cat-id').value;
  const name  = document.getElementById('cat-name').value.trim();
  const desc  = document.getElementById('cat-desc').value.trim();
  const color = document.getElementById('cat-color').value;

  if (!name) { showToast('Category name is required', 'error'); return; }

  showLoading(true);
  try {
    if (id) {
      const { error } = await sb.from('categories').update({ name, description: desc||null, color }).eq('id', id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await sb.from('categories').insert({ name, description: desc||null, color, created_by: currentUser.id });
      if (error) throw new Error(error.message);
    }
    closeModal('modal-category');
    showToast('Category saved', 'success');
    await loadCategories();
  } catch (e) {
    showToast('Error: ' + e.message, 'error');
  } finally {
    showLoading(false);
  }
}

async function deleteCategory(id, name) {
  createConfirmModal('Delete Category', `Delete category <span class="confirm-name">${esc(name)}</span>? Documents in this category will become uncategorized.`, async () => {
    showLoading(true);
    try {
      await sb.from('documents').update({ category_id: null }).eq('category_id', id);
      const { error } = await sb.from('categories').delete().eq('id', id);
      if (error) throw new Error(error.message);
      showToast('Category deleted', 'success');
      await loadCategories();
    } catch (e) {
      showToast('Error: ' + e.message, 'error');
    } finally {
      showLoading(false);
    }
  });
}

// ── Users ─────────────────────────────────────────────────────
async function loadUsers() {
  if (!isAdmin()) return;
  const { data: users, error } = await sb.from('app_users').select('*').order('created_at');
  const tbody = document.getElementById('users-tbody');
  if (!users?.length) {
    tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state"><div class="icon">👥</div><p>No users found</p></div></td></tr>';
    return;
  }
  tbody.innerHTML = users.map(u => `
    <tr>
      <td>${esc(u.full_name||'—')}</td>
      <td style="font-family:var(--font-mono)">${esc(u.username)}</td>
      <td><span class="badge badge-${u.role}">${u.role}</span></td>
      <td>${esc(u.email||'—')}</td>
      <td><span class="badge ${u.is_active ? 'badge-active' : 'badge-expired'}">${u.is_active?'Active':'Inactive'}</span></td>
      <td class="actions-cell">
        <button class="btn btn-secondary btn-sm" onclick="openUserModal('${u.id}')">✏️</button>
        ${u.username !== 'admin' ? `<button class="btn btn-danger btn-sm" onclick="deleteUser('${u.id}','${esc(u.username)}')">🗑</button>` : ''}
      </td>
    </tr>
  `).join('');
}

function openUserModal(id = null) {
  document.getElementById('user-id').value = id || '';
  document.getElementById('user-modal-title').textContent = id ? 'Edit User' : 'Add User';
  const pwdRequired = document.getElementById('pwd-required');
  const pwdHint     = document.getElementById('pwd-hint');

  if (id) {
    pwdRequired.style.display = 'none';
    pwdHint.style.display = 'block';
    sb.from('app_users').select('*').eq('id', id).single().then(({ data }) => {
      if (data) {
        document.getElementById('user-fullname').value = data.full_name || '';
        document.getElementById('user-username').value = data.username;
        document.getElementById('user-email').value    = data.email || '';
        document.getElementById('user-role').value     = data.role;
        document.getElementById('user-status').value   = String(data.is_active);
        document.getElementById('user-password').value = '';
      }
    });
  } else {
    pwdRequired.style.display = 'inline';
    pwdHint.style.display = 'none';
    ['user-fullname','user-username','user-email','user-password'].forEach(id => {
      document.getElementById(id).value = '';
    });
    document.getElementById('user-role').value   = 'viewer';
    document.getElementById('user-status').value = 'true';
  }
  openModal('modal-user');
}

async function submitUser() {
  const id       = document.getElementById('user-id').value;
  const fullname = document.getElementById('user-fullname').value.trim();
  const username = document.getElementById('user-username').value.trim();
  const password = document.getElementById('user-password').value;
  const role     = document.getElementById('user-role').value;
  const email    = document.getElementById('user-email').value.trim();
  const isActive = document.getElementById('user-status').value === 'true';

  if (!username) { showToast('Username is required', 'error'); return; }
  if (!id && !password) { showToast('Password is required for new users', 'error'); return; }

  showLoading(true);
  try {
    if (id) {
      const update = { full_name: fullname||null, role, email: email||null, is_active: isActive };
      if (password) update.password_hash = password;
      const { error } = await sb.from('app_users').update(update).eq('id', id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await sb.from('app_users').insert({
        username, password_hash: password, full_name: fullname||null,
        role, email: email||null, is_active: isActive
      });
      if (error) throw new Error(error.message);
    }
    closeModal('modal-user');
    showToast('User saved', 'success');
    await loadUsers();
  } catch (e) {
    showToast('Error: ' + (e.message.includes('unique') ? 'Username already exists' : e.message), 'error');
  } finally {
    showLoading(false);
  }
}

async function deleteUser(id, username) {
  if (username === 'admin') { showToast('Cannot delete default admin', 'error'); return; }
  createConfirmModal('Delete User', `Delete user <span class="confirm-name">${esc(username)}</span>?`, async () => {
    showLoading(true);
    try {
      const { error } = await sb.from('app_users').delete().eq('id', id);
      if (error) throw new Error(error.message);
      showToast('User deleted', 'success');
      await loadUsers();
    } catch (e) {
      showToast('Error: ' + e.message, 'error');
    } finally {
      showLoading(false);
    }
  });
}

// ── Notifications ─────────────────────────────────────────────
async function loadNotifications() {
  if (!isAdmin()) return;

  // Load emails
  const { data: emails } = await sb.from('notification_emails').select('*').order('created_at');
  const tbody = document.getElementById('emails-tbody');
  if (!emails?.length) {
    tbody.innerHTML = '<tr><td colspan="4"><div class="empty-state"><div class="icon">📧</div><p>No notification emails added</p></div></td></tr>';
  } else {
    tbody.innerHTML = emails.map(e => `
      <tr>
        <td>${esc(e.email)}</td>
        <td><span class="badge ${e.is_active ? 'badge-active' : 'badge-expired'}">${e.is_active ? 'Active' : 'Paused'}</span></td>
        <td style="font-family:var(--font-mono);font-size:11px">${formatDate(e.created_at)}</td>
        <td class="actions-cell">
          <button class="btn btn-secondary btn-sm" onclick="toggleEmail('${e.id}',${!e.is_active})">${e.is_active ? '⏸ Pause' : '▶ Resume'}</button>
          <button class="btn btn-danger btn-sm" onclick="deleteEmail('${e.id}','${esc(e.email)}')">🗑</button>
        </td>
      </tr>
    `).join('');
  }

  // Load expiring docs for preview
  const today  = new Date().toISOString().split('T')[0];
  const future = new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0];
  const { data: expiring } = await sb.from('documents').select('*,categories(name)')
    .gte('expiry_date', today).lte('expiry_date', future).eq('notification_stopped', false);

  const expiringEl = document.getElementById('expiring-docs-notif');
  if (!expiring?.length) {
    expiringEl.innerHTML = '<div class="empty-state"><div class="icon">✅</div><p>No documents expiring in the next 30 days</p></div>';
  } else {
    expiringEl.innerHTML = `<div class="table-wrap"><table>
      <thead><tr><th>Document</th><th>Category</th><th>Expiry Date</th><th>Days Left</th><th>Notification</th></tr></thead>
      <tbody>${expiring.map(d => `
        <tr>
          <td>${esc(d.name)}</td>
          <td>${esc(d.categories?.name||'—')}</td>
          <td style="font-family:var(--font-mono)">${formatDate(d.expiry_date)}</td>
          <td>${expiryBadge(d.expiry_date)}</td>
          <td>
            <button class="btn btn-secondary btn-sm" onclick="toggleDocNotification('${d.id}',true)">🔕 Stop Alert</button>
          </td>
        </tr>
      `).join('')}</tbody>
    </table></div>`;
  }

  // Also load stopped-notification docs
  const { data: stopped } = await sb.from('documents').select('*,categories(name)')
    .eq('notification_stopped', true).gte('expiry_date', today);
  if (stopped?.length) {
    expiringEl.innerHTML += `<div style="margin-top:16px;font-family:var(--font-head);font-weight:700;font-size:13px;margin-bottom:8px">🔕 Notifications Stopped</div>
    <div class="table-wrap"><table>
      <thead><tr><th>Document</th><th>Expiry</th><th>Action</th></tr></thead>
      <tbody>${stopped.map(d => `
        <tr>
          <td>${esc(d.name)}</td>
          <td>${formatDate(d.expiry_date)}</td>
          <td><button class="btn btn-success btn-sm" onclick="toggleDocNotification('${d.id}',false)">🔔 Resume</button></td>
        </tr>
      `).join('')}</tbody>
    </table></div>`;
  }
}

function openEmailModal() {
  document.getElementById('new-email').value = '';
  openModal('modal-email');
}

async function submitEmail() {
  const email = document.getElementById('new-email').value.trim();
  if (!email || !email.includes('@')) { showToast('Please enter a valid email', 'error'); return; }

  showLoading(true);
  try {
    const { error } = await sb.from('notification_emails').insert({ email, added_by: currentUser.id });
    if (error) throw new Error(error.message.includes('unique') ? 'Email already exists' : error.message);
    closeModal('modal-email');
    showToast('Email added', 'success');
    await loadNotifications();
  } catch (e) {
    showToast('Error: ' + e.message, 'error');
  } finally {
    showLoading(false);
  }
}

async function toggleEmail(id, active) {
  await sb.from('notification_emails').update({ is_active: active }).eq('id', id);
  showToast(active ? 'Email resumed' : 'Email paused', 'info');
  await loadNotifications();
}

async function deleteEmail(id, email) {
  createConfirmModal('Delete Email', `Remove <span class="confirm-name">${esc(email)}</span> from notifications?`, async () => {
    await sb.from('notification_emails').delete().eq('id', id);
    showToast('Email removed', 'success');
    await loadNotifications();
  });
}

async function toggleDocNotification(docId, stop) {
  await sb.from('documents').update({ notification_stopped: stop }).eq('id', docId);
  showToast(stop ? 'Notification stopped for this document' : 'Notification resumed', 'info');
  await loadNotifications();
}

// ── Utility ───────────────────────────────────────────────────
function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
