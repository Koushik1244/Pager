# Pager — Design Document

## Design direction

X (Twitter) style. A bounty is a **post**. Every submission to that bounty is a **reply**, threaded directly underneath it with a visible connecting line — exactly like a reply thread on X. This is the single biggest structural change from the current UI, which shows bounties and submissions as disconnected cards in separate views.

Why this model fits Pager specifically:
- A bounty with multiple competing submissions is naturally a "post with replies" — people are used to scanning a thread top-to-bottom to see the original ask and every response underneath it
- Status badges (pending / approved / not selected) map directly onto how X shows reply context — readable at a glance without extra UI chrome
- It scales naturally: a bounty with zero submissions just looks like a post with no replies yet, no separate empty state needed

## Core layout pattern

**Bounty post (root):**
- Avatar + name + timestamp, same as any social post
- Description text
- Reward badge (amount in USDC), small and inline, not a giant hero element — this keeps focus on the task, not the money
- Location — shown as a compact map preview or location chip, not full-size unless tapped
- Meta row: submission count, time remaining until deadline (replaces the "like/reply/share" row you'd see on X, since those actions don't map to Pager's actual use case)

**Submission thread (replies):**
- Indented under the bounty post with a vertical connector line, matching X's reply-thread visual language
- Each submission: smaller avatar, name, status badge, the proof photo, a short caption
- Status badges use color semantically:
  - **Pending** — warm/amber, still awaiting decision
  - **Approved** — green, this one won and got paid
  - **Not selected** — muted/red, lost out (either explicitly rejected or auto-closed when another was approved)
- Approve/Reject action buttons appear only for the creator, only on pending submissions — not shown to other viewers or to the hunter who submitted

## Visual reference

See the attached mockup for the actual layout: bounty post at top, thread line, two submissions underneath (one pending, one not-selected) — this is the target structure for `BountyFeed.tsx` and `SubmissionCard.tsx` to be restructured around.

## Design principles to carry through the rest of the app

1. **Task-first, not money-first.** The reward is a small badge, not a giant number dominating the card. This is a favor-and-verification platform, not a marketplace — the design shouldn't feel transactional.
2. **Status is always visible at a glance.** Every submission's fate (pending/approved/not selected) should be readable without clicking in — color + label, consistent everywhere.
3. **Location is a supporting detail, not the hero.** A small map chip or pin icon + area name is enough in the feed; full map detail belongs in the dedicated Map view, not repeated large on every card.
4. **Mobile-first.** Hunters are outdoors, on their phones, walking to a location. Every core action (view bounty, submit proof, approve/reject) needs to work cleanly one-handed on a small screen. Test every new component on an actual phone width before considering it done.
5. **Camera-only submission has a distinct, obvious UI state.** Since gallery upload is intentionally disabled, the capture screen should make this clear rather than look like a broken/missing upload button — frame it as "open camera" as the primary and only action, not as a limitation.
6. **Minimal chrome, maximal content.** Flat surfaces, thin borders, generous whitespace — avoid heavy shadows, gradients, or decorative elements that don't serve the task-tracking purpose.

## Color system for status states

| State | Color | Meaning |
|---|---|---|
| Pending | Amber/warning | Submission awaiting creator's decision |
| Approved | Green/success | This submission won, funds released |
| Not selected | Red/muted | Rejected or auto-closed when another submission won |
| Open (bounty-level) | Neutral/gray | Bounty still accepting submissions |
| Expired | Muted gray | Deadline passed, no winner, refundable |

## Component mapping to existing code

This design maps onto your existing components with restructuring, not a rewrite:
- `BountyFeed.tsx` — becomes the "timeline" of bounty posts
- `SubmissionCard.tsx` — becomes the "reply" component, needs a threaded/indented visual treatment instead of its current flat card layout
- New: a thread-connector visual element (a simple vertical line + left-padding, reusable across every bounty-with-submissions render)
- Status badge — should become one small reusable component used consistently across feed, map popups, and profile views, rather than styled ad hoc in each place

## Out of scope for this design pass

- Full profile page redesign
- Map view redesign (keep functional, revisit visually later)
- Landing page (tracked separately, already in progress)
