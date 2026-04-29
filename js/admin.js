// ============================================================
//  js/admin.js — Dashboard admin (hash #admin)
//  Glow Room Studio
// ============================================================

import { onPageEnter } from "./router.js";

const BACKEND_URL = "https://glow-room-backend.onrender.com";

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

let _calYear = null;
let _calMonth = null; // 0-indexed
let _selectedDate = null; // YYYY-MM-DD
let _monthCounts = new Map(); // Map<YYYY-MM-DD, count>
let _currentListMode = { type: 'date', value: null };

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
  const now = new Date();
  if (_calYear === null) _calYear = now.getFullYear();
  if (_calMonth === null) _calMonth = now.getMonth();
  if (!_selectedDate) _selectedDate = _todayIso();

  root.innerHTML = `
    <div style="display:flex;flex-wrap:wrap;gap:var(--space-md);align-items:center;justify-content:space-between;margin-bottom:var(--space-lg);">
      <div style="display:flex;flex-wrap:wrap;gap:var(--space-sm);">
        <button type="button" class="btn btn-ghost btn--sm" data-range="today">Aujourd'hui</button>
        <button type="button" class="btn btn-ghost btn--sm" data-range="week">Semaine</button>
        <button type="button" class="btn btn-ghost btn--sm" data-range="all">Toutes</button>
      </div>
      <div style="display:flex;gap:var(--space-sm);align-items:center;">
        <button type="button" class="btn btn-ghost btn--sm" data-action="smtp-test">Tester email</button>
        <button type="button" class="btn btn-ghost btn--sm" data-action="logout">Déconnexion</button>
      </div>
    </div>

    <div class="info-box" style="margin-bottom:var(--space-lg);">
      <span class="info-box__icon" aria-hidden="true">ℹ</span>
      <span>
        Actions disponibles : confirmer un paiement, annuler une réservation, bloquer le créneau 16h.
      </span>
    </div>

    <div class="grid grid--2" style="align-items:start;gap:var(--space-xl);margin-bottom:var(--space-xl);">
      <div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-md);">
          <button type="button" class="btn btn-ghost btn--sm" data-action="cal-prev">◀</button>
          <strong data-cal-month style="font-family:var(--font-serif);color:var(--brown);font-size:var(--fs-md);"></strong>
          <button type="button" class="btn btn-ghost btn--sm" data-action="cal-next">▶</button>
        </div>

        <div class="booking-calendar" data-cal-grid></div>

        <div style="margin-top:var(--space-md);display:flex;flex-wrap:wrap;gap:var(--space-md);align-items:end;">
          <div class="form-group" style="min-width:240px;">
            <label class="form-label" for="block-date">Date sélectionnée</label>
            <input class="form-input" type="date" id="block-date" />
          </div>
          <button type="button" class="btn btn-dark" data-action="block-16">Bloquer 16h</button>
          <button type="button" class="btn btn-ghost" data-action="load-day">Voir réservations du jour</button>
        </div>
      </div>

      <div>
        <div class="info-box" style="margin-bottom:var(--space-md);">
          <span class="info-box__icon" aria-hidden="true">🗓</span>
          <span>
            Cliquez une date pour la sélectionner. "Voir réservations du jour" filtre la liste sur cette date.
          </span>
        </div>
      </div>
    </div>

    <div id="admin-list" aria-live="polite"></div>
  `;

  const dateInput = root.querySelector("#block-date");
  if (dateInput) dateInput.value = _selectedDate;

  root.addEventListener("click", (e) => {
    const logout = e.target.closest('[data-action="logout"]');
    if (logout) {
      sessionStorage.removeItem("admin_password");
      _toast("Déconnecté.", "info");
      return _render();
    }

    const smtpTest = e.target.closest('[data-action="smtp-test"]');
    if (smtpTest) {
      _smtpTest();
      return;
    }

    const rangeBtn = e.target.closest("[data-range]");
    if (rangeBtn) {
      _loadReservations(root, rangeBtn.dataset.range);
      return;
    }

    const prev = e.target.closest('[data-action="cal-prev"]');
    if (prev) {
      _changeMonth(-1, root);
      return;
    }

    const next = e.target.closest('[data-action="cal-next"]');
    if (next) {
      _changeMonth(+1, root);
      return;
    }

    const day = e.target.closest("[data-cal-day]");
    if (day) {
      _selectDate(day.dataset.calDay, root);
      return;
    }

    const blockBtn = e.target.closest('[data-action="block-16"]');
    if (blockBtn) {
      const date = root.querySelector("#block-date")?.value;
      if (!date) return _toast("Veuillez choisir une date.", "info");
      _blockSlot(date, "16:00");
      return;
    }

    const loadDay = e.target.closest('[data-action="load-day"]');
    if (loadDay) {
      const date = root.querySelector("#block-date")?.value;
      if (!date) return _toast("Veuillez choisir une date.", "info");
      _loadReservationsForDate(root, date);
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

  _refreshCalendar(root);
  await _loadMonthCounts();
  _refreshCalendar(root);
  await _loadReservationsForDate(root, _selectedDate);
}

async function _smtpTest() {
  try {
    const res = await fetch(`${BACKEND_URL}/admin/test-email`, {
      method: "POST",
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

    _toast("Email de test envoyé.", "success");
  } catch (err) {
    console.error("[admin] smtpTest:", err);
    _toast("Envoi test impossible (voir logs backend).", "error");
  }
}

function _changeMonth(dir, root) {
  const candidate = new Date(_calYear, _calMonth + dir, 1);
  const min = new Date(2020, 0, 1);
  const max = new Date(2099, 11, 1);
  if (candidate < min || candidate > max) return;
  _calYear = candidate.getFullYear();
  _calMonth = candidate.getMonth();
  _loadMonthCounts().finally(() => {
    _refreshCalendar(root);
  });
}

function _selectDate(isoDate, root) {
  _selectedDate = isoDate;
  const input = root.querySelector("#block-date");
  if (input) input.value = isoDate;
  _refreshCalendar(root);
}

function _refreshCalendar(root) {
  const monthLabel = root.querySelector("[data-cal-month]");
  const grid = root.querySelector("[data-cal-grid]");
  if (!monthLabel || !grid) return;

  monthLabel.textContent = `${MONTH_NAMES[_calMonth]} ${_calYear}`;

  const first = new Date(_calYear, _calMonth, 1);
  const last = new Date(_calYear, _calMonth + 1, 0);

  // JS: 0=Dim..6=Sam, on veut démarrer lundi
  const jsDay = first.getDay();
  const offset = (jsDay + 6) % 7; // lun=0 ... dim=6

  const cells = [];
  for (let i = 0; i < offset; i++) {
    cells.push(
      `<div class="booking-calendar__day is-empty" aria-hidden="true"></div>`,
    );
  }

  for (let d = 1; d <= last.getDate(); d++) {
    const iso = _toIsoDate(_calYear, _calMonth, d);
    const isSelected = iso === _selectedDate;
    const count = _monthCounts.get(iso) || 0;
    const badge = count
      ? `<span style="display:inline-block;min-width:18px;padding:2px 6px;border-radius:999px;background:var(--caramel2);color:var(--brown);font-size:12px;line-height:1;">${count}</span>`
      : "";

    cells.push(`
      <button type="button"
        class="booking-calendar__day ${isSelected ? "is-selected" : ""}"
        data-cal-day="${_escAttr(iso)}"
        aria-pressed="${isSelected}"
      >
        <span>${d}</span>
        ${badge}
      </button>
    `);
  }

  const head = DAY_ABBREVS.map(
    (d) => `<div class="booking-calendar__head" aria-hidden="true">${d}</div>`,
  ).join("");

  grid.innerHTML = `${head}${cells.join("")}`;
}

function _toIsoDate(year, month0, day) {
  const m = String(month0 + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

async function _loadMonthCounts() {
  const start = _toIsoDate(_calYear, _calMonth, 1);
  const end = _toIsoDate(_calYear, _calMonth + 1, 0);

  try {
    const url = new URL(`${BACKEND_URL}/admin/reservations`);
    url.searchParams.set("start", start);
    url.searchParams.set("end", end);

    const res = await fetch(url.toString(), { headers: _adminHeaders() });
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
    const map = new Map();
    for (const r of reservations) {
      const date = String(r?.date || "");
      if (!date) continue;
      map.set(date, (map.get(date) || 0) + 1);
    }
    _monthCounts = map;
  } catch (err) {
    console.error("[admin] loadMonthCounts:", err);
    _monthCounts = new Map();
  }
}

async function _loadReservationsForDate(root, date) {
  _currentListMode = { type: 'date', value: date };
  const listEl = root.querySelector("#admin-list");
  if (!listEl) return;
  listEl.innerHTML = `<p style="font-size:var(--fs-sm);color:var(--muted);">Chargement…</p>`;

  try {
    const url = new URL(`${BACKEND_URL}/admin/reservations`);
    url.searchParams.set("start", date);
    url.searchParams.set("end", date);

    const res = await fetch(url.toString(), { headers: _adminHeaders() });

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
      return String(a.time || a.slot || "").localeCompare(
        String(b.time || b.slot || ""),
      );
    });

    listEl.innerHTML = reservations.length
      ? reservations.map(_renderReservationCard).join("")
      : `<p style="font-size:var(--fs-sm);color:var(--muted);">Aucune réservation pour ${_esc(date)}.</p>`;
  } catch (err) {
    console.error("[admin] loadReservationsForDate:", err);
    listEl.innerHTML = `<p style="font-size:var(--fs-sm);color:var(--muted);">Erreur de chargement.</p>`;
  }
}

async function _loadReservations(root, range) {
  _currentListMode = { type: 'range', value: range };
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

  let body = null;
  if (action === "annuler") {
    const reason = prompt("Raison de l'annulation (sera envoyée au client) :\nLaissez vide pour la raison par défaut (Délai de paiement dépassé).", "Délai de paiement de 15 minutes dépassé.");
    if (reason === null) return; // L'utilisateur a cliqué sur Annuler dans le prompt
    if (reason.trim()) body = JSON.stringify({ reason: reason.trim() });
  }

  try {
    const headers = _adminHeaders();
    if (body) headers["Content-Type"] = "application/json";

    const res = await fetch(
      `${BACKEND_URL}/reservation/${encodeURIComponent(id)}/${action}`,
      {
        method: "PATCH",
        headers,
        body,
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
    if (root) {
      if (_currentListMode.type === 'range') {
        _loadReservations(root, _currentListMode.value);
      } else {
        _loadReservationsForDate(root, _currentListMode.value || _selectedDate);
      }
    }
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
