/* ═══════════════════════════════════════════════════════════════
   v347–v351 · 📐 공식 모음 — 미니맵 옆 «📐 공식» 단추 → 맨 위에 뜨는 창
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
{id:'p3',cat:'전력·역률',name:'3상 유효전력',kf:[R`\cos\theta=\dfrac{P}{\sqrt3\,V\,I}`,R`\cos\theta=\dfrac{P}{\sqrt3\,V\,I}\times100`,R`P_a=\sqrt3\,V\,I`,R`P_a=\sqrt3\,V\,I\times10^{-3}`],tex:R`P=\sqrt{3}\,V I\cos\theta`,
 alt:[R`I=\dfrac{P}{\sqrt{3}\,V\cos\theta}`,R`P_a=\sqrt{3}\,VI\;(\text{피상}),\quad Q=\sqrt{3}\,VI\sin\theta\;(\text{무효})`],
 v:'V 선간전압 · I 선전류 · cosθ 역률',basic:1,
 m:{q:/3\s*상|3\s*[φΦ∅ϕ]/,x:/(√\s*3|\\sqrt\s*\{?\s*3)[^\n]{0,60}(cos|역률|0\.\d)|역률/}},
{id:'vph',cat:'전력·역률',name:'상전압 ↔ 선간전압 (Y결선)',tex:R`E=\dfrac{V}{\sqrt3}`,alt:[R`V=\sqrt3\,E`],kf:[R`V_1=\dfrac{V_l}{\sqrt3}`,R`V_p=\dfrac{V_l}{\sqrt3}`,R`E=\dfrac{V_l}{\sqrt3}`],v:'E 상전압(대지전압) · V 선간전압',basic:1},
{id:'p1',cat:'전력·역률',name:'단상 유효전력',tex:R`P=VI\cos\theta`,alt:[R`I=\dfrac{P}{V\cos\theta}`],
 v:'V 전압 · I 전류 · cosθ 역률',basic:1,m:{q:/단상/,x:/역률|cos/}},
{id:'pq',cat:'전력·역률',name:'피상·유효·무효전력 관계',kf:[R`P_a=\dfrac{P}{\cos\theta}`,R`P=P_a\cos\theta`,R`P_r=P_a\sin\theta`,R`Q=P_a\sin\theta`,R`P_a=\sqrt{P^2+P_r^2}`,R`\cos\theta=\dfrac{P}{\sqrt{P^2+Q^2}}`,R`\cos\theta=\dfrac{P}{\sqrt{P^2+Q^2}}\times100`,R`\cos\theta=\dfrac{P}{P_a}\times100`,R`P_a=\dfrac{P}{\eta\cos\theta}`],tex:R`P_a=\sqrt{P^2+Q^2},\quad \cos\theta=\dfrac{P}{P_a},\quad Q=P\tan\theta`,
 alt:[R`\sin\theta=\sqrt{1-\cos^2\theta}`,R`\tan\theta=\dfrac{\sin\theta}{\cos\theta}=\dfrac{\sqrt{1-\cos^2\theta}}{\cos\theta}`],
 v:'P 유효 · Q 무효 · Pa 피상',m:{q:/피상\s*전력|무효\s*전력/}},
{id:'pcomb',cat:'전력·역률',name:'합성(종합) 역률',kf:[R`Q=\dfrac{P_1}{\cos\theta_1}\sin\theta_1+\dfrac{P_2}{\cos\theta_2}\sin\theta_2`],tex:R`\cos\theta=\dfrac{\sum P}{\sqrt{\left(\sum P\right)^2+\left(\sum Q\right)^2}}`,
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
{id:'srx',cat:'역률 개선',name:'직렬 리액터 용량',kf:[R`\omega L=\dfrac{1}{5^2}\cdot\dfrac{1}{\omega C}`],tex:R`X_L=0.04\,X_C\;(\text{이론}),\qquad X_L=0.06\,X_C\;(\text{실제})`,
 v:'제5고조파 억제 — 5ωL > 1/(5ωC)',m:{q:/직렬\s*리액터/}},

/* ── 전압강하·전선 ── */
{id:'vd3',cat:'전압강하·전선',name:'3상 전압강하',kf:[R`e=\dfrac{P}{V_r}\left(R+X\tan\theta\right)`,R`P=\dfrac{e\,V}{R+X\tan\theta}`,R`V_B=V_A-\sqrt3\,I_1\left(R_1\cos\theta+X_1\sin\theta\right)`,R`V_C=V_B-\sqrt3\,I_2\left(R_2\cos\theta+X_2\sin\theta\right)`],tex:R`e=\sqrt{3}\,I\left(R\cos\theta+X\sin\theta\right)`,
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
{id:'demand',cat:'수용·부하',name:'수용률',kf:[R`\text{수용률}=\dfrac{\text{최대수요전력}}{\text{부하설비합계}}\times100`,R`\text{수용률}=\dfrac{\text{최대수요전력}}{\text{설비용량}}\times100`],tex:R`\text{수용률}=\dfrac{\text{최대 수용전력}}{\text{설비용량}}\times100\;[\%]`,m:{q:/수용\s*률/}},
{id:'divers',cat:'수용·부하',name:'부등률',kf:[R`\text{합성최대수요전력}=\dfrac{\text{설비용량}\times\text{수용률}}{\text{부등률}}`,R`\text{합성최대전력}=\dfrac{\text{설비용량}\times\text{수용률}}{\text{부등률}}`],tex:R`\text{부등률}=\dfrac{\text{개별 최대 수용전력의 합}}{\text{합성 최대 수용전력}}\ \ (\ge 1)`,m:{q:/부등\s*률/}},
{id:'loadf',cat:'수용·부하',name:'부하율',kf:[R`\text{일부하율}=\dfrac{\text{평균수요전력}}{\text{최대수요전력}}\times100`,R`\text{부하율}=\dfrac{\text{평균수요전력}}{\text{최대수요전력}}\times100`],tex:R`\text{부하율}=\dfrac{\text{평균 전력}}{\text{최대 전력}}\times100\;[\%]`,alt:[R`\text{평균 전력}=\dfrac{\text{사용 전력량}}{\text{시간}}`],m:{q:/부하\s*율/,no:/최대\s*효율|철손|동손|전일\s*효율/}},
{id:'trcap',cat:'수용·부하',name:'변압기 용량 산정',kf:[R`\text{변압기용량}=\dfrac{\text{설비용량}\times\text{수용률}}{\text{부등률}\times\text{역률}\times\text{효율}}`,R`\text{변압기용량}=\dfrac{\text{설비용량}\times\text{수용률}}{\text{부등률}\times\text{역률}}`,R`P_{Tr}=\dfrac{\text{설비용량}\times\text{수용률}}{\text{부등률}\times\text{역률}}`],tex:R`P_{TR}\ge\dfrac{\sum\left(\text{설비용량}\times\text{수용률}\right)}{\text{부등률}\times\cos\theta}\;[\text{kVA}]`,
 v:'계산값보다 한 단계 큰 표준 용량을 고름',m:{q:/변압기\s*(의)?\s*(용량|표준\s*용량|정격\s*용량|크기)/,x:/수용\s*률|부등\s*률/}},
{id:'branch',cat:'수용·부하',name:'분기회로 수',tex:R`N=\dfrac{\text{부하 설비용량}[\text{VA}]}{\text{사용전압}\times\text{분기회로 전류}}`,
 v:'소수점은 올림 (16 A·20 A 분기 등)',m:{q:/분기\s*회로\s*(수|를|의\s*수)?/}},
{id:'unbal',cat:'수용·부하',name:'설비 불평형률',tex:R`\text{단상 3선}:\ \dfrac{\text{두 전압측 설비용량 차}}{\text{총 설비용량}\times\frac12}\times100,\qquad \text{3상}:\ \dfrac{\text{최대}-\text{최소}}{\text{총 설비용량}\times\frac13}\times100`,
 v:'단상 3선 40 % 이하 · 3상 30 % 이하',m:{q:/불평형\s*률|설비\s*불평형/}},

/* ── 변압기 ── */
{id:'subarea',cat:'수용·부하',name:'변전실 추정 면적',tex:R`A=k\times(\text{변압기 용량 [kVA]})^{0.7}\;[\text{m}^2]`,v:'k 추정계수 (형식·전압별 표값)',m:{q:/변전실.{0,80}(추정\s*)?(면적|넓이)/}},
{id:'contract',cat:'수용·부하',name:'계약전력 (설비용량 환산)',tex:R`P_{\text{계약}}=\sum\left(\text{구간 설비용량}\times\text{환산율}\right)`,v:'처음 75 kW 100% · 다음 75 kW 85% · 다음 75 kW 75% · 다음 75 kW 65% · 300 kW 초과분 60% (한전 약관)',m:{q:/계약\s*(최대\s*)?전력/,x:/환산\s*율/,no:/아파트|세대/}},
{id:'spot',cat:'수용·부하',name:'스폿 네트워크 변압기 용량',tex:R`P_T=\dfrac{P_m}{n-1}\times\dfrac{100}{\alpha}`,kf:[R`\text{변압기용량}=\dfrac{\text{최대수요전력}}{\text{최대회선수}-1}\times\dfrac{100}{\text{과부하율}}`],v:'Pm 최대 수요전력 · n 회선 수 (한 회선 빠져도 버팀) · α 과부하율 [%]',m:{q:/스폿|spot\s*network/i,x:/과부하\s*율|회선\s*수\s*-\s*1|n\s*-\s*1/}},
{id:'lcen',cat:'수용·부하',name:'부하 중심 거리',tex:R`L=\dfrac{\sum L_i\,I_i}{\sum I_i}`,kf:[R`L=\dfrac{L_1I_1+L_2I_2+L_3I_3}{I_1+I_2+I_3}`],v:'Li 각 부하까지 거리 · Ii 부하 전류(또는 전력) — 좌표면 X·Y 따로',m:{q:/부하\s*중심/}},
{id:'treff',cat:'변압기',name:'변압기 효율',kf:[R`\eta=\dfrac{m\,P_a\cos\theta}{m\,P_a\cos\theta+P_i+m^2P_c}\times100`],tex:R`\eta=\dfrac{mP\cos\theta}{mP\cos\theta+P_i+m^2P_c}\times100\;[\%]`,
 v:'m 부하율 · Pi 철손 · Pc 전부하 동손',m:{q:/변압기/,x:/철손|동손|무부하\s*손|부하\s*손/,no:/전일\s*효율/}},
{id:'trmax',cat:'변압기',name:'최대 효율 조건',tex:R`P_i=m^2P_c\quad\Rightarrow\quad m=\sqrt{\dfrac{P_i}{P_c}}`,v:'철손 = 동손 일 때 최대',m:{q:/최대\s*효율/}},
{id:'trday',cat:'변압기',name:'전일 효율',tex:R`\eta_d=\dfrac{\sum hP}{\sum hP+24P_i+\sum h\,m^2P_c}\times100`,v:'h 시간 · 철손은 24시간 내내',m:{q:/전일\s*효율/}},
{id:'tap',cat:'변압기',name:'변압기 탭 조정',tex:R`E_1'=E_1\times\dfrac{V_2}{V_2'}`,kf:[R`E_1=\dfrac{V_1}{V_2}\times E_2`],v:'E1 지금 탭 전압 · V2 지금 2차 전압 · V2′ 맞추려는 2차 전압 — 계산값에 가까운 탭 선택',m:{q:/[탭랩].{0,80}(얼마|몇)/,x:/(고압|1\s*차)\s*측/,no:/계전기/}},
{id:'vconn',cat:'변압기',name:'V 결선',kf:[R`P_1=\dfrac{P_V}{\sqrt3}`,R`P_1=\dfrac{P_v}{\sqrt3}`],tex:R`P_V=\sqrt{3}\,P_1,\qquad \text{이용률}=\dfrac{\sqrt3}{2}=0.866,\qquad \text{출력비}=\dfrac{1}{\sqrt3}=0.577`,
 v:'P₁ 변압기 1대 용량',m:{q:/V\s*결선|V\s*-\s*V\s*결선|이용\s*률|출력\s*비/}},
{id:'trpar',cat:'변압기',name:'병렬운전 부하분담',tex:R`\dfrac{P_a}{P_b}=\dfrac{P_A}{P_B}\cdot\dfrac{\%Z_b}{\%Z_a}`,v:'분담은 용량에 비례 · %Z 에 반비례',m:{q:/병렬\s*운전/,x:/분담|부하/}},
{id:'auto',cat:'변압기',name:'단권변압기 자기용량',tex:R`\dfrac{\text{자기용량}}{\text{부하용량}}=\dfrac{V_h-V_l}{V_h}`,m:{q:/단권\s*변압기/}},
{id:'trreg',cat:'변압기',name:'변압기 전압변동률',tex:R`\varepsilon=p\cos\theta+q\sin\theta`,v:'p %저항강하 · q %리액턴스강하',m:{q:/전압\s*변동\s*률/,x:/변압기/}},

/* ── %임피던스·단락·차단 ── */
{id:'pz',cat:'%임피던스·단락',name:'%임피던스 ↔ 옴',kf:[R`X=\dfrac{\%X\times10\,V^2}{P}`],tex:R`\%Z=\dfrac{I_nZ}{E}\times100=\dfrac{P\,Z}{10\,V^2}`,alt:[R`Z=\dfrac{10\,V^2\,\%Z}{P}\;[\Omega]`],
 v:'P [kVA] · V [kV] · Z [Ω]',m:{q:/(%\s*[ZXR]|퍼센트\s*(임피던스|리액턴스)|%\s*임피던스|%\s*리액턴스)/,x:/\[\s*Ω\s*\]|Ω|옴/}},
{id:'pzb',cat:'%임피던스·단락',name:'기준용량 환산',kf:[R`\%Z_{new}=\dfrac{P_{new}}{P_{old}}\times\%Z_{old}`],tex:R`\%Z'=\%Z\times\dfrac{P_{\text{기준}}}{P_{\text{자기}}}`,v:'모든 %Z 를 같은 기준 용량으로 맞춘 뒤 더함',
 m:{q:/(%\s*[ZX]|%\s*임피던스|%\s*리액턴스)/,x:/기준|환산|\[\s*MVA\s*\]\s*기준|MVA\s*기준/}},
{id:'is',cat:'%임피던스·단락',name:'단락전류',kf:[R`I_s=\dfrac{100}{\%Z}\,I_n`],tex:R`I_s=\dfrac{100}{\%Z}\,I_n`,alt:[R`I_n=\dfrac{P_n}{\sqrt3\,V_n}`,R`I_s=\dfrac{E}{Z}\;(\text{옴법})`],v:'In 기준용량의 정격전류',m:{q:/단락\s*전류/}},
{id:'ps',cat:'%임피던스·단락',name:'단락용량',kf:[R`\%Z_s=\dfrac{P_n}{P_s}\times100`,R`\%Z=\dfrac{P_n}{P_s}\times100`],tex:R`P_s=\dfrac{100}{\%Z}\,P_n`,v:'Pn 기준용량',m:{q:/단락\s*용량/}},
{id:'cb',cat:'%임피던스·단락',name:'차단기 차단용량',tex:R`P_s=\sqrt3\,V_n\,I_s`,v:'Vn 정격전압 · Is 정격차단전류 — 계산값보다 한 단계 큰 표준값',m:{q:/차단\s*(기\s*(의)?\s*)?(용량|정격\s*차단\s*전류)|정격\s*차단\s*(용량|전류)/}},
{id:'pz3',cat:'%임피던스·단락',name:'3권선 변압기 %X',tex:R`\%X_1=\tfrac12\left(\%X_{12}+\%X_{13}-\%X_{23}\right)`,
 alt:[R`\%X_2=\tfrac12\left(\%X_{12}+\%X_{23}-\%X_{13}\right),\quad \%X_3=\tfrac12\left(\%X_{13}+\%X_{23}-\%X_{12}\right)`],v:'먼저 모두 같은 기준용량으로 환산',m:{q:/3\s*권선/}},
{id:'pzsum',cat:'%임피던스·단락',name:'%Z 합성 (직렬·병렬)',tex:R`\%Z_{\text{직렬}}=\%Z_1+\%Z_2,\qquad \%Z_{\text{병렬}}=\dfrac{\%Z_1\,\%Z_2}{\%Z_1+\%Z_2}`,
 m:{q:/(%\s*[ZX]|%\s*임피던스|%\s*리액턴스)/,x:/합성|직렬|병렬/}},
{id:'in',cat:'%임피던스·단락',name:'정격(부하)전류',kf:[R`I=\dfrac{P}{\sqrt3\,V}`,R`I_n=\dfrac{P}{\sqrt3\,V}`,R`I_1=\dfrac{P}{\sqrt3\,V}`,R`I=\dfrac{P}{\sqrt3\,V\cos\theta}`,R`I=\dfrac{P}{\sqrt3\,V\cos\theta\,\eta}`,R`P_n=\sqrt3\,V\,I_n`],tex:R`I_n=\dfrac{P_n}{\sqrt3\,V_n}`,v:'3상 · P [kVA] · V [kV] → I [A]',basic:1,m:{q:/정격\s*전류|부하\s*전류|전부하\s*전류/,x:/3\s*상|√\s*3|\\sqrt\s*\{?3/}},

/* ── CT·PT·계전기·계기 ── */
{id:'ct',cat:'CT·PT·계전기',name:'CT 1차 정격전류 선정',tex:R`I_1=\dfrac{P}{\sqrt3\,V}\times(1.25\sim1.5)`,v:'계산값 바로 위 표준값(…100·150·200 A) 선택',m:{q:/(CT|변류기)/,x:/변류\s*비|정격\s*전류|1\s*차\s*(정격)?\s*전류|선정|(CT|변류기)\s*\d*\s*(의)?\s*(변류)?\s*비\s*(를|을)\s*(구|선정|정하)/}},
{id:'relay',cat:'CT·PT·계전기',name:'계전기 전류 · 탭 정정',tex:R`I_r=I_1\times\dfrac{1}{\text{CT비}},\qquad \text{탭}=I_L\times\dfrac{1}{\text{CT비}}\times(\text{정정 배수})`,
 v:'과전류 계전기(OCR) 정정은 보통 부하전류의 150 %',m:{q:/(계전기|OCR|과전류\s*계전기)/,x:/(탭|tap|TAP|정정|흐르는\s*전류|2\s*차\s*전류)/i}},
{id:'burden',cat:'CT·PT·계전기',name:'CT 부담',tex:R`P=I^2Z\;[\text{VA}]`,alt:[R`Z=\dfrac{P}{I^2}`],v:'CT 2차 정격 5 A',m:{q:/부담/,x:/CT|변류기|VA|\[\s*VA\s*\]/}},
{id:'meter',cat:'CT·PT·계전기',name:'계기 지시 → 실제 전력',tex:R`P=\text{지시값}\times\text{CT비}\times\text{PT비}`,m:{q:/(PT|계기용\s*변압기|변성기|MOF)/,x:/(지시|측정|전력계|배율|수전\s*전력)/}},
{id:'wh',cat:'CT·PT·계전기',name:'전력량계 계기정수',kf:[R`P_M=\dfrac{3600\,n}{t\,k}`,R`P=\dfrac{3600\,n}{t\,K}`],tex:R`P=\dfrac{3600\,n}{t\,K}\times\text{CT비}\times\text{PT비}\;[\text{kW}]`,v:'n 회전수 · t 초 · K 계기정수[rev/kWh]',m:{q:/계기\s*정수|원판|rev\s*\/\s*kWh/i,x:/전력량\s*계|적산\s*전력계|계기\s*정수/}},
{id:'err',cat:'CT·PT·계전기',name:'오차율 · 보정률',kf:[R`\varepsilon=\dfrac{M-T}{T}\times100`,R`\varepsilon=\dfrac{T-M}{M}\times100`,R`\alpha=\dfrac{T-M}{M}\times100`,R`\varepsilon=M-T`,R`\alpha=T-M`,R`T=\dfrac{M}{1+\varepsilon}`],tex:R`\text{오차율}=\dfrac{M-T}{T}\times100,\qquad \text{보정률}=\dfrac{T-M}{M}\times100`,v:'M 측정값 · T 참값',m:{q:/오차\s*율|보정\s*률/}},

/* ── 조명 ── */
{id:'w1',cat:'측정·계기',name:'1전력계법 (평형 3상)',tex:R`P_3=3\,W`,kf:[R`W_3=3W`,R`P=3W`],v:'W 전력계 1대 지시값 (한 상의 전력) — 평형 3상이라 3배',m:{q:/평형\s*3\s*상|3\s*상\s*평형/,x:/전력계\s*(의)?\s*지시/,no:/(2|두)\s*(개|대)\s*(의)?\s*전력계|전력계\s*(2|두)|(2|두)\s*전력계/}},
{id:'w2',cat:'측정·계기',name:'2전력계법',tex:R`P=W_1+W_2`,alt:[R`Q=\sqrt3\,(W_1-W_2)`,R`\cos\theta=\dfrac{W_1+W_2}{2\sqrt{W_1^2+W_2^2-W_1W_2}}`],kf:[R`P=W_2+W_1`],v:'W1·W2 두 전력계 지시값 — 한쪽이 음(−)이면 빼서 더함',m:{q:/(2|두)\s*전력계|전력계\s*(2|두)\s*(대|개)/}},
{id:'v3',cat:'측정·계기',name:'3전압계법',tex:R`P=\dfrac{V_3^2-V_1^2-V_2^2}{2R}`,alt:[R`\cos\theta=\dfrac{V_3^2-V_1^2-V_2^2}{2V_1V_2}`],v:'R 직렬로 넣은 기지 저항 · V3 전체 전압',m:{q:/(3|세)\s*전압계/}},
{id:'a3',cat:'측정·계기',name:'3전류계법',kf:[R`P=\dfrac{R}{2}\left(A_1^2-A_2^2-A_3^2\right)`,R`\cos\theta=\dfrac{A_1^2-A_2^2-A_3^2}{2A_2A_3}`],tex:R`P=\dfrac{R}{2}\left(A_3^2-A_1^2-A_2^2\right)`,alt:[R`\cos\theta=\dfrac{A_3^2-A_1^2-A_2^2}{2A_1A_2}`],v:'R 병렬로 넣은 기지 저항 · A3 전체 전류',m:{q:/(3|세)\s*전류계/}},
{id:'mult',cat:'측정·계기',name:'배율기 · 분류기',kf:[R`\text{분류저항}=\dfrac{1}{\text{배율}-1}\times\text{전류계내부저항}`],tex:R`R_m=(n-1)\,R_v`,alt:[R`R_s=\dfrac{R_a}{n-1}`,R`n=\dfrac{V}{V_v}=1+\dfrac{R_m}{R_v}`],v:'n 배율 (늘리려는 측정 범위 ÷ 원래 범위) · Rv 전압계 내부저항 · Ra 전류계 내부저항',m:{q:/배율기|분류기/}},
{id:'kohl',cat:'측정·계기',name:'접지저항 측정 (콜라우시 브리지)',kf:[R`R_3=\dfrac12\left(R_{13}+R_{32}-R_{12}\right)`,R`R_{13}+R_{32}-R_{12}=2R_3`],tex:R`R_x=\dfrac12\left(R_{ab}+R_{ca}-R_{bc}\right)`,v:'a 측정할 접지극 · b·c 보조 접지극 — 두 극 사이 저항 3개로 a 만 남김',m:{q:/콜라?우시|코올라우시|접지\s*저항/,x:/콜라?우시|코올라우시|R_?\{?(ab|bc|ca)|\b(ab|bc|ca)\s*(간|사이)|보조\s*접지|접지\s*판|상호\s*간/i,no:/전위\s*강하|전자식\s*접지\s*저항계/}},
{id:'rod',cat:'접지·지락·절연',name:'접지봉 접지저항',tex:R`R=\dfrac{\rho}{2\pi l}\ln\dfrac{2l}{r}`,alt:[R`R=\dfrac{\rho}{2\pi l}\ln\dfrac{4l}{d}`],v:'ρ 대지 저항률 [Ω·m] · l 접지봉 길이 [m] · r 반지름 · d 지름 (같은 단위)',m:{q:/접지\s*봉/,x:/저항률|고유\s*저항/}},
{id:'wenner',cat:'측정·계기',name:'대지 저항률 (위너 4전극법)',tex:R`\rho=2\pi a R\;[\Omega\cdot\text{m}]`,v:'a 전극 간격 [m] · R 측정 저항 [Ω]',m:{q:/위너|웨너|wenner|4\s*전극|대지\s*(저항률|고유\s*저항)\s*(을|를)?\s*(측정|구|계산)/i}},
{id:'cterr',cat:'측정·계기',name:'변류기 비오차',tex:R`\varepsilon=\dfrac{K_n-K}{K}\times100\;[\%]`,alt:[R`K=\dfrac{I_1}{I_2}`],v:'Kn 공칭 변류비 · K 실제 변류비 (1차 전류 ÷ 2차 전류)',m:{q:/비\s*오차/}},
{id:'thd',cat:'측정·계기',name:'고조파 왜형률 (THD)',tex:R`\text{THD}=\dfrac{\sqrt{V_3^2+V_5^2+\cdots}}{V_1}\times100\;[\%]`,alt:[R`V_3=\sqrt{V_p^2-V_1^2}\;(\text{상전압에 3고조파만 있을 때})`],kf:[R`\text{왜형률}=\dfrac{V_3}{V_1}\times100`,R`\text{THD}=\dfrac{V_3}{V_1}\times100`,R`THD=\dfrac{\sqrt{V_3^2+V_5^2+V_n^2}}{V_1}`,R`V_3=\sqrt{V_P^2-V_1^2}`],v:'V1 기본파 · V3·V5 고조파 실효값 — 선간전압엔 3고조파가 안 나타남',m:{q:/왜형률|THD|종합\s*고조파/i}},
{id:'murray',cat:'측정·계기',name:'머레이 루프법 (고장점 거리)',tex:R`x=\dfrac{2L\,b}{a+b}`,alt:[R`a\,x=b\,(2L-x)`],kf:[R`a\times x=b\times(2L-x)`,R`x=\dfrac{2bL}{a+b}`,R`P\,X=Q\,(2L-X)`,R`X=\dfrac{Q}{P+Q}\times2L`],v:'L 선로 길이 · a·b 브리지 저항 (휘트스톤 평형) — 왕복이라 2L',m:{q:/머레이|murray/i,no:/열거|구분하여/}},
{id:'fop',cat:'측정·계기',name:'전위강하법 (접지저항)',tex:R`R_E=\dfrac{V}{I}`,alt:[R`\dfrac{\overline{EP}}{\overline{EC}}=0.618\;(61.8\%\ \text{법칙})`],kf:[R`\dfrac{P}{C}=0.618`],v:'E 측정 접지극 · P 전위 보조극 · C 전류 보조극 — P 를 E~C 거리의 61.8 % 에 두면 참값',m:{q:/전위\s*강하\s*법/}},
{id:'probe',cat:'측정·계기',name:'오실로스코프 감쇄 프로브',tex:R`V_o=\dfrac{R_s}{R_p+R_s}\,V_i`,alt:[R`\tau=R_{th}\,C_s,\quad T=\dfrac{1}{f}`],kf:[R`V_0=\dfrac{R_s}{R_p+R_s}V_i`,R`E_{th}=\dfrac{R_s}{R_p+R_s}V_i`],v:'Rs 스코프 입력저항 · Rp 프로브 저항 — 10:1 이면 Rp = 9 Rs',m:{q:/오실로스코프|감쇄\s*프로브/}},
{id:'rc',cat:'측정·계기',name:'직렬 회로 역률 · 전력 (R-X)',tex:R`\cos\theta=\dfrac{R}{\sqrt{R^2+X_C^2}}`,alt:[R`P=I^2R=\dfrac{V^2R}{R^2+X_C^2},\quad X_C=\dfrac{1}{2\pi fC}`],kf:[R`\cos\theta=\dfrac{R}{\sqrt{R^2+X_c^2}}`,R`P=\dfrac{V^2R}{R^2+X_c'^2}`],v:'주파수가 바뀌면 Xc 가 f 에 반비례해서 바뀜',m:{q:/(정전\s*용량|커패시터|콘덴서).{0,30}직렬\s*회로|직렬\s*회로.{0,40}역률/,x:/주파수/}},
{id:'dy',cat:'측정·계기',name:'Y → Δ 등가 변환',tex:R`R_{ab}=\dfrac{R_aR_b+R_bR_c+R_cR_a}{R_c}`,alt:[R`R_a=\dfrac{R_{ab}R_{ca}}{R_{ab}+R_{bc}+R_{ca}}\;(\Delta\to Y)`],kf:[R`R_{bc}=\dfrac{R_aR_b+R_bR_c+R_cR_a}{R_a}`,R`R_{ca}=\dfrac{R_aR_b+R_bR_c+R_cR_a}{R_b}`],v:'분자는 셋 다 같음 (두 개씩 곱한 합) · 분모는 마주 보는 저항',m:{q:/(Y|Δ|△|스|A)\s*결선\s*회로.{0,10}등가/}},
{id:'lamp',cat:'조명',name:'광속법 (등 수 · 평균 조도)',kf:[R`N=\dfrac{A\,E}{F\,U\,M}`,R`N=\dfrac{E\,A}{F\,U\,M}`],tex:R`N=\dfrac{D\,A\,E}{F\,U}=\dfrac{A\,E}{F\,U\,M}`,alt:[R`E=\dfrac{F\,U\,N}{D\,A}`,R`F=\dfrac{D\,A\,E}{N\,U}`],
 v:'D 감광보상률 · A 면적 · E 조도 · F 등 1개 광속 · U 조명률 · M 보수율(=1/D)',m:{q:/(등\s*(의)?\s*수|등수|등\s*기구\s*(의)?\s*수|소요\s*등|램프\s*(의)?\s*수|평균\s*조도|조명\s*률|몇\s*등)/,x:/조도|lx|룩스|조명/}},
{id:'ridx',cat:'조명',name:'실지수',kf:[R`H=H_{\text{천장}}-H_{\text{작업면}}`,R`RI=\dfrac{X\,Y}{H\,(X+Y)}`],tex:R`K=\dfrac{X\,Y}{H\,(X+Y)}`,v:'X·Y 방 가로·세로 · H 등~작업면 높이',m:{q:/실\s*지수/}},
{id:'maint',cat:'조명',name:'감광보상률 · 보수율',tex:R`D=\dfrac{1}{M}`,m:{q:/감광\s*보상\s*률|보수\s*율|유지\s*율/,no:/축전지/}},
{id:'illum',cat:'조명',name:'점광원 조도 (거리 역제곱)',kf:[R`E_h=\dfrac{I}{h^2}\cos^3\theta`,R`E_h=\dfrac{I}{R^2}\cos\theta`],tex:R`E_n=\dfrac{I}{r^2},\qquad E_h=\dfrac{I}{r^2}\cos\theta,\qquad E_v=\dfrac{I}{r^2}\sin\theta`,
 alt:[R`E_h=\dfrac{I\,h}{\left(h^2+d^2\right)^{3/2}}`],v:'n 법선 · h 수평면 · v 수직면 · r 광원까지 거리',m:{q:/(법선|수평\s*면|수직\s*면)\s*(의)?\s*조도|조도[^.\n]{0,25}(구하|계산)/,x:/광도|\[\s*cd\s*\]|cd|칸델라/}},
{id:'leff',cat:'조명',name:'램프 효율 · 발광 효율',tex:R`\eta=\dfrac{F}{P}\;[\text{lm/W}]`,alt:[R`\varepsilon=\dfrac{F}{\phi}\;(\text{발광 효율})`],v:'F 전광속 · P 소비전력 · φ 방사속',m:{q:/(램프|전등|발광|광원)\s*(의)?\s*효율/}},
{id:'lcost',cat:'조명',name:'전구 경제성 비교',tex:R`C=\dfrac{\text{전구 값}}{\text{수명}}+P\times\text{전력량 요금}`,v:'1시간(또는 cd 당) 쓰는 데 드는 돈 = 전구 값 몫 + 전기요금 몫 — 작은 쪽이 유리',m:{q:/어느\s*(것|전구|전등|쪽)?.{0,20}(유리|경제)/,x:/전구|전등/}},
{id:'emit',cat:'조명',name:'광속발산도',tex:R`R=\dfrac{F}{S}`,alt:[R`R=\rho E\;(\text{반사}),\qquad R=\tau E\;(\text{투과})`],v:'F 나가는 광속 · S 면적',m:{q:/광속\s*발산도/}},
{id:'globe',cat:'조명',name:'글로브 효율 (완전 확산 구)',tex:R`\eta=\dfrac{\tau}{1-\rho}`,alt:[R`R=\dfrac{F}{S}\,\eta=\dfrac{4\pi I}{4\pi r^2}\cdot\dfrac{\tau}{1-\rho}=\dfrac{\tau I}{r^2(1-\rho)}`],
 v:'τ 투과율 · ρ 반사율',m:{q:/글로브|완전\s*확산/}},
{id:'flux',cat:'조명',name:'광원 모양별 전광속',tex:R`F=4\pi I\;(\text{구}),\qquad F=\pi^2 I\;(\text{원통}),\qquad F=\pi I\;(\text{평판})`,v:'I 광도[cd]',m:{q:/(전\s*광속|광속)/,x:/광도|\[\s*cd\s*\]|cd|칸델라/,no:/광속\s*발산도/}},
{id:'lum',cat:'조명',name:'휘도',tex:R`B=\dfrac{I}{S}\;[\text{cd/m}^2]`,v:'S 보이는(투영) 면적',m:{q:/휘도/}},
{id:'road',cat:'조명',name:'도로 조명 (등 간격)',kf:[R`\text{면적}=\dfrac12\times\text{도로폭}\times\text{등간격}`,R`F=\dfrac{E\,B\,S}{2\,U\,M}`,R`F=\dfrac{E\,B\,S\,D}{2\,U}`],tex:R`E=\dfrac{F\,U\,N}{D\,A},\qquad A=\dfrac{B\,S}{2}\;(\text{양쪽 배치}),\quad A=B\,S\;(\text{한쪽, 중앙})`,
 v:'B 도로 폭 · S 등 간격',m:{q:/도로|가로\s*등|등\s*간격|가로\s*조명/,x:/조도|lx|룩스|광속|조명\s*률/}},

/* ── 전동기·동력 ── */
{id:'pump',cat:'전동기·동력',name:'펌프(양수) 전동기 출력',kf:[R`P=\dfrac{9.8\,Q\,H\,k}{\eta_p}`,R`P=\dfrac{9.8\,Q\,H\,K}{\eta_p}`,R`P=\dfrac{Q\,H\,K}{6.12\,\eta_p}`,R`Q=\dfrac{6.12\,P\,\eta_p}{H\,K}`],tex:R`P=\dfrac{9.8\,Q\,H\,K}{\eta}\;[\text{kW}]\;(Q:\text{m}^3/\text{s})`,alt:[R`P=\dfrac{Q\,H\,K}{6.12\,\eta}\;[\text{kW}]\;(Q:\text{m}^3/\text{min})`],
 v:'H 양정[m] · K 여유계수 · η 효율',m:{q:/펌프|양수/}},
{id:'hoist',cat:'전동기·동력',name:'권상기·엘리베이터 출력',tex:R`P=\dfrac{W\,V}{6.12\,\eta}\;[\text{kW}]`,alt:[R`P=\dfrac{9.8\,W\,v}{\eta}\;(W:\text{t},\ v:\text{m/s})`],
 v:'W 무게[t] · V 속도[m/min]',m:{q:/권상|크레인|호이스트|엘리베이터|승강기/}},
{id:'fan',cat:'전동기·동력',name:'송풍기 출력',tex:R`P=\dfrac{Q\,H\,K}{6120\,\eta}\;[\text{kW}]`,v:'Q [m³/min] · H 풍압[mmAq]',m:{q:/송풍기|환풍기|팬/}},
{id:'ns',cat:'전동기·동력',name:'동기속도 · 슬립',kf:[R`N_s=\dfrac{120\,f}{P}`],tex:R`N_s=\dfrac{120\,f}{p},\qquad s=\dfrac{N_s-N}{N_s}`,alt:[R`N=(1-s)\,N_s`],m:{q:/동기\s*속도|슬립|회전\s*(속도|수)|극\s*수/}},
{id:'torque',cat:'전동기·동력',name:'토크',tex:R`T=0.975\,\dfrac{P}{N}\;[\text{kg}\cdot\text{m}]=9.55\,\dfrac{P}{N}\;[\text{N}\cdot\text{m}]`,v:'P [W] · N [rpm]',m:{q:/토크/}},
{id:'yd',cat:'전동기·동력',name:'Y-Δ 기동',kf:[R`I_{Yl}=\dfrac{V}{\sqrt3\,Z}`,R`I_{Yp}=\dfrac{V}{\sqrt3\,Z}`],tex:R`I_Y=\dfrac13 I_\Delta,\qquad T_Y=\dfrac13 T_\Delta`,v:'기동전류·기동토크 모두 1/3',m:{q:/Y\s*-?\s*(Δ|△|A|델타)\s*기동|와이\s*-?\s*델타\s*기동|성형\s*-?\s*삼각\s*기동/,x:/1\s*\/\s*3|√\s*3|\\sqrt|기동\s*(전류|토크)/}},
{id:'ks',cat:'전동기·동력',name:'동기발전기 단락비',tex:R`K_s=\dfrac{I_s}{I_n}`,alt:[R`K_s=\dfrac{100}{\%Z_s}`],v:'Is 3상 단락전류 (무부하 정격전압 낼 때 여자로) · In 정격전류',m:{q:/단락\s*비/}},
{id:'gen',cat:'전동기·동력',name:'자가발전기 용량 (전동기 기동)',tex:R`P_G\ge\left(\dfrac{1}{e}-1\right)x_d'\,P_s\;[\text{kVA}]`,v:'e 허용 전압강하율 · x′d 과도리액턴스 · Ps 기동 용량',m:{q:/발전기\s*(의)?\s*용량|자가\s*발전/,no:/수력|낙차/}},

/* ── 축전지·정류 ── */
{id:'heat',cat:'전동기·동력',name:'전열기 용량 (물 데우기)',tex:R`P=\dfrac{m\,c\,(T_2-T_1)}{860\,\eta\,t}\;[\text{kW}]`,alt:[R`H=0.24\,I^2Rt\;[\text{cal}]`,R`860\,P\,t\,\eta=m\,c\,(T_2-T_1)`],v:'m 질량 [kg·L] · c 비열 (물 1) · t 시간 [h] · 1 kWh = 860 kcal',m:{q:/(물|수)\s*.{0,30}(℃|°C|도)\s*(에서|로|까지)|온도\s*를?\s*(높|올|상승)|가열\s*(하|할|시)/,x:/860|kcal|비열/,no:/발전기|연료/}},
{id:'hydro',cat:'전동기·동력',name:'수력 발전 출력',tex:R`P=9.8\,Q\,H\,\eta\;[\text{kW}]`,alt:[R`P_a=\dfrac{9.8\,Q\,H\,\eta}{\cos\theta}\;[\text{kVA}]`],v:'Q 사용 수량 [m³/s] · H 유효 낙차 [m] · η 수차×발전기 종합 효율',m:{q:/낙차|수력\s*발전/}},
{id:'fuel',cat:'전동기·동력',name:'발전기 연료량 · 운전시간',tex:R`860\,P\,t=m\,H\,\eta`,alt:[R`t=\dfrac{m\,H\,\eta}{860\,P}`,R`P=\dfrac{m\,H\,\eta_g\,\eta_t}{860\,t\cos\theta}\;[\text{kVA}]`],kf:[R`t=\dfrac{MH\eta}{860\,P}`,R`P=\dfrac{MH\eta_g\eta_t}{860\,t\cos\theta}`,R`P=\dfrac{MH\eta_g\eta_t}{860\,T\cos\theta}`,R`\eta=\dfrac{860Pt}{mH}`,R`\eta=\dfrac{860\,P\,t}{M\,H}`],v:'1 kWh = 860 kcal · m 연료량 · H 발열량 [kcal/kg·L] · η 종합 효율',m:{q:/(연료|중유|석탄|경유|벙커)/,x:/kcal|발열량|열량/,no:/연료\s*소비율|g\s*\/\s*ps/}},
{id:'wind',cat:'전동기·동력',name:'풍력 발전 출력',tex:R`P=\dfrac12\,\rho\,A\,V^3`,alt:[R`A=\dfrac{\pi}{4}d^2`],v:'ρ 공기 밀도 1.225 kg/m³ · A 회전면 넓이 · V 풍속 — W 를 kW 로 ×10⁻³',m:{q:/풍력|풍차/,x:/풍속/}},
{id:'dce',cat:'전동기·동력',name:'직류기 유기기전력',tex:R`E=\dfrac{p\,Z}{60\,a}\,\phi\,N`,alt:[R`E=V+I_aR_a\;(\text{발전기}),\quad E=V-I_aR_a\;(\text{전동기})`],kf:[R`E=V+I_a\,R_a`,R`R_a=\dfrac{E-V}{I_a}`],v:'p 극수 · Z 도체 수 · a 병렬회로 수 (파권 2 · 중권 p) · φ 자속 · N 회전수',m:{q:/직류\s*(발전기|전동기|기)/,x:/기전력|전기자/}},
{id:'esc',cat:'전동기·동력',name:'에스컬레이터 전동기 용량',tex:R`P=\dfrac{9.8\,G\,V\sin\theta\,\beta}{\eta}\;[\text{kW}]`,v:'G 적재하중 [t] · V 속도 [m/s] · θ 경사각 · β 승객 유입률 · η 효율',m:{q:/에스컬레이터/}},
{id:'bat',cat:'축전지·정류',name:'축전지 용량',kf:[R`C=\dfrac{1}{L}\left[K_1I_1+K_2(I_2-I_1)+K_3(I_3-I_2)+K_4(I_4-I_3)\right]`,R`C=\dfrac{1}{L}\left[K_1I_1+K_2(I_2-I_1)+K_3(I_3-I_2)\right]`,R`C=\dfrac{1}{L}\left[K_1I_1+K_2(I_2-I_1)\right]`],tex:R`C=\dfrac{1}{L}\,K\,I\;[\text{Ah}]`,v:'L 보수율 · K 용량환산시간 · I 방전전류',m:{q:/축전지\s*(의)?\s*용량|용량\s*환산\s*시간/}},
{id:'cell',cat:'축전지·정류',name:'축전지 셀 수',tex:R`n=\dfrac{V}{V_{\text{cell}}}`,alt:[R`V_{\text{cell}}=\dfrac{V_a+e}{n}\;(\text{셀당 허용 최저전압})`],v:'연(납) 2.0 V/셀 · 알칼리 1.2 V/셀',m:{q:/(셀|cell)\s*(의)?\s*(수|개수)|축전지\s*(의)?\s*(개수|수)/i}},
{id:'float',cat:'축전지·정류',name:'부동충전 2차 전류',kf:[R`I_2=\dfrac{\text{축전지 정격용량}}{\text{정격 방전율}}+\dfrac{\text{상시 부하}}{\text{표준 전압}}`,R`I_2=\dfrac{\text{축전지 정격용량[Ah]}}{\text{정격 방전율[h]}}+\dfrac{\text{상시 부하용량[VA]}}{\text{표준전압[V]}}`],tex:R`I=\dfrac{\text{축전지 정격용량}}{\text{정격 방전율}}+\dfrac{\text{상시 부하}}{\text{표준 전압}}`,v:'연축전지 방전율 10 h · 알칼리 5 h',m:{q:/부동\s*충전|충전기\s*(의)?\s*(2\s*차)?\s*전류/}},
{id:'rect',cat:'축전지·정류',name:'정류 직류전압',tex:R`E_d=0.45E\;(\text{단상 반파}),\quad 0.9E\;(\text{단상 전파}),\quad 1.17E\;(\text{3상 반파}),\quad 1.35E\;(\text{3상 전파})`,v:'E 교류 실효값',m:{q:/정류\s*(회로|기|전압|방식)|다이오드|SCR|사이리스터|(반파|전파)\s*정류/}},

/* ── 접지·지락·절연 ── */
{id:'r2',cat:'접지·지락·절연',name:'변압기 중성점 접지저항',tex:R`R=\dfrac{150}{I_g}`,alt:[R`R=\dfrac{300}{I_g}\;(\text{2초 이내 자동차단}),\quad R=\dfrac{600}{I_g}\;(\text{1초 이내})`],kf:[R`R=\dfrac{300}{I_g}`,R`R=\dfrac{600}{I_g}`],v:'Ig 고압측 1선 지락전류 — 혼촉 시 저압측 대지전압 150 V 이하로 (KEC 142.5)',m:{q:/지락\s*전류\s*(가|는|이)?\s*\d|지락\s*사고\s*시\s*(의)?\s*지락\s*전류/,x:/접지\s*저항/,no:/접촉\s*전압|외함/}},
{id:'neut',cat:'접지·지락·절연',name:'중성선 전류 (3상 4선 불평형)',tex:R`\dot I_n=\dot I_a+\dot I_b+\dot I_c`,alt:[R`\dot I_n=I_a\angle0^\circ+I_b\angle-120^\circ+I_c\angle120^\circ`],v:'역률 1 부하 — 각 상 전류를 120° 씩 돌려서 벡터로 더함 (평형이면 0)',m:{q:/중성선\s*(에\s*흐르는|의)?\s*전류/}},
{id:'ig',cat:'접지·지락·절연',name:'지락전류 (대지 정전용량)',tex:R`I_g=3\omega C E=\sqrt3\,\omega C V`,v:'E 대지(상)전압 · C 한 선의 대지 정전용량',m:{q:/지락\s*전류/,x:/정전\s*용량|μF|대지/}},
{id:'touch',cat:'접지·지락·절연',name:'접촉·대지 전위',tex:R`E=I_g\,R`,alt:[R`I_g=\dfrac{E}{R_2+R_3}\;(\text{접지 저항 직렬})`],v:'Rg 접지저항',m:{q:/접촉\s*전압|대지\s*전위|전위\s*상승/,x:/접지/}},
{id:'gsv',cat:'접지·지락·절연',name:'1선 지락 시 건전상 대지전압',tex:R`V_{\text{건전}}=\sqrt3\,E=V\;(\text{비접지})`,v:'E 평상시 대지(상)전압 · V 선간전압 — 지락 상은 0 V',m:{q:/(지락|접지\s*사고|누전)/,x:/대지\s*전압/}},
{id:'gw',cat:'접지·지락·절연',name:'보호도체(접지선) 굵기',kf:[R`S=\dfrac{\sqrt{I^2t}}{K}`],tex:R`S=\dfrac{\sqrt{I^2\,t}}{k}\;[\text{mm}^2]`,v:'I 고장전류 · t 차단 시간 · k 재질 계수',m:{q:/(접지\s*(선|도체)|보호\s*도체)\s*(의)?\s*(최소\s*)?(굵기|단면적)/}},
{id:'hipot',cat:'접지·지락·절연',name:'절연내력 시험전압',tex:R`V_t=V_m\times k`,
 alt:[R`7\text{kV 이하 }1.5\ (\min 500\text{V})\quad 7{\sim}25\text{kV 다중접지 }0.92\quad 7{\sim}60\text{kV }1.25\ (\min 10.5\text{kV})`,R`60\text{kV 초과 비접지 }1.25\quad \text{중성점 접지 }1.1\ (\min 75\text{kV})\quad \text{직접접지 }170\text{kV 이하 }0.72,\ \text{초과 }0.64`],
 v:'Vm 최대사용전압 · 10분간',m:{q:/절연\s*내력|시험\s*전압/}},
{id:'bil',cat:'접지·지락·절연',name:'BIL (기준충격절연강도)',tex:R`\text{BIL}=5E+50\;[\text{kV}]`,alt:[R`E=\dfrac{\text{BIL}-50}{5}`],kf:[R`\text{BIL}=\text{절연계급}\times5+50`,R`\text{BIL}=5\times\text{절연계급}+50`,R`\text{절연계급}=\dfrac{\text{BIL}-50}{5}`],v:'E 절연계급(호) — 비유효접지계 · 절연계급 20호 이상일 때 (50 기본 여유분 · 5 한 호당 늘어나는 kV)',m:{q:/BIL|기준\s*충격\s*절연|충격\s*절연\s*강도/}},
{id:'insc',cat:'접지·지락·절연',name:'절연계급 ↔ 공칭전압',tex:R`E=\dfrac{V_n}{1.1}`,alt:[R`V_n=1.1\,E`],kf:[R`\text{공칭전압}=\text{절연계급}\times1.1`,R`\text{공칭전압}=1.1\times\text{절연계급}`],v:'E 절연계급(호) · Vn 공칭전압 [kV]',m:{q:/절연\s*계급/}},
{id:'vrat',cat:'접지·지락·절연',name:'정격전압 (공칭전압 기준)',tex:R`V_r=V_n\times\dfrac{1.2}{1.1}`,kf:[R`\text{정격전압}=\text{공칭전압}\times\dfrac{1.2}{1.1}`],v:'Vn 공칭전압 — 1.2/1.1 은 공칭전압에 대한 최고(정격)전압 비 (예: 22.9 kV → 25.8 kV 표준값)',m:{q:/(차단기|VCB|OCB|GCB|CB)\s*(의)?\s*정격\s*전압\s*(은|을|는)?\s*(몇|얼마|구)/,x:/1\.2/,no:/피뢰기/}},
{id:'la',cat:'접지·지락·절연',name:'피뢰기 정격전압',tex:R`V_n=\alpha\,\beta\,V_m`,kf:[R`V_m=V_{\text{공칭}}\times1.15`,R`\text{계통최고허용전압}=\text{공칭전압}\times1.15`],v:'α 접지계수 · β 유도계수(여유도) · Vm 계통 최고허용전압 (공칭 × 1.15 · 154 kV → 170 kV) — 계산값 바로 위 표준값',m:{q:/피뢰기\s*(의)?\s*정격\s*전압/,x:/접지\s*계수|유도\s*계수/}},
{id:'rtemp',cat:'접지·지락·절연',name:'온도에 따른 저항',tex:R`R_t=R_0\left[1+\alpha_0\,(t-t_0)\right]`,alt:[R`\alpha_0=\dfrac{1}{234.5}\;(\text{연동선 } 0℃)`],v:'R0 처음 온도 t0 의 저항 · α0 온도계수 — 온도를 구할 땐 t 로 풀어씀',m:{q:/저항.{0,80}온도\s*(를|은|는)?\s*(구|얼마|몇)/}},
{id:'strand',cat:'송배전',name:'연선 가닥 수 · 바깥지름',tex:R`N=3n(n+1)+1`,alt:[R`D=(2n+1)\,d`],v:'n 층수 · d 소선 지름 — 7·19·37·61 가닥이 1·2·3·4 층',m:{q:/연선/,x:/외경|바깥\s*지름|가닥/}},
{id:'insR',cat:'접지·지락·절연',name:'절연저항 · 누설전류',tex:R`I=\dfrac{V}{R_{\text{절연}}}`,m:{q:/절연\s*저항/,x:/누설|전류/}},

/* ── 송배전 ── */
{id:'still',cat:'송배전',name:'경제적 송전전압 (Still 식)',tex:R`V=5.5\sqrt{0.6\,l+\dfrac{P}{100}}\;[\text{kV}]`,alt:[R`P=\left[\left(\dfrac{V}{5.5}\right)^2-0.6\,l\right]\times100\;[\text{kW}]`],v:'l 송전 거리 [km] · P 송전 전력 [kW]',m:{q:/still|스틸/i}},
{id:'abcd',cat:'송배전',name:'4단자 정수 (송전단 ↔ 수전단)',tex:R`V_s=A\,V_r+\sqrt3\,B\,I_r`,alt:[R`I_s=\dfrac{C}{\sqrt3}\,V_r+D\,I_r`,R`V_r=\dfrac{V_s}{A}\;(\text{무부하 } I_r=0)`],kf:[R`I_r=\dfrac{V_s-A\,V_r}{\sqrt3\,B}`],v:'AD − BC = 1 · 선간전압 기준이라 √3',m:{q:/4\s*단자\s*정수|일반\s*회로\s*정수/}},
{id:'resv',cat:'송배전',name:'연가 불완전 시 잔류전압',tex:R`E_n=\dfrac{\sqrt{C_a(C_a-C_b)+C_b(C_b-C_c)+C_c(C_c-C_a)}}{C_a+C_b+C_c}\times\dfrac{V}{\sqrt3}`,v:'Ca·Cb·Cc 각 선의 대지 정전용량 — 셋이 같으면 0',m:{q:/잔류\s*전압/,x:/연가|정전\s*용량/}},
{id:'emi',cat:'송배전',name:'전자유도 전압',tex:R`E_m=j\omega M\,l\times3I_0`,v:'M 전력선~통신선 상호 인덕턴스 · l 나란한 길이 · 3I0 지락(영상) 전류',m:{q:/전자\s*유도\s*(전압|장해)/}},
{id:'sag',cat:'송배전',name:'이도 · 전선 실제 길이',tex:R`D=\dfrac{W\,S^2}{8\,T},\qquad L=S+\dfrac{8D^2}{3S}`,v:'W 단위길이 무게 · S 경간 · T 수평장력(=인장하중/안전율)',m:{q:/이도(?!로|면|록)|처짐|dip/i}},
{id:'chg',cat:'송배전',name:'충전전류',kf:[R`I_c=\omega\,C\,E`,R`I_c=2\pi f\,C\,E`,R`I_c=2\pi f\,C\,l\,\dfrac{V}{\sqrt3}`],tex:R`I_c=\omega C E\,l=2\pi f\,C\,\dfrac{V}{\sqrt3}\,l`,v:'C 작용 정전용량[F/km] · l 길이',m:{q:/충전\s*전류/,no:/축전지|충전기|부동\s*충전|균등\s*충전/}},
{id:'gmd',cat:'송배전',name:'등가 선간거리',tex:R`D=\sqrt[3]{D_{12}D_{23}D_{31}}`,m:{q:/등가\s*선간\s*거리|기하\s*평균\s*거리/}},

/* ── 논리회로 ── */
{id:'cap',cat:'송배전',name:'선로 작용 정전용량',tex:R`C=\dfrac{0.02413}{\log_{10}\dfrac{D}{r}}\;[\mu\text{F/km}]`,v:'D 등가 선간거리 · r 전선 반지름',m:{q:/정전\s*용량\s*(을|를)?\s*(구하|계산|산출)|정전\s*용량.{0,12}(몇|얼마)/,x:/log|선간\s*거리|반지름|지름|등가/,no:/콘덴서|역률/}},
{id:'corona',cat:'송배전',name:'코로나 임계전압',tex:R`E_0=24.3\,m_0\,m_1\,\delta\,d\log_{10}\dfrac{D}{r}\;[\text{kV}]`,v:'m0 표면 계수 · m1 날씨 계수 · δ 상대 공기밀도 · d 지름 [cm]',m:{q:/코로나/,x:/임계\s*전압|E_?0|24\.3/}},
{id:'ptx',cat:'송배전',name:'송전 전력 (상차각)',tex:R`P=\dfrac{V_s\,V_r}{X}\sin\delta`,v:'Vs 송전단 전압 · Vr 수전단 전압 · X 선로 리액턴스 · δ 상차각',m:{q:/송전\s*(전력|용량)|상차각|부하각/,x:/sin|δ|상차각|부하각/,no:/지락|영상/}},
{id:'pet',cat:'송배전',name:'소호 리액터',tex:R`\omega L=\dfrac{1}{3\,\omega C}`,alt:[R`Q_L=2\pi f\,C\,V^2\times10^{-3}\;[\text{kVA}]\;(\text{소호 리액터 용량})`,R`L=\dfrac{1}{3\,\omega^2 C}`],v:'C 한 선의 대지 정전용량 — 3선 대지 정전용량과 병렬 공진',m:{q:/소호\s*리액터|페테르센/}},
{id:'symc',cat:'송배전',name:'대칭좌표법 · 1선 지락전류',tex:R`I_g=\dfrac{3E_a}{Z_0+Z_1+Z_2}`,alt:[R`I_0=\dfrac{I_a+I_b+I_c}{3}`],v:'Z0 영상 · Z1 정상 · Z2 역상 임피던스 · Ea 상전압',m:{q:/대칭\s*(좌표|분)|영상\s*분|정상\s*분|역상\s*분|불평형\s*3\s*상\s*(전류|전압)/}},
{id:'guy',cat:'송배전',name:'지선 장력 · 소선 수',tex:R`T=\dfrac{T_0}{\cos\theta}`,alt:[R`n\ge\dfrac{k\,T}{t}`],v:'T0 수평 장력 · θ 지선과 전주 사이 각 · k 안전율 · t 소선 1가닥 인장하중',m:{q:/지선/,x:/장력|가닥|소선|안전\s*율/}},
{id:'demorgan',cat:'논리회로',name:'드모르간 정리',tex:R`\overline{A+B}=\overline{A}\cdot\overline{B},\qquad \overline{A\cdot B}=\overline{A}+\overline{B}`,
 v:'NAND 만으로 · NOR 만으로 바꿀 때',m:{q:/드\s*모르간|NAND|NOR|무접점|논리\s*(식|회로)/}},
{id:'bool',cat:'논리회로',name:'불 대수 간략화',tex:R`A+AB=A,\qquad A(A+B)=A,\qquad A+\overline{A}B=A+B,\qquad A+\overline{A}=1`,
 m:{q:/간략\s*화|간소\s*화|불\s*대수|논리\s*식/}},
];
/* ★ v348 — 공식마다 «말로» 식(한국어 식) · 부호(기호 · 읽기 · 뜻 · 단위)
   【낱말】 은 \text{낱말} 로 바뀜 (쓰기 편하게) */
const KO=s=>s.replace(/【([^】]+)】/g,(m,w)=>`\\text{${w}}`);
const EXTRA={
p3:{ko:R`【유효전력】=\sqrt{3}\times【선간전압】\times【선전류】\times【역률】`,sy:[['P','피','유효전력','W'],['V','브이','선간전압','V'],['I','아이','선전류','A'],[R`\cos\theta`,'코사인 세타','역률','—']]},
p1:{ko:R`【유효전력】=【전압】\times【전류】\times【역률】`,sy:[['P','피','유효전력','W'],['V','브이','전압','V'],['I','아이','전류','A'],[R`\cos\theta`,'코사인 세타','역률','—']]},
pq:{ko:R`【피상전력】=\sqrt{【유효전력】^2+【무효전력】^2}`,sy:[['P_a','피 에이','피상전력','VA'],['P','피','유효전력','W'],['Q','큐','무효전력','Var'],[R`\theta`,'세타','역률각','°']]},
pcomb:{ko:R`【합성 역률】=\dfrac{【유효전력 합】}{\sqrt{【유효전력 합】^2+【무효전력 합】^2}}`,sy:[[R`\sum P`,'시그마 피','부하별 유효전력의 합','kW'],[R`\sum Q`,'시그마 큐','부하별 무효전력의 합 (진상은 −)','kVar']]},
qc:{ko:R`【콘덴서 용량】=【유효전력】\times\left(【개선 전 탄젠트】-【개선 후 탄젠트】\right)`,sy:[['Q_c','큐 씨','콘덴서 용량','kVA'],['P','피','유효전력','kW'],[R`\theta_1`,'세타 일','개선 전 역률각','—'],[R`\theta_2`,'세타 이','개선 후 역률각','—']]},
qcC:{ko:R`【콘덴서 용량】=3\times2\pi\times【주파수】\times【정전용량】\times【선간전압】^2`,sy:[['Q_c','큐 씨','콘덴서 용량','VA'],['C','씨','한 상 정전용량','F'],[R`\omega`,'오메가','각주파수 2πf','rad/s'],['V','브이','선간전압','V'],['f','에프','주파수','Hz']]},
qcadd:{ko:R`【늘릴 수 있는 부하】=【변압기 용량】\times\left(【개선 후 역률】-【개선 전 역률】\right)`,sy:[[R`\Delta P`,'델타 피','늘릴 수 있는 유효전력','kW'],['P_a','피 에이','변압기(피상) 용량','kVA']]},
qcloss:{ko:R`\dfrac{【개선 후 손실】}{【개선 전 손실】}=\left(\dfrac{【개선 전 역률】}{【개선 후 역률】}\right)^2`,sy:[['P_{l1}','피 엘 일','개선 전 손실','kW'],['P_{l2}','피 엘 이','개선 후 손실','kW']]},
srx:{ko:R`【직렬 리액터】=0.06\times【콘덴서 리액턴스】`,sy:[['X_L','엑스 엘','직렬 리액터 리액턴스','Ω'],['X_C','엑스 씨','콘덴서 리액턴스','Ω']]},
vd3:{ko:R`【전압강하】=\sqrt{3}\times【전류】\times\left(【저항】\times【역률】+【리액턴스】\times【무효율】\right)`,sy:[['e','이','전압강하','V'],['I','아이','선전류','A'],['R','알','한 선 저항','Ω'],['X','엑스','한 선 리액턴스','Ω'],[R`\sin\theta`,'사인 세타','무효율 √(1−cos²θ)','—']]},
vd1:{ko:R`【전압강하】=2\times【전류】\times\left(【저항】\times【역률】+【리액턴스】\times【무효율】\right)`,sy:[['e','이','전압강하','V'],['I','아이','전류','A'],['R','알','한 선 저항','Ω'],['X','엑스','한 선 리액턴스','Ω']]},
vdA:{ko:R`【전선 단면적】=\dfrac{35.6\times【길이】\times【전류】}{1000\times【전압강하】}`,sy:[['A','에이','전선 단면적','mm²'],['L','엘','전선 길이','m'],['I','아이','전류','A'],['e','이','전압강하 (허용값)','V']]},
vdr:{ko:R`【전압강하율】=\dfrac{【송전단 전압】-【수전단 전압】}{【수전단 전압】}\times100`,sy:[[R`\varepsilon`,'엡실론','전압강하율','%'],['V_s','브이 에스','송전단 전압','V'],['V_r','브이 알','수전단 전압','V'],[R`\delta`,'델타','전압변동률','%'],['V_{r0}','브이 알 영','무부하 수전단 전압','V']]},
vr:{ko:R`【수전단 전압】=【송전단 전압】-【전압강하】`,sy:[['V_r','브이 알','수전단 전압','V'],['V_s','브이 에스','송전단 전압','V'],['e','이','전압강하','V']]},
stepup:{ko:R`【손실】\propto\dfrac{1}{【전압】^2},\quad【전압강하】\propto\dfrac{1}{【전압】}`,sy:[['P_l','피 엘','전력손실','W'],['e','이','전압강하','V'],['V','브이','공급전압','V']]},
ploss:{ko:R`【전력손실】=3\times【전류】^2\times【한 선 저항】`,sy:[['P_l','피 엘','선로 전력손실','W'],['I','아이','선전류','A'],['R','알','한 선 저항','Ω'],['P','피','부하 전력','W'],['V','브이','선간전압','V']]},
plr:{sy:[['P_l','피 엘','전력손실','kW'],['P','피','공급(부하) 전력','kW']]},
lossf:{ko:R`【손실계수】=\alpha\times【부하율】+(1-\alpha)\times【부하율】^2`,sy:[['H','에이치','손실계수','—'],['F','에프','부하율','—'],[R`\alpha`,'알파','정수 0.1~0.4','—']]},
demand:{},divers:{},loadf:{},
trcap:{sy:[['P_{TR}','피 티알','변압기 용량','kVA'],[R`\cos\theta`,'코사인 세타','역률','—']]},
branch:{sy:[['N','엔','분기회로 수 (올림)','회로']]},
unbal:{},
treff:{ko:R`【효율】=\dfrac{【출력】}{【출력】+【철손】+【부하율】^2\times【전부하 동손】}\times100`,sy:[[R`\eta`,'에타','효율','%'],['m','엠','부하율 (실부하/정격)','—'],['P','피','정격용량','kVA'],['P_i','피 아이','철손 (무부하손)','kW'],['P_c','피 씨','전부하 동손','kW']]},
trmax:{ko:R`【철손】=【부하율】^2\times【전부하 동손】`,sy:[['m','엠','최대 효율 부하율','—'],['P_i','피 아이','철손','kW'],['P_c','피 씨','전부하 동손','kW']]},
trday:{ko:R`【전일효율】=\dfrac{【하루 출력 전력량】}{【하루 출력 전력량】+24\times【철손】+【하루 동손 전력량】}\times100`,sy:[[R`\eta_d`,'에타 디','전일효율','%'],['h','에이치','운전 시간','h'],['P_i','피 아이','철손','kW'],['P_c','피 씨','전부하 동손','kW']]},
vconn:{ko:R`【V결선 출력】=\sqrt{3}\times【변압기 1대 용량】`,sy:[['P_V','피 브이','V결선 출력','kVA'],['P_1','피 일','변압기 1대 용량','kVA']]},
trpar:{ko:R`\dfrac{【A 분담】}{【B 분담】}=\dfrac{【A 용량】}{【B 용량】}\times\dfrac{【B의 \%Z】}{【A의 \%Z】}`,sy:[['P_a','피 에이','A 변압기 분담 부하','kVA'],['P_A','피 대문자 에이','A 정격용량','kVA'],[R`\%Z_a`,'퍼센트 제트 에이','A의 %임피던스','%']]},
auto:{sy:[['V_h','브이 에이치','고압측 전압','V'],['V_l','브이 엘','저압측 전압','V']]},
trreg:{ko:R`【전압변동률】=【\%저항강하】\times【역률】+【\%리액턴스강하】\times【무효율】`,sy:[[R`\varepsilon`,'엡실론','전압변동률','%'],['p','피','%저항강하','%'],['q','큐','%리액턴스강하','%']]},
pz:{ko:R`【\%임피던스】=\dfrac{【용량】\times【임피던스】}{10\times【전압】^2}`,sy:[[R`\%Z`,'퍼센트 제트','%임피던스','%'],['P','피','기준(정격) 용량','kVA'],['Z','제트','임피던스','Ω'],['V','브이','선간전압','kV'],['I_n','아이 엔','정격전류','A'],['E','이','상전압','V']]},
pzb:{ko:R`【환산 \%Z】=【자기 \%Z】\times\dfrac{【기준 용량】}{【자기 용량】}`,sy:[[R`\%Z'`,'퍼센트 제트 프라임','기준용량으로 바꾼 %Z','%'],[R`P_{\text{기준}}`,'피 기준','기준 용량','kVA·MVA'],[R`P_{\text{자기}}`,'피 자기','그 기기의 정격 용량','kVA·MVA']]},
is:{ko:R`【단락전류】=\dfrac{100}{【\%Z】}\times【정격전류】`,sy:[['I_s','아이 에스','단락전류','A'],[R`\%Z`,'퍼센트 제트','합성 %임피던스','%'],['I_n','아이 엔','기준용량의 정격전류','A']]},
ps:{ko:R`【단락용량】=\dfrac{100}{【\%Z】}\times【기준 용량】`,sy:[['P_s','피 에스','단락용량','MVA'],['P_n','피 엔','기준 용량','MVA']]},
cb:{ko:R`【차단용량】=\sqrt{3}\times【정격전압】\times【정격차단전류】`,sy:[['P_s','피 에스','차단용량','MVA'],['V_n','브이 엔','차단기 정격전압','kV'],['I_s','아이 에스','정격차단전류','kA']]},
pz3:{ko:R`【1차 \%X】=\tfrac12\left(【1-2차 간】+【1-3차 간】-【2-3차 간】\right)`,sy:[[R`\%X_{12}`,'퍼센트 엑스 일이','1·2차 간 %리액턴스','%'],[R`\%X_1`,'퍼센트 엑스 일','1차 권선 %리액턴스','%']]},
pzsum:{sy:[[R`\%Z_1,\ \%Z_2`,'퍼센트 제트 일·이','각 기기의 %Z (같은 기준)','%']]},
in:{ko:R`【정격전류】=\dfrac{【정격용량】}{\sqrt{3}\times【정격전압】}`,sy:[['I_n','아이 엔','정격전류','A'],['P_n','피 엔','정격용량','kVA'],['V_n','브이 엔','정격(선간)전압','kV']]},
ct:{ko:R`【CT 1차 전류】=\dfrac{【변압기 용량】}{\sqrt{3}\times【1차 전압】}\times(1.25\sim1.5)`,sy:[['I_1','아이 일','CT 1차 정격전류','A'],['P','피','변압기(부하) 용량','kVA'],['V','브이','1차 선간전압','kV']]},
relay:{ko:R`【계전기 전류】=【1차 전류】\times\dfrac{1}{【CT비】}`,sy:[['I_r','아이 알','계전기(CT 2차)에 흐르는 전류','A'],['I_1','아이 일','CT 1차 전류','A'],['I_L','아이 엘','부하전류','A']]},
burden:{ko:R`【부담】=【2차 전류】^2\times【임피던스】`,sy:[['P','피','부담','VA'],['I','아이','CT 2차 정격전류 (5 A)','A'],['Z','제트','계전기·리드선 임피던스','Ω']]},
meter:{ko:R`【실제 전력】=【계기 지시값】\times【CT비】\times【PT비】`,sy:[['P','피','실제(1차) 전력','kW']]},
wh:{ko:R`【전력】=\dfrac{3600\times【회전수】}{【시간】\times【계기정수】}\times【CT비】\times【PT비】`,sy:[['P','피','전력','kW'],['n','엔','원판 회전수','회'],['t','티','측정 시간','s'],['K','케이','계기정수','rev/kWh']]},
err:{sy:[['M','엠','측정값(지시값)','—'],['T','티','참값','—']]},
lamp:{ko:R`【등 수】=\dfrac{【감광보상률】\times【면적】\times【조도】}{【등 1개 광속】\times【조명률】}`,sy:[['N','엔','등 수','개'],['D','디','감광보상률','—'],['A','에이','방 면적','m²'],['E','이','평균 조도','lx'],['F','에프','등 1개 광속','lm'],['U','유','조명률','—'],['M','엠','보수율 = 1/D','—']]},
ridx:{ko:R`【실지수】=\dfrac{【가로】\times【세로】}{【등 높이】\times\left(【가로】+【세로】\right)}`,sy:[['K','케이','실지수','—'],['X','엑스','방 가로','m'],['Y','와이','방 세로','m'],['H','에이치','광원~작업면 높이','m']]},
maint:{ko:R`【감광보상률】=\dfrac{1}{【보수율】}`,sy:[['D','디','감광보상률','—'],['M','엠','보수율(유지율)','—']]},
illum:{ko:R`【수평면 조도】=\dfrac{【광도】}{【거리】^2}\times\cos\theta`,sy:[['E_n','이 엔','법선 조도','lx'],['E_h','이 에이치','수평면 조도','lx'],['E_v','이 브이','수직면 조도','lx'],['I','아이','광도','cd'],['r','알','광원까지 거리','m'],[R`\theta`,'세타','수직선과 이루는 각','°']]},
emit:{ko:R`【광속발산도】=\dfrac{【나가는 광속】}{【면적】}`,sy:[['R','알','광속발산도','rlx'],['F','에프','나가는 광속','lm'],['S','에스','발산 면적','m²'],[R`\rho`,'로','반사율','—'],[R`\tau`,'타우','투과율','—']]},
globe:{ko:R`【글로브 효율】=\dfrac{【투과율】}{1-【반사율】}`,sy:[[R`\eta`,'에타','글로브 효율','—'],[R`\tau`,'타우','투과율','—'],[R`\rho`,'로','반사율','—'],['I','아이','광원 광도','cd'],['r','알','글로브 반지름','m']]},
flux:{ko:R`【전광속】=4\pi\times【광도】\ (【구】)`,sy:[['F','에프','전광속','lm'],['I','아이','광도','cd']]},
lum:{ko:R`【휘도】=\dfrac{【광도】}{【보이는 면적】}`,sy:[['B','비','휘도','cd/m²'],['I','아이','광도','cd'],['S','에스','투영(보이는) 면적','m²']]},
road:{ko:R`【조도】=\dfrac{【광속】\times【조명률】\times【등 수】}{【감광보상률】\times【등 1개 면적】}`,sy:[['B','비','도로 폭','m'],['S','에스','등 간격','m'],['A','에이','등 1개가 비추는 면적','m²']]},
pump:{ko:R`【출력】=\dfrac{9.8\times【양수량】\times【양정】\times【여유계수】}{【효율】}`,sy:[['P','피','전동기 출력','kW'],['Q','큐','양수량','m³/s'],['H','에이치','총 양정','m'],['K','케이','여유계수','—'],[R`\eta`,'에타','펌프 효율','—']]},
hoist:{ko:R`【출력】=\dfrac{【무게】\times【속도】}{6.12\times【효율】}`,sy:[['P','피','전동기 출력','kW'],['W','더블유','권상 하중','t'],['V','브이','권상 속도','m/min'],[R`\eta`,'에타','효율','—']]},
fan:{ko:R`【출력】=\dfrac{【풍량】\times【풍압】\times【여유계수】}{6120\times【효율】}`,sy:[['P','피','전동기 출력','kW'],['Q','큐','풍량','m³/min'],['H','에이치','풍압','mmAq'],['K','케이','여유계수','—'],[R`\eta`,'에타','효율','—']]},
ns:{ko:R`【동기속도】=\dfrac{120\times【주파수】}{【극수】}`,sy:[['N_s','엔 에스','동기속도','rpm'],['f','에프','주파수','Hz'],['p','피','극수','극'],['s','에스','슬립','—'],['N','엔','실제 회전속도','rpm']]},
torque:{ko:R`【토크】=0.975\times\dfrac{【출력】}{【회전수】}`,sy:[['T','티','토크','kg·m'],['P','피','출력','W'],['N','엔','회전수','rpm']]},
yd:{ko:R`【Y 기동전류】=\dfrac13\times【Δ 직입 기동전류】`,sy:[['I_Y','아이 와이','Y 기동 전류','A'],[R`I_\Delta`,'아이 델타','Δ 직입 전류','A']]},
ind2:{ko:R`【2차 입력】:【2차 동손】:【기계 출력】=1:【슬립】:(1-【슬립】)`,sy:[['P_2','피 이','2차 입력','W'],['P_{c2}','피 씨 이','2차 동손','W'],['P_o','피 오','기계 출력','W'],['s','에스','슬립','—']]},
gen:{ko:R`【발전기 용량】\ge\left(\dfrac{1}{【허용 전압강하율】}-1\right)\times【과도리액턴스】\times【기동 용량】`,sy:[['P_G','피 지','발전기 용량','kVA'],['e','이','허용 전압강하율','—'],["x_d'",'엑스 디 프라임','과도리액턴스','—'],['P_s','피 에스','전동기 기동 용량','kVA']]},
bat:{ko:R`【축전지 용량】=\dfrac{1}{【보수율】}\times【용량환산시간】\times【방전전류】`,sy:[['C','씨','축전지 용량','Ah'],['L','엘','보수율','—'],['K','케이','용량환산시간','h'],['I','아이','방전전류','A']]},
cell:{ko:R`【셀 수】=\dfrac{【필요 전압】}{【셀 1개 전압】}`,sy:[['n','엔','셀 수','개'],['V','브이','필요 전압','V'],[R`V_{\text{cell}}`,'브이 셀','셀 1개 전압','V']]},
float:{sy:[['I','아이','충전기 2차 전류','A']]},
rect:{ko:R`【직류 평균전압】=0.9\times【교류 전압】\ (【단상 전파】)`,sy:[['E_d','이 디','직류 평균전압','V'],['E','이','교류 실효값','V']]},
ig:{ko:R`【지락전류】=3\times2\pi\times【주파수】\times【정전용량】\times【대지전압】`,sy:[['I_g','아이 지','지락전류','A'],['C','씨','한 선 대지 정전용량','F'],['E','이','대지(상)전압 V/√3','V'],[R`\omega`,'오메가','2πf','rad/s']]},
leak:{ko:R`【누설전류】\le【최대 공급전류】\times\dfrac{1}{2000}`,sy:[[R`I_{\max}`,'아이 맥스','최대 공급전류','A']]},
touch:{ko:R`【접촉전압】=【지락전류】\times【접지저항】`,sy:[['E','이','접촉(대지)전압','V'],['I_g','아이 지','지락전류','A'],['R','알','접지저항','Ω']]},
gsv:{ko:R`【건전상 대지전압】=\sqrt{3}\times【평상시 대지전압】=【선간전압】`,sy:[['E','이','평상시 대지(상)전압','V'],['V','브이','선간전압','V']]},
gw:{ko:R`【단면적】=\dfrac{\sqrt{【고장전류】^2\times【시간】}}{【재질계수】}`,sy:[['S','에스','보호도체 단면적','mm²'],['I','아이','고장전류','A'],['t','티','차단 시간','s'],['k','케이','재질·절연 계수','—']]},
hipot:{ko:R`【시험전압】=【최대사용전압】\times【배수】`,sy:[['V_t','브이 티','시험전압','V'],['V_m','브이 엠','최대사용전압','V'],['k','케이','배수','—']]},
bil:{ko:R`【BIL】=【절연계급】\times5+50`,sy:[[R`\text{BIL}`,'비 아이 엘','기준충격절연강도 (뇌임펄스에 견디는 전압)','kV'],['E','이','절연계급','호']]},
insc:{ko:R`【절연계급】=\dfrac{【공칭전압】}{1.1}`,sy:[['E','이','절연계급','호'],['V_n','브이 엔','공칭전압','kV']]},
vrat:{ko:R`【정격전압】=【공칭전압】\times\dfrac{1.2}{1.1}`,sy:[['V_r','브이 알','정격(최고)전압','kV'],['V_n','브이 엔','공칭전압','kV']]},
insR:{ko:R`【누설전류】=\dfrac{【전압】}{【절연저항】}`,sy:[['I','아이','누설전류','A'],['V','브이','대지전압','V'],[R`R_{\text{절연}}`,'알 절연','절연저항','Ω']]},
sag:{ko:R`【이도】=\dfrac{【전선 무게】\times【경간】^2}{8\times【수평장력】}`,sy:[['D','디','이도','m'],['W','더블유','전선 1 m 무게','kg/m'],['S','에스','경간','m'],['T','티','수평장력 = 인장하중/안전율','kg'],['L','엘','전선 실제 길이','m']]},
chg:{ko:R`【충전전류】=2\pi\times【주파수】\times【정전용량】\times【대지전압】\times【길이】`,sy:[['I_c','아이 씨','충전전류','A'],['C','씨','작용 정전용량','F/km'],['E','이','대지전압 V/√3','V'],['l','엘','선로 길이','km']]},
gmd:{ko:R`【등가 선간거리】=\sqrt[3]{【거리1】\times【거리2】\times【거리3】}`,sy:[['D','디','등가 선간거리','m']]},
w2:{ko:R`【유효전력】=【전력계1】+【전력계2】`,sy:[['P','피','3상 유효전력','W'],['W_1,W_2','더블유 일·이','전력계 지시값','W'],['Q','큐','무효전력','Var']]},
v3:{ko:R`【전력】=\dfrac{【전체 전압】^2-【저항 전압】^2-【부하 전압】^2}{2\times【저항】}`,sy:[['V_3','브이 삼','전체 전압','V'],['V_1','브이 일','저항 R 양단 전압','V'],['V_2','브이 이','부하 전압','V'],['R','알','직렬 기지 저항','Ω']]},
a3:{ko:R`【전력】=\dfrac{【저항】}{2}\times(【전체 전류】^2-【저항 전류】^2-【부하 전류】^2)`,sy:[['A_3','에이 삼','전체 전류','A'],['A_1','에이 일','저항 R 전류','A'],['A_2','에이 이','부하 전류','A'],['R','알','병렬 기지 저항','Ω']]},
mult:{ko:R`【배율기 저항】=(【배율】-1)\times【전압계 내부저항】`,sy:[['R_m','알 엠','배율기 저항 (직렬)','Ω'],['R_s','알 에스','분류기 저항 (병렬)','Ω'],['n','엔','배율','배'],['R_v','알 브이','전압계 내부저항','Ω'],['R_a','알 에이','전류계 내부저항','Ω']]},
kohl:{ko:R`【접지저항】=\dfrac{1}{2}(【a-b 저항】+【c-a 저항】-【b-c 저항】)`,sy:[['R_x','알 엑스','측정 접지극 저항','Ω'],['R_{ab}','알 에이비','a-b 사이 저항','Ω'],['R_{ca}','알 씨에이','c-a 사이 저항','Ω'],['R_{bc}','알 비씨','b-c 사이 저항','Ω']]},
wenner:{ko:R`【대지 저항률】=2\pi\times【전극 간격】\times【측정 저항】`,sy:[[R`\rho`,'로','대지 저항률','Ω·m'],['a','에이','전극 간격','m'],['R','알','측정 저항','Ω']]},
heat:{ko:R`【전력】=\dfrac{【질량】\times【비열】\times【온도 차】}{860\times【효율】\times【시간】}`,sy:[['P','피','전열기 용량','kW'],['m','엠','물의 질량','kg'],['c','씨','비열 (물 1)','kcal/kg·℃'],['T_2-T_1','티 이 빼기 티 일','온도 차','℃'],[R`\eta`,'에타','효율','—'],['t','티','시간','h']]},
ocp:{ko:R`【설계전류】\le【보호장치 정격전류】\le【전선 허용전류】`,sy:[['I_B','아이 비','설계전류','A'],['I_n','아이 엔','보호장치 정격전류','A'],['I_Z','아이 제트','전선 허용전류','A'],['I_2','아이 투','보호장치 동작전류','A']]},
feed:{ko:R`【간선 허용전류】\ge1.25\times【전동기 전류 합】+【기타 부하 전류 합】`,sy:[['I_a','아이 에이','간선 허용전류','A'],[R`\sum I_M`,'시그마 아이 엠','전동기 정격전류 합','A'],[R`\sum I_H`,'시그마 아이 에이치','전동기 외 부하전류 합','A']]},
ind:{ko:R`【인덕턴스】=0.05+0.4605\log_{10}\dfrac{【선간거리】}{【반지름】}`,sy:[['L','엘','한 선의 인덕턴스','mH/km'],['D','디','등가 선간거리','m'],['r','알','전선 반지름','m']]},
cap:{ko:R`【정전용량】=\dfrac{0.02413}{\log_{10}\dfrac{【선간거리】}{【반지름】}}`,sy:[['C','씨','작용 정전용량','μF/km'],['D','디','등가 선간거리','m'],['r','알','전선 반지름','m']]},
corona:{ko:R`【임계전압】=24.3\times【표면계수】\times【날씨계수】\times【공기밀도】\times【지름】\times\log_{10}\dfrac{【선간거리】}{【반지름】}`,sy:[['E_0','이 제로','코로나 임계전압','kV'],['m_0','엠 제로','전선 표면 계수','—'],['m_1','엠 원','날씨 계수','—'],[R`\delta`,'델타','상대 공기밀도','—'],['d','디','전선 지름','cm']]},
ptx:{ko:R`【송전 전력】=\dfrac{【송전단 전압】\times【수전단 전압】}{【리액턴스】}\sin【상차각】`,sy:[['P','피','송전 전력','MW'],['V_s','브이 에스','송전단 전압','kV'],['V_r','브이 알','수전단 전압','kV'],['X','엑스','선로 리액턴스','Ω'],[R`\delta`,'델타','상차각','°']]},
pet:{ko:R`【리액터 리액턴스】=\dfrac{1}{3\times【각주파수】\times【대지 정전용량】}`,sy:[['L','엘','소호 리액터 인덕턴스','H'],[R`\omega`,'오메가','각주파수 2πf','rad/s'],['C','씨','한 선 대지 정전용량','F']]},
symc:{ko:R`【지락전류】=\dfrac{3\times【상전압】}{【영상】+【정상】+【역상】}`,sy:[['I_g','아이 지','1선 지락전류','A'],['E_a','이 에이','a상 상전압','V'],['Z_0','제트 제로','영상 임피던스','Ω'],['Z_1','제트 원','정상 임피던스','Ω'],['Z_2','제트 투','역상 임피던스','Ω'],['I_0','아이 제로','영상 전류','A']]},
guy:{ko:R`【지선 장력】=\dfrac{【수평 장력】}{\cos【각도】}`,sy:[['T','티','지선 장력','kN'],['T_0','티 제로','수평 장력','kN'],[R`\theta`,'세타','지선과 전주 사이 각','°'],['n','엔','소선 가닥 수','가닥'],['k','케이','안전율','—'],['t','티','소선 1가닥 인장하중','kN']]},
vph:{ko:R`【상전압】=\dfrac{【선간전압】}{\sqrt3}`,sy:[['E','이','상전압 (대지전압)','V'],['V','브이','선간전압','V']]},
w1:{ko:R`【3상 전력】=3\times【전력계 지시값】`,sy:[['P_3','피 삼','3상 전력','W'],['W','더블유','전력계 지시값 (한 상)','W']]},
cterr:{ko:R`【비오차】=\dfrac{【공칭 변류비】-【실제 변류비】}{【실제 변류비】}\times100`,sy:[[R`\varepsilon`,'엡실론','비오차','%'],['K_n','케이 엔','공칭 변류비','—'],['K','케이','실제 변류비 = I1/I2','—']]},
thd:{ko:R`【왜형률】=\dfrac{【고조파 실효값】}{【기본파 실효값】}\times100`,sy:[['V_1','브이 원','기본파 전압','V'],['V_3','브이 쓰리','제3고조파 전압','V'],['V_p','브이 피','고조파 포함 상전압','V']]},
murray:{ko:R`【고장점 거리】=\dfrac{2\times【선로 길이】\times【b 저항】}{【a 저항】+【b 저항】}`,sy:[['x','엑스','고장점까지 거리','km'],['L','엘','선로 길이 (편도)','km'],['a,b','에이·비','브리지 저항','Ω']]},
fuel:{ko:R`860\times【출력】\times【시간】=【연료량】\times【발열량】\times【효율】`,sy:[['P','피','발전기 출력','kW'],['t','티','운전 시간','h'],['m','엠','연료량','kg·L'],['H','에이치','발열량','kcal/kg'],[R`\eta`,'에타','종합 효율','—']]},
wind:{ko:R`【풍력 출력】=\dfrac12\times【공기 밀도】\times【회전면 넓이】\times【풍속】^3`,sy:[['P','피','출력','W'],[R`\rho`,'로','공기 밀도','kg/m³'],['A','에이','회전면 넓이','m²'],['V','브이','풍속','m/s']]},
dce:{ko:R`【유기기전력】=\dfrac{【극수】\times【도체 수】}{60\times【병렬회로 수】}\times【자속】\times【회전수】`,sy:[['E','이','유기기전력','V'],['p','피','극수','—'],['Z','제트','전기자 도체 수','—'],['a','에이','병렬회로 수','—'],[R`\phi`,'파이','1극 자속','Wb'],['N','엔','회전수','rpm'],['I_a','아이 에이','전기자 전류','A'],['R_a','알 에이','전기자 저항','Ω']]},
contract:{ko:R`【계약전력】=\sum(【구간 설비용량】\times【환산율】)`,sy:[[R`P_{\text{계약}}`,'피 계약','계약전력','kW']]},
spot:{ko:R`【변압기 용량】=\dfrac{【최대 수요전력】}{【회선 수】-1}\times\dfrac{100}{【과부하율】}`,sy:[['P_T','피 티','변압기 1대 용량','kVA'],['P_m','피 엠','최대 수요전력','kVA'],['n','엔','회선 수','—'],[R`\alpha`,'알파','과부하율','%']]},
lcen:{ko:R`【부하 중심 거리】=\dfrac{\sum(【거리】\times【전류】)}{\sum【전류】}`,sy:[['L','엘','부하 중심까지 거리','m'],['L_i','엘 아이','각 부하까지 거리','m'],['I_i','아이 아이','각 부하 전류','A']]},
tap:{ko:R`【새 탭 전압】=【지금 탭 전압】\times\dfrac{【지금 2차 전압】}{【원하는 2차 전압】}`,sy:[[R`E_1'`,'이 원 프라임','새 탭 전압','V'],['E_1','이 원','지금 탭 전압','V'],['V_2','브이 투','지금 2차 전압','V'],[R`V_2'`,'브이 투 프라임','원하는 2차 전압','V']]},
leff:{ko:R`【램프 효율】=\dfrac{【전광속】}{【소비전력】}`,sy:[[R`\eta`,'에타','램프 효율','lm/W'],['F','에프','전광속','lm'],['P','피','소비전력','W']]},
lcost:{ko:R`【비용】=\dfrac{【전구 값】}{【수명】}+【소비전력】\times【전력량 요금】`,sy:[['C','씨','시간당 비용','원'],['P','피','소비전력','kW']]},
still:{ko:R`【송전전압】=5.5\sqrt{0.6\times【거리】+\dfrac{【송전전력】}{100}}`,sy:[['V','브이','송전전압','kV'],['l','엘','송전 거리','km'],['P','피','송전전력','kW']]},
la:{ko:R`【피뢰기 정격전압】=【접지계수】\times【유도계수】\times【최고허용전압】`,sy:[['V_n','브이 엔','피뢰기 정격전압','kV'],[R`\alpha`,'알파','접지계수','—'],[R`\beta`,'베타','유도계수 (여유도)','—'],['V_m','브이 엠','계통 최고허용전압','kV']]},
rtemp:{ko:R`【t℃ 저항】=【처음 저항】\times(1+【온도계수】\times【온도 차】)`,sy:[['R_t','알 티','t℃ 저항','Ω'],['R_0','알 제로','처음(t0) 저항','Ω'],[R`\alpha_0`,'알파 제로','t0 에서 온도계수','1/℃'],['t','티','나중 온도','℃']]},
strand:{ko:R`【총 가닥 수】=3\times【층수】\times(【층수】+1)+1`,sy:[['N','엔','소선 총 가닥 수','가닥'],['n','엔','층수 (중심 제외)','층'],['D','디','연선 바깥지름','mm'],['d','디','소선 지름','mm']]},
r2:{ko:R`【접지저항】=\dfrac{150}{【1선 지락전류】}`,sy:[['R','알','변압기 중성점 접지저항','Ω'],['I_g','아이 지','고압측 1선 지락전류','A']]},
neut:{ko:R`【중성선 전류】=【a상 전류】+【b상 전류】+【c상 전류】\;(【벡터 합】)`,sy:[[R`\dot I_n`,'아이 엔','중성선 전류','A'],[R`\dot I_a`,'아이 에이','a상 전류 (0°)','A'],[R`\dot I_b`,'아이 비','b상 전류 (−120°)','A'],[R`\dot I_c`,'아이 씨','c상 전류 (120°)','A']]},
ks:{ko:R`【단락비】=\dfrac{【단락전류】}{【정격전류】}`,sy:[['K_s','케이 에스','단락비','—'],['I_s','아이 에스','3상 단락전류','A'],['I_n','아이 엔','정격전류','A']]},
abcd:{ko:R`【송전단 전압】=A\times【수전단 전압】+\sqrt3\times B\times【수전단 전류】`,sy:[['V_s','브이 에스','송전단 선간전압','kV'],['V_r','브이 알','수전단 선간전압','kV'],['I_r','아이 알','수전단 전류','A'],['A,B,C,D','에이·비·씨·디','4단자 정수','—']]},
rod:{ko:R`【접지저항】=\dfrac{【대지 저항률】}{2\pi\times【봉 길이】}\ln\dfrac{2\times【봉 길이】}{【봉 반지름】}`,sy:[['R','알','접지저항','Ω'],[R`\rho`,'로','대지 저항률','Ω·m'],['l','엘','접지봉 길이','m'],['r','알','접지봉 반지름','m']]},
hydro:{ko:R`【출력】=9.8\times【수량】\times【낙차】\times【효율】`,sy:[['P','피','발전 출력','kW'],['Q','큐','사용 수량','m³/s'],['H','에이치','유효 낙차','m'],[R`\eta`,'에타','종합 효율','—']]},
fop:{ko:R`【접지저항】=\dfrac{【전압계 지시】}{【전류계 지시】}`,sy:[['R_E','알 이','접지저항','Ω'],['V','브이','E~P 사이 전압','V'],['I','아이','E~C 로 흘린 전류','A']]},
probe:{ko:R`【스코프 입력 전압】=\dfrac{【스코프 저항】}{【프로브 저항】+【스코프 저항】}\times【측정 전압】`,sy:[['V_o','브이 오','스코프에 걸리는 전압','V'],['V_i','브이 아이','측정할 전압','V'],['R_s','알 에스','스코프 입력저항','Ω'],['R_p','알 피','프로브 직렬저항','Ω']]},
rc:{ko:R`【역률】=\dfrac{【저항】}{\sqrt{【저항】^2+【용량 리액턴스】^2}}`,sy:[['R','알','저항','Ω'],['X_C','엑스 씨','용량 리액턴스 = 1/(2πfC)','Ω']]},
dy:{ko:R`R_{ab}=\dfrac{【두 개씩 곱한 합】}{【마주 보는 저항】}`,sy:[['R_a,R_b,R_c','알 에이·비·씨','Y 쪽 저항','Ω'],['R_{ab}','알 에이비','Δ 쪽 a-b 저항','Ω']]},
esc:{ko:R`【출력】=\dfrac{9.8\times【적재하중】\times【속도】\times\sin【경사각】\times【유입률】}{【효율】}`,sy:[['P','피','전동기 용량','kW'],['G','지','적재하중','t'],['V','브이','속도','m/s'],[R`\theta`,'세타','경사각','°'],[R`\beta`,'베타','승객 유입률','—'],[R`\eta`,'에타','효율','—']]},
subarea:{ko:R`【변전실 면적】=【추정계수】\times【변압기 용량】^{0.7}`,sy:[['A','에이','변전실 추정 면적','m²'],['k','케이','추정계수','—']]},
resv:{ko:R`【잔류전압】=\dfrac{\sqrt{…}}{【정전용량 합】}\times【상전압】`,sy:[['E_n','이 엔','중성점 잔류전압','V'],['C_a,C_b,C_c','씨 에이·비·씨','각 선 대지 정전용량','μF']]},
emi:{ko:R`【유도 전압】=j\times【각주파수】\times【상호 인덕턴스】\times【길이】\times3\times【영상 전류】`,sy:[['E_m','이 엠','전자유도 전압','V'],['M','엠','상호 인덕턴스','H/km'],['l','엘','나란한 길이','km'],['I_0','아이 제로','영상 전류','A']]},
demorgan:{ko:R`\overline{【A 또는 B】}=【A 아님】\ 【그리고】\ 【B 아님】`,sy:[[R`\overline{A}`,'에이 바','A 의 부정 (b접점)','—'],[R`A\cdot B`,'에이 앤드 비','직렬 (AND)','—'],['A+B','에이 오어 비','병렬 (OR)','—']]},
bool:{sy:[[R`\overline{A}`,'에이 바','A 의 부정','—']]}
};
LIB.forEach(f=>{ const x=EXTRA[f.id]; if(!x) return; if(x.ko) f.ko=KO(x.ko); if(x.sy) f.sy=x.sy; });

/* ══ ② 내가 추가한 공식 · 문항 연결 — 이 기기 + 서버(practical_subjects.fx) ══
   items : 해설에서 «＋ 공식으로 추가» 한 식  { id, name, cat, tex, ko, sy, t, gone }
   links : '문항id|공식id' → { on:true/false, t }  (손으로 연결 · 이 문제에서 빼기) */
const sid=()=>{ try{ return CACHE_SID!=null?String(CACHE_SID):'' }catch(e){ return '' } };
const client=()=>{ try{ return sb }catch(e){ return null } };
const say=m=>{ try{ (window.__pxToast||window.AppUI?.toast||console.log)(m) }catch(e){ q_(e) } };
const UKEY=()=>'prac:fxu:v1:'+(sid()||'0');
let U={ items:{}, links:{}, at:0 }, USID=null, COL=null, PULLK='', PULLT=0, PUSHT=0, SAID=false;
function uload(){
  const s=sid(); if(s===USID) return; USID=s;
  try{ const v=JSON.parse(localStorage.getItem(UKEY())||'null'); U=(v&&v.items)?v:{ items:{}, links:{}, at:0 }; }catch(e){ U={ items:{}, links:{}, at:0 }; }
  ISIG='';
}
function umerge(a,b){
  const o={ items:{}, links:{}, at:Math.max((a&&a.at)||0,(b&&b.at)||0) };
  [a||{},b||{}].forEach(src=>{
    Object.entries(src.items||{}).forEach(([k,v])=>{ const c=o.items[k]; if(!c || (v.t||0)>(c.t||0)) o.items[k]=v; });
    Object.entries(src.links||{}).forEach(([k,v])=>{ const c=o.links[k]; if(!c || (v.t||0)>(c.t||0)) o.links[k]=v; });
  });
  return o;
}
const ulocal=()=>{ try{ localStorage.setItem(UKEY(), JSON.stringify(U)) }catch(e){ q_(e) } };
function usave(){ U.at=Date.now(); ulocal(); ISIG=''; clearTimeout(PUSHT); PUSHT=setTimeout(()=>push().catch(q_),700); }
const NOCOL=m=>/\bfx\b|column|schema cache|42703|PGRST204/i.test(String(m||''));
async function pull(force){
  const c=client(), s=sid(); if(!c || !s || COL===false) return;
  if(!force && PULLK===s && Date.now()-PULLT<60000) return;
  PULLK=s; PULLT=Date.now();
  const q=await c.from('practical_subjects').select('fx').eq('id',s).maybeSingle();
  if(q.error){ if(NOCOL(q.error.message)) COL=false; return; }
  COL=true;
  if(q.data && q.data.fx){ const m=umerge(U,q.data.fx); if(JSON.stringify(m)!==JSON.stringify(U)){ U=m; ulocal(); ISIG=''; paint(true); } }
}
async function push(){
  const c=client(), s=sid(); if(!c || !s) return;
  if(COL===false){ if(!SAID){ SAID=true; say('📐 추가한 공식은 이 기기에만 저장됨 — Supabase 에서 supabase-fx.sql 을 한 번 돌리면 기기끼리 맞춰짐'); } return; }
  const q=await c.from('practical_subjects').select('fx').eq('id',s).maybeSingle();
  if(q.error){ if(NOCOL(q.error.message)){ COL=false; return push(); } return; }
  const m=umerge((q.data&&q.data.fx)||{}, U);
  const u=await c.from('practical_subjects').update({ fx:m }).eq('id',s);
  if(u.error){ if(NOCOL(u.error.message)){ COL=false; return push(); } return; }
  COL=true; U=m; ulocal();
}
const CUSTOM_CAT='내가 추가한 공식';
function ALL(){ uload(); return LIB.concat(Object.values(U.items||{}).filter(x=>x && !x.gone).map(x=>Object.assign({ cat:CUSTOM_CAT, user:1 }, x))); }
function FB(id){ return ALL().find(f=>f.id===id)||null; }

/* ══ ③ 식 모양 견주기 — 해설의 기호식이 목록 공식과 «같은 식» 인지 ══ */
const T=s=>String(s==null?'':s);
const nrm=t=>T(t)
  .replace(/\\text\{[^{}]*\}/g,'').replace(/\\mathrm\{([^{}]*)\}/g,'$1')
  .replace(/\\left|\\right|\\[,;:!]|\\q?quad|\\displaystyle/g,'')
  .replace(/\\[dt]frac/g,'\\frac').replace(/\\cdot|\\times/g,'*')
  .replace(/[{}\s]/g,'').replace(/\(\)/g,'').replace(/\[[^\]]*\]$/,'');
/* 한글 말식(\text{절연계급}=…)은 글자를 살려서 견줌 */
const HAN=/\\text\{[^{}]*[가-힣]/;
const nrmK=t=>nrm(T(t).replace(/\\text\{([^{}]*)\}/g,(m,w)=>'〔'+w.replace(/\s/g,'')+'〕')).replace(/[〔〕]/g,'');
function keysOf(t){ if(HAN.test(T(t))) return eqKeys(nrmK(t)); const s=eqKeys(nrm(t)); if(/\\text\{/.test(T(t))) eqKeys(nrmK(t)).forEach(k=>s.add(k)); return s; }
function eqKeys(n){
  const out=new Set(); if(!n || n.length<4 || !n.includes('=')) return out;
  const p=n.split('='); out.add(n);
  for(let i=0;i<p.length-1;i++){ if(p[i] && p[i+1]){ out.add(p[i]+'='+p[i+1]); out.add(p[i+1]+'='+p[i]); } }
  return out;
}
const pieces=t=>T(t).split(/\\q?quad|,\s*\\;|;\s/).map(x=>x.replace(/^[\s,]+|[\s,]+$/g,'')).filter(x=>x.includes('='));
/* ══ 식 같음 판정 (숫자 대입) — 순서·곱셈 기호·이항이 달라도 같은 식이면 같다고 봄 ══ */
const EQV=(()=>{
  const GREEK='alpha beta gamma delta epsilon varepsilon zeta eta theta vartheta iota kappa lambda mu nu xi rho sigma tau phi varphi chi psi omega Delta Phi Omega Theta Lambda Sigma Psi'.split(' ');
  const FN={sin:Math.sin,cos:Math.cos,tan:Math.tan,ln:Math.log,log:Math.log10,exp:Math.exp};
  function clean(s){
    s=String(s==null?'':s).replace(/\$/g,'')
      .replace(/\\left|\\right|\\displaystyle|\\[,;:!]|\\q?quad|~/g,' ')
      .replace(/\\(dot|vec|hat|bar|mathbf|boldsymbol|mathit)\s*\{([^{}]*)\}/g,'$2')
      .replace(/\\(mathrm|textrm|operatorname|textbf)\s*\{/g,'\\text{')
      .replace(/\\%/g,'%').replace(/[×✕]/g,'*').replace(/[·⋅]/g,'*').replace(/−/g,'-');
    return s.trim();
  }
  /* 끝에 붙은 단위 [kW] · (조건 설명) 떼기 */
  function stripTail(s){
    for(let k=0;k<4;k++){
      const o=s;
      s=s.replace(/\s*\[[^\[\]=+]*\]\s*$/,'').replace(/\s*\\text\{\s*\[[^{}]*\]\s*\}\s*$/,'')
         .replace(/\s*\(\s*\\text\{[^{}]*\}\s*\)\s*$/,'').replace(/\s*\([^()]*[:가-힣][^()]*\)\s*$/,'')
         .replace(/\s*\\text\{\s*[^{}]*(이하|이상|초과|미만|일 때|경우)[^{}]*\}\s*$/,'').trim();
      if(s===o) break;
    }
    return s;
  }
  function lex(s){
    const t=[]; let i=0;
    const bad=()=>{ throw 0 };
    while(i<s.length){
      const c=s[i];
      if(/\s/.test(c)){ i++; continue; }
      const num=s.slice(i).match(/^\d+(\.\d+)?/); if(num){ t.push({k:'n',v:+num[0]}); i+=num[0].length; continue; }
      if(c==='\\'){
        const m=s.slice(i+1).match(/^[A-Za-z]+/); if(!m){ i+=2; continue; }
        const w=m[0]; i+=1+w.length;
        if(/^[dt]?frac$/.test(w)){ t.push({k:'frac'}); continue; }
        if(w==='sqrt'){ t.push({k:'sqrt'}); continue; }
        if(w==='times'||w==='cdot'||w==='ast'){ t.push({k:'*'}); continue; }
        if(w==='div'){ t.push({k:'/'}); continue; }
        if(w==='pi'){ t.push({k:'n',v:Math.PI}); continue; }
        if(w==='sum'){ continue; }
        if(FN[w]){ t.push({k:'f',v:w}); continue; }
        if(GREEK.includes(w)){ t.push({k:'v',v:w==='varepsilon'?'epsilon':w==='vartheta'?'theta':w==='varphi'?'phi':w}); continue; }
        if(w==='text'){
          const j=s.indexOf('}',i); if(s[i]!=='{'||j<0) bad();
          const x=s.slice(i+1,j).replace(/\s/g,''); i=j+1;
          if(!x) continue;
          if(/^[\[\]A-Za-z%°Ω/μ0-9^·.]*$/.test(x) && /^\[.*\]$/.test(x)) continue;   /* [kW] 같은 단위 */
          t.push({k:'v',v:'〈'+x+'〉'}); continue;
        }
        bad();
      }
      if(c==='%'){ if(/[A-Za-z]/.test(s[i+1]||'')){ const m=s.slice(i+1).match(/^[A-Za-z]/); t.push({k:'v',v:'%'+m[0]}); i+=2; continue; } i++; continue; }
      if(/[A-Za-z]/.test(c)){ t.push({k:'v',v:c}); i++; continue; }
      if(/[가-힣]/.test(c)){ const m=s.slice(i).match(/^[가-힣]+/); t.push({k:'v',v:'〈'+m[0]+'〉'}); i+=m[0].length; continue; }
      if(c==='_'){ /* 아래 첨자 — 바로 앞 변수 이름에 붙임 */
        i++; let sub='';
        if(s[i]==='{'){ let d=1,j=i+1; while(j<s.length&&d){ if(s[j]==='{')d++; else if(s[j]==='}')d--; j++; } sub=s.slice(i+1,j-1); i=j; }
        else if(s[i]==='\\'){ const m=s.slice(i+1).match(/^[A-Za-z]+/); sub=m?m[0]:''; i+=1+(m?m[0].length:0); }
        else { sub=s[i]||''; i++; }
        sub=sub.replace(/\\text\{([^{}]*)\}|\\mathrm\{([^{}]*)\}/g,'$1$2').replace(/[\s{}\\]/g,'');
        const p=t[t.length-1];
        if(p && p.k==='v') p.v+='_'+sub;
        else if(p && p.k==='f' && p.v==='log'){ p.base=+sub||10; }
        else bad();
        continue;
      }
      if(c==="'"){ const p=t[t.length-1]; if(p&&p.k==='v'){ p.v+="'"; i++; continue; } bad(); }
      if('+-*/^(){}[]|'.includes(c)){ t.push({k:c}); i++; continue; }
      bad();
    }
    return t;
  }
  function parse(tok){
    let p=0;
    const peek=()=>tok[p], eat=k=>{ if(!tok[p]||tok[p].k!==k) throw 0; return tok[p++]; };
    const starts=x=>x && (x.k==='n'||x.k==='v'||x.k==='frac'||x.k==='sqrt'||x.k==='f'||x.k==='('||x.k==='{'||x.k==='['||x.k==='|');
    function expr(){
      let neg=false; if(peek()&&(peek().k==='-'||peek().k==='+')){ neg=peek().k==='-'; p++; }
      let a=term(); if(neg){ const x=a; a=e=>-x(e); }
      while(peek()&&(peek().k==='+'||peek().k==='-')){ const o=tok[p++].k, b=term(), x=a; a=o==='+'?e=>x(e)+b(e):e=>x(e)-b(e); }
      return a;
    }
    function term(){
      let a=power();
      for(;;){
        const x=peek(); if(!x) break;
        if(x.k==='*'||x.k==='/'){ p++; const b=power(), y=a; a=x.k==='*'?e=>y(e)*b(e):e=>y(e)/b(e); continue; }
        if(starts(x)){ const b=power(), y=a; a=e=>y(e)*b(e); continue; }
        break;
      }
      return a;
    }
    function power(){
      let a=prim();
      while(peek()&&peek().k==='^'){ p++; const b=expo(), x=a; a=e=>Math.pow(x(e),b(e)); }
      return a;
    }
    function expo(){ const x=peek(); if(x&&x.k==='{'){ p++; const a=expr(); eat('}'); return a; } if(x&&x.k==='n'){ p++; return ()=>x.v; } if(x&&x.k==='v'){ p++; return e=>e[x.v]; } throw 0; }
    function group(){ const x=peek(); if(x&&x.k==='{'){ p++; const a=expr(); eat('}'); return a; } return prim(); }
    function prim(){
      const x=tok[p++]; if(!x) throw 0;
      if(x.k==='n') return ()=>x.v;
      if(x.k==='v') return e=>e[x.v];
      if(x.k==='('){ const a=expr(); eat(')'); return a; }
      if(x.k==='{'){ const a=expr(); eat('}'); return a; }
      if(x.k==='['){ const a=expr(); eat(']'); return a; }
      if(x.k==='|'){ const a=expr(); eat('|'); return e=>Math.abs(a(e)); }
      if(x.k==='frac'){ const a=group(), b=group(); return e=>a(e)/b(e); }
      if(x.k==='sqrt'){
        if(peek()&&peek().k==='['){ p++; const n=expr(); eat(']'); const a=group(); return e=>Math.pow(a(e),1/n(e)); }
        const a=group(); return e=>Math.sqrt(a(e));
      }
      if(x.k==='f'){
        let pw=null; if(peek()&&peek().k==='^'){ p++; pw=expo(); }
        const a=power(), f=FN[x.v], base=x.base;
        const g= x.v==='log' && base ? (v=>Math.log(v)/Math.log(base)) : f;
        return pw? e=>Math.pow(g(a(e)),pw(e)) : e=>g(a(e));
      }
      throw 0;
    }
    const f=expr(); if(p!==tok.length) throw 0; return f;
  }
  /* 한 쪽 식 → { f, vars } */
  function side(s){
    s=stripTail(clean(s)); if(!s) return null;
    try{ const tk=lex(s); if(!tk.length) return null; const f=parse(tk); return { f, vars:new Set(tk.filter(x=>x.k==='v').map(x=>x.v)) }; }catch(e){ return null; }
  }
  /* 식 한 줄 → 등호 짝들 [{L,R,vars,sig}] */
  function eqs(line){
    const s=clean(line);
    if(/\\(overline|neq|le|ge|leq|geq|approx|simeq|Rightarrow|therefore|to|rightarrow)\b|[<>≤≥≒≈]/.test(s)) return [];
    const parts=s.split('=').map(x=>x.trim()); if(parts.length<2) return [];
    const out=[];
    for(let i=0;i<parts.length-1;i++){
      const L=side(parts[i]), R=side(parts[i+1]); if(!L||!R) continue;
      const vars=new Set([...L.vars,...R.vars]); if(vars.size<2) continue;
      out.push({ L:L.f, R:R.f, vars:[...vars].sort(), sig:[...vars].sort().join('|') });
    }
    return out;
  }
  /* 난수 (고정 씨앗) */
  function rnd(seed){ let x=seed>>>0||1; return ()=>{ x^=x<<13; x>>>=0; x^=x>>17; x^=x<<5; x>>>=0; return 1.15+((x%100000)/100000)*1.7; }; }
  const D=(q,e)=>q.L(e)-q.R(e);
  /* q1 에서 변수 v 를 풀어서 q2 에 넣어 봄 */
  function same(q1,q2){
    if(q1.sig!==q2.sig) return false;
    for(let s=1;s<=2;s++){
      const r=rnd(7919*s+q1.sig.length), env={}; q1.vars.forEach(v=>{ const x=r(); env[v]=/^(theta|phi|delta)/.test(v)? 0.15+(x-1.15)*0.6 : x; });
      let ok=false;
      for(const v of q1.vars){
        /* 할선법 */
        let a=env[v], b=a*1.3, fa, fb, e1=Object.assign({},env);
        e1[v]=a; fa=D(q1,e1); e1[v]=b; fb=D(q1,e1);
        if(!isFinite(fa)||!isFinite(fb)) continue;
        for(let k=0;k<80 && Math.abs(fb)>1e-12*(1+Math.abs(q1.R(e1))); k++){
          const den=fb-fa; if(!den) break; const c=b-fb*(b-a)/den; a=b; fa=fb; b=c; e1[v]=b; fb=D(q1,e1); if(!isFinite(fb)) break;
        }
        if(!isFinite(fb) || Math.abs(fb)>1e-9*(1+Math.abs(q1.R(e1)))) continue;
        if(!isFinite(b)) continue;
        const d2=D(q2,e1), sc=1+Math.abs(q2.L(e1))+Math.abs(q2.R(e1));
        if(!isFinite(d2)) continue;
        if(Math.abs(d2)<=1e-7*sc){ ok=true; break; }
        return false;
      }
      if(!ok) return false;
    }
    return true;
  }
  return { eqs, same, side, clean };
})();

function formsOf(f){
  const fk=f.tex+'|'+(f.alt||[]).join('|')+'|'+(f.ko||''); if(f.__fk===fk) return f.__forms;
  const s=new Set(); [f.tex,...(f.alt||[]),...(f.kf||[]),f.ko||''].forEach(t=>pieces(t).forEach(p=>{ keysOf(p).forEach(k=>s.add(k)); eqKeys(nrm(p)).forEach(k=>s.add(k)); eqKeys(nrmK(p)).forEach(k=>s.add(k)); }));
  f.__fk=fk; f.__forms=s; return s;
}
/* 숫자 대입으로 견줄 공식 꼴 — 변수 묶음(sig)별로 모아 둠 */
let QIX=null, QSIG='', QALL=null;
function qIndex(all){
  if(QIX && all===QALL) return QIX;
  QALL=all;
  const sg=all.length+'|'+all.map(f=>f.id+':'+(f.tex||'').length+':'+(f.ko||'').length).join(',');
  if(QIX && sg===QSIG) return QIX;
  const m=new Map();
  all.forEach(f=>[f.tex,...(f.alt||[]),...(f.kf||[]),f.ko||''].forEach(t=>pieces(t).forEach(p=>EQV.eqs(p).forEach(q=>{ if(!m.has(q.sig)) m.set(q.sig,[]); m.get(q.sig).push({f,q}); }))));
  QIX=m; QSIG=sg; return m;
}
const SMC=new Map();
function symMatch(line, all){
  const ks=[...keysOf(line)];
  for(const f of all){ const F=formsOf(f); if(ks.some(k=>F.has(k))) return f; }
  /* 모양이 달라도(순서·곱셈 기호·이항) 숫자를 넣어 같으면 같은 식 */
  const ix=qIndex(all), ck=QSIG.length+'|'+line;
  if(SMC.has(ck)){ const id=SMC.get(ck); return id?all.find(f=>f.id===id)||null:null; }
  let hit=null;
  for(const p of pieces(line).length?pieces(line):[line]){
    for(const q of EQV.eqs(p)){ const c=ix.get(q.sig)||[]; const h=c.find(x=>EQV.same(q,x.q)); if(h){ hit=h.f; break; } }
    if(hit) break;
  }
  if(SMC.size>20000) SMC.clear();
  SMC.set(ck, hit?hit.id:''); return hit;
}

/* ══ ④ 문항 → 공식 짝짓기 · 출제율 ══ */
const rows=()=>{ try{ return Array.isArray(ROWS)?ROWS:[] }catch(e){ return [] } };
const real=y=>+y>0 && +y<3000;
function yname(y){
  if(real(y)) return `${String(y).slice(2)}년`;
  let h=''; try{ h=((window.__pracYLabel&&window.__pracYLabel())||{})[String(y)]||(window.__pracYAuto?window.__pracYAuto(y):'') }catch(e){ q_(e) }
  return h||('자료 '+y);
}
const yfull=y=>real(y)?`${y}년`:yname(y);
const pname=r=>r?`${yname(r.year)} ${r.session}회 ${r.no}번`:'';
const pnameLong=r=>r?`${yfull(r.year)} ${r.session}회 ${r.no}번`:'';
const typeOf=r=>{ try{ const p=window.__qtypePath?window.__qtypePath(r.id):null; if(Array.isArray(p)) return p.filter(Boolean).join(' › '); }catch(e){ q_(e) } return r.qtype||''; };
const tyC=r=>{ const t=IDX&&IDX.byTy.get(String(r.id)); return t!=null?t:typeOf(r); };
let IDX=null, ISIG='';
function sigOf(R0){ let n=0; for(const r of R0) n+=(r.easy_md?r.easy_md.length:0)+(r.q_text?r.q_text.length:0)+(r.qtype?r.qtype.length:0); return R0.length+'|'+n+'|'+(U.at||0)+'|'+sid(); }
function build(){
  uload();
  const R0=rows(), s=sigOf(R0);
  if(IDX && s===ISIG) return IDX;
  const all=ALL();
  const byRow=new Map(), byF=new Map(all.map(f=>[f.id,[]])), byTy=new Map();
  R0.forEach(r=>{
    const id=String(r.id);
    const tp=typeOf(r); byTy.set(id, tp);
    const Q=T(r.q_text)+'\n'+T(r.q_md)+'\n'+tp;
    const A=T(r.a_text)+'\n'+T(r.a_md)+'\n'+T(r.easy_md);
    const X=Q+'\n'+A;
    const hit=new Set();
    const Qc=Q.replace(/\s+/g,''), Ac=A.replace(/\s+/g,''), Xc=Qc+'\n'+Ac;
    const ok=(re,a,b)=>re.test(b);   /* 공백 뺀 글로만 — 원래 규칙은 \s* 라 같은 결과, 줄바꿈으로 끊긴 낱말도 잡힘 */
    for(const f of LIB){
      const m=f.m; if(!m) continue;
      if(m.q && !ok(m.q,Q,Qc)) continue;
      if(m.a && !ok(m.a,A,Ac)) continue;
      if(m.x && !ok(m.x,X,Xc)) continue;
      if(m.no && ok(m.no,Q,Qc)) continue;
      hit.add(f.id);
    }
    /* 해설에 같은 식이 그대로 있으면 연결 (목록 공식 · 내가 추가한 공식 모두) */
    if(r.easy_md) symLines(r.easy_md).forEach(l=>{ const f=symMatch(l, all); if(f) hit.add(f.id); });
    byRow.set(id, hit);
  });
  /* 손으로 연결 · 빼기 */
  Object.entries(U.links||{}).forEach(([k,v])=>{
    const i=k.indexOf('|'); const rid=k.slice(0,i), fid=k.slice(i+1);
    const h=byRow.get(rid); if(!h || !byF.has(fid)) return;
    if(v && v.on) h.add(fid); else h.delete(fid);
  });
  byRow.forEach((h,rid)=>{ h.forEach(fid=>{ const l=byF.get(fid); if(l) l.push(rid); }); });
  const rmap=new Map(R0.map(r=>[String(r.id),r]));
  byF.forEach((l,fid)=>byF.set(fid, l.map(id=>rmap.get(id)).filter(Boolean)));
  byRow.forEach((h,rid)=>byRow.set(rid,[...h]));
  const ord=(a,b)=>(real(b.year)-real(a.year))||((+b.year||0)-(+a.year||0))||((+b.session||0)-(+a.session||0))||((+a.no||0)-(+b.no||0));
  byF.forEach(l=>l.sort(ord));
  /* 출제율 바탕 — 진짜 회차(연도 1~2999)만 셈 */
  const reals=R0.filter(r=>real(r.year));
  const sessAll=new Set(reals.map(r=>r.year+'-'+r.session));
  const maxY=reals.reduce((m,r)=>Math.max(m,+r.year||0),0);
  const stat=new Map();
  byF.forEach((l,fid)=>{
    const rl=l.filter(r=>real(r.year));
    const ss=new Set(rl.map(r=>r.year+'-'+r.session));
    stat.set(fid,{ n:l.length, nr:rl.length, pct: reals.length? rl.length/reals.length*100 : 0,
      ss:ss.size, ssAll:sessAll.size, spct: sessAll.size? ss.size/sessAll.size*100:0,
      r5: rl.filter(r=>+r.year>=maxY-4).length, last: rl[0]||null });
  });
  IDX={ byRow, byF, byTy, ord, stat, total:reals.length, sessN:sessAll.size, maxY }; ISIG=s; return IDX;
}
/* 해설(쉬운 풀이)에 쓴 «기호식» 만 골라냄 — 숫자 대입식·한글 말식·단위식은 뺌 */
function blocks(md){ const out=[]; const re=/\$\$([\s\S]+?)\$\$/g; let m; const src=T(md); while((m=re.exec(src))) out.push({ body:m[1], at:m.index }); return out; }
const bLines=b=>b.replace(/\\begin\{aligned\}|\\end\{aligned\}/g,'').split(/\\\\/).map(l=>l.replace(/&/g,'').replace(/\s+/g,' ').trim()).filter(Boolean);
const isSym=t=>{
  if(!t || t.length<3 || /^\[/.test(t) || /\\text\{[^}]*[가-힣]/.test(t) || !/=/.test(t)) return false;
  const nums=(t.replace(/_\{?\d+\}?|\^\{?\d+\}?|\\sqrt\{?3\}?|\\dfrac|\\frac/g,'').match(/\d+(\.\d+)?/g)||[]);
  return nums.length<2;
};
/* 기호가 따로 없는 공식(BIL=절연계급×5+50 처럼 한글로만 쓴 식)도 «식» 으로 봄
   — 등호 하나 · 오른쪽에 변수가 있음 · 숫자 대입식/단위식 아님 */
const isKoEq=t=>{
  if(!t || !HAN.test(t) || /상수|\\Rightarrow|\\therefore/.test(t)) return false;
  const p=t.split(/(?<![<>\\!])=/); if(p.length!==2) return false;
  const L=p[0].trim(), Rt=p[1].trim(); if(!L || !Rt || /\[/.test(L) || /^\s*(\\left)?\[/.test(t)) return false;
  const vars=s=>{ const x=s.replace(/\[[^\]]*\]|\\left\[[\s\S]*?\\right\]/g,'').replace(/\\text\{([^{}]*)\}/g,' $1 ').replace(/\\(d?frac|t?frac|times|cdot|sqrt|left|right|quad|qquad|[,;:!])/g,' ');
    return /[가-힣]{2,}|(?<!\\)\b[A-Za-z]{1,4}(_\{?\w+\}?)?\b/.test(x); };
  return vars(L) && vars(Rt);
};
const isKoLine=t=>HAN.test(t);
function symLines(md){
  const out=[], seen=new Set(), ko=new Set();
  blocks(md).forEach(b=>bLines(b.body).forEach(t=>{
    const sym=isSym(t); if(!sym && !isKoEq(t)) return;
    const k=t.replace(/\s/g,''); if(seen.has(k)) return; seen.add(k); out.push(t);
  }));
  /* 기호식이 있으면 그 «말로» 짝은 따로 세우지 않음 */
  out.filter(t=>!isKoLine(t)).forEach(t=>{ const m=koFor(md,t); if(m) ko.add(m.replace(/\s/g,'')); });
  return out.filter(t=>!(isKoLine(t) && ko.has(t.replace(/\s/g,'')))).slice(0,12);
}
/* 기호식 바로 뒤의 «말로» 식 (한글 \text 가 든 식) */
function koFor(md, line){
  const bs=blocks(md), k=line.replace(/\s/g,'');
  for(let i=0;i<bs.length;i++){
    if(!bLines(bs[i].body).some(t=>t.replace(/\s/g,'')===k)) continue;
    for(let j=i;j<Math.min(bs.length,i+3);j++){ const hit=bLines(bs[j].body).find(t=>/\\text\{[^}]*[가-힣]/.test(t) && /=/.test(t)); if(hit) return hit; }
  }
  return '';
}
/* 그 식이 나온 풀이 단계 이름 «(2) 전압강하 구하기» */
function stepFor(md, line){
  const src=T(md), k=line.replace(/\s/g,'');
  const b=blocks(md).find(x=>bLines(x.body).some(t=>t.replace(/\s/g,'')===k)); if(!b) return '';
  const before=src.slice(0,b.at).split('\n').reverse().find(l=>/^\s*(\(\d{1,2}\)|\d{1,2}\.)\s*\S/.test(l));
  return before ? before.replace(/^\s*(\(\d{1,2}\)|\d{1,2}\.)\s*/,'').replace(/[*=〖〗]/g,'').trim().slice(0,30) : '';
}
/* 해설 «부호» 칸에서 그 식에 나오는 기호만 */
function symsFor(md, line){
  const L=T(md).split('\n'); let on=false; const out=[];
  for(const l of L){
    const t=l.trim();
    if(/^\*\*부호\*\*/.test(t)){ on=true; continue; }
    if(!on) continue;
    if(/^\*\*/.test(t)) break;
    const x=t.match(/^-\s*\$([^$]+)\$\s*(?:«([^»]*)»)?\s*—\s*(.*)$/); if(!x) continue;
    let mean=x[3], unit='';
    const um=mean.match(/·\s*단위\s*([^·]+)/); if(um){ unit=um[1].replace(/\$/g,'').trim(); mean=mean.replace(um[0],''); }
    mean=mean.replace(/·\s*이 문제:.*$/,'').replace(/\$/g,'').trim();
    out.push([x[1].trim(), (x[2]||'').trim(), mean, unit]);
  }
  const kl=isKoLine(line), N=kl?nrmK:nrm, n=N(line);
  return out.filter(s=>{ const k=N(s[0]); return k && n.includes(k); });
}

/* ══ ⑤ 그리기 도우미 ══ */
function tex(t, disp){
  try{ if(window.katex) return window.katex.renderToString(t,{ throwOnError:false, displayMode:!!disp, strict:'ignore' }); }catch(e){ q_(e) }
  return `<code>${esc(t)}</code>`;
}
const rowOf=id=>rows().find(r=>String(r.id)===String(id))||null;
let LASTCARD='';
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

/* ══ ⑥ 창 ══ */
const KEY='prac:fx:v1';
let S={ tab:'now', x:null, y:null, w:400, h:620, open:{}, sort:'cat', cat:'', ny:'', ns:'' };
try{ Object.assign(S, JSON.parse(localStorage.getItem(KEY)||'{}')||{}) }catch(e){ q_(e) }
const save=()=>{ try{ localStorage.setItem(KEY, JSON.stringify(S)) }catch(e){ q_(e) } };
const phone=()=>{ try{ return matchMedia('(max-width:700px)').matches }catch(e){ return innerWidth<700 } };
let VIEW='';            /* 이 문제 탭에서 고른 문항 (비면 지금 보는 문항을 따라감) */

const css=document.createElement('style');
css.textContent=`
.fxb{order:9;margin-left:5px;height:20px;padding:0 8px;border:1px solid #c7d2fe;border-radius:6px;background:#eef2ff;color:#3730a3;
  cursor:pointer;font:700 9.5px/1 var(--font-d,system-ui);flex:0 0 auto;white-space:nowrap}
.fxb:hover,.fxb.open{background:#3730a3;color:#fff;border-color:#3730a3}
.ovl .plab .mmb + .fxb,.plabel .mmb + .fxb{margin-left:5px}
.ovl .plab .fxb + .edb,.plabel .fxb + .edb{margin-left:6px}
.fxpop{position:fixed;z-index:2147483000;display:none;flex-direction:column;background:#f8f9fc;border:1px solid #c7d2fe;border-radius:14px;
  box-shadow:0 18px 48px rgba(15,23,42,.24),0 2px 8px rgba(15,23,42,.08);overflow:hidden;min-width:320px;min-height:260px;resize:both;
  font-family:var(--font-d,system-ui);color:#0f172a}
.fxpop.on{display:flex}
.fxpop .fxhd{display:flex;align-items:center;gap:6px;padding:7px 8px 7px 12px;background:#fff;border-bottom:1px solid #e0e7ff;cursor:move;user-select:none;-webkit-user-select:none;touch-action:none}
.fxpop .fxhd b{font:800 13.5px/1 var(--font-d,system-ui);color:#312e81;white-space:nowrap}
.fxpop .fxtabs{display:inline-flex;margin-left:8px;border:1px solid #c7d2fe;border-radius:9px;overflow:hidden;background:#fff}
.fxpop .fxtabs button{height:28px;padding:0 12px;border:0;background:transparent;color:#3730a3;font:700 12px/1 var(--font-d,system-ui);cursor:pointer}
.fxpop .fxtabs button + button{border-left:1px solid #e0e7ff}
.fxpop .fxtabs button.on{background:#3730a3;color:#fff}
.fxpop .fxx{margin-left:auto;width:30px;height:30px;border:0;border-radius:8px;background:transparent;color:#475569;font-size:16px;cursor:pointer}
.fxpop .fxx:hover{background:#eef2ff}
.fxpop .fxbar{display:flex;flex-wrap:wrap;gap:6px;align-items:center;padding:8px 10px;border-bottom:1px solid #e5e7eb;background:#fff}
.fxpop .fxbar select{height:30px;padding:0 26px 0 10px;border:1px solid #d6dceb;border-radius:9px;background:#fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M1 1l4 4 4-4' fill='none' stroke='%23475569' stroke-width='1.6'/%3E%3C/svg%3E") no-repeat right 9px center;
  -webkit-appearance:none;appearance:none;font:800 13px/1 var(--font-d,system-ui);color:#0f172a;cursor:pointer}
.fxpop .fxbar select{width:auto!important;max-width:46%;flex:0 0 auto!important;margin:0!important;min-width:0}
.fxpop .fxbar input{margin:0!important}
.fxpop .fxbar select:focus{outline:3px solid rgba(99,102,241,.18);border-color:#6366f1}
.fxpop .fxbar input{flex:1 1 120px;min-width:100px;height:30px;padding:0 10px;border:1px solid #d6dceb;border-radius:9px;font:600 12.5px/1 var(--font-d,system-ui);background:#fff}
.fxpop .fxbar .bt{height:30px;padding:0 10px;border:1px solid #c7d2fe;border-radius:9px;background:#eef2ff;color:#3730a3;font:750 12px/1 var(--font-d,system-ui);cursor:pointer;white-space:nowrap}
.fxpop .fxbar .bt.on{background:#3730a3;color:#fff;border-color:#3730a3}
.fxpop .fxbar small{color:#64748b;font:600 11px/1 var(--font-d,system-ui);white-space:nowrap;margin-left:auto}
.fxpop .fxbd{flex:1;min-height:0;overflow:auto;padding:10px 10px 16px;overscroll-behavior:contain}
.fxpop .fxnow{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap;margin:0 2px 2px}
.fxpop .fxnow b{font:850 15px/1.3 var(--font-d,system-ui);color:#1e1b4b}
.fxpop .fxnow .fol{font:700 10.5px/1 var(--font-d,system-ui);color:#16a34a;background:#dcfce7;border-radius:99px;padding:3px 7px}
.fxpop .fxty{font:600 11.5px/1.45 var(--font-d,system-ui);color:#6366f1;margin:2px 2px 4px}
.fxpop .fxh{display:flex;align-items:center;gap:6px;font:800 12px/1 var(--font-d,system-ui);color:#334155;margin:14px 2px 7px}
.fxpop .fxh::before{content:'';width:4px;height:13px;border-radius:2px;background:#6366f1}
.fxpop .fxh small{font:600 10.5px/1 var(--font-d,system-ui);color:#94a3b8}
.fxpop .fxc{border:1px solid #e0e7ff;border-radius:12px;background:#fff;margin:0 0 8px;overflow:hidden;box-shadow:0 1px 2px rgba(15,23,42,.04)}
.fxpop .fxc > summary{list-style:none;display:flex;align-items:center;gap:8px;padding:9px 11px;cursor:pointer}
.fxpop .fxc > summary::-webkit-details-marker{display:none}
.fxpop .fxc > summary .nm{flex:1;min-width:0;font:800 13px/1.35 var(--font-d,system-ui);color:#1e1b4b}
.fxpop .fxc > summary .nm small{font:600 10.5px/1 var(--font-d,system-ui);color:#94a3b8;margin-left:4px}
.fxpop .fxc > summary .rt{font:800 10.5px/1 var(--font-m,monospace);color:#b45309;background:#fef3c7;border-radius:99px;padding:4px 7px;white-space:nowrap}
.fxpop .fxc > summary .ct{font:700 10.5px/1 var(--font-m,monospace);color:#4338ca;background:#eef2ff;border-radius:99px;padding:4px 7px;white-space:nowrap}
.fxpop .fxc > summary .car{color:#94a3b8;font-size:10px;transition:transform .15s}
.fxpop .fxc[open] > summary{border-bottom:1px solid #eef2ff}
.fxpop .fxc[open] > summary .car{transform:rotate(90deg);color:#4338ca}
.fxpop .fxc.basic{border-style:dashed}
.fxpop .fxc.user{border-color:#a7f3d0}
.fxpop .fxc.zero:not([open]){opacity:.5}
.fxpop .eqs{padding:6px 10px 2px}
.fxpop .eqr{display:grid;grid-template-columns:38px minmax(0,1fr);align-items:center;gap:6px;padding:4px 0;border-bottom:1px dashed #eef2f7}
.fxpop .eqr:last-child{border-bottom:0}
.fxpop .eqr .k{font:800 10px/1.7 var(--font-d,system-ui);text-align:center;border-radius:5px;background:#e9efff;color:#2f4fc4}
.fxpop .eqr .k.ko{background:#e6f5ec;color:#18794e}
.fxpop .eqr .k.al{background:#f1f5f9;color:#56657a}
.fxpop .eqr .m{overflow-x:auto;overflow-y:hidden;padding:2px 0}
.fxpop .eqr .m .katex-display{margin:.15em 0;text-align:left}
.fxpop .eqr .m .katex-display > .katex{text-align:left}
.fxpop .syt{margin:4px 10px 6px;border:1px solid #eef2f7;border-radius:9px;overflow:hidden}
.fxpop .syt .sh{font:800 10.5px/1 var(--font-d,system-ui);color:#64748b;background:#f8fafc;padding:5px 8px;border-bottom:1px solid #eef2f7}
.fxpop .syt .sr{display:grid;grid-template-columns:minmax(96px,max-content) minmax(0,1fr) auto;gap:8px;align-items:center;padding:2px 8px;border-top:1px dashed #f1f5f9;min-height:26px}
.fxpop .syt .sr:first-of-type{border-top:0}
.fxpop .syt .s1{font-size:1.02em;white-space:nowrap}
.fxpop .syt .s1 small{display:inline;margin-left:5px;font:600 9.5px/1 var(--font-d,system-ui);color:#94a3b8}
.fxpop .syt .s2{font:600 11.5px/1.4 var(--font-d,system-ui);color:#334155}
.fxpop .syt .s3{font:700 10.5px/1 var(--font-m,monospace);color:#6366f1;white-space:nowrap}
.fxpop .fxc .v{padding:2px 11px 6px;font:500 11.5px/1.5 var(--font-d,system-ui);color:#64748b}
.fxpop .fxc .st{display:flex;flex-wrap:wrap;gap:4px 10px;padding:6px 11px;margin:2px 10px 6px;border-radius:8px;background:#fffbeb;font:650 11px/1.45 var(--font-d,system-ui);color:#92400e}
.fxpop .fxc .st b{font-weight:850}
.fxpop .fxc .chips{display:flex;flex-wrap:wrap;gap:4px;padding:2px 10px 10px}
.fxpop .chip{height:23px;padding:0 9px;border:1px solid #c7d2fe;border-radius:99px;background:#fff;color:#3730a3;font:700 10.5px/21px var(--font-m,monospace);cursor:pointer;white-space:nowrap}
.fxpop .chip:hover,.fxpop .chip.me{background:#3730a3;color:#fff;border-color:#3730a3}
.fxpop .acts{display:flex;gap:6px;justify-content:flex-end;padding:0 10px 9px}
.fxpop .acts button,.fxpop .sym .add,.fxpop .lnk button{height:26px;padding:0 10px;border:1px solid #d6dceb;border-radius:8px;background:#fff;color:#475569;font:700 11px/1 var(--font-d,system-ui);cursor:pointer;white-space:nowrap}
.fxpop .acts button:hover{border-color:#ef4444;color:#b91c1c}
.fxpop .sym{border:1px solid #e5e7eb;border-radius:11px;background:#fff;margin:0 0 7px;padding:6px 10px 8px}
.fxpop .sym .eqr{border-bottom-style:dashed}
.fxpop .sym .ft{display:flex;align-items:center;gap:6px;justify-content:flex-end;margin-top:5px;font:650 11px/1.4 var(--font-d,system-ui);color:#16a34a}
.fxpop .sym .ft .stp{margin-right:auto;color:#94a3b8;font-weight:600}
.fxpop .sym .add{background:#3730a3;border-color:#3730a3;color:#fff}
.fxpop .sym .add:hover{background:#312e81}
.fxpop .lnk{display:flex;gap:6px;align-items:center;margin:4px 2px 0}
.fxpop .lnk select{flex:1;min-width:0;width:auto!important;margin:0!important;height:28px;border:1px solid #d6dceb;border-radius:8px;font:600 12px/1 var(--font-d,system-ui);padding:0 6px;background:#fff}
.fxpop .lnk button{background:#eef2ff;border-color:#c7d2fe;color:#3730a3}
.fxpop .fxemp{color:#94a3b8;font:600 12px/1.6 var(--font-d,system-ui);padding:8px 4px}
.fxpop .sess{font:850 12.5px/1 var(--font-d,system-ui);color:#1e1b4b;margin:12px 2px 6px;padding-top:9px;border-top:1px solid #e0e7ff}
.fxpop .sgrp:first-child .sess{border-top:0;margin-top:2px;padding-top:2px}
.fxpop .prow{display:flex;gap:8px;align-items:flex-start;padding:6px 7px;border-radius:9px;cursor:pointer;background:#fff;border:1px solid #f1f5f9;margin-bottom:4px}
.fxpop .prow:hover{border-color:#c7d2fe}
.fxpop .prow.me{background:#eef2ff;border-color:#a5b4fc}
.fxpop .prow .no{flex:none;min-width:40px;font:850 12px/22px var(--font-m,monospace);color:#3730a3}
.fxpop .prow .fs{flex:1;min-width:0;display:flex;flex-wrap:wrap;gap:4px}
.fxpop .prow .fs .fn{font:650 11px/20px var(--font-d,system-ui);color:#334155;background:#f1f5f9;border-radius:6px;padding:0 7px}
.fxpop .prow .fs .fn:hover{background:#e0e7ff;color:#3730a3}
.fxpop .prow .fs .fn.b{opacity:.65}
.fxpop .prow .ty{display:block;width:100%;font:500 10.5px/1.4 var(--font-d,system-ui);color:#94a3b8}
.fxpop .sgrp{content-visibility:auto;contain-intrinsic-size:auto 420px}
.fxpop .cat{display:flex;align-items:center;gap:6px;font:850 12.5px/1 var(--font-d,system-ui);color:#4338ca;margin:16px 2px 8px}
.fxpop .cat small{font:600 10.5px/1 var(--font-d,system-ui);color:#94a3b8}
.fxpop .cat:first-child{margin-top:2px}
.fxpop .hl{animation:fxhl 1.4s ease}
@keyframes fxhl{0%{box-shadow:0 0 0 3px #818cf8}100%{box-shadow:0 0 0 0 transparent}}
.fxpop{min-width:280px}
.fxpop .fxhd{padding:4px 5px 4px 9px;gap:4px}
.fxpop .fxhd b{font-size:12.5px}
.fxpop .fxtabs{margin-left:4px}
.fxpop .fxtabs button{height:25px;padding:0 9px;font-size:11.5px}
.fxpop .fxx{width:26px;height:26px;font-size:14px}
.fxpop .fxbar{padding:5px 7px;gap:4px}
.fxpop .fxbar select,.fxpop .fxbar input,.fxpop .fxbar .bt{height:26px;font-size:11.5px;border-radius:7px}
.fxpop .fxbar select{padding:0 20px 0 7px;background-position:right 7px center}
.fxpop .fxbar .bt{padding:0 7px}
.fxpop .fxbd{padding:6px 6px 10px}
.fxpop .fxnow b{font-size:13.5px}
.fxpop .fxnow .fol{padding:2px 6px;font-size:10px}
.fxpop .fxty{font-size:11px;margin:1px 2px 2px}
.fxpop .fxh{margin:9px 1px 5px;font-size:11.5px}
.fxpop .fxc{border-radius:9px;margin:0 0 5px}
.fxpop .fxc > summary{padding:6px 8px;gap:6px}
.fxpop .fxc > summary .nm{font-size:12.5px}
.fxpop .fxc > summary .rt,.fxpop .fxc > summary .ct{padding:3px 6px;font-size:10px}
.fxpop .eqs{padding:3px 7px 0}
.fxpop .eqr{grid-template-columns:34px minmax(0,1fr);gap:5px;padding:2px 0}
.fxpop .syt{margin:3px 7px 4px}
.fxpop .syt .sh{padding:3px 7px}
.fxpop .syt .sr{grid-template-columns:minmax(80px,max-content) minmax(0,1fr) auto;gap:6px;padding:1px 7px;min-height:22px}
.fxpop .fxc .v{padding:1px 8px 4px;font-size:11px}
.fxpop .fxc .st{padding:4px 8px;margin:1px 7px 4px;gap:2px 8px;font-size:10.5px}
.fxpop .fxc .chips{padding:1px 7px 7px;gap:3px}
.fxpop .chip{height:21px;padding:0 7px;line-height:19px;font-size:10px}
.fxpop .acts{padding:0 7px 6px;gap:4px}
.fxpop .acts button,.fxpop .sym .add,.fxpop .lnk button{height:23px;padding:0 8px;font-size:10.5px}
.fxpop .sym{border-radius:9px;margin:0 0 5px;padding:3px 7px 5px}
.fxpop .sym .ft{margin-top:3px;font-size:10.5px}
.fxpop .lnk select{height:25px}
.fxpop .fxsec > summary{list-style:none;cursor:pointer}
.fxpop .fxsec > summary::-webkit-details-marker{display:none}
.fxpop .fxsec > summary::before{display:none}
.fxpop .fxsec > summary .car{color:#94a3b8;font-size:9px;transition:transform .15s}
.fxpop .fxsec[open] > summary .car{transform:rotate(90deg);color:#4338ca}
.fxpop .sess{margin:8px 1px 4px;padding-top:6px;font-size:12px}
.fxpop .prow{padding:4px 6px;gap:6px;margin-bottom:3px;border-radius:7px}
.fxpop .prow .no{min-width:34px;font-size:11.5px;line-height:20px}
.fxpop .prow .fs .fn{font-size:10.5px;line-height:18px;padding:0 6px}
.fxpop .cat{margin:10px 1px 5px;font-size:12px}
@media(max-width:700px){ .fxpop{left:6px!important;right:6px!important;width:auto!important;top:auto!important;bottom:6px!important;height:68vh!important;resize:none} .fxpop .fxhd{cursor:default} .fxpop .fxtabs button{padding:0 9px} }
body.rd-night .fxpop{background:#0b1220;border-color:#33415c;color:#e5e7eb}
body.rd-night .fxpop .fxhd,body.rd-night .fxpop .fxbar{background:#111827;border-color:#33415c}
body.rd-night .fxpop .fxhd b,body.rd-night .fxpop .fxnow b,body.rd-night .fxpop .sess,body.rd-night .fxpop .fxh{color:#cfe0ff}
body.rd-night .fxpop .fxbar select,body.rd-night .fxpop .fxbar input,body.rd-night .fxpop .lnk select{background-color:#0f172a;color:#e5e7eb;border-color:#33415c}
body.rd-night .fxpop .fxc,body.rd-night .fxpop .sym,body.rd-night .fxpop .prow,body.rd-night .fxpop .fxtabs{background:#111827;border-color:#33415c}
body.rd-night .fxpop .fxc > summary .nm{color:#e5e7eb}
body.rd-night .fxpop .syt,body.rd-night .fxpop .syt .sh{background:#0f172a;border-color:#33415c}
body.rd-night .fxpop .syt .s2,body.rd-night .fxpop .fxc .v{color:#cbd5e1}
body.rd-night .fxpop .fxc .st{background:#2a2414;color:#fcd34d}
body.rd-night .fxpop .chip,body.rd-night .fxpop .acts button,body.rd-night .fxpop .lnk button{background:#111827;color:#c7d2fe;border-color:#33415c}
body.rd-night .fxpop .prow .fs .fn{background:#1f2937;color:#cbd5e1}
body.rd-night .fxpop .prow.me{background:#1a2640}
`;
document.head.appendChild(css);

let EL=null, LASTID='', Q='';
function pop(){
  if(EL) return EL;
  EL=document.createElement('div'); EL.className='fxpop'; EL.setAttribute('role','dialog'); EL.setAttribute('aria-label','공식 모음');
  EL.innerHTML=`<div class="fxhd"><b>📐 공식</b><span class="fxtabs">
      <button type="button" data-tab="now">이 문제</button><button type="button" data-tab="f">공식별</button><button type="button" data-tab="n">번호별</button></span>
      <button type="button" class="fxx" data-x aria-label="닫기" title="닫기 (Esc)">✕</button></div>
    <div class="fxbar"></div>
    <div class="fxbd"></div>`;
  document.body.appendChild(EL);
  const bar=$('.fxbar',EL);
  bar.addEventListener('input', e=>{ if(e.target.matches('input[data-q]')){ Q=e.target.value.trim(); paint(true,null,true); } });
  bar.addEventListener('change', e=>{
    const t=e.target, k=t.dataset.sel; if(!k) return;
    const v=t.value;
    if(k==='vy'||k==='vs'||k==='vn'){ pickView(k,v); return; }
    if(k==='cat') S.cat=v; if(k==='sort') S.sort=v; if(k==='ny'){ S.ny=v; S.ns=''; } if(k==='ns') S.ns=v;
    save(); paint(true);
  });
  ['keydown','keyup','keypress'].forEach(ev=>EL.addEventListener(ev,e=>{
    if(!e.target.matches || !e.target.matches('input,select')) return;
    e.stopPropagation();
    if(ev==='keydown' && e.key==='Escape' && e.target.matches('input[data-q]')){ e.target.value=''; Q=''; paint(true); }
  }));
  EL.addEventListener('click', e=>{
    const t=e.target;
    if(t.closest('[data-x]')) return close();
    const tb=t.closest('[data-tab]'); if(tb){ S.tab=tb.dataset.tab; Q=''; save(); return paint(true); }
    if(t.closest('[data-follow]')){ VIEW=''; return paint(true); }
    if(t.closest('[data-openv]')){ if(VIEW) goTo(VIEW); VIEW=''; setTimeout(()=>paint(true),250); return; }
    const ch=t.closest('[data-go]'); if(ch){ e.preventDefault(); VIEW=''; goTo(ch.dataset.go); setTimeout(()=>paint(true),250); return; }
    const fn=t.closest('[data-fx]'); if(fn){ e.preventDefault(); e.stopPropagation(); S.tab='f'; S.cat=''; Q=''; S.open[fn.dataset.fx]=1; save(); paint(true, fn.dataset.fx); return; }
    const un=t.closest('[data-unlink]'); if(un){ e.preventDefault(); e.stopPropagation(); const rid=viewId(); if(!rid) return;
      U.links[rid+'|'+un.dataset.unlink]={ on:false, t:Date.now() }; usave(); say('이 문제에서 뺐음 — 다시 넣으려면 아래 «＋ 공식 연결»'); return paint(true); }
    const dl=t.closest('[data-delfx]'); if(dl){ e.preventDefault(); e.stopPropagation(); const f=U.items[dl.dataset.delfx]; if(!f) return;
      if(!confirm(`«${f.name}» 공식을 지울까요?\n(연결된 문항에서도 같이 빠짐)`)) return;
      U.items[f.id]=Object.assign({},f,{ gone:true, t:Date.now() }); usave(); return paint(true); }
    const ad=t.closest('[data-addsym]'); if(ad){ e.preventDefault(); addFromSym(+ad.dataset.addsym); return; }
    const lk=t.closest('[data-linksym]'); if(lk){ e.preventDefault(); const rid=viewId(); if(!rid) return;
      U.links[rid+'|'+lk.dataset.linksym]={ on:true, t:Date.now() }; usave(); return paint(true); }
    if(t.closest('[data-linkpick]')){ const sel=$('.lnk select',EL), rid=viewId(); if(!sel || !sel.value || !rid) return;
      U.links[rid+'|'+sel.value]={ on:true, t:Date.now() }; usave(); say('이 문제에 연결했음'); return paint(true); }
    const pr=t.closest('[data-row]'); if(pr){ VIEW=''; goTo(pr.dataset.row); setTimeout(()=>paint(true),250); }
  });
  EL.addEventListener('toggle', e=>{ const d=e.target; if(d.classList && d.classList.contains('fxsec') && d.dataset.sec){ SECOPEN[d.dataset.sec]=d.open; return; } if(S.tab==='now' && d.classList && d.classList.contains('fxc') && d.dataset.id){ if(d.open) NOWOPEN.add(d.dataset.id); else NOWOPEN.delete(d.dataset.id); return; } if(S.tab==='f' && d.classList && d.classList.contains('fxc') && d.dataset.id){ if(d.open) S.open[d.dataset.id]=1; else delete S.open[d.dataset.id]; save(); } }, true);
  /* 끌어 옮기기 */
  const hd=$('.fxhd',EL); let D=null;
  hd.addEventListener('pointerdown', e=>{ if(phone() || e.target.closest('button,input,select')) return;
    const r=EL.getBoundingClientRect(); D={ dx:e.clientX-r.left, dy:e.clientY-r.top }; try{ hd.setPointerCapture(e.pointerId) }catch(x){ q_(x) } e.preventDefault(); });
  hd.addEventListener('pointermove', e=>{ if(!D) return;
    S.x=Math.max(0,Math.min(innerWidth-120, e.clientX-D.dx)); S.y=Math.max(0,Math.min(innerHeight-60, e.clientY-D.dy)); place(); });
  const up=()=>{ if(D){ D=null; save(); } }; hd.addEventListener('pointerup',up); hd.addEventListener('pointercancel',up);
  /* 크기 바꾼 것 기억 — 화면이 좁아 줄여 그린 것은 기억 안 함 */
  try{ new ResizeObserver(()=>{ if(!EL.classList.contains('on') || phone() || PLACING) return; const r=EL.getBoundingClientRect(); if(r.width>200 && r.height>150){ S.w=Math.round(r.width); S.h=Math.round(r.height); clearTimeout(pop.__t); pop.__t=setTimeout(save,300); } }).observe(EL); }catch(e){ q_(e) }
  EL.addEventListener('keydown', e=>{ if(e.key==='Escape' && !(e.target.matches && e.target.matches('input[data-q]'))){ e.stopPropagation(); close(); } });
  return EL;
}
let PLACING=false;
function place(){
  if(!EL || phone()) return;
  PLACING=true; requestAnimationFrame(()=>requestAnimationFrame(()=>{ PLACING=false; }));
  const w=Math.min((S.w===460?400:S.w)||400, innerWidth-12), h=Math.min(S.h||620, innerHeight-12);
  let x=S.x, y=S.y;
  if(x==null){ x=innerWidth-w-16; y=64; }
  x=Math.max(0,Math.min(innerWidth-Math.min(w,160), x)); y=Math.max(0,Math.min(innerHeight-60, y));
  EL.style.left=x+'px'; EL.style.top=y+'px'; EL.style.width=w+'px'; EL.style.height=h+'px';
}
function open(){ pop().classList.add('on'); place(); pull().catch(q_); paint(true); $$('.fxb').forEach(b=>b.classList.add('open')); }
function close(){ EL && EL.classList.remove('on'); $$('.fxb').forEach(b=>b.classList.remove('open')); }
const isOpen=()=>!!(EL && EL.classList.contains('on'));
const viewId=()=>VIEW||curId();

/* 이 문제 탭 — 연도 · 회차 · 번호 고르기 */
function pickView(k,v){
  const R0=rows(), cur=rowOf(viewId());
  let y=cur?String(cur.year):'', s=cur?String(cur.session):'', n=cur?String(cur.no):'';
  if(k==='vy'){ y=v; s=''; n=''; } if(k==='vs'){ s=v; n=''; } if(k==='vn') n=v;
  const cand=R0.filter(r=>String(r.year)===y && (!s || String(r.session)===s) && (!n || String(r.no)===n))
               .sort((a,b)=>(+a.session-+b.session)||(+a.no-+b.no));
  if(cand[0]){ VIEW=String(cand[0].id); paint(true); }
}
const uniq=a=>[...new Set(a)];
function opts(list, sel, lab){ return list.map(v=>`<option value="${esc(v)}"${String(v)===String(sel)?' selected':''}>${esc(lab?lab(v):v)}</option>`).join(''); }
function yearList(){ const ys=uniq(rows().map(r=>String(r.year))); return ys.sort((a,b)=>(real(b)-real(a))||(+b-+a)); }

/* 공식 카드 */
function rateTxt(st){ return st && st.pct ? (st.pct>=10?st.pct.toFixed(0):st.pct.toFixed(1))+'%' : '0%'; }
function card(f, opt){
  opt=opt||{};
  const I=build(), list=I.byF.get(f.id)||[], st=I.stat.get(f.id), me=viewId();
  const openA = opt.open!=null ? opt.open : !!S.open[f.id];
  const rows_=[`<div class="eqr"><span class="k">기호</span><div class="m">${tex(f.tex,true)}</div></div>`];
  if(f.ko) rows_.push(`<div class="eqr"><span class="k ko">말로</span><div class="m">${tex(f.ko,true)}</div></div>`);
  (f.alt||[]).forEach(a=>rows_.push(`<div class="eqr"><span class="k al" title="순서·위치만 바뀐 같은 식">다른꼴</span><div class="m">${tex(a,false)}</div></div>`));
  const syt = (f.sy&&f.sy.length) ? `<div class="syt"><div class="sh">부호</div>${f.sy.map(s=>`<div class="sr"><span class="s1">${tex(s[0],false)}${s[1]?`<small>«${esc(s[1])}»</small>`:''}</span><span class="s2">${esc(s[2]||'')}</span><span class="s3">${esc(s[3]&&s[3]!=='—'?s[3]:'')}</span></div>`).join('')}</div>` : '';
  const stt = st ? `<div class="st"><span>출제율 <b>${rateTxt(st)}</b> (${st.nr}/${I.total}문항)</span><span>회차 <b>${st.ss}</b>/${st.ssAll} (${st.spct.toFixed(0)}%)</span><span>최근 5년 <b>${st.r5}</b>문항</span>${st.last?`<span>최근 ${esc(pname(st.last))}</span>`:''}</div>` : '';
  const chips = opt.chips===false ? '' : `<div class="chips">${list.map(r=>`<button type="button" class="chip${String(r.id)===me?' me':''}" data-go="${esc(r.id)}" title="${esc(pnameLong(r)+(tyC(r)?' · '+tyC(r):''))}">${esc(pname(r))}</button>`).join('')||'<span class="fxemp">짝지어진 문항 없음</span>'}</div>`;
  const acts = [opt.unlink?`<button type="button" data-unlink="${esc(f.id)}" title="이 문제와 상관없는 공식이면 빼기">이 문제에서 빼기</button>`:'', f.user?`<button type="button" data-delfx="${esc(f.id)}">🗑 공식 지우기</button>`:''].filter(Boolean).join('');
  return `<details class="fxc${f.basic?' basic':''}${f.user?' user':''}${list.length?'':' zero'}" data-id="${esc(f.id)}"${openA?' open':''}>
    <summary><span class="car">▶</span><span class="nm">${esc(f.name)}${f.basic?'<small>기본식</small>':''}${f.user?'<small>내가 추가</small>':''}</span><span class="rt" title="진짜 기출 문항 중 이 공식을 쓰는 비율">${rateTxt(st)}</span><span class="ct" title="이 공식이 쓰인 문항 수">${list.length}문항</span></summary>
    <div class="eqs">${rows_.join('')}</div>
    ${syt}
    ${f.v?`<div class="v">※ ${esc(f.v)}</div>`:''}
    ${stt}
    ${chips}
    ${acts?`<div class="acts">${acts}</div>`:''}
  </details>`;
}
const match=(f,q)=>!q || (f.name+' '+f.cat+' '+(f.v||'')+' '+(f.ko||'')).toLowerCase().includes(q.toLowerCase());
function rowMatch(r,q){
  if(!q) return true;
  const m=q.replace(/\s/g,'').match(/^(\d{2,4})[-.년]?(\d)?회?[-.]?(\d{1,2})?번?$/);
  if(m){ const y=m[1].length===2?2000+(+m[1]):+m[1]; if(+r.year!==y) return false; if(m[2] && +r.session!==+m[2]) return false; if(m[3] && +r.no!==+m[3]) return false; return true; }
  return pname(r).includes(q) || tyC(r).includes(q);
}

/* 해설 기호식 → 내 공식으로 */
let SYMS=[];
const NOWOPEN=new Set(), SECOPEN={};   /* 이 문제 탭 — 기본은 접힘, 이번에 편 것만 기억 */
function addFromSym(i){
  const r=rowOf(viewId()); const line=SYMS[i]; if(!r || !line) return;
  const def=stepFor(r.easy_md,line) || '새 공식';
  const name=prompt('공식 이름 (나중에 공식별에서 찾을 이름)', def); if(name==null) return;
  const id='u'+Date.now().toString(36)+Math.random().toString(36).slice(2,5);
  U.items[id]={ id, name:(name.trim()||def), cat:CUSTOM_CAT, tex:line, ko:isKoLine(line)?'':koFor(r.easy_md,line), sy:symsFor(r.easy_md,line), t:Date.now() };
  U.links[String(r.id)+'|'+id]={ on:true, t:Date.now() };
  usave(); say(`📐 «${name.trim()||def}» 공식으로 추가 — 같은 식을 쓴 다른 문항에도 저절로 붙음`); paint(true);
}

let PSIG='';
function paint(force, focus, keepFocus){
  if(!isOpen()) return;
  const I=build(), me=viewId();
  if(me!==paint.__me){ paint.__me=me; NOWOPEN.clear(); }
  const sig=S.tab+'|'+me+'|'+Q+'|'+ISIG+'|'+S.cat+'|'+S.sort+'|'+S.ny+'|'+S.ns;
  if(!force && sig===PSIG) return; PSIG=sig;
  $$('.fxtabs [data-tab]',EL).forEach(b=>b.classList.toggle('on', b.dataset.tab===S.tab));
  const bar=$('.fxbar',EL), bd=$('.fxbd',EL), keep=bd.scrollTop;
  const qIn=`<input type="search" data-q placeholder="${S.tab==='n'?'번호 · 유형 찾기':'공식 이름 찾기'}" value="${esc(Q)}" aria-label="찾기">`;
  let h='', barH='', info='';
  if(S.tab==='now'){
    const r=rowOf(me);
    const ys=yearList(), y=r?String(r.year):'', ss=uniq(rows().filter(x=>String(x.year)===y).map(x=>String(x.session))).sort((a,b)=>+a-+b);
    const ns=r?rows().filter(x=>String(x.year)===y && String(x.session)===String(r.session)).map(x=>String(x.no)).sort((a,b)=>+a-+b):[];
    barH=`<select data-sel="vy" aria-label="연도">${opts(ys,y,v=>yfull(v))}</select><select data-sel="vs" aria-label="회차">${opts(ss,r?r.session:'',v=>`제${v}회`)}</select><select data-sel="vn" aria-label="번호">${opts(uniq(ns),r?r.no:'',v=>`${v}번`)}</select>`
       + (VIEW && VIEW!==curId() ? `<button type="button" class="bt" data-openv title="이 문항을 화면에 열기">↗ 열기</button><button type="button" class="bt" data-follow title="지금 보는 문항을 따라가기">📌 따라가기</button>` : '');
    if(!r){ h='<div class="fxemp">문항을 열면 그 문항에 쓰는 공식이 여기 나옵니다.</div>'; }
    else{
      const ids=(I.byRow.get(String(r.id))||[]).map(FB).filter(Boolean);
      const main=ids.filter(f=>!f.basic), base=ids.filter(f=>f.basic);
      h+=`<div class="fxnow"><b>${esc(pnameLong(r))}</b>${!VIEW||VIEW===curId()?'<span class="fol">지금 보는 문항</span>':''}</div>${tyC(r)?`<div class="fxty">유형 · ${esc(tyC(r))}</div>`:''}`;
      h+=`<div class="fxh">이 문제에 쓰는 공식 <small>정석식 · 말로 · 부호 · 출제율</small></div>`;
      h+= main.length ? main.map(f=>card(f,{open:NOWOPEN.has(f.id),chips:false,unlink:true})).join('') : '<div class="fxemp">딱 맞는 공식을 못 찾음 — 단답·서술형이거나 목록에 없는 식 (아래 «해설에 쓴 식» 에서 추가)</div>';
      if(base.length) h+=`<div class="fxh">기본식 <small>여러 문제에 두루 쓰임</small></div>`+base.map(f=>card(f,{open:NOWOPEN.has(f.id),chips:false,unlink:true})).join('');
      SYMS=symLines(r.easy_md);
      const all=ALL();
      if(SYMS.length){
        const nNew=SYMS.filter(l=>!symMatch(l, all)).length;
        h+=`<details class="fxsec" data-sec="sym"${SECOPEN.sym?' open':''}><summary class="fxh"><span class="car">▶</span>해설에 쓴 식 <small>${SYMS.length}개${nNew?` · 목록에 없는 식 ${nNew}개 (＋ 로 추가)`:''}</small></summary>`;
        h+=SYMS.map((l,i)=>{
          const kl=isKoLine(l), f=symMatch(l, all), linked=f && ids.some(x=>x.id===f.id), ko=kl?'':koFor(r.easy_md,l), stp=stepFor(r.easy_md,l);
          const ft = f ? (linked ? `<span>✓ «${esc(f.name)}» 와 같은 식</span>` : `<span>«${esc(f.name)}» 와 같은 식</span><button type="button" class="add" data-linksym="${esc(f.id)}">이 문제에 연결</button>`)
                       : `<button type="button" class="add" data-addsym="${i}">＋ 공식으로 추가</button>`;
          return `<div class="sym"><div class="eqr"><span class="k${kl?' ko':''}">${kl?'말로':'기호'}</span><div class="m">${tex(l,true)}</div></div>${ko?`<div class="eqr"><span class="k ko">말로</span><div class="m">${tex(ko,true)}</div></div>`:''}<div class="ft">${stp?`<span class="stp">${esc(stp)}</span>`:''}${ft}</div></div>`;
        }).join('');
        h+='</details>';
      }
      const have=new Set(ids.map(f=>f.id));
      const pickable=all.filter(f=>!have.has(f.id));
      h+=`<details class="fxsec" data-sec="lnk"${SECOPEN.lnk?' open':''}><summary class="fxh"><span class="car">▶</span>공식 직접 연결 <small>빠진 공식을 이 문제에 붙이기</small></summary><div class="lnk"><select aria-label="연결할 공식"><option value="">공식 고르기…</option>${uniq(pickable.map(f=>f.cat)).map(c=>`<optgroup label="${esc(c)}">${pickable.filter(f=>f.cat===c).map(f=>`<option value="${esc(f.id)}">${esc(f.name)}</option>`).join('')}</optgroup>`).join('')}</select><button type="button" data-linkpick>＋ 연결</button></div></details>`;
    }
  }else if(S.tab==='f'){
    const all=ALL(); const cats=uniq(all.map(f=>f.cat));
    barH=`<select data-sel="cat" aria-label="단원"><option value="">전체 단원</option>${opts(cats,S.cat)}</select><select data-sel="sort" aria-label="정렬"><option value="cat"${S.sort!=='rate'?' selected':''}>단원순</option><option value="rate"${S.sort==='rate'?' selected':''}>출제율순</option></select>${qIn}`;
    let fs=all.filter(f=>(!S.cat || f.cat===S.cat) && match(f,Q));
    if(S.sort==='rate'){
      fs=fs.slice().sort((a,b)=>((I.stat.get(b.id)||{}).nr||0)-((I.stat.get(a.id)||{}).nr||0));
      h=fs.map((f,i)=>card(f)).join('');
    }else{
      cats.forEach(c=>{ const g=fs.filter(f=>f.cat===c); if(!g.length) return;
        const tot=g.reduce((s,f)=>s+((I.stat.get(f.id)||{}).nr||0),0);
        h+=`<div class="cat">${esc(c)}<small>${g.length}개 · 문항 ${tot}</small></div>`+g.map(f=>card(f)).join(''); });
    }
    if(!fs.length) h='<div class="fxemp">찾는 공식이 없음</div>';
    info=`공식 ${fs.length}개`;
  }else{
    const ys=yearList(); if(S.ny && !ys.includes(S.ny)) S.ny='';
    const ss=S.ny?uniq(rows().filter(x=>String(x.year)===S.ny).map(x=>String(x.session))).sort((a,b)=>+a-+b):[];
    barH=`<select data-sel="ny" aria-label="연도"><option value="">전체 연도</option>${opts(ys,S.ny,v=>yfull(v))}</select>${S.ny?`<select data-sel="ns" aria-label="회차"><option value="">전체 회차</option>${opts(ss,S.ns,v=>`제${v}회`)}</select>`:''}${qIn}`;
    const R0=rows().slice().sort(I.ord).filter(r=>(!S.ny || String(r.year)===S.ny) && (!S.ns || String(r.session)===S.ns) && rowMatch(r,Q));
    let last='', shown=0;
    const cur=curId();
    R0.forEach(r=>{
      const ids=I.byRow.get(String(r.id))||[]; if(!ids.length && !Q && !S.ny) return;
      const k=r.year+'|'+r.session;
      if(k!==last){ if(last) h+='</div>'; last=k; h+=`<div class="sgrp"><div class="sess">${esc(`${yfull(r.year)} ${r.session}회`)}</div>`; }
      shown++;
      const fs=ids.map(FB).filter(Boolean).sort((a,b)=>(a.basic||0)-(b.basic||0));
      h+=`<div class="prow${String(r.id)===cur?' me':''}" data-row="${esc(r.id)}"><span class="no">${esc(r.no)}번</span><span class="fs">${fs.map(f=>`<span class="fn${f.basic?' b':''}" data-fx="${esc(f.id)}" title="공식별에서 보기">${esc(f.name)}</span>`).join('')||'<span class="fn" style="opacity:.6">공식 없음</span>'}${tyC(r)?`<span class="ty">${esc(tyC(r))}</span>`:''}</span></div>`;
    });
    if(last) h+='</div>';
    if(!shown) h='<div class="fxemp">해당 문항 없음</div>';
    info=`문항 ${shown}개`;
  }
  if(info) barH+=`<small>${esc(info)}</small>`;
  const ae=document.activeElement, hadQ=keepFocus && ae && ae.matches && ae.matches('input[data-q]'), pos=hadQ?ae.selectionStart:0;
  bar.innerHTML=barH;
  if(hadQ){ const n=$('input[data-q]',bar); if(n){ n.focus(); try{ n.setSelectionRange(pos,pos) }catch(e){ q_(e) } } }
  bd.innerHTML=h;
  if(focus){ const el=bd.querySelector(`.fxc[data-id="${CSS.escape(focus)}"]`); if(el){ el.open=true; el.scrollIntoView({block:'start'}); el.classList.add('hl'); } }
  else if(S.tab==='now' && force) bd.scrollTop=0;
  else bd.scrollTop=keep;
}

/* ══ ⑦ 단추 — 미니맵 옆 (한눈에 · 일반 보기 문제 칸 이름줄) ══ */
function mount(){
  $$('.mmb').forEach(mm=>{
    const lab=mm.parentElement; if(!lab || lab.querySelector(':scope > .fxb')) return;
    const b=document.createElement('button'); b.type='button'; b.className='fxb'+(isOpen()?' open':''); b.textContent='📐 공식';
    b.title='이 문제에 쓰는 공식 · 공식별 · 번호별 — 창을 띄운 채로 풀 수 있음';
    b.addEventListener('click', ev=>{ ev.preventDefault(); ev.stopPropagation();
      const c=b.closest('.pcard'); if(c) LASTCARD=String(c.dataset.id);
      VIEW='';
      if(isOpen()){ if(S.tab==='now' && LASTID===curId()) return close(); S.tab='now'; save(); paint(true); return; }
      S.tab='now'; open(); });
    mm.after(b);
  });
}
setInterval(()=>{ try{ mount();
  if(isOpen()){ const id=curId(); if(id!==LASTID){ LASTID=id; if(!VIEW) paint(true); else paint(); } pull().catch(q_); } }catch(e){ q_(e) } }, 700);
document.addEventListener('click', e=>{ const c=e.target.closest && e.target.closest('#list > .pcard[data-id]'); if(c) LASTCARD=String(c.dataset.id); }, true);
addEventListener('resize', ()=>{ try{ place() }catch(e){ q_(e) } });
document.addEventListener('visibilitychange', ()=>{ if(!document.hidden && isOpen()) pull(true).catch(q_); });
window.__pracFx={ open, close, lib:LIB, all:ALL, build, symLines, symMatch, nrm, nrmK, isKoEq, EQV, koFor, symsFor };
})();
