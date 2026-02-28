const STORAGE_KEY = "habitTracker:v1";
const DAY_COUNT = 14;
const STATE_ORDER = ["", "yes", "no"];

const habitInput = document.getElementById("habitInput");
const addHabitButton = document.getElementById("addHabitButton");
const resetButton = document.getElementById("resetButton");
const tableHead = document.getElementById("tableHead");
const tableBody = document.getElementById("tableBody");
const emptyState = document.getElementById("emptyState");
const progressText = document.getElementById("progressText");
const progressFill = document.getElementById("progressFill");

let state = loadState();

function loadState() {
  const fallback = { habits: [], entries: {} };
  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(raw);
    const habits = Array.isArray(parsed.habits) ? parsed.habits : [];
    const entries = parsed.entries && typeof parsed.entries === "object" ? parsed.entries : {};
    return { habits, entries };
  } catch {
    return fallback;
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getDates() {
  const dates = [];
  const today = new Date();

  for (let offset = 0; offset < DAY_COUNT; offset += 1) {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset);
    const iso = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-");

    const label = new Intl.DateTimeFormat(undefined, {
      weekday: "short",
      month: "numeric",
      day: "numeric",
    }).format(date);

    dates.push({ iso, label });
  }

  return dates;
}

function generateHabitId() {
  return `habit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getEntry(habitId, dateISO) {
  return state.entries[habitId]?.[dateISO] || "";
}

function setEntry(habitId, dateISO, value) {
  if (!state.entries[habitId]) {
    state.entries[habitId] = {};
  }

  state.entries[habitId][dateISO] = value;
}

function cycleEntry(habitId, dateISO) {
  const current = getEntry(habitId, dateISO);
  const currentIndex = STATE_ORDER.indexOf(current);
  const nextValue = STATE_ORDER[(currentIndex + 1) % STATE_ORDER.length];
  setEntry(habitId, dateISO, nextValue);
  persistAndRender();
}

function addHabit() {
  const name = habitInput.value.trim();

  if (!name) {
    habitInput.focus();
    return;
  }

  state.habits.push({ id: generateHabitId(), name });
  habitInput.value = "";
  persistAndRender();
  habitInput.focus();
}

function removeHabit(habitId) {
  state.habits = state.habits.filter((habit) => habit.id !== habitId);
  delete state.entries[habitId];
  persistAndRender();
}

function clearDate(dateISO) {
  state.habits.forEach((habit) => {
    if (!state.entries[habit.id]) {
      return;
    }

    state.entries[habit.id][dateISO] = "";
  });

  persistAndRender();
}

function resetAllData() {
  state = { habits: [], entries: {} };
  persistAndRender();
}

function calculateProgress(dates) {
  const habitCount = state.habits.length;

  if (habitCount === 0) {
    return 0;
  }

  const activeDates = dates.filter(({ iso }) =>
    state.habits.some((habit) => {
      const value = getEntry(habit.id, iso);
      return value === "yes" || value === "no";
    })
  );

  if (activeDates.length === 0) {
    return 0;
  }

  const totalYes = activeDates.reduce((count, { iso }) => {
    return (
      count +
      state.habits.reduce((dateCount, habit) => {
        return dateCount + (getEntry(habit.id, iso) === "yes" ? 1 : 0);
      }, 0)
    );
  }, 0);

  return (totalYes / (activeDates.length * habitCount)) * 100;
}

function renderHeader(dates) {
  const headerCells = dates
    .map(
      ({ iso, label }) => `
        <th class="date-header" scope="col">
          <span class="date-label">${label}</span>
          <button class="clear-date-button" type="button" data-clear-date="${iso}">Clear</button>
        </th>
      `
    )
    .join("");

  tableHead.innerHTML = `
    <tr>
      <th class="corner-cell" scope="col">Habit</th>
      ${headerCells}
    </tr>
  `;
}

function renderBody(dates) {
  if (state.habits.length === 0) {
    tableBody.innerHTML = "";
    emptyState.hidden = false;
    return;
  }

  emptyState.hidden = true;

  const rows = state.habits
    .map((habit) => {
      const cells = dates
        .map(({ iso }) => {
          const value = getEntry(habit.id, iso);
          const symbol = value === "yes" ? "✓" : value === "no" ? "✕" : "";

          return `
            <td>
              <button
                class="status-button"
                type="button"
                data-habit-id="${habit.id}"
                data-date="${iso}"
                data-state="${value}"
                aria-label="${habit.name} on ${iso}: ${value || "blank"}"
              >${symbol}</button>
            </td>
          `;
        })
        .join("");

      return `
        <tr>
          <th class="habit-name-cell" scope="row">
            <div class="habit-row-main">
              <span class="habit-name">${escapeHtml(habit.name)}</span>
              <button class="remove-button" type="button" data-remove-habit="${habit.id}">Remove</button>
            </div>
          </th>
          ${cells}
        </tr>
      `;
    })
    .join("");

  tableBody.innerHTML = rows;
}

function renderProgress(dates) {
  const percent = calculateProgress(dates);
  const rounded = Math.round(percent);
  progressText.textContent = `${rounded}%`;
  progressFill.style.width = `${rounded}%`;
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function render() {
  const dates = getDates();
  renderHeader(dates);
  renderBody(dates);
  renderProgress(dates);
}

function persistAndRender() {
  saveState();
  render();
}

addHabitButton.addEventListener("click", addHabit);

habitInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    addHabit();
  }
});

resetButton.addEventListener("click", resetAllData);

tableHead.addEventListener("click", (event) => {
  const button = event.target.closest("[data-clear-date]");
  if (!button) {
    return;
  }

  clearDate(button.dataset.clearDate);
});

tableBody.addEventListener("click", (event) => {
  const statusButton = event.target.closest("[data-habit-id][data-date]");
  if (statusButton) {
    cycleEntry(statusButton.dataset.habitId, statusButton.dataset.date);
    return;
  }

  const removeButton = event.target.closest("[data-remove-habit]");
  if (removeButton) {
    removeHabit(removeButton.dataset.removeHabit);
  }
});

render();
