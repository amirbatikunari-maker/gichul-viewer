/* ═══════════════════════════════════════════════════════════════
   검수 화면용 — practicals 에 칸 추가 + 도우미 함수
   Supabase → SQL Editor 에 통째로 붙여넣고 한 번만 실행하면 됨.
   여러 번 실행해도 안전함 (있으면 건너뜀).
   ═══════════════════════════════════════════════════════════════ */

/* ── 1. 칸 추가 ───────────────────────────────────────────────
   st_q · st_a · st_sol   슬롯 상태 : empty | raw | draft | ok
   frags                  조각 배열 — 한 문항이 여러 장에 걸칠 때
   cand                   재업로드 후보 — 덮어쓰지 않고 여기 쌓임
   sol_ver · sol_by       해설 판 번호와 만든 모델
   src_hash               같은 파일 두 번 올리는 것 걸러내기            */
alter table public.practicals
  add column if not exists st_q     text,
  add column if not exists st_a     text,
  add column if not exists st_sol   text,
  add column if not exists frags    jsonb default '[]'::jsonb,
  add column if not exists cand     jsonb default '[]'::jsonb,
  add column if not exists sol_ver  int   default 0,
  add column if not exists sol_by   text,
  add column if not exists src_hash text;

/* ── 2. 지금 들어 있는 자료로 상태 채우기 ─────────────────────
   이미 뭔가 있는 슬롯은 draft(사람이 한 번 봐야 함), 빈 슬롯은 empty. */
update public.practicals set
  st_q = case when q_url is not null
                or coalesce(q_text,'') <> ''
                or coalesce(q_md,'')   <> '' then 'draft' else 'empty' end
  where st_q is null;

update public.practicals set
  st_a = case when a_url is not null
                or coalesce(a_text,'') <> ''
                or coalesce(a_md,'')   <> '' then 'draft' else 'empty' end
  where st_a is null;

update public.practicals set
  st_sol = case when coalesce(easy_md,'') <> '' then 'draft' else 'empty' end
  where st_sol is null;

alter table public.practicals
  alter column st_q   set default 'empty',
  alter column st_a   set default 'empty',
  alter column st_sol set default 'empty';

/* 격자를 그릴 때 회차 단위로 훑으므로 색인 하나 걸어 둠 */
create index if not exists practicals_sheet_idx
  on public.practicals (subject_id, year, session, no);


/* ── 3. 빈 번호 채우기 ────────────────────────────────────────
   «20번이 있으면 1~19번도 있어야 한다».
   그 회차의 가장 큰 번호까지 훑어서 빠진 번호를 빈 행으로 만든다.
   만든 개수를 돌려준다.                                            */
create or replace function public.fill_missing_items(
  p_subject bigint, p_year int, p_session int
) returns int
language plpgsql security invoker as $$
declare mx int; made int := 0;
begin
  select max(no) into mx from public.practicals
   where subject_id = p_subject and year = p_year and session = p_session;
  if mx is null then return 0; end if;

  insert into public.practicals (subject_id, year, session, no, st_q, st_a, st_sol)
  select p_subject, p_year, p_session, g, 'empty', 'empty', 'empty'
    from generate_series(1, mx) as g
   where not exists (
     select 1 from public.practicals p
      where p.subject_id = p_subject and p.year = p_year
        and p.session = p_session and p.no = g);

  get diagnostics made = row_count;
  return made;
end $$;


/* 한 과목의 모든 회차를 한 번에 */
create or replace function public.fill_missing_all(p_subject bigint)
returns int
language plpgsql security invoker as $$
declare r record; total int := 0;
begin
  for r in select distinct year, session from public.practicals
            where subject_id = p_subject
  loop
    total := total + public.fill_missing_items(p_subject, r.year, r.session);
  end loop;
  return total;
end $$;


/* ── 4. 쪼개기 ────────────────────────────────────────────────
   한 칸에 두 문항이 들어가 있을 때 쓴다.
   p_no 뒤의 번호를 전부 한 칸씩 밀고, p_no+1 자리에 빈 행을 만든다.

   ★ 번호를 바로 +1 하면 (subject,year,session,no) 고유키에 부딪힌다.
     그래서 잠깐 음수로 옮겼다가 되돌리는 두 걸음으로 민다.
     한 함수 안에서 도니 중간에 끊겨도 통째로 취소된다.            */
