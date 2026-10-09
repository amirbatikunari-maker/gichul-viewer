/* ═══════════════════════════════════════════════════════════════
   v347 · 📐 공식 모음 — 미니맵 옆 «📐 공식» 단추 → 맨 위에 뜨는 창
   · 이 문제   : 지금 문항에 필요한 공식(정석식) + 해설에 쓴 기호식
   · 공식별    : 단원 → 공식 → 그 공식이 나온 문항(19년 3회 7번 …) — 누르면 그 문항으로
   · 번호별    : 회차 → 번호 → 그 문항의 공식
   · 순서·위치만 바뀐 식(I = P/(√3V cosθ) 등)은 «다른 모양» 으로 정석식 밑에 묶음
   · 문항 ↔ 공식 짝짓기는 문제·답안·해설 글의 낱말로 (그 자리에서 · 서버·AI 안 씀)
   · 창은 끌어 옮기고 크기 조절 · 자리·크기·탭은 이 기기에 기억 (prac:fx:v1)
   ═══════════════════════════════════════════════════════════════ */
(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=t=>String(t==null?'':t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const R=String.raw;
const q_=e=>{ try{ globalThis.__q?.(e) }catch(x){} };

/* ══ ① 공식 목록 (정석식) ══
   m.q  : 문제 글(+유형 이름)에서 찾을 말
   m.a  : 답안·해설 글에서 찾을 말
   m.x  : 어디든(문제+답안+해설)
   m.no : 이 말이 있으면 아님
   정의된 것은 모두 맞아야 짝지음. basic=true 는 «기본식» (여러 문항에 두루 쓰임 — 이 문제 탭에서 뒤로) */
const LIB=[
/* ── 전력·역률 ── */
{id:'p3',cat:'전력·역률',name:'3상 유효전력',tex:R`P=\sqrt{3}\,V I\cos\theta`,
 alt:[R`I=\dfrac{P}{\sqrt{3}\,V\cos\theta}`,R`P_a=\sqrt{3}\,VI\;(\text{피상}),\quad Q=\sqrt{3}\,VI\sin\theta\;(\text{무효})`],
 v:'V 선간전압 · I 선전류 · cosθ 역률',basic:1,
 m:{q:/3\s*상|3\s*[φΦ∅ϕ]/,x:/(√\s*3|\\sqrt\s*\{?\s*3)[^\n]{0,60}(cos|역률|0\.\d)|역률/}},
{id:'p1',cat:'전력·역률',name:'단상 유효전력',tex:R`P=VI\cos\theta`,alt:[R`I=\dfrac{P}{V\cos\theta}`],
 v:'V 전압 · I 전류 · cosθ 역률',basic:1,m:{q:/단상/,x:/역률|cos/}},
{id:'pq',cat:'전력·역률',name:'피상·유효·무효전력 관계',tex:R`P_a=\sqrt{P^2+Q^2},\quad \cos\theta=\dfrac{P}{P_a},\quad Q=P\tan\theta`,
 alt:[R`\sin\theta=\sqrt{1-\cos^2\theta}`,R`\tan\theta=\dfrac{\sin\theta}{\cos\theta}=\dfrac{\sqrt{1-\cos^2\theta}}{\cos\theta}`],
 v:'P 유효 · Q 무효 · Pa 피상',m:{q:/피상\s*전력|무효\s*전력/}},
{id:'pcomb',cat:'전력·역률',name:'합성(종합) 역률',tex:R`\cos\theta=\dfrac{\sum P}{\sqrt{\left(\sum P\right)^2+\left(\sum Q\right)^2}}`,
 v:'부하마다 P·Q 를 따로 더한 뒤 계산',m:{q:/합성\s*역률|종합\s*역률|전체\s*(의)?\s*역률|평균\s*역률/}},

/* ── 역률 개선 ── */
{id:'qc',cat:'역률 개선',name:'역률 개선 콘덴서 용량',tex:R`Q_c=P\left(\tan\theta_1-\tan\theta_2\right)`,
 alt:[R`Q_c=P\left(\dfrac{\sqrt{1-\cos^2\theta_1}}{\cos\theta_1}-\dfrac{\sqrt{1-\cos^2\theta_2}}{\cos\theta_2}\right)`],
 v:'P 유효전력 · θ₁ 개선 전 · θ₂ 개선 후',m:{q:/역률\s*(을|를)?[^.\n]{0,30}(개선|높이|올리)|콘덴서\s*(의)?\s*(용량|설치\s*용량)|전력용\s*콘덴서|진상\s*(용)?\s*(콘덴서|용량)/}},
{id:'qcC',cat:'역률 개선',name:'콘덴서 정전용량 (Δ·Y)',tex:R`Q_c=3\omega C V^2\;(\Delta),\qquad Q_c=\omega C V^2\;(Y)`,
 alt:[R`C=\dfrac{Q_c}{3\omega V^2}\;(\Delta),\qquad C=\dfrac{Q_c}{\omega V^2}\;(Y)`,R`\omega=2\pi f`],
 v:'V 선간전압 · C 한 상 정전용량',m:{q:/정전\s*용량|μF|\\mu\s*F|마이크로\s*패럿/,x:/콘덴서|커패시터/}},
{id:'qcadd',cat:'역률 개선',name:'역률 개선 후 늘릴 수 있는 부하',tex:R`\Delta P=P_a\left(\cos\theta_2-\cos\theta_1\right)`,
 alt:[R`P_2=P_a\cos\theta_2\quad(\text{변압기 용량 }P_a\text{ 그대로})`],
 v:'Pa 변압기(피상) 용량',m:{q:/역률/,x:/(부하|유효\s*전력|전력)[^.\n]{0,20}(증가|증설|추가|늘)/}},
{id:'qcloss',cat:'역률 개선',name:'역률 개선 시 손실 감소',tex:R`\dfrac{P_{l2}}{P_{l1}}=\left(\dfrac{\cos\theta_1}{\cos\theta_2}\right)^2`,
 alt:[R`\text{감소율}=\left[1-\left(\dfrac{\cos\theta_1}{\cos\theta_2}\right)^2\right]\times100`],
 v:'손실은 전류² 에 비례 → 역률² 에 반비례',m:{q:/역률/,x:/손실[^.\n]{0,20}(감소|줄|경감|저감)|(감소|저감)[^.\n]{0,10}손실/}},
{id:'srx',cat:'역률 개선',name:'직렬 리액터 용량',tex:R`X_L=0.04\,X_C\;(\text{이론}),\qquad X_L=0.06\,X_C\;(\text{실제})`,
 v:'제5고조파 억제 — 5ωL > 1/(5ωC)',m:{q:/직렬\s*리액터/}},

/* ── 전압강하·전선 ── */
{id:'vd3',cat:'전압강하·전선',name:'3상 전압강하',tex:R`e=\sqrt{3}\,I\left(R\cos\theta+X\sin\theta\right)`,
 alt:[R`e=\dfrac{P}{V}\left(R+X\tan\theta\right)`],v:'R·X 한 선(상)의 저항·리액턴스',
 m:{q:/전압\s*강하/,x:/리액턴스|X\s*sin|sin\s*θ|\\sin|Ω\s*\/\s*km|\[\s*Ω\s*\/\s*km\s*\]/,no:/단상\s*2\s*선/}},
{id:'vd1',cat:'전압강하·전선',name:'단상 2선식 전압강하',tex:R`e=2I\left(R\cos\theta+X\sin\theta\right)`,
 v:'왕복 2선이라 2배',m:{q:/단상\s*2\s*선/,x:/전압\s*강하/}},
{id:'vdA',cat:'전압강하·전선',name:'전선 굵기(간이식)',tex:R`A=\dfrac{35.6\,LI}{1000\,e}\;(\text{단상 2선}),\quad A=\dfrac{30.8\,LI}{1000\,e}\;(\text{3상 3선}),\quad A=\dfrac{17.8\,LI}{1000\,e}\;(\text{단상 3선, 3상 4선})`,
 alt:[R`e=\dfrac{35.6\,LI}{1000\,A}\;\cdots`],v:'L 길이[m] · I 전류[A] · e 전압강하[V] · A 단면적[mm²]',
 m:{q:/(굵기|단면적|\[\s*mm\s*\^?\s*2\s*\]|mm²|전선\s*(의)?\s*규격)/,x:/전압\s*강하|35\.6|30\.8|17\.8/}},
{id:'vdr',cat:'전압강하·전선',name:'전압강하율 · 전압변동률',tex:R`\varepsilon=\dfrac{V_s-V_r}{V_r}\times100\;[\%],\qquad \delta=\dfrac{V_{r0}-V_r}{V_r}\times100\;[\%]`,
 v:'Vs 송전단 · Vr 수전단 · Vr0 무부하 수전단',m:{q:/전압\s*강하\s*율|전압\s*변동\s*률/}},
{id:'vr',cat:'전압강하·전선',name:'수전단(말단) 전압',tex:R`V_r=V_s-e`,v:'송전단 전압에서 전압강하를 뺌',
 m:{q:/(수전단|부하\s*(측|단)|말단|끝)\s*(의)?\s*전압[^.\n]{0,20}(구하|얼마|몇|계산)/}},
{id:'stepup',cat:'전압강하·전선',name:'승압 효과',tex:R`P_l\propto\dfrac{1}{V^2},\quad e\propto\dfrac{1}{V},\quad P\propto V^2\;(\text{같은 손실률})`,
 v:'전압을 n 배로 → 손실 1/n² · 강하 1/n',m:{q:/승압|전압\s*(을|를)\s*[^.\n]{0,20}(올리|높이|승압)/}},

/* ── 전력손실 ── */
{id:'ploss',cat:'전력손실',name:'선로 전력손실',tex:R`P_l=3I^2R=\dfrac{P^2R}{V^2\cos^2\theta}`,
 alt:[R`P_l=2I^2R\;(\text{단상 2선})`],v:'R 한 선의 저항',m:{q:/(선로|배전\s*선|전선|송전\s*선|간선)[^.\n]{0,25}손실|손실[^.\n]{0,25}(선로|배전\s*선|전선)/}},
{id:'plr',cat:'전력손실',name:'손실률',tex:R`\text{손실률}=\dfrac{P_l}{P}\times100\;[\%]`,m:{q:/손실\s*률/}},
{id:'lossf',cat:'전력손실',name:'손실계수',tex:R`H=\alpha F+(1-\alpha)F^2`,v:'F 부하율 · α 0.1~0.4',m:{q:/손실\s*계수/}},

/* ── 수용·부하 ── */
{id:'demand',cat:'수용·부하',name:'수용률',tex:R`\text{수용률}=\dfrac{\text{최대 수용전력}}{\text{설비용량}}\times100\;[\%]`,m:{q:/수용\s*률/}},
{id:'divers',cat:'수용·부하',name:'부등률',tex:R`\text{부등률}=\dfrac{\text{개별 최대 수용전력의 합}}{\text{합성 최대 수용전력}}\ \ (\ge 1)`,m:{q:/부등\s*률/}},
{id:'loadf',cat:'수용·부하',name:'부하율',tex:R`\text{부하율}=\dfrac{\text{평균 전력}}{\text{최대 전력}}\times100\;[\%]`,alt:[R`\text{평균 전력}=\dfrac{\text{사용 전력량}}{\text{시간}}`],m:{q:/부하\s*율/,no:/최대\s*효율|철손|동손|전일\s*효율/}},
{id:'trcap',cat:'수용·부하',name:'변압기 용량 산정',tex:R`P_{TR}\ge\dfrac{\sum\left(\text{설비용량}\times\text{수용률}\right)}{\text{부등률}\times\cos\theta}\;[\text{kVA}]`,
 v:'계산값보다 한 단계 큰 표준 용량을 고름',m:{q:/변압기\s*(의)?\s*(용량|표준\s*용량|정격\s*용량|크기)/,x:/수용\s*률|부등\s*률/}},
{id:'branch',cat:'수용·부하',name:'분기회로 수',tex:R`N=\dfrac{\text{부하 설비용량}[\text{VA}]}{\text{사용전압}\times\text{분기회로 전류}}`,
 v:'소수점은 올림 (16 A·20 A 분기 등)',m:{q:/분기\s*회로\s*(수|를|의\s*수)?/}},
{id:'unbal',cat:'수용·부하',name:'설비 불평형률',tex:R`\text{단상 3선}:\ \dfrac{\text{두 전압측 설비용량 차}}{\text{총 설비용량}\times\frac12}\times100,\qquad \text{3상}:\ \dfrac{\text{최대}-\text{최소}}{\text{총 설비용량}\times\frac13}\times100`,
 v:'단상 3선 40 % 이하 · 3상 30 % 이하',m:{q:/불평형\s*률|설비\s*불평형/}},

/* ── 변압기 ── */
{id:'treff',cat:'변압기',name:'변압기 효율',tex:R`\eta=\dfrac{mP\cos\theta}{mP\cos\theta+P_i+m^2P_c}\times100\;[\%]`,
 v:'m 부하율 · Pi 철손 · Pc 전부하 동손',m:{q:/변압기/,x:/철손|동손|무부하\s*손|부하\s*손/,no:/전일\s*효율/}},
{id:'trmax',cat:'변압기',name:'최대 효율 조건',tex:R`P_i=m^2P_c\quad\Rightarrow\quad m=\sqrt{\dfrac{P_i}{P_c}}`,v:'철손 = 동손 일 때 최대',m:{q:/최대\s*효율/}},
{id:'trday',cat:'변압기',name:'전일 효율',tex:R`\eta_d=\dfrac{\sum hP}{\sum hP+24P_i+\sum h\,m^2P_c}\times100`,v:'h 시간 · 철손은 24시간 내내',m:{q:/전일\s*효율/}},
{id:'vconn',cat:'변압기',name:'V 결선',tex:R`P_V=\sqrt{3}\,P_1,\qquad \text{이용률}=\dfrac{\sqrt3}{2}=0.866,\qquad \text{출력비}=\dfrac{1}{\sqrt3}=0.577`,
 v:'P₁ 변압기 1대 용량',m:{q:/V\s*결선|V\s*-\s*V\s*결선|이용\s*률|출력\s*비/}},
{id:'trpar',cat:'변압기',name:'병렬운전 부하분담',tex:R`\dfrac{P_a}{P_b}=\dfrac{P_A}{P_B}\cdot\dfrac{\%Z_b}{\%Z_a}`,v:'분담은 용량에 비례 · %Z 에 반비례',m:{q:/병렬\s*운전/,x:/분담|부하/}},
{id:'auto',cat:'변압기',name:'단권변압기 자기용량',tex:R`\dfrac{\text{자기용량}}{\text{부하용량}}=\dfrac{V_h-V_l}{V_h}`,m:{q:/단권\s*변압기/}},
{id:'trreg',cat:'변압기',name:'변압기 전압변동률',tex:R`\varepsilon=p\cos\theta+q\sin\theta`,v:'p %저항강하 · q %리액턴스강하',m:{q:/전압\s*변동\s*률/,x:/변압기/}},

/* ── %임피던스·단락·차단 ── */
{id:'pz',cat:'%임피던스·단락',name:'%임피던스 ↔ 옴',tex:R`\%Z=\dfrac{I_nZ}{E}\times100=\dfrac{P\,Z}{10\,V^2}`,alt:[R`Z=\dfrac{10\,V^2\,\%Z}{P}\;[\Omega]`],
 v:'P [kVA] · V [kV] · Z [Ω]',m:{q:/(%\s*[ZXR]|퍼센트\s*(임피던스|리액턴스)|%\s*임피던스|%\s*리액턴스)/,x:/\[\s*Ω\s*\]|Ω|옴/}},
{id:'pzb',cat:'%임피던스·단락',name:'기준용량 환산',tex:R`\%Z'=\%Z\times\dfrac{P_{\text{기준}}}{P_{\text{자기}}}`,v:'모든 %Z 를 같은 기준 용량으로 맞춘 뒤 더함',
 m:{q:/(%\s*[ZX]|%\s*임피던스|%\s*리액턴스)/,x:/기준|환산|\[\s*MVA\s*\]\s*기준|MVA\s*기준/}},
{id:'is',cat:'%임피던스·단락',name:'단락전류',tex:R`I_s=\dfrac{100}{\%Z}\,I_n`,alt:[R`I_n=\dfrac{P_n}{\sqrt3\,V_n}`,R`I_s=\dfrac{E}{Z}\;(\text{옴법})`],v:'In 기준용량의 정격전류',m:{q:/단락\s*전류/}},
{id:'ps',cat:'%임피던스·단락',name:'단락용량',tex:R`P_s=\dfrac{100}{\%Z}\,P_n`,v:'Pn 기준용량',m:{q:/단락\s*용량/}},
{id:'cb',cat:'%임피던스·단락',name:'차단기 차단용량',tex:R`P_s=\sqrt3\,V_n\,I_s`,v:'Vn 정격전압 · Is 정격차단전류 — 계산값보다 한 단계 큰 표준값',m:{q:/차단\s*(기\s*(의)?\s*)?(용량|정격\s*차단\s*전류)|정격\s*차단\s*(용량|전류)/}},
{id:'pz3',cat:'%임피던스·단락',name:'3권선 변압기 %X',tex:R`\%X_1=\tfrac12\left(\%X_{12}+\%X_{13}-\%X_{23}\right)`,
 alt:[R`\%X_2=\tfrac12\left(\%X_{12}+\%X_{23}-\%X_{13}\right),\quad \%X_3=\tfrac12\left(\%X_{13}+\%X_{23}-\%X_{12}\right)`],v:'먼저 모두 같은 기준용량으로 환산',m:{q:/3\s*권선/}},
{id:'pzsum',cat:'%임피던스·단락',name:'%Z 합성 (직렬·병렬)',tex:R`\%Z_{\text{직렬}}=\%Z_1+\%Z_2,\qquad \%Z_{\text{병렬}}=\dfrac{\%Z_1\,\%Z_2}{\%Z_1+\%Z_2}`,
 m:{q:/(%\s*[ZX]|%\s*임피던스|%\s*리액턴스)/,x:/합성|직렬|병렬/}},
{id:'in',cat:'%임피던스·단락',name:'정격(부하)전류',tex:R`I_n=\dfrac{P_n}{\sqrt3\,V_n}`,v:'3상 · P [kVA] · V [kV] → I [A]',basic:1,m:{q:/정격\s*전류|부하\s*전류|전부하\s*전류/,x:/3\s*상|√\s*3|\\sqrt\s*\{?3/}},

/* ── CT·PT·계전기·계기 ── */
{id:'ct',cat:'CT·PT·계전기',name:'CT 1차 정격전류 선정',tex:R`I_1=\dfrac{P}{\sqrt3\,V}\times(1.25\sim1.5)`,v:'계산값 바로 위 표준값(…100·150·200 A) 선택',m:{q:/(CT|변류기)/,x:/변류\s*비|정격\s*전류|1\s*차\s*(정격)?\s*전류|선정|(CT|변류기)\s*\d*\s*(의)?\s*(변류)?\s*비\s*(를|을)\s*(구|선정|정하)/}},
{id:'relay',cat:'CT·PT·계전기',name:'계전기 전류 · 탭 정정',tex:R`I_r=I_1\times\dfrac{1}{\text{CT비}},\qquad \text{탭}=I_L\times\dfrac{1}{\text{CT비}}\times(\text{정정 배수})`,
 v:'과전류 계전기(OCR) 정정은 보통 부하전류의 150 %',m:{q:/(계전기|OCR|과전류\s*계전기)/,x:/(탭|tap|TAP|정정|흐르는\s*전류|2\s*차\s*전류)/i}},
{id:'burden',cat:'CT·PT·계전기',name:'CT 부담',tex:R`P=I^2Z\;[\text{VA}]`,alt:[R`Z=\dfrac{P}{I^2}`],v:'CT 2차 정격 5 A',m:{q:/부담/,x:/CT|변류기|VA|\[\s*VA\s*\]/}},
{id:'meter',cat:'CT·PT·계전기',name:'계기 지시 → 실제 전력',tex:R`P=\text{지시값}\times\text{CT비}\times\text{PT비}`,m:{q:/(PT|계기용\s*변압기|변성기|MOF)/,x:/(지시|측정|전력계|배율|수전\s*전력)/}},
{id:'wh',cat:'CT·PT·계전기',name:'전력량계 계기정수',tex:R`P=\dfrac{3600\,n}{t\,K}\times\text{CT비}\times\text{PT비}\;[\text{kW}]`,v:'n 회전수 · t 초 · K 계기정수[rev/kWh]',m:{q:/계기\s*정수|원판|rev\s*\/\s*kWh/i,x:/전력량\s*계|적산\s*전력계|계기\s*정수/}},
{id:'err',cat:'CT·PT·계전기',name:'오차율 · 보정률',tex:R`\text{오차율}=\dfrac{M-T}{T}\times100,\qquad \text{보정률}=\dfrac{T-M}{M}\times100`,v:'M 측정값 · T 참값',m:{q:/오차\s*율|보정\s*률/}},

/* ── 조명 ── */
{id:'lamp',cat:'조명',name:'광속법 (등 수 · 평균 조도)',tex:R`N=\dfrac{D\,A\,E}{F\,U}=\dfrac{A\,E}{F\,U\,M}`,alt:[R`E=\dfrac{F\,U\,N}{D\,A}`,R`F=\dfrac{D\,A\,E}{N\,U}`],
 v:'D 감광보상률 · A 면적 · E 조도 · F 등 1개 광속 · U 조명률 · M 보수율(=1/D)',m:{q:/(등\s*(의)?\s*수|등수|등\s*기구\s*(의)?\s*수|소요\s*등|램프\s*(의)?\s*수|평균\s*조도|조명\s*률|몇\s*등)/,x:/조도|lx|룩스|조명/}},
{id:'ridx',cat:'조명',name:'실지수',tex:R`K=\dfrac{X\,Y}{H\,(X+Y)}`,v:'X·Y 방 가로·세로 · H 등~작업면 높이',m:{q:/실\s*지수/}},
{id:'maint',cat:'조명',name:'감광보상률 · 보수율',tex:R`D=\dfrac{1}{M}`,m:{q:/감광\s*보상\s*률|보수\s*율|유지\s*율/,no:/축전지/}},
{id:'illum',cat:'조명',name:'점광원 조도 (거리 역제곱)',tex:R`E_n=\dfrac{I}{r^2},\qquad E_h=\dfrac{I}{r^2}\cos\theta,\qquad E_v=\dfrac{I}{r^2}\sin\theta`,
 alt:[R`E_h=\dfrac{I\,h}{\left(h^2+d^2\right)^{3/2}}`],v:'n 법선 · h 수평면 · v 수직면 · r 광원까지 거리',m:{q:/(법선|수평\s*면|수직\s*면)\s*(의)?\s*조도|조도[^.\n]{0,25}(구하|계산)/,x:/광도|\[\s*cd\s*\]|cd|칸델라/}},
{id:'emit',cat:'조명',name:'광속발산도',tex:R`R=\dfrac{F}{S}`,alt:[R`R=\rho E\;(\text{반사}),\qquad R=\tau E\;(\text{투과})`],v:'F 나가는 광속 · S 면적',m:{q:/광속\s*발산도/}},
{id:'globe',cat:'조명',name:'글로브 효율 (완전 확산 구)',tex:R`\eta=\dfrac{\tau}{1-\rho}`,alt:[R`R=\dfrac{F}{S}\,\eta=\dfrac{4\pi I}{4\pi r^2}\cdot\dfrac{\tau}{1-\rho}=\dfrac{\tau I}{r^2(1-\rho)}`],
 v:'τ 투과율 · ρ 반사율',m:{q:/글로브|완전\s*확산/}},
{id:'flux',cat:'조명',name:'광원 모양별 전광속',tex:R`F=4\pi I\;(\text{구}),\qquad F=\pi^2 I\;(\text{원통}),\qquad F=\pi I\;(\text{평판})`,v:'I 광도[cd]',m:{q:/(전\s*광속|광속)/,x:/광도|\[\s*cd\s*\]|cd|칸델라/,no:/광속\s*발산도/}},
{id:'lum',cat:'조명',name:'휘도',tex:R`B=\dfrac{I}{S}\;[\text{cd/m}^2]`,v:'S 보이는(투영) 면적',m:{q:/휘도/}},
{id:'road',cat:'조명',name:'도로 조명 (등 간격)',tex:R`E=\dfrac{F\,U\,N}{D\,A},\qquad A=\dfrac{B\,S}{2}\;(\text{양쪽 배치}),\quad A=B\,S\;(\text{한쪽, 중앙})`,
 v:'B 도로 폭 · S 등 간격',m:{q:/도로|가로\s*등|등\s*간격|가로\s*조명/,x:/조도|lx|룩스|광속|조명\s*률/}},

/* ── 전동기·동력 ── */
{id:'pump',cat:'전동기·동력',name:'펌프(양수) 전동기 출력',tex:R`P=\dfrac{9.8\,Q\,H\,K}{\eta}\;[\text{kW}]\;(Q:\text{m}^3/\text{s})`,alt:[R`P=\dfrac{Q\,H\,K}{6.12\,\eta}\;[\text{kW}]\;(Q:\text{m}^3/\text{min})`],
 v:'H 양정[m] · K 여유계수 · η 효율',m:{q:/펌프|양수/}},
{id:'hoist',cat:'전동기·동력',name:'권상기·엘리베이터 출력',tex:R`P=\dfrac{W\,V}{6.12\,\eta}\;[\text{kW}]`,alt:[R`P=\dfrac{9.8\,W\,v}{\eta}\;(W:\text{t},\ v:\text{m/s})`],
 v:'W 무게[t] · V 속도[m/min]',m:{q:/권상|크레인|호이스트|엘리베이터|승강기/}},
{id:'fan',cat:'전동기·동력',name:'송풍기 출력',tex:R`P=\dfrac{Q\,H\,K}{6120\,\eta}\;[\text{kW}]`,v:'Q [m³/min] · H 풍압[mmAq]',m:{q:/송풍기|환풍기|팬/}},
{id:'ns',cat:'전동기·동력',name:'동기속도 · 슬립',tex:R`N_s=\dfrac{120\,f}{p},\qquad s=\dfrac{N_s-N}{N_s}`,alt:[R`N=(1-s)\,N_s`],m:{q:/동기\s*속도|슬립|회전\s*(속도|수)|극\s*수/}},
{id:'torque',cat:'전동기·동력',name:'토크',tex:R`T=0.975\,\dfrac{P}{N}\;[\text{kg}\cdot\text{m}]=9.55\,\dfrac{P}{N}\;[\text{N}\cdot\text{m}]`,v:'P [W] · N [rpm]',m:{q:/토크/}},
{id:'yd',cat:'전동기·동력',name:'Y-Δ 기동',tex:R`I_Y=\dfrac13 I_\Delta,\qquad T_Y=\dfrac13 T_\Delta`,v:'기동전류·기동토크 모두 1/3',m:{q:/Y\s*-?\s*Δ|Y\s*-?\s*델타|와이\s*델타|성형\s*-?\s*삼각/}},
{id:'ind2',cat:'전동기·동력',name:'유도전동기 2차 관계',tex:R`P_2:P_{c2}:P_o=1:s:(1-s)`,alt:[R`\eta_2=1-s`],v:'P₂ 2차 입력 · Pc₂ 2차 동손 · Po 기계 출력',m:{q:/2\s*차\s*(동손|효율|입력)/}},
{id:'gen',cat:'전동기·동력',name:'자가발전기 용량 (전동기 기동)',tex:R`P_G\ge\left(\dfrac{1}{e}-1\right)x_d'\,P_s\;[\text{kVA}]`,v:'e 허용 전압강하율 · x′d 과도리액턴스 · Ps 기동 용량',m:{q:/발전기\s*(의)?\s*용량|자가\s*발전/}},

/* ── 축전지·정류 ── */
{id:'bat',cat:'축전지·정류',name:'축전지 용량',tex:R`C=\dfrac{1}{L}\,K\,I\;[\text{Ah}]`,v:'L 보수율 · K 용량환산시간 · I 방전전류',m:{q:/축전지\s*(의)?\s*용량|용량\s*환산\s*시간/}},
{id:'cell',cat:'축전지·정류',name:'축전지 셀 수',tex:R`n=\dfrac{V}{V_{\text{cell}}}`,v:'연(납) 2.0 V/셀 · 알칼리 1.2 V/셀',m:{q:/(셀|cell)\s*(의)?\s*(수|개수)|축전지\s*(의)?\s*(개수|수)/i}},
{id:'float',cat:'축전지·정류',name:'부동충전 2차 전류',tex:R`I=\dfrac{\text{축전지 정격용량}}{\text{정격 방전율}}+\dfrac{\text{상시 부하}}{\text{표준 전압}}`,v:'연축전지 방전율 10 h · 알칼리 5 h',m:{q:/부동\s*충전|충전기\s*(의)?\s*(2\s*차)?\s*전류/}},
{id:'rect',cat:'축전지·정류',name:'정류 직류전압',tex:R`E_d=0.45E\;(\text{단상 반파}),\quad 0.9E\;(\text{단상 전파}),\quad 1.17E\;(\text{3상 반파}),\quad 1.35E\;(\text{3상 전파})`,v:'E 교류 실효값',m:{q:/정류\s*(회로|기|전압|방식)|다이오드|SCR|사이리스터|(반파|전파)\s*정류/}},

/* ── 접지·지락·절연 ── */
{id:'ig',cat:'접지·지락·절연',name:'지락전류 (대지 정전용량)',tex:R`I_g=3\omega C E=\sqrt3\,\omega C V`,v:'E 대지(상)전압 · C 한 선의 대지 정전용량',m:{q:/지락\s*전류/,x:/정전\s*용량|μF|대지/}},
{id:'leak',cat:'접지·지락·절연',name:'누설전류 한도',tex:R`I_{\text{누설}}\le I_{\max}\times\dfrac{1}{2000}`,m:{q:/누설\s*전류/}},
{id:'touch',cat:'접지·지락·절연',name:'접촉·대지 전위',tex:R`E=I_g\,R`,alt:[R`I_g=\dfrac{E}{R_2+R_3}\;(\text{접지 저항 직렬})`],v:'Rg 접지저항',m:{q:/접촉\s*전압|대지\s*전위|전위\s*상승/,x:/접지/}},
{id:'gsv',cat:'접지·지락·절연',name:'1선 지락 시 건전상 대지전압',tex:R`V_{\text{건전}}=\sqrt3\,E=V\;(\text{비접지})`,alt:[R`E=\dfrac{V}{\sqrt3}\;(\text{평상시 대지전압})`],v:'E 평상시 대지(상)전압 · V 선간전압 — 지락 상은 0 V',m:{q:/(지락|접지\s*사고|누전)/,x:/대지\s*전압/}},
{id:'gw',cat:'접지·지락·절연',name:'보호도체(접지선) 굵기',tex:R`S=\dfrac{\sqrt{I^2\,t}}{k}\;[\text{mm}^2]`,v:'I 고장전류 · t 차단 시간 · k 재질 계수',m:{q:/(접지\s*(선|도체)|보호\s*도체)\s*(의)?\s*(굵기|단면적)/}},
{id:'hipot',cat:'접지·지락·절연',name:'절연내력 시험전압',tex:R`V_t=V_m\times k`,
 alt:[R`7\text{kV 이하 }1.5\ (\min 500\text{V})\quad 7{\sim}25\text{kV 다중접지 }0.92\quad 7{\sim}60\text{kV }1.25\ (\min 10.5\text{kV})`,R`60\text{kV 초과 비접지 }1.25\quad \text{중성점 접지 }1.1\ (\min 75\text{kV})\quad \text{직접접지 }170\text{kV 이하 }0.72,\ \text{초과 }0.64`],
 v:'Vm 최대사용전압 · 10분간',m:{q:/절연\s*내력|시험\s*전압/}},
{id:'insR',cat:'접지·지락·절연',name:'절연저항 · 누설전류',tex:R`I=\dfrac{V}{R_{\text{절연}}}`,m:{q:/절연\s*저항/,x:/누설|전류/}},

/* ── 송배전 ── */
{id:'sag',cat:'송배전',name:'이도 · 전선 실제 길이',tex:R`D=\dfrac{W\,S^2}{8\,T},\qquad L=S+\dfrac{8D^2}{3S}`,v:'W 단위길이 무게 · S 경간 · T 수평장력(=인장하중/안전율)',m:{q:/이도|처짐|딥|dip/i}},
{id:'chg',cat:'송배전',name:'충전전류',tex:R`I_c=\omega C E\,l=2\pi f\,C\,\dfrac{V}{\sqrt3}\,l`,v:'C 작용 정전용량[F/km] · l 길이',m:{q:/충전\s*전류/,no:/축전지|충전기|부동\s*충전|균등\s*충전/}},
{id:'gmd',cat:'송배전',name:'등가 선간거리',tex:R`D=\sqrt[3]{D_{12}D_{23}D_{31}}`,m:{q:/등가\s*선간\s*거리|기하\s*평균\s*거리/}},

/* ── 논리회로 ── */
{id:'demorgan',cat:'논리회로',name:'드모르간 정리',tex:R`\overline{A+B}=\overline{A}\cdot\overline{B},\qquad \overline{A\cdot B}=\overline{A}+\overline{B}`,
 v:'NAND 만으로 · NOR 만으로 바꿀 때',m:{q:/드\s*모르간|NAND|NOR|무접점|논리\s*(식|회로)/}},
{id:'bool',cat:'논리회로',name:'불 대수 간략화',tex:R`A+AB=A,\qquad A(A+B)=A,\qquad A+\overline{A}B=A+B,\qquad A+\overline{A}=1`,
 m:{q:/간략\s*화|간소\s*화|불\s*대수|논리\s*식/}},
];
const CATS=[...new Set(LIB.map(f=>f.cat))];
const FBY=new Map(LIB.map(f=>[f.id,f]));

/* ══ ② 문항 → 공식 짝짓기 ══ */
const rows=()=>{ try{ return Array.isArray(ROWS)?ROWS:[] }catch(e){ return [] } };
const real=y=>+y>0 && +y<3000;
function yname(y){
  if(real(y)) return `${String(y).slice(2)}년`;
  let h=''; try{ h=((window.__pracYLabel&&window.__pracYLabel())||{})[String(y)]||(window.__pracYAuto?window.__pracYAuto(y):'') }catch(e){ q_(e) }
  return h||('자료 '+y);
}
const pname=r=>r?`${yname(r.year)} ${r.session}회 ${r.no}번`:'';
const pnameLong=r=>r?(real(r.year)?`${r.year}년 ${r.session}회 ${r.no}번`:pname(r)):'';
const tyC=r=>{ const t=IDX&&IDX.byTy.get(String(r.id)); return t!=null?t:typeOf(r); };
const typeOf=r=>{ try{ const p=window.__qtypePath?window.__qtypePath(r.id):null; if(Array.isArray(p)) return p.filter(Boolean).join(' › '); }catch(e){ q_(e) } return r.qtype||''; };
const T=s=>String(s==null?'':s);
let IDX=null, ISIG='';
function sigOf(R0){ let n=0; for(const r of R0) n+=(r.easy_md?r.easy_md.length:0)+(r.q_text?r.q_text.length:0)+(r.qtype?r.qtype.length:0); return R0.length+'|'+n; }
function build(){
  const R0=rows(), s=sigOf(R0);
  if(IDX && s===ISIG) return IDX;
  const byRow=new Map(), byF=new Map(LIB.map(f=>[f.id,[]])), byTy=new Map();
  R0.forEach(r=>{
    const tp=typeOf(r); byTy.set(String(r.id), tp);
    const Q=T(r.q_text)+'\n'+T(r.q_md)+'\n'+tp;
    const A=T(r.a_text)+'\n'+T(r.a_md)+'\n'+T(r.easy_md);
    const X=Q+'\n'+A;
    const hit=[];
    for(const f of LIB){
      const m=f.m; if(!m) continue;
      if(m.q && !m.q.test(Q)) continue;
      if(m.a && !m.a.test(A)) continue;
      if(m.x && !m.x.test(X)) continue;
      if(m.no && m.no.test(Q)) continue;
      hit.push(f.id); byF.get(f.id).push(r);
    }
    byRow.set(String(r.id), hit);
  });
  const ord=(a,b)=>(real(b.year)-real(a.year))||((+b.year||0)-(+a.year||0))||((+b.session||0)-(+a.session||0))||((+a.no||0)-(+b.no||0));
  byF.forEach(l=>l.sort(ord));
  IDX={ byRow, byF, byTy, ord }; ISIG=s; return IDX;
}
/* 해설(쉬운 풀이)에 쓴 «기호식» 만 골라냄 — 숫자 대입식·한글 말식·단위식은 뺌 */
function symLines(md){
  const out=[], seen=new Set();
  const src=T(md); const re=/\$\$([\s\S]+?)\$\$/g; let m;
  while((m=re.exec(src))){
    let body=m[1].replace(/\\begin\{aligned\}|\\end\{aligned\}/g,'');
    body.split(/\\\\/).forEach(line=>{
      let t=line.replace(/&/g,'').replace(/\s+/g,' ').trim();
      if(!t || t.length<3) return;
      if(/^\[/.test(t)) return;                                   /* 단위식 */
      if(/\\text\{[^}]*[가-힣]/.test(t)) return;                   /* 말로 쓴 식 */
      const nums=(t.replace(/_\{?\d+\}?|\^\{?\d+\}?|\\sqrt\{?3\}?|\\dfrac|\\frac/g,'').match(/\d+(\.\d+)?/g)||[]);
      if(nums.length>=2) return;                                  /* 숫자 대입식 */
      if(!/=/.test(t)) return;
      const k=t.replace(/\s/g,''); if(seen.has(k)) return; seen.add(k); out.push(t);
    });
  }
  return out.slice(0,10);
}

/* ══ ③ 그리기 도우미 ══ */
function tex(t, disp){
  try{ if(window.katex) return window.katex.renderToString(t,{ throwOnError:false, displayMode:!!disp, strict:'ignore' }); }catch(e){ q_(e) }
  return `<code>${esc(t)}</code>`;
}
const rowOf=id=>rows().find(r=>String(r.id)===String(id))||null;
function curId(){
  try{ if($('#ovl')?.classList.contains('on') && OVID!=null) return String(OVID); }catch(e){ q_(e) }
  if(LASTCARD) return LASTCARD;
  try{ const r=window.SHOWN && window.SHOWN[window.ONEAT|0]; if(r) return String(r.id); }catch(e){ q_(e) }
  return '';
}
function goTo(id){
  try{
    if($('#ovl')?.classList.contains('on')){ window.ovOpen && window.ovOpen(id); return; }
    const sh=window.SHOWN||[], i=sh.findIndex(x=>String(x.id)===String(id));
    if(i>=0 && document.body.classList.contains('oneup') && typeof window.showAt==='function'){ window.showAt(i); LASTCARD=String(id); return; }
    const c=document.querySelector(`#list > .pcard[data-id="${CSS.escape(String(id))}"]`);
    if(c && !c.hidden){ c.scrollIntoView({ block:'start', behavior:'smooth' }); LASTCARD=String(id); return; }
    window.ovOpen && window.ovOpen(id);
  }catch(e){ q_(e) }
}
let LASTCARD='';

/* ══ ④ 창 ══ */
const KEY='prac:fx:v1';
let S={ tab:'now', x:null, y:null, w:430, h:560, open:{} };
try{ Object.assign(S, JSON.parse(localStorage.getItem(KEY)||'{}')||{}) }catch(e){ q_(e) }
const save=()=>{ try{ localStorage.setItem(KEY, JSON.stringify(S)) }catch(e){ q_(e) } };
const phone=()=>{ try{ return matchMedia('(max-width:700px)').matches }catch(e){ return innerWidth<700 } };

const css=document.createElement('style');
css.textContent=`
.fxb{order:9;margin-left:5px;height:20px;padding:0 8px;border:1px solid #c7d2fe;border-radius:6px;background:#eef2ff;color:#3730a3;
  cursor:pointer;font:700 9.5px/1 var(--font-d,system-ui);flex:0 0 auto;white-space:nowrap}
.fxb:hover,.fxb.open{background:#3730a3;color:#fff;border-color:#3730a3}
.ovl .plab .mmb + .fxb,.plabel .mmb + .fxb{margin-left:5px}
.ovl .plab .fxb + .edb,.plabel .fxb + .edb{margin-left:6px}
.fxpop{position:fixed;z-index:2147483000;display:none;flex-direction:column;background:#fff;border:1px solid #c7d2fe;border-radius:14px;
  box-shadow:0 18px 48px rgba(15,23,42,.24),0 2px 8px rgba(15,23,42,.08);overflow:hidden;min-width:300px;min-height:240px;resize:both;
  font-family:var(--font-d,system-ui);color:#0f172a}
.fxpop.on{display:flex}
.fxpop .fxhd{display:flex;align-items:center;gap:6px;padding:7px 8px 7px 12px;background:linear-gradient(180deg,#eef2ff,#e0e7ff);border-bottom:1px solid #c7d2fe;cursor:move;user-select:none;-webkit-user-select:none;touch-action:none}
.fxpop .fxhd b{font:800 13px/1 var(--font-d,system-ui);color:#312e81;white-space:nowrap}
.fxpop .fxtabs{display:flex;gap:3px;margin-left:6px}
.fxpop .fxtabs button{height:26px;padding:0 10px;border:1px solid #c7d2fe;border-radius:8px;background:#fff;color:#3730a3;font:700 11.5px/1 var(--font-d,system-ui);cursor:pointer}
.fxpop .fxtabs button.on{background:#3730a3;border-color:#3730a3;color:#fff}
.fxpop .fxx{margin-left:auto;width:28px;height:28px;border:0;border-radius:8px;background:transparent;color:#475569;font-size:16px;cursor:pointer}
.fxpop .fxx:hover{background:#fff}
.fxpop .fxsr{display:flex;gap:6px;align-items:center;padding:6px 10px;border-bottom:1px solid #e5e7eb;background:#fafbff}
.fxpop .fxsr input{flex:1;min-width:0;height:28px;padding:0 9px;border:1px solid #cbd5e1;border-radius:8px;font:600 12.5px/1 var(--font-d,system-ui)}
.fxpop .fxsr small{color:#64748b;font-size:11px;white-space:nowrap}
.fxpop .fxbd{flex:1;min-height:0;overflow:auto;padding:8px 10px 14px;overscroll-behavior:contain}
.fxpop .fxnow{font:800 13px/1.4 var(--font-d,system-ui);color:#1e1b4b;margin:2px 2px 2px}
.fxpop .fxty{font:600 11px/1.4 var(--font-d,system-ui);color:#6366f1;margin:0 2px 8px}
.fxpop .fxh{font:800 11px/1 var(--font-d,system-ui);color:#64748b;letter-spacing:.04em;margin:12px 2px 6px}
.fxpop .fxc{border:1px solid #e0e7ff;border-radius:10px;background:#fff;margin:0 0 7px;overflow:hidden}
.fxpop .fxc > summary{list-style:none;display:flex;align-items:center;gap:7px;padding:7px 10px;cursor:pointer}
.fxpop .fxc > summary::-webkit-details-marker{display:none}
.fxpop .fxc > summary .nm{flex:1;min-width:0;font:750 12.5px/1.35 var(--font-d,system-ui);color:#1e1b4b}
.fxpop .fxc > summary .ct{font:700 10.5px/1 var(--font-m,monospace);color:#4338ca;background:#eef2ff;border-radius:99px;padding:3px 7px;white-space:nowrap}
.fxpop .fxc > summary .car{color:#94a3b8;font-size:10px;transition:transform .15s}
.fxpop .fxc[open] > summary .car{transform:rotate(90deg);color:#4338ca}
.fxpop .fxc .eq{padding:6px 10px 4px;overflow-x:auto;overflow-y:hidden}
.fxpop .fxc .eq .katex-display{margin:.2em 0}
.fxpop .fxc .alt{padding:0 10px 4px;overflow-x:auto;font-size:.92em;color:#334155}
.fxpop .fxc .alt .lb{display:inline-block;font:700 10px/1.6 var(--font-d,system-ui);color:#64748b;background:#f1f5f9;border-radius:4px;padding:0 5px;margin-right:4px}
.fxpop .fxc .v{padding:2px 10px 8px;font:500 11.5px/1.5 var(--font-d,system-ui);color:#475569}
.fxpop .fxc .chips{display:flex;flex-wrap:wrap;gap:4px;padding:2px 10px 10px}
.fxpop .chip{height:22px;padding:0 8px;border:1px solid #c7d2fe;border-radius:99px;background:#fff;color:#3730a3;font:700 10.5px/20px var(--font-m,monospace);cursor:pointer;white-space:nowrap}
.fxpop .chip:hover,.fxpop .chip.me{background:#3730a3;color:#fff;border-color:#3730a3}
.fxpop .fxc.basic{border-style:dashed}
.fxpop .fxc.zero:not([open]){opacity:.5}
.fxpop .sym{border:1px dashed #cbd5e1;border-radius:9px;padding:4px 10px;margin:0 0 6px;background:#fbfcff;overflow-x:auto}
.fxpop .fxemp{color:#94a3b8;font:600 12px/1.6 var(--font-d,system-ui);padding:10px 4px}
.fxpop .sess{font:800 12px/1 var(--font-d,system-ui);color:#1e1b4b;margin:12px 2px 6px;padding-top:8px;border-top:1px solid #eef2ff}
.fxpop .prow{display:flex;gap:7px;align-items:flex-start;padding:5px 6px;border-radius:8px;cursor:pointer}
.fxpop .prow:hover{background:#f5f7ff}
.fxpop .prow.me{background:#eef2ff}
.fxpop .prow .no{flex:none;min-width:42px;font:800 11.5px/22px var(--font-m,monospace);color:#3730a3}
.fxpop .prow .fs{flex:1;min-width:0;display:flex;flex-wrap:wrap;gap:4px}
.fxpop .prow .fs .fn{font:650 11px/20px var(--font-d,system-ui);color:#334155;background:#f1f5f9;border-radius:6px;padding:0 6px}
.fxpop .prow .fs .fn:hover{background:#e0e7ff;color:#3730a3}
.fxpop .prow .ty{display:block;width:100%;font:500 10.5px/1.4 var(--font-d,system-ui);color:#94a3b8}
.fxpop .sgrp,.fxpop .fxcat{content-visibility:auto;contain-intrinsic-size:auto 420px}
.fxpop .cat{font:800 12px/1 var(--font-d,system-ui);color:#4338ca;margin:14px 2px 7px}
.fxpop .cat:first-child{margin-top:4px}
.fxpop .hl{animation:fxhl 1.4s ease}
@keyframes fxhl{0%{box-shadow:0 0 0 3px #818cf8}100%{box-shadow:0 0 0 0 transparent}}
@media(max-width:700px){ .fxpop{left:6px!important;right:6px!important;width:auto!important;top:auto!important;bottom:6px!important;height:62vh!important;resize:none} .fxpop .fxhd{cursor:default} }
body.rd-night .fxpop{background:#111827;border-color:#33415c;color:#e5e7eb}
body.rd-night .fxpop .fxhd{background:#1a2640;border-color:#33415c}
body.rd-night .fxpop .fxhd b,body.rd-night .fxpop .fxnow,body.rd-night .fxpop .sess{color:#cfe0ff}
body.rd-night .fxpop .fxsr{background:#0f172a;border-color:#33415c}
body.rd-night .fxpop .fxsr input{background:#111827;color:#e5e7eb;border-color:#33415c}
body.rd-night .fxpop .fxc,body.rd-night .fxpop .sym{background:#0f172a;border-color:#33415c}
body.rd-night .fxpop .fxc > summary .nm{color:#e5e7eb}
body.rd-night .fxpop .fxc .alt,body.rd-night .fxpop .fxc .v{color:#a5b2c2}
body.rd-night .fxpop .chip,body.rd-night .fxpop .fxtabs button{background:#111827;color:#c7d2fe;border-color:#33415c}
body.rd-night .fxpop .prow .fs .fn,body.rd-night .fxpop .fxc .alt .lb{background:#1f2937;color:#cbd5e1}
body.rd-night .fxpop .prow:hover,body.rd-night .fxpop .prow.me{background:#1a2640}
`;
document.head.appendChild(css);

let EL=null, LASTID='', Q='';
function pop(){
  if(EL) return EL;
  EL=document.createElement('div'); EL.className='fxpop'; EL.setAttribute('role','dialog'); EL.setAttribute('aria-label','공식 모음');
  EL.innerHTML=`<div class="fxhd"><b>📐 공식</b><span class="fxtabs">
      <button type="button" data-tab="now">이 문제</button><button type="button" data-tab="f">공식별</button><button type="button" data-tab="n">번호별</button></span>
      <button type="button" class="fxx" data-x aria-label="닫기">✕</button></div>
    <div class="fxsr"><input type="search" placeholder="공식 이름 · 회차(19-3) 로 찾기" aria-label="찾기"><small></small></div>
    <div class="fxbd"></div>`;
  document.body.appendChild(EL);
  const inp=$('.fxsr input',EL);
  inp.addEventListener('input',()=>{ Q=inp.value.trim(); paint(true); });
  ['keydown','keyup','keypress'].forEach(ev=>inp.addEventListener(ev,e=>{ e.stopPropagation(); if(ev==='keydown' && e.key==='Escape'){ inp.value=''; Q=''; paint(true); } }));
  EL.addEventListener('click', e=>{
    const t=e.target;
    if(t.closest('[data-x]')) return close();
    const tb=t.closest('[data-tab]'); if(tb){ S.tab=tb.dataset.tab; save(); return paint(true); }
    const ch=t.closest('[data-go]'); if(ch){ e.preventDefault(); goTo(ch.dataset.go); setTimeout(()=>paint(true),250); return; }
    const fn=t.closest('[data-fx]'); if(fn){ e.preventDefault(); e.stopPropagation(); S.tab='f'; S.open[fn.dataset.fx]=1; save(); paint(true, fn.dataset.fx); return; }
    const pr=t.closest('[data-row]'); if(pr){ goTo(pr.dataset.row); setTimeout(()=>paint(true),250); }
  });
  EL.addEventListener('toggle', e=>{ const d=e.target; if(S.tab==='f' && d.classList && d.classList.contains('fxc') && d.dataset.id){   /* 공식별 탭에서 펼친 것만 기억 («이 문제» 탭은 늘 펼친 채) */ if(d.open) S.open[d.dataset.id]=1; else delete S.open[d.dataset.id]; save(); } }, true);
  /* 끌어 옮기기 */
  const hd=$('.fxhd',EL); let D=null;
  hd.addEventListener('pointerdown', e=>{ if(phone() || e.target.closest('button,input')) return;
    const r=EL.getBoundingClientRect(); D={ dx:e.clientX-r.left, dy:e.clientY-r.top }; try{ hd.setPointerCapture(e.pointerId) }catch(x){ q_(x) } e.preventDefault(); });
  hd.addEventListener('pointermove', e=>{ if(!D) return;
    S.x=Math.max(0,Math.min(innerWidth-120, e.clientX-D.dx)); S.y=Math.max(0,Math.min(innerHeight-60, e.clientY-D.dy)); place(); });
  const up=()=>{ if(D){ D=null; save(); } }; hd.addEventListener('pointerup',up); hd.addEventListener('pointercancel',up);
  /* 크기 바꾼 것 기억 */
  try{ new ResizeObserver(()=>{ if(!EL.classList.contains('on') || phone() || PLACING) return;   /* 화면이 좁아 줄여 그린 것은 기억 안 함 — 손으로 끈 크기만 */ const r=EL.getBoundingClientRect(); if(r.width>200 && r.height>150){ S.w=Math.round(r.width); S.h=Math.round(r.height); clearTimeout(pop.__t); pop.__t=setTimeout(save,300); } }).observe(EL); }catch(e){ q_(e) }
  EL.addEventListener('keydown', e=>{ if(e.key==='Escape'){ e.stopPropagation(); close(); } });
  return EL;
}
let PLACING=false;
function place(){
  if(!EL || phone()) return;
  PLACING=true; requestAnimationFrame(()=>requestAnimationFrame(()=>{ PLACING=false; }));
  const w=Math.min(S.w||430, innerWidth-12), h=Math.min(S.h||560, innerHeight-12);
  let x=S.x, y=S.y;
  if(x==null){ x=innerWidth-w-16; y=70; }
  x=Math.max(0,Math.min(innerWidth-Math.min(w,160), x)); y=Math.max(0,Math.min(innerHeight-60, y));
  EL.style.left=x+'px'; EL.style.top=y+'px'; EL.style.width=w+'px'; EL.style.height=h+'px';
}
function open(){ pop().classList.add('on'); place(); paint(true); $$('.fxb').forEach(b=>b.classList.add('open')); }
function close(){ EL && EL.classList.remove('on'); $$('.fxb').forEach(b=>b.classList.remove('open')); }
const isOpen=()=>!!(EL && EL.classList.contains('on'));

/* 공식 카드 */
function card(f, opt){
  opt=opt||{};
  const I=build(), list=I.byF.get(f.id)||[], me=curId();
  const openA = opt.open!=null ? opt.open : !!S.open[f.id];
  const chips = opt.chips===false ? '' : `<div class="chips">${list.map(r=>`<button type="button" class="chip${String(r.id)===me?' me':''}" data-go="${esc(r.id)}" title="${esc(pnameLong(r)+(tyC(r)?' · '+tyC(r):''))}">${esc(pname(r))}</button>`).join('')||'<span class="fxemp">짝지어진 문항 없음</span>'}</div>`;
  return `<details class="fxc${f.basic?' basic':''}${list.length?'':' zero'}" data-id="${f.id}"${openA?' open':''}>
    <summary><span class="car">▶</span><span class="nm">${esc(f.name)}${f.basic?' <small style="color:#94a3b8;font-weight:600">· 기본식</small>':''}</span><span class="ct" title="이 공식이 쓰인 문항 수">${list.length}문항</span></summary>
    <div class="eq">${tex(f.tex,true)}</div>
    ${(f.alt||[]).map(a=>`<div class="alt"><span class="lb">다른 모양</span>${tex(a,false)}</div>`).join('')}
    ${f.v?`<div class="v">${esc(f.v)}</div>`:''}
    ${chips}
  </details>`;
}
const match=(f,q)=>!q || (f.name+' '+f.cat+' '+(f.v||'')).toLowerCase().includes(q.toLowerCase());
function rowMatch(r,q){
  if(!q) return true;
  const m=q.replace(/\s/g,'').match(/^(\d{2,4})[-.년]?(\d)?회?[-.]?(\d{1,2})?번?$/);
  if(m){ const y=m[1].length===2?2000+(+m[1]):+m[1]; if(+r.year!==y) return false; if(m[2] && +r.session!==+m[2]) return false; if(m[3] && +r.no!==+m[3]) return false; return true; }
  return pname(r).includes(q) || tyC(r).includes(q);
}
let PSIG='';
function paint(force, focus){
  if(!isOpen()) return;
  const I=build(), me=curId();
  const sig=S.tab+'|'+me+'|'+Q+'|'+ISIG;
  if(!force && sig===PSIG) return; PSIG=sig;
  $$('.fxtabs [data-tab]',EL).forEach(b=>b.classList.toggle('on', b.dataset.tab===S.tab));
  const bd=$('.fxbd',EL), keep=bd.scrollTop, info=$('.fxsr small',EL);
  let h='';
  if(S.tab==='now'){
    const r=rowOf(me);
    if(!r){ h='<div class="fxemp">문항을 열면 그 문항에 쓰는 공식이 여기 나옵니다.</div>'; }
    else{
      const ids=(I.byRow.get(String(r.id))||[]).map(id=>FBY.get(id)).filter(f=>match(f,Q));
      const main=ids.filter(f=>!f.basic), base=ids.filter(f=>f.basic);
      h+=`<div class="fxnow">${esc(pnameLong(r))}</div>${tyC(r)?`<div class="fxty">유형 · ${esc(tyC(r))}</div>`:''}`;
      h+=`<div class="fxh">이 문제에 쓰는 공식 (정석식)</div>`;
      h+= main.length ? main.map(f=>card(f,{open:true,chips:false})).join('') : '<div class="fxemp">딱 맞는 공식을 못 찾음 — 단답·서술형이거나 목록에 아직 없는 식</div>';
      if(base.length) h+=`<div class="fxh">기본식</div>`+base.map(f=>card(f,{open:false,chips:false})).join('');
      const sy=symLines(r.easy_md);
      if(sy.length) h+=`<div class="fxh">해설에 쓴 기호식</div>`+sy.map(t=>`<div class="sym">${tex(t,true)}</div>`).join('');
    }
    info.textContent='';
  }else if(S.tab==='f'){
    let n=0;
    CATS.forEach(c=>{
      const fs=LIB.filter(f=>f.cat===c && match(f,Q)); if(!fs.length) return;
      n+=fs.length;
      h+=`<div class="cat">${esc(c)}</div>`+fs.map(f=>card(f)).join('');
    });
    if(!n) h='<div class="fxemp">찾는 공식이 없음</div>';
    info.textContent=`공식 ${n}개`;
  }else{
    const R0=rows().slice().sort(I.ord).filter(r=>rowMatch(r,Q));
    let last='', shown=0;
    R0.forEach(r=>{
      const ids=I.byRow.get(String(r.id))||[]; if(!ids.length && !Q) return;
      const k=r.year+'|'+r.session;
      if(k!==last){ if(last) h+='</div>'; last=k; h+=`<div class="sgrp"><div class="sess">${esc(real(r.year)?`${r.year}년 ${r.session}회`:`${yname(r.year)} ${r.session}회`)}</div>`; }
      shown++;
      const fs=ids.map(id=>FBY.get(id)).sort((a,b)=>(a.basic||0)-(b.basic||0));
      h+=`<div class="prow${String(r.id)===me?' me':''}" data-row="${esc(r.id)}"><span class="no">${esc(r.no)}번</span><span class="fs">${fs.map(f=>`<span class="fn" data-fx="${f.id}" title="공식별에서 보기">${esc(f.name)}</span>`).join('')||'<span class="fn" style="opacity:.6">공식 없음</span>'}${tyC(r)?`<span class="ty">${esc(tyC(r))}</span>`:''}</span></div>`;
    });
    if(last) h+='</div>';
    if(!shown) h='<div class="fxemp">해당 문항 없음</div>';
    info.textContent=`문항 ${shown}개`;
  }
  bd.innerHTML=h;
  if(focus){ const el=bd.querySelector(`.fxc[data-id="${CSS.escape(focus)}"]`); if(el){ el.open=true; el.scrollIntoView({block:'start'}); el.classList.add('hl'); } }
  else if(!force || S.tab!=='now') bd.scrollTop=keep;
  else if(S.tab==='now') bd.scrollTop=0;
}

/* ══ ⑤ 단추 — 미니맵 옆 (한눈에 · 일반 보기 문제 칸 이름줄) ══ */
function mount(){
  $$('.mmb').forEach(mm=>{
    const lab=mm.parentElement; if(!lab || lab.querySelector(':scope > .fxb')) return;
    const b=document.createElement('button'); b.type='button'; b.className='fxb'+(isOpen()?' open':''); b.textContent='📐 공식';
    b.title='이 문제에 쓰는 공식 · 공식별 · 번호별 — 창을 띄운 채로 풀 수 있음';
    b.addEventListener('click', ev=>{ ev.preventDefault(); ev.stopPropagation();
      const c=b.closest('.pcard'); if(c) LASTCARD=String(c.dataset.id);
      if(isOpen()){ if(S.tab==='now' && LASTID===curId()) return close(); S.tab='now'; save(); paint(true); return; }
      S.tab='now'; open(); });
    mm.after(b);
  });
}
setInterval(()=>{ try{ mount();
  if(isOpen()){ const id=curId(); if(id!==LASTID){ LASTID=id; paint(); } } }catch(e){ q_(e) } }, 700);
document.addEventListener('click', e=>{ const c=e.target.closest && e.target.closest('#list > .pcard[data-id]'); if(c) LASTCARD=String(c.dataset.id); }, true);
addEventListener('resize', ()=>{ try{ place() }catch(e){ q_(e) } });
window.__pracFx={ open, close, lib:LIB, build, symLines };
})();
