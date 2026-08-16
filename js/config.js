/* =========================================================
   BizGrow AI — Public runtime configuration
   =========================================================
   ONLY put PUBLIC values here (Supabase URL + anon key are
   safe to expose — they are protected by Row Level Security,
   not secrecy). NEVER put service-role keys or AI API keys
   in this file or anywhere in frontend code.
   ========================================================= */

window.BIZGROW_CONFIG = {
  // Replace with your Supabase project values (Project Settings → API)
  SUPABASE_URL: "https://YOUR-PROJECT.supabase.co",
  SUPABASE_ANON_KEY: "YOUR-SUPABASE-ANON-PUBLIC-KEY",

  // Name of the Supabase Edge Function that calls the AI provider
  // server-side. See supabase/functions/ai-generate/index.ts
  AI_FUNCTION_NAME: "ai-generate",

  // DEMO MODE: when true, the app never calls the AI edge function —
  // it uses realistic sample content generated entirely in the browser
  // (see js/ai.js). This lets you test the whole interface before any
  // AI API credentials exist. Flip to false once your edge function
  // and AI provider key are configured in Supabase.
  DEMO_MODE: true,

  TRIAL_LENGTH_DAYS: 7
};
