// ============================================================
//  js/booking.js — Tunnel de réservation (5 étapes)
//  Glow Room Studio
//
//  Flux : S0 Bienvenue → S1 Service → S2 Date/Heure
//         → S3 Infos → S4 Confirmation
// ============================================================

import {
  HORAIRES,
  POLITIQUES,
  SEUIL_GRISAGE_16H,
  SERVICES_FEMMES,
  SERVICES_HOMMES,
} from './data.js';
import { onPageEnter } from './router.js';

// ─── ÉTAT CENTRAL ────────────────────────────────────────────

const B = {
  step:      0,
  service:   null,   // { serviceId, variantId, categorie, label, prix, prixLabel, genre, dureeMinutes }
  date:      null,   // 'YYYY-MM-DD'
  slot:      null,   // '09:00' ou '16:00'
  name:      '',
  phone:     '',
  email:     '',
  confirmed: false,
};

let _calYear     = null;
let _calMonth    = null; // 0-indexed
let _initialized = false;

// ─── CONSTANTS ───────────────────────────────────────────────

const BACKEND_URL = 'https://glow-room-backend.onrender.com';
const SLOTS       = ['09:00', '16:00'];

// Date.getDay() retourne 0=Dim, 1=Lun, … → HORAIRES[0]=Lundi … HORAIRES[6]=Dimanche
const JS_TO_HORAIRES_IDX = [6, 0, 1, 2, 3, 4, 5];

const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];
const DAY_ABBREVS = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'];

// ─── INIT PUBLIC ─────────────────────────────────────────────

export function initBooking() {
  onPageEnter('reservation', _onEnter);

  // Pré-remplir B.service si l'utilisateur arrive depuis le catalogue
  document.addEventListener('app:service-selected', (e) => {
    B.service = { ...e.detail };
  });
}

// ─── PAGE ENTER ──────────────────────────────────────────────

function _onEnter() {
  const section = document.getElementById('reservation');
  if (!section) return;

  if (!_initialized) {
    section.innerHTML = `<div class="booking-page" id="booking-root"></div>`;
    _bindEvents(document.getElementById('booking-root'));
    _initialized = true;
  }

  // Après une confirmation, la prochaine visite repart de zéro
  if (B.confirmed) _resetState();

  // Sauter l'écran de bienvenue si un service est déjà choisi depuis le catalogue
  if (B.service && B.step === 0) B.step = 1;

  _renderStep(B.step);
}

// ─── RENDER ──────────────────────────────────────────────────

function _renderStep(step) {
  const root = document.getElementById('booking-root');
  if (!root) return;
  B.step = step;

  root.innerHTML = `
    ${step >= 2 && step <= 3 ? _buildSummary() : ''}
    ${step >= 1 && step <= 4 && !B.confirmed ? _buildIndicator() : ''}
    <div class="booking-step">
      ${_buildStepHTML(step)}
    </div>
  `;

  if (step === 2) {
    const now = new Date();
    if (_calYear === null) _calYear = now.getFullYear();
    if (_calMonth === null) _calMonth = now.getMonth();
    _refreshCalendar(root);
    if (B.date) _refreshSlots(root);
  }
}

// ─── INDICATEUR & RÉCAPITULATIF ──────────────────────────────

function _buildIndicator() {
  const dots = [1, 2, 3, 4]
    .map((s) => {
      const cls = s < B.step ? 'is-done' : s === B.step ? 'is-active' : '';
      return `<span class="step-dot ${cls}" aria-hidden="true"></span>`;
    })
    .join('');
  return `<div class="steps-indicator" aria-label="Étape ${B.step} sur 4">${dots}</div>`;
}

function _buildSummary() {
  const items = [];
  if (B.service) {
    items.push({ label: 'Service', value: B.service.categorie });
    items.push({ label: 'Option',  value: `${B.service.label} — ${B.service.prixLabel}` });
  }
  if (B.date) items.push({ label: 'Date',  value: _formatDateFR(B.date) });
  if (B.slot) items.push({ label: 'Heure', value: B.slot });
  if (!items.length) return '';

  return `
    <div class="booking-summary">
      ${items
        .map(({ label, value }) => `
          <div class="booking-summary__item">
            <span class="booking-summary__label">${label}</span>
            <span class="booking-summary__value">${_esc(value)}</span>
          </div>`)
        .join('')}
    </div>`;
}

// ─── STEPS HTML ──────────────────────────────────────────────

