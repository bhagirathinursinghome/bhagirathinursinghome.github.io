

// ===== AUTH CHECK =====
if (localStorage.getItem('userType') !== 'staff' || localStorage.getItem('staffRole') !== 'marketing') {
  window.location.href = 'login.html';
}
const staffNameValue = localStorage.getItem('staffName') || 'Staff';
document.getElementById('staffName').textContent = staffNameValue;
document.getElementById('staffNameMobile').textContent = staffNameValue;
// ===== GLOBAL VARS =====
let currentUser = null;
let cameraStream = null;
let capturedBlob = null;
let currentLocation = null;
let reportMap = null;

// Initialize
(async () => {
  const { data } = await supabaseClient.auth.getUser();
  currentUser = data.user;
  if (!currentUser) window.location.href = 'login.html';
  
  // Set default dates
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('fromDate').value = today;
  document.getElementById('toDate').value = today;
  document.getElementById('refFromDate').value = today;
  document.getElementById('refToDate').value = today;
  document.getElementById('scheduleDate').value = today;
  
  loadNotices();
  loadSchedule();
  loadMyFeedback();
})();

// ===== TAB NAVIGATION =====
document.querySelectorAll('.nav-item[data-tab]').forEach(item => {
// ===== UNIFIED TAB NAVIGATION =====
function switchToTab(tabName) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.getElementById(tabName).classList.add('active');
  
  // Update sidebar
  document.querySelectorAll('.sidebar .nav-item').forEach(n => {
    n.classList.toggle('active', n.getAttribute('data-tab') === tabName);
  });
  
  // Update bottom nav
  document.querySelectorAll('.bottom-nav-item').forEach(n => {
    n.classList.toggle('active', n.getAttribute('data-tab') === tabName);
  });
  
  // Update more menu
  document.querySelectorAll('.more-menu-item').forEach(n => {
    n.classList.toggle('active', n.getAttribute('data-tab') === tabName);
  });
  
  // Page title
  const titles = {
    home: 'Home - Visit Entry',
    report: 'Visit Report',
    notice: 'Notice & Offers',
    patient: 'Patient Referral',
    update: 'Doctor Update',
    feedback: 'Feedback'
  };
  document.getElementById('pageTitle').textContent = titles[tabName] || '';
  
  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
  
  // Load data
  if (tabName === 'report') setTimeout(loadReport, 100);
  if (tabName === 'notice') loadNotices();
  if (tabName === 'patient') loadReferrals();
  if (tabName === 'update') loadSchedule();
  if (tabName === 'feedback') loadMyFeedback();
}

// Attach to sidebar links
document.querySelectorAll('.sidebar .nav-item[data-tab]').forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    switchToTab(item.getAttribute('data-tab'));
  });
});

// Attach to bottom nav
document.querySelectorAll('.bottom-nav-item[data-tab]').forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    switchToTab(item.getAttribute('data-tab'));
  });
});

// More menu functions
function showMoreMenu() {
  document.getElementById('moreMenu').classList.add('show');
}
function hideMoreMenu(e) {
  if (e.target.id === 'moreMenu') {
    document.getElementById('moreMenu').classList.remove('show');
  }
}
function selectFromMore(tab) {
  switchToTab(tab);
  document.getElementById('moreMenu').classList.remove('show');
}

function showToast(msg, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = 'toast show ' + type;
  setTimeout(() => toast.className = 'toast', 3000);
}

function staffLogout() {
  if (!confirm('লগ আউট করবেন?')) return;
  supabaseClient.auth.signOut();
  localStorage.clear();
  window.location.href = 'login.html';
}

// ===== CAMERA & GEOLOCATION =====
async function startCamera() {
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({ 
      video: { facingMode: 'user', width: 800, height: 600 } 
    });
    const video = document.getElementById('camera');
    video.srcObject = cameraStream;
    video.style.display = 'block';
    document.getElementById('cameraControls').style.display = 'none';
    document.getElementById('captureControls').style.display = 'block';
    
    // Get location in parallel
    getLocation();
  } catch (err) {
    showToast('Camera access denied!', 'error');
    console.error(err);
  }
}

