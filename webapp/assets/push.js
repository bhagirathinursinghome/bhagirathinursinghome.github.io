// assets/push.js — device-side push subscription helper
// Needs: supabase-js client `sb`, and the logged-in user object.
// Paste your VAPID *public* key below (see PUSH_SETUP.md).
const BNH_VAPID_PUBLIC_KEY = 'BA9AZpZzv2tjSCUaXPXS551Rz9M0YPSVEz-SLK2Je7PIzfeoR-HSIdbf4khIPMGQtRVJkKQ02qtLctV_OUV9OwM';

const BNH_PUSH = (() => {
  const supported = () =>
    'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

  function b64ToUint8(b64) {
    const pad = '='.repeat((4 - (b64.length % 4)) % 4);
    const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
    return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
  }

  async function saveSubscription(sb, user, sub) {
    const j = sub.toJSON();
    const { error } = await sb.from('push_subscriptions').upsert({
      endpoint: j.endpoint,
      p256dh: j.keys.p256dh,
      auth: j.keys.auth,
      username: user.username,
      role: user.role,
      user_agent: navigator.userAgent.slice(0, 200)
    }, { onConflict: 'endpoint' });
    if (error) throw error;
  }

  // Must be called from a click (iOS requires a user gesture to ask permission)
  async function enable(sb, user) {
    if (!supported()) throw new Error('This browser does not support notifications. On iPhone, install the app to the Home Screen first.');
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') throw new Error('Notification permission was not granted.');
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: b64ToUint8(BNH_VAPID_PUBLIC_KEY)
      });
    }
    await saveSubscription(sb, user, sub);
    return true;
  }

  // Call on every app load: refreshes username/role (e.g. after login switch)
  // and re-saves the subscription if permission is already granted.
  async function sync(sb, user) {
    if (!supported() || Notification.permission !== 'granted') return false;
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return false;
    await saveSubscription(sb, user, sub);
    return true;
  }

  return { supported, enable, sync };
})();
