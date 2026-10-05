/* ═══════════════════════════════════════════════════════════════
   v341 · 빌드 번호 한 번에 올리기

   쓰는 법 (gichul-viewer-main 폴더에서):
     node tools/bump.mjs v342

   하는 일
     1) sw.js            SHELL = "shell-v342"  → 기기들이 새 파일을 받아 감
     2) sw.js            PRACTICE_JS 목록을 practice/ 폴더 그대로 다시 만듦
     3) 워커 index.js     const BUILD = "v342"  → /health 에 찍히는 번호
     4) changelog/CHANGELOG-v342.md 빈 틀 (이미 있으면 안 건드림)

   예전엔 이 셋을 손으로 따로 올리다 보니 zip 은 v335 · sw 는 v338 · 워커는 v332 처럼
   서로 어긋나서 «지금 뭐가 깔려 있는지» 헷갈렸다.
   ═══════════════════════════════════════════════════════════════ */
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ver = (process.argv[2] || "").trim();
if (!/^v\d+$/.test(ver)) {
  console.error("사용법: node tools/bump.mjs v342   (v 다음에 숫자)");
  process.exit(1);
}

function patch(rel, re, to, what) {
  const p = join(ROOT, rel);
  const s = readFileSync(p, "utf8");
  if (!re.test(s)) { console.error(`✗ ${rel} 에서 ${what} 을(를) 못 찾음`); process.exit(1); }
  writeFileSync(p, s.replace(re, to));
  console.log(`✓ ${rel} — ${what}`);
}

patch("sw.js", /const SHELL = "shell-v\d+"/, `const SHELL = "shell-${ver}"`, `SHELL → shell-${ver}`);

const pj = readdirSync(join(ROOT, "practice")).filter(f => /\.js$/.test(f)).sort()
  .map(f => `"./practice/${f}"`).join(",");
patch("sw.js", /const PRACTICE_JS = \[[^\]]*\];/, `const PRACTICE_JS = [${pj}];`, `PRACTICE_JS 목록 (${pj.split(",").length}개)`);

patch("gichul-ai-worker/src/index.js", /const BUILD = "v\d+";/, `const BUILD = "${ver}";`, `워커 BUILD → ${ver}`);

const cl = join(ROOT, "changelog", `CHANGELOG-${ver}.md`);
if (!existsSync(cl)) {
  writeFileSync(cl, `# ${ver} — (제목)\n\n## 고침\n- \n\n## 파일\n- \n- sw.js(shell-${ver}) · 워커 BUILD ${ver}\n`);
  console.log(`✓ changelog/CHANGELOG-${ver}.md 틀 만듦`);
}
console.log(`\n끝. 워커 코드를 고쳤으면 gichul-ai-worker 에서 npx wrangler deploy 도 잊지 말 것.`);