function getLocation() {
  const locInfo = document.getElementById('locationInfo');
  const locText = document.getElementById('locText');
  locInfo.style.display = 'block';
  locText.textContent = 'Location পাচ্ছি...';
  
  if (!navigator.geolocation) {
    locText.textContent = 'Geolocation সাপোর্ট নেই';
    return;
  }
  
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      currentLocation = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude
      };
      
      // Reverse geocoding (free, no API key)
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${currentLocation.latitude}&lon=${currentLocation.longitude}&format=json`);
        const data = await res.json();
        currentLocation.name = data.display_name || 'Unknown';
        locText.textContent = `📍 ${data.display_name?.substring(0, 60) || 'Location found'}...`;
      } catch {
        locText.textContent = `📍 ${currentLocation.latitude.toFixed(4)}, ${currentLocation.longitude.toFixed(4)}`;
      }
      checkSubmitReady();
    },
    (err) => {
      locText.textContent = 'Location error: ' + err.message;
      showToast('Location permission দরকার', 'error');
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

function capturePhoto() {
  const video = document.getElementById('camera');
  const canvas = document.getElementById('canvas');
  
  // Low resolution for storage saving
  canvas.width = 400;
  canvas.height = 300;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, 400, 300);
  
  // Compress heavily (0.3 quality = very small)
  canvas.toBlob(blob => {
    capturedBlob = blob;
    const url = URL.createObjectURL(blob);
    const preview = document.getElementById('preview');
    preview.src = url;
    preview.style.display = 'block';
    video.style.display = 'none';
    
    // Stop camera to save battery
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
      cameraStream = null;
    }
    
    document.getElementById('captureControls').style.display = 'none';
    document.getElementById('retakeControls').style.display = 'block';
    
    console.log('📸 Photo size:', (blob.size / 1024).toFixed(1), 'KB');
    checkSubmitReady();
  }, 'image/jpeg', 0.3);
}

function retakePhoto() {
  capturedBlob = null;
  document.getElementById('preview').style.display = 'none';
  document.getElementById('retakeControls').style.display = 'none';
  document.getElementById('cameraControls').style.display = 'block';
  checkSubmitReady();
}

function checkSubmitReady() {
  const btn = document.getElementById('submitBtn');
  btn.disabled = !(capturedBlob && currentLocation);
}

// ===== SUBMIT VISIT =====
document.getElementById('visitForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('submitBtn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
  
  const visitPerson = document.getElementById('visitPerson').value.trim();
  const remark = document.getElementById('remark').value.trim();
  
  try {
    // Upload image
    const fileName = `${currentUser.id}/${Date.now()}.jpg`;
    const { error: upErr } = await supabaseClient.storage
      .from('marketing-images')
      .upload(fileName, capturedBlob, { contentType: 'image/jpeg' });
    
    if (upErr) throw upErr;
    
    const { data: urlData } = supabaseClient.storage
      .from('marketing-images')
      .getPublicUrl(fileName);
    
    // Insert visit record
    const { error } = await supabaseClient.from('marketing_visits').insert([{
      staff_id: currentUser.id,
      staff_name: localStorage.getItem('staffName'),
      visit_person: visitPerson,
      remark,
      image_url: urlData.publicUrl,
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      location_name: currentLocation.name
    }]);
    
    if (error) throw error;
    
    showToast('Visit সংরক্ষিত হয়েছে!', 'success');
    
    // Reset form
    document.getElementById('visitForm').reset();
    retakePhoto();
    currentLocation = null;
    document.getElementById('locationInfo').style.display = 'none';
    
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
    console.error(err);
  }
  
  btn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Visit';
  checkSubmitReady();
});

// ===== LOAD REPORT =====
async function loadReport() {
// ===== LOAD REPORT =====
async function loadReport() {
  const from = document.getElementById('fromDate').value;
  const to = document.getElementById('toDate').value;
  
  const { data, error } = await supabaseClient
    .from('marketing_visits')
    .select('*')
    .eq('staff_id', currentUser.id)
    .gte('created_at', from + 'T00:00:00')
    .lte('created_at', to + 'T23:59:59')
    .order('created_at', { ascending: false });
  
  if (error) { showToast(error.message, 'error'); return; }
  
  // Summary
  document.getElementById('reportSummary').innerHTML = `
    <div class="summary-box"><h3>${data.length}</h3><p>Total Visits</p></div>
    <div class="summary-box"><h3>${new Set(data.map(d => d.visit_person)).size}</h3><p>Unique Persons</p></div>
    <div class="summary-box"><h3>${new Set(data.map(d => d.created_at?.split('T')[0])).size}</h3><p>Days Active</p></div>
  `;
  
  // Map
  if (reportMap) { reportMap.remove(); reportMap = null; }
  reportMap = L.map('map').setView([22.5726, 88.3639], 11);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
  }).addTo(reportMap);
  
  const markers = [];
  data.forEach(v => {
    if (v.latitude && v.longitude) {
      const m = L.marker([v.latitude, v.longitude]).addTo(reportMap);
      m.bindPopup(`
        <strong>${v.visit_person}</strong><br>
        ${new Date(v.created_at).toLocaleString('bn-BD')}<br>
        ${v.remark || ''}
      `);
      markers.push([v.latitude, v.longitude]);
    }
  });
  if (markers.length) reportMap.fitBounds(markers, { padding: [50, 50] });
  
  // Desktop Table
  const tbody = document.querySelector('#reportTable tbody');
  const cardsDiv = document.getElementById('reportCards');
  
  if (!data.length) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px;">কোনো visit নেই</td></tr>';
    cardsDiv.innerHTML = '<p style="text-align:center;color:#64748b;padding:20px;">কোনো visit নেই</p>';
    return;
  }
  
  tbody.innerHTML = data.map(v => `
    <tr>
      <td>${new Date(v.created_at).toLocaleString('bn-BD')}</td>
      <td>${v.visit_person}</td>
      <td>${(v.location_name || '').substring(0, 40)}...</td>
      <td>${v.remark || '-'}</td>
      <td><img src="${v.image_url}" class="photo-thumb" onclick="showImage('${v.image_url}')" /></td>
    </tr>
  `).join('');
  
  // Mobile Cards
  cardsDiv.innerHTML = data.map(v => `
    <div class="data-card">
      <div class="data-card-header">
        <strong><i class="fas fa-user"></i> ${v.visit_person}</strong>
        <img src="${v.image_url}" class="photo-thumb" onclick="showImage('${v.image_url}')" />
      </div>
      <div class="data-card-body">
        <div style="grid-column:1/-1;">
          <span class="label-tiny">📅 Date & Time</span>
          <span class="value">${new Date(v.created_at).toLocaleString('bn-BD')}</span>
        </div>
        <div style="grid-column:1/-1;">
          <span class="label-tiny">📍 Location</span>
          <span class="value">${v.location_name || `${v.latitude?.toFixed(4)}, ${v.longitude?.toFixed(4)}`}</span>
        </div>
        ${v.remark ? `
        <div style="grid-column:1/-1;">
          <span class="label-tiny">📝 Remark</span>
          <span class="value">${v.remark}</span>
        </div>` : ''}
      </div>
    </div>
  `).join('');
}
// ===== NOTICES =====
async function loadNotices() {
  const { data, error } = await supabaseClient
    .from('notices')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  
  const list = document.getElementById('noticeList');
  if (error || !data.length) {
    list.innerHTML = '<p style="text-align:center;color:#64748b;">কোনো নোটিস নেই</p>';
    return;
  }
  
  list.innerHTML = data.map(n => `
    <div class="notice-item ${n.type}">
      <h3><i class="fas fa-${n.type === 'offer' ? 'gift' : n.type === 'arrival' ? 'truck' : 'bullhorn'}"></i> ${n.title}</h3>
      <p>${n.content}</p>
      <div class="meta">📅 ${new Date(n.created_at).toLocaleDateString('bn-BD')}</div>
    </div>
  `).join('');
}

// ===== REFERRAL =====
document.getElementById('referralForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector('button');
  btn.disabled = true;
  
  try {
    const { error } = await supabaseClient.from('referrals').insert([{
      patient_name: document.getElementById('patientName').value.trim(),
      patient_mobile: document.getElementById('patientMobile').value.trim(),
      refer_name: document.getElementById('referName').value.trim(),
      issue: document.getElementById('referIssue').value.trim(),
      added_by: currentUser.id,
      added_by_name: localStorage.getItem('staffName')
    }]);
    
    if (error) throw error;
    
    showToast('Referral যোগ হয়েছে!', 'success');
    e.target.reset();
    loadReferrals();
  } catch (err) {
    showToast(err.message, 'error');
  }
  btn.disabled = false;
});

async function loadReferrals() {
  const from = document.getElementById('refFromDate').value;
  const to = document.getElementById('refToDate').value;
  
  const { data, error } = await supabaseClient
    .from('referrals')
    .select('*')
    .eq('added_by', currentUser.id)
    .gte('created_at', from + 'T00:00:00')
    .lte('created_at', to + 'T23:59:59')
    .order('created_at', { ascending: false });
  
  if (error) { showToast(error.message, 'error'); return; }
  
  const totalAmt = data.reduce((s, r) => s + parseFloat(r.refer_amount || 0), 0);
  const totalPaid = data.reduce((s, r) => s + parseFloat(r.paid_amount || 0), 0);
  const totalDue = totalAmt - totalPaid;
  
  document.getElementById('referralStats').innerHTML = `
    <div class="summary-box"><h3>${data.length}</h3><p>Referrals</p></div>
    <div class="summary-box"><h3>₹${totalAmt}</h3><p>Total</p></div>
    <div class="summary-box"><h3>₹${totalPaid}</h3><p>Paid</p></div>
    <div class="summary-box"><h3>₹${totalDue}</h3><p>Due</p></div>
  `;
  
  const tbody = document.querySelector('#referralTable tbody');
  const cardsDiv = document.getElementById('referralCards');
  
  if (!data.length) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:20px;">কোনো referral নেই</td></tr>';
    cardsDiv.innerHTML = '<p style="text-align:center;color:#64748b;padding:20px;">কোনো referral নেই</p>';
    return;
  }
  
  // Desktop Table
  tbody.innerHTML = data.map(r => {
    const due = parseFloat(r.refer_amount || 0) - parseFloat(r.paid_amount || 0);
    return `
      <tr>
        <td>${new Date(r.created_at).toLocaleDateString('bn-BD')}</td>
        <td>${r.patient_name}</td>
        <td>${r.refer_name}</td>
        <td>${r.issue || '-'}</td>
        <td>₹${r.refer_amount || 0}</td>
        <td>₹${r.paid_amount || 0}</td>
        <td>₹${due}</td>
        <td><span class="status-${r.payment_status}">${r.payment_status}</span></td>
      </tr>
    `;
  }).join('');
  
  // Mobile Cards
  cardsDiv.innerHTML = data.map(r => {
    const due = parseFloat(r.refer_amount || 0) - parseFloat(r.paid_amount || 0);
    return `
      <div class="data-card">
        <div class="data-card-header">
          <strong><i class="fas fa-user-injured"></i> ${r.patient_name}</strong>
          <span class="status-${r.payment_status}">${r.payment_status}</span>
        </div>
        <div class="data-card-body">
          <div><span class="label-tiny">Refer By</span><span class="value">${r.refer_name}</span></div>
          <div><span class="label-tiny">Date</span><span class="value">${new Date(r.created_at).toLocaleDateString('bn-BD')}</span></div>
          ${r.issue ? `<div style="grid-column:1/-1;"><span class="label-tiny">Issue</span><span class="value">${r.issue}</span></div>` : ''}
          <div><span class="label-tiny">Amount</span><span class="value">₹${r.refer_amount || 0}</span></div>
          <div><span class="label-tiny">Paid</span><span class="value" style="color:#10b981;">₹${r.paid_amount || 0}</span></div>
          <div><span class="label-tiny">Due</span><span class="value" style="color:${due > 0 ? '#ef4444' : '#10b981'};">₹${due}</span></div>
        </div>
      </div>
    `;
  }).join('');
              }

// ===== DOCTOR SCHEDULE =====
async function loadSchedule() {
  const date = document.getElementById('scheduleDate').value || new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabaseClient
    .from('doctor_schedule')
    .select('*')
    .eq('chamber_date', date)
    .order('start_time');
  
  const list = document.getElementById('scheduleList');
  if (error || !data.length) {
    list.innerHTML = '<p style="text-align:center;color:#64748b;">এই দিনে কোনো ডাক্তার নেই</p>';
    return;
  }
  
  list.innerHTML = data.map(d => `
    <div class="schedule-item ${d.status}">
      <div>
        <h4><i class="fas fa-user-md"></i> ${d.doctor_name}</h4>
        <p>${d.specialty || ''}</p>
        ${d.notes ? `<small>${d.notes}</small>` : ''}
      </div>
      <div>
        <div class="time">${d.start_time || ''} - ${d.end_time || ''}</div>
        <span class="status-${d.status === 'available' ? 'paid' : 'pending'}">${d.status}</span>
      </div>
    </div>
  `).join('');
}

// ===== FEEDBACK =====
document.getElementById('feedbackForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector('button');
  btn.disabled = true;
  
  try {
    const { error } = await supabaseClient.from('staff_feedback').insert([{
      staff_id: currentUser.id,
      staff_name: localStorage.getItem('staffName'),
      staff_role: 'marketing',
      type: document.getElementById('feedbackType').value,
      message: document.getElementById('feedbackMsg').value.trim()
    }]);
    
    if (error) throw error;
    showToast('Feedback পাঠানো হয়েছে!', 'success');
    e.target.reset();
    loadMyFeedback();
  } catch (err) {
    showToast(err.message, 'error');
  }
  btn.disabled = false;
});

async function loadMyFeedback() {
  const { data, error } = await supabaseClient
    .from('staff_feedback')
    .select('*')
    .eq('staff_id', currentUser.id)
    .order('created_at', { ascending: false });
  
  const list = document.getElementById('feedbackList');
  if (error || !data?.length) {
    list.innerHTML = '<p style="color:#64748b;">কোনো feedback নেই</p>';
    return;
  }
  
  list.innerHTML = data.map(f => `
    <div class="feedback-item ${f.status}">
      <strong>[${f.type}]</strong> ${f.message}
      <div style="font-size:0.85rem;color:#64748b;margin-top:5px;">
        ${new Date(f.created_at).toLocaleString('bn-BD')} • Status: ${f.status}
      </div>
    </div>
  `).join('');
}
