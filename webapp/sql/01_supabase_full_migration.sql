-- ============================================================================
-- BHAGIRATHY NURSING HOME - COMPLETE MIGRATION SQL
-- Dynamic Pages Table (`app_pages`) + User-Wise Permissions (`user_page_permissions`)
-- + Automatic Migration of Existing Users based on their current roles
-- ============================================================================

BEGIN;

-- 1. Create `app_pages` table to store all menu pages & file locations
CREATE TABLE IF NOT EXISTS public.app_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  icon text NOT NULL DEFAULT '📄',
  page_path text NOT NULL UNIQUE,
  group_name text, -- NULL means pinned at top of sidebar (e.g., Home, My Profile)
  sort_order int NOT NULL DEFAULT 100,
  is_public boolean NOT NULL DEFAULT false, -- If true, visible to all logged-in users automatically
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 2. Create `user_page_permissions` table for granular per-user access
CREATE TABLE IF NOT EXISTS public.user_page_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  page_path text NOT NULL REFERENCES public.app_pages(page_path) ON DELETE CASCADE ON UPDATE CASCADE,
  can_view boolean NOT NULL DEFAULT false,
  can_entry boolean NOT NULL DEFAULT false,
  can_edit boolean NOT NULL DEFAULT false,
  can_delete boolean NOT NULL DEFAULT false,
  updated_by text DEFAULT 'system_migration',
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, page_path)
);

-- Index for fast menu loading by user_id
CREATE INDEX IF NOT EXISTS idx_user_page_perms_user_id ON public.user_page_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_app_pages_sort ON public.app_pages(is_active, sort_order);

-- Grant permissions matching your existing portal architecture
GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_pages TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_page_permissions TO anon, authenticated;

ALTER TABLE public.app_pages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_page_permissions DISABLE ROW LEVEL SECURITY;

-- 3. Salary extra deduction tracking (manual deductions with remarks)
CREATE TABLE IF NOT EXISTS public.salary_extra_deductions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  month int NOT NULL CHECK (month BETWEEN 1 AND 12),
  year int NOT NULL CHECK (year >= 2000),
  amount numeric(12,2) NOT NULL DEFAULT 0,
  remarks text,
  recorded_by text,
  recorded_by_name text,
  recorded_at timestamptz DEFAULT now(),
  UNIQUE(employee_id, month, year)
);

CREATE INDEX IF NOT EXISTS idx_salary_extra_deductions_emp_month_year
  ON public.salary_extra_deductions(employee_id, year, month);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.salary_extra_deductions TO anon, authenticated;
