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

    nav.querySelectorAll("a").forEach((a) => {
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
      return `mailto:${encodeURIComponent(baseEmail)}?subject=${encodeURIComponent(
        subject
      )}&body=${encodeURIComponent(body)}`;
    };

    document.querySelectorAll("[data-prefill]").forEach((link) => {
      link.addEventListener("click", () => {
        const topic = link.getAttribute("data-prefill") || "Game";
        mailtoBtn.setAttribute("href", buildMailto(topic));
      });
    });
  }

  // Modal manager: handle support modal and all game modals (open/close, overlay, ESC, focus restore)
  (() => {
    let openModalEl = null;
    let lastActive = null;

    const focusableSelector = 'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])';

    const openModal = (modal) => {
      if (!modal) return;
      lastActive = document.activeElement;
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      openModalEl = modal;
      // focus first focusable element or close button
      const focusTarget = modal.querySelector(focusableSelector) || modal.querySelector('[data-close-modal]');
      if (focusTarget) focusTarget.focus();
    };

    const closeModal = (modal) => {
      if (!modal) return;
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      openModalEl = null;
      if (lastActive && lastActive.focus) lastActive.focus();
      lastActive = null;
    };

    // Bind open triggers
    document.querySelectorAll('[data-open-modal]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = btn.getAttribute('data-open-modal');
        const modal = document.getElementById(id);
        if (modal) openModal(modal);
      });
    });

    // Also support keyboard activation on elements with role=button
    document.querySelectorAll('[data-open-modal]').forEach((el) => {
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          el.click();
        }
      });
    });

    // Bind close controls inside any modal
    document.querySelectorAll('.modal').forEach((modal) => {
      // overlay
      const overlay = modal.querySelector('.modal__overlay');
      if (overlay) overlay.addEventListener('click', () => closeModal(modal));
      // close buttons
      modal.querySelectorAll('[data-close-modal]').forEach((c) => c.addEventListener('click', () => closeModal(modal)));
      // prevent clicks inside panel from closing (if overlay covers)
      const panel = modal.querySelector('.modal__panel');
      if (panel) panel.addEventListener('click', (ev) => ev.stopPropagation());
    });

    // ESC key to close currently open modal
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && openModalEl) {
        closeModal(openModalEl);
      }
    });

    // Basic focus trap: keep focus inside open modal
    document.addEventListener('focus', (e) => {
      if (!openModalEl) return;
      if (openModalEl.contains(e.target)) return;
      // move focus to modal
      const focusTarget = openModalEl.querySelector(focusableSelector) || openModalEl.querySelector('[data-close-modal]');
      if (focusTarget) focusTarget.focus();
    }, true);
  })();

  // About page: auto-highlight subnav while scrolling
  (() => {
    const subnav = document.querySelector(".subnav");
    if (!subnav) return;

    const links = Array.from(subnav.querySelectorAll('a[href^="#"]'));
    if (!links.length) return;

    const ids = links
      .map((a) => a.getAttribute("href"))
      .filter(Boolean)
      .map((h) => h.replace("#", ""))
      .filter(Boolean);

    const targets = ids
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    if (!targets.length) return;

    const setActive = (id) => {
      links.forEach((a) => {
        const on = a.getAttribute("href") === `#${id}`;
        a.classList.toggle("is-active", on);
      });
    };

    // Default
    setActive(ids[0]);

    const io = new IntersectionObserver(
      (entries) => {
        // pick the most visible intersecting entry
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio || 0) - (a.intersectionRatio || 0))[0];

        if (visible && visible.target && visible.target.id) {
          setActive(visible.target.id);
        }
      },
      {
        root: null,
        threshold: [0.2, 0.35, 0.5, 0.65],
        rootMargin: "-20% 0px -60% 0px",
      }
    );

    targets.forEach((t) => io.observe(t));
  })();
})();
