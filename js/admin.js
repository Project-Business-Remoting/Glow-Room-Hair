// ============================================================
//  js/admin.js — Dashboard admin (hash #admin)
//  Glow Room Studio
// ============================================================

import { onPageEnter } from "./router.js";

const BACKEND_URL = "https://glow-room-backend.onrender.com";

export function initAdmin() {
  onPageEnter("admin", _onEnter);
}

function _onEnter() {
  const section = document.getElementById("admin");
  if (!section) return;

  section.innerHTML = `
    <div class="container section">
      <header class="section-header">
        <span class="section-header__eyebrow">Espace privé</span>
        <h2 class="section-header__title">Administration</h2>
        <div class="divider"></div>
      </header>

      <div id="admin-root"></div>
    </div>`;

  _render();
}

function _render() {
  const root = document.getElementById("admin-root");
  if (!root) return;

  const pwd = sessionStorage.getItem("admin_password") || "";
  if (!pwd) return _renderLogin(root);

  return _renderDashboard(root);
}

function _renderLogin(root) {
  root.innerHTML = `
    <div class="booking-confirmation">
      <div class="booking-confirmation__icon">🔒</div>
      <h3 class="booking-confirmation__title">Accès admin</h3>
      <p class="booking-confirmation__text">Entrez le mot de passe pour continuer.</p>

      <form id="admin-login" style="max-width:460px;margin:0 auto;display:flex;flex-direction:column;gap:var(--space-md);">
        <div class="form-group">
          <label class="form-label form-label--required" for="admin-pwd">Mot de passe</label>
          <input class="form-input" type="password" id="admin-pwd" autocomplete="current-password" />
          <span class="form-error" id="admin-login-error" aria-live="polite"></span>
        </div>
        <button type="submit" class="btn btn-dark btn--lg">Se connecter</button>
      </form>
    </div>`;

  const form = root.querySelector("#admin-login");
  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    const input = root.querySelector("#admin-pwd");
    const errEl = root.querySelector("#admin-login-error");
    if (!input) return;

    const value = input.value.trim();
    if (!value) {
      if (errEl) errEl.textContent = "Mot de passe requis.";
      input.classList.add("is-error");
      input.focus();
      return;
    }

    sessionStorage.setItem("admin_password", value);
    _render();
  });
}

async function _renderDashboard(root) {
  root.innerHTML = `
    <div style="display:flex;flex-wrap:wrap;gap:var(--space-md);align-items:center;justify-content:space-between;margin-bottom:var(--space-lg);">
      <div style="display:flex;flex-wrap:wrap;gap:var(--space-sm);">
        <button type="button" class="btn btn-ghost btn--sm" data-range="today">Aujourd'hui</button>
        <button type="button" class="btn btn-ghost btn--sm" data-range="week">Semaine</button>
        <button type="button" class="btn btn-ghost btn--sm" data-range="all">Toutes</button>
      </div>
      <div style="display:flex;gap:var(--space-sm);align-items:center;">
        <button type="button" class="btn btn-ghost btn--sm" data-action="logout">Déconnexion</button>
      </div>
    </div>

    <div class="info-box" style="margin-bottom:var(--space-lg);">
      <span class="info-box__icon" aria-hidden="true">ℹ</span>
      <span>
        Actions disponibles : confirmer un paiement, annuler une réservation, bloquer le créneau 16h.
      </span>
    </div>

    <div style="display:flex;flex-wrap:wrap;gap:var(--space-md);align-items:end;margin-bottom:var(--space-xl);">
      <div class="form-group" style="min-width:240px;">
        <label class="form-label" for="block-date">Date</label>
        <input class="form-input" type="date" id="block-date" />
      </div>
      <button type="button" class="btn btn-dark" data-action="block-16">Bloquer 16h</button>
    </div>

    <div id="admin-list" aria-live="polite"></div>
  `;

  const dateInput = root.querySelector("#block-date");
  if (dateInput) dateInput.value = _todayIso();

  root.addEventListener("click", (e) => {
    const logout = e.target.closest('[data-action="logout"]');
    if (logout) {
      sessionStorage.removeItem("admin_password");
      _toast("Déconnecté.", "info");
      return _render();
    }

    const rangeBtn = e.target.closest("[data-range]");
    if (rangeBtn) {
      _loadReservations(root, rangeBtn.dataset.range);
      return;
    }

    const blockBtn = e.target.closest('[data-action="block-16"]');
    if (blockBtn) {
      const date = root.querySelector("#block-date")?.value;
      if (!date) return _toast("Veuillez choisir une date.", "info");
      _blockSlot(date, "16:00");
      return;
    }

    const confirmBtn = e.target.closest('[data-action="confirm"]');
    if (confirmBtn) {
      _patchReservation(confirmBtn.dataset.id, "confirmer");
      return;
    }

    const cancelBtn = e.target.closest('[data-action="cancel"]');
    if (cancelBtn) {
      _patchReservation(cancelBtn.dataset.id, "annuler");
      return;
    }
  });

  await _loadReservations(root, "today");
}

