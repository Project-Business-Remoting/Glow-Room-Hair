// ============================================================
//  js/booking.js — Tunnel de réservation (6 étapes)
//  Glow Room Studio
//
//  Flux : S0 Bienvenue → S1 Service → S2 Date/Heure
//         → S3 Infos → S4 Dépôt → S5 Confirmation
// ============================================================

import {
  HORAIRES,
  METHODES_PAIEMENT,
  POLITIQUES,
  SERVICES_FEMMES,
  SERVICES_HOMMES,
} from "./data.js";
import { onPageEnter } from "./router.js";

// ─── ÉTAT CENTRAL ────────────────────────────────────────────

const B = {
  step: 0,
  service: null, // { serviceId, variantId, categorie, label, prix, prixLabel, genre }
  date: null, // 'YYYY-MM-DD'
  time: null, // 'HH:MM'
  name: "",
  phone: "",
  email: "",
  paymentMethod: null, // id de la méthode choisie dans METHODES_PAIEMENT
};

// Mois affiché dans le calendrier — indépendant de B.date
let _calYear = null;
let _calMonth = null; // 0-indexed

let _initialized = false;

// ─── CONSTANTS ───────────────────────────────────────────────

// Date.getDay() retourne 0=Dim, 1=Lun, … → HORAIRES[0]=Lundi … HORAIRES[6]=Dimanche
const JS_TO_HORAIRES_IDX = [6, 0, 1, 2, 3, 4, 5];

const MONTH_NAMES = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];
const DAY_ABBREVS = ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"];

// ─── INIT PUBLIC ─────────────────────────────────────────────

export function initBooking() {
  onPageEnter("reservation", _onEnter);

  // Pré-remplir B.service si l'utilisateur arrive depuis le catalogue
  document.addEventListener("app:service-selected", (e) => {
    B.service = { ...e.detail };
  });
}

// ─── PAGE ENTER ──────────────────────────────────────────────

function _onEnter() {
  const section = document.getElementById("reservation");
  if (!section) return;

  if (!_initialized) {
    // Conteneur persistant — les events sont bindés une seule fois ici
    section.innerHTML = `<div class="booking-page" id="booking-root"></div>`;
    _bindEvents(document.getElementById("booking-root"));
    _initialized = true;
  }

  // Après une confirmation, la prochaine visite repart de zéro
  if (B.step === 5) _resetState();

  // Sauter l'écran de bienvenue si un service est déjà choisi depuis le catalogue
  if (B.service && B.step === 0) B.step = 1;

  _renderStep(B.step);
}

// ─── RENDER ──────────────────────────────────────────────────

function _renderStep(step) {
  const root = document.getElementById("booking-root");
  if (!root) return;
  B.step = step;

  root.innerHTML = `
    ${step >= 2 && step <= 4 ? _buildSummary() : ""}
    ${step >= 1 && step <= 4 ? _buildIndicator() : ""}
    <div class="booking-step">
      ${_buildStepHTML(step)}
    </div>
  `;

  // Le calendrier est injecté séparément pour pouvoir être mis à jour sans re-render
  if (step === 2) {
    const now = new Date();
    if (_calYear === null) _calYear = now.getFullYear();
    if (_calMonth === null) _calMonth = now.getMonth();
    _refreshCalendar(root);
    if (B.date) _refreshSlots(root);
  }
}

// ─── INDICATEUR & RÉCAPITULATIF ───────────────────────────────

function _buildIndicator() {
  const dots = [1, 2, 3, 4]
    .map((s) => {
      const cls = s < B.step ? "is-done" : s === B.step ? "is-active" : "";
      return `<span class="step-dot ${cls}" aria-hidden="true"></span>`;
    })
    .join("");
  return `<div class="steps-indicator" aria-label="Étape ${B.step} sur 4">${dots}</div>`;
}

