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

// ... (아래쪽 생략) ...
  /* ─────────────────────────────────────────────
     AI 대화 상자
     ─────────────────────────────────────────────
     AI_WORKER_URL — 새로 배포한 AI 중계 Worker 주소.
       `npx wrangler deploy` 를 마치면 터미널에 찍히는 주소를 그대로 넣으세요.
       예: https://sniper-ai.amirbatikunari.workers.dev

     AI_APP_KEY — Worker 에 APP_KEY 시크릿을 등록했을 때만 채웁니다.
       ⚠ 이 값은 브라우저에서 보이므로 «비밀» 이 아닙니다.
         지나가던 사람이 주소만 알고 함부로 쓰는 걸 막는 문고리일 뿐,
         진짜 자물쇠는 Worker 의 ALLOWED_ORIGINS 입니다.

     AI_APP_NAME — 대화 기록을 앱별로 나눠 담는 이름표.
     ───────────────────────────────────────────── */
  AI_WORKER_URL: "https://sniper-ai.amirbatikunari.workers.dev",     // ← 여기에 Worker 주소를 넣으세요
  AI_APP_KEY: "",
  ADMIN_EMAILS:  ["amirbatikunari@gmail.com"],
  AI_APP_NAME:   "viewer",

  /* AI 를 쓸 수 있는 계정. AI 는 물어볼 때마다 요금이 붙으므로
     로그인한 사람만 쓰게 막아 둡니다.
     ⚠ 이 목록은 «화면을 잠그는» 용도일 뿐입니다.
       실제 차단은 Worker 의 REQUIRE_AUTH / ALLOWED_EMAILS 가 합니다.
     비워 두면 «로그인한 사람이면 누구나» 가 됩니다. */
  AI_ALLOWED_EMAILS: ["amirbatikunari@gmail.com"],
};