function _buildStepHTML(step) {
  switch (step) {
    case 0:  return _buildS0();
    case 1:  return _buildS1();
    case 2:  return _buildS2();
    case 3:  return _buildS3();
    case 4:  return _buildS4();
    default: return _buildS0();
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
  const genre    = B.service?.genre ?? 'femmes';
  const hasChoice = !!B.service;

  return `
    <h2 class="booking-step__title">Quel service souhaitez-vous ?</h2>
    <p class="booking-step__subtitle">Sélectionnez un service et une option pour continuer.</p>

    <div class="services-tabs" role="tablist">
      ${['femmes', 'hommes']
        .map((g) => `
          <button type="button"
            class="services-tab ${g === genre ? 'is-active' : ''}"
            role="tab"
            aria-selected="${g === genre}"
            aria-controls="s1-panel-${g}"
            data-booking-tab="${g}"
          >${g.charAt(0).toUpperCase() + g.slice(1)}</button>
        `)
        .join('')}
    </div>

    <div id="s1-panel-femmes" class="services-panel ${genre === 'femmes' ? 'is-active' : ''}" role="tabpanel">
      ${SERVICES_FEMMES.map((s) => _buildServiceCard(s, 'femmes')).join('')}
    </div>
    <div id="s1-panel-hommes" class="services-panel ${genre === 'hommes' ? 'is-active' : ''}" role="tabpanel">
      ${SERVICES_HOMMES.map((s) => _buildServiceCard(s, 'hommes')).join('')}
    </div>

    <div class="booking-nav">
      <button type="button" class="btn-back" data-action="prev">Retour</button>
      <button type="button" class="btn btn-dark" data-action="next"
        ${!hasChoice ? 'disabled aria-disabled="true"' : ''}>
        Continuer
      </button>
    </div>`;
}

function _buildServiceCard(service, genre) {
  const tags = service.styles?.length
    ? `<div class="service-card__styles">
         ${service.styles.map((s) => `<span class="service-card__style-tag">${s}</span>`).join('')}
       </div>`
    : '';

  const variants = service.variantes
    .map((v) => {
      const sel = B.service?.variantId === v.id;
      return `
        <button type="button"
          class="service-card__variant ${sel ? 'is-selected' : ''}"
          data-booking-variant
          data-service-id="${service.id}"
          data-variant-id="${v.id}"
          data-categorie="${service.categorie}"
          data-label="${v.label}"
          data-prix="${v.prix ?? ''}"
          data-prix-label="${v.prixLabel ?? v.prix + '$'}"
          data-genre="${genre}"
          data-duree-minutes="${v.dureeMinutes ?? ''}"
          aria-pressed="${sel}"
        >
          <span class="service-card__variant-label">${v.label}</span>
          <span class="service-card__variant-price">${v.prixLabel ?? v.prix + '$'}</span>
        </button>`;
    })
    .join('');

  return `
    <article class="service-card ${B.service?.serviceId === service.id ? 'is-selected' : ''}">
      <h3 class="service-card__title">${service.categorie}</h3>
      ${tags}
      <div class="service-card__variants">${variants}</div>
    </article>`;
}

// S2 — Date & Heure
function _buildS2() {
  const ready = !!(B.date && B.slot);
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
        ${!ready ? 'disabled aria-disabled="true"' : ''}>
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

// S4 — Confirmation (ou succès si B.confirmed)
function _buildS4() {
  if (B.confirmed) return _buildS4Success();

  const recap = [
    { label: 'Service',   value: `${B.service?.categorie} — ${B.service?.label}` },
    { label: 'Date',      value: _formatDateFR(B.date) },
    { label: 'Heure',     value: B.slot },
    { label: 'Nom',       value: B.name },
    { label: 'Email',     value: B.email },
    { label: 'Téléphone', value: B.phone },
  ];

  return `
    <h2 class="booking-step__title">Confirmez votre réservation</h2>
    <p class="booking-step__subtitle">Vérifiez les informations, puis confirmez.</p>

    <div class="booking-confirmation__recap">
      ${recap
        .map(({ label, value }) => `
          <div class="booking-confirmation__recap-row">
            <span class="booking-confirmation__recap-label">${label}</span>
            <span class="booking-confirmation__recap-value">${_esc(String(value ?? '—'))}</span>
          </div>`)
        .join('')}
    </div>

    <div class="info-box" style="margin-top:var(--space-lg);">
      <span class="info-box__icon">ℹ</span>
      <span>
        Pour confirmer votre réservation, envoyez <strong>${POLITIQUES.depot.montant}$ CAD</strong>
        à <strong>Tinidk17@gmail.com</strong> via Interac e-Transfer.<br>
        Indiquez votre nom complet en message.<br>
        Votre RDV sera confirmé dès réception du paiement.
      </span>
    </div>

    <div class="booking-nav">
      <button type="button" class="btn-back" data-action="prev">Retour</button>
      <button type="button" class="btn btn-gold btn--lg" data-action="confirm">
        Confirmer ma réservation
      </button>
    </div>`;
}

function _buildS4Success() {
  const ref = _generateRef();
  return `
    <div class="booking-confirmation">
      <div class="booking-confirmation__icon">✅</div>
      <h2 class="booking-confirmation__title">Demande envoyée !</h2>
      <p class="booking-confirmation__text">
        Un email avec les instructions Interac a été envoyé à
        <strong>${_esc(B.email)}</strong>.<br>
        Votre rendez-vous sera confirmé dès réception du paiement.
      </p>
      <p class="booking-confirmation__text"
        style="margin-top:var(--space-sm);font-size:var(--fs-sm);color:var(--muted);">
        Référence : ${_esc(ref)}
      </p>
      <div style="display:flex;flex-wrap:wrap;gap:var(--space-md);justify-content:center;margin-top:var(--space-xl);">
        <button type="button" class="btn btn-ghost" data-nav="accueil">Retour à l'accueil</button>
        <button type="button" class="btn btn-dark" data-action="rebook">Nouvelle réservation</button>
      </div>
    </div>`;
}

// ─── EVENTS (bindés une seule fois sur #booking-root) ────────

function _bindEvents(root) {
  root.addEventListener('click', (e) => {
    const action = e.target.closest('[data-action]')?.dataset.action;

    switch (action) {
      case 'start':    return _goToStep(1);
      case 'prev':     return _goToStep(B.step - 1);
      case 'next':     return _validateAndAdvance(root);
      case 'cal-prev': return _changeMonth(-1, root);
      case 'cal-next': return _changeMonth(+1, root);
      case 'confirm':  return _handleConfirm(root);
      case 'rebook':   return (_resetState(), _goToStep(0));
    }

    const tab = e.target.closest('[data-booking-tab]');
    if (tab) return _handleTab(root, tab.dataset.bookingTab);

    const variant = e.target.closest('[data-booking-variant]');
    if (variant) return _handleVariantSelect(root, variant);

    const day = e.target.closest('[data-cal-day]');
    if (day) return _handleDaySelect(root, day.dataset.calDay);

    const slot = e.target.closest('[data-slot]');
    if (slot) return _handleSlotSelect(root, slot.dataset.slot);
  });

  // Effacer les erreurs S3 au fil de la saisie
  root.addEventListener('input', (e) => {
    const field = e.target.closest('.form-input');
    if (!field) return;
    field.classList.remove('is-error');
    const errEl = root.querySelector(`#err-${field.name}`);
    if (errEl) errEl.textContent = '';
  });
}

// ─── EVENT HANDLERS ──────────────────────────────────────────

function _handleTab(root, genre) {
  root.querySelectorAll('[data-booking-tab]').forEach((t) => {
    const active = t.dataset.bookingTab === genre;
    t.classList.toggle('is-active', active);
    t.setAttribute('aria-selected', String(active));
  });
  root.querySelectorAll('.services-panel').forEach((p) => {
    p.classList.toggle('is-active', p.id === `s1-panel-${genre}`);
  });
}

function _handleVariantSelect(root, btn) {
  B.service = {
    serviceId:    btn.dataset.serviceId,
    variantId:    btn.dataset.variantId,
    categorie:    btn.dataset.categorie,
    label:        btn.dataset.label,
    prix:         btn.dataset.prix ? Number(btn.dataset.prix) : null,
    prixLabel:    btn.dataset.prixLabel,
    genre:        btn.dataset.genre,
    dureeMinutes: btn.dataset.dureeMinutes ? Number(btn.dataset.dureeMinutes) : null,
  };

  // Mise à jour visuelle sans re-render
  root.querySelectorAll('[data-booking-variant]').forEach((v) => {
    const sel = v.dataset.variantId === B.service.variantId;
    v.classList.toggle('is-selected', sel);
    v.setAttribute('aria-pressed', String(sel));
  });
  root.querySelectorAll('.service-card').forEach((card) => {
    const owns = card.querySelector(`[data-service-id="${B.service.serviceId}"]`) !== null;
    card.classList.toggle('is-selected', owns);
  });

  // Activer le bouton Continuer
  const nextBtn = root.querySelector('[data-action="next"]');
  if (nextBtn) {
    nextBtn.disabled = false;
    nextBtn.removeAttribute('aria-disabled');
  }
}

function _changeMonth(dir, root) {
  const candidate = new Date(_calYear, _calMonth + dir, 1);
  const now        = new Date();
  const min        = new Date(now.getFullYear(), now.getMonth(), 1);
  const max        = new Date(now.getFullYear(), now.getMonth() + 4, 1);
  if (candidate < min || candidate >= max) return;
  _calYear  = candidate.getFullYear();
  _calMonth = candidate.getMonth();
  _refreshCalendar(root);
}

function _handleDaySelect(root, isoDate) {
  B.date = isoDate;
  B.slot = null;
  _refreshCalendar(root);
  _refreshSlots(root);
  _setNextBtnState(root, false);
}

function _handleSlotSelect(root, slotTime) {
  B.slot = slotTime;
  root.querySelectorAll('[data-slot]').forEach((s) => {
    const sel = s.dataset.slot === slotTime;
    s.classList.toggle('is-selected', sel);
    s.setAttribute('aria-pressed', String(sel));
  });
  _setNextBtnState(root, true);
}

async function _handleConfirm(root) {
  const btn = root.querySelector('[data-action="confirm"]');
  if (btn) {
    btn.disabled    = true;
    btn.textContent = 'Envoi en cours…';
  }

  try {
    const res = await fetch(`${BACKEND_URL}/reservation`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        clientName: B.name,
        service:    `${B.service.categorie} — ${B.service.label}`,
        date:       B.date,
        slot:       B.slot,
        phone:      B.phone,
        email:      B.email,
      }),
    });

    if (!res.ok) throw new Error(await res.text());

    B.confirmed = true;
    _renderStep(4);
    _toast('Votre demande de réservation a bien été envoyée !', 'success');

  } catch (err) {
    console.error('[booking] Erreur réservation :', err);
    _toast('Une erreur est survenue. Veuillez réessayer.', 'error');
    if (btn) {
      btn.disabled    = false;
      btn.textContent = 'Confirmer ma réservation';
    }
  }
}

