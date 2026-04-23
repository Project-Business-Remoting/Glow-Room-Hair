// ============================================================
//  js/payment-result.js — Pages résultat après redirection Stripe
//  Glow Room Studio
// ============================================================

import { onPageEnter } from './router.js';

export function initPaymentResult() {
  onPageEnter('success', _renderSuccess);
  onPageEnter('cancel',  _renderCancel);
}

function _renderSuccess() {
  const section = document.getElementById('success');
  if (!section) return;

  const sessionId = new URLSearchParams(window.location.search).get('session_id');

  section.innerHTML = `
    <div class="container section">
      <div class="booking-confirmation">
        <div class="booking-confirmation__icon">✅</div>
        <h2 class="booking-confirmation__title">Paiement confirmé !</h2>
        <p class="booking-confirmation__text">
          Votre dépôt de 15$ a bien été reçu.
          Un email de confirmation vous a été envoyé.
          Nous avons hâte de vous accueillir chez Glow Room Hair.
        </p>
        ${sessionId ? `
        <p style="font-size:var(--fs-xs);color:var(--muted);margin-top:var(--space-sm);">
          Référence : ${_esc(sessionId)}
        </p>` : ''}
        <div style="display:flex;justify-content:center;margin-top:var(--space-xl);">
          <button type="button" class="btn btn-dark" data-nav="accueil">
            Retour à l'accueil
          </button>
        </div>
      </div>
    </div>`;
}

function _renderCancel() {
  const section = document.getElementById('cancel');
  if (!section) return;

  section.innerHTML = `
    <div class="container section">
      <div class="booking-confirmation">
        <div class="booking-confirmation__icon">❌</div>
        <h2 class="booking-confirmation__title">Paiement annulé</h2>
        <p class="booking-confirmation__text">
          Votre réservation n'a pas été confirmée.
          Votre dépôt n'a pas été débité.
          Vous pouvez réessayer quand vous voulez.
        </p>
        <div style="display:flex;flex-wrap:wrap;gap:var(--space-md);justify-content:center;margin-top:var(--space-xl);">
          <button type="button" class="btn btn-dark" data-nav="reservation">
            Réessayer
          </button>
          <button type="button" class="btn btn-ghost" data-nav="accueil">
            Retour à l'accueil
          </button>
        </div>
      </div>
    </div>`;
}

function _esc(str) {
  return String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