function _buildSummary() {
  const items = [];
  if (B.service) {
    items.push({ label: "Service", value: B.service.categorie });
    items.push({
      label: "Option",
      value: `${B.service.label} — ${B.service.prixLabel}`,
    });
  }
  if (B.date) items.push({ label: "Date", value: _formatDateFR(B.date) });
  if (B.time) items.push({ label: "Heure", value: B.time });
  if (!items.length) return "";

  return `
    <div class="booking-summary">
      ${items
        .map(
          ({ label, value }) => `
        <div class="booking-summary__item">
          <span class="booking-summary__label">${label}</span>
          <span class="booking-summary__value">${_esc(value)}</span>
        </div>`,
        )
        .join("")}
    </div>`;
}

// ─── STEPS HTML ──────────────────────────────────────────────

function _buildStepHTML(step) {
  switch (step) {
    case 0:
      return _buildS0();
    case 1:
      return _buildS1();
    case 2:
      return _buildS2();
    case 3:
      return _buildS3();
    case 4:
      return _buildS4();
    case 5:
      return _buildS5();
    default:
      return _buildS0();
  }
}

// S0 — Bienvenue
function _buildS0() {
  return `
    <div class="booking-confirmation">
      <div class="booking-confirmation__icon">✂️</div>
      <h2 class="booking-confirmation__title">Réservez votre rendez-vous</h2>
      <p class="booking-confirmation__text">
        Choisissez votre service, une date et finalisez en quelques étapes.
        Un dépôt de <strong>${POLITIQUES.depot.montant}$</strong> (non remboursable)
        est requis pour confirmer le rendez-vous.
      </p>
      <div style="display:flex;justify-content:center;margin-top:var(--space-xl);">
        <button type="button" class="btn btn-dark btn--lg" data-action="start">
          Commencer la réservation
        </button>
      </div>
    </div>`;
}

// S1 — Choix du service
function _buildS1() {
  const genre = B.service?.genre ?? "femmes";
  const hasChoice = !!B.service;

  return `
    <h2 class="booking-step__title">Quel service souhaitez-vous ?</h2>
    <p class="booking-step__subtitle">Sélectionnez un service et une option pour continuer.</p>

    <div class="services-tabs" role="tablist">
      ${["femmes", "hommes"]
        .map(
          (g) => `
        <button type="button"
          class="services-tab ${g === genre ? "is-active" : ""}"
          role="tab"
          aria-selected="${g === genre}"
          aria-controls="s1-panel-${g}"
          data-booking-tab="${g}"
        >${g.charAt(0).toUpperCase() + g.slice(1)}</button>
      `,
        )
        .join("")}
    </div>

    <div id="s1-panel-femmes" class="services-panel ${genre === "femmes" ? "is-active" : ""}" role="tabpanel">
      ${SERVICES_FEMMES.map((s) => _buildServiceCard(s, "femmes")).join("")}
    </div>
    <div id="s1-panel-hommes" class="services-panel ${genre === "hommes" ? "is-active" : ""}" role="tabpanel">
      ${SERVICES_HOMMES.map((s) => _buildServiceCard(s, "hommes")).join("")}
    </div>

    <div class="booking-nav">
      <button type="button" class="btn-back" data-action="prev">Retour</button>
      <button type="button" class="btn btn-dark" data-action="next"
        ${!hasChoice ? 'disabled aria-disabled="true"' : ""}>
        Continuer
      </button>
    </div>`;
}

function _buildServiceCard(service, genre) {
  const tags = service.styles?.length
    ? `<div class="service-card__styles">
        ${service.styles.map((s) => `<span class="service-card__style-tag">${s}</span>`).join("")}
       </div>`
    : "";

  const variants = service.variantes
    .map((v) => {
      const sel = B.service?.variantId === v.id;
      return `
      <button type="button"
        class="service-card__variant ${sel ? "is-selected" : ""}"
        data-booking-variant
        data-service-id="${service.id}"
        data-variant-id="${v.id}"
        data-categorie="${service.categorie}"
        data-label="${v.label}"
        data-prix="${v.prix ?? ""}"
        data-prix-label="${v.prixLabel ?? v.prix + "$"}"
        data-genre="${genre}"
        aria-pressed="${sel}"
      >
        <span class="service-card__variant-label">${v.label}</span>
        <span class="service-card__variant-price">${v.prixLabel ?? v.prix + "$"}</span>
      </button>`;
    })
    .join("");

  return `
    <article class="service-card ${B.service?.serviceId === service.id ? "is-selected" : ""}">
      <h3 class="service-card__title">${service.categorie}</h3>
      ${tags}
      <div class="service-card__variants">${variants}</div>
    </article>`;
}

