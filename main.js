(() => {
  const SLOT_COUNT = 60;
  const SLOT_CAPACITY = 48000; // example CUs per slot
  const PRECONF_MS = 30; // Raiku sub-30ms target (visual only)

  const el = (id) => document.getElementById(id);
  const modeEl = el('mode');
  const cuEl = el('cu');
  const deadlineEl = el('deadline');
  const priorityEl = el('priority');
  const groupEl = el('group');
  const reserveSlotEl = el('reserveSlot');
  const mevSafeEl = el('mevSafe');
  const extLoadEl = el('extLoad');

  const currentSlotEl = el('currentSlot');
  const backlogEl = el('backlog');
  const fillRateEl = el('fillRate');
  const latencyEl = el('latency');
  const retriesEl = el('retries');
  const timelineEl = el('timeline');
  const txListEl = el('txList');

  let currentSlot = 0;
  let nextTxId = 1;
  let retries = 0;
  const slots = [];
  const pending = []; // for JIT or overflow
  const allTxs = [];

  function mkSlot(idx) {
    return { idx, used: 0, extUsed: 0, txs: [] };
  }
  function initSlots() {
    slots.length = 0;
    for (let i = 0; i < SLOT_COUNT; i++) slots.push(mkSlot(i));
  }

  const prioWeight = (p) => (p === 'high' ? 3 : p === 'medium' ? 2 : 1);

  function addTx({ cu, deadlineFromNow, priority, group, mode, reserveAt }) {
    const tx = {
      id: nextTxId++,
      cu,
      priority,
      prio: prioWeight(priority),
      group,
      createdAt: currentSlot,
      deadline: currentSlot + Math.max(1, deadlineFromNow),
      scheduledSlot: null,
      retries: 0,
      mode,
    };
    allTxs.push(tx);
    if (mode === 'aot') {
      const target = currentSlot + Math.max(0, reserveAt|0);
      scheduleAOT(tx, target);
    } else {
      pending.push(tx);
      scheduleJIT();
    }
    render();
  }

  function slotAt(absSlot) {
    const rel = absSlot - currentSlot;
    if (rel < 0 || rel >= SLOT_COUNT) return null;
    return slots[rel];
  }

  function tryPlace(tx, sIdx) {
    const s = slotAt(sIdx);
    if (!s) return false;
    const available = SLOT_CAPACITY - (s.used + s.extUsed);
    if (available >= tx.cu) {
      s.used += tx.cu;
      s.txs.push(tx);
      tx.scheduledSlot = sIdx;
      return true;
    }
    return false;
  }

  function scheduleAOT(tx, targetSlot) {
    let s = targetSlot;
    while (s <= tx.deadline) {
      if (tryPlace(tx, s)) return true;
      s++;
      tx.retries++;
      retries++;
    }
    return false;
  }

  function scheduleJIT() {
    // Order: group-preserving if enabled, else pure priority
    pending.sort((a, b) => {
      if (mevSafeEl.checked && a.group !== b.group) return 0;
      return b.prio - a.prio;
    });
    const kept = [];
    for (const tx of pending) {
      let placed = false;
      for (let s = currentSlot; s <= tx.deadline; s++) {
        if (tryPlace(tx, s)) { placed = true; break; }
        tx.retries++; retries++;
      }
      if (!placed) kept.push(tx); // retry next tick
    }
    pending.length = 0;
    pending.push(...kept);
  }

  function injectExternalLoad() {
    if (!extLoadEl.checked) return;
    for (let i = 0; i < SLOT_COUNT; i++) {
      const s = slots[i];
      // 50% capacity blocked by external congestion
      const target = Math.floor(SLOT_CAPACITY * 0.5);
      s.extUsed = target;
    }
  }

  function advanceOneSlot() {
    currentSlot++;
    // drop the head, push a new tail
    slots.shift();
    slots.push(mkSlot(currentSlot + SLOT_COUNT - 1));
    injectExternalLoad();
    // try to schedule pending again
    if (pending.length) scheduleJIT();
    render();
  }

  function reset() {
    currentSlot = 0; nextTxId = 1; retries = 0;
    allTxs.length = 0; pending.length = 0;
    initSlots(); injectExternalLoad();
    render();
  }

  function renderTimeline() {
    timelineEl.innerHTML = '';
    let totalCap = 0, totalUsed = 0;
    for (let i = 0; i < SLOT_COUNT; i++) {
      const s = slots[i];
      const elSlot = document.createElement('div');
      elSlot.className = 'slot' + (i === 0 ? ' current' : '');
      const usedPct = Math.min(100, (s.used / SLOT_CAPACITY) * 100);
      const extPct = Math.min(100, (s.extUsed / SLOT_CAPACITY) * 100);
      const cap = document.createElement('div'); cap.className = 'cap'; cap.style.height = `${usedPct}%`;
      const ext = document.createElement('div'); ext.className = 'ext'; ext.style.height = `${extPct}%`;
      const label = document.createElement('div'); label.className = 'label'; label.textContent = currentSlot + i;
      elSlot.appendChild(ext); elSlot.appendChild(cap); elSlot.appendChild(label);
      timelineEl.appendChild(elSlot);
      totalCap += SLOT_CAPACITY; totalUsed += s.used;
    }
    const fillRate = totalUsed / totalCap;
    fillRateEl.textContent = `${(fillRate*100).toFixed(1)}%`;
  }

  function renderTxs() {
    txListEl.innerHTML = '';
    const sorted = [...allTxs].sort((a,b)=>a.id-b.id);
    for (const t of sorted) {
      const div = document.createElement('div'); div.className = 'tx';
      div.innerHTML = `
        <span class="badge ${t.priority}">#${t.id}</span>
        <span>CU ${t.cu}</span>
        <span>prio ${t.priority}</span>
        <span>grp ${t.group}</span>
        <span>deadline ${t.deadline}</span>
        <span>${t.scheduledSlot!==null?`scheduled @ ${t.scheduledSlot}`:'pending'}</span>
        <span>retries ${t.retries}</span>
      `;
      txListEl.appendChild(div);
    }
  }

  function renderMetrics() {
    currentSlotEl.textContent = currentSlot;
    backlogEl.textContent = pending.length;
    latencyEl.textContent = `${PRECONF_MS}ms`;
    retriesEl.textContent = retries;
  }

  function render() {
    renderTimeline();
    renderTxs();
    renderMetrics();
  }

  // wire up controls
  document.getElementById('addTx').onclick = () => {
    addTx({
      cu: Math.max(100, Number(cuEl.value)||2000),
      deadlineFromNow: Math.max(1, Number(deadlineEl.value)||10),
      priority: priorityEl.value,
      group: groupEl.value || 'DEX',
      mode: modeEl.value,
      reserveAt: Number(reserveSlotEl.value)||0,
    });
  };
  document.getElementById('burst').onclick = () => {
    for (let i=0;i<10;i++) {
      addTx({
        cu: Math.max(100, Number(cuEl.value)||2000),
        deadlineFromNow: Math.max(1, Number(deadlineEl.value)||10),
        priority: priorityEl.value,
        group: groupEl.value || 'DEX',
        mode: modeEl.value,
        reserveAt: Number(reserveSlotEl.value)||0,
      });
    }
  };
  document.getElementById('advance').onclick = advanceOneSlot;
  document.getElementById('reset').onclick = reset;
  extLoadEl.onchange = () => { injectExternalLoad(); render(); };

  // bootstrap
  initSlots();
  render();
})();
