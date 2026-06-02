/* auth.js - custom username/password auth backed by Supabase table `app_users` */
(function () {
  const cfg = window.BNH_CONFIG;
  const sb = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_KEY);

  // Hardcoded primary admin (works even before DB seeding)
  const PRIMARY_ADMIN = { username: "admin", password: "Admin@1998" };

  async function sha256(str) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
  }
  async function hashPassword(pw, salt) {
    return await sha256(salt + ":" + pw);
  }
  function randSalt() {
    const a = new Uint8Array(16); crypto.getRandomValues(a);
    return Array.from(a).map(b => b.toString(16).padStart(2, "0")).join("");
  }

  const STORAGE_KEY = "bnh_current_user";

  async function ensurePrimaryAdmin() {
    // create primary admin row if missing
    const { data } = await sb.from("app_users").select("id").eq("username", "admin").maybeSingle();
    if (!data) {
      const salt = randSalt();
      const hash = await hashPassword(PRIMARY_ADMIN.password, salt);
      await sb.from("app_users").insert({
        name: "Primary Admin",
        mobile: "0000000000",
        username: "admin",
        password_hash: hash,
        password_salt: salt,
        role: "admin",
        status: "active"
      });
    }
  }

  async function register({ name, mobile, username, password }) {
    if (!name || !mobile || !username || !password) throw new Error("All fields required");
    if (!/^[0-9]{10}$/.test(mobile)) throw new Error("Mobile must be 10 digits");
    if (password.length < 6) throw new Error("Password must be at least 6 characters");

    const { data: exists } = await sb.from("app_users").select("id").eq("username", username).maybeSingle();
    if (exists) throw new Error("Username already taken");

    const salt = randSalt();
    const hash = await hashPassword(password, salt);
    const { error } = await sb.from("app_users").insert({
      name, mobile, username,
      password_hash: hash, password_salt: salt,
      role: null, status: "pending"
    });
    if (error) throw new Error(error.message);
  }

  async function login(username, password) {
    await ensurePrimaryAdmin();
    const { data: u, error } = await sb.from("app_users").select("*").eq("username", username).maybeSingle();
    if (error) throw new Error(error.message);
    if (!u) throw new Error("Invalid credentials");
    if (u.status === "pending") throw new Error("Account pending admin approval");
    if (u.status === "deactivated") throw new Error("Account deactivated. Contact admin.");
    const hash = await hashPassword(password, u.password_salt);
    if (hash !== u.password_hash) throw new Error("Invalid credentials");
    if (!u.role) throw new Error("No role assigned. Contact admin.");

    const session = {
      id: u.id, username: u.username, name: u.name,
      mobile: u.mobile, role: u.role, loginAt: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    return session;
  }

  function getCurrentUser() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch { return null; }
  }

  function logout() { localStorage.removeItem(STORAGE_KEY); }

  async function changePassword(curPw, newPw) {
    const cur = getCurrentUser(); if (!cur) throw new Error("Not logged in");
    if (newPw.length < 6) throw new Error("New password must be at least 6 characters");
    const { data: u } = await sb.from("app_users").select("*").eq("id", cur.id).maybeSingle();
    if (!u) throw new Error("User not found");
    const h = await hashPassword(curPw, u.password_salt);
    if (h !== u.password_hash) throw new Error("Current password incorrect");
    const salt = randSalt();
    const newHash = await hashPassword(newPw, salt);
    const { error } = await sb.from("app_users").update({ password_hash: newHash, password_salt: salt }).eq("id", cur.id);
    if (error) throw new Error(error.message);
  }

  // Admin helpers
  async function listUsers() {
    const { data, error } = await sb.from("app_users")
      .select("id,name,mobile,username,role,status,created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  }
  async function approveUser(id, role) {
    const { error } = await sb.from("app_users").update({ role, status: "active" }).eq("id", id);
    if (error) throw new Error(error.message);
  }
  async function setRole(id, role) {
    const { error } = await sb.from("app_users").update({ role }).eq("id", id);
    if (error) throw new Error(error.message);
  }
  async function setStatus(id, status) {
    const { error } = await sb.from("app_users").update({ status }).eq("id", id);
    if (error) throw new Error(error.message);
  }
  async function resetPassword(id, newPw) {
    if (newPw.length < 6) throw new Error("Password must be at least 6 characters");
    const salt = randSalt();
    const h = await hashPassword(newPw, salt);
    const { error } = await sb.from("app_users").update({ password_hash: h, password_salt: salt }).eq("id", id);
    if (error) throw new Error(error.message);
  }

  window.BNH = {
    sb, register, login, logout, getCurrentUser, changePassword,
    listUsers, approveUser, setRole, setStatus, resetPassword,
    ROLES: ["admin","accountant","reception","ot","pharmacy","lab","manager","viewer","other"]
  };
})();