create or replace function public.split_item(
  p_subject bigint, p_year int, p_session int, p_no int
) returns int
language plpgsql security invoker as $$
begin
  update public.practicals set no = -no
   where subject_id = p_subject and year = p_year
     and session = p_session and no > p_no;

  update public.practicals set no = (-no) + 1
   where subject_id = p_subject and year = p_year
     and session = p_session and no < 0;

  insert into public.practicals (subject_id, year, session, no, st_q, st_a, st_sol)
  values (p_subject, p_year, p_session, p_no + 1, 'empty', 'empty', 'empty');

  return p_no + 1;
end $$;


/* ── 5. 번호 다시 매기기 ──────────────────────────────────────
   중간을 지워서 번호가 띄엄띄엄해졌을 때 1,2,3… 으로 다시 붙인다.
   지금 번호 순서는 그대로 지킨다.                                  */
create or replace function public.renumber_items(
  p_subject bigint, p_year int, p_session int
) returns int
language plpgsql security invoker as $$
declare moved int := 0;
begin
  /* 먼저 통째로 음수 쪽으로 피해 둔다 (고유키 충돌 방지) */
  update public.practicals set no = -no
   where subject_id = p_subject and year = p_year and session = p_session;

  with seq as (
    select id, row_number() over (order by -no) as rn
      from public.practicals
     where subject_id = p_subject and year = p_year
       and session = p_session and no < 0
  )
  update public.practicals p set no = s.rn
    from seq s where p.id = s.id;

  get diagnostics moved = row_count;
  return moved;
end $$;


/* ── 6. 문항 하나 지우기 ──────────────────────────────────────
   빈 행을 잘못 만들었을 때. 뒤 번호는 자동으로 안 당겨진다 —
   당기려면 5번 renumber_items 를 따로 부른다.                      */
create or replace function public.drop_item(
  p_subject bigint, p_year int, p_session int, p_no int
) returns int
language plpgsql security invoker as $$
declare n int;
begin
  delete from public.practicals
   where subject_id = p_subject and year = p_year
     and session = p_session and no = p_no;
  get diagnostics n = row_count;
  return n;
end $$;


/* ── 7. 로그인한 사람이 쓸 수 있게 ─────────────────────────── */
grant execute on function public.fill_missing_items(bigint,int,int) to authenticated;
grant execute on function public.fill_missing_all(bigint)           to authenticated;
grant execute on function public.split_item(bigint,int,int,int)     to authenticated;
grant execute on function public.renumber_items(bigint,int,int)     to authenticated;
grant execute on function public.drop_item(bigint,int,int,int)      to authenticated;


/* ── 확인 ─────────────────────────────────────────────────────
   아래를 따로 실행하면 회차별로 몇 개가 비었는지 볼 수 있음.

   select year, session,
          count(*)                                   as 문항수,
          count(*) filter (where st_q   = 'empty')   as 문제없음,
          count(*) filter (where st_a   = 'empty')   as 답없음,
          count(*) filter (where st_sol = 'empty')   as 해설없음
     from public.practicals
    group by year, session
    order by year desc, session desc;
   ───────────────────────────────────────────────────────────── */


/* ═══════════════════════════════════════════════════════════════
   추가분 (v212) — 두 번째로 돌릴 것.
   위 내용을 이미 돌리셨어도 이 아래만 다시 돌리면 됩니다.
   ═══════════════════════════════════════════════════════════════ */

/* ── 8. 빈 번호 채우기 — «몇 번까지» 를 정할 수 있게 ──────────
   여태는 그 회차에 이미 있는 «가장 큰 번호» 까지만 채웠다.
   그런데 자료가 3번·11~15번만 들어온 회차는 max 가 15 라서
   16~19번은 아예 만들어지지 않았다. 실기는 회차당 18~19문항이므로
   뒤쪽이 통째로 빠진 채로 «다 찼다» 처럼 보였다.
   이제 p_upto 로 «이 회차는 19문항» 이라고 알려 줄 수 있다.        */
drop function if exists public.fill_missing_items(bigint,int,int);

