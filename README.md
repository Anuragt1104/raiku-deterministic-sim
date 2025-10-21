# Raiku Deterministic Slot Orchestrator — Interactive Simulator

A lightweight, static web prototype that makes Raiku’s deterministic execution tangible. It visualizes Ahead‑Of‑Time (AOT) and Just‑In‑Time (JIT) slot reservations, application‑defined ordering, and Ackermann‑style automated retries under congestion.

## Why this matters

Solana is fast, but execution timing is uncertain under stress. Raiku introduces deterministic execution with:
- AOT reservations (book blockspace up to ~60s ahead)
- JIT reservations (buy just‑in‑time inclusion)
- Transaction‑level guarantees and pre‑confirmations (sub‑30ms targets)
- Retry offload to the Raiku Ackermann Node

This simulator lets builders “feel” those guarantees, compare AOT vs JIT scheduling, and see how app‑defined ordering eliminates opaque auctions and MEV from matching logic.

## What’s inside

- Visual timeline of slots with capacity and utilization
- Queue of transactions with attributes: compute units, deadline, priority, ordering group
- Two schedulers:
  - AOT: reserves future slots deterministically
  - JIT: allocates into the nearest viable slot; if full, auto‑retry to next slot
- Metrics: pre‑confirmation latency, fill rate, backlog, slot revenue proxy
- Scenarios: low‑load, burst, adversarial congestion

No SDK required; all logic is client‑side. Swap the scheduling shim for Raiku’s SDK when available.

## How to run

Open `index.html` in a browser. No build or deps.

## Simulator model (simplified)

- Time is discrete in “slots” (e.g., 60 visible). Each slot has capacity (CUs).
- Transactions: `{id, computeUnits, priority, deadline, group}`
- AOT: When you reserve, we mark the chosen slot(s) and deduct capacity.
- JIT: We place the tx in the earliest slot that satisfies capacity and deadline. If none, Ackermann auto‑retries forward until success or expiry.
- App‑defined ordering: Within a group, order is preserved before cross‑group priority.

## Demo flow (suggested)

1. Add 10 orders in a “Perp DEX” group; reserve AOT slots for the next 3 intervals.
2. Inject a burst of external load to congest the near‑term slots.
3. Observe: AOT orders still land deterministically; JIT orders slide forward with auto‑retries.
4. Toggle “MEV‑safe matching” to enforce group‑preserving order over fee auctions.
5. Review metrics: utilization, pre‑conf latency, retries.

## Extending toward Raiku

Replace `scheduler.js` shims with Raiku SDK calls:
- AOT: `reserve(slot, cuBudget, meta)` → reservation ticket
- JIT: `request(now, constraints)` → inclusion guarantee
- Ackermann: automatic retry & pre‑confirmation stream

## Notes

This is a conceptual tool for Tracks 2 (Tooling) and 4 (Visualization). It can support Track 1 (Finance) by adding DEX‑specific matchers and Track 3 (Economic Research) by exporting slot/fee time‑series for modeling.
