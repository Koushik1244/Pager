# Pager — Product Requirements Document

## 1. Overview

**Pager** is a location-based bounty platform. A creator posts a task tied to a physical location and locks a USDC reward in escrow. A hunter who is physically at that location completes the task, captures live camera proof, and submits it. The creator reviews and approves the best submission, releasing the funds on-chain.

The core idea: **verified local presence, paid instantly, trustlessly.** No middleman holds the money — a smart contract does.

## 2. Problem statement

Getting real-time, on-the-ground information or small local tasks done (checking if a place is crowded, verifying an event is happening, confirming a price, finding something specific) is hard to incentivize casually. Existing tools either have no payment layer, no location verification, or no proof of authenticity. Pager combines all three.

## 3. Target users

- **Creators** — anyone who wants a small, location-specific task done and is willing to pay for verified proof. Examples: "is this restaurant crowded right now," "is the ATM at this address working," "find this lost item near this park."
- **Hunters** — anyone nearby willing to complete small tasks for USDC. Likely students, gig-economy-minded users, or crypto-native users already comfortable with a wallet.

## 4. Core user flows

### 4.1 Creator flow
1. Connect wallet
2. Create a bounty: description, reward amount (USDC), location (map pin), deadline (1 hour to 7 days)
3. Approve USDC spend, confirm on-chain — funds lock in escrow
4. Review incoming submissions
5. Approve the best one (funds release to that hunter, minus 2% platform fee) OR reject a bad submission (bounty stays open) OR let it expire and reclaim funds if nothing comes in

### 4.2 Hunter flow
1. Connect wallet
2. Browse/discover a nearby bounty (feed or map)
3. Physically travel to the location
4. App verifies GPS proximity to the bounty's pinned location
5. Camera opens (live capture only — no gallery upload, to prevent submitting old/fake photos)
6. Capture proof, write a short description, submit
7. Wait for creator's decision — approved (paid) or rejected (can try again or move on) or bounty expires

## 5. Core requirements

### 5.1 Must-have (core loop)
- Wallet-based auth (MetaMask, EVM-compatible)
- On-chain escrow: lock funds at creation, release on approval, refund on expiry
- Location-gated, camera-only submission (no gallery picker)
- Multiple hunters can submit to one bounty; only one submission can ever be paid (fixed reward pool)
- When one submission is approved, all other pending submissions on that bounty are automatically closed out
- Creator can explicitly reject a bad submission without losing funds; bounty stays open for other attempts until deadline
- Feed and map views of open bounties

### 5.2 Should-have (near-term)
- AI-assisted proof verification — vision check comparing submitted photo against bounty description, shown to creator as a confidence signal (not a decision-maker)
- Fraud/AI-image detection on submissions
- Bounty category auto-tagging (food, event, safety, lost-found, price-check, nightlife, other)
- Personalized/recommended feed based on a user's submission and interaction history, similar to how a social app ranks content by inferred interest
- Real like/engagement functionality on submissions

### 5.3 Nice-to-have (later)
- Bounty quality suggestions at creation time (nudge vague descriptions to be more specific)
- Push notifications for nearby bounties or status changes
- Multi-chain support beyond Monad

## 6. Non-goals (explicitly out of scope for now)
- Real-money (mainnet) transactions — this is a testnet product until explicitly decided otherwise
- Dispute arbitration beyond creator reject/approve (no third-party moderation queue)
- In-app messaging between creator and hunter
- Support for wallets beyond EVM-compatible browser extensions

## 7. Success criteria

- A creator can post, fund, and resolve a bounty end-to-end without confusion
- A hunter cannot submit fraudulent proof by uploading an old photo or spoofing location
- No situation where funds are stuck, double-paid, or paid to the wrong person
- The app is usable and clear on mobile, since hunters are physically walking around outdoors

## 8. Key risks

- **Location spoofing** — browser Geolocation API can theoretically be spoofed by a sufficiently motivated user; camera-only capture and short deadlines mitigate but don't eliminate this
- **Low liquidity of hunters** — the platform only works if there are enough people nearby willing to complete tasks; early growth/cold-start risk
- **Smart contract risk** — funds are held in a single escrow contract; a bug there is a direct financial risk. No formal audit has been done; this is acceptable for a testnet/college project but would need addressing before any real-money launch
