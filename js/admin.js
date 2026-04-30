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
let _activeTab = 'agenda'; // 'agenda' or 'trash'
let _statusFilter = 'all'; // 'all', 'en_attente', 'confirmé'
let _allLoadedReservations = []; // Cache pour filtrage local

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
    <!-- Top Bar -->
    <div style="display:flex;flex-wrap:wrap;gap:var(--space-md);align-items:center;justify-content:space-between;margin-bottom:var(--space-xl);">
      <div class="admin-tabs" style="display:flex;gap:var(--space-xs);background:var(--bg-card);padding:4px;border-radius:12px;border:1px solid rgba(194, 132, 72, 0.3);">
        <button type="button" class="admin-tab-btn ${(_activeTab === 'agenda') ? 'is-active' : ''}" data-tab="agenda">Agenda</button>
        <button type="button" class="admin-tab-btn ${(_activeTab === 'trash') ? 'is-active' : ''}" data-tab="trash">Corbeille</button>
      </div>
      
      <div style="display:flex;gap:var(--space-sm);align-items:center;">
        <button type="button" class="btn btn-ghost btn--sm" data-action="logout">Déconnexion</button>
      </div>
    </div>

    <!-- Main View -->
    <div id="admin-view-content">
      ${_activeTab === 'agenda' ? _buildAgendaHTML() : _buildTrashHTML()}
    </div>
  `;

  // Global styles for admin tabs if not in CSS
  if (!document.getElementById('admin-styles')) {
    const style = document.createElement('style');
    style.id = 'admin-styles';
    style.innerHTML = `
      .admin-tab-btn {
        padding: 8px 20px;
        border: none;
        background: transparent;
        color: var(--muted);
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
        font-size: var(--fs-xs);
        transition: all 0.3s ease;
      }
      .admin-tab-btn:hover {
        background: rgba(194, 132, 72, 0.1);
        color: var(--caramel);
      }
      .admin-tab-btn.is-active {
        background: var(--caramel);
        color: white;
        box-shadow: 0 4px 10px rgba(194, 132, 72, 0.25);
      }
      .filter-btn {
        padding: 6px 12px;
        border-radius: 20px;
        border: 1px solid var(--caramel2);
        background: white;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.2s;
        color: var(--muted);
      }
      .filter-btn:hover {
        border-color: var(--caramel);
        color: var(--caramel);
      }
      .filter-btn.is-active {
        background: var(--brown);
        color: white;
        border-color: var(--brown);
      }
    `;
    document.head.appendChild(style);
  }

  _bindEvents(root);
  
  if (_activeTab === 'agenda') {
    const dateInput = root.querySelector("#block-date");
    if (dateInput) dateInput.value = _selectedDate;
    _refreshCalendar(root);
    await _loadMonthCounts();
    _refreshCalendar(root);
    await _loadReservationsForDate(root, _selectedDate);
  } else {
    _loadTrash(root);
  }
}

function _buildAgendaHTML() {
  return `
    <div class="grid grid--2" style="align-items:start;gap:var(--space-xl);margin-bottom:var(--space-xl);">
      <div style="background:var(--bg-card);padding:var(--space-lg);border-radius:16px;box-shadow:0 10px 30px rgba(89,60,31,0.05);border:1px solid var(--caramel2);">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-md);">
          <button type="button" class="btn btn-ghost btn--sm" data-action="cal-prev">◀</button>
          <strong data-cal-month style="font-family:var(--font-serif);color:var(--brown);font-size:var(--fs-md);"></strong>
          <button type="button" class="btn btn-ghost btn--sm" data-action="cal-next">▶</button>
        </div>

        <div class="booking-calendar" data-cal-grid></div>

        <div style="margin-top:var(--space-md);display:flex;flex-wrap:wrap;gap:var(--space-md);align-items:end;">
          <div class="form-group" style="min-width:180px;margin-bottom:0;">
            <label class="form-label" for="block-date">Date cible</label>
            <input class="form-input" type="date" id="block-date" />
          </div>
          <button type="button" class="btn btn-dark" data-action="block-16" style="height:44px;">Bloquer 16h</button>
        </div>
      </div>

      <div class="admin-controls">
        <h3 style="font-family:var(--font-serif);color:var(--brown);margin-bottom:var(--space-md);">Filtres & Affichage</h3>
        <div style="display:flex;flex-wrap:wrap;gap:var(--space-sm);margin-bottom:var(--space-lg);">
          <button type="button" class="btn btn-ghost btn--sm" data-range="today">Aujourd'hui</button>
          <button type="button" class="btn btn-ghost btn--sm" data-range="week">Semaine</button>
          <button type="button" class="btn btn-ghost btn--sm" data-range="all">Toutes les actives</button>
        </div>
        
        <div style="background:var(--bg-card);padding:var(--space-md);border-radius:12px;border:1px solid var(--caramel2);">
           <p style="font-weight:600;font-size:var(--fs-xs);margin-bottom:10px;">Statut :</p>
           <div style="display:flex;gap:8px;">
             <button class="filter-btn ${_statusFilter === 'all' ? 'is-active' : ''}" data-status="all">Tout</button>
             <button class="filter-btn ${_statusFilter === 'en_attente' ? 'is-active' : ''}" data-status="en_attente">En attente</button>
             <button class="filter-btn ${_statusFilter === 'confirmé' ? 'is-active' : ''}" data-status="confirmé">Confirmé</button>
           </div>
        </div>
      </div>
    </div>

    <div id="admin-list" aria-live="polite"></div>
  `;
}

function _buildTrashHTML() {
  return `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-lg);">
      <h3 style="font-family:var(--font-serif);color:var(--brown);">Réservations annulées</h3>
      <button type="button" class="btn btn-dark btn--sm" data-action="empty-trash">Vider la corbeille</button>
    </div>
    <div id="admin-trash-list" aria-live="polite"></div>
  `;
}

function _bindEvents(root) {
  if (root.dataset.bound) return;
  root.dataset.bound = "true";

  root.addEventListener("click", async (e) => {
    const tabBtn = e.target.closest('[data-tab]');
    if (tabBtn) {
      _activeTab = tabBtn.dataset.tab;
      _renderDashboard(root);
      return;
    }

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

    const statusBtn = e.target.closest("[data-status]");
    if (statusBtn) {
      _statusFilter = statusBtn.dataset.status;
      _applyLocalFilters(root);
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
      _loadReservationsForDate(root, day.dataset.calDay);
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

    const deleteBtn = e.target.closest('[data-action="delete"]');
    if (deleteBtn) {
      if (confirm("Supprimer définitivement cette réservation ?")) {
        _deleteReservation(deleteBtn.dataset.id, root);
      }
      return;
    }

    const emptyTrash = e.target.closest('[data-action="empty-trash"]');
    if (emptyTrash) {
      if (confirm("Voulez-vous vraiment vider la corbeille ? Cette action est irréversible.")) {
        _emptyTrash(root);
      }
      return;
    }
  });
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

  const jsDay = first.getDay();
  const offset = (jsDay + 6) % 7;

  const cells = [];
  for (let i = 0; i < offset; i++) {
    cells.push(`<div class="booking-calendar__day is-empty" aria-hidden="true"></div>`);
  }

  for (let d = 1; d <= last.getDate(); d++) {
    const iso = _toIsoDate(_calYear, _calMonth, d);
    const isSelected = iso === _selectedDate;
    const count = _monthCounts.get(iso) || 0;
    const badge = count
      ? `<span style="display:inline-block;min-width:18px;padding:2px 6px;border-radius:999px;background:var(--caramel2);color:var(--brown);font-size:10px;line-height:1;">${count}</span>`
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

  const head = DAY_ABBREVS.map(d => `<div class="booking-calendar__day-name" aria-hidden="true">${d}</div>`).join("");
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
    if (!res.ok) throw new Error();

    const data = await res.json();
    const reservations = Array.isArray(data.reservations) ? data.reservations : [];
    const map = new Map();
    for (const r of reservations) {
      if (_isCancelledStatus(r.status)) continue;
      const date = String(r?.date || "");
      if (!date) continue;
      map.set(date, (map.get(date) || 0) + 1);
    }
    _monthCounts = map;
  } catch {
    _monthCounts = new Map();
  }
}

async function _loadReservationsForDate(root, date) {
  _currentListMode = { type: 'date', value: date };
  const listEl = root.querySelector("#admin-list");
  if (!listEl) return;
  listEl.innerHTML = `<p style="font-size:var(--fs-sm);color:var(--muted);text-align:center;">Chargement de l'agenda…</p>`;

  try {
    const url = new URL(`${BACKEND_URL}/admin/reservations`);
    url.searchParams.set("start", date);
    url.searchParams.set("end", date);

    const res = await fetch(url.toString(), { headers: _adminHeaders() });
    if (!res.ok) throw new Error();

    const data = await res.json();
    _allLoadedReservations = Array.isArray(data.reservations) ? data.reservations : [];
    _applyLocalFilters(root);
  } catch {
    listEl.innerHTML = `<p style="color:var(--error);text-align:center;">Erreur réseau.</p>`;
  }
}