async function _loadReservations(root, range) {
  const listEl = root.querySelector("#admin-list");
  if (!listEl) return;

  listEl.innerHTML = `
    <p style="font-size:var(--fs-sm);color:var(--muted);">Chargement…</p>
  `;

  const { start, end } = _rangeToDates(range);

  try {
    const url = new URL(`${BACKEND_URL}/admin/reservations`);
    if (start) url.searchParams.set("start", start);
    if (end) url.searchParams.set("end", end);

    const res = await fetch(url.toString(), {
      headers: _adminHeaders(),
    });

    if (!res.ok) {
      if (res.status === 401) {
        sessionStorage.removeItem("admin_password");
        _toast("Mot de passe invalide.", "error");
        return _render();
      }
      throw new Error(await res.text());
    }

    const data = await res.json();
    const reservations = Array.isArray(data.reservations)
      ? data.reservations
      : [];

    reservations.sort((a, b) => {
      const da = String(a.date || "");
      const db = String(b.date || "");
      if (da !== db) return da.localeCompare(db);
      return String(a.time || a.slot || "").localeCompare(
        String(b.time || b.slot || ""),
      );
    });

    listEl.innerHTML = reservations.length
      ? reservations.map(_renderReservationCard).join("")
      : `<p style="font-size:var(--fs-sm);color:var(--muted);">Aucune réservation.</p>`;
  } catch (err) {
    console.error("[admin] loadReservations:", err);
    listEl.innerHTML = `<p style="font-size:var(--fs-sm);color:var(--muted);">Erreur de chargement.</p>`;
  }
}

function _renderReservationCard(r) {
  const status = String(r.status || "—");
  const id = String(r.id || "");
  const isCancelled = _isCancelledStatus(status);
  const canConfirm = !isCancelled && status !== "confirmé";

  const rows = [
    ["Statut", status],
    ["Client", r.clientName],
    ["Service", r.service],
    ["Date", r.date],
    ["Heure", r.time || r.slot],
    ["Téléphone", r.phone],
    ["Email", r.email],
  ];

  return `
    <div class="booking-confirmation" style="margin-bottom:var(--space-lg);">
      <h3 class="booking-confirmation__title" style="font-size:var(--fs-md);">Réservation</h3>
      <p class="booking-confirmation__text" style="font-size:var(--fs-xs);color:var(--muted);margin-top:0;">ID : ${_esc(id)}</p>

      <div class="booking-confirmation__recap">
        ${rows
          .map(
            ([label, value]) => `
            <div class="booking-confirmation__recap-row">
              <span class="booking-confirmation__recap-label">${_esc(label)}</span>
              <span class="booking-confirmation__recap-value">${_esc(String(value ?? "—"))}</span>
            </div>`,
          )
          .join("")}
      </div>

      <div style="display:flex;flex-wrap:wrap;gap:var(--space-sm);justify-content:flex-end;margin-top:var(--space-md);">
        <button type="button" class="btn btn-ghost btn--sm" data-action="cancel" data-id="${_escAttr(id)}" ${isCancelled ? 'disabled aria-disabled="true"' : ""}>
          Annuler
        </button>
        <button type="button" class="btn btn-dark btn--sm" data-action="confirm" data-id="${_escAttr(id)}" ${!canConfirm ? 'disabled aria-disabled="true"' : ""}>
          Confirmer paiement
        </button>
      </div>
    </div>`;
}

async function _patchReservation(id, action) {
  if (!id) return;

  try {
    const res = await fetch(
      `${BACKEND_URL}/reservation/${encodeURIComponent(id)}/${action}`,
      {
        method: "PATCH",
        headers: _adminHeaders(),
      },
    );

    if (!res.ok) {
      if (res.status === 401) {
        sessionStorage.removeItem("admin_password");
        _toast("Mot de passe invalide.", "error");
        return _render();
      }
      throw new Error(await res.text());
    }

    _toast(
      action === "confirmer"
        ? "Réservation confirmée."
        : "Réservation annulée.",
      "success",
    );

    const root = document.getElementById("admin-root");
    if (root) _loadReservations(root, "today");
  } catch (err) {
    console.error("[admin] patchReservation:", err);
    _toast("Action impossible. Réessayez.", "error");
  }
}

async function _blockSlot(date, slot) {
  try {
    const res = await fetch(`${BACKEND_URL}/bloquer-creneau`, {
      method: "POST",
      headers: { ..._adminHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ date, slot, reason: "admin" }),
    });

    if (!res.ok) {
      if (res.status === 401) {
        sessionStorage.removeItem("admin_password");
        _toast("Mot de passe invalide.", "error");
        return _render();
      }
      throw new Error(await res.text());
    }

    _toast(`Créneau ${slot} bloqué pour ${date}.`, "success");
  } catch (err) {
    console.error("[admin] blockSlot:", err);
    _toast("Blocage impossible.", "error");
  }
}

function _adminHeaders() {
  const pwd = sessionStorage.getItem("admin_password") || "";
  return {
    "X-Admin-Password": pwd,
  };
}

function _rangeToDates(range) {
  const today = _todayIso();

  if (range === "today") {
    return { start: today, end: today };
  }

  if (range === "week") {
    return { start: today, end: _addDaysIso(today, 6) };
  }

  return { start: null, end: null };
}

function _todayIso() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function _addDaysIso(iso, days) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d + days);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

function _isCancelledStatus(status) {
  const s = String(status || "").toLowerCase();
  return (
    s === "annulé" || s === "annule" || s === "cancelled" || s === "canceled"
  );
}

function _toast(message, type = "info") {
  document.dispatchEvent(
    new CustomEvent("app:toast", { detail: { message, type } }),
  );
}

function _esc(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function _escAttr(str) {
  return _esc(str).replace(/\"/g, "&quot;");
}
