// ============================================================
//  js/reviews.js — Affichage des avis clients
//  Glow Room Hair
// ============================================================

import { AVIS } from './data.js';
import { updateDOM, t } from './i18n.js';
import { onPageEnter } from './router.js';

let _rendered = false;

// ─── INIT ────────────────────────────────────────────────────

export function initReviews() {
  onPageEnter('accueil', _onEnter);
}

// ─── PRIVATE ─────────────────────────────────────────────────

function _onEnter() {
  if (_rendered) return;
  _rendered = true;

  const section = document.getElementById('avis-container');
  if (!section) return;

  section.innerHTML = _buildHTML();
  updateDOM();
}

function _buildHTML() {
  // Tri par date décroissante — avis les plus récents en premier
  const sorted = [...AVIS].sort((a, b) => b.date.localeCompare(a.date));
  const avg    = _avg();
  const count  = AVIS.length;

  return `
    <div class="container section">
      <header class="section-header section-header--center">
        <span class="section-header__eyebrow" data-i18n="reviews.eyebrow">Ce qu'elles &amp; ils disent</span>
        <h2 class="section-header__title" data-i18n="reviews.title">Avis clients</h2>
        <div class="divider divider--center"></div>
      </header>

      <div class="reviews-page__rating" role="region" aria-label="Note globale">
        <p class="reviews-page__score" aria-label="Note : ${avg} sur 5">${avg}</p>
        <p class="reviews-page__stars" aria-hidden="true">${_stars(Math.round(avg))}</p>
        <p class="reviews-page__count">${count} <span data-i18n="reviews.count">avis</span></p>
      </div>

      <div class="reviews-grid" role="list" aria-label="Liste des avis clients">
        ${sorted.map(_buildCard).join('')}
      </div>

      <div style="text-align:center;margin-top:var(--space-2xl);">
        <p style="color:var(--muted);font-size:var(--fs-sm);margin-bottom:var(--space-md);" data-i18n="reviews.prompt">
          Vous avez visité Glow Room Hair ? Partagez votre expérience !
        </p>
        <a href="https://www.instagram.com/glowroom.braids"
           target="_blank"
           rel="noopener noreferrer"
           class="btn btn-ghost" data-i18n="reviews.btn">
          Nous taguer sur Instagram
        </a>
      </div>
    </div>
  `;
}

function _buildCard(avis) {
  const initiales = `${avis.prenom[0]}${avis.initiale}`;

  return `
    <article class="review-card fade-in" role="listitem">
      <div class="review-card__stars" aria-label="Note : ${avis.note} sur 5" aria-hidden="false">
        ${_stars(avis.note)}
      </div>
      <p class="review-card__text">${avis.commentaire}</p>
      <footer class="review-card__footer">
        <div class="review-card__avatar" aria-hidden="true">${avis.prenom[0]}</div>
        <div>
          <p class="review-card__author">${avis.prenom} ${avis.initiale}</p>
          <p class="review-card__meta">${avis.service} · ${avis.ville}</p>
        </div>
      </footer>
    </article>
  `;
}

// ─── HELPERS ─────────────────────────────────────────────────

function _stars(note, max = 5) {
  return '★'.repeat(Math.max(0, note)) + '☆'.repeat(Math.max(0, max - note));
}

function _avg() {
  const total = AVIS.reduce((sum, a) => sum + a.note, 0);
  return (total / AVIS.length).toFixed(1);
}