async function _loadReservations(root, range) {
  _currentListMode = { type: 'range', value: range };
  const listEl = root.querySelector("#admin-list");
  if (!listEl) return;
  listEl.innerHTML = `<p style="font-size:var(--fs-sm);color:var(--muted);text-align:center;">Chargement…</p>`;

  const { start, end } = _rangeToDates(range);

  try {
    const url = new URL(`${BACKEND_URL}/admin/reservations`);
    if (start) url.searchParams.set("start", start);
    if (end) url.searchParams.set("end", end);

    const res = await fetch(url.toString(), { headers: _adminHeaders() });
    if (!res.ok) throw new Error();

    const data = await res.json();
    _allLoadedReservations = Array.isArray(data.reservations) ? data.reservations : [];
    _applyLocalFilters(root);
  } catch {
    listEl.innerHTML = `<p style="color:var(--error);text-align:center;">Erreur réseau.</p>`;
  }
}

async function _loadTrash(root) {
  const listEl = root.querySelector("#admin-trash-list");
  if (!listEl) return;
  listEl.innerHTML = `<p style="font-size:var(--fs-sm);color:var(--muted);text-align:center;">Ouverture de la corbeille…</p>`;

  try {
    const url = new URL(`${BACKEND_URL}/admin/reservations`);
    const res = await fetch(url.toString(), { headers: _adminHeaders() });
    if (!res.ok) throw new Error();

    const data = await res.json();
    const all = Array.isArray(data.reservations) ? data.reservations : [];
    const cancelled = all.filter(r => _isCancelledStatus(r.status));
    
    // Sort by createdAt (newest first)
    cancelled.sort((a,b) => (b.createdAt || "").localeCompare(a.createdAt || ""));

    listEl.innerHTML = cancelled.length
      ? cancelled.map(_renderReservationCard).join("")
      : `<p style="font-size:var(--fs-sm);color:var(--muted);text-align:center;padding:var(--space-xl);">La corbeille est vide. 🍃</p>`;
  } catch {
    listEl.innerHTML = `<p style="color:var(--error);text-align:center;">Erreur réseau.</p>`;
  }
}

