/* =========================================================
   BizGrow AI — Shared utilities
   UI helpers (toasts, form errors), validation, trial math,
   and a thin data-access layer over Supabase tables.
   ========================================================= */

/* ---------------- Toasts ---------------- */
function showToast(message, type = "default") {
  const stack = document.getElementById("toastStack");
  if (!stack) return;
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.textContent = message;
  stack.appendChild(el);
  setTimeout(() => el.remove(), 4200);
}

function showFormMsg(elId, message, type = "error") {
  const el = document.getElementById(elId);
  if (!el) return;
  el.textContent = message;
  el.className = `form-msg show ${type}`;
}

function clearFormMsg(elId) {
  const el = document.getElementById(elId);
  if (!el) return;
  el.className = "form-msg";
  el.textContent = "";
}

/* ---------------- Field-level errors ---------------- */
function setFieldError(fieldId, message) {
  const wrap = document.getElementById(fieldId);
  if (!wrap) return;
  wrap.classList.add("field-error");
  const err = wrap.querySelector(".err-msg");
  if (err) err.textContent = message;
}

function clearFieldError(fieldId) {
  const wrap = document.getElementById(fieldId);
  if (!wrap) return;
  wrap.classList.remove("field-error");
  const err = wrap.querySelector(".err-msg");
  if (err) err.textContent = "";
}

function clearAllFieldErrors(formEl) {
  formEl.querySelectorAll(".field-error").forEach((f) => {
    f.classList.remove("field-error");
    const err = f.querySelector(".err-msg");
    if (err) err.textContent = "";
  });
}

/* ---------------- Validation ---------------- */
const Validate = {
  required(value) {
    return value != null && String(value).trim().length > 0;
  },
  email(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
  },
  minLength(value, n) {
    return String(value || "").trim().length >= n;
  },
  phone(value) {
    return /^[0-9+\-\s()]{7,15}$/.test(String(value).trim());
  }
};

/* ---------------- Friendly error mapping ---------------- */
function friendlyAuthError(err) {
  const msg = (err && err.message) || "";
  if (/invalid login credentials/i.test(msg)) return "Incorrect email or password.";
  if (/already registered|already exists/i.test(msg)) return "An account with this email already exists.";
  if (/rate limit/i.test(msg)) return "Too many attempts. Please wait a moment and try again.";
  if (/password/i.test(msg) && /short|weak|least/i.test(msg)) return "Please choose a stronger password.";
  if (!msg) return "Something went wrong. Please try again.";
  return "Something went wrong. Please try again.";
}

/* ---------------- Trial math ---------------- */
function getTrialInfo(subscription) {
  const days = (window.BIZGROW_CONFIG && window.BIZGROW_CONFIG.TRIAL_LENGTH_DAYS) || 7;
  if (!subscription) {
    return { status: "trial", daysRemaining: days, expired: false, planLabel: "Free Trial" };
  }
  const now = new Date();
  const trialEnd = subscription.trial_end ? new Date(subscription.trial_end) : null;
  const status = subscription.status || "trial";

  if (status === "active") {
    return { status: "active", daysRemaining: null, expired: false, planLabel: subscription.plan || "Paid Plan" };
  }

  if (!trialEnd) {
    return { status: "trial", daysRemaining: days, expired: false, planLabel: "Free Trial" };
  }

  const msRemaining = trialEnd.getTime() - now.getTime();
  const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));

  return {
    status: daysRemaining <= 0 ? "expired" : "trial",
    daysRemaining: Math.max(daysRemaining, 0),
    expired: daysRemaining <= 0,
    planLabel: "Free Trial",
    trialEnd
  };
}

function formatDate(dateLike) {
  if (!dateLike) return "—";
  const d = new Date(dateLike);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

/* ---------------- Auth guard ---------------- */
async function requireSession(redirectTo = "/login.html") {
  if (!window.supabaseClient) return null;
  const { data } = await window.supabaseClient.auth.getSession();
  if (!data || !data.session) {
    window.location.href = redirectTo;
    return null;
  }
  return data.session;
}

/* ---------------- Data access layer ---------------- */
const DB = {
  async getProfile(userId) {
    if (!window.supabaseClient) return null;
    const { data, error } = await window.supabaseClient
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    if (error) { console.error(error); return null; }
    return data;
  },

  async upsertProfile(profile) {
    const { data, error } = await window.supabaseClient
      .from("profiles")
      .upsert(profile, { onConflict: "id" })
      .select()
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async getBusiness(userId) {
    const { data, error } = await window.supabaseClient
      .from("businesses")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) { console.error(error); return null; }
    return data;
  },

  async upsertBusiness(business) {
    const { data, error } = await window.supabaseClient
      .from("businesses")
      .upsert(business, { onConflict: "user_id" })
      .select()
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async getSubscription(userId) {
    const { data, error } = await window.supabaseClient
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) { console.error(error); return null; }
    return data;
  },

  async createTrialSubscription(userId) {
    const days = (window.BIZGROW_CONFIG && window.BIZGROW_CONFIG.TRIAL_LENGTH_DAYS) || 7;
    const trialStart = new Date();
    const trialEnd = new Date(trialStart.getTime() + days * 24 * 60 * 60 * 1000);
    const { data, error } = await window.supabaseClient
      .from("subscriptions")
      .insert({
        user_id: userId,
        plan: "free_trial",
        status: "trial",
        trial_start: trialStart.toISOString(),
        trial_end: trialEnd.toISOString()
      })
      .select()
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async saveGeneratedContent(row) {
    const { data, error } = await window.supabaseClient
      .from("generated_content")
      .insert(row)
      .select()
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async listGeneratedContent(userId) {
    const { data, error } = await window.supabaseClient
      .from("generated_content")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) { console.error(error); return []; }
    return data || [];
  },

  async deleteGeneratedContent(id) {
    const { error } = await window.supabaseClient
      .from("generated_content")
      .delete()
      .eq("id", id);
    if (error) throw error;
  },

  async logUsage(userId, feature) {
    const { error } = await window.supabaseClient
      .from("usage")
      .insert({ user_id: userId, feature, usage_count: 1, usage_date: new Date().toISOString().slice(0, 10) });
    if (error) console.error(error);
  },

  async listUsage(userId) {
    const { data, error } = await window.supabaseClient
      .from("usage")
      .select("*")
      .eq("user_id", userId);
    if (error) { console.error(error); return []; }
    return data || [];
  }
};

window.BizGrowUtils = {
  showToast, showFormMsg, clearFormMsg,
  setFieldError, clearFieldError, clearAllFieldErrors,
  Validate, friendlyAuthError,
  getTrialInfo, formatDate, requireSession, DB
};
