/* =========================================================
   BizGrow AI — Supabase client
   Single shared client instance, built from the public config.
   Safe to run before other scripts because it only reads
   window.BIZGROW_CONFIG (no network calls at load time).
   ========================================================= */

(function () {
  const cfg = window.BIZGROW_CONFIG || {};

  if (!cfg.SUPABASE_URL || cfg.SUPABASE_URL.includes("YOUR-PROJECT")) {
    console.warn(
      "[BizGrow AI] Supabase is not configured yet. " +
      "Set SUPABASE_URL and SUPABASE_ANON_KEY in js/config.js. " +
      "Auth and database features will not work until then."
    );
  }

  window.supabaseClient = window.supabase
    ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      })
    : null;
})();
