# Glow Room Hair — Instructions pour Claude Code

## Contexte du projet

Site vitrine + réservation + paiement en ligne pour **Glow Room Studio**, salon spécialisé
dans les tresses et coiffures protectrices basé à Ottawa–Gatineau, Canada.
**Projet client réel.** Ne jamais inventer de services, prix ou informations non confirmés
par le cahier des charges.

- Type : Application web (SPA — Single Page Application)
- Langue : Français / Anglais (contenu bilingue à venir)
- Développeuse : seule sur ce projet

---

## Stack technique — CONTRAINTES STRICTES

### Frontend

- **HTML5 sémantique uniquement** — balises nav, main, section, footer obligatoires
- **CSS3 modulaire** — 4 fichiers séparés, aucun style inline sauf exceptions justifiées
- **JavaScript Vanilla** — AUCUN framework (pas de React, Vue, jQuery, etc.)
- Code léger et performant, chargement optimisé
- Images : format WebP, max 200KB, attributs width/height définis
- CSS chargé dans `<head>`, JS chargé avec `defer` en fin de `<body>`

### Backend

- **Node.js 18+ LTS** + **Express.js 4.x**
- **MongoDB + Mongoose 7.x** (ou Firebase — à confirmer)
- **Stripe SDK** (latest) pour paiements et webhooks
- **Nodemailer 6.x** pour emails
- Architecture MVC légère : routes / controllers / models / services / middlewares

### Paiement

- **Stripe Checkout** — dépôt de 15$ non remboursable
- Méthodes acceptées : Carte bancaire, Apple Pay, Google Pay, Interac Online
- Interac e-Transfer : manuel (secondaire/optionnel)
- **JAMAIS valider une réservation sans vérification du webhook Stripe signé**
- Variables d'environnement obligatoires : STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET

### Hébergement

- Frontend : **Vercel** (déploiement automatique sur push main)
- Backend : **Render** ou **Railway** (dépôt GitHub séparé)
- HTTPS obligatoire en production — SSL automatique via Vercel / Render

---

## Architecture des fichiers

### Frontend

```
glow-room-hair/
├── index.html              ← Point d'entrée unique (SPA)
├── css/
│   ├── base.css            ← Reset, variables CSS, typographie
│   ├── layout.css          ← Navbar, footer, grilles
│   ├── components.css      ← Cards, boutons, formulaires, toast
│   └── pages.css           ← Styles spécifiques à chaque page
├── js/
│   ├── data.js             ← SOURCE UNIQUE des données (services, horaires, avis)
│   ├── router.js           ← Navigation entre pages (show/hide)
│   ├── services.js         ← Affichage catalogue services
│   ├── booking.js          ← Tunnel de réservation 6 étapes + appel Stripe
│   ├── reviews.js          ← Affichage avis clients
│   ├── contact.js          ← Formulaire + horaires
│   └── main.js             ← Init globale, toast, utilitaires
├── images/                 ← Photos optimisées (WebP)
├── robots.txt
└── sitemap.xml
```

### Backend (dépôt séparé : glow-room-backend)

```
glow-room-backend/
├── server.js               ← Point d'entrée Express
├── .env                    ← JAMAIS committé
├── .env.example            ← Template variables requises
├── routes/
│   ├── checkout.js         ← POST /create-checkout-session
│   ├── webhook.js          ← POST /webhook
│   └── reservation.js      ← GET /reservation/:id
├── controllers/
│   ├── checkoutController.js
│   ├── webhookController.js
│   └── reservationController.js
├── models/
│   └── Reservation.js      ← Schéma Mongoose
├── services/
│   ├── stripeService.js
│   └── emailService.js
└── middlewares/
    ├── errorHandler.js
    └── validateReservation.js
```

---

## API REST — Endpoints

| Méthode | Endpoint                 | Rôle                                             |
| ------- | ------------------------ | ------------------------------------------------ |
| POST    | /create-checkout-session | Crée session Stripe + retourne URL               |
| POST    | /webhook                 | Reçoit événements Stripe (signature obligatoire) |
| POST    | /reservation             | Enregistre réservation après webhook confirmé    |
| GET     | /reservation/:id         | Récupère réservation par ID                      |

---

## Design System

### Palette de couleurs (variables CSS)

```css
--bg: #f7f0e8 /* Fond principal — beige chaud */ --bg2: #ede3d6
  /* Fond secondaire */ --card: #faf5ee /* Fond des cartes */ --cream: #fdf8f2
  /* Crème */ --brown: #3b1f0c /* Brun foncé — titres, CTA */ --brown2: #6b3a1f
  /* Brun moyen */ --caramel: #c28448 /* Caramel — accents */
  --caramel2: #d9a96e /* Caramel clair */ --text: #2e1a0a /* Texte principal */
  --muted: #8c6b52 /* Texte secondaire */ --border: #d9c8b4 /* Bordures */;
```

