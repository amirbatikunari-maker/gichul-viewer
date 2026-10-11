/* ═══════════════════════════════════════════════════════════════
   v353 · 옛 필기 문제(위험물 · 공조냉동 …) → 새 필기 화면(실기 엔진)으로 «복사»

   ── 하는 일 ──────────────────────────────────────────────
   · 옛 필기 과목마다 «… 필기» 이름의 새 과목을 만든다 (이미 있으면 그대로 씀)
   · 옛 문항을 새 과목으로 복사한다
       문제 칸  = 문제 글 + ①~④ 보기 (+ 그림이 있으면 그림 줄)
       답안 칸  = 정답 + 옛 해설
       쉬운풀이 = 옛 쉬운 해설 그대로
   · ★ 옛 표(questions · exams · subjects)는 한 글자도 안 건드림 — 지우지도 고치지도 않음
   · 같은 (과목 · 연도 · 회차 · 번호)가 이미 있으면 건너뜀 → 여러 번 돌려도 안전

   ── 쓰는 법 ──────────────────────────────────────────────
   Supabase → SQL Editor 에 통째로 붙여넣고 Run.
   끝에 과목별로 몇 문항이 들어갔는지 표가 나옴.
   ═══════════════════════════════════════════════════════════════ */

-- ① 새 과목 («… 필기»)
insert into public.practical_subjects (name, sort_order)
select n.nm, 900 + row_number() over (order by n.nm)
from (
  select distinct case when s.name like '%필기%' then s.name else s.name || ' 필기' end as nm
  from public.subject_list s
  where exists (select 1 from public.exam_list e join public.questions q on q.exam_id = e.id where e.subject_id = s.id)
) n
where not exists (select 1 from public.practical_subjects p where p.name = n.nm);

-- ② 문항 복사
insert into public.practicals (subject_id, year, session, no, q_md, q_text, a_md, a_text, easy_md, source, st_q, st_a)
select ps.id, e.year, coalesce(e.session, 0), q.number,
       -- 문제 칸: 문제 글 + 보기 + 그림
       coalesce(q.question_text, '')
         || coalesce(E'\n\n' || (select string_agg(chr(9311 + t.i::int) || ' ' || t.c, E'\n' order by t.i)
                                 from jsonb_array_elements_text(case when jsonb_typeof(to_jsonb(q.choices)) = 'array' then to_jsonb(q.choices) else '[]'::jsonb end)
                                      with ordinality t(c, i)), '')
         || coalesce(E'\n\n![그림](' || nullif(q.figure_url, '') || ')', ''),
       coalesce(q.question_text, ''),
       -- 답안 칸: 정답 + 옛 해설
       case when a.an is not null then '**정답 ' || chr(9311 + a.an) || '**' else '**정답** ' || coalesce(q.answer::text, '?') end
         || coalesce(E'\n\n' || nullif(q.explanation_md, ''), ''),
       case when a.an is not null then '정답 ' || chr(9311 + a.an) else '정답 ' || coalesce(q.answer::text, '?') end,
       nullif(q.explanation_easy, ''),
       nullif(q.subject_part::text, ''),
       'raw', 'raw'
from public.questions q
cross join lateral (select case when q.answer::text ~ '^[1-4]$' then q.answer::text::int end as an) a
join public.exam_list e     on e.id = q.exam_id
join public.subject_list s  on s.id = e.subject_id
join public.practical_subjects ps on ps.name = case when s.name like '%필기%' then s.name else s.name || ' 필기' end
where q.number is not null
on conflict (subject_id, year, session, no) do nothing;

-- ③ 결과
select ps.name as 과목, count(p.*) as 문항수
from public.practical_subjects ps
left join public.practicals p on p.subject_id = ps.id
where ps.name like '%필기%'
group by ps.name order by ps.name;
