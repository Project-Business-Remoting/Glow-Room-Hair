# Glow Room Hair — Site web

Site vitrine + réservation en ligne pour **Glow Room Hair**, salon spécialisé en tresses et coiffures protectrices basé à **Ottawa–Gatineau, Canada**.

---

## Aperçu

| Rubrique | Valeur |
|---|---|
| Type | SPA (Single Page Application) — navigation par hash |
| Stack frontend | HTML5 sémantique · CSS3 modulaire · JavaScript Vanilla (ESM) |
| Stack backend | Node.js 18+ · Express 4.x · Firebase Firestore · Nodemailer |
| Hébergement frontend | Vercel (CI/CD sur branche `main`) |
| Hébergement backend | Render (dépôt séparé : `glow-room-backend`) |
| Paiement | Interac e-Transfer manuel (15 $ CAD non remboursable) |

---

## Architecture frontend

```
glow-room-hair/
├── index.html              ← Point d'entrée unique
├── manifest.json           ← PWA manifest
├── robots.txt
├── sitemap.xml
├── css/
│   ├── base.css            ← Variables CSS, reset, typographie
│   ├── layout.css          ← Navbar, footer, grilles
│   ├── components.css      ← Boutons, cards, formulaires, toast
│   └── pages.css           ← Styles par section (hero, booking, contact…)
├── js/
│   ├── data.js             ← Source unique de vérité (services, horaires, avis)
│   ├── router.js           ← Navigation SPA (hash-based)
│   ├── main.js             ← Bootstrap, menu mobile, toasts, scroll animations
│   ├── services.js         ← Catalogue services
│   ├── booking.js          ← Tunnel de réservation 5 étapes
│   ├── reviews.js          ← Avis clients
│   ├── contact.js          ← Formulaire contact + horaires
│   ├── admin.js            ← Dashboard admin (/#admin)
│   └── i18n.js             ← Internationalisation FR/EN
└── images/
    ├── favicon.svg         ← Icône SVG (Google, onglets)
    ├── icone.webp          ← Icône PWA (192×192)
    └── logo-principal.webp ← Logo principal
```

---

## Démarrage local

```bash
# Aucun serveur Node requis pour le frontend seul
# Utiliser un serveur statique pour éviter les erreurs CORS avec les modules ES

npx serve .
# ou
python3 -m http.server 3000
```

Ouvrir http://localhost:3000

---

## Tunnel de réservation

5 étapes : **Bienvenue → Service → Date/Heure → Infos → Confirmation**

- Créneaux fixes : **9h00** et **16h00**
- Le créneau 16h est grisé automatiquement si la prestation dure ≥ 6h (`dureeMinutes >= 360`)
- Disponibilité vérifiée via `GET /slots-disponibles?date=YYYY-MM-DD`
- Réservation enregistrée en Firebase avec statut `en_attente`
- Email automatique avec instructions Interac envoyé à la cliente

---

## Paiement

Méthode unique : **Interac e-Transfer manuel**

1. La cliente complète le tunnel de réservation
2. Elle envoie 15 $ CAD à `Tinidk17@gmail.com`
3. La propriétaire confirme depuis le dashboard `/#admin`
4. Email de confirmation envoyé automatiquement à la cliente

---

## Dashboard admin (`/#admin`)

- Protégé par mot de passe (variable d'environnement côté backend)
- Fonctionnalités : lister les réservations, confirmer/annuler, bloquer un créneau
- Appels API vers le backend Render

---

## API backend

| Méthode | Endpoint | Rôle |
|---|---|---|
| GET | `/slots-disponibles?date=YYYY-MM-DD` | Créneaux occupés/bloqués |
| POST | `/reservation` | Créer une demande (statut `en_attente`) |
| GET | `/reservation/:id` | Récupérer une réservation |
| PATCH | `/reservation/:id/confirmer` | Admin : confirmer + email |
| PATCH | `/reservation/:id/annuler` | Admin : annuler + email |
| POST | `/bloquer-creneau` | Admin : bloquer un créneau |
| GET | `/admin/reservations` | Admin : liste par période |

---

## Variables d'environnement (backend)

Copier `.env.example` → `.env` :

```env
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=
EMAIL_USER=
EMAIL_PASS=
ADMIN_PASSWORD=
FRONTEND_URL=https://glowroomhair.ca
```

---

## Conventions Git

```
feat(scope): description      # Nouvelle fonctionnalité
fix(scope): description       # Correction de bug
style(scope): description     # Changement visuel sans logique
refactor(scope): description  # Restructuration sans changement de comportement
chore(scope): description     # Config, dépendances, setup
```

- Workflow : `feature/*` → `develop` → `main` (production uniquement)
- Jamais de push direct sur `main`
- Jamais de commit de `.env` ou clés API

---

## SEO & Accessibilité

- Score Lighthouse cible : Performance > 90 · SEO > 95 · Accessibilité > 90
- Schéma JSON-LD `HairSalon` intégré dans `index.html`
- `robots.txt` + `sitemap.xml` présents
- `manifest.json` PWA configuré
- Contrastes WCAG AA respectés
- Focus management correct sur le menu mobile (aria-hidden sécurisé)

---

## Contact salon

- Téléphone/WhatsApp : 416-836-4556
- Email : Tinidk17@gmail.com
- Instagram : [@glowroom.braids](https://instagram.com/glowroom.braids)
- Localisation : Ottawa – Gatineau, Canada
