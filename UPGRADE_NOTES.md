# 기출 해설 노트 — 변경 기록

## v86 (현재)

**고친 것**
- `wrangler.toml` 삭제. 이 저장소는 Cloudflare **Pages** 배포라 워커 설정이 필요 없는데,
  `main = "src/index.js"` 를 가리키는 파일이 남아 있어 빌드가 실패할 수 있었습니다.
- `config.js` 의 `AI_APP_KEY` 를 빈 값으로. 브라우저에 노출되는 값이라 여기 두면 의미가 없습니다.
  진짜 차단은 Worker 의 `REQUIRE_AUTH` / `ALLOWED_ORIGINS` 가 합니다.
- **완성도 점수를 실제 검사로 교체.** 이전 점수는 "링크가 있나 / 함수가 정의됐나"만 세어서
  앱이 고장 나도 100% 가 나왔습니다. 지금은 아래 4가지를 실제로 확인합니다.
  - 서비스워커가 실제로 등록·활성 상태인지
  - 로컬 저장소에 진짜로 쓰이는지 (시크릿 모드·용량 초과 감지)
  - `config.js` 값이 비어 있거나 임시값(`1234` 등)인지
  - AI 워커가 `/ai/health` 에 응답하는지
  아직 검사 전이면 해당 항목은 점수에서 **빼고** 구조 점수만 표시합니다.
- 출시 점검(L)·QA 센터(O)에도 위 4개 항목이 별도 행으로 나옵니다.
- `ai-chat.js` 를 sniper 쪽 최신본으로 통일. 두 저장소 복사본이 이미 갈라져 있었습니다.
- 캐시 참조 `?v=86`, `shell-v86` 동기화.

**남은 과제**
- `index.html` 285KB, `practice.html` 245KB. 페이지별 JS 분리를 권합니다.
- `ai-chat.js` 는 여전히 두 저장소에 복사본으로 존재합니다. 한쪽을 원본으로 정하고
  나머지는 배포 시 복사하는 방식이 안전합니다.

## v83–v85
- 출시 게이트 QA 패널, 계산기 회귀 테스트, 백업 경계 테스트 추가.
- 학습(`gichul:`/`prac:`) ↔ 면접(`iv-`/`iv:`) 데이터 격리.
- 서비스워커: HTML 은 네트워크 우선으로 전환해 새 배포가 바로 반영되도록 함.

## v87 follow-up
- `app-enhance.js` context menu now calls `window.openCmd()` so load order cannot trigger `openCmd is not defined`.
- Command palette action dispatcher keeps diagnostics/completion/self-test/release/QA actions inside `run()`.
- `config.js` provides a quiet Supabase fallback when the CDN is unavailable; pages remain usable for local/offline features and return explicit `SUPABASE_OFFLINE` errors for server actions.
- `shared/ai-chat.js` is the canonical copy; use `tools/sync-shared.sh` when changing the shared chat code.
- `tools/smoke-test.mjs` provides optional Chromium/Playwright E2E checks for all viewer screens.


## v88
- v86/v87 문제를 반영한 브라우저 런타임 QA 정리.
- 공용 AI chat 소스를 단일 canonical 파일로 동기화.
- tier alias 및 Worker 설정 QA 강화.