// S2 — Date & Heure
function _buildS2() {
  const ready = !!(B.date && B.time);
  return `
    <h2 class="booking-step__title">Date &amp; Heure</h2>
    <p class="booking-step__subtitle">Choisissez une date disponible, puis un créneau horaire.</p>

    <div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-md);">
        <button type="button" class="btn btn-ghost btn--sm" data-action="cal-prev">◀</button>
        <strong data-cal-month
          style="font-family:var(--font-serif);color:var(--brown);font-size:var(--fs-md);"></strong>
        <button type="button" class="btn btn-ghost btn--sm" data-action="cal-next">▶</button>
      </div>
      <div class="booking-calendar" data-cal-grid></div>
    </div>

    <div data-slots-container></div>

    <div class="booking-nav">
      <button type="button" class="btn-back" data-action="prev">Retour</button>
      <button type="button" class="btn btn-dark" data-action="next"
        ${!ready ? 'disabled aria-disabled="true"' : ""}>
        Continuer
      </button>
    </div>`;
}

// S3 — Informations personnelles
function _buildS3() {
  return `
    <h2 class="booking-step__title">Vos informations</h2>
    <p class="booking-step__subtitle">
      Ces informations nous permettront de confirmer votre rendez-vous par email.
    </p>

    <form id="booking-form-s3" novalidate
      style="display:flex;flex-direction:column;gap:var(--space-md);">
      <div class="form-row form-row--2">
        <div class="form-group">
          <label class="form-label form-label--required" for="b-nom">Nom complet</label>
          <input class="form-input" type="text" id="b-nom" name="nom"
            autocomplete="name" placeholder="Votre nom complet"
            value="${_esc(B.name)}" />
          <span class="form-error" id="err-nom" aria-live="polite"></span>
        </div>
        <div class="form-group">
          <label class="form-label form-label--required" for="b-tel">Téléphone</label>
          <input class="form-input" type="tel" id="b-tel" name="phone"
            autocomplete="tel" placeholder="(613) 555-0123"
            value="${_esc(B.phone)}" />
          <span class="form-error" id="err-phone" aria-live="polite"></span>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label form-label--required" for="b-email">Email</label>
        <input class="form-input" type="email" id="b-email" name="email"
          autocomplete="email" placeholder="votre@email.com"
          value="${_esc(B.email)}" />
        <span class="form-error" id="err-email" aria-live="polite"></span>
      </div>
    </form>

    <div class="booking-nav">
      <button type="button" class="btn-back" data-action="prev">Retour</button>
      <button type="button" class="btn btn-dark" data-action="next">Continuer</button>
    </div>`;
}

