/* ═══════════════════════════════════════════════════════════════
   v341 · 데이터베이스 자물쇠 (RLS) — 쓰기·지우기는 내 계정만

   ── 왜 ───────────────────────────────────────────────────
   config.js 의 anon 키는 원래 누구나 볼 수 있는 값이다. 그래서 진짜 자물쇠는
   테이블마다 걸린 RLS(행 단위 보안) 정책이다. 이게 꺼져 있거나 «아무나 허용»
   정책이 걸려 있으면, 키만 들고 문제·풀이·공부 기록을 고치거나 통째로 지울 수 있다.

   ── 이 파일이 만드는 상태 ──────────────────────────────
   · 문제·풀이·자료 표 (user_id 칸이 없는 표)
       읽기: 누구나 (지금처럼 로그인 없이 필기 뷰어를 볼 수 있게)
       쓰기·고치기·지우기: ADMIN 이메일 계정만
   · 면접·포트폴리오 표 (user_id 칸이 있는 표)
       «아무나 허용» 정책만 걷어내고, 남은 정책이 없으면 «자기 것만» 정책을 붙임
       (공유 링크 pf_shared 는 그대로 동작하도록 건드리지 않음 — 아래 참고)
   · 뷰(exam_list · subject_list 등): 뷰를 통한 쓰기를 막음 (뷰는 RLS 를 건너뛰기 때문)
   · 고치기용 함수(rpc): 로그인 안 한 사람은 못 부르게
   · 저장소 qfig(문제 그림): 올리기·바꾸기·지우기는 ADMIN 만, 보기는 그대로 공개

   ── 쓰는 법 ───────────────────────────────────────────────
   Supabase → SQL Editor 에서 ①②③ 중 필요한 칸만 골라서 «Run».
     ① 점검      — 읽기만 함. 지금 상태 확인용. 아무것도 안 바꿈
     ② 적용      — 자물쇠를 검. 지우는 정책은 모두 gv_policy_backup 에 먼저 저장
     ③ 되돌리기  — ② 이전 상태로 복구 (앱이 이상하면 바로 이것)
   여러 번 돌려도 안전함.

   ── 돌린 뒤 확인 ─────────────────────────────────────────
   1) 로그아웃 상태로 필기 뷰어(index) 열기 → 문제·그림이 보여야 정상
   2) 로그인 후 문제 하나 고쳐서 저장 → 저장돼야 정상
   3) 실기(practice)에서 회독 체크 → 저장돼야 정상
   4) 포트폴리오 공유 링크를 시크릿 창으로 열기 → 보여야 정상
   하나라도 안 되면 ③ 을 돌리고 알려 주세요.
   ═══════════════════════════════════════════════════════════════ */


/* ═══════════════════════════════════════════════════════════════
   ① 점검 — 읽기만 함 (이 칸만 드래그해서 Run)
   ═══════════════════════════════════════════════════════════════ */
-- 표·뷰마다 RLS 가 켜져 있는지, 정책이 몇 개인지
select c.relname                                   as 이름,
       case c.relkind when 'v' then '뷰' else '표' end as 종류,
       case when c.relkind = 'v' then '-' when c.relrowsecurity then '켜짐' else '★꺼짐★' end as rls,
       (select count(*) from pg_policies p where p.schemaname = 'public' and p.tablename = c.relname) as 정책수,
       exists (select 1 from information_schema.columns k
               where k.table_schema = 'public' and k.table_name = c.relname and k.column_name = 'user_id') as user_id칸
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind in ('r','p','v')
order by 2, 1;

-- 걸려 있는 정책 전부 (roles 에 anon/public 이 있고 qual 이 true 면 «아무나 허용»)
select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public' or (schemaname = 'storage' and tablename = 'objects')
order by 1, 2, 3;

-- 공유 함수가 security definer 인지 (true 여야 ② 가 pf_ 표를 손봐도 공유 링크가 안 깨짐)
select proname, prosecdef as security_definer
from pg_proc where pronamespace = 'public'::regnamespace and proname = 'pf_shared';


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
  ADMIN constant text := 'amirbatikunari@gmail.com';   -- ← 쓰기 허용 계정 (config.js ADMIN_EMAILS 와 같게)
  t record; p record;
  has_uid boolean; open_pol boolean; pf_definer boolean; n_left int;
