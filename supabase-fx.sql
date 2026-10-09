-- ════════════════════════════════════════════════════════════════
--  v348 · 📐 공식 창 — «내가 추가한 공식» · 문항 연결/빼기 를 기기끼리 맞추는 칸
--  Supabase → SQL Editor 에서 한 번만 Run. 안 돌려도 공식 창은 되고, 이 기기에만 저장됨.
-- ════════════════════════════════════════════════════════════════
alter table public.practical_subjects
  add column if not exists fx jsonb;

comment on column public.practical_subjects.fx is
  '공식 창 사용자 데이터 { items: {id: {name, tex, ko, sy, t, gone}}, links: {"문항id|공식id": {on, t}}, at }';