// S4 — Dépôt & Méthode de paiement
function _buildS4() {
  const isInterac = B.paymentMethod === "interac-etransfer";
  const interac = METHODES_PAIEMENT.find((m) => m.id === "interac-etransfer");
  const btnLabel = isInterac
    ? "Confirmer ma réservation"
    : `Procéder au paiement — ${POLITIQUES.depot.montant}$`;

  return `
    <h2 class="booking-step__title">Dépôt de réservation</h2>
    <p class="booking-step__subtitle">
      Choisissez votre méthode de paiement pour verser le dépôt de ${POLITIQUES.depot.montant}$.
    </p>

    <div class="payment-methods" role="radiogroup" aria-label="Choisir une méthode de paiement">
      ${METHODES_PAIEMENT.filter((m) => m.actif)
        .map(
          (m) => `
        <button type="button"
          class="payment-method ${B.paymentMethod === m.id ? "is-selected" : ""}"
          role="radio"
          aria-checked="${B.paymentMethod === m.id}"
          data-payment-method="${m.id}"
        >
          <span class="payment-method__radio"></span>
          <span>
            <span class="payment-method__label">${m.label}</span>
            ${m.description ? `<span class="payment-method__note">${m.description}</span>` : ""}
          </span>
        </button>`,
        )
        .join("")}
    </div>

    ${
      isInterac && interac?.note
        ? `
    <div class="info-box" style="margin-top:var(--space-md)">
      <span class="info-box__icon">ℹ</span>
      <span>${interac.note}</span>
    </div>`
        : ""
    }

    <div class="booking-nav">
      <button type="button" class="btn-back" data-action="prev">Retour</button>
      <button type="button" class="btn btn-gold btn--lg" data-action="pay"
        ${!B.paymentMethod ? 'disabled aria-disabled="true"' : ""}>
        ${btnLabel}
      </button>
    </div>`;
}

// S5 — Confirmation
function _buildS5() {
  const ref = _generateRef();
  const isInterac = B.paymentMethod === "interac-etransfer";

  const recap = [
    {
      label: "Service",
      value: `${B.service?.categorie} — ${B.service?.label}`,
    },
    { label: "Date", value: _formatDateFR(B.date) },
    { label: "Heure", value: B.time },
    { label: "Nom", value: B.name },
    { label: "Email", value: B.email },
    {
      label: isInterac ? "Dépôt à envoyer" : "Dépôt payé",
      value: `${POLITIQUES.depot.montant}$`,
    },
    { label: "Référence", value: ref },
  ];

  const message = isInterac
    ? `Votre réservation est enregistrée. Effectuez le virement Interac de ${POLITIQUES.depot.montant}$ pour confirmer.`
    : `Un email de confirmation a été envoyé à <strong>${_esc(B.email)}</strong>. Merci de vous présenter avec un délai de grâce de ${POLITIQUES.retard.graceMinutes} minutes maximum.`;

  return `
    <div class="booking-confirmation">
      <div class="booking-confirmation__icon">✅</div>
      <h2 class="booking-confirmation__title">Rendez-vous confirmé !</h2>
      <p class="booking-confirmation__text">${message}</p>

      <div class="booking-confirmation__recap">
        ${recap
          .map(
            ({ label, value }) => `
          <div class="booking-confirmation__recap-row">
            <span class="booking-confirmation__recap-label">${label}</span>
            <span class="booking-confirmation__recap-value">${_esc(String(value ?? "—"))}</span>
          </div>`,
          )
          .join("")}
      </div>

      <div style="display:flex;flex-wrap:wrap;gap:var(--space-md);justify-content:center;margin-top:var(--space-xl);">
        <button type="button" class="btn btn-ghost" data-nav="accueil">
          Retour à l'accueil
        </button>
        <button type="button" class="btn btn-dark" data-action="rebook">
          Nouvelle réservation
        </button>
      </div>
    </div>`;
}

// ─── EVENTS (bindés une seule fois sur #booking-root) ────────

