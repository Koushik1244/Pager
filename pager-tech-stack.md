# Pager — Tech Stack

## Frontend

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 16 (App Router) | React 19, server + client components |
| Language | TypeScript | Throughout the codebase |
| Styling | Tailwind CSS 3 | Utility-first |
| Icons | react-icons | |
| Maps | Mapbox GL JS | Bounty location picker, map view, feed previews |
| HTTP client | Axios | Used for all internal API calls from client components |

## Backend

| Layer | Choice | Notes |
|---|---|---|
| API layer | Next.js API routes (App Router `route.ts` files) | No separate backend server — API and frontend live in one Next.js app |
| Database | MongoDB Atlas | Free/Flex tier cluster, own account (not shared with collaborators) |
| ODM | Mongoose | Schema definitions for User, Bounty, Submission |
| Media storage | Cloudinary | Photo/video proof uploads, via `next-cloudinary` |

## Blockchain / Web3

| Layer | Choice | Notes |
|---|---|---|
| Chain | Monad Testnet | Chain ID 10143, EVM-compatible |
| Smart contract language | Solidity ^0.8.20 | `PagerEscrow.sol` |
| Contract dev framework | Hardhat | Compile, test, deploy |
| Client-side chain library | ethers.js v6 | Wallet connection, contract calls, signing |
| Wallet | MetaMask (browser extension) | EVM-compatible; Phantom found to conflict, currently disabled during dev |
| Escrow currency | Testnet USDC (Circle-issued) | Real Circle testnet token, not a custom mock — faucet: faucet.circle.com |
| Gas currency | MON (testnet) | Faucet: faucet.monad.xyz |

### Smart contract summary (`PagerEscrow.sol`)

Functions:
- `createBounty(uint256 amount, uint256 deadline)` — locks USDC in escrow, deadline must be 1 hour–7 days out
- `approveBounty(uint256 bountyId, address hunter)` — releases funds to hunter minus 2% platform fee
- `refundExpired(uint256 bountyId)` — creator reclaims funds if bounty expired unclaimed
- `reject(uint256 bountyId, address hunter)` — creator signals a submission is rejected; does not move funds or close the bounty

Events: `BountyCreated`, `BountyApproved`, `BountyRefunded`, `SubmissionRejected`

## AI (planned, Phase 3)

| Layer | Choice | Notes |
|---|---|---|
| Model provider | Anthropic API (Claude) | Vision-capable model for proof verification |
| Use cases | Bounty categorization, proof verification, fraud/AI-image flagging, bounty quality suggestions | See PRD section 5.2 |

## Dev tooling

| Tool | Role |
|---|---|
| GitHub Copilot | Primary code-writing agent — executes scoped, one-at-a-time prompts |
| Claude | Planning, architecture, debugging, prompt authoring for Copilot |
| 21st.dev | UI component generation, used for design/polish pass |
| Git / GitHub | Version control — repo: github.com/Koushik1244/Pager |
| MONSKILLS (devnads.com) | Community Monad developer skill set, installed for reference |

## Environment / infrastructure

| Concern | Current setup |
|---|---|
| Local dev | `npm run dev`, localhost:3000 |
| Environment variables | `.env.local` (gitignored) — `MONGODB_URI`, Cloudinary keys, Mapbox token |
| Deployment target | Not yet deployed — local dev only as of this document |
| Contract deployment | Manual via `npx hardhat run scripts/deploy.js --network monadTestnet` |

## Known constraints and decisions

- **No email/password auth** — wallet address is the sole identity. An old unique index on a now-unused `email` field in MongoDB caused real bugs and was removed; don't reintroduce email-based fields without care.
- **Camera-only submission, no gallery upload** — a deliberate anti-fraud decision, not a missing feature. Combined with GPS-proximity gating at submission time.
- **One reward pool per bounty** — multiple hunters can submit, only one can ever be paid, since the escrowed amount is fixed at creation. This is enforced by the contract design (`approveBounty` takes a specific winning `hunter` address) and mirrored in the database logic (bulk-reject of other pending submissions on approval).
- **Testnet only, for now** — real-money mainnet deployment is explicitly out of scope until a decision is made (see PRD non-goals). No smart contract audit has been performed.
