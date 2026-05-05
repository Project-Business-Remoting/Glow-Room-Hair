// ============================================================
//  js/services.js — Catalogue des services
//  Glow Room Hair
// ============================================================

import { POLITIQUES, SERVICES_FEMMES, SERVICES_HOMMES } from "./data.js";
import { updateDOM } from "./i18n.js";
import { navigate, onPageEnter } from "./router.js";

let _rendered = false;

// ─── INIT ────────────────────────────────────────────────────

export function initServices() {
  onPageEnter("services", _onEnter);
}

// ─── PRIVATE ─────────────────────────────────────────────────

function _onEnter() {
  if (_rendered) return;
  _rendered = true;

  const section = document.getElementById("services");
  if (!section) return;

  section.innerHTML = _buildHTML();
  updateDOM();
  _bindEvents(section);
}

function _buildHTML() {
  return `
    <div class="container section">
      <header class="section-header">
        <span class="section-header__eyebrow" data-i18n="services.eyebrow">Nos prestations</span>
        <h2 class="section-header__title" data-i18n="services.title">Services &amp; Tarifs</h2>
        <div class="divider"></div>
        <p class="section-header__subtitle" data-i18n="services.subtitle">
          Tresses, locks et coiffures protectrices réalisées avec soin à Ottawa–Gatineau.
        </p>
      </header>

      <div class="services-tabs" role="tablist" aria-label="Catégorie de services">
        <button
          class="services-tab is-active"
          role="tab"
          aria-selected="true"
          aria-controls="panel-femmes"
          id="tab-femmes"
          data-tab="femmes"
          data-i18n="services.tab.femmes"
        >Femmes</button>
        <button
          class="services-tab"
          role="tab"
          aria-selected="false"
          aria-controls="panel-hommes"
          id="tab-hommes"
          data-tab="hommes"
          data-i18n="services.tab.hommes"
        >Hommes</button>
      </div>

      <div
        id="panel-femmes"
        class="services-panel is-active"
        role="tabpanel"
        aria-labelledby="tab-femmes"
      >
        ${SERVICES_FEMMES.map((s) => _buildCard(s, "femmes")).join("")}
      </div>

      <div
        id="panel-hommes"
        class="services-panel"
        role="tabpanel"
        aria-labelledby="tab-hommes"
      >
        ${SERVICES_HOMMES.map((s) => _buildCard(s, "hommes")).join("")}
      </div>

      <div class="services-page__note">
        <div class="info-box">
          <span class="info-box__icon" aria-hidden="true">ℹ</span>
          <span data-i18n="services.note">${POLITIQUES.extensions.description} Dépôt de ${POLITIQUES.depot.montant}$ requis à la réservation.</span>
        </div>
      </div>
    </div>
  `;
}

function _buildCard(service, genre) {
  const imageMap = {
    "classiques-braids-f": "images/classique-braids.jpg",
    "goddess-braids-f": "images/godess-braids.jpg",
    "french-curls-f": "images/french-curls.jpg",
    "classiques-braids-h": "images/IMAGLOWROOM-3.jpeg",
    "locks-retwist-h": "images/retwist.jpg",
    "retwist-vanille-h": "images/IMAGLOWROOM-5.jpeg",
  };
  const altMap = {
    "classiques-braids-f": "Classiques Braids — Knotless, Marley Twists",
    "goddess-braids-f": "Goddess Braids — Boho Braids",
    "french-curls-f": "French Curls — Glow Room Hair",
    "classiques-braids-h": "Classiques Braids hommes — Cornrows",
    "locks-retwist-h": "Locks Retwist hommes",
    "retwist-vanille-h": "Retwist & Vanille hommes",
  };
  const photoHTML = imageMap[service.id]
    ? `<div class="service-card__photo">
        <img src="${imageMap[service.id]}"
             alt="${altMap[service.id]}"
             loading="lazy">
      </div>`
    : "";

  const stylesTags = service.styles?.length
    ? `<div class="service-card__styles" aria-label="Styles proposés">
        ${service.styles.map((s) => `<span class="service-card__style-tag">${s}</span>`).join("")}
      </div>`
    : "";

  const variants = service.variantes
    .map(
      (v) => `
    <div
      class="service-card__variant"
      role="button"
      tabindex="0"
      aria-label="Réserver ${service.categorie} – ${v.label} ${v.prixLabel ?? v.prix + "$"}"
      data-variant-id="${v.id}"
      data-service-id="${service.id}"
      data-categorie="${service.categorie}"
      data-label="${v.label}"
      data-prix="${v.prix ?? ""}"
      data-prix-label="${v.prixLabel ?? v.prix + "$"}"
      data-genre="${genre}"
    >
      <span class="service-card__variant-label" data-i18n="var.${v.id}">${v.label}</span>
      <span class="service-card__variant-price">${v.prixLabel ?? v.prix + "$"}</span>
    </div>
  `,
    )
    .join("");

  return `
    <article class="service-card fade-in" data-service-id="${service.id}">
      ${photoHTML}
      <h3 class="service-card__title" data-i18n="cat.${service.id}">${service.categorie}</h3>
      ${stylesTags}
      <div class="service-card__variants">${variants}</div>
    </article>
  `;
}

function _bindEvents(section) {
  // Onglets Femmes / Hommes
  section.querySelector(".services-tabs").addEventListener("click", (e) => {
    const tab = e.target.closest("[data-tab]");
    if (!tab || tab.classList.contains("is-active")) return;

    const genre = tab.dataset.tab;

    section.querySelectorAll(".services-tab").forEach((t) => {
      t.classList.toggle("is-active", t.dataset.tab === genre);
      t.setAttribute("aria-selected", String(t.dataset.tab === genre));
    });

    section.querySelectorAll(".services-panel").forEach((p) => {
      p.classList.toggle("is-active", p.id === `panel-${genre}`);
    });
  });

  // Clic sur une variante → pré-sélection + navigation vers le tunnel
  section.addEventListener("click", (e) => {
    const variant = e.target.closest(".service-card__variant");
    if (!variant) return;

    // Effacer la sélection précédente dans tous les panels
    section
      .querySelectorAll(".service-card__variant.is-selected")
      .forEach((v) => v.classList.remove("is-selected"));

    variant.classList.add("is-selected");
    variant.closest(".service-card")?.classList.add("is-selected");

    // Transmettre la sélection à booking.js via événement personnalisé
    document.dispatchEvent(
      new CustomEvent("app:service-selected", {
        detail: {
          serviceId: variant.dataset.serviceId,
          variantId: variant.dataset.variantId,
          categorie: variant.dataset.categorie,
          label: variant.dataset.label,
          prix: variant.dataset.prix ? Number(variant.dataset.prix) : null,
          prixLabel: variant.dataset.prixLabel,
          genre: variant.dataset.genre,
        },
      }),
    );

    navigate("reservation");
  });

  // Accessibilité : Entrée/Espace déclenchent le clic sur les variantes
  section.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const variant = e.target.closest(".service-card__variant");
    if (variant) {
      e.preventDefault();
      variant.click();
    }
  });
}