function _bindEvents(root) {
  root.addEventListener("click", (e) => {
    const action = e.target.closest("[data-action]")?.dataset.action;

    switch (action) {
      case "start":
        return _goToStep(1);
      case "prev":
        return _goToStep(B.step - 1);
      case "next":
        return _validateAndAdvance(root);
      case "cal-prev":
        return _changeMonth(-1, root);
      case "cal-next":
        return _changeMonth(+1, root);
      case "pay":
        return _handlePayment(root);
      case "rebook":
        return (_resetState(), _goToStep(0));
    }

    const tab = e.target.closest("[data-booking-tab]");
    if (tab) return _handleTab(root, tab.dataset.bookingTab);

    const variant = e.target.closest("[data-booking-variant]");
    if (variant) return _handleVariantSelect(root, variant);

    const day = e.target.closest("[data-cal-day]");
    if (day) return _handleDaySelect(root, day.dataset.calDay);

    const slot = e.target.closest("[data-slot]");
    if (slot) return _handleSlotSelect(root, slot.dataset.slot);

    const method = e.target.closest("[data-payment-method]");
    if (method) return _handlePaymentSelect(root, method.dataset.paymentMethod);
  });

  // Effacer les erreurs S3 au fil de la saisie
  root.addEventListener("input", (e) => {
    const field = e.target.closest(".form-input");
    if (!field) return;
    field.classList.remove("is-error");
    const errEl = root.querySelector(`#err-${field.name}`);
    if (errEl) errEl.textContent = "";
  });
}

// ─── EVENT HANDLERS ──────────────────────────────────────────

function _handleTab(root, genre) {
  root.querySelectorAll("[data-booking-tab]").forEach((t) => {
    const active = t.dataset.bookingTab === genre;
    t.classList.toggle("is-active", active);
    t.setAttribute("aria-selected", String(active));
  });
  root.querySelectorAll(".services-panel").forEach((p) => {
    p.classList.toggle("is-active", p.id === `s1-panel-${genre}`);
  });
}

function _handleVariantSelect(root, btn) {
  B.service = {
    serviceId: btn.dataset.serviceId,
    variantId: btn.dataset.variantId,
    categorie: btn.dataset.categorie,
    label: btn.dataset.label,
    prix: btn.dataset.prix ? Number(btn.dataset.prix) : null,
    prixLabel: btn.dataset.prixLabel,
    genre: btn.dataset.genre,
  };

  // Mise à jour visuelle sans re-render
  root.querySelectorAll("[data-booking-variant]").forEach((v) => {
    const sel = v.dataset.variantId === B.service.variantId;
    v.classList.toggle("is-selected", sel);
    v.setAttribute("aria-pressed", String(sel));
  });
  root.querySelectorAll(".service-card").forEach((card) => {
    const owns =
      card.querySelector(`[data-service-id="${B.service.serviceId}"]`) !== null;
    card.classList.toggle("is-selected", owns);
  });

  // Activer le bouton Continuer
  const nextBtn = root.querySelector('[data-action="next"]');
  if (nextBtn) {
    nextBtn.disabled = false;
    nextBtn.removeAttribute("aria-disabled");
  }
}

function _changeMonth(dir, root) {
  const candidate = new Date(_calYear, _calMonth + dir, 1);
  const now = new Date();
  const min = new Date(now.getFullYear(), now.getMonth(), 1);
  const max = new Date(now.getFullYear(), now.getMonth() + 4, 1);
  if (candidate < min || candidate >= max) return;
  _calYear = candidate.getFullYear();
  _calMonth = candidate.getMonth();
  _refreshCalendar(root);
}

function _handleDaySelect(root, isoDate) {
  B.date = isoDate;
  B.time = null;
  _refreshCalendar(root);
  _refreshSlots(root);
  _setNextBtnState(root, false);
}

function _handleSlotSelect(root, slot) {
  B.time = slot;
  root.querySelectorAll("[data-slot]").forEach((s) => {
    const sel = s.dataset.slot === slot;
    s.classList.toggle("is-selected", sel);
    s.setAttribute("aria-pressed", String(sel));
  });
  _setNextBtnState(root, true);
}

function _handlePaymentSelect(root, methodId) {
  B.paymentMethod = methodId;
  _renderStep(B.step);
}

