# Glow Room Hair — Instructions pour Claude Code

## Contexte du projet

Site vitrine + réservation + paiement en ligne pour **Glow Room Hair**, salon spécialisé
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
- **Firebase Admin / Firestore** (réservations + créneaux bloqués)
- **Nodemailer 6.x** pour emails
- Architecture MVC légère : routes / controllers / models / services / middlewares

### Paiement

- Stripe supprimé complètement
- Méthode unique : Interac e-Transfer manuel
- Dépôt 15$ envoyé à Tinidk17@gmail.com
- Confirmation manuelle par la propriétaire via dashboard
- Statuts réservation : en_attente → confirmé → annulé

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
│   ├── booking.js          ← Tunnel de réservation 5 étapes + appel backend (Interac)
│   ├── reviews.js          ← Affichage avis clients
│   ├── contact.js          ← Formulaire + horaires
│   ├── admin.js            ← Dashboard admin (confirmer/annuler/bloquer créneaux)
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
│   ├── reservation.js      ← POST /reservation + GET slots + PATCH admin
│   ├── admin.js            ← GET /admin/reservations (protégé)
│   └── blockedSlots.js     ← POST /bloquer-creneau (protégé)
├── controllers/
│   └── reservationController.js
├── services/
│   ├── firebase.js         ← Init Firebase Admin
│   ├── reservationModel.js ← Accès Firestore
│   └── email.js            ← Emails (Interac + confirmations)
└── middlewares/
  └── requireAdmin.js     ← Protège les routes admin
```

---

## API REST — Endpoints

| Méthode | Endpoint                           | Rôle                                                  |
| ------- | ---------------------------------- | ----------------------------------------------------- |
| GET     | /slots-disponibles?date=YYYY-MM-DD | Retourne les créneaux occupés/bloqués pour une date   |
| POST    | /reservation                       | Crée une demande de réservation (statut `en_attente`) |
| GET     | /reservation/:id                   | Récupère une réservation par ID                       |
| PATCH   | /reservation/:id/confirmer         | Admin : confirme (statut `confirmé`) + email cliente  |
| PATCH   | /reservation/:id/annuler           | Admin : annule (statut `annulé`) + email cliente      |
| POST    | /bloquer-creneau                   | Admin : bloque un créneau (ex: 16:00) pour une date   |
| GET     | /admin/reservations?start&end      | Admin : liste les réservations sur une période        |

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

## Tunnel de réservation

- 5 étapes : Bienvenue → Service → Date/Heure → Infos → Confirmation
- Deux créneaux fixes par jour : 9h00 et 16h00
- Créneau 16h grisé automatiquement si durée prestation > 6h
- Durées par prestation dans data.js (champ dureeMinutes)
- Réservation enregistrée en Firebase avec statut 'en_attente'
- Email automatique avec instructions Interac envoyé à la cliente
- Pas de redirection vers une page de paiement

---

## Dashboard admin

- URL : /#admin (page protégée)
- Authentification : mot de passe simple stocké en variable d'environnement
- Fonctionnalités :
  - Liste des réservations (aujourd'hui / semaine / toutes)
  - Bouton "Confirmer paiement" par réservation → statut confirmé + email cliente
  - Bouton "Annuler" par réservation → statut annulé + email cliente
  - Bouton "Bloquer créneau 16h" par jour
- Déployé sur Vercel avec le frontend (page #admin)
- Appels API vers le backend Render

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

- `.env` jamais committé sur GitHub — contient les identifiants email + `ADMIN_PASSWORD`
- Mot de passe admin stocké côté backend uniquement (env), transmis via header (ex: `X-Admin-Password`)
- Ne jamais logguer en console les données sensibles (email, téléphone)
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

## Git workflow

Claude Code prépare les commits mais ne push jamais seul.
C'est l'utilisatrice qui valide et push.

À la fin de chaque étape terminée et vérifiée :
✅ Étape terminée — voici ton commit :

```
git add .
git commit -m "type(scope): description"
git push
```

Conventions :

- feat : nouvelle fonctionnalité
- fix : correction de bug
- style : changement visuel sans logique
- refactor : restructuration sans changement de comportement
- chore : config, dépendances, setup

Règles :

- Un commit par étape fonctionnelle
- Jamais de commit WIP
- Ne jamais committer .env ou clés API

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

## Principes fondamentaux

- Simplicité d'abord : impact minimal sur le code existant
- Vérifier avant de terminer : tester, vérifier les logs
- Correction autonome : corriger les bugs sans demander à l'utilisatrice
- Élégance : se demander s'il existe une solution plus simple avant d'implémenter
- Ne jamais marquer une tâche terminée sans prouver que ça fonctionne

---

## Phases de développement

1. Cahier des charges ✅
2. Structure & data.js
3. CSS modulaire (base, layout, components, pages)
4. JavaScript modulaire (router, services, booking, contact)
5. index.html + SEO complet
6. Intégration Interac (manuel) + dashboard admin
7. Tests bout-en-bout + mobile
8. Déploiement Vercel + Render + domaine + SSL

---

## Durées des prestations

Femmes (dépend longueur) :

- Classiques Braids épaules : 4h | mi-dos : 6h | bas du dos : 7h
- Goddess Braids épaules : 6h | mi-dos : 7h | bas du dos : 8h
- French Curls : selon complexité, 6h-8h

Hommes :

- Nattes : 1h30-2h
- Barrel/Flat Twist : 2h30-3h
- Box Braids : 3h
- Twist : 2h30
- Locks Retwist : 3h-4h (+ 1h30-2h si coiffure)

Règle créneaux :

- Prestation >= 6h → créneau 16h grisé automatiquement
- Prestation < 6h → les deux créneaux disponibles
