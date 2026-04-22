const KEYS = {
  bp: "bp_records_v1",
  med: "med_records_v1",
};

const state = {
  tab: "bp",
  range: 7,
  bp: load(KEYS.bp, []),
  med: load(KEYS.med, []),
};

if (!state.bp.length) {
  state.bp = [
    seedRecord(118, 76, 68, "昨天 08:30", "晨起"),
    seedRecord(132, 86, 75, "2026-04-20T19:00", "饭后"),
    seedRecord(125, 82, 70, "2026-04-20T08:15", "晨起"),
    seedRecord(128, 84, 73, "2026-04-19T20:30", "晚间"),
    seedRecord(135, 88, 78, "2026-04-19T07:45", "运动后"),
    seedRecord(122, 79, 69, "2026-04-18T08:00", "晨起"),
  ];
  save(KEYS.bp, state.bp);
}

if (!state.med.length) {
  state.med = [
    { id: crypto.randomUUID(), name: "氨氯地平", dose: "5mg", time: "2026-04-20T08:20", note: "晨起" },
    { id: crypto.randomUUID(), name: "缬沙坦", dose: "80mg", time: "2026-04-19T08:00", note: "早餐后" },
  ];
  save(KEYS.med, state.med);
}

const els = {
  tabs: [...document.querySelectorAll(".tab")],
  bpPanel: document.querySelector("#bp-panel"),
  medPanel: document.querySelector("#med-panel"),
  avgSys: document.querySelector("#avg-sys"),
  avgDia: document.querySelector("#avg-dia"),
  avgHr: document.querySelector("#avg-hr"),
  statusTitle: document.querySelector("#status-title"),
  statusText: document.querySelector("#status-text"),
  statusCard: document.querySelector("#status-card"),
  bpList: document.querySelector("#bp-list"),
  medList: document.querySelector("#med-list"),
  chart: document.querySelector("#trend-chart"),
  addBtn: document.querySelector("#add-btn"),
  dialog: document.querySelector("#form-dialog"),
  form: document.querySelector("#entry-form"),
  formTitle: document.querySelector("#form-title"),
  formFields: document.querySelector("#form-fields"),
  bpTemplate: document.querySelector("#bp-fields-template"),
  medTemplate: document.querySelector("#med-fields-template"),
  cancelBtn: document.querySelector("#cancel-btn"),
  exportBp: document.querySelector("#export-bp"),
  exportAll: document.querySelector("#export-all"),
  rangeToggle: document.querySelector("#range-toggle"),
};

bindEvents();
render();

function bindEvents() {
  els.tabs.forEach((tab) => tab.addEventListener("click", () => switchTab(tab.dataset.tab)));

  els.addBtn.addEventListener("click", () => openDialog(state.tab));

  els.cancelBtn.addEventListener("click", () => els.dialog.close());

  els.form.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(els.form);
    if (state.tab === "bp") {
      const entry = {
        id: crypto.randomUUID(),
        systolic: Number(fd.get("systolic")),
        diastolic: Number(fd.get("diastolic")),
        heartRate: Number(fd.get("heartRate")),
        timestamp: String(fd.get("timestamp")),
        context: String(fd.get("context") || ""),
      };
      state.bp.unshift(entry);
      save(KEYS.bp, state.bp);
    } else {
      const med = {
        id: crypto.randomUUID(),
        name: String(fd.get("name")),
        dose: String(fd.get("dose")),
        time: String(fd.get("time")),
        note: String(fd.get("note") || ""),
      };
      state.med.unshift(med);
      save(KEYS.med, state.med);
    }
    els.dialog.close();
    render();
  });

  els.bpList.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-del-id]");
    if (!btn) return;
    state.bp = state.bp.filter((item) => item.id !== btn.dataset.delId);
    save(KEYS.bp, state.bp);
    render();
  });

  els.medList.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-del-id]");
    if (!btn) return;
    state.med = state.med.filter((item) => item.id !== btn.dataset.delId);
    save(KEYS.med, state.med);
    render();
  });

  els.exportBp.addEventListener("click", () => {
    downloadCsv(
      "blood-pressure.csv",
      ["id", "systolic", "diastolic", "heartRate", "timestamp", "context"],
      state.bp.map((v) => [v.id, v.systolic, v.diastolic, v.heartRate, v.timestamp, v.context])
    );
  });

  els.exportAll.addEventListener("click", () => {
    const headers = ["type", "id", "a", "b", "c", "d", "e"];
    const rows = [
      ...state.bp.map((v) => ["bp", v.id, v.systolic, v.diastolic, v.heartRate, v.timestamp, v.context]),
      ...state.med.map((v) => ["med", v.id, v.name, v.dose, v.time, v.note, ""]),
    ];
    downloadCsv("blood-pressure-all.csv", headers, rows);
  });

  els.rangeToggle.addEventListener("click", () => {
    state.range = state.range === 7 ? 30 : 7;
    els.rangeToggle.textContent = state.range === 7 ? "最近7条" : "最近30条";
    drawChart();
  });
}

