# v376 — 탭 제목에 버전 · 단답·소방 지우기 SQL

## 바뀐 것
- 브라우저 탭 제목: «실기 · 기출 해설 노트» → «기출_v376»
  - 필기 화면 «기출_v376 · 필기» · 변환 화면 «기출_v376 · 변환»
  - tools/bump.mjs 가 제목·window.GV_VER 도 같이 올림 (앞으로 버전 올릴 때 자동)
- supabase-drop-dandap-sobang.sql (새 파일): 단답(94NN년) · 소방설비기사(95NN년) 문항 통째로 지우기
  - ① 미리보기(개수) → ② begin~commit 지우기 → ③ 0 확인
  - 사본 표시(dup_of)는 풀고, 형광펜·주석·보관함 파일 목록도 같이 지움 · 진짜 기출은 안 건드림

## 파일
- practice.html · practice/p03.js · tools/bump.mjs · sw.js(shell-v376) · 워커 BUILD v376 · supabase-drop-dandap-sobang.sql
