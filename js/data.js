// ============================================================
//  js/data.js — SOURCE UNIQUE DE VÉRITÉ
//  Glow Room Hair · Ottawa–Gatineau
//  ⚠ Ne pas modifier sans validation du cahier des charges
// ============================================================

// ─── SALON ──────────────────────────────────────────────────

export const SALON = {
  nom: 'Glow Room Hair',
  slogan: 'Salon spécialisé en tresses et coiffures protectrices',
  localisation: 'Ottawa – Gatineau, Canada',
  telephone: '416-836-4556',
  whatsapp: '416-836-4556',
  email: 'Tinidk17@gmail.com',
  instagram: '@glowroom.braids',
  snapchat: '@tini_dk',
};

// ─── HORAIRES ───────────────────────────────────────────────
// ouvertureVariable : l'heure d'ouverture peut varier entre 8h30 et 9h00

export const HORAIRES = [
  { jour: 'Lundi',    ouvert: true,  debut: '08:30', fin: '21:30', ouvertureVariable: true },
  { jour: 'Mardi',    ouvert: true,  debut: '08:30', fin: '21:30', ouvertureVariable: true },
  { jour: 'Mercredi', ouvert: true,  debut: '08:30', fin: '21:30', ouvertureVariable: true },
  { jour: 'Jeudi',    ouvert: true,  debut: '08:30', fin: '21:30', ouvertureVariable: true },
  { jour: 'Vendredi', ouvert: true,  debut: '08:30', fin: '21:30', ouvertureVariable: true },
  { jour: 'Samedi',   ouvert: true,  debut: '13:00', fin: '21:00', ouvertureVariable: false },
  { jour: 'Dimanche', ouvert: false, debut: null,    fin: null,    ouvertureVariable: false },
];

// ─── POLITIQUES ─────────────────────────────────────────────

export const POLITIQUES = {
  depot: {
    montant: 25,
    devise: 'CAD',
    remboursable: false,
    description: 'Un dépôt de 25$ est requis à la réservation. Il est déduit de la facture finale et n\'est pas remboursable.',
  },
  retard: {
    graceMinutes: 15,
    description: 'Une grâce de 15 minutes est accordée. Au-delà, le rendez-vous peut être annulé sans remboursement du dépôt.',
  },
  annulation: {
    preavisHeures: 24,
    description: 'Annulation sans frais avec un préavis de 24h minimum. Passé ce délai, le dépôt est perdu.',
  },
  extensions: {
    incluses: false,
    description: 'Les extensions ne sont pas incluses dans les prix affichés.',
  },
};

// ─── SERVICES — FEMMES ──────────────────────────────────────
// Structure : categorie → variantes (longueur) → prix
// Les styles listés dans `styles` sont proposés pour chaque longueur

export const SERVICES_FEMMES = [
  {
    id: 'classiques-braids-f',
    categorie: 'Classiques Braids',
    styles: ['Marley Twists', 'Fausse Locks', 'Knotless Braids', 'Kinky Twist'],
    variantes: [
      { id: 'cl-f-epaules', label: 'Épaules',    prix: 80,  dureeMinutes: 240 },
      { id: 'cl-f-mi-dos',  label: 'Mi-dos',     prix: 100, dureeMinutes: 360 },
      { id: 'cl-f-bas-dos', label: 'Bas du dos', prix: 110, dureeMinutes: 420 },
    ],
  },
  {
    id: 'goddess-braids-f',
    categorie: 'Goddess Braids',
    styles: ['Boho Braids', 'Bora Bora Braids'],
    variantes: [
      { id: 'god-f-epaules', label: 'Épaules',    prix: 90,  dureeMinutes: 360 },
      { id: 'god-f-mi-dos',  label: 'Mi-dos',     prix: 110, dureeMinutes: 420 },
      { id: 'god-f-bas-dos', label: 'Bas du dos', prix: 120, dureeMinutes: 480 },
    ],
  },
  {
    id: 'french-curls-f',
    categorie: 'French Curls',
    styles: [],
    variantes: [
      { id: 'fc-f-epaules', label: 'Épaules',    prix: 100, dureeMinutes: 360 },
      { id: 'fc-f-mi-dos',  label: 'Mi-dos',     prix: 120, dureeMinutes: 450 },
      { id: 'fc-f-bas-dos', label: 'Bas du dos', prix: 140, dureeMinutes: 510 },
    ],
  },
];

// ─── SERVICES — HOMMES ──────────────────────────────────────
// Structure : categorie → variantes (style ou nb de locks) → prix
// prixRange : [min, max] pour les tarifs variables, prixLabel pour l'affichage