ALTER TABLE public.salary_extra_deductions DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 4. SEED ALL EXISTING PAGES FROM YOUR MENU.JS + NEW ADMIN PERMISSIONS PAGE
-- ============================================================================
INSERT INTO public.app_pages (label, icon, page_path, group_name, sort_order, is_public, is_active)
VALUES
  -- COMMON (Pinned Top, Public to all logged-in users)
  ('Home', '🏠', 'pages/home.html', NULL, 1, true, true),
  ('My Profile', '👤', 'pages/profile.html', NULL, 2, true, true),

  -- ADMINISTRATION
  ('Page & Access Control', '🔐', 'pages/admin-permissions.html', 'Administration', 5, false, true),
  ('DB Analytics', '🗄️', 'pages/supabase_analytics.html', 'Administration', 10, false, true),
  ('User Management', '🛡️', 'pages/admin-users.html', 'Administration', 11, false, true),
  ('DOCUMENTS', '🗄️', 'pages/document-vault.html', 'Administration', 12, false, true),
  ('Notification', '🔔', 'pages/send-notification.html', 'Administration', 13, false, true),

  -- VOUCHER
  ('Payment', '💵', 'pages/payment.html', 'Voucher', 20, false, true),
  ('Refer Payment', '💵', 'pages/refer_payment_by_case.html', 'Voucher', 21, false, true),
  ('Extra Out', '🧾', 'pages/extra_out.html', 'Voucher', 22, false, true),
  ('Cash Flow', '💰', 'pages/cash_flow.html', 'Voucher', 23, false, true),
  ('Day Work', '📅', 'pages/day_work.html', 'Voucher', 24, false, true),
  ('Credit Management', '💳', 'pages/add-credit.html', 'Voucher', 25, false, true),
  ('Voucher Register', '🧾', 'pages/Voucher_register.html', 'Voucher', 26, false, true),

  -- EMPLOYEES
  ('Employees', '👥', 'pages/employees.html', 'Employees', 30, false, true),
  ('Salary Sheet', '💰', 'pages/salary_sheet.html', 'Employees', 31, false, true),
  ('Attendance', '🕐', 'pages/attendance-admin.html', 'Employees', 32, false, true),
  ('Attendance Punch', '🕐', 'pages/attendance_punch.html', 'Employees', 33, true, true),

  -- OPD
  ('OPD Sales Upload', '📊', 'pages/opd_sales_upload.html', 'OPD', 40, false, true),
  ('OPD Refer Linker', '🔗', 'pages/opd_refer_linker.html', 'OPD', 41, false, true),
  ('Refer Amt Entry', '💊', 'pages/opd_refer_amount.html', 'OPD', 42, false, true),
  ('Cash Receipts Import', '📥', 'pages/cash_receipts_import.html', 'OPD', 43, false, true),
  ('OPD Refer Paid', '💵', 'pages/opd_refer_paid.html', 'OPD', 44, false, true),

  -- LAB
  ('Lab Test Master', '🧪', 'pages/lab_test_master.html', 'Lab', 50, false, true),
  ('Lab Work Entry', '🔬', 'pages/lab_work_entry.html', 'Lab', 51, false, true),
  ('Lab Agent Payments', '💳', 'pages/lab_agent_payments.html', 'Lab', 52, false, true),

  -- MARKETING
  ('Gramin Doctor Visit', '🏥', 'pages/gramin-visit.html', 'Marketing', 60, false, true),
  ('QUACK DOCTOR', '👨‍⚕️', 'pages/gramin-visit-manager.html', 'Marketing', 61, false, true),
  ('Call Refer', '📞', 'pages/call-refer.html', 'Marketing', 62, false, true),
  ('Refer Search', '🔎', 'pages/refer_search.html', 'Marketing', 63, false, true),

  -- IPD
  ('IPD - Admission', '🏥', 'pages/ipd-admission.html', 'IPD', 70, false, true),
  ('IPD - Documents', '📁', 'pages/ipd-documents.html', 'IPD', 71, false, true),
  ('IPD - Doctor Entry', '👨‍⚕️', 'pages/ipd-doctor-entry.html', 'IPD', 72, false, true),
  ('IPD - OT Entry', '🔬', 'pages/ipd-ot-entry.html', 'IPD', 73, false, true),
  ('IPD - Amount Entry', '💰', 'pages/ipd-amount-entry.html', 'IPD', 74, false, true),
  ('Package Entry', '💰', 'pages/ipd-package-entry.html', 'IPD', 75, false, true),
  ('IPD - Doctor Details', '📋', 'pages/ipd-doctor-details.html', 'IPD', 76, false, true),
  ('IPD - Cash & Discharge', '💵', 'pages/ipd-cash-discharge.html', 'IPD', 77, false, true),
  ('IPD - Medicine Sale', '💊', 'pages/ipd-medicine-sale.html', 'IPD', 78, false, true),
  ('IPD - Transactions', '🔄', 'pages/ipd-transactions.html', 'IPD', 79, false, true),
  ('IPD - Data Editor', '🛠', 'pages/ipd-data-editor.html', 'IPD', 80, false, true),

  -- PHARMACY
  ('Pharmacy Setup', '⚙️', 'pages/pharmacy-setup.html', 'Pharmacy', 90, false, true),
  ('Pharmacy Purchase', '🛒', 'pages/pharmacy-purchase-add.html', 'Pharmacy', 91, false, true),
  ('Other Purchase', '🛒', 'pages/pharmacy-other-purchases.html', 'Pharmacy', 92, false, true),
  ('Pharmacy Sale', '💊', 'pages/pharmacy-sale-add.html', 'Pharmacy', 93, false, true),
  ('Pharmacy Supplier', '💳', 'pages/pharmacy-suppliers.html', 'Pharmacy', 94, false, true),
  ('Pharmacy Voucher', '🧾', 'pages/pharmacy-voucher.html', 'Pharmacy', 95, false, true),
  ('Pharmacy Extra Pay', '💰', 'pages/pharmacy-extra-pay.html', 'Pharmacy', 96, false, true),

  -- REPORTS
  ('OPD Records', '📋', 'pages/opd_records.html', 'Reports', 100, false, true),
  ('IPD - Reports', '📊', 'pages/ipd-reports.html', 'Reports', 101, false, true),
  ('Pharmacy Reports', '📊', 'pages/pharmacy-reports.html', 'Reports', 102, false, true),
  ('Pharmecy Daily Sheet', '📊', 'pages/pharmacy-daily-sheet.html', 'Reports', 103, false, true),
  ('BHC Daily Sheet', '📊', 'pages/daily_sheet.html', 'Reports', 104, false, true),
  ('Dashboard', '📊', 'pages/dashboard.html', 'Reports', 99, false, true)
ON CONFLICT (page_path) DO UPDATE SET
  label = EXCLUDED.label,
  icon = EXCLUDED.icon,
  group_name = EXCLUDED.group_name,
  sort_order = EXCLUDED.sort_order,
  is_public = EXCLUDED.is_public;

