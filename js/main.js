// ============================================================
//  js/main.js — Point d'entrée global
//  Glow Room Studio
//
//  Ce fichier orchestre uniquement — aucune logique métier.
// ============================================================

import { initAdmin } from "./admin.js";
import { initBooking } from "./booking.js";
import { initContact } from "./contact.js";
import { initReviews } from "./reviews.js";
import { initRouter } from "./router.js";
import { initServices } from "./services.js";
import { getLang, setLang, updateDOM } from "./i18n.js";

// ─── BOOTSTRAP ───────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  // Les modules doivent enregistrer leurs callbacks onPageEnter AVANT
  // initRouter(), car navigate() est synchrone et déclenche immédiatement
  // les callbacks de la page initiale.
  initServices();
  initReviews();
  initContact();
  initBooking();
  initAdmin();

  _setupI18n();

  _setupMobileMenu();
  _setupToasts();
  _setupScrollAnimations();

  // En dernier : déclenche la navigation initiale vers la page du hash courant
  initRouter();

  // Réveil anticipé du backend (Render cold start)
  _warmUpBackend();
});

async function _warmUpBackend() {
  try {
    // On ping la route health pour réveiller le serveur Render
    fetch('https://glow-room-backend.onrender.com/health').catch(() => {});
  } catch (e) {}
}

// ─── I18N ────────────────────────────────────────────────────

function _setupI18n() {
  updateDOM();
  const langToggle = document.getElementById('lang-toggle');
  if (langToggle) {
    langToggle.textContent = getLang() === 'fr' ? 'EN' : 'FR';
    langToggle.addEventListener('click', () => {
      const current = getLang();
      const nextLang = current === 'fr' ? 'en' : 'fr';
      setLang(nextLang);
      langToggle.textContent = nextLang === 'fr' ? 'EN' : 'FR';
    });
  }
}

// ─── MENU MOBILE ─────────────────────────────────────────────

function _setupMobileMenu() {
  const toggle = document.querySelector(".navbar__toggle");
  const menu = document.querySelector(".navbar__menu");
  const overlay = document.querySelector(".navbar__overlay");

  if (!toggle || !menu) return;

  function _open() {
    toggle.classList.add("is-active");
    menu.classList.add("is-open");
    overlay?.classList.add("is-open");
    toggle.setAttribute("aria-expanded", "true");
    menu.setAttribute("aria-hidden", "false");
  }

  function _close() {
    document.activeElement.blur();
    toggle.classList.remove("is-active");
    menu.classList.remove("is-open");
    overlay?.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    menu.setAttribute("aria-hidden", "true");
  }

  toggle.addEventListener("click", () =>
    toggle.classList.contains("is-active") ? _close() : _open(),
  );

  overlay?.addEventListener("click", _close);

  // Fermeture clavier (Escape) et après chaque navigation SPA
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") _close();
  });
  document.addEventListener("router:navigate", _close);
}

// ─── TOASTS ──────────────────────────────────────────────────

const _DURATION = 4000;

const _ICONS = { success: "✓", error: "✕", info: "ℹ" };

function _setupToasts() {
  const container = document.createElement("div");
  container.className = "toast-container";
  // polite : les messages ne coupent pas le lecteur d'écran (sauf role=alert sur les erreurs)
  container.setAttribute("aria-live", "polite");
  container.setAttribute("aria-atomic", "false");
  document.body.appendChild(container);

  document.addEventListener("app:toast", ({ detail }) => {
    _showToast(container, String(detail.message ?? ""), detail.type ?? "info");
  });
}

function _showToast(container, message, type) {
  const toast = document.createElement("div");
  toast.className = `toast toast--${type}`;

  // Les erreurs interrompent le lecteur d'écran sans attendre la politesse
  if (type === "error") toast.setAttribute("role", "alert");

  toast.innerHTML = `
    <span class="toast__icon" aria-hidden="true">${_ICONS[type] ?? _ICONS.info}</span>
    <span class="toast__text">${_esc(message)}</span>
  `;

  container.appendChild(toast);

  const timer = setTimeout(() => _dismiss(toast), _DURATION);

  // Clic sur le toast = fermeture immédiate
  toast.addEventListener(
    "click",
    () => {
      clearTimeout(timer);
      _dismiss(toast);
    },
    { once: true },
  );
}

function _dismiss(toast) {
  if (!toast.isConnected) return;
  toast.classList.add("is-hiding");
  // Attendre la fin de l'animation toastOut (0.22s) avant de retirer l'élément
  toast.addEventListener("animationend", () => toast.remove(), { once: true });
}

// ─── ANIMATIONS SCROLL ───────────────────────────────────────

function _setupScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target); // Animation jouée une seule fois
      }
    });
  }, { threshold: 0.05, rootMargin: "0px 0px -40px 0px" });

  const observeElements = () => {
    document.querySelectorAll('.fade-in:not(.is-visible)').forEach(el => observer.observe(el));
  };

  observeElements();
  // Relancer l'observation après navigation ou injection de DOM
  document.addEventListener('router:navigate', () => setTimeout(observeElements, 100));
  // Pour les avis et services qui s'injectent
  const mutationObserver = new MutationObserver(() => observeElements());
  mutationObserver.observe(document.body, { childList: true, subtree: true });
}

// ─── UTILITAIRE ──────────────────────────────────────────────

// Protection XSS pour les messages injectés dans le HTML des toasts
function _esc(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
