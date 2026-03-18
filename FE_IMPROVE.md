# FE_IMPROVE.md — Dotix Frontend UI/UX Improvement Tickets

> **Evaluator Role**: Senior Product Designer
> **Date**: 2026-03-19
> **Scope**: 미적(Visual/Aesthetic) + 유저 편의성(UX/Usability) 전방위 평가
> **Benchmark**: Aave, Uniswap, Lido, Yearn, GMX 등 주요 DeFi 프로덕트와 비교

---

## Overall Assessment (총평)

### Strengths (잘 된 점)
- Space Grotesk + DM Sans 폰트 조합이 크립토/테크 무드에 적절함
- 모바일 bottom nav 패턴 채택은 올바른 선택
- glassmorphism-lite `.card` 스타일이 모던하고 깔끔함
- ConnectCTA의 3-step 온보딩 시각화가 직관적
- Stepper 컴포넌트의 워크플로우 시각화가 명확함
- skeleton loading 패턴이 전 페이지에 적용됨
- RainbowKit 기반 지갑 연결이 안정적

### Weaknesses (개선 필요)
- 색상 시스템이 "기업용 블루"에 가까워 Dotix 고유의 브랜드 아이덴티티가 약함
- 모든 섹션이 동일한 `.card` 스타일이라 시각적 위계(hierarchy)가 없음
- 대시보드가 데이터 나열 수준이고, 유저의 포지션/관심사를 반영하지 못함
- 트랜잭션 전후 피드백이 최소한이라 "내가 잘 한 건지" 불안함
- 다크 모드 일관성 결여
- 모바일에서 핵심 시각화(AllocationChart)가 숨겨짐

---

## Priority Levels
- **P0 (Critical)**: 데모/제출 전 반드시 수정. 심사위원이 즉시 알아차릴 수 있는 수준.
- **P1 (High)**: 제품 완성도를 크게 높임. 가능하면 수정.
- **P2 (Medium)**: 디테일 개선. 시간 여유 시 적용.
- **P3 (Low)**: 향후 개선. 해커톤 이후 적용 가능.

---

## Milestone A — Brand & Visual Identity (브랜드/시각 아이덴티티)

### FE-A1: 컬러 시스템 확장 및 브랜드 그라디언트 활용 [P1]

