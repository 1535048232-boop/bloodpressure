const STORAGE_KEY = "bloodpressure.records";

const form = document.getElementById("record-form");
const messageEl = document.getElementById("message");
const recordsBody = document.getElementById("records-body");
const statsEl = document.getElementById("stats");

const today = new Date();
today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
document.getElementById("recordedAt").value = today.toISOString().slice(0, 16);

function loadRecords() {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value ? JSON.parse(value) : [];
  } catch {
    return [];
  }
}

function saveRecords(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function formatDateTime(value) {
  return new Date(value).toLocaleString("zh-CN");
}

function renderStats(records) {
  if (!records.length) {
    statsEl.textContent = "暂无数据";
    return;
  }
  const total = records.length;
  const avgSystolic = Math.round(records.reduce((s, r) => s + r.systolic, 0) / total);
  const avgDiastolic = Math.round(records.reduce((s, r) => s + r.diastolic, 0) / total);
  statsEl.textContent = `共 ${total} 条，平均血压：${avgSystolic}/${avgDiastolic} mmHg`;
}

function renderRecords() {
  const records = loadRecords();
  recordsBody.innerHTML = "";

  if (!records.length) {
    const row = document.createElement("tr");
    row.innerHTML = '<td class="muted" colspan="5">暂无记录</td>';
    recordsBody.appendChild(row);
    renderStats(records);
    return;
  }

  records
    .sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt))
    .forEach((record) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${formatDateTime(record.recordedAt)}</td>
        <td>${record.systolic}/${record.diastolic} mmHg</td>
        <td>${record.pulse ? `${record.pulse} bpm` : "-"}</td>
        <td>${record.note || "-"}</td>
        <td><button class="danger-btn" data-id="${record.id}" type="button">删除</button></td>
      `;
      recordsBody.appendChild(row);
    });
  renderStats(records);
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const recordedAt = document.getElementById("recordedAt").value;
  const systolic = Number(document.getElementById("systolic").value);
  const diastolic = Number(document.getElementById("diastolic").value);
  const pulseValue = document.getElementById("pulse").value;
  const note = document.getElementById("note").value.trim();

  if (systolic <= diastolic) {
    messageEl.textContent = "收缩压必须高于舒张压。";
    return;
  }

  const pulse = pulseValue ? Number(pulseValue) : null;
  const records = loadRecords();
  records.push({
    id: crypto.randomUUID(),
    recordedAt,
    systolic,
    diastolic,
    pulse,
    note,
  });
  saveRecords(records);
  form.reset();

  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  document.getElementById("recordedAt").value = now.toISOString().slice(0, 16);

  messageEl.textContent = "记录已保存。";
  renderRecords();
});

recordsBody.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLButtonElement) || !target.dataset.id) {
    return;
  }

  const records = loadRecords().filter((record) => record.id !== target.dataset.id);
  saveRecords(records);
  messageEl.textContent = "记录已删除。";
  renderRecords();
});

renderRecords();
