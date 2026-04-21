// ===== AUTH CHECK =====
if (localStorage.getItem('userType') !== 'admin') {
  window.location.href = 'login.html';
}

document.getElementById('adminName').textContent = localStorage.getItem('adminUser') || 'Admin';

// ===== TAB NAVIGATION =====
document.querySelectorAll('.nav-item[data-tab]').forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    const tab = item.getAttribute('data-tab');
    
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    
    item.classList.add('active');
    document.getElementById(tab).classList.add('active');
    document.getElementById('pageTitle').textContent = item.textContent.trim();
    
    // Load data for the tab
    if (tab === 'staff-list') loadStaff();
    if (tab === 'patients') loadPatients();
    if (tab === 'reviews') loadReviews();
    if (tab === 'dashboard') loadDashboard();
  });
});

// ===== TOAST =====
function showToast(msg, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = 'toast show ' + type;
  setTimeout(() => toast.className = 'toast', 3000);
}

// ===== LOGOUT =====
function adminLogout() {
  if (!confirm('লগ আউট করবেন?')) return;
  localStorage.clear();
  window.location.href = 'login.html';
}

// ===== DASHBOARD =====
async function loadDashboard() {
  const { count: staffCount } = await supabaseClient.from('staff').select('*', { count: 'exact', head: true });
  const { count: patientCount } = await supabaseClient.from('patients').select('*', { count: 'exact', head: true });
  const { count: reviewCount } = await supabaseClient.from('reviews').select('*', { count: 'exact', head: true });
  const { count: activeCount } = await supabaseClient.from('staff').select('*', { count: 'exact', head: true }).eq('is_active', true);
  
  document.getElementById('totalStaff').textContent = staffCount || 0;
  document.getElementById('totalPatients').textContent = patientCount || 0;
  document.getElementById('totalReviews').textContent = reviewCount || 0;
  document.getElementById('activeStaff').textContent = activeCount || 0;
}
loadDashboard();

// ===== ADD STAFF =====
document.getElementById('addStaffForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector('button');
  btn.disabled = true;
  btn.textContent = 'অপেক্ষা করুন...';
  
  const name = document.getElementById('newName').value.trim();
  const email = document.getElementById('newEmail').value.trim();
  const mobile = document.getElementById('newMobile').value.trim();
  const password = document.getElementById('newPassword').value;
  const role = document.getElementById('newRole').value;
  
  try {
    // Create auth user
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: { data: { name, role, user_type: 'staff' } }
    });
    
    if (error) throw error;
    
    // Add to staff table
    const { error: dbError } = await supabaseClient.from('staff').insert([{
      user_id: data.user.id,
      name, email, mobile, role, is_active: true
    }]);
    
    if (dbError) throw dbError;
    
    showToast('Staff যোগ হয়েছে!', 'success');
    e.target.reset();
    
    // Sign out the newly created session (admin shouldn't be logged in as staff)
    await supabaseClient.auth.signOut();
    localStorage.setItem('userType', 'admin'); // restore
    
  } catch (err) {
    showToast(err.message || 'Error', 'error');
  }
  
  btn.disabled = false;
  btn.innerHTML = '<i class="fas fa-plus"></i> Staff যোগ করুন';
});

// ===== LOAD STAFF =====
async function loadStaff() {
  const tbody = document.querySelector('#staffTable tbody');
  tbody.innerHTML = '<tr><td colspan="6">লোড হচ্ছে...</td></tr>';
  
  const { data, error } = await supabaseClient.from('staff').select('*').order('created_at', { ascending: false });
  
  if (error || !data.length) {
    tbody.innerHTML = '<tr><td colspan="6">কোনো Staff নেই</td></tr>';
    return;
  }
  
  tbody.innerHTML = data.map(s => `
    <tr>
      <td>${s.name}</td>
      <td><span class="badge active">${s.role}</span></td>
      <td>${s.mobile}</td>
      <td>${s.email}</td>
      <td><span class="badge ${s.is_active ? 'active' : 'inactive'}">${s.is_active ? 'Active' : 'Inactive'}</span></td>
      <td>
        <button class="btn-toggle ${s.is_active ? 'deactivate' : 'activate'}" 
          onclick="toggleStatus('staff', '${s.id}', ${!s.is_active})">
          ${s.is_active ? 'Deactivate' : 'Activate'}
        </button>
      </td>
    </tr>
  `).join('');
}

// ===== LOAD PATIENTS =====
async function loadPatients() {
  const tbody = document.querySelector('#patientTable tbody');
  tbody.innerHTML = '<tr><td colspan="5">লোড হচ্ছে...</td></tr>';
  
  const { data, error } = await supabaseClient.from('patients').select('*').order('created_at', { ascending: false });
  
  if (error || !data.length) {
    tbody.innerHTML = '<tr><td colspan="5">কোনো রোগী নেই</td></tr>';
    return;
  }
  
  tbody.innerHTML = data.map(p => `
    <tr>
      <td>${p.name}</td>
      <td>${p.mobile}</td>
      <td>${p.issue || '-'}</td>
      <td><span class="badge ${p.is_active ? 'active' : 'inactive'}">${p.is_active ? 'Active' : 'Inactive'}</span></td>
      <td>
        <button class="btn-toggle ${p.is_active ? 'deactivate' : 'activate'}" 
          onclick="toggleStatus('patients', '${p.id}', ${!p.is_active})">
          ${p.is_active ? 'Deactivate' : 'Activate'}
        </button>
      </td>
    </tr>
  `).join('');
}

// ===== TOGGLE ACTIVE STATUS =====
async function toggleStatus(table, id, newStatus) {
  const { error } = await supabaseClient.from(table).update({ is_active: newStatus }).eq('id', id);
  
  if (error) {
    showToast('Error: ' + error.message, 'error');
    return;
  }
  
  showToast('Status আপডেট হয়েছে', 'success');
  if (table === 'staff') loadStaff();
  else loadPatients();
}

// ===== LOAD REVIEWS =====
async function loadReviews() {
  const list = document.getElementById('reviewList');
  list.innerHTML = '<p>লোড হচ্ছে...</p>';
  
  const { data, error } = await supabaseClient.from('reviews').select('*').order('created_at', { ascending: false });
  
  if (error || !data.length) {
    list.innerHTML = '<p>কোনো রিভিউ নেই</p>';
    return;
  }
  
  list.innerHTML = data.map(r => `
    <div class="review-item">
      <strong>${r.name}</strong>
      <div class="stars">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</div>
      <p>${r.message}</p>
      <div class="meta">📱 ${r.mobile} • ${new Date(r.created_at).toLocaleDateString('bn-BD')}</div>
    </div>
  `).join('');
}