**현재 문제:**
- `ocean` (#0f7ad8) 단일 컬러가 프라이머리로 사용되어 범용적인 "기업 블루" 느낌
- 로고에 담긴 `navy → ocean → mint` 그라디언트가 UI에 전혀 반영되지 않음
- Aave(보라 그라디언트), Uniswap(핑크), Lido(블루+시안) 같은 차별적 브랜드 컬러가 없음

**개선안:**
1. 프라이머리 버튼/강조 요소에 `ocean → mint` 그라디언트 적용
   ```css
   .btn-primary { background: linear-gradient(135deg, #0f7ad8 0%, #20c997 100%); }
   ```
2. 색상 토큰 확장:
   - `ocean-light`: #3d9be5 (호버), `ocean-dark`: #0b65b3 (active)
   - `surface`: #f8fbff (라이트 카드 배경), `surface-dark`: #111827 (다크 카드)
   - `text-secondary`: #64748b → `text-muted`: #94a3b8 분리
3. 로고 그라디언트를 PageHeader, NavBar 하이라이트, ConnectCTA 버튼에 적용

**영향 파일:** `tailwind.config.ts`, `globals.css`, `TxButton.tsx`, `NavBar.tsx`

**AC:**
- [ ] 프라이머리 CTA에 그라디언트 적용됨
- [ ] 최소 2곳 이상에서 ocean→mint 그라디언트가 브랜드 시그니처로 사용됨
- [ ] 기존 `bg-ocean` 하드코딩을 디자인 토큰으로 전환

---

### FE-A2: 카드 위계(Card Hierarchy) 도입 [P1]

**현재 문제:**
- 모든 섹션이 동일한 `.card` 클래스로 동일 시각 처리됨
- KPI 카드, 에셋 행, 리밸런스 상태, 범례가 모두 같은 비중으로 보임
- Aave는 KPI를 강조 배경 위에 배치, Yearn은 primary/secondary/tertiary 카드를 구분

**개선안:**
1. `.card-hero`: 배경 그라디언트 + 더 큰 패딩 + 약간의 border-glow → KPI, 주요 수치용
2. `.card-default`: 현재 `.card` → 일반 정보 컨테이너
3. `.card-subtle`: 배경 투명 + 얇은 border → 보조 정보(범례, FAQ)
4. `.card-highlight`: ocean/mint 테두리 + 미세한 배경 틴트 → 활성 상태(Ready to rebalance 등)

**영향 파일:** `globals.css`, 모든 페이지

**AC:**
- [ ] 최소 3단계의 시각적 카드 위계가 구분됨
- [ ] KPI 카드가 일반 에셋 행보다 시각적으로 더 중요하게 보임
- [ ] 범례/FAQ 같은 보조 정보가 눈에 덜 띄게 처리됨

---

### FE-A3: 타이포그래피 역할 분리 [P2]

**현재 문제:**
- Space Grotesk과 DM Sans가 모두 `sans` 패밀리에 묶여 구분 없이 사용됨
- 숫자가 많은 DeFi 앱에서 tabular-nums가 일부에만 적용

**개선안:**
1. `font-display: "Space Grotesk"` → 제목, 네비게이션, 브랜드 텍스트
2. `font-body: "DM Sans"` → 본문, 설명, 레이블
3. `font-mono` 또는 tabular-nums → 모든 수치/금액/주소에 일괄 적용
4. 금액 표시에 큰 숫자 + 작은 소수점 패턴 (예: **1,234**<small>.5678</small>)

**영향 파일:** `tailwind.config.ts`, `globals.css`, 주요 페이지

**AC:**
- [ ] 타이틀과 본문에 서로 다른 폰트 패밀리 적용
- [ ] 모든 금액/수치에 tabular-nums 적용

---

### FE-A4: 다크 모드 일관성 확보 [P1]

**현재 문제:**
- `SwapPlanTable` 모바일 카드: `bg-white` 하드코딩 → 다크 모드에서 흰 박스가 뜸
- `Deposit` 페이지의 MAX 버튼: `bg-slate-100 text-slate-700` → 다크 모드 미대응
- `RebalanceStatus`: `bg-red-50/70` 텍스트 색상 → 다크 모드에서 가독성 저하
- `WeightBar` 텍스트: `text-slate-600` → 다크 배경에서 안 보임
- `ConnectCTA` 하단 스텝 카드: `bg-slate-50`, `text-ink` → 다크 모드 미대응

**개선안:**
- 위 항목들에 `dark:` 변형 일괄 추가
- 다크 모드 전용 QA 체크리스트 작성 후 모든 페이지 점검

**영향 파일:** `SwapPlanTable.tsx`, `deposit/page.tsx`, `RebalanceStatus.tsx`, `WeightBar.tsx`, `ConnectCTA.tsx`, `AssetRow.tsx`

**AC:**
- [ ] 다크 모드에서 흰 배경 하드코딩이 0건
- [ ] 모든 텍스트가 다크 배경 대비 4.5:1 이상 대비율 확보

---

## Milestone B — Dashboard UX (대시보드 개선)

### FE-B1: "My Position" 섹션 추가 [P0]

**현재 문제:**
- 대시보드에 유저의 PDOT 보유량, 그 가치, 전체 비중이 표시되지 않음
- 연결된 지갑 유저 입장에서 "내 돈이 얼마인지"가 한눈에 안 보임
- Aave, Yearn 모두 대시보드 최상단에 "Your Position" / "Your Deposits"가 있음

**개선안:**
- 대시보드 KPI 영역 위에 "My Position" 카드 추가:
  - My PDOT Balance: `xxx.xxxx PDOT`
  - My Value: `xxx.xxxx PAS` (= PDOT 수량 × PDOT Price)
  - Share of Vault: `xx.xx%` (= myPDOT / totalSupply × 100)
- `.card-hero` 스타일 적용으로 시각적 강조

**영향 파일:** `dashboard/page.tsx`, (PDOT 밸런스는 이미 `useRedeem`에서 읽고 있으므로 별도 hook 또는 기존 hook 확장)

**AC:**
- [ ] 지갑 연결 시 대시보드 최상단에 유저 PDOT 잔고 표시
- [ ] PDOT × Price = PAS 환산 가치 표시
- [ ] 지갑 미연결 시 해당 섹션 미표시

---

### FE-B2: AllocationChart 모바일 대응 [P0]

**현재 문제:**
- `AllocationChart`에 `hidden md:block` → 모바일에서 자산 배분 시각화가 완전히 사라짐
- DeFi 앱에서 포트폴리오 비중은 핵심 정보인데 모바일 유저가 볼 수 없음

**개선안:**
1. 모바일: 도넛 차트 대신 수평 stacked bar chart 또는 간소화된 미니 도넛
2. 또는 도넛을 더 작게 (h-28 w-28) 하여 범례와 세로 배치
3. 최소한: `hidden md:block` 제거하고 반응형으로 축소 표시

**영향 파일:** `AllocationChart.tsx`

**AC:**
- [ ] 모바일에서 자산 배분 시각화가 보임
- [ ] 모바일에서도 각 자산의 비중 %가 확인 가능

---

### FE-B3: KPI 카드에 유닛 라벨 강화 및 컨텍스트 추가 [P1]

**현재 문제:**
- NAV 카드: 숫자만 크게 + 작은 "PAS" 레이블 → 의미 전달 약함
- PDOT Price: "per PDOT"이라는 보조 텍스트가 유일한 설명
- 심사위원이 처음 보면 NAV가 뭔지, 왜 중요한지 알기 어려움
- 변화량(trend)이 없어 정적인 숫자 나열 느낌

**개선안:**
1. 각 KPI 카드에 아이콘 추가 (예: 금고=NAV, 동전=Price, 공급=Supply)
2. 보조 텍스트로 한 줄 설명 추가: "Total vault assets under management"
3. (선택) delta indicator: "since last rebalance" 기준 변화율 표시
4. 숫자 포맷: 큰 수치는 K/M 축약 + 툴팁에 정확한 값

**영향 파일:** `dashboard/page.tsx`

**AC:**
- [ ] 각 KPI 카드에 아이콘 또는 시각적 구분자 존재
- [ ] 비전문가도 각 수치의 의미를 이해할 수 있는 보조 텍스트 존재

---

### FE-B4: 에셋 행(AssetRow)에 토큰 아이콘/아바타 추가 [P2]

**현재 문제:**
- 에셋 이름이 텍스트("TOKEN_A")와 축약 주소로만 표시
- 시각적 구분이 어려움 — 모든 에셋 행이 동일하게 보임
- Uniswap, Aave 등은 토큰 아이콘이 시각적 앵커 역할

**개선안:**
1. 토큰 심볼 첫 글자 기반 컬러 아바타 (예: 동그라미 안에 "A", AllocationChart 색상 일치)
2. 또는 generative avatar (jazzicon 스타일, 주소 기반)
3. 에셋 행 좌측에 32×32 아바타 배치

**영향 파일:** `AssetRow.tsx`, 새 컴포넌트 `TokenAvatar.tsx`

**AC:**
- [ ] 각 에셋 행에 시각적으로 구분 가능한 토큰 아바타 존재
- [ ] AllocationChart 범례와 에셋 행의 색상이 일치

---

### FE-B5: Weight Deviation 범례를 인라인으로 통합 [P2]

**현재 문제:**
- Weight Deviation Legend가 별도 카드로 분리되어 있어 WeightBar와 시각적으로 떨어져 있음
- 유저가 WeightBar를 보면서 색상 의미를 파악하려면 스크롤해서 범례를 찾아야 함

**개선안:**
1. 범례를 WeightBar 첫 등장 직전에 한 줄 인라인으로 표시
2. 또는 WeightBar에 호버 시 툴팁으로 "deviation 3.2% (good)" 형태로 표시
3. 별도 범례 카드 제거

**영향 파일:** `dashboard/page.tsx`, `WeightBar.tsx`

**AC:**
- [ ] 범례가 WeightBar 가까이에 인라인으로 통합됨
- [ ] 독립 범례 카드 제거 또는 축소

---

## Milestone C — Deposit/Redeem UX (입출금 개선)

### FE-C1: 트랜잭션 프리뷰 요약(Summary) 추가 [P0]

**현재 문제:**
- Deposit 버튼 클릭 전에 "내가 얼마를 넣고 → 몇 PDOT을 받는지"가 작은 텍스트로만 표시
- 슬리피지 반영된 최종 결과가 시각적으로 강조되지 않음
- Uniswap은 스왑 전에 명확한 summary panel을 보여줌

**개선안:**
1. 금액 입력 후 하단에 `.card-highlight` 스타일의 요약 패널 표시:
   ```
   ┌─ Transaction Preview ──────────────────┐
   │ You deposit:    100.0000 PAS            │
   │ You receive:   ~99.5000 PDOT            │
   │ Min received:   99.0050 PDOT (0.5%)     │
   │ Exchange rate:   1 PAS = 0.995 PDOT     │
   └─────────────────────────────────────────┘
   ```
2. Redeem도 동일 패턴:
   ```
   You burn:       50.0000 PDOT
   You receive:   ~50.2500 PAS
   Min received:   49.9988 PAS (0.5%)
   ```

**영향 파일:** `deposit/page.tsx`

**AC:**
- [ ] 금액 입력 시 요약 패널이 동적으로 표시
- [ ] 슬리피지 반영된 최소 수량이 명확히 표시
- [ ] 금액이 0이거나 비어있으면 요약 미표시

---

### FE-C2: Approve → Deposit 2단계 진행 표시 [P1]

**현재 문제:**
- ERC-20 approve가 필요한 경우 "Approve" 버튼만 보이고, approve 성공 후 "Deposit" 버튼으로 바뀜
- 유저 입장에서 "왜 2번 서명해야 하는지", "지금 어디까지 진행됐는지" 불명확
- MetaMask 초보 유저에게 approval concept 자체가 낯설음

**개선안:**
1. 인라인 2-step indicator:
   ```
   [1. Approve ✓] ──── [2. Deposit ●]
   ```
2. Approve 완료 시 체크마크 + "Allowance set" 피드백
3. 첫 번째 단계에서 "Why do I need to approve?" 토글 설명 추가
4. Approve가 불필요한 경우(이미 충분한 allowance) 바로 Deposit 표시

**영향 파일:** `deposit/page.tsx`, (선택) 새 컴포넌트 `TxSteps.tsx`

**AC:**
- [ ] 2단계 프로세스가 시각적으로 표시됨
- [ ] Approve 완료 시 명확한 성공 피드백
- [ ] "Why approve?" 설명이 접근 가능

---

### FE-C3: 성공 상태(Success State) 강화 [P1]

**현재 문제:**
- Deposit/Redeem 완료 시 `TxStatus`에 "Confirmed!" + Blockscout 링크가 전부
- "내 잔고가 실제로 바뀌었다"는 확인이 없어 불안감 존재
- 성공 후 다음 행동(대시보드 확인, 추가 입금 등) 유도가 없음

**개선안:**
1. 성공 시 인라인 success panel:
   ```
   ✓ Deposit successful!
   +99.5 PDOT added to your balance
   New PDOT balance: 199.5 PDOT
   [View on Explorer] [Go to Dashboard] [Deposit More]
   ```
2. Toast도 유지하되, 인라인 피드백이 primary
3. 입력 필드를 초기화하고 성공 메시지 표시

**영향 파일:** `deposit/page.tsx`, `TxStatus.tsx`

**AC:**
- [ ] 성공 시 잔고 변화량이 표시됨
- [ ] 다음 행동 유도 버튼 존재

---

### FE-C4: 페이지 타이틀과 레이아웃 정합성 [P2]

**현재 문제:**
- 페이지 타이틀이 "Deposit"인데 실제로는 Deposit + Redeem 양쪽 다 있음
- PageHeader 설명도 두 기능을 한 줄에 압축

**개선안:**
1. 페이지 타이틀: "Deposit & Redeem" 또는 "Vault"로 변경
2. 또는 탭 UI로 분리: `[Deposit] [Redeem]` 탭 → 한 번에 하나만 표시
3. 모바일에서 2-column이 세로로 쌓이는데, Deposit이 항상 먼저 보이게 유지

**영향 파일:** `deposit/page.tsx`

**AC:**
- [ ] 페이지 타이틀이 실제 기능 범위를 정확히 반영

---

### FE-C5: 슬리피지 UX를 Redeem에도 적용 [P2]

**현재 문제:**
- Deposit에만 슬리피지 프리셋(0.1%, 0.5%, 1.0%, Custom)이 있고 Redeem에는 없음
- `useRedeem`에서 `slippagePct`을 받고 있으므로 로직은 이미 있으나 UI만 없음

**개선안:**
- Redeem 카드에도 동일한 슬리피지 UI 추가
- 또는 공통 `SlippageSelector` 컴포넌트로 분리하여 양쪽에서 재사용

**영향 파일:** `deposit/page.tsx`, (선택) 새 컴포넌트 `SlippageSelector.tsx`

**AC:**
- [ ] Redeem에도 슬리피지 설정 UI 존재
- [ ] Deposit과 동일한 프리셋 옵션 제공

---

## Milestone D — Autopilot UX (오토파일럿 개선)

### FE-D1: 현재 vs 제안 가중치 비교 시각화 [P1]

**현재 문제:**
- "Proposed Target Weights" 섹션에 제안 가중치만 주소+bps로 표시
- 현재 가중치와의 비교가 없어 "무엇이 얼마나 바뀌는지" 직관적이지 않음

**개선안:**
1. 비교 테이블:
   ```
   Asset   | Current | Proposed | Delta
   TOKEN_A | 33.20%  | 36.50%   | +3.30%  ▲
   TOKEN_B | 66.80%  | 63.50%   | -3.30%  ▼
   ```
2. 또는 나란히 놓인 2개의 미니 도넛 차트 (Current / Proposed)
3. Delta에 색상 코딩: 증가=mint, 감소=warning

**영향 파일:** `autopilot/page.tsx`, `useVaultState` (현재 가중치 읽기), `useAgentPlan`

**AC:**
- [ ] 현재 가중치와 제안 가중치가 나란히 비교됨
- [ ] 변화량(delta)이 색상으로 구분됨
- [ ] 토큰 주소 대신 심볼로 표시 (TokenRegistry 활용)

---

### FE-D2: Plan Source를 유저 친화적으로 변경 [P2]

**현재 문제:**
- "Latest plan file: agent-plan-20260319.json" 식의 파일 경로가 표시됨
- 일반 유저나 심사위원에게 의미 없는 정보

**개선안:**
1. 파일명 대신: "Plan generated at 14:32 (2 minutes ago)" 형태의 타임스탬프
2. 플랜의 요약 정보: "Rebalance 2 assets, 3 swaps planned"
3. 파일 경로는 개발자 모드/디버그 토글 뒤로 숨김

**영향 파일:** `autopilot/page.tsx`, `useAgentPlan.ts`

**AC:**
- [ ] Plan Source에 사람이 읽을 수 있는 요약 표시
- [ ] 기술적 파일 경로는 기본적으로 숨겨짐

---

### FE-D3: Explanation Panel 디자인 강화 [P2]

**현재 문제:**
- ExplanationPanel이 단순 `<ol>` 텍스트 리스트
- 에이전트의 "생각 과정"이 주요 셀링포인트인데 시각적으로 평범함

**개선안:**
1. 각 설명 라인에 아이콘 분류:
   - "유동성 분석" → 차트 아이콘
   - "거래 제한" → 방패 아이콘
   - "슬리피지 예측" → 퍼센트 아이콘
2. 연한 배경 + 좌측 ocean 테두리로 "AI 분석 결과" 느낌
3. "Agent Decision Trace" 같은 제목으로 기술적 차별화 강조

**영향 파일:** `ExplanationPanel.tsx`

**AC:**
- [ ] 설명 패널이 시각적으로 차별화되어 "자동 분석 결과"임이 명확
- [ ] 각 항목에 분류 아이콘 또는 색상 태그 존재

---

## Milestone E — XCM Demo UX

### FE-E1: XCM 페이지 단계별 가이드 추가 [P1]

**현재 문제:**
- "Weigh"와 "Execute" 버튼이 나란히 있는데 순서/관계가 불명확
- 심사위원이 XCM에 익숙하지 않을 수 있음 → "뭘 먼저 눌러야 하지?"
- Default message `0x03020100`의 의미가 설명되지 않음

**개선안:**
1. Stepper (Autopilot과 동일 패턴) 적용:
   ```
   [1. Choose Message] → [2. Weigh] → [3. Execute]
   ```
2. Default message 옆에 "XCM ClearOrigin instruction (safe no-op for demo)" 설명
3. Weigh 결과가 나온 후에만 Execute 활성화 (이미 `disabled={!xcm.result}`이지만 시각적 강조 필요)

**영향 파일:** `xcm/page.tsx`

**AC:**
- [ ] 3단계 흐름이 시각적으로 표시됨
- [ ] Default message의 의미가 설명됨
- [ ] 비전문가도 순서대로 따라할 수 있음

---

### FE-E2: XCM 결과 시각화 개선 [P2]

**현재 문제:**
- refTime과 proofSize가 숫자만 표시됨
- 심사위원에게 "이게 왜 중요한지"가 전달되지 않음

**개선안:**
1. 결과를 structured card로 표시:
   ```
   ┌─ Weigh Result ─────────────────────┐
   │ Ref Time:    1,234,567             │
   │ Proof Size:    65,536              │
   │                                     │
   │ ℹ These values represent the        │
   │   computational cost of executing   │
   │   this XCM message on-chain.        │
   └─────────────────────────────────────┘
   ```
2. 숫자에 천 단위 구분자 추가
3. 성공 시 체크 애니메이션 + 초록 배경 전환

**영향 파일:** `XcmResult.tsx`

**AC:**
- [ ] 결과 수치에 천 단위 구분자 적용
- [ ] 결과의 의미를 설명하는 보조 텍스트 존재

---

## Milestone F — Navigation & Layout (네비게이션/레이아웃)

### FE-F1: 모바일 하단 네비게이션 개선 [P1]

**현재 문제:**
- 하단 nav가 콘텐츠를 가림 → `pb-28`로 보정하지만, 스크롤 끝에서 콘텐츠와 nav가 겹칠 수 있음
- 4개 항목이 동일 크기로 나열 → 현재 페이지 외에는 시각적 구분 약함
- "XCM Demo" 텍스트가 11px로 매우 작아 읽기 어려움

**개선안:**
1. Safe area 대응: `pb-[env(safe-area-inset-bottom)]` 추가 (iOS notch 대응)
2. 활성 탭에 상단 인디케이터 도트 또는 ocean 언더라인 추가
3. 아이콘 크기를 4→5로 약간 키움
4. 레이블 축약: "XCM Demo" → "XCM"

**영향 파일:** `NavBar.tsx`, `AppShellClient.tsx`

**AC:**
- [ ] iOS safe area 대응됨
- [ ] 활성 탭이 색상 외에 추가 시각 인디케이터로 구분됨

---

### FE-F2: 데스크톱 NavBar에 활성 경로 인디케이터 강화 [P2]

**현재 문제:**
- 활성 링크: `bg-ocean text-white` → 충분히 구분되지만 "현재 어디있는지" 외에 흐름 안내 없음
- 네비게이션 순서가 논리적 흐름(Dashboard → Deposit → Autopilot → XCM)인데 이게 시각적으로 표현되지 않음

**개선안:**
1. 활성 링크 하단에 2px ocean 라인 추가 (배경색 제거, 선으로 변경)
2. 또는 pill 형태 유지하되, 비활성 항목에 번호 뱃지 표시: "1 Dashboard | 2 Deposit | 3 Autopilot | 4 XCM"
3. (선택) 링크 사이에 얇은 chevron `>` 으로 흐름 암시

**영향 파일:** `NavBar.tsx`

**AC:**
- [ ] 활성 경로가 더 명확히 구분됨

---

## Milestone G — Micro-interactions & Polish (마이크로인터랙션/폴리시)

### FE-G1: 버튼 로딩 스피너 및 상태 피드백 개선 [P1]

**현재 문제:**
- TxButton의 로딩 상태: 텍스트만 "Processing..."으로 변경
- 시각적 스피너(spinner)가 없어 "진짜 처리 중인지" 확인 어려움
- 다른 DeFi 앱들은 버튼 내부에 spinning circle이 있음

**개선안:**
1. "Processing..." 좌측에 SVG 스피너 아이콘 추가
2. 버튼 배경을 약간 어둡게 + 미세한 pulse 애니메이션
3. disabled 상태의 opacity를 0.6 → 0.5로 더 확실히 비활성화 표현

**영향 파일:** `TxButton.tsx`

**AC:**
- [ ] 로딩 중 시각적 스피너 표시
- [ ] 로딩 상태가 비로딩 상태와 즉각 구분됨

---

### FE-G2: 숫자 애니메이션 (Count-up) [P3]

**현재 문제:**
- NAV, PDOT Price 등 KPI 수치가 데이터 로드 시 "뿅" 하고 나타남
- 값이 업데이트될 때도 그냥 교체됨

**개선안:**
1. 숫자 표시에 count-up 애니메이션 (requestAnimationFrame 기반)
2. 값 변경 시 잠깐 flash 효과 (배경 mint → 투명)
3. 라이브러리 없이 가벼운 커스텀 hook으로 구현 가능

**영향 파일:** `dashboard/page.tsx`, 새 hook `useCountUp.ts`

**AC:**
- [ ] KPI 수치가 0에서 목표 값으로 애니메이션됨
- [ ] 값 갱신 시 시각적 flash 피드백

---

### FE-G3: 빈 상태(Empty State) 일러스트 [P2]

**현재 문제:**
- "No assets configured in vault." → 텍스트만 표시
- "No swaps proposed." → 텍스트만 표시
- "No targets available." → 텍스트만 표시
- 빈 상태가 "에러"처럼 보이거나 페이지가 깨진 것처럼 느껴질 수 있음

**개선안:**
1. 각 빈 상태에 간단한 SVG 일러스트레이션 + 친근한 메시지
   - 에셋 없음: 빈 금고 아이콘 + "No assets in the vault yet."
   - 스왑 없음: 화살표 아이콘 + "Generate a plan to see swap proposals."
   - 타겟 없음: 과녁 아이콘 + "Targets will appear after plan generation."
2. 일러스트는 ocean/mint 컬러의 간단한 line icon으로 통일

**영향 파일:** `dashboard/page.tsx`, `autopilot/page.tsx`, `SwapPlanTable.tsx`

**AC:**
- [ ] 모든 빈 상태에 일러스트 + 안내 메시지 존재
- [ ] 빈 상태가 "다음 행동"을 암시

---

### FE-G4: 툴팁 시스템 도입 [P2]

**현재 문제:**
- DeFi 용어(NAV, BPS, Slippage, Cooldown, KEEPER_ROLE 등)가 설명 없이 사용됨
- 심사위원이나 DeFi 초보 유저가 용어를 모를 수 있음

**개선안:**
1. 점선 밑줄 텍스트 + 호버 시 툴팁으로 설명:
   - NAV: "Net Asset Value — the total value of all assets in the vault"
   - Cooldown: "Minimum waiting time between rebalance executions"
   - BPS: "Basis points — 100 bps = 1%"
2. 가벼운 커스텀 `Tooltip` 컴포넌트 (title attribute 대신 커스텀 팝오버)

**영향 파일:** 새 컴포넌트 `Tooltip.tsx`, 주요 페이지

**AC:**
- [ ] 최소 5개 이상의 DeFi 용어에 툴팁 제공
- [ ] 툴팁이 모바일에서도 탭으로 접근 가능

---

## Milestone H — Accessibility & Performance (접근성/성능)

### FE-H1: 포커스 관리 및 키보드 네비게이션 [P2]

**현재 문제:**
- ConfirmModal이 열릴 때 포커스가 모달 안으로 트랩되지 않음 → Tab으로 모달 뒤 요소에 접근 가능
- Toast가 스크린리더에 공지되지 않음 (aria-live 없음)

**개선안:**
1. ConfirmModal에 focus trap 추가 (첫/마지막 포커스 가능 요소 간 순환)
2. Toast 컨테이너에 `aria-live="polite"` + `role="status"` 추가
3. 모든 인터랙티브 요소에 명확한 포커스 링 확보 (이미 focus-visible은 적용 중)

**영향 파일:** `ConfirmModal.tsx`, `ToastProvider.tsx`

**AC:**
- [ ] Modal 열렸을 때 Tab이 모달 내에서만 순환
- [ ] Toast가 스크린리더에 읽힘

---

### FE-H2: Skeleton 로딩의 다크 모드 대응 [P2]

**현재 문제:**
- 모든 skeleton에 `bg-slate-200` → 다크 모드에서 밝은 회색 블록이 어두운 배경 위에 떠서 어색함

**개선안:**
- skeleton 색상을 `bg-slate-200 dark:bg-slate-700`로 변경 (전체 일괄)

**영향 파일:** `dashboard/page.tsx`, `deposit/page.tsx`, `autopilot/page.tsx`

**AC:**
- [ ] 다크 모드에서 skeleton이 자연스러움

---

## Summary (요약 테이블)

| ID | Title | Priority | Category |
|----|-------|----------|----------|
| FE-A1 | 컬러 시스템 확장 + 브랜드 그라디언트 | P1 | Visual |
| FE-A2 | 카드 위계(Hierarchy) 도입 | P1 | Visual |
| FE-A3 | 타이포그래피 역할 분리 | P2 | Visual |
| FE-A4 | 다크 모드 일관성 확보 | P1 | Visual |
| FE-B1 | "My Position" 섹션 추가 | P0 | Dashboard |
| FE-B2 | AllocationChart 모바일 대응 | P0 | Dashboard |
| FE-B3 | KPI 카드 유닛/컨텍스트 강화 | P1 | Dashboard |
| FE-B4 | 토큰 아이콘/아바타 추가 | P2 | Dashboard |
| FE-B5 | Weight Deviation 범례 인라인 통합 | P2 | Dashboard |
| FE-C1 | 트랜잭션 프리뷰 요약 패널 | P0 | Deposit |
| FE-C2 | Approve→Deposit 2단계 진행 표시 | P1 | Deposit |
| FE-C3 | 성공 상태(Success State) 강화 | P1 | Deposit |
| FE-C4 | 페이지 타이틀/레이아웃 정합성 | P2 | Deposit |
| FE-C5 | 슬리피지 UX를 Redeem에도 적용 | P2 | Deposit |
| FE-D1 | 현재 vs 제안 가중치 비교 시각화 | P1 | Autopilot |
| FE-D2 | Plan Source 유저 친화적 변경 | P2 | Autopilot |
| FE-D3 | Explanation Panel 디자인 강화 | P2 | Autopilot |
| FE-E1 | XCM 단계별 가이드 추가 | P1 | XCM |
| FE-E2 | XCM 결과 시각화 개선 | P2 | XCM |
| FE-F1 | 모바일 하단 네비게이션 개선 | P1 | Layout |
| FE-F2 | 데스크톱 NavBar 인디케이터 강화 | P2 | Layout |
| FE-G1 | 버튼 로딩 스피너 추가 | P1 | Polish |
| FE-G2 | 숫자 애니메이션 (Count-up) | P3 | Polish |
| FE-G3 | 빈 상태(Empty State) 일러스트 | P2 | Polish |
| FE-G4 | 툴팁 시스템 도입 | P2 | Polish |
| FE-H1 | 포커스 관리 + 키보드 네비게이션 | P2 | A11y |
| FE-H2 | Skeleton 다크 모드 대응 | P2 | A11y |

---

## Recommended Execution Order (데모 제출 전 우선순위)

**Round 1 (P0 — must-do):**
1. FE-B1: My Position 섹션
2. FE-B2: AllocationChart 모바일
3. FE-C1: 트랜잭션 프리뷰

**Round 2 (P1 — high impact):**
4. FE-A1: 브랜드 컬러/그라디언트
5. FE-A2: 카드 위계
6. FE-A4: 다크 모드 수정
7. FE-G1: 버튼 스피너
8. FE-C2: Approve 2단계
9. FE-C3: 성공 상태
10. FE-B3: KPI 컨텍스트
11. FE-D1: 가중치 비교
12. FE-E1: XCM 가이드
13. FE-F1: 모바일 nav

**Round 3 (P2 — polish):**
14~25. 나머지 P2 티켓들

**Round 4 (P3 — nice-to-have):**
26. FE-G2: 숫자 애니메이션
