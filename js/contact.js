// ============================================================
//  js/contact.js — Page contact : infos, horaires, formulaire
//  Glow Room Studio
// ============================================================

import { SALON, HORAIRES } from './data.js';
import { onPageEnter } from './router.js';

let _rendered = false;

// ─── INIT ────────────────────────────────────────────────────

export function initContact() {
  onPageEnter('contact', _onEnter);
}

// ─── PRIVATE ─────────────────────────────────────────────────

function _onEnter() {
  if (!_rendered) {
    const section = document.getElementById('contact');
    if (!section) return;
    section.innerHTML = _buildHTML();
    _bindForm(section.querySelector('#contact-form'));
    _rendered = true;
  } else {
    // Réinitialiser l'état du formulaire à chaque retour sur la page
    _resetForm(document.getElementById('contact-form'));
  }
}

// ─── HTML ─────────────────────────────────────────────────────

function _buildHTML() {
  return `
    <div class="container section">
      <header class="section-header">
        <span class="section-header__eyebrow">Nous contacter</span>
        <h2 class="section-header__title">Contact &amp; Horaires</h2>
        <div class="divider"></div>
      </header>

      <div class="contact-page__grid">

        <div>
          <div class="contact-info">
            ${_buildInfoItem('📱', 'Téléphone &amp; WhatsApp',
              `<a href="tel:${SALON.telephone}">${SALON.telephone}</a>`)}
            ${_buildInfoItem('✉', 'Email',
              `<a href="mailto:${SALON.email}">${SALON.email}</a>`)}
            ${_buildInfoItem('📸', 'Instagram',
              `<a href="https://instagram.com/${SALON.instagram.replace('@','')}"
                 target="_blank" rel="noopener noreferrer">${SALON.instagram}</a>`)}
            ${_buildInfoItem('👻', 'Snapchat',
              `<a href="https://snapchat.com/add/${SALON.snapchat.replace('@','')}"
                 target="_blank" rel="noopener noreferrer">${SALON.snapchat}</a>`)}
            ${_buildInfoItem('📍', 'Localisation',
              `<span>${SALON.localisation}</span>`)}
          </div>

          <h3 style="font-family:var(--font-serif);color:var(--brown);margin-block:var(--space-xl) var(--space-md);">
            Horaires d'ouverture
          </h3>
          <div class="contact-hours" role="table" aria-label="Horaires d'ouverture">
            ${_buildHoursRows()}
          </div>
        </div>

        <div>
          <form class="contact-form" id="contact-form" novalidate>
            <h3 class="contact-form__title">Envoyer un message</h3>

            <div class="form-row form-row--2">
              <div class="form-group">
                <label class="form-label form-label--required" for="cf-nom">Nom</label>
                <input class="form-input" type="text" id="cf-nom" name="nom"
                  autocomplete="name" placeholder="Votre nom complet" />
                <span class="form-error" id="err-nom" aria-live="polite"></span>
              </div>
              <div class="form-group">
                <label class="form-label" for="cf-tel">Téléphone</label>
                <input class="form-input" type="tel" id="cf-tel" name="telephone"
                  autocomplete="tel" placeholder="(optionnel)" />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label form-label--required" for="cf-email">Email</label>
              <input class="form-input" type="email" id="cf-email" name="email"
                autocomplete="email" placeholder="votre@email.com" />
              <span class="form-error" id="err-email" aria-live="polite"></span>
            </div>

            <div class="form-group">
              <label class="form-label form-label--required" for="cf-message">Message</label>
              <textarea class="form-textarea" id="cf-message" name="message"
                placeholder="Votre question, demande de renseignements…" rows="5"></textarea>
              <span class="form-error" id="err-message" aria-live="polite"></span>
            </div>

            <button type="submit" class="btn btn-gold btn--full" id="cf-submit">
              Envoyer le message
            </button>
          </form>
        </div>

      </div>
    </div>
  `;
}

function _buildInfoItem(icon, label, valueHTML) {
  return `
    <div class="contact-info__item">
      <div class="contact-info__icon" aria-hidden="true">${icon}</div>
      <div>
        <p class="contact-info__label">${label}</p>
        <p class="contact-info__value">${valueHTML}</p>
      </div>
    </div>
  `;
}