function render() {
  renderStats();
  renderBpList();
  renderMedList();
  drawChart();
  renderTab();
}

function renderTab() {
  const isBp = state.tab === "bp";
  els.bpPanel.classList.toggle("hidden", !isBp);
  els.medPanel.classList.toggle("hidden", isBp);
  els.tabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.tab === state.tab));
  els.addBtn.textContent = isBp ? "+ 记录血压" : "+ 记录用药";
}

function switchTab(tab) {
  state.tab = tab;
  renderTab();
}

function openDialog(tab) {
  state.tab = tab;
  renderTab();
  els.form.reset();
  els.formFields.replaceChildren();

  const now = toInputDate(new Date());

  if (tab === "bp") {
    els.formTitle.textContent = "新增血压记录";
    els.formFields.append(els.bpTemplate.content.cloneNode(true));
    els.form.elements.timestamp.value = now;
  } else {
    els.formTitle.textContent = "新增用药记录";
    els.formFields.append(els.medTemplate.content.cloneNode(true));
    els.form.elements.time.value = now;
  }

  els.dialog.showModal();
}

function renderStats() {
  const recent = sortByTime(state.bp).slice(0, 7);
  if (!recent.length) {
    els.avgSys.textContent = "--";
    els.avgDia.textContent = "--";
    els.avgHr.textContent = "--";
    els.statusTitle.textContent = "暂无数据";
    els.statusText.textContent = "请先记录血压。";
    return;
  }

  const avg = {
    sys: Math.round(recent.reduce((sum, v) => sum + v.systolic, 0) / recent.length),
    dia: Math.round(recent.reduce((sum, v) => sum + v.diastolic, 0) / recent.length),
    hr: Math.round(recent.reduce((sum, v) => sum + v.heartRate, 0) / recent.length),
  };

  els.avgSys.textContent = String(avg.sys);
  els.avgDia.textContent = String(avg.dia);
  els.avgHr.textContent = String(avg.hr);

  const s = getStatus(avg.sys, avg.dia);
  els.statusTitle.textContent = s.label;
  els.statusText.textContent = s.message;
  els.statusCard.style.background = s.bg;
  els.statusCard.style.borderColor = s.bd;
}

function renderBpList() {
  const sorted = sortByTime(state.bp);
  if (!sorted.length) {
    els.bpList.innerHTML = "<li class='item'>暂无血压记录</li>";
    return;
  }

  els.bpList.innerHTML = sorted
    .map((item) => {
      const status = getStatus(item.systolic, item.diastolic);
      return `
      <li class="item ${status.className}">
        <div class="item-top">
          <div>
            <span class="bp-val">${item.systolic}/${item.diastolic}</span>
            <span class="tag ${status.className || "ok"}">${status.label}</span>
          </div>
          <button class="delete" data-del-id="${item.id}">删除</button>
        </div>
        <div class="muted">${formatTime(item.timestamp)} · ❤️ ${item.heartRate} bpm${item.context ? ` · ${escapeHtml(item.context)}` : ""}</div>
      </li>`;
    })
    .join("");
}

