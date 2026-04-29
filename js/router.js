// ============================================================
//  js/router.js — Navigation SPA (hash-based)
//  Glow Room Studio
//
//  Usage depuis les autres modules :
//    import { navigate, onPageEnter } from './router.js';
//    navigate('services');
//    onPageEnter('reservation', () => initBooking());
//
//  Dans le HTML, tout déclencheur de navigation utilise data-nav :
//    <a class="navbar__link" data-nav="services" href="#services">Services</a>
//    <button data-nav="reservation">Réserver</button>
// ============================================================

// Pages valides — doit correspondre aux id des éléments .page dans index.html
const VALID_PAGES = [
  "accueil",
  "a-propos",
  "services",
  "reservation",
  "avis",
  "politiques",
  "contact",
  "admin",
];
const DEFAULT_PAGE = "accueil";

// Callbacks déclenchés à l'entrée d'une page spécifique
// Map<pageId, Set<Function>>
const _enterCallbacks = new Map();

let _currentPage = null;

// ─── NAVIGATE ────────────────────────────────────────────────
// Options :
//   replace (bool) — remplace l'entrée history au lieu d'en créer une nouvelle
//                    utilisé lors de l'init et du popstate pour ne pas polluer l'historique

export function navigate(pageId, { replace = false } = {}) {
  const target = VALID_PAGES.includes(pageId) ? pageId : DEFAULT_PAGE;

  // Pas de re-render si on est déjà sur la bonne page
  // Exception : replace=true permet de forcer la mise à jour du DOM à l'init
  if (target === _currentPage && !replace) return;

  // ── DOM : affichage des sections ──
  document.querySelectorAll(".page").forEach((el) => {
    el.classList.toggle("page--active", el.id === target);
  });

  // ── DOM : liens actifs dans la navbar ──
  document.querySelectorAll("[data-nav]").forEach((el) => {
    if (el.classList.contains("navbar__link")) {
      el.classList.toggle("is-active", el.dataset.nav === target);
    }
  });

  // ── URL : mise à jour du hash sans rechargement ──
  // On efface le hash pour la page par défaut (URL propre)
  const hash =
    target === DEFAULT_PAGE ? window.location.pathname : `#${target}`;
  if (replace) {
    history.replaceState({ page: target }, "", hash);
  } else {
    history.pushState({ page: target }, "", hash);
  }

  // Scroll immédiat en haut — 'instant' pour ne pas interférer avec fadeSlide
  window.scrollTo({ top: 0, behavior: "instant" });

  const previous = _currentPage;
  _currentPage = target;

  // ── Événement global — permet à main.js de fermer le menu mobile sans import circulaire ──
  document.dispatchEvent(
    new CustomEvent("router:navigate", { detail: { page: target, previous } }),
  );

  // ── Callbacks enregistrés via onPageEnter ──
  _enterCallbacks.get(target)?.forEach((cb) => {
    try {
      cb({ page: target, previous });
    } catch (err) {
      console.error(`[router] Erreur callback "${target}":`, err);
    }
  });
}

// ─── ON PAGE ENTER ───────────────────────────────────────────
// Abonner un module à l'activation d'une page.
// Le callback reçoit { page, previous }.
// Appels multiples pour le même pageId accumulent les callbacks (pas de remplacement).

export function onPageEnter(pageId, callback) {
  if (!VALID_PAGES.includes(pageId)) {
    console.warn(`[router] onPageEnter : page inconnue "${pageId}"`);
    return;
  }
  if (!_enterCallbacks.has(pageId)) {
    _enterCallbacks.set(pageId, new Set());
  }
  _enterCallbacks.get(pageId).add(callback);
}

// ─── GET CURRENT PAGE ────────────────────────────────────────

export function getCurrentPage() {
  return _currentPage;
}

// ─── INIT ────────────────────────────────────────────────────
// À appeler une seule fois depuis main.js après le DOMContentLoaded.

export function initRouter() {
  // Délégation globale : capture tous les [data-nav] présents et futurs dans le DOM
  document.addEventListener("click", (e) => {
    const trigger = e.target.closest("[data-nav]");
    if (!trigger) return;
    e.preventDefault();
    navigate(trigger.dataset.nav);
  });

  // Bouton retour / avant du navigateur
  window.addEventListener("popstate", (e) => {
    const page = e.state?.page ?? _pageFromHash();
    // replace=true : le popstate n'est pas une nouvelle navigation intentionnelle
    navigate(page, { replace: true });
  });

  // Page initiale
  navigate(_pageFromHash(), { replace: true });
}

// ─── HELPER INTERNE ──────────────────────────────────────────

function _pageFromHash() {
  const hash = window.location.hash.replace("#", "").trim();
  return VALID_PAGES.includes(hash) ? hash : DEFAULT_PAGE;
}
