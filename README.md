#  Raiku Deterministic Slot Orchestrator
### Interactive Visual Simulator


> **Track 4** (Visual Simulations & Blueprints) | **Track 2** (Open-Source Tooling)

[![Open in Browser](https://img.shields.io/badge/Demo-Open%20index.html-22d3ee?style=for-the-badge)](./index.html)

---


---

##  Quick Start (30 Seconds)

1. **Open** `index.html` in your browser (no build required!)
2. **Click** "Scenario: DEX vs ORACLE" to load a pre-built demo
3. **Enable** "External congestion" to simulate network stress
4. **Press** "Play" and watch deterministic scheduling in action
5. **Hover** over timeline slots to see detailed utilization stats



---

## 🎯 What Problem Does This Solve?

### The Challenge
Solana is blazingly fast, but **execution timing is uncertain** under congestion. Builders can't guarantee when—or if—their transactions will land. This blocks institutional adoption and creates MEV opportunities.

### The Raiku Solution
**Deterministic execution** through:
- **AOT (Ahead-of-Time) Reservations**: Reserve blockspace 30-60 seconds ahead
- **JIT (Just-in-Time) Reservations**: Buy immediate inclusion with guarantees
- **Transaction-level Pre-confirmations**: Sub-30ms targets
- **Ackermann Node**: Automatic retry orchestration

### This Simulator
Makes these abstractions **concrete and visual**. See exactly how:
- AOT reservations lock in future slots deterministically
- JIT orders navigate congestion with automatic retries
- App-defined ordering eliminates opaque fee auctions
- Congestion scenarios affect execution differently

---



##  How It Works (Simplified)

### Core Model
```
Time = Discrete slots (e.g., 60 visible)
Each slot has capacity in Compute Units (CUs)
Transactions: { id, CU, priority, deadline, group }
```

### AOT Scheduling
```javascript
reserve(targetSlot) → mark slot, deduct capacity
If full → try next slot until deadline
Success → deterministic placement guaranteed
```

### JIT Scheduling
```javascript
request(now, constraints) → find earliest viable slot
If none → Ackermann auto-retries forward
Success → placement with minimal latency
```

### App-Defined Ordering
```javascript
Within group → preserve order (MEV-safe)
Across groups → priority-based placement
No opaque auctions → transparent scheduling
```

---



##  Extending for Raiku SDK

When Raiku's SDK launches, replace the scheduling logic:

```javascript
// Current (simulation)
function scheduleAOT(tx, targetSlot) { /* ... */ }

// Future (Raiku SDK)
async function scheduleAOT(tx, targetSlot) {
  const reservation = await raiku.reserve({
    slot: targetSlot,
    cuBudget: tx.cu,
    metadata: { group: tx.group, priority: tx.priority }
  });
  return reservation.ticket;
}
```

Similarly for JIT:
```javascript
const inclusion = await raiku.requestJIT({
  transaction: tx,
  deadline: tx.deadline,
  constraints: { minSlot: currentSlot, maxRetries: 5 }
});
```

---

##  Use Cases Demonstrated

### 1. Perpetual DEX (Track 1: Finance)
- **Problem**: Order matching vulnerable to MEV
- **Solution**: AOT reservations + group ordering = zero MEV
- **Demo**: "DEX vs ORACLE" scenario

### 2. HFT Trading (Track 1: Finance)
- **Problem**: Execution uncertainty kills alpha
- **Solution**: JIT with sub-30ms pre-confirmations
- **Demo**: "HFT Burst" scenario + external congestion

### 3. Validator Analytics (Track 2: Tooling)
- **Problem**: No visibility into slot revenue or utilization
- **Solution**: Timeline visualization + CSV export
- **Demo**: Export data → analyze in spreadsheet/Python

### 4. Economic Research (Track 3: Research)
- **Problem**: Need data for local fee market modeling
- **Solution**: Export slot/tx data for simulations
- **Demo**: CSV contains timeline + transaction metadata

---

##  Technical Stack

- **Frontend**: Pure HTML/CSS/JavaScript (no dependencies!)
- **Styling**: Custom CSS with CSS variables for theming
- **Architecture**: IIFE module pattern, functional + stateful
- **Data Export**: CSV generation with Blob API
- **Animations**: CSS transitions + keyframe animations
- **Responsive**: Flexbox + Grid layout




---

##  Future Enhancements (Post-Hackathon)

-  Integrate real Raiku SDK when available
-  Add multi-validator simulation (decentralization view)
-  3D timeline visualization with WebGL
-  Real-time Solana mainnet data feed
-  Advanced economic modeling (priority fee dynamics)
-  Mobile-first redesign for broader accessibility
-  Embed in Raiku docs as interactive tutorial

---

**Built with** ☕ and determinism.

---

## 📄 License

MIT License - Open source for the community

---

**Ready to experience deterministic execution?**  
→ Open `index.html` and see Raiku's vision come to life ✨
