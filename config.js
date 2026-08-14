/* ─────────────────────────────────────────────
   Supabase 값 (뷰어·업로더용)
   Supabase 대시보드 → Project Settings → API
   ⚠ service_role 키는 절대 넣지 말 것.

   Worker 주소 (PDF 변환용)
   기존에 쓰시던 주소 그대로입니다.
   ───────────────────────────────────────────── */
window.APP_CONFIG = {
  SUPABASE_URL: "https://nfyyctinvlytykucbgzk.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_tRyg8GTus9I2_wt-VSmaRA_6gbU-lt5",
  APP_TITLE: "기출 해설 노트",

  WORKER_URL:        "https://sniper-backend.amirbatikunari.workers.dev",
  WORKER_BACKUP_URL: "https://sniper-render.onrender.com",
};