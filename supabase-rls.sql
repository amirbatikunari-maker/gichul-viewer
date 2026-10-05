/* ═══════════════════════════════════════════════════════════════
   v342 · 데이터베이스 자물쇠 (RLS) — 기출뷰어 표만 «콕 집어서»

   ★ v341 판(모든 표에 일괄 적용)은 쓰지 말 것 — 이 Supabase 는 SNIPER(blog_* · ai_* ·
     ai-files · blog 저장소)와 같이 쓰고 있어서, 일괄 적용하면 블로그 초안이 공개되고
     로그인해야 읽히던 practicals 가 오히려 누구나 읽게 열렸다.

   ── 점검 결과로 찾은 구멍 (2026-10-05) ────────────────────
   · ai_threads / ai_messages : [public ALL true] — 키만 있으면 누구나 AI 대화를 읽고·고치고·지움
   · ai-files 저장소           : [public INSERT] — 아무나 파일 올림 (용량·전송량 폭탄)
   · 문제·실기 표 쓰기 정책     : «로그인만 하면 누구나» (authenticated / auth.role())
       → Supabase 는 기본으로 «아무나 가입» 이 켜져 있어서, 키로 가입만 하면 다 고칠 수 있음
   · 뷰 exam_list · subject_list: 뷰를 통한 쓰기가 RLS 를 건너뜀

   ── 이 파일이 하는 일 (② 적용) ────────────────────────────
   · 기출뷰어 표 9개 (annotations · exams · questions · subjects · subject_notes ·
     practicals · practical_files · practical_marks · practical_subjects)
       읽기: «지금 걸린 읽기 조건 그대로» (공개는 공개, 로그인 필요는 로그인 필요)
       쓰기·고치기·지우기: ADMIN 계정만
   · ai_threads · ai_messages: 읽기·쓰기 모두 ADMIN 만 (AI 는 어차피 ADMIN 만 씀)
   · 뷰 2개: 뷰를 통한 쓰기 막음
   · 고치기용 함수 9개: 로그인 안 한 사람은 못 부름
   · 저장소: ai-files 올리기 · qfig 올리기/바꾸기/지우기(prac 폴더 포함) → ADMIN 만 (보기는 그대로)
   · 건드리지 않음: blog_* · iv_* · pf_* · blog 저장소 · iv-docs · pf_shared

   ── 쓰는 법 ───────────────────────────────────────────────
   Supabase → SQL Editor 에서 ①②③ 중 필요한 칸만 «드래그로 골라서» Run.
   (통째로 Run 하면 ③ 되돌리기까지 같이 돌아서 결국 아무것도 안 바뀜)
     ① 점검      — 읽기만 함
     ② 적용      — 지우는 정책은 모두 gv_policy_backup 에 먼저 저장
     ③ 되돌리기  — ② 이전으로
   여러 번 돌려도 안전함.

   ── 같이 할 것 (클릭 한 번 · 제일 효과 큼) ───────────────────
   Authentication → Sign In / Providers → «Allow new users to sign up» 끄기
   (앱에 회원가입 기능이 없음 — 확인함. 끄면 «로그인한 사람» = 내 계정뿐)

   ── 돌린 뒤 확인 ─────────────────────────────────────────
   1) 로그아웃 상태로 필기 뷰어(index) → 문제·그림 보이면 정상
   2) 로그인 후 문제 하나 고쳐 저장 → 저장되면 정상
   3) 실기(practice) 회독 체크 · 그림 올리기 → 되면 정상
   4) AI 대화 한 번 → 대화 목록에 남으면 정상
   5) SNIPER 블로그 열기 → 그대로면 정상
   하나라도 안 되면 ③ 돌리고 알려 주세요.
   ═══════════════════════════════════════════════════════════════ */


/* ═══════════════════════════════════════════════════════════════
   ① 점검 — 읽기만 함 (이 칸만 드래그해서 Run)
   ═══════════════════════════════════════════════════════════════ */
select '표' as 구분, c.relname as 이름,
       case when c.relkind = 'v' then '뷰'
            when c.relrowsecurity then 'RLS 켜짐' else '★RLS 꺼짐★' end as 상태,
       exists (select 1 from information_schema.columns k
               where k.table_schema = 'public' and k.table_name = c.relname
                 and k.column_name = 'user_id') as user_id칸,
       coalesce((select string_agg(p.policyname || ' [' || array_to_string(p.roles, ',') || ' ' || p.cmd || '] '
                                   || coalesce(p.qual, '-') || ' / ' || coalesce(p.with_check, '-'), '  ‖  ')
                 from pg_policies p
                 where p.schemaname = 'public' and p.tablename = c.relname), '(정책 없음)') as 정책
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind in ('r','p','v')
union all
select '저장소', p.policyname, p.cmd, null,
       array_to_string(p.roles, ',') || ' | ' || coalesce(p.qual, '-') || ' / ' || coalesce(p.with_check, '-')
