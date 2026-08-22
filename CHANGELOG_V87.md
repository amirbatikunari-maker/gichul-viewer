# 기출뷰어 v87

- Runtime fix: `.app-context` uses `window.openCmd()`; no cross-scope `openCmd` ReferenceError.
- Runtime fix: command-palette `run()` action branches are kept inside the function; QA/diagnostics actions execute.
- Offline resilience: Supabase CDN failure no longer kills normal screens; the config fallback returns explicit offline errors instead.
- Canonical shared `ai-chat.js` source + sync helper.
- Optional Chromium/Playwright smoke-test runner for all primary screens.
