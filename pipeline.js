// --- Helpers ---
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));

// Map stage sort weight for stable ordering
const STAGE_ORDER = { concept: 0, prealpha: 1, prototype: 2, verticalslice: 3 };

// Normalize budget (string ranges) into a comparable bucket
function budgetBucket(article) {
  // Prefer data-budgetclass if present (normalized), else infer from data-budget
  const cls = article.dataset.budgetclass;
  if (cls) return cls; // e.g., "100to150"
  const raw = article.dataset.budget || "";
  if (/^\d+to\d+$/i.test(raw)) return raw.toLowerCase();
  if (/^lt100$/i.test(raw)) return "lt100";
  if (/^gt150$/i.test(raw)) return "gt150";
  // Fallback: try to parse min from text (not ideal but safe)
  return "100to150";
}

// Normalize timeline into buckets
function timelineBucket(article){
  const tl = (article.dataset.timeline || "").toLowerCase();
  if (["lt16","16to32","gt32"].includes(tl)) return tl;
  return "16to32";
}

// --- Filtering ---
function applyFilters(){
  const stageVal = $("#filterStage").value;
  const budgetVal = $("#filterBudget").value;
  const timelineVal = $("#filterTimeline").value;
  const searchVal = $("#filterSearch").value.trim().toLowerCase();

  $$("#pipelineGrid .card").forEach(card => {
    const stage = (card.dataset.stage || "").toLowerCase();
    const budget = budgetBucket(card);
    const timeline = timelineBucket(card);
    const hay = (card.dataset.title + " " + (card.dataset.tags || "")).toLowerCase();

    let ok = true;
    if (stageVal && stage !== stageVal) ok = false;

    if (budgetVal) {
      // Map filter bucket
      if (budgetVal === "lt100" && budget !== "lt100") ok = false;
      if (budgetVal === "100to150" && !["100to150","75to125","80to140","90to150"].includes(budget)) ok = false;
      if (budgetVal === "gt150" && budget !== "gt150") ok = false;
    }

    if (timelineVal && timeline !== timelineVal) ok = false;

    if (searchVal && !hay.includes(searchVal)) ok = false;

    card.style.display = ok ? "" : "none";
  });
}

// --- Sorting ---
function applySort(){
  const sortBy = $("#sortBy").value;
  const grid = $("#pipelineGrid");
  const cards = $$("#pipelineGrid .card");

  const sorted = cards.sort((a, b) => {
    const ta = (a.dataset.title || "").toLowerCase();
    const tb = (b.dataset.title || "").toLowerCase();
    const sa = STAGE_ORDER[(a.dataset.stage || "").toLowerCase()] ?? 99;
    const sb = STAGE_ORDER[(b.dataset.stage || "").toLowerCase()] ?? 99;
    const ba = budgetBucket(a);
    const bb = budgetBucket(b);
    const tla = timelineBucket(a);
    const tlb = timelineBucket(b);

    switch (sortBy) {
      case "title-asc": return ta.localeCompare(tb);
      case "title-desc": return tb.localeCompare(ta);
      case "stage": return sa - sb || ta.localeCompare(tb);
      case "budget": return ba.localeCompare(bb) || ta.localeCompare(tb);
      case "timeline":
        // lt16 < 16to32 < gt32
        const order = { "lt16": 0, "16to32": 1, "gt32": 2 };
        return (order[tla] ?? 1) - (order[tlb] ?? 1) || ta.localeCompare(tb);
      default: return ta.localeCompare(tb);
    }
  });

  // Re-append in new order
  sorted.forEach(el => grid.appendChild(el));
}

// --- Wire up ---
["#filterStage","#filterBudget","#filterTimeline","#filterSearch","#sortBy"].forEach(sel => {
  const node = $(sel);
  if (node) node.addEventListener("input", () => { applyFilters(); applySort(); });
});

// Initial run after DOM ready
document.addEventListener("DOMContentLoaded", () => {
  applyFilters();
  applySort();

  // Update footer year
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
});