function _applyLocalFilters(root) {
  const listEl = root.querySelector("#admin-list");
  if (!listEl) return;

  // 1. Filter out cancelled (agenda only shows active)
  let filtered = _allLoadedReservations.filter(r => !_isCancelledStatus(r.status));

  // 2. Filter by status
  if (_statusFilter !== 'all') {
    filtered = filtered.filter(r => r.status === _statusFilter);
  }

  // 3. Sort by priority (date then time)
  filtered.sort((a, b) => {
    const da = String(a.date || "");
    const db = String(b.date || "");
    if (da !== db) return da.localeCompare(db);
    return String(a.time || a.slot || "").localeCompare(String(b.time || b.slot || ""));
  });

  // 4. Highlight Filter Buttons
  root.querySelectorAll('[data-status]').forEach(btn => {
    btn.classList.toggle('is-active', btn.dataset.status === _statusFilter);
  });

  listEl.innerHTML = filtered.length
    ? filtered.map(_renderReservationCard).join("")
    : `<div style="text-align:center;padding:var(--space-xl);background:rgba(0,0,0,0.02);border-radius:12px;">
         <p style="font-size:var(--fs-sm);color:var(--muted);">Aucune réservation trouvée avec ces critères.</p>
       </div>`;
}

function _renderReservationCard(r) {
  const status = String(r.status || "en_attente");
  const id = String(r.id || "");
  const isCancelled = _isCancelledStatus(status);
  const isConfirmed = status === 'confirmé';
  const lang = r.lang === 'en' ? 'EN' : 'FR';

  let statusBadge = "";
  if (isCancelled) statusBadge = `<span style="color:#d9534f;font-weight:700;font-size:10px;text-transform:uppercase;border:1px solid #d9534f;padding:2px 6px;border-radius:4px;">Annulé</span>`;
  else if (isConfirmed) statusBadge = `<span style="color:#5cb85c;font-weight:700;font-size:10px;text-transform:uppercase;border:1px solid #5cb85c;padding:2px 6px;border-radius:4px;">Confirmé</span>`;
  else statusBadge = `<span style="color:var(--brown);font-weight:700;font-size:10px;text-transform:uppercase;border:1px solid var(--brown);padding:2px 6px;border-radius:4px;">En attente</span>`;

  return `
    <div class="booking-confirmation fade-in" style="margin-bottom:var(--space-lg);border:1px solid rgba(89,60,31,0.15);box-shadow:0 8px 24px rgba(89,60,31,0.06);text-align:left;background:#fff;padding:20px;border-radius:16px;">
      <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:15px;">
        <div>
          <h3 style="font-size:var(--fs-md);color:var(--brown);margin:0;">${_esc(r.clientName)}</h3>
          <p style="font-size:11px;color:var(--muted);margin:0;">ID: ${_esc(id)} | ${lang}</p>
        </div>
        ${statusBadge}
      </div>

      <div class="booking-confirmation__recap" style="background:var(--bg-card);border:none;padding:15px;">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
          <div>
            <p style="font-size:10px;text-transform:uppercase;color:var(--muted);margin:0;">Service</p>
            <p style="font-size:var(--fs-xs);font-weight:600;margin:0;">${_esc(r.service)}</p>
          </div>
          <div>
            <p style="font-size:10px;text-transform:uppercase;color:var(--muted);margin:0;">Date & Heure</p>
            <p style="font-size:var(--fs-xs);font-weight:600;margin:0;">${_esc(r.date)} à ${_esc(r.time || r.slot)}</p>
          </div>
          <div>
            <p style="font-size:10px;text-transform:uppercase;color:var(--muted);margin:0;">Contact</p>
            <p style="font-size:var(--fs-xs);margin:0;">${_esc(r.phone || "—")}</p>
            <p style="font-size:var(--fs-xs);margin:0;">${_esc(r.email || "—")}</p>
          </div>
          <div>
             <p style="font-size:10px;text-transform:uppercase;color:var(--muted);margin:0;">Dépôt</p>
             <p style="font-size:var(--fs-xs);margin:0;">${r.amountPaid ? (r.amountPaid/100).toFixed(2)+'$' : '25.00$ (Prévu)'}</p>
          </div>
        </div>
      </div>

      <div style="display:flex;flex-wrap:wrap;gap:var(--space-sm);justify-content:flex-end;margin-top:var(--space-md);">
        ${isCancelled ? `
          <button type="button" class="btn btn-ghost btn--sm" data-action="delete" data-id="${_escAttr(id)}" style="color:#d9534f;">
            Supprimer définitivement
          </button>
        ` : `
          <button type="button" class="btn btn-ghost btn--sm" data-action="cancel" data-id="${_escAttr(id)}">
            Annuler
          </button>
          ${!isConfirmed ? `
            <button type="button" class="btn btn-dark btn--sm" data-action="confirm" data-id="${_escAttr(id)}">
              Confirmer paiement
            </button>
          ` : ''}
        `}
      </div>
    </div>`;
}