// ─── VALIDATION ──────────────────────────────────────────────

function _validateAndAdvance(root) {
  switch (B.step) {
    case 1: return _validateS1();
    case 2: return _validateS2();
    case 3: return _validateS3(root);
  }
}

function _validateS1() {
  if (!B.service) {
    _toast('Veuillez sélectionner un service.', 'info');
    return;
  }
  _goToStep(2);
}

function _validateS2() {
  if (!B.date) { _toast('Veuillez choisir une date.', 'info');   return; }
  if (!B.slot) { _toast('Veuillez choisir un créneau.', 'info'); return; }
  _goToStep(3);
}

function _validateS3(root) {
  const form = root.querySelector('#booking-form-s3');
  if (!form) return;
  const name  = form.querySelector('#b-nom').value.trim();
  const phone = form.querySelector('#b-tel').value.trim();
  const email = form.querySelector('#b-email').value.trim();

  const errors = {};
  if (!name)  errors.nom   = 'Votre nom est requis.';
  if (!phone) errors.phone = 'Votre téléphone est requis.';
  if (!email) errors.email = 'Votre email est requis.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    errors.email = 'Adresse email invalide.';

  if (Object.keys(errors).length) {
    Object.entries(errors).forEach(([field, msg]) => {
      form.querySelector(`[name="${field}"]`)?.classList.add('is-error');
      const el = form.querySelector(`#err-${field}`);
      if (el) el.textContent = msg;
    });
    form.querySelector('.is-error')?.focus();
    return;
  }

  B.name  = name;
  B.phone = phone;
  B.email = email;
  _goToStep(4);
}