function _buildHoursRows() {
  return _groupHours(HORAIRES).map(h => {
    let timeHTML;
    if (!h.ouvert) {
      timeHTML = `<span class="contact-hours__time contact-hours__time--closed">Fermé</span>`;
    } else if (h.ouvertureVariable) {
      timeHTML = `
        <span class="contact-hours__time">
          08:30 – ${h.fin}
          <span class="contact-hours__time--variable">Ouverture entre 8h30 et 9h00</span>
        </span>`;
    } else {
      timeHTML = `<span class="contact-hours__time">${h.debut} – ${h.fin}</span>`;
    }
    return `
      <div class="contact-hours__row" role="row">
        <span class="contact-hours__day">${h.label}</span>
        ${timeHTML}
      </div>`;
  }).join('');
}

// Regroupe les jours consécutifs ayant exactement les mêmes horaires
function _groupHours(horaires) {
  const groups = [];
  let i = 0;
  while (i < horaires.length) {
    const h = horaires[i];
    let j = i + 1;
    while (
      j < horaires.length &&
      horaires[j].ouvert          === h.ouvert &&
      horaires[j].debut           === h.debut &&
      horaires[j].fin             === h.fin &&
      horaires[j].ouvertureVariable === h.ouvertureVariable
    ) { j++; }
    const label = j - i > 1
      ? `${h.jour} – ${horaires[j - 1].jour}`
      : h.jour;
    groups.push({ ...h, label });
    i = j;
  }
  return groups;
}

// ─── FORMULAIRE ──────────────────────────────────────────────

function _bindForm(form) {
  if (!form) return;

  // Effacer l'erreur dès que l'utilisateur corrige le champ
  form.addEventListener('input', e => {
    const input = e.target.closest('.form-input, .form-textarea');
    if (!input) return;
    _clearFieldError(form, input.name);
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();

    const data = {
      nom:       form.nom.value.trim(),
      email:     form.email.value.trim(),
      telephone: form.telephone.value.trim(),
      message:   form.message.value.trim(),
    };

    const errors = _validate(data);

    if (Object.keys(errors).length > 0) {
      _showErrors(form, errors);
      // Mettre le focus sur le premier champ en erreur pour l'accessibilité
      form.querySelector('.is-error')?.focus();
      return;
    }

    _setSubmitting(form, true);

    try {
      const BACKEND_URL = 'https://glow-room-backend.onrender.com';

      const res = await fetch(`${BACKEND_URL}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Erreur serveur');

      form.reset();
      document.dispatchEvent(new CustomEvent('app:toast', {
        detail: {
          message: 'Message envoyé ! Nous vous répondrons sous 24h.',
          type: 'success',
        },
      }));
    } catch {
      document.dispatchEvent(new CustomEvent('app:toast', {
        detail: {
          message: 'Une erreur est survenue. Veuillez réessayer ou nous écrire directement.',
          type: 'error',
        },
      }));
    } finally {
      _setSubmitting(form, false);
    }
  });
}

function _validate(data) {
  const errors = {};
  if (!data.nom)
    errors.nom = 'Votre nom est requis.';
  if (!data.email)
    errors.email = 'Votre email est requis.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
    errors.email = 'Adresse email invalide.';
  if (!data.message)
    errors.message = 'Veuillez écrire votre message.';
  return errors;
}

function _showErrors(form, errors) {
  Object.entries(errors).forEach(([field, msg]) => {
    const input = form.querySelector(`[name="${field}"]`);
    const errEl = form.querySelector(`#err-${field}`);
    input?.classList.add('is-error');
    if (errEl) errEl.textContent = msg;
  });
}

function _clearFieldError(form, fieldName) {
  const input = form.querySelector(`[name="${fieldName}"]`);
  const errEl = form.querySelector(`#err-${fieldName}`);
  input?.classList.remove('is-error');
  if (errEl) errEl.textContent = '';
}

function _setSubmitting(form, isSubmitting) {
  const btn = form.querySelector('#cf-submit');
  if (!btn) return;
  btn.disabled = isSubmitting;
  btn.textContent = isSubmitting ? 'Envoi en cours…' : 'Envoyer le message';
}

function _resetForm(form) {
  if (!form) return;
  form.reset();
  form.querySelectorAll('.is-error').forEach(el => el.classList.remove('is-error'));
  form.querySelectorAll('.form-error').forEach(el => { el.textContent = ''; });
  _setSubmitting(form, false);
}