### Typographie (à confirmer avec client)

- Titres : Playfair Display (serif)
- Corps : Jost (sans-serif)

### Transitions

- Standard : `0.22s ease` sur tous les éléments interactifs
- Booking steps : `fadeSlide 0.35s` à chaque changement d'étape
- Menu mobile : `translateX 0.35s cubic-bezier(.4,0,.2,1)`

### Responsive

- Mobile-first obligatoire
- Breakpoint principal : 960px
- Menu hamburger en dessous de 960px
- Navbar sticky en permanence

---

## Services & Tarifs — DONNÉES OFFICIELLES

### FEMMES

**Classiques Braids** (Marley Twists, Fausse Locks, Knotless Braids, Kinky Twist)
| Style | Prix |
|-------|------|
| Épaules | 80$ |
| Mi-dos | 100$ |
| Bas du dos | 110$ |

**Goddess Braids** (Boho Braids, Bora Bora Braids)
| Style | Prix |
|-------|------|
| Épaules | 90$ |
| Mi-dos | 110$ |
| Bas du dos | 120$ |

**French Curls**
| Style | Prix |
|-------|------|
| Épaules | 100$ |
| Mi-dos | 120$ |
| Bas du dos | 140$ |

### HOMMES

**Classiques Braids**
| Style | Prix |
|-------|------|
| Nattes | 50–70$ |
| Twist | 70$ |
| Box Braids | 75$ |
| Flat Twist | 85$ |

**Locks (Retwist)**
| Nombre | Prix |
|--------|------|
| 40–60 locks | 70$ |
| 61–80 locks | 90$ |
| 81–100 locks | 110$ |

**Retwist & Vanille**
| Nombre | Prix |
|--------|------|
| 40–60 locks | 90$ |
| 61–80 locks | 110$ |
| 81–100 locks | 130$ |

_Extensions non incluses dans tous les prix._

---

## Tunnel de réservation (6 étapes)

| Étape | Nom           | Fonction JS | Validation                                    |
| ----- | ------------- | ----------- | --------------------------------------------- |
| 0     | Bienvenue     | renderS0()  | Aucune                                        |
| 1     | Choix service | renderS1()  | service !== null                              |
| 2     | Date & Heure  | renderS2()  | date && time                                  |
| 3     | Informations  | renderS3()  | nom + tel + email valides                     |
| 4     | Dépôt         | renderS4()  | paymentMethod + POST /create-checkout-session |
| 5     | Confirmation  | renderS5()  | Réservation enregistrée en base               |

L'état global du tunnel est géré dans un objet central `B` (ou `bookingState`) dans `booking.js`.

---

## Horaires d'ouverture

| Jour             | Horaire             |
| ---------------- | ------------------- |
| Lundi – Vendredi | 08h30/09h00 – 21h30 |
| Samedi           | 13h00 – 21h00       |
| Dimanche         | Fermé               |

---

## Politiques du salon

- **Dépôt** : 15$ non remboursable, déduit de la facture finale
- **Retard** : grâce de 15 min, au-delà le RDV peut être annulé
- **Annulation** : préavis 24h obligatoire, sinon perte du dépôt

---

## Informations de contact

- Téléphone/WhatsApp : 416-836-4556
- Email : Tinidk17@gmail.com
- Instagram : @glowroom.braids
- Snapchat : @tini_dk
- Localisation : Ottawa – Gatineau, Canada

---

## Sécurité — RÈGLES ABSOLUES

- `.env` jamais committé sur GitHub — contient les clés Stripe et DB
- Clé secrète Stripe **uniquement** dans les variables d'environnement
- Webhook vérifié via `stripe.webhooks.constructEvent()` + STRIPE_WEBHOOK_SECRET
- Aucune réservation créée en base sans confirmation webhook valide
- Données sensibles (email, téléphone) jamais loggées en console
- CORS configuré pour n'accepter que l'URL du frontend en production
- HTTPS obligatoire en production

---

## Conventions Git

- Commits en **français**
- Format : `type(scope): description`
- Types : feat, fix, docs, style, refactor, test, chore
- Branches : `feature/nom-fonctionnalite`, `fix/nom-bug`
- Jamais de push direct sur `main`
- Workflow : `feature/*` → `develop` → `main` (mise en ligne uniquement)

---

## SEO — Objectifs Lighthouse

- Performance > 90
- SEO > 95
- Accessibilité > 90
- Balises meta complètes (description, og:title, og:image, canonical)
- robots.txt + sitemap.xml présents
- Attributs `alt` sur toutes les images
- Contrastes WCAG AA

---

## Phases de développement

1. Cahier des charges ✅
2. Structure & data.js
3. CSS modulaire (base, layout, components, pages)
4. JavaScript modulaire (router, services, booking, contact)
5. index.html + SEO complet
6. Intégration Stripe + webhook
7. Tests bout-en-bout + mobile
8. Déploiement Vercel + Render + domaine + SSL