function renderMedList() {
  const sorted = [...state.med].sort((a, b) => parseDate(b.time) - parseDate(a.time));
  if (!sorted.length) {
    els.medList.innerHTML = "<li class='item'>暂无用药记录</li>";
    return;
  }

  els.medList.innerHTML = sorted
    .map(
      (item) => `
      <li class="item">
        <div class="item-top">
          <div><strong>${escapeHtml(item.name)}</strong> <span class="tag ok">${escapeHtml(item.dose)}</span></div>
          <button class="delete" data-del-id="${item.id}">删除</button>
        </div>
        <div class="muted">${formatTime(item.time)}${item.note ? ` · ${escapeHtml(item.note)}` : ""}</div>
      </li>`
    )
    .join("");
}

function drawChart() {
  const sorted = sortByTime(state.bp).slice(0, state.range).reverse();
  const width = 700;
  const height = 260;
  const pad = { t: 20, r: 20, b: 30, l: 30 };
  const innerW = width - pad.l - pad.r;
  const innerH = height - pad.t - pad.b;

  if (sorted.length < 2) {
    els.chart.innerHTML = "<text x='20' y='40' fill='#8b95ab'>至少需要 2 条记录显示趋势</text>";
    return;
  }

  const allY = sorted.flatMap((v) => [v.systolic, v.diastolic, v.heartRate]);
  const min = Math.max(30, Math.min(...allY) - 10);
  const max = Math.min(240, Math.max(...allY) + 10);
  const xStep = innerW / (sorted.length - 1);
  const y = (v) => pad.t + ((max - v) / (max - min || 1)) * innerH;
  const x = (i) => pad.l + i * xStep;

  const pathFor = (key) =>
    sorted
      .map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(p[key])}`)
      .join(" ");

  const grid = Array.from({ length: 5 }, (_, i) => {
    const yy = pad.t + (innerH / 4) * i;
    return `<line x1='${pad.l}' y1='${yy}' x2='${width - pad.r}' y2='${yy}' stroke='#eef2fb'/>`;
  }).join("");

  const labels = sorted
    .map((p, i) => {
      const dt = new Date(parseDate(p.timestamp));
      const label = `${dt.getMonth() + 1}/${dt.getDate()}`;
      return `<text x='${x(i)}' y='${height - 8}' text-anchor='middle' fill='#98a3b8' font-size='11'>${label}</text>`;
    })
    .join("");

  els.chart.innerHTML = `
    ${grid}
    <path d='${pathFor("systolic")}' fill='none' stroke='${getCss("--sys")}' stroke-width='3'/>
    <path d='${pathFor("diastolic")}' fill='none' stroke='${getCss("--dia")}' stroke-width='3'/>
    <path d='${pathFor("heartRate")}' fill='none' stroke='${getCss("--hr")}' stroke-width='3'/>
    ${labels}
  `;
}

function getStatus(sys, dia) {
  if (sys >= 140 || dia >= 90) {
    return {
      label: "高血压 I 期",
      message: "血压偏高，请注意复测并考虑就医咨询。",
      className: "danger",
      bg: "#ffe8e0",
      bd: "#f8c9bb",
    };
  }
  if (sys >= 130 || dia >= 85) {
    return {
      label: "血压偏高",
      message: "建议控制盐分摄入，保持规律作息。",
      className: "warn",
      bg: "#fff3d8",
      bd: "#f5deaa",
    };
  }
  return {
    label: "最优血压",
    message: "血压控制良好，请继续保持。",
    className: "ok",
    bg: "#d6f6e8",
    bd: "#b8e9d4",
  };
}

function seedRecord(systolic, diastolic, heartRate, timestamp, context) {
  return { id: crypto.randomUUID(), systolic, diastolic, heartRate, timestamp, context };
}

function sortByTime(records) {
  return [...records].sort((a, b) => parseDate(b.timestamp) - parseDate(a.timestamp));
}

function parseDate(input) {
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(input)) return Date.parse(input);
  if (input.includes("昨天")) {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    d.setHours(8, 30, 0, 0);
    return d.getTime();
  }
  return Date.now();
}

function formatTime(input) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(input)) return input;
  const d = new Date(input);
  return `${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function toInputDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${d}T${hh}:${mm}`;
}

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function getCss(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function downloadCsv(fileName, headers, rows) {
  const csv = [headers.join(","), ...rows.map((r) => r.map(csvCell).join(","))].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(a.href);
}

function csvCell(value) {
  const s = String(value ?? "");
  return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