async function _handlePayment(root) {
  if (!B.paymentMethod) return;

  if (B.paymentMethod === "interac-etransfer") {
    _goToStep(5);
    return;
  }

  const btn = root.querySelector('[data-action="pay"]');
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Traitement en cours…";
  }

  try {
    const BACKEND_URL = "https://glow-room-backend.onrender.com";

    const res = await fetch(`${BACKEND_URL}/create-checkout-session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientName: B.name,
        service: `${B.service.categorie} — ${B.service.label}`,
        date: B.date,
        time: B.time,
      }),
    });

    if (!res.ok) throw new Error(await res.text());
    const { url } = await res.json();
    if (url) {
      window.location.href = url;
      return;
    }
  } catch (err) {
    console.error("[booking] Erreur paiement :", err);
    _toast("Une erreur est survenue. Veuillez réessayer.", "error");
    if (btn) {
      btn.disabled = false;
      btn.removeAttribute("aria-disabled");
      btn.textContent = `Procéder au paiement — ${POLITIQUES.depot.montant}$`;
    }
  }
}

// ─── VALIDATION ──────────────────────────────────────────────

function _validateAndAdvance(root) {
  switch (B.step) {
    case 1:
      return _validateS1();
    case 2:
      return _validateS2();
    case 3:
      return _validateS3(root);
  }
}

function _validateS1() {
  if (!B.service) {
    _toast("Veuillez sélectionner un service.", "info");
    return;
  }
  _goToStep(2);
}

function _validateS2() {
  if (!B.date) {
    _toast("Veuillez choisir une date.", "info");
    return;
  }
  if (!B.time) {
    _toast("Veuillez choisir un créneau horaire.", "info");
    return;
  }
  _goToStep(3);
}

function _validateS3(root) {
  const form = root.querySelector("#booking-form-s3");
  if (!form) return;
  const name = form.querySelector("#b-nom").value.trim();
  const phone = form.querySelector("#b-tel").value.trim();
  const email = form.querySelector("#b-email").value.trim();

  const errors = {};
  if (!name) errors.nom = "Votre nom est requis.";
  if (!phone) errors.phone = "Votre téléphone est requis.";
  if (!email) errors.email = "Votre email est requis.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    errors.email = "Adresse email invalide.";

  if (Object.keys(errors).length) {
    Object.entries(errors).forEach(([field, msg]) => {
      form.querySelector(`[name="${field}"]`)?.classList.add("is-error");
      const el = form.querySelector(`#err-${field}`);
      if (el) el.textContent = msg;
    });
    form.querySelector(".is-error")?.focus();
    return;
  }

  B.name = name;
  B.phone = phone;
  B.email = email;
  _goToStep(4);
}

// ─── CALENDRIER ──────────────────────────────────────────────

function _refreshCalendar(root) {
  const monthEl = root.querySelector("[data-cal-month]");
  const gridEl = root.querySelector("[data-cal-grid]");
  if (monthEl) monthEl.textContent = `${MONTH_NAMES[_calMonth]} ${_calYear}`;
  if (gridEl) gridEl.innerHTML = _buildCalGrid();
}

function _refreshSlots(root) {
  const container = root.querySelector("[data-slots-container]");
  if (!container) return;
  container.innerHTML = B.date ? _buildSlots() : "";
}

function _setNextBtnState(root, ready) {
  const btn = root.querySelector('[data-action="next"]');
  if (!btn) return;
  btn.disabled = !ready;
  btn.toggleAttribute("aria-disabled", !ready);
}

