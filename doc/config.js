// ============================================================
// DocVault - Configuration
// Replace with your actual Supabase project URL and anon key
// ============================================================

const CONFIG = {
  SUPABASE_URL: 'https://plifpcylsclhgqqiukwp.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_qQRBDLAqOMP2RBPhH0NGaQ_TsqZWysh',

  // App Settings
  APP_NAME: 'DocVault',
  APP_VERSION: '1.0.0',

  // Session duration (hours)
  SESSION_DURATION_HOURS: 24,

  // Notification settings
  EXPIRY_WARNING_DAYS: 30,

  // Email service (using EmailJS - free tier)
  // Sign up at https://www.emailjs.com/
  // OR use Supabase Edge Functions for email
  EMAILJS_SERVICE_ID: 'service_43348br',
  EMAILJS_TEMPLATE_ID: 'template_c9f7fe8',
  EMAILJS_PUBLIC_KEY: 'QS9hEyAk1Bd_-9mLe1',

  // Default admin credentials (only used for first-time setup check)
  DEFAULT_ADMIN_USERNAME: 'admin',
  DEFAULT_ADMIN_PASSWORD: 'Admin@123',
};

// Supabase client initialization
// Loaded from CDN in HTML files
function getSupabaseClient() {
  if (typeof supabase === 'undefined') {
    console.error('Supabase client not loaded');
    return null;
  }
  return supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
}
