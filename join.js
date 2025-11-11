// Role filtering & sorting + simple form handling

const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));

// ---- Role Filters ----
function applyRoleFilters(){
  const team = $("#roleTeam")?.value || "";
  const q = ($("#roleSearch")?.value || "").toLowerCase();

  $$(".role-grid .role").forEach(card => {
    const teamVal = (card.dataset.team || "").toLowerCase();
    const title = (card.dataset.title || "").toLowerCase();

    let ok = true;
    if (team && teamVal !== team) ok = false;
    if (q && !(title.includes(q))) ok = false;

    card.style.display = ok ? "" : "none";
  });
}

function applyRoleSort(){
  const sort = $("#roleSort")?.value || "title-asc";
  const grid = $(".role-grid");
  const cards = $$(".role-grid .role");

  const teamOrder = { production: 0, engineering: 1, art: 2, audio: 3, qa: 4 };

  const sorted = cards.sort((a,b)=>{
    const ta = (a.dataset.title || "").toLowerCase();
    const tb = (b.dataset.title || "").toLowerCase();
    const ga = teamOrder[(a.dataset.team || "").toLowerCase()] ?? 99;
    const gb = teamOrder[(b.dataset.team || "").toLowerCase()] ?? 99;

    switch (sort){
      case "title-asc": return ta.localeCompare(tb);
      case "title-desc": return tb.localeCompare(ta);
      case "team": return ga - gb || ta.localeCompare(tb);
      default: return ta.localeCompare(tb);
    }
  });

  sorted.forEach(el => grid.appendChild(el));
}

["#roleTeam","#roleSearch","#roleSort"].forEach(sel=>{
  const el = $(sel);
  if (el) el.addEventListener("input", ()=>{ applyRoleFilters(); applyRoleSort(); });
});

// ---- Form Handling (no backend; shows a summary & opens mailto as fallback) ----
const form = $("#applyForm");
const msg = $("#formMsg");
if (form){
  form.addEventListener("submit", (e)=>{
    e.preventDefault();

    // Basic client-side validity
    if (!form.reportValidity()){
      msg.textContent = "Please complete the required fields.";
      msg.style.color = "salmon";
      return;
    }

    const data = Object.fromEntries(new FormData(form).entries());
    const summary = `Thanks, ${data.name}! We received your application for "${data.role || "Role"}".
Availability: ${data.availability || "n/a"} hrs/week
Links: ${data.links}
Reason: ${data.why || "(not provided)"}`
    msg.textContent = summary;
    msg.style.color = "";

    // Optional: open mail with prefilled body (keeps everything static-host friendly)
    const body = encodeURIComponent(
`Name: ${data.name}
Email: ${data.email}
Role: ${data.role}
Availability (hrs/week): ${data.availability || "n/a"}
Links: ${data.links}
Why this team:
${data.why || "(not provided)"}`
    );
    const mail = `mailto:terryjteng@gmail.com?subject=Rev-Share Application - ${encodeURIComponent(data.role || "Role")}&body=${body}`;
    window.open(mail, "_blank");
  });
}

// Prefill role when clicking “Apply” buttons in cards
$$('a[href="#apply"][data-role]').forEach(btn=>{
  btn.addEventListener("click",(e)=>{
    const role = btn.getAttribute("data-role");
    const select = document.querySelector('select[name="role"]');
    if (select){
      select.value = role;
      select.scrollIntoView({behavior:"smooth", block:"center"});
    }
  });
});

// Footer year (safety if main.js doesn’t catch it first)
const year = document.getElementById("year");
if (year) year.textContent = new Date().getFullYear();
