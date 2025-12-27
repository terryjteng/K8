(() => {
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // Mobile nav
  const navBtn = document.getElementById("navbtn");
  const nav = document.getElementById("nav");
  if (navBtn && nav) {
    navBtn.addEventListener("click", () => {
      const open = nav.classList.toggle("nav--open");
      navBtn.setAttribute("aria-expanded", open ? "true" : "false");
      navBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });

    nav.querySelectorAll("a").forEach(a => {
      a.addEventListener("click", () => {
        nav.classList.remove("nav--open");
        navBtn.setAttribute("aria-expanded", "false");
        navBtn.setAttribute("aria-label", "Open menu");
      });
    });
  }

  // Copy email
  const copyBtn = document.getElementById("copyEmail");
  const emailText = document.getElementById("emailText");
  if (copyBtn && emailText) {
    copyBtn.addEventListener("click", async () => {
      const text = emailText.textContent.trim();
      try {
        await navigator.clipboard.writeText(text);
        copyBtn.textContent = "Copied!";
        setTimeout(() => (copyBtn.textContent = "Copy"), 900);
      } catch {
        copyBtn.textContent = "Select + Ctrl/Cmd+C";
        setTimeout(() => (copyBtn.textContent = "Copy"), 1200);
      }
    });
  }

  // Prefill mailto from any [data-prefill]
  const mailtoBtn = document.getElementById("mailtoBtn");
  if (mailtoBtn) {
    const baseEmail = mailtoBtn.getAttribute("data-email") || "terryt.kato.8@gmail.com";

    const buildMailto = (topic) => {
      const subject = `Kato.8 — Game Funding Inquiry — ${topic}`;
      const body =
        `Game / Topic: ${topic}\n` +
        `What I'd like to fund:\n` +
        `Preferred structure (milestone funding or rev share):\n` +
        `Timeline / constraints:\n\n` +
        `Anything else:\n`;
      return `mailto:${encodeURIComponent(baseEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    };

    document.querySelectorAll("[data-prefill]").forEach(link => {
      link.addEventListener("click", () => {
        const topic = link.getAttribute("data-prefill") || "Game";
        mailtoBtn.setAttribute("href", buildMailto(topic));
      });
    });
  }

  // Support modal
(() => {
  const modal = document.getElementById("supportModal");
  const openBtn = document.getElementById("openSupportModal");
  const openNavBtn = document.getElementById("openSupportFromNav");
  const closeEls = modal ? modal.querySelectorAll("[data-close-modal]") : [];

  const setOpen = (open) => {
    if (!modal) return;
    modal.classList.toggle("is-open", open);
    modal.setAttribute("aria-hidden", open ? "false" : "true");
    document.body.style.overflow = open ? "hidden" : "";
    if (open) {
      // focus close button for accessibility
      const closeBtn = modal.querySelector("[data-close-modal]");
      closeBtn && closeBtn.focus();
    }
  };

  if (openBtn) openBtn.addEventListener("click", () => setOpen(true));
  if (openNavBtn) openNavBtn.addEventListener("click", () => setOpen(true));
  closeEls.forEach(el => el.addEventListener("click", () => setOpen(false)));

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setOpen(false);
  });

  // Toggle “what’s next”
  const toggleNotes = document.getElementById("toggleCostNotes");
  const notes = document.getElementById("costNotes");
  if (toggleNotes && notes) {
    toggleNotes.addEventListener("click", () => {
      const nowHidden = !notes.hasAttribute("hidden") ? true : false;
      if (nowHidden) notes.setAttribute("hidden", "");
      else notes.removeAttribute("hidden");
      toggleNotes.textContent = nowHidden ? 'Show “what’s next”' : 'Hide “what’s next”';
    });
  }
})();

})();
