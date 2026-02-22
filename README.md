# Pager – Location‑Based Bounty & Verification DApp

Pager is a **location‑based bounty network** where anyone can post a crypto reward to verify real‑world events, and local users earn by providing on‑the‑ground proof.

Think:  
> “I heard a building collapsed in NYC, is it true? Show me.”  
> “Is that rockstar actually performing at this venue right now?”  
> “Is the vadapav guy still at the same corner in Vapi?”

Remote users post a **bounty + question + location**; locals nearby respond with **text + photos/videos + GPS proof** and get paid in **USDC on Monad testnet** when the bounty creator accepts their answer.[web:131][web:137]  

---

## ✨ Features

- **Location‑based bounties**
  - Create bounties pinned to a specific GPS location.
  - Set reward amount (e.g., 5 USDC), deadline, and requirements (photo, video, text report).
- **Local verifiers (“bounty hunters”)**
  - See bounties near you on a feed/map.
  - Walk to the spot, capture evidence, and submit a claim.
- **On‑chain escrow**
  - Bounty rewards locked in a smart contract.
  - Funds released only when the bounty creator accepts a submission.
- **Proof with GPS + media**
  - Submissions include GPS location, timestamp, and attached images/videos.
  - Designed to fight fake/AI‑generated claims by tying them to physical presence concepts similar to existing location‑based verification systems.[web:137]
- **Social feed experience**
  - Bounties and completed reports look like posts in a social app.
  - Cards with author, location, time, media, reactions (likes/comments placeholders).
- **Wallet‑based identity**
  - Connect wallet via MetaMask (Monad testnet).
  - Optional on‑chain username (e.g., `satoshi_pager`).
- **Theming & UX**
  - Global **MenuBar** with animated nav, active underlines, wallet pill, and avatar.
  - **Light/dark mode** toggle (via Tailwind `darkMode: "class"`).
  - Glassmorphism onboarding modal for username selection.

---

## 🧱 Tech Stack

- **Frontend**
  - Next.js (App Router, TypeScript, React)
  - Tailwind CSS with custom theme (Plus Jakarta Sans, primary colors, rounded UI)
  - Material Symbols icons
- **Blockchain / Web3**
  - Monad **testnet**
  - USDC test token (ERC‑20) used for rewards
  - `ethers.js` for wallet & contract interactions
- **Backend / API**
  - Next.js API routes for:
    - `POST /api/user/connect` – link wallet & create user
    - `POST /api/user/set-username` – set username
- **State / Context**
  - Custom `UserContext` for storing user profile and wallet info

## 📦 Getting Started (Local Development)

```bash
# 1. Clone the repo
git clone https://github.com/Koushik1244/Pager.git
cd pager-dapp

# 2. Install dependencies
npm install
# or
yarn install

create a file named .env.local

MONGODB_URI=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

NEXT_PUBLIC_MAPBOX_TOKEN=
NEXT_PUBLIC_MONAD_RPC=https://testnet-rpc.monad.xyz

create a file named .env

MONAD_RPC=https://testnet-rpc.monad.xyz
PRIVATE_KEY=