begin
  select coalesce(bool_or(prosecdef), true) into pf_definer
    from pg_proc where pronamespace = 'public'::regnamespace and proname = 'pf_shared';

  for t in
    select c.relname as name, c.relrowsecurity as rls
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('r','p') and c.relname <> 'gv_policy_backup'
  loop
    has_uid := exists (select 1 from information_schema.columns
                       where table_schema = 'public' and table_name = t.name and column_name = 'user_id');

    if has_uid and t.name like 'pf\_%' and not pf_definer then
      raise notice '[건너뜀] % — pf_shared 가 security definer 가 아니라 공유 링크가 깨질 수 있어 손대지 않음', t.name;
      continue;
    end if;

    -- 지금 RLS 상태 기록 (되돌리기용) — 같은 표는 처음 한 번만
    if not exists (select 1 from public.gv_policy_backup where kind = 'rls' and schemaname = 'public' and tablename = t.name) then
      insert into public.gv_policy_backup(kind, schemaname, tablename, rls_was) values ('rls', 'public', t.name, t.rls);
    end if;
    execute format('alter table public.%I enable row level security', t.name);
    execute format('revoke truncate, references, trigger on public.%I from anon, authenticated', t.name);

    for p in select * from pg_policies where schemaname = 'public' and tablename = t.name and policyname not like 'gv\_%' loop
      open_pol := coalesce(nullif(trim(p.qual), ''), 'true') = 'true'
              and coalesce(nullif(trim(p.with_check), ''), 'true') = 'true';
      -- user_id 없는 표: 기존 정책 전부 걷고 gv_ 두 개로 대신 / user_id 있는 표: «아무나 허용» 만 걷음
      if (not has_uid) or open_pol then
        insert into public.gv_policy_backup(kind, schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check)
          values ('policy', 'public', t.name, p.policyname, p.permissive, p.roles, p.cmd, p.qual, p.with_check);
        execute format('drop policy %I on public.%I', p.policyname, t.name);
      end if;
    end loop;

    if not has_uid then
      execute format('drop policy if exists gv_read on public.%I', t.name);
      execute format('drop policy if exists gv_admin_write on public.%I', t.name);
      execute format('create policy gv_read on public.%I for select to anon, authenticated using (true)', t.name);
      execute format($f$create policy gv_admin_write on public.%I for all to authenticated
                        using (lower(auth.jwt() ->> 'email') = %L)
                        with check (lower(auth.jwt() ->> 'email') = %L)$f$, t.name, ADMIN, ADMIN);
    else
      select count(*) into n_left from pg_policies
        where schemaname = 'public' and tablename = t.name and policyname <> 'gv_owner';
      execute format('drop policy if exists gv_owner on public.%I', t.name);
      if n_left = 0 then
        execute format('create policy gv_owner on public.%I for all to authenticated
                          using (user_id = auth.uid()) with check (user_id = auth.uid())', t.name);
      end if;
    end if;
  end loop;

  -- 뷰: 읽기만 (자동 갱신 뷰는 주인 권한으로 표를 고칠 수 있어 RLS 를 건너뜀)
  for t in select c.relname as name from pg_class c join pg_namespace n on n.oid = c.relnamespace
           where n.nspname = 'public' and c.relkind = 'v' loop
    execute format('revoke insert, update, delete, truncate on public.%I from anon, authenticated', t.name);
  end loop;

  -- 함수: 로그인 안 한 사람은 못 부름 (공유용 pf_shared 만 예외). 확장(extension) 함수는 안 건드림
  for t in
    select fp.oid::regprocedure::text as sig, fp.proname
    from pg_proc fp
    where fp.pronamespace = 'public'::regnamespace and fp.prokind = 'f'
      and not exists (select 1 from pg_depend d where d.objid = fp.oid and d.deptype = 'e')
  loop
    if t.proname = 'pf_shared' then continue; end if;
    execute format('revoke execute on function %s from public, anon', t.sig);
    execute format('grant execute on function %s to authenticated', t.sig);
  end loop;

  raise notice '완료 — 위 «확인» 4가지를 해 보세요. 이상하면 ③ 되돌리기.';
end $$;

-- 저장소(qfig 그림) — 권한 문제로 실패해도 위 표 작업은 이미 끝난 상태
do $$
declare
  ADMIN constant text := 'amirbatikunari@gmail.com';
  p record;
begin
  for p in select * from pg_policies
           where schemaname = 'storage' and tablename = 'objects' and policyname not like 'gv\_%'
             and cmd <> 'SELECT' and (roles && array['anon','public']::name[]) loop
    insert into public.gv_policy_backup(kind, schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check)
      values ('policy', 'storage', 'objects', p.policyname, p.permissive, p.roles, p.cmd, p.qual, p.with_check);
    execute format('drop policy %I on storage.objects', p.policyname);
  end loop;
  drop policy if exists gv_qfig_read  on storage.objects;
  drop policy if exists gv_qfig_write on storage.objects;
  create policy gv_qfig_read on storage.objects for select to anon, authenticated using (bucket_id = 'qfig');
  execute format($f$create policy gv_qfig_write on storage.objects for all to authenticated
                    using (bucket_id = 'qfig' and lower(auth.jwt() ->> 'email') = %L)
                    with check (bucket_id = 'qfig' and lower(auth.jwt() ->> 'email') = %L)$f$, ADMIN, ADMIN);
  raise notice '저장소 qfig 자물쇠 완료';
exception when insufficient_privilege then
  raise notice '저장소 정책은 권한이 없어 못 바꿨습니다 — 대시보드 Storage → Policies 에서 qfig 의 anon 쓰기 정책을 지워 주세요. (표 자물쇠는 이미 적용됨)';
end $$;


/* ═══════════════════════════════════════════════════════════════
   ③ 되돌리기 — ② 이전으로 (이 칸만 드래그해서 Run)
   ═══════════════════════════════════════════════════════════════ */
do $$
declare b record; t record; roles_txt text;
begin
  -- 붙인 gv_ 정책 걷기
  for t in select schemaname, tablename, policyname from pg_policies
           where policyname like 'gv\_%' and (schemaname = 'public' or (schemaname = 'storage' and tablename = 'objects')) loop
    begin
      execute format('drop policy %I on %I.%I', t.policyname, t.schemaname, t.tablename);
    exception when insufficient_privilege then
      raise notice '권한 없음: %.% 의 % — 대시보드에서 지워 주세요', t.schemaname, t.tablename, t.policyname;
    end;
  end loop;

  -- 걷었던 정책 되살리기
  for b in select * from public.gv_policy_backup where kind = 'policy' order by id loop
    if exists (select 1 from pg_policies where schemaname = b.schemaname and tablename = b.tablename and policyname = b.policyname) then
      continue;
    end if;
    select string_agg(case when r = 'public' then 'public' else quote_ident(r) end, ', ') into roles_txt
      from unnest(b.roles) r;
    begin
      execute format('create policy %I on %I.%I as %s for %s to %s %s %s',
        b.policyname, b.schemaname, b.tablename, b.permissive, b.cmd, roles_txt,
        case when b.qual is not null then 'using (' || b.qual || ')' else '' end,
        case when b.with_check is not null then 'with check (' || b.with_check || ')' else '' end);
    exception when insufficient_privilege then
      raise notice '권한 없음: % 정책을 대시보드에서 다시 만들어 주세요', b.policyname;
    end;
  end loop;

  -- RLS 켜짐/꺼짐 원래대로
  for b in select * from public.gv_policy_backup where kind = 'rls' loop
    if exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
               where n.nspname = b.schemaname and c.relname = b.tablename) then
      execute format('alter table %I.%I %s row level security', b.schemaname, b.tablename,
                     case when b.rls_was then 'enable' else 'disable' end);
    end if;
  end loop;

  -- 함수 실행 권한을 Supabase 기본값(누구나)으로
  for t in select p.oid::regprocedure::text as sig from pg_proc p
           where p.pronamespace = 'public'::regnamespace and p.prokind = 'f'
             and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e') loop
    execute format('grant execute on function %s to public, anon, authenticated', t.sig);
  end loop;

  -- 뷰 쓰기 · 표 truncate 권한을 Supabase 기본값으로
  for t in select c.relname as name, c.relkind from pg_class c join pg_namespace n on n.oid = c.relnamespace
           where n.nspname = 'public' and c.relkind in ('r','p','v') and c.relname <> 'gv_policy_backup' loop
    if t.relkind = 'v' then
      execute format('grant insert, update, delete, truncate on public.%I to anon, authenticated', t.name);
    else
      execute format('grant truncate, references, trigger on public.%I to anon, authenticated', t.name);
    end if;
  end loop;

  delete from public.gv_policy_backup;
  raise notice '되돌리기 완료';
end $$;