function _buildCalGrid() {
  const daysInMonth = new Date(_calYear, _calMonth + 1, 0).getDate();
  const firstDayJS = new Date(_calYear, _calMonth, 1).getDay();
  const offset = (firstDayJS + 6) % 7; // convertir Dimanche=0 → Lundi=0

  const header = DAY_ABBREVS.map(
    (d) => `<span class="booking-calendar__day-name">${d}</span>`,
  ).join("");

  const blanks = Array(offset)
    .fill(`<span class="booking-calendar__day" aria-hidden="true"></span>`)
    .join("");

  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const disabled = _isDayDisabled(_calYear, _calMonth, day);
    const today = _isDayToday(_calYear, _calMonth, day);
    const selected = _isDaySelected(_calYear, _calMonth, day);
    const iso = `${_calYear}-${String(_calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    let cls = "booking-calendar__day";
    if (disabled) cls += " is-disabled";
    else if (today) cls += " is-today";
    if (selected) cls += " is-selected";

    return disabled
      ? `<span class="${cls}" aria-hidden="true">${day}</span>`
      : `<button type="button" class="${cls}" data-cal-day="${iso}"
           aria-label="${day} ${MONTH_NAMES[_calMonth]} ${_calYear}"
           aria-pressed="${selected}">${day}</button>`;
  }).join("");

  return header + blanks + days;
}

function _buildSlots() {
  const slots = _getSlotsForDate(B.date);
  if (!slots.length) {
    return `<p style="color:var(--muted);font-size:var(--fs-sm);margin-top:var(--space-md);">
              Aucun créneau disponible pour cette journée.
            </p>`;
  }
  return `
    <p style="font-size:var(--fs-sm);color:var(--muted);margin-top:var(--space-xl);margin-bottom:var(--space-md);">
      Créneaux disponibles — ${_formatDateFR(B.date)}
    </p>
    <div class="booking-slots">
      ${slots
        .map((slot) => {
          const sel = B.time === slot;
          const busy = _isSlotUnavailable(B.date, slot);
          let cls = "booking-slot";
          if (sel) cls += " is-selected";
          if (busy) cls += " is-unavailable";
          return busy
            ? `<span class="${cls}" aria-disabled="true">${slot}</span>`
            : `<button type="button" class="${cls}" data-slot="${slot}" aria-pressed="${sel}">${slot}</button>`;
        })
        .join("")}
    </div>`;
}

// ─── HELPERS ─────────────────────────────────────────────────

function _goToStep(step) {
  if (step < 0 || step > 5) return;
  _renderStep(step);
}

function _resetState() {
  Object.assign(B, {
    step: 0,
    service: null,
    date: null,
    time: null,
    name: "",
    phone: "",
    email: "",
    paymentMethod: null,
  });
  _calYear = _calMonth = null;
}

function _toast(message, type = "info") {
  document.dispatchEvent(
    new CustomEvent("app:toast", { detail: { message, type } }),
  );
}

function _getSlotsForDate(isoDate) {
  const date = new Date(isoDate);
  const h = HORAIRES[JS_TO_HORAIRES_IDX[date.getDay()]];
  if (!h.ouvert) return [];
  const [sh, sm] = h.debut.split(":").map(Number);
  const endH = Number(h.fin.split(":")[0]);
  const firstH = sm > 0 ? sh + 1 : sh;
  const slots = [];
  for (let hour = firstH; hour <= endH - 3; hour++) {
    slots.push(`${String(hour).padStart(2, "0")}:00`);
  }
  return slots;
}

// Simule ~20% de créneaux occupés de façon déterministe — à supprimer avec la vraie dispo backend
function _isSlotUnavailable(dateStr, slot) {
  const hash = [...(dateStr + slot)].reduce((n, c) => n + c.charCodeAt(0), 0);
  return hash % 5 === 0;
}

function _isDayDisabled(y, m, d) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (new Date(y, m, d) < today) return true;
  return !HORAIRES[JS_TO_HORAIRES_IDX[new Date(y, m, d).getDay()]].ouvert;
}

function _isDayToday(y, m, d) {
  const n = new Date();
  return y === n.getFullYear() && m === n.getMonth() && d === n.getDate();
}

function _isDaySelected(y, m, d) {
  if (!B.date) return false;
  const [by, bm, bd] = B.date.split("-").map(Number);
  return y === by && m + 1 === bm && d === bd;
}

function _formatDateFR(iso) {
  if (!iso) return "";
  const [y, mo, d] = iso.split("-").map(Number);
  return new Date(y, mo - 1, d).toLocaleDateString("fr-CA", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// Protège les valeurs de B contre le XSS lors de l'injection HTML
function _esc(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function _generateRef() {
  return `GRS-${Date.now().toString(36).toUpperCase().slice(-6)}`;
}
