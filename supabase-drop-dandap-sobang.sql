-- ════════════════════════════════════════════════════════════════
--  단답(94NN년) · 소방설비기사(95NN년) 통째로 지우기
--    단답 2007~2025 = 9407~9425 · 소방 2023 = 9523 …
--  Supabase → SQL Editor 에서 돌림. 되돌릴 수 없음 — ① 먼저 돌려 개수 확인 후 ②
-- ════════════════════════════════════════════════════════════════

-- ① 미리 보기 (이것만 먼저 Run) ───────────────────────────────
select case when year between 9400 and 9499 then '단답' else '소방' end as 자료,
       min(year) as 첫해, max(year) as 끝해, count(*) as 문항수
  from public.practicals
 where year between 9400 and 9599
 group by 1
union all
select '진짜 기출 중 이 문항을 «원본» 으로 가리키는 사본 표시', null, null, count(*)
  from public.practicals
 where dup_of in (select id from public.practicals where year between 9400 and 9599)
   and year not between 9400 and 9599;


-- ② 지우기 (① 숫자가 맞으면 아래 begin ~ commit 을 통째로 선택해서 Run) ──
begin;

-- 지울 문항을 «원본» 으로 가리키던 사본 표시는 풀어 둔다
update public.practicals set dup_of = null
 where dup_of in (select id from public.practicals where year between 9400 and 9599)
   and year not between 9400 and 9599;

-- 그 문항에 붙은 형광펜·주석 / 그 연도로 올린 보관함 파일 (표가 있을 때만)
do $$
begin
  if to_regclass('public.practical_marks') is not null then
    delete from public.practical_marks
     where practical_id in (select id from public.practicals where year between 9400 and 9599);
  end if;
  if to_regclass('public.practical_files') is not null then
    delete from public.practical_files where year between 9400 and 9599;
  end if;
end $$;

-- 문항 자체
delete from public.practicals where year between 9400 and 9599;

commit;


-- ③ 확인 — 0 이 나와야 함
select count(*) as 남은_문항 from public.practicals where year between 9400 and 9599;

-- ④ 그림 파일(qfig 저장소)은 SQL 로 못 지움 → 사이트의 storage-clean.html
--    («저장소 정리») 를 열어 «어디에도 안 쓰이는 그림» 을 찾아 지우면 됨.
