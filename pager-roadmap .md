# Pager — Build Roadmap

Order: Core loop → Landing page & UX → AI features → UI polish

---

## PHASE 1 — CORE FEATURE HARDENING

Goal: the money/escrow loop and basic app flow are bulletproof before anything else is built on top.

### 1.1 Smart contract fixes (contracts/PagerEscrow.sol)
- [x] Add `deadline` field to the `Bounty` struct (uint256, unix timestamp)
- [x] Add `refundExpired(uint256 bountyId)` — creator can reclaim funds if deadline passed and bounty still active
- [x] Add a reject path — creator can mark a bounty inactive without releasing funds — DONE: reject() added, does not touch bounty.active, bounty stays open
- [x] Add events: BountyCreated, BountyApproved, BountyRefunded, SubmissionRejected — all four added and emitted
- [x] Re-deploy contract to Monad testnet (scripts/deploy.js already exists — reuse it) — deployed at 0x2FA0964EdE9779B93ce111b275e7F492C263FfCe (current, as of this handoff)
- [x] Update src/lib/contracts.ts with new ESCROW_ADDRESS and updated ESCROW_ABI — done, reject() correctly placed in ESCROW_ABI (not ERC20_ABI — this was a real bug caught and fixed)

PHASE 1.1 IS FULLY COMPLETE.

### 1.2 API route consistency
- [ ] Verify frontend always calls on-chain approve before /api/submission/approve (already correct in SubmissionCard.tsx) — confirmed correct, no action needed
- [x] Add src/app/api/bounty/refund/route.ts — DB-side counterpart when refundExpired() is called on-chain
- [x] Add network-check guard to SubmissionCard.tsx's approve() — verifies chainId after switching
- [x] Fix /api/submission/approve to bulk-update ALL other pending submissions on the same bountyId to "rejected" when one is approved — DONE, uses Submission.updateMany()
- [x] Add "not selected" UI state in SubmissionCard.tsx so hunters who didn't win know their submission was passed over
- [x] Wallet connect bug — RESOLVED, but differently than originally scoped: root cause was NOT a missing multi-provider picker. Real causes were (a) Phantom extension actively intercepting window.ethereum even when MetaMask showed as connected — fixed by fully disabling Phantom extension, and (b) MetaMask's own active-account selector reverting to an old account after an extension restart — fixed by manually reselecting the correct account in MetaMask. A wallet-picker UI was still added to ConnectWallet.tsx as defensive code but was NOT the actual fix.
- [x] Added reject button to SubmissionCard.tsx, wired to on-chain reject() + new /api/submission/reject route

### 1.3 Data model additions
- [x] Bounty model: add deadline (Date), expand status enum to open | completed | expired | refunded — deadline is now persisted from the creation payload
- [x] Submission model: expand status enum to pending | approved | rejected

### 1.4 Core flow testing checklist
- [x] Create bounty end to end on Monad testnet, confirm USDC actually locks
- [x] Submit proof as a different wallet
- [x] Approve and confirm USDC actually arrives in hunter's wallet minus 2% fee
- [ ] Test reject/expire paths — reject() UI-tested and confirmed working; refund UI/route now exists but still needs fresh testnet validation
- [x] Add local PagerEscrow regression coverage for create, approve, reject, and refund paths — `test/PagerEscrow.js` (6 passing)
- [x] Test wrong-network handling on both create and approve flows

### 1.5 OPEN INVESTIGATION — approve succeeded but hunter wasn't paid
- [ ] UNRESOLVED as of this handoff: creator clicked Approve, MetaMask popped up, was confirmed — but the hunter's wallet did not receive USDC
- Next step was to check MetaMask's Activity tab for that specific transaction and determine: did it show CONFIRMED (green) or FAILED/reverted (red)?
- If FAILED: likely cause is the bounty had already been closed by a prior action (e.g. testing reject() or approve() earlier on the same bountyId, tripping the `require(bounty.active, "Inactive")` check) — check transaction revert reason on MonadScan
- If CONFIRMED but still no funds: something is wrong in the approveBounty() logic itself or the wrong hunter address was passed — needs direct contract read of that bounty's state on MonadScan
- THIS WAS NOT YET RESOLVED — pick this up first next session
- Approval UI now preserves the submitted transaction hash and distinguishes a confirmed on-chain transaction from a failed database sync; the specific transaction still requires its hash for diagnosis.

---

