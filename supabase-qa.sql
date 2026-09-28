-- v314 · 📌 본문저장 — AI 에게 물은 Q&A 를 문항마다 쌓아 두는 칸
-- Supabase → SQL Editor 에 붙여넣고 Run 한 번. 다시 돌려도 안전함.
alter table public.practicals
  add column if not exists qa jsonb;

-- 값 모양: { "items": [ { "id": "...", "q": "질문", "a": "답(마크다운)", "at": 1759000000000 } ], "at": 1759000000000 }
-- 쌓인 문항만 빨리 찾게
create index if not exists practicals_qa_nn on public.practicals (subject_id) where qa is not null;

-- PostgREST 가 새 칸을 바로 알도록
notify pgrst, 'reload schema';