export const SERVICES_HOMMES = [
  {
    id: 'classiques-braids-h',
    categorie: 'Classiques Braids',
    variantes: [
      { id: 'cl-h-nattes',     label: 'Nattes',     prix: null, prixRange: [50, 70], prixLabel: '50 – 70$', dureeMinutes: 120 },
      { id: 'cl-h-twist',      label: 'Twist',      prix: 70,   prixRange: null,     prixLabel: '70$',      dureeMinutes: 150 },
      { id: 'cl-h-box-braids', label: 'Box Braids', prix: 75,   prixRange: null,     prixLabel: '75$',      dureeMinutes: 180 },
      { id: 'cl-h-flat-twist', label: 'Flat Twist', prix: 85,   prixRange: null,     prixLabel: '85$',      dureeMinutes: 180 },
    ],
  },
  {
    id: 'locks-retwist-h',
    categorie: 'Locks (Retwist)',
    variantes: [
      { id: 'lk-h-40-60',  label: '40 – 60 locks',  prix: 70,  prixRange: null, prixLabel: '70$',  dureeMinutes: 240 },
      { id: 'lk-h-61-80',  label: '61 – 80 locks',  prix: 90,  prixRange: null, prixLabel: '90$',  dureeMinutes: 240 },
      { id: 'lk-h-81-100', label: '81 – 100 locks', prix: 110, prixRange: null, prixLabel: '110$', dureeMinutes: 240 },
    ],
  },
  {
    id: 'retwist-vanille-h',
    categorie: 'Retwist & Vanille',
    variantes: [
      { id: 'rv-h-40-60',  label: '40 – 60 locks',  prix: 90,  prixRange: null, prixLabel: '90$',  dureeMinutes: 300 },
      { id: 'rv-h-61-80',  label: '61 – 80 locks',  prix: 110, prixRange: null, prixLabel: '110$', dureeMinutes: 300 },
      { id: 'rv-h-81-100', label: '81 – 100 locks', prix: 130, prixRange: null, prixLabel: '130$', dureeMinutes: 360 },
    ],
  },
];

// Entrée groupée — utilisée par le router pour alimenter le catalogue
export const SERVICES = {
  femmes: SERVICES_FEMMES,
  hommes: SERVICES_HOMMES,
};

// ─── CRÉNEAUX ────────────────────────────────────────────────
// Toute prestation >= SEUIL_GRISAGE_16H minutes → créneau 16h grisé

export const SEUIL_GRISAGE_16H = 360; // 6h en minutes

// ─── MÉTHODES DE PAIEMENT ───────────────────────────────────
// Méthode unique : Interac e-Transfer manuel
// via 'manuel' : instructions envoyées par email après réservation

export const METHODES_PAIEMENT = [
  {
    id: 'interac',
    label: 'Interac e-Transfer',
    description: 'Virement bancaire canadien — simple et sécurisé',
    via: 'manuel',
    actif: true,
    instructions: `Envoyez 25$ CAD à ${SALON.email} via Interac e-Transfer. Utilisez votre nom complet comme message. Votre réservation sera confirmée dès réception.`,
  },
];

// ─── AVIS CLIENTS ───────────────────────────────────────────
// Données placeholder réalistes — à remplacer par les vrais avis
// note : entier de 1 à 5

export const AVIS = [
  {
    id: 1,
    prenom: 'Mariama',
    initiale: 'K.',
    note: 4,
    date: '2024-11-08',
    service: 'Knotless Braids — Mi-dos',
    commentaire: 'Satisfaite du résultat ! Les tresses sont propres et l\'ambiance est chaleureuse. Je me suis sentie à l\'aise.',
    ville: 'Ottawa',
  },
  {
    id: 2,
    prenom: 'Chloé',
    initiale: 'B.',
    note: 4,
    date: '2024-10-22',
    service: 'Boho Braids — Bas du dos',
    commentaire: 'Travail précis et soigné. Le résultat en vaut la peine, beaucoup de compliments depuis mon passage.',
    ville: 'Gatineau',
  },
  {
    id: 3,
    prenom: 'Aminata',
    initiale: 'D.',
    note: 5,
    date: '2024-12-01',
    service: 'Marley Twists — Épaules',
    commentaire: 'Professionnel et prix honnêtes. Je recommande ce salon pour la qualité des finitions.',
    ville: 'Ottawa',
  },
  {
    id: 4,
    prenom: 'Kevin',
    initiale: 'M.',
    note: 4,
    date: '2024-11-15',
    service: 'Box Braids — Hommes',
    commentaire: 'Bon accueil et travail soigné. Salon calme et agréable pour une première expérience.',
    ville: 'Ottawa',
  },
];