create or replace function public.fill_missing_items(
  p_subject bigint, p_year int, p_session int, p_upto int default null
) returns int
language plpgsql security invoker as $$
declare mx int; made int := 0;
begin
  select max(no) into mx from public.practicals
   where subject_id = p_subject and year = p_year and session = p_session;

  mx := greatest(coalesce(mx, 0), coalesce(p_upto, 0));
  if mx <= 0 then return 0; end if;
  if mx > 600 then mx := 600; end if;          -- 실수로 큰 값이 들어오는 것 막기

  insert into public.practicals (subject_id, year, session, no, st_q, st_a, st_sol)
  select p_subject, p_year, p_session, g, 'empty', 'empty', 'empty'
    from generate_series(1, mx) as g
   where not exists (
     select 1 from public.practicals p
      where p.subject_id = p_subject and p.year = p_year
        and p.session = p_session and p.no = g);

  get diagnostics made = row_count;
  return made;
end $$;

drop function if exists public.fill_missing_all(bigint);

create or replace function public.fill_missing_all(
  p_subject bigint, p_upto int default null
) returns int
language plpgsql security invoker as $$
declare r record; total int := 0;
begin
  for r in select distinct year, session from public.practicals
            where subject_id = p_subject
  loop
    total := total + public.fill_missing_items(p_subject, r.year, r.session, p_upto);
  end loop;
  return total;
end $$;


/* ── 9. 문항 옮기기 ───────────────────────────────────────────
   «회차 미상» 덩어리(연도 9001 같은 것)에 쌓여 있는 문항을
   실제 회차의 빈자리로 옮긴다.

   가는 자리에 이미 행이 있으면
     · 그 행이 «완전히 비어 있는 껍데기» 면 지우고 그 자리를 내준다
     · 자료가 들어 있으면 아무것도 안 하고 -1 을 돌려준다 (덮어쓰지 않음)   */
create or replace function public.move_item(
  p_subject bigint,
  p_from_year int, p_from_session int, p_from_no int,
  p_to_year   int, p_to_session   int, p_to_no   int
) returns int
language plpgsql security invoker as $$
declare tgt record;
begin
  select * into tgt from public.practicals
   where subject_id = p_subject and year = p_to_year
     and session = p_to_session and no = p_to_no;

  if found then
    if tgt.q_url is null and coalesce(tgt.q_text,'') = ''
       and tgt.a_url is null and coalesce(tgt.a_text,'') = ''
       and coalesce(tgt.easy_md,'') = ''
    then
      delete from public.practicals where id = tgt.id;   -- 빈 껍데기면 비켜 준다
    else
      return -1;                                          -- 자료가 있으면 손대지 않는다
    end if;
  end if;

  update public.practicals
     set year = p_to_year, session = p_to_session, no = p_to_no
   where subject_id = p_subject and year = p_from_year
     and session = p_from_session and no = p_from_no;

  return 1;
end $$;

grant execute on function public.fill_missing_items(bigint,int,int,int) to authenticated;
grant execute on function public.fill_missing_all(bigint,int)           to authenticated;
grant execute on function public.move_item(bigint,int,int,int,int,int,int) to authenticated;


/* ═══════════════════════════════════════════════════════════════
   추가분 (v216) — 세 번째로 돌릴 것.
   앞의 것을 이미 돌리셨어도 이 아래만 다시 돌리면 됩니다.
   ═══════════════════════════════════════════════════════════════ */

/* ── 10. 중복 표시 ────────────────────────────────────────────
   오고초려·핵심빈출은 기출에서 뽑아 모은 것이라 원본이 따로 있다.
   같은 문제가 두 군데에 앉아 있으면 격자에서 두 번 세어지고,
   한쪽만 해설이 붙어 있는 일도 생긴다.

   지우지 않고 «이건 어느 문항의 사본이다» 만 적어 둔다.
   원본을 잘못 골랐을 때 되돌릴 수 있어야 하기 때문이다.        */
alter table public.practicals
  add column if not exists dup_of bigint;

create index if not exists practicals_dup_idx
  on public.practicals (dup_of) where dup_of is not null;

comment on column public.practicals.dup_of is
  '이 행이 사본일 때, 원본 practicals.id. 비어 있으면 원본이거나 중복이 아님.';