// ─── CALENDRIER ──────────────────────────────────────────────

function _refreshCalendar(root) {
  const monthEl = root.querySelector('[data-cal-month]');
  const gridEl  = root.querySelector('[data-cal-grid]');
  if (monthEl) monthEl.textContent = `${MONTH_NAMES[_calMonth]} ${_calYear}`;
  if (gridEl)  gridEl.innerHTML    = _buildCalGrid();
}

async function _refreshSlots(root) {
  const container = root.querySelector('[data-slots-container]');
  if (!container || !B.date) return;

  const dateAtStart = B.date;
  container.innerHTML = `
    <p style="font-size:var(--fs-sm);color:var(--muted);margin-top:var(--space-xl);" aria-live="polite">
      Vérification des disponibilités…
    </p>`;

  let busySlots = [];
  try {
    const res = await fetch(`${BACKEND_URL}/slots-disponibles?date=${B.date}`);
    if (res.ok) {
      const data = await res.json();
      busySlots = data.slots ?? [];
    }
  } catch (_) {
    // Backend injoignable — affiche tous les créneaux
  }

  // Ignorer si la date a changé pendant l'attente ou si le root n'est plus dans le DOM
  if (!root.isConnected || B.date !== dateAtStart) return;
  container.innerHTML = _buildSlotsHTML(busySlots);
}

