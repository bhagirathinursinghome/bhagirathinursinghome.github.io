// ===== TAB SWITCHING =====
function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.auth-section').forEach(s => s.classList.remove('active'));
  
  event.target.classList.add('active');
  document.getElementById(tab + 'Section').classList.add('active');
}

function switchSub(type) {
  document.querySelectorAll('.sub-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
  
  document.getElementById('patientLoginForm').classList.toggle('active', type === 'login');
  document.getElementById('patientSignupForm').classList.toggle('active', type === 'signup');
}

// ===== TOAST =====
function showToast(msg, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = 'toast show ' + type;
  setTimeout(() => toast.className = 'toast', 3000);
}

// Helper: mobile → fake email for Supabase auth
function mobileToEmail(mobile) {
  return `${mobile}@patient.nursing.local`;
}

// ===== PATIENT SIGNUP =====
document.getElementById('patientSignupForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = 'অপেক্ষা করুন...';
  
  const name = document.getElementById('signupName').value.trim();
  const mobile = document.getElementById('signupMobile').value.trim();
  const issue = document.getElementById('signupIssue').value.trim();
  const password = document.getElementById('signupPassword').value;
  
  try {
    // Create auth user with mobile-as-email trick
    const email = mobileToEmail(mobile);
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: { data: { name, mobile, user_type: 'patient' } }
    });
    
    if (error) throw error;
    
    // Save to patients table
    const { error: dbError } = await supabaseClient.from('patients').insert([{
      user_id: data.user.id,
      name, mobile, issue, email
    }]);
    
    if (dbError) throw dbError;
    
    showToast('সাইন আপ সফল! লগইন করুন', 'success');
    setTimeout(() => {
      document.querySelector('.sub-btn').click(); // switch to login
    }, 1500);
    
  } catch (err) {
    showToast(err.message || 'সাইন আপ ব্যর্থ', 'error');
  }
  
  btn.disabled = false;
  btn.textContent = 'সাইন আপ';
});

// ===== PATIENT LOGIN =====
document.getElementById('patientLoginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true;
  
  const mobile = document.getElementById('loginMobile').value.trim();
  const password = document.getElementById('loginPassword').value;
  
  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: mobileToEmail(mobile),
      password
    });
    
    if (error) throw error;
    
    // Check if patient active
    const { data: patient } = await supabaseClient
      .from('patients').select('is_active').eq('user_id', data.user.id).single();
    
    if (patient && !patient.is_active) {
      await supabaseClient.auth.signOut();
      throw new Error('আপনার একাউন্ট নিষ্ক্রিয়');
    }
    
    localStorage.setItem('userType', 'patient');
    showToast('লগইন সফল!', 'success');
    setTimeout(() => window.location.href = 'patient-dashboard.html', 1000);
    
  } catch (err) {
    showToast(err.message || 'লগইন ব্যর্থ', 'error');
  }
  
  btn.disabled = false;
  btn.textContent = 'লগইন করুন';
});

// ===== STAFF LOGIN =====
document.getElementById('staffLoginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true;
  
  const email = document.getElementById('staffEmail').value.trim();
  const password = document.getElementById('staffPassword').value;
  
  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) throw error;
    
    // Check staff role + active
    const { data: staff, error: sErr } = await supabaseClient
      .from('staff').select('*').eq('user_id', data.user.id).single();
    
    if (sErr || !staff) {
      await supabaseClient.auth.signOut();
      throw new Error('স্টাফ একাউন্ট পাওয়া যায়নি');
    }
    
    if (!staff.is_active) {
      await supabaseClient.auth.signOut();
      throw new Error('আপনার একাউন্ট নিষ্ক্রিয়');
    }
    
    localStorage.setItem('userType', 'staff');
    localStorage.setItem('staffRole', staff.role);
    localStorage.setItem('staffName', staff.name);
    
    showToast('লগইন সফল!', 'success');
    setTimeout(() => {
      // Redirect to role-based dashboard
      window.location.href = `staff-${staff.role}.html`;
    }, 1000);
    
  } catch (err) {
    showToast(err.message || 'লগইন ব্যর্থ', 'error');
  }
  
  btn.disabled = false;
  btn.textContent = 'লগইন করুন';
});

// ===== ADMIN LOGIN =====
// ===== ADMIN LOGIN (with debug) =====
document.getElementById('adminLoginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true;
  
  const username = document.getElementById('adminUsername').value.trim();
  const password = document.getElementById('adminPassword').value;
  
  console.log('🔍 Trying admin login:', username);
  
  try {
    const { data, error } = await supabaseClient
      .from('admins')
      .select('*')
      .eq('username', username);
    
    console.log('📦 Supabase response:', { data, error });
    
    if (error) {
      console.error('❌ Database error:', error);
      throw new Error('Database error: ' + error.message);
    }
    
    if (!data || data.length === 0) {
      console.warn('⚠️ No admin found with username:', username);
      throw new Error('Username পাওয়া যায়নি');
    }
    
    const admin = data[0];
    console.log('✅ Found admin:', admin.username);
    console.log('🔐 Password match?', admin.password_hash === password);
    
    if (admin.password_hash !== password) {
      throw new Error('ভুল password');
    }
    
    // Success
    localStorage.setItem('userType', 'admin');
    localStorage.setItem('adminUser', username);
    localStorage.setItem('adminLoginTime', Date.now());
    
    showToast('Admin লগইন সফল!', 'success');
    setTimeout(() => window.location.href = 'admin.html', 1000);
    
  } catch (err) {
    console.error('❌ Login failed:', err);
    showToast(err.message, 'error');
  }
  
  btn.disabled = false;
  btn.textContent = 'লগইন';
});

// ===== GOOGLE LOGIN =====
async function googleLogin() {
  const { error } = await supabaseClient.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin + '/patient-dashboard.html'
    }
  });
  if (error) showToast(error.message, 'error');
}

async function googleSignup() {
  // Same as login — we handle mobile collection on dashboard
  const { error } = await supabaseClient.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin + '/complete-profile.html'
    }
  });
  if (error) showToast(error.message, 'error');
}

