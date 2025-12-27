/* =======================
   GLOBAL STATE
======================= */

let currentUser = null;
let periods = [];
let activePeriodId = null;

/* =======================
   STORAGE
======================= */

function storageKey() {
  return `money-tracker-${currentUser}`;
}

function saveData() {
  localStorage.setItem(
    storageKey(),
    JSON.stringify({ periods, activePeriodId })
  );
}

function loadData() {
  const raw = localStorage.getItem(storageKey());
  if (!raw) {
    periods = [];
    activePeriodId = null;
    return;
  }
  const data = JSON.parse(raw);
  periods = data.periods || [];
  activePeriodId = data.activePeriodId || null;
}

/* =======================
   UTILITIES
======================= */

function nowISO() {
  return new Date().toISOString();
}

function formatDate(date) {
  return new Date(date).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getActivePeriod() {
  return periods.find(p => p.id === activePeriodId);
}

/* =======================
   LOGIN
======================= */

function login() {
  const username = document.getElementById("usernameInput").value.trim();
  if (!username) {
    alert("Enter username");
    return;
  }

  currentUser = username;
  document.getElementById("loginScreen").style.display = "none";
  document.getElementById("app").style.display = "block";

  loadData();

  if (!activePeriodId) {
    startNewPeriod(0, 0);
    saveData();
  }

  renderAll();
}

/* =======================
   PERIOD
======================= */

function startNewPeriod(panas, dingin) {
  periods.push({
    id: crypto.randomUUID(),
    salaryPanas: panas,
    salaryDingin: dingin,
    startDate: nowISO(),
    endDate: null,
    expenses: [],
  });
  activePeriodId = periods.at(-1).id;
}

function closeActivePeriod() {
  const active = getActivePeriod();
  if (active && !active.endDate) active.endDate = nowISO();
}

function confirmNewPeriod() {
  if (!confirm("Close current period and start a new one?")) return;

  const panas = parseInt(document.getElementById("salaryPanas").value) || 0;
  const dingin = parseInt(document.getElementById("salaryDingin").value) || 0;

  closeActivePeriod();
  startNewPeriod(panas, dingin);

  saveData();
  renderAll();
}

function deletePeriod(id) {
  if (!confirm("Delete this period permanently?")) return;

  periods = periods.filter(p => p.id !== id);
  if (id === activePeriodId) startNewPeriod(0, 0);

  saveData();
  renderAll();
}

/* =======================
   EXPENSES
======================= */

function addExpense() {
  const name = expenseName.value.trim();
  const amount = parseInt(expenseAmount.value);
  const type = expenseType.value;

  if (!name || isNaN(amount) || amount <= 0) {
    alert("Invalid expense");
    return;
  }

  getActivePeriod().expenses.push({
    id: crypto.randomUUID(),
    name,
    amount,
    type,
    date: nowISO(),
  });

  expenseName.value = "";
  expenseAmount.value = "";

  saveData();
  renderAll();
}

/* ✏️ EDIT VALUE ONLY */
function editExpenseValue(periodId, expenseId) {
  const period = periods.find(p => p.id === periodId);
  if (!period) return;

  const expense = period.expenses.find(e => e.id === expenseId);
  if (!expense) return;

  const input = prompt(
    `Edit expense value (Rp)\n\n${expense.name}\nCurrent: ${expense.amount}`,
    expense.amount
  );

  if (input === null) return;

  const newAmount = parseInt(input);
  if (isNaN(newAmount) || newAmount <= 0) {
    alert("Invalid amount");
    return;
  }

  if (!confirm(`Change value?\n\n${expense.amount} → ${newAmount}`)) return;

  expense.amount = newAmount;
  saveData();
  renderAll();
}

function deleteExpense(periodId, expenseId) {
  const period = periods.find(p => p.id === periodId);
  period.expenses = period.expenses.filter(e => e.id !== expenseId);
  saveData();
  renderAll();
}

/* =======================
   SUMMARY
======================= */

function updateSummary() {
  const active = getActivePeriod();
  let panas = 0, dingin = 0;

  active.expenses.forEach(e => {
    e.type === "panas" ? panas += e.amount : dingin += e.amount;
  });

  salaryPanas.value = active.salaryPanas;
  salaryDingin.value = active.salaryDingin;

  panasSalary.textContent = active.salaryPanas;
  panasExpense.textContent = panas;
  panasRemaining.textContent = active.salaryPanas - panas;

  dinginSalary.textContent = active.salaryDingin;
  dinginExpense.textContent = dingin;
  dinginRemaining.textContent = active.salaryDingin - dingin;
}

/* =======================
   HISTORY
======================= */

function renderHistory() {
  expenseList.innerHTML = "";

  periods.forEach(p => {
    const card = document.createElement("li");
    card.className = "period-card";

    card.innerHTML = `
      <div class="period-header">
        <strong>${formatDate(p.startDate)} → ${p.endDate ? formatDate(p.endDate) : "Present"}</strong>
        <button class="delete-btn" onclick="deletePeriod('${p.id}')">Delete</button>
      </div>
    `;

    p.expenses.forEach(e => {
      const row = document.createElement("div");
      row.className = "expense-item";
      row.innerHTML = `
        <div class="expense-info">
          <div class="expense-name">${e.name} — Rp ${e.amount}</div>
          <div class="expense-meta">
            <span class="badge ${e.type === "panas" ? "badge-panas" : "badge-dingin"}">${e.type}</span>
            <span class="expense-date">${formatDate(e.date)}</span>
          </div>
        </div>
        <div>
          <button class="delete-btn" onclick="editExpenseValue('${p.id}','${e.id}')">Edit</button>
          <button class="delete-btn" onclick="deleteExpense('${p.id}','${e.id}')">✕</button>
        </div>
      `;
      card.appendChild(row);
    });

    expenseList.appendChild(card);
  });
}

/* =======================
   RENDER
======================= */

function renderAll() {
  updateSummary();
  renderHistory();
}

/* =======================
   INIT
======================= */

document.addEventListener("DOMContentLoaded", () => {
  app.style.display = "none";
});
