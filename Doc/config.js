// ============================================================
// config.js — Supabase Configuration
// Replace the values below with your actual Supabase project details
// Found in: Supabase Dashboard > Project Settings > API
// ============================================================

const CONFIG = {
  SUPABASE_URL: 'https://tpnybejdtufduebkzrcb.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_94Bkj1_3KIjNs2K-M19f6A_yqvJNSGY',

  // App settings
  APP_NAME: 'DocVault',
  SESSION_KEY: 'docvault_session',

  // Notification settings
  EXPIRY_WARNING_DAYS: 30,

  // EmailJS config (for sending expiry notifications)
  // Sign up free at https://www.emailjs.com
  // Create a service + template, paste IDs below
  EMAILJS_SERVICE_ID: 'service_43348br',
  EMAILJS_TEMPLATE_ID: 'template_61gcvwb',
  EMAILJS_PUBLIC_KEY: 'QS9hEyAk1Bd_-9mLe',
};

// EmailJS Template variables expected:
// {{to_email}} — recipient
// {{subject}}  — email subject
// {{message}}  — HTML body with document list