async function _patchReservation(id, action) {
  if (!id) return;

  let body = null;
  if (action === "annuler") {
    const reason = prompt("Raison de l'annulation (sera envoyée au client) :\nLaissez vide pour la raison par défaut.", "Délai de paiement de 15 minutes dépassé.");
    if (reason === null) return;
    if (reason.trim()) body = JSON.stringify({ reason: reason.trim() });
  }

  try {
    const headers = _adminHeaders();
    if (body) headers["Content-Type"] = "application/json";

    const res = await fetch(`${BACKEND_URL}/reservation/${encodeURIComponent(id)}/${action}`, {
      method: "PATCH",
      headers,
      body,
    });

    if (!res.ok) throw new Error();

    _toast(action === "confirmer" ? "Réservation confirmée." : "Réservation annulée.", "success");
    _refreshView();
  } catch (err) {
    _toast("Action impossible.", "error");
  }
}

async function _deleteReservation(id, root) {
  try {
    const res = await fetch(`${BACKEND_URL}/admin/reservations/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: _adminHeaders(),
    });
    if (!res.ok) throw new Error();
    _toast("Réservation supprimée.", "success");
    _loadTrash(root);
  } catch {
    _toast("Erreur suppression.", "error");
  }
}

async function _emptyTrash(root) {
  try {
    const res = await fetch(`${BACKEND_URL}/admin/reservations/trash`, {
      method: "DELETE",
      headers: _adminHeaders(),
    });
    if (!res.ok) throw new Error();
    const data = await res.json();
    _toast(`${data.deletedCount} réservations supprimées.`, "success");
    _loadTrash(root);
  } catch {
    _toast("Erreur vidage corbeille.", "error");
  }
}

function _refreshView() {
  const root = document.getElementById("admin-root");
  if (!root) return;
  if (_activeTab === 'agenda') {
    if (_currentListMode.type === 'range') {
      _loadReservations(root, _currentListMode.value);
    } else {
      _loadReservationsForDate(root, _currentListMode.value || _selectedDate);
    }
    _loadMonthCounts().then(() => _refreshCalendar(root));
  } else {
    _loadTrash(root);
  }
}

async function _blockSlot(date, slot) {
  try {
    const res = await fetch(`${BACKEND_URL}/bloquer-creneau`, {
      method: "POST",
      headers: { ..._adminHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ date, slot, reason: "admin" }),
    });
    if (!res.ok) throw new Error();
    _toast(`Créneau ${slot} bloqué pour ${date}.`, "success");
  } catch {
    _toast("Blocage impossible.", "error");
  }
}

function _adminHeaders() {
  const pwd = sessionStorage.getItem("admin_password") || "";
  return { "X-Admin-Password": pwd };
}

function _rangeToDates(range) {
  const today = _todayIso();
  if (range === "today") return { start: today, end: today };
  if (range === "week") return { start: today, end: _addDaysIso(today, 6) };
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
  return (s === "annulé" || s === "annule" || s === "cancelled" || s === "canceled");
}

function _toast(message, type = "info") {
  document.dispatchEvent(new CustomEvent("app:toast", { detail: { message, type } }));
}

function _esc(str) {
  return String(str ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function _escAttr(str) {
  return _esc(str).replace(/\"/g, "&quot;");
}