-- ============================================================================
-- 5. MIGRATE EXISTING ROLE-BASED PERMISSIONS TO EXISTING USERS AUTOMATICALLY
-- This ensures all your current users in `app_users` immediately keep their
-- exact menu items and permissions without you having to click them one by one!
-- ============================================================================
WITH role_mapping (page_path, role_name, can_view, can_entry, can_edit, can_delete) AS (
  VALUES
    -- Common public pages
    ('pages/home.html', '*', true, true, false, false),
    ('pages/profile.html', '*', true, true, true, false),
    ('pages/attendance_punch.html', '*', true, true, false, false),

    -- Voucher & Accounts
    ('pages/payment.html', 'accountant', true, true, true, true),
    ('pages/payment.html', 'manager', true, true, true, false),
    ('pages/Voucher_register.html', 'accountant', true, true, true, true),
    ('pages/Voucher_register.html', 'manager', true, true, true, false),
    ('pages/refer_payment_by_case.html', 'accountant', true, true, true, false),
    ('pages/refer_payment_by_case.html', 'manager', true, true, true, false),
    ('pages/extra_out.html', 'accountant', true, true, true, false),
    ('pages/extra_out.html', 'reception', true, true, false, false),
    ('pages/cash_flow.html', 'accountant', true, true, true, false),
    ('pages/day_work.html', 'accountant', true, true, true, false),
    ('pages/add-credit.html', 'accountant', true, true, true, false),

    -- Employees
    ('pages/employees.html', 'accountant', true, true, true, true),
    ('pages/employees.html', 'manager', true, true, true, false),
    ('pages/employees.html', 'viewer', true, false, false, false),
    ('pages/salary_sheet.html', 'accountant', true, true, true, false),
    ('pages/attendance-admin.html', 'viewer', true, false, false, false),
    ('pages/attendance-admin.html', 'manager', true, true, true, false),

    -- OPD
    ('pages/opd_sales_upload.html', 'accountant', true, true, true, false),
    ('pages/opd_refer_linker.html', 'manager', true, true, true, false),
    ('pages/opd_refer_linker.html', 'accountant', true, true, true, false),
    ('pages/opd_refer_linker.html', 'reception', true, true, true, false),
    ('pages/opd_records.html', 'manager', true, true, true, false),
    ('pages/opd_records.html', 'accountant', true, true, true, false),
    ('pages/opd_records.html', 'reception', true, false, false, false),
    ('pages/opd_records.html', 'viewer', true, false, false, false),
    ('pages/opd_refer_amount.html', 'accountant', true, true, true, false),
    ('pages/opd_refer_amount.html', 'manager', true, true, true, false),
    ('pages/opd_refer_paid.html', 'accountant', true, true, true, false),
    ('pages/cash_receipts_import.html', 'accountant', true, true, true, false),

    -- Lab
    ('pages/lab_work_entry.html', 'manager', true, true, true, true),
    ('pages/lab_work_entry.html', 'lab', true, true, true, false),
    ('pages/lab_agent_payments.html', 'accountant', true, true, true, false),

    -- Marketing
    ('pages/gramin-visit.html', 'marketing', true, true, true, false),
    ('pages/gramin-visit.html', 'other', true, true, true, false),
    ('pages/gramin-visit.html', 'reception', true, true, true, false),
    ('pages/gramin-visit-manager.html', 'manager', true, true, true, false),
    ('pages/gramin-visit-manager.html', 'accountant', true, true, true, false),
    ('pages/gramin-visit-manager.html', 'viewer', true, false, false, false),
    ('pages/call-refer.html', 'manager', true, true, true, false),
    ('pages/call-refer.html', 'accountant', true, true, true, false),
    ('pages/call-refer.html', 'viewer', true, false, false, false),
    ('pages/call-refer.html', 'reception', true, true, false, false),
    ('pages/refer_search.html', 'accountant', true, false, false, false),
    ('pages/refer_search.html', 'manager', true, false, false, false),
    ('pages/refer_search.html', 'viewer', true, false, false, false),
    ('pages/refer_search.html', 'other', true, false, false, false),

    -- IPD
    ('pages/ipd-admission.html', 'accountant', true, true, true, false),
    ('pages/ipd-admission.html', 'reception', true, true, true, false),
    ('pages/ipd-documents.html', 'accountant', true, true, true, false),
    ('pages/ipd-documents.html', 'manager', true, true, true, false),
    ('pages/ipd-documents.html', 'reception', true, false, false, false),
    ('pages/ipd-doctor-entry.html', 'accountant', true, true, true, false),
    ('pages/ipd-ot-entry.html', 'accountant', true, true, true, false),
    ('pages/ipd-ot-entry.html', 'ot', true, true, true, false),
    ('pages/ipd-ot-entry.html', 'manager', true, true, true, false),
    ('pages/ipd-amount-entry.html', 'accountant', true, true, true, false),
    ('pages/ipd-amount-entry.html', 'manager', true, true, true, false),
    ('pages/ipd-package-entry.html', 'accountant', true, true, true, false),
    ('pages/ipd-package-entry.html', 'manager', true, true, true, false),
    ('pages/ipd-package-entry.html', 'reception', true, true, false, false),
    ('pages/ipd-doctor-details.html', 'accountant', true, false, false, false),
    ('pages/ipd-doctor-details.html', 'manager', true, false, false, false),
    ('pages/ipd-doctor-details.html', 'viewer', true, false, false, false),
    ('pages/ipd-cash-discharge.html', 'accountant', true, true, true, false),
    ('pages/ipd-cash-discharge.html', 'manager', true, true, true, false),
    ('pages/ipd-cash-discharge.html', 'reception', true, true, true, false),
    ('pages/ipd-reports.html', 'accountant', true, false, false, false),
    ('pages/ipd-reports.html', 'manager', true, false, false, false),
    ('pages/ipd-reports.html', 'viewer', true, false, false, false),
    ('pages/ipd-reports.html', 'reception', true, false, false, false),
    ('pages/ipd-medicine-sale.html', 'accountant', true, true, true, false),
    ('pages/ipd-medicine-sale.html', 'pharmacy', true, true, true, false),
    ('pages/ipd-transactions.html', 'accountant', true, true, true, false),

    -- Pharmacy
    ('pages/pharmacy-purchase-add.html', 'manager', true, true, true, false),
    ('pages/pharmacy-purchase-add.html', 'pharmacy', true, true, true, false),
    ('pages/pharmacy-purchase-add.html', 'accountant', true, true, true, false),
    ('pages/pharmacy-other-purchases.html', 'manager', true, true, true, false),
    ('pages/pharmacy-other-purchases.html', 'pharmacy', true, true, true, false),
    ('pages/pharmacy-other-purchases.html', 'accountant', true, true, true, false),
    ('pages/pharmacy-sale-add.html', 'manager', true, true, true, false),
    ('pages/pharmacy-sale-add.html', 'pharmacy', true, true, true, false),
    ('pages/pharmacy-sale-add.html', 'accountant', true, true, true, false),
    ('pages/pharmacy-suppliers.html', 'manager', true, true, true, false),
    ('pages/pharmacy-suppliers.html', 'pharmacy', true, true, true, false),
    ('pages/pharmacy-suppliers.html', 'accountant', true, true, true, false),
    ('pages/pharmacy-voucher.html', 'manager', true, true, true, false),
    ('pages/pharmacy-voucher.html', 'pharmacy', true, true, true, false),
    ('pages/pharmacy-voucher.html', 'accountant', true, true, true, false),
    ('pages/pharmacy-extra-pay.html', 'manager', true, true, true, false),
    ('pages/pharmacy-extra-pay.html', 'pharmacy', true, true, true, false),
    ('pages/pharmacy-extra-pay.html', 'accountant', true, true, true, false),
    ('pages/pharmacy-reports.html', 'accountant', true, false, false, false),
    ('pages/pharmacy-reports.html', 'pharmacy', true, false, false, false),
    ('pages/pharmacy-reports.html', 'viewer', true, false, false, false),
    ('pages/pharmacy-daily-sheet.html', 'accountant', true, true, true, false),
    ('pages/pharmacy-daily-sheet.html', 'pharmacy', true, true, true, false),
    ('pages/dashboard.html', 'accountant', true, false, false, false),
    ('pages/dashboard.html', 'manager', true, false, false, false),
    ('pages/daily_sheet.html', 'accountant', true, true, true, false)
)
INSERT INTO public.user_page_permissions (user_id, page_path, can_view, can_entry, can_edit, can_delete, updated_by)
SELECT
  u.id AS user_id,
  rm.page_path,
  rm.can_view,
  rm.can_entry,
  rm.can_edit,
  rm.can_delete,
  'role_migration'
FROM public.app_users u
JOIN role_mapping rm
  ON (rm.role_name = '*' OR lower(coalesce(u.role, '')) = rm.role_name)
WHERE lower(coalesce(u.role, '')) <> 'admin'
ON CONFLICT (user_id, page_path) DO NOTHING;

-- Also seed full permissions rows for any admin users
INSERT INTO public.user_page_permissions (user_id, page_path, can_view, can_entry, can_edit, can_delete, updated_by)
SELECT
  u.id AS user_id,
  p.page_path,
  true, true, true, true,
  'admin_migration'
FROM public.app_users u
CROSS JOIN public.app_pages p
WHERE lower(coalesce(u.role, '')) = 'admin'
ON CONFLICT (user_id, page_path) DO UPDATE SET
  can_view = true,
  can_entry = true,
  can_edit = true,
  can_delete = true;

COMMIT;