from pg_policies p
where p.schemaname = 'storage' and p.tablename = 'objects'
order by 1, 2;


/* ═══════════════════════════════════════════════════════════════
   ② 적용 — 자물쇠 걸기 (이 칸만 드래그해서 Run)
   ═══════════════════════════════════════════════════════════════ */
create table if not exists public.gv_policy_backup (
  id          bigserial primary key,
  taken_at    timestamptz not null default now(),
  kind        text not null,              -- 'policy' | 'rls'
  schemaname  name not null,
  tablename   name not null,
  policyname  name,
  permissive  text,
  roles       name[],
  cmd         text,
  qual        text,
  with_check  text,
  rls_was     boolean
);
alter table public.gv_policy_backup enable row level security;   -- 정책 없음 = API 로는 아무도 못 봄
revoke all on public.gv_policy_backup from anon, authenticated;

do $$
declare
  ADMIN   constant text   := 'amirbatikunari@gmail.com';   -- ← 쓰기 허용 계정 (config.js ADMIN_EMAILS 와 같게)
  CONTENT constant text[] := array['annotations','exams','questions','subjects','subject_notes',
                                   'practicals','practical_files','practical_marks','practical_subjects'];
  PRIVATE constant text[] := array['ai_threads','ai_messages'];
  FUNCS   constant text[] := array['resync_status','fill_missing_items','fill_missing_all','split_item',
                                   'renumber_items','drop_item','move_item','set_exam_meta','upsert_exam_bundle'];
  tname text; p record; f record; is_private boolean; rls_now boolean; roles_txt text;
begin
  foreach tname in array CONTENT || PRIVATE loop
    select c.relrowsecurity into rls_now from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relname = tname and c.relkind in ('r','p');
    if not found then raise notice '[없음] % — 건너뜀', tname; continue; end if;
    is_private := tname = any(PRIVATE);

    if not exists (select 1 from public.gv_policy_backup where kind = 'rls' and schemaname = 'public' and tablename = tname) then
      insert into public.gv_policy_backup(kind, schemaname, tablename, rls_was) values ('rls', 'public', tname, rls_now);
    end if;
    execute format('alter table public.%I enable row level security', tname);

    for p in select * from pg_policies where schemaname = 'public' and tablename = tname and policyname not like 'gv\_%' loop
      -- 공개 표의 순수 읽기 정책은 그대로 둠. 나머지(쓰기 · ALL · 비공개 표의 모든 정책)는 백업 후 걷음
      if p.cmd = 'SELECT' and not is_private then continue; end if;
      insert into public.gv_policy_backup(kind, schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check)
        values ('policy', 'public', tname, p.policyname, p.permissive, p.roles, p.cmd, p.qual, p.with_check);
      execute format('drop policy %I on public.%I', p.policyname, tname);

      -- ALL 정책은 읽기도 겸하고 있었으므로, 읽기 부분만 같은 조건으로 되살림 (읽기 범위 그대로)
      if p.cmd = 'ALL' and not is_private then
        select string_agg(case when r = 'public' then 'public' else quote_ident(r) end, ', ') into roles_txt from unnest(p.roles) r;
        execute format('drop policy if exists %I on public.%I', left('gv_read_' || p.policyname, 63), tname);
        execute format('create policy %I on public.%I as %s for select to %s using (%s)',
                       left('gv_read_' || p.policyname, 63), tname, p.permissive, roles_txt, coalesce(p.qual, 'true'));
      end if;
    end loop;

    execute format('drop policy if exists gv_admin on public.%I', tname);
    execute format($f$create policy gv_admin on public.%I for all to authenticated
                      using (lower(auth.jwt() ->> 'email') = %L)
                      with check (lower(auth.jwt() ->> 'email') = %L)$f$, tname, ADMIN, ADMIN);
  end loop;

  -- 뷰: 읽기만
  foreach tname in array array['exam_list','subject_list'] loop
    if exists (select 1 from pg_views where schemaname = 'public' and viewname = tname) then
      execute format('revoke insert, update, delete, truncate on public.%I from anon, authenticated', tname);
    end if;
  end loop;

  -- 고치기용 함수: 로그인한 사람만
  for f in select fp.oid::regprocedure::text as sig from pg_proc fp
           where fp.pronamespace = 'public'::regnamespace and fp.proname = any(FUNCS) loop
    execute format('revoke execute on function %s from public, anon', f.sig);
    execute format('grant execute on function %s to authenticated', f.sig);
  end loop;

  raise notice '표 자물쇠 완료 — 파일 맨 위 «확인» 5가지를 해 보세요. 이상하면 ③.';
