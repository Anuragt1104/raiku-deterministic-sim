# Loom Script (≤2 minutes)

Intro (10s)
- This is a deterministic slot orchestrator simulator for Raiku.
- We show AOT/JIT reservations, app-defined ordering, and Ackermann retries.

Scene 1 — Baseline (25s)
- Add a few medium-priority JIT transactions. Note how they schedule into near slots.
- Turn on external congestion to block ~50% capacity. Observe retries and forward placement.

Scene 2 — AOT Guarantees (35s)
- Switch to AOT. Reserve at +5, +10. Add several transactions.
- Even under congestion, AOT reservations land exactly at or soon after the reserved slot.
- Pre-confirmation target: ~30ms. Inclusion is guaranteed before the deadline.

Scene 3 — App-defined Ordering (25s)
- Keep MEV-safe group ordering on. Add two groups: DEX and ORACLE.
- Within a group, order is preserved; across groups, priority decides.
- This avoids opaque auctions for matching logic.

Wrap (15s)
- Metrics: fill rate, backlog, retries.
- Replace the scheduler shim with Raiku’s SDK when available.
- Open-source tool; perfect for Tracks 2 & 4, extendable to 1 & 3.
