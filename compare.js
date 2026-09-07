// Party comparison page — load up to 10 saved .txt results and plot them together.
// Shared scoring/chart/export helpers live in common.js.

const MAX_CHARACTERS = 10;

function makeId() {
  return (crypto.randomUUID && crypto.randomUUID()) || `char-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function init() {
  // state.characters is stored back-to-front: index 0 paints first (furthest
  // back), the last element paints last (frontmost). The Layers panel displays
  // it front-first (reversed) to match the usual "top of the list = in front"
  // convention, and reorders translate back into this storage order.
  const state = { characters: [] };
  let draggedId = null;

  const fileInput = document.getElementById("file-input");
  const addButton = document.getElementById("add-characters");
  const clearButton = document.getElementById("clear-all");
  const downloadButton = document.getElementById("download-combined-png");
  const listEl = document.getElementById("character-list");
  const emptyState = document.getElementById("empty-state");
  const countEl = document.getElementById("character-count");
  const fileWarning = document.getElementById("file-warning");
  const chartContainer = document.getElementById("compare-chart-container");
  const layersPanel = document.getElementById("layers-panel");

  function escapeHTML(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function displayOrder() {
    // Front-first: reverse of storage order.
    return [...state.characters].reverse();
  }

  function reorderFromDisplayIds(displayIds) {
    const byId = new Map(state.characters.map((c) => [c.id, c]));
    state.characters = displayIds
      .map((id) => byId.get(id))
      .filter(Boolean)
      .reverse();
  }

  function moveInDisplay(id, delta) {
    const order = displayOrder().map((c) => c.id);
    const index = order.indexOf(id);
    if (index === -1) return;
    const target = Math.max(0, Math.min(order.length - 1, index + delta));
    if (target === index) return;
    order.splice(index, 1);
    order.splice(target, 0, id);
    reorderFromDisplayIds(order);
    render();
  }

  function render() {
    const entries = state.characters.map((c) => ({
      axis1: c.axis1,
      axis2: c.axis2,
      name: c.name,
      color: c.color,
    }));

    chartContainer.innerHTML = buildCompareChartSVG(entries);

    const ordered = displayOrder();
    listEl.innerHTML = "";
    ordered.forEach((c, i) => {
      const archetype = archetypeFor(c.axis1, c.axis2);
      const item = document.createElement("li");
      item.className = "character-row";
      item.draggable = true;
      item.dataset.id = c.id;
      item.innerHTML = `
        <span class="drag-handle" aria-hidden="true">⠿</span>
        <span class="color-swatch" style="background:${c.color}; color:${c.color}"></span>
        <span class="character-info">
          <span class="character-name">${escapeHTML(c.name)}</span>
          <span class="character-detail">${archetype.name} · Axis I ${formatScore(c.axis1)}, Axis II ${formatScore(c.axis2)}</span>
        </span>
        <span class="reorder-buttons">
          <button type="button" class="reorder-btn" data-dir="-1" aria-label="Move ${escapeHTML(c.name)} forward" ${i === 0 ? "disabled" : ""}>▲</button>
          <button type="button" class="reorder-btn" data-dir="1" aria-label="Move ${escapeHTML(c.name)} backward" ${i === ordered.length - 1 ? "disabled" : ""}>▼</button>
        </span>
        <button type="button" class="remove-character" aria-label="Remove ${escapeHTML(c.name)}" data-id="${c.id}">✕</button>
      `;
      listEl.appendChild(item);
    });

    countEl.textContent = `${state.characters.length} / ${MAX_CHARACTERS} added`;
    emptyState.hidden = state.characters.length > 0;
    layersPanel.hidden = state.characters.length === 0;
    downloadButton.disabled = state.characters.length === 0;
    clearButton.hidden = state.characters.length === 0;
    addButton.disabled = state.characters.length >= MAX_CHARACTERS;
    fileInput.disabled = state.characters.length >= MAX_CHARACTERS;
  }

  async function addFiles(fileList) {
    fileWarning.hidden = true;
    fileWarning.textContent = "";
    const files = Array.from(fileList);
    const room = MAX_CHARACTERS - state.characters.length;
    const toAdd = files.slice(0, room);
    const overflow = files.length - toAdd.length;

    const errors = [];
    for (const file of toAdd) {
      try {
        const text = await readFileAsText(file);
        const parsed = JSON.parse(text);
        const normalized = normalizeResultRecord(parsed);
        state.characters.push({
          id: makeId(),
          name: normalized.characterName,
          axis1: normalized.axis1,
          axis2: normalized.axis2,
          color: CHARACTER_COLORS[state.characters.length % CHARACTER_COLORS.length],
        });
      } catch (err) {
        errors.push(`${file.name}: ${err.message || "could not be read"}`);
      }
    }

    if (overflow > 0) {
      errors.push(`Only room for ${room} more — ${overflow} file${overflow === 1 ? "" : "s"} skipped (limit is ${MAX_CHARACTERS}).`);
    }
    if (errors.length) {
      fileWarning.hidden = false;
      fileWarning.textContent = errors.join(" ");
    }

    render();
  }

  addButton.addEventListener("click", () => fileInput.click());

  fileInput.addEventListener("change", () => {
    if (fileInput.files.length) addFiles(fileInput.files);
    fileInput.value = "";
  });

  listEl.addEventListener("click", (event) => {
    const removeBtn = event.target.closest(".remove-character");
    if (removeBtn) {
      state.characters = state.characters.filter((c) => c.id !== removeBtn.dataset.id);
      render();
      return;
    }
    const reorderBtn = event.target.closest(".reorder-btn");
    if (reorderBtn) {
      const row = reorderBtn.closest(".character-row");
      moveInDisplay(row.dataset.id, Number(reorderBtn.dataset.dir));
    }
  });

  // --- Drag-and-drop reordering of layer rows -----------------------------

  listEl.addEventListener("dragstart", (event) => {
    const row = event.target.closest(".character-row");
    if (!row) return;
    draggedId = row.dataset.id;
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", draggedId);
    row.classList.add("dragging");
  });

  listEl.addEventListener("dragend", () => {
    draggedId = null;
    listEl.querySelectorAll(".character-row").forEach((row) => {
      row.classList.remove("dragging", "drag-over-top", "drag-over-bottom");
    });
  });

  listEl.addEventListener("dragover", (event) => {
    event.preventDefault();
    const row = event.target.closest(".character-row");
    if (!row || row.dataset.id === draggedId) return;
    const rect = row.getBoundingClientRect();
    const before = event.clientY - rect.top < rect.height / 2;
    listEl.querySelectorAll(".character-row").forEach((r) => r.classList.remove("drag-over-top", "drag-over-bottom"));
    row.classList.add(before ? "drag-over-top" : "drag-over-bottom");
  });

  listEl.addEventListener("drop", (event) => {
    event.preventDefault();
    const row = event.target.closest(".character-row");
    listEl.querySelectorAll(".character-row").forEach((r) => r.classList.remove("drag-over-top", "drag-over-bottom", "dragging"));
    if (!row || !draggedId || row.dataset.id === draggedId) {
      draggedId = null;
      return;
    }

    const order = displayOrder().map((c) => c.id);
    const fromIndex = order.indexOf(draggedId);
    if (fromIndex === -1) {
      draggedId = null;
      return;
    }
    order.splice(fromIndex, 1);

    const rect = row.getBoundingClientRect();
    const before = event.clientY - rect.top < rect.height / 2;
    let targetIndex = order.indexOf(row.dataset.id);
    if (!before) targetIndex += 1;
    order.splice(targetIndex, 0, draggedId);

    reorderFromDisplayIds(order);
    draggedId = null;
    render();
  });

  clearButton.addEventListener("click", () => {
    state.characters = [];
    render();
  });

  downloadButton.addEventListener("click", async () => {
    if (!state.characters.length) return;
    const svgEl = document.querySelector("#compare-chart-container svg");
    const original = downloadButton.textContent;
    downloadButton.textContent = "Preparing…";
    try {
      await exportChartPNG({
        svgElement: svgEl,
        filename: "party-worldview-comparison.png",
        title: "Party Worldview Comparison",
        subtitle: `${state.characters.length} character${state.characters.length === 1 ? "" : "s"}`,
        legend: displayOrder().map((c) => ({ color: c.color, label: c.name })),
      });
    } catch (err) {
      downloadButton.textContent = "Download failed";
      setTimeout(() => {
        downloadButton.textContent = original;
      }, 1800);
      return;
    }
    downloadButton.textContent = original;
  });

  // Drag-and-drop onto the drop zone as a second way to add files.
  const dropZone = document.getElementById("drop-zone");
  ["dragenter", "dragover"].forEach((evt) =>
    dropZone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropZone.classList.add("drag-active");
    })
  );
  ["dragleave", "drop"].forEach((evt) =>
    dropZone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropZone.classList.remove("drag-active");
    })
  );
  dropZone.addEventListener("drop", (e) => {
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  });

  render();
}

document.addEventListener("DOMContentLoaded", init);