end $$;

-- 저장소 (ai-files 올리기 · qfig 쓰기) — 권한 문제로 실패해도 위 표 작업은 이미 끝난 상태
do $$
declare
  ADMIN constant text := 'amirbatikunari@gmail.com';
  p record;
begin
  for p in select * from pg_policies
           where schemaname = 'storage' and tablename = 'objects'
             and policyname in ('ai-files write', 'qfig write', 'prac files write') loop   -- prac files write = qfig/prac/ 폴더 «로그인한 누구나» 쓰기
    insert into public.gv_policy_backup(kind, schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check)
      values ('policy', 'storage', 'objects', p.policyname, p.permissive, p.roles, p.cmd, p.qual, p.with_check);
    execute format('drop policy %I on storage.objects', p.policyname);
  end loop;
  drop policy if exists gv_qfig_write    on storage.objects;
  drop policy if exists gv_aifiles_write on storage.objects;
  execute format($f$create policy gv_qfig_write on storage.objects for all to authenticated
                    using (bucket_id = 'qfig' and lower(auth.jwt() ->> 'email') = %L)
                    with check (bucket_id = 'qfig' and lower(auth.jwt() ->> 'email') = %L)$f$, ADMIN, ADMIN);
  execute format($f$create policy gv_aifiles_write on storage.objects for insert to authenticated
                    with check (bucket_id = 'ai-files' and lower(auth.jwt() ->> 'email') = %L)$f$, ADMIN);
  raise notice '저장소 자물쇠 완료';
exception when insufficient_privilege then
  raise notice '저장소 정책은 권한이 없어 못 바꿨습니다 — 대시보드 Storage → Policies 에서 «ai-files write» 를 지워 주세요. (표 자물쇠는 이미 적용됨)';
end $$;


/* ═══════════════════════════════════════════════════════════════
   ③ 되돌리기 — ② 이전으로 (이 칸만 드래그해서 Run)
   ═══════════════════════════════════════════════════════════════ */
do $$
declare b record; t record; roles_txt text; tname text;
  FUNCS constant text[] := array['resync_status','fill_missing_items','fill_missing_all','split_item',
                                 'renumber_items','drop_item','move_item','set_exam_meta','upsert_exam_bundle'];
begin
  for t in select schemaname, tablename, policyname from pg_policies
           where policyname like 'gv\_%' and (schemaname = 'public' or (schemaname = 'storage' and tablename = 'objects')) loop
    begin
      execute format('drop policy %I on %I.%I', t.policyname, t.schemaname, t.tablename);
    exception when insufficient_privilege then
      raise notice '권한 없음: %.% 의 % — 대시보드에서 지워 주세요', t.schemaname, t.tablename, t.policyname;
    end;
  end loop;

  for b in select * from public.gv_policy_backup where kind = 'policy' order by id loop
    if exists (select 1 from pg_policies where schemaname = b.schemaname and tablename = b.tablename and policyname = b.policyname) then
      continue;
    end if;
    select string_agg(case when r = 'public' then 'public' else quote_ident(r) end, ', ') into roles_txt from unnest(b.roles) r;
    begin
      execute format('create policy %I on %I.%I as %s for %s to %s %s %s',
        b.policyname, b.schemaname, b.tablename, b.permissive, b.cmd, roles_txt,
        case when b.qual is not null then 'using (' || b.qual || ')' else '' end,
        case when b.with_check is not null then 'with check (' || b.with_check || ')' else '' end);
    exception when insufficient_privilege then
      raise notice '권한 없음: % 정책을 대시보드에서 다시 만들어 주세요', b.policyname;
    end;
  end loop;

  for b in select * from public.gv_policy_backup where kind = 'rls' loop
    if exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
               where n.nspname = b.schemaname and c.relname = b.tablename) then
      execute format('alter table %I.%I %s row level security', b.schemaname, b.tablename,
                     case when b.rls_was then 'enable' else 'disable' end);
    end if;
  end loop;

  foreach tname in array array['exam_list','subject_list'] loop
    if exists (select 1 from pg_views where schemaname = 'public' and viewname = tname) then
      execute format('grant insert, update, delete, truncate on public.%I to anon, authenticated', tname);
    end if;
  end loop;

  for t in select fp.oid::regprocedure::text as sig from pg_proc fp
           where fp.pronamespace = 'public'::regnamespace and fp.proname = any(FUNCS) loop
    execute format('grant execute on function %s to public, anon, authenticated', t.sig);
  end loop;

  delete from public.gv_policy_backup;
  raise notice '되돌리기 완료';
end $$;