function _buildSlotsHTML(busySlots = []) {
  const blocks16h = (B.service?.dureeMinutes ?? 0) >= SEUIL_GRISAGE_16H;

  return `
    <p style="font-size:var(--fs-sm);color:var(--muted);margin-top:var(--space-xl);margin-bottom:var(--space-md);">
      Créneaux disponibles — ${_formatDateFR(B.date)}
    </p>
    <div class="booking-slots">
      ${SLOTS.map((slot) => {
        const unavailable = (slot === '16:00' && blocks16h) || busySlots.includes(slot);
        const sel         = B.slot === slot;
        let cls = 'booking-slot';
        if (sel)         cls += ' is-selected';
        if (unavailable) cls += ' is-unavailable';

        return unavailable
          ? `<span class="${cls}" aria-disabled="true">${slot}</span>`
          : `<button type="button" class="${cls}" data-slot="${slot}" aria-pressed="${sel}">${slot}</button>`;
      }).join('')}
    </div>`;
}

function _setNextBtnState(root, ready) {
  const btn = root.querySelector('[data-action="next"]');
  if (!btn) return;
  btn.disabled = !ready;
  btn.toggleAttribute('aria-disabled', !ready);
}

function _buildCalGrid() {
  const daysInMonth = new Date(_calYear, _calMonth + 1, 0).getDate();
  const firstDayJS  = new Date(_calYear, _calMonth, 1).getDay();
  const offset      = (firstDayJS + 6) % 7; // convertir Dimanche=0 → Lundi=0

  const header = DAY_ABBREVS
    .map((d) => `<span class="booking-calendar__day-name">${d}</span>`)
    .join('');

  const blanks = Array(offset)
    .fill(`<span class="booking-calendar__day" aria-hidden="true"></span>`)
    .join('');

  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const day      = i + 1;
    const disabled = _isDayDisabled(_calYear, _calMonth, day);
    const today    = _isDayToday(_calYear, _calMonth, day);
    const selected = _isDaySelected(_calYear, _calMonth, day);
    const iso      = `${_calYear}-${String(_calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    let cls = 'booking-calendar__day';
    if (disabled)     cls += ' is-disabled';
    else if (today)   cls += ' is-today';
    if (selected)     cls += ' is-selected';

    return disabled
      ? `<span class="${cls}" aria-hidden="true">${day}</span>`
      : `<button type="button" class="${cls}" data-cal-day="${iso}"
           aria-label="${day} ${MONTH_NAMES[_calMonth]} ${_calYear}"
           aria-pressed="${selected}">${day}</button>`;
  }).join('');

  return header + blanks + days;
}

// ─── HELPERS ─────────────────────────────────────────────────

function _goToStep(step) {
  if (step < 0 || step > 4) return;
  _renderStep(step);
}

function _resetState() {
  Object.assign(B, {
    step: 0, service: null, date: null, slot: null,
    name: '', phone: '', email: '', confirmed: false,
  });
  _calYear = _calMonth = null;
}

function _toast(message, type = 'info') {
  document.dispatchEvent(new CustomEvent('app:toast', { detail: { message, type } }));
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
  const [by, bm, bd] = B.date.split('-').map(Number);
  return y === by && m + 1 === bm && d === bd;
}

function _formatDateFR(iso) {
  if (!iso) return '';
  const [y, mo, d] = iso.split('-').map(Number);
  return new Date(y, mo - 1, d).toLocaleDateString('fr-CA', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

// Protège les valeurs de B contre le XSS lors de l'injection HTML
function _esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function _generateRef() {
  return `GRS-${Date.now().toString(36).toUpperCase().slice(-6)}`;
}