## PHASE 2 — LANDING PAGE & UX FLOW

Goal: someone who has never seen the app can land on it, understand what it is, connect a wallet, and use it without confusion.

### 2.1 Landing page
- [~] Hero section: what Pager is, one clear CTA — IN PROGRESS, started this session ("landing page,scroll," commit exists) — status/completeness not yet reviewed, check what was actually built
- [ ] How it works — 3 step visual (post bounty → local verifies → get paid)
- [ ] Live/sample bounty preview cards pulled from the real feed
- [ ] Footer: links, testnet disclaimer (funds are testnet USDC, not real money)

### 2.2 Onboarding flow
- [ ] First-time connect wallet → username prompt, confirm this is smooth
- [ ] Empty states: zero bounties nearby, zero submissions, zero profile activity
- [ ] Replace raw alert() network-switch messaging with a proper toast/modal

### 2.3 Core UX flows to smooth out
- [ ] Feed: loading state, error state (currently just console.log on failure)
- [ ] Map: same fix (BountyMap.tsx currently just logs "Failed to load bounties")
- [ ] Bounty creation form: inline validation instead of alert() popups
- [ ] Submission flow: clear steps for hunter end to end
- [ ] Approval flow: refine loading/success states on the existing confirm modal
- [ ] Mobile responsiveness pass — this is a walk-outside app, mobile is primary

### 2.4 Navigation & structure
- [ ] Confirm MenuBar nav covers all real routes (Feed, Map, Search, Profile, Create)
- [ ] Wallet connect state visible globally
- [ ] Dark/light mode toggle fully wired across all pages

---

## PHASE 3 — AI FEATURES

Goal: layer in intelligence on a stable core. Build in this order — each step unlocks the next.

### 3.1 Foundation: bounty categorization
- [ ] New src/lib/ai.ts — shared Anthropic API client wrapper
- [ ] Add category field to Bounty model (food | event | safety | lost-found | price-check | nightlife | other)
- [ ] Hook into /api/bounty/create — after saving, call Claude with the description, get category, update record
- [ ] Show category tag/badge in BountyFeed and BountyMap cards

### 3.2 Recommendation feed (Instagram-style interest matching)
- [ ] Add categoryInterests map to User model (simple counters per category)
- [ ] Increment score when user submits to or likes a category's bounty
- [ ] New route: /api/bounty/recommended — sorted by relevance blended with recency
- [ ] Update BountyFeed.tsx to use it
- [ ] "For You" vs "Nearby" vs "Recent" toggle

### 3.3 Proof verification
- [ ] New route: /api/ai/verify-submission — vision check, image vs bounty description
- [ ] Add aiMatchScore and aiReasoning fields to Submission model
- [ ] Hook into /api/submission/create — run right after a submission is saved
- [ ] Surface score/reasoning in SubmissionCard.tsx before creator approves

### 3.4 Fraud / AI-image detection
- [ ] Extend the verify-submission call to flag suspicious signals
- [ ] Add fraudFlag and fraudReason fields to Submission model
- [ ] Show warning badge on flagged submissions

### 3.5 Bounty quality check
- [ ] Extend ai.ts with a quality-check call
- [ ] Hook into CreateBounty.tsx client-side before transactions start
- [ ] Gentle suggestion UI, non-blocking

### 3.6 Real likes (currently a static placeholder "0")
- [ ] Add Like model or embedded array
- [ ] New route: /api/bounty/like
- [ ] Wire into the like button in SubmissionCard.tsx
- [ ] Feed likes into categoryInterests scoring from 3.2

---

## PHASE 4 — UI POLISH

- [ ] Replace all alert() calls with proper toast notifications
- [ ] Loading skeletons for Feed, Map, Profile
- [ ] Consistent empty states everywhere
- [ ] Animation/transition pass on cards, modals, page transitions
- [ ] Full mobile QA pass on an actual phone
- [ ] Accessibility pass — alt text, keyboard nav, dark mode contrast
- [ ] Iconography and spacing audit
- [ ] Final visual design pass — typography, color, spacing rhythm

---

## Sequencing notes

- Phase 1 must be solid before Phase 3 — AI features write to models/routes that need to be stable first
- Phase 2 and Phase 1 can overlap — UX polish on existing pages doesn't block contract work
- Within Phase 3, always do 3.1 first — everything else depends on or benefits from category data existing
- Phase 4 should genuinely be last — polishing UI that's about to change wastes rework
