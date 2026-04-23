// ============================================================
//  js/data.js — SOURCE UNIQUE DE VÉRITÉ
//  Glow Room Studio · Ottawa–Gatineau
//  ⚠ Ne pas modifier sans validation du cahier des charges
// ============================================================

// ─── SALON ──────────────────────────────────────────────────

export const SALON = {
  nom: 'Glow Room Studio',
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
    montant: 15,
    devise: 'CAD',
    remboursable: false,
    description: 'Un dépôt de 15$ est requis à la réservation. Il est déduit de la facture finale et n\'est pas remboursable.',
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
      { id: 'cl-f-epaules', label: 'Épaules',    prix: 80  },
      { id: 'cl-f-mi-dos',  label: 'Mi-dos',     prix: 100 },
      { id: 'cl-f-bas-dos', label: 'Bas du dos', prix: 110 },
    ],
  },
  {
    id: 'goddess-braids-f',
    categorie: 'Goddess Braids',
    styles: ['Boho Braids', 'Bora Bora Braids'],
    variantes: [
      { id: 'god-f-epaules', label: 'Épaules',    prix: 90  },
      { id: 'god-f-mi-dos',  label: 'Mi-dos',     prix: 110 },
      { id: 'god-f-bas-dos', label: 'Bas du dos', prix: 120 },
    ],
  },
  {
    id: 'french-curls-f',
    categorie: 'French Curls',
    styles: [],
    variantes: [
      { id: 'fc-f-epaules', label: 'Épaules',    prix: 100 },
      { id: 'fc-f-mi-dos',  label: 'Mi-dos',     prix: 120 },
      { id: 'fc-f-bas-dos', label: 'Bas du dos', prix: 140 },
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
      { id: 'cl-h-nattes',     label: 'Nattes',     prix: null, prixRange: [50, 70], prixLabel: '50 – 70$' },
      { id: 'cl-h-twist',      label: 'Twist',      prix: 70,   prixRange: null,     prixLabel: '70$' },
      { id: 'cl-h-box-braids', label: 'Box Braids', prix: 75,   prixRange: null,     prixLabel: '75$' },
      { id: 'cl-h-flat-twist', label: 'Flat Twist', prix: 85,   prixRange: null,     prixLabel: '85$' },
    ],
  },
  {
    id: 'locks-retwist-h',
    categorie: 'Locks (Retwist)',
    variantes: [
      { id: 'lk-h-40-60',  label: '40 – 60 locks',  prix: 70,  prixRange: null, prixLabel: '70$'  },
      { id: 'lk-h-61-80',  label: '61 – 80 locks',  prix: 90,  prixRange: null, prixLabel: '90$'  },
      { id: 'lk-h-81-100', label: '81 – 100 locks', prix: 110, prixRange: null, prixLabel: '110$' },
    ],
  },
  {
    id: 'retwist-vanille-h',
    categorie: 'Retwist & Vanille',
    variantes: [
      { id: 'rv-h-40-60',  label: '40 – 60 locks',  prix: 90,  prixRange: null, prixLabel: '90$'  },
      { id: 'rv-h-61-80',  label: '61 – 80 locks',  prix: 110, prixRange: null, prixLabel: '110$' },
      { id: 'rv-h-81-100', label: '81 – 100 locks', prix: 130, prixRange: null, prixLabel: '130$' },
    ],
  },
];

// Entrée groupée — utilisée par le router pour alimenter le catalogue
export const SERVICES = {
  femmes: SERVICES_FEMMES,
  hommes: SERVICES_HOMMES,
};

// ─── MÉTHODES DE PAIEMENT ───────────────────────────────────
// Étape 4 du tunnel de réservation
// via 'stripe' : géré automatiquement par Stripe Checkout
// via 'manuel' : instructions envoyées par email après réservation

export const METHODES_PAIEMENT = [
  {
    id: 'stripe',
    label: 'Payer en ligne',
    description: 'Carte bancaire, Apple Pay, Interac Debit',
    via: 'stripe',
    actif: true,
  },
  {
    id: 'interac-etransfer',
    label: 'Interac e-Transfer',
    description: 'Virement manuel — confirmation par le salon',
    via: 'manuel',
    actif: true,
    note: `Envoyez 15$ à ${SALON.email} avec la référence "RDV + votre nom". Le salon confirmera par email sous 24h.`,
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
    note: 5,
    date: '2024-11-08',
    service: 'Knotless Braids — Mi-dos',
    commentaire: 'Tellement satisfaite du résultat ! Les tresses sont propres, bien serrées sans faire mal. L\'ambiance est chaleureuse, je me suis sentie à l\'aise dès le début. Je reviens sans hésiter.',
    ville: 'Ottawa',
  },
  {
    id: 2,
    prenom: 'Chloé',
    initiale: 'B.',
    note: 5,
    date: '2024-10-22',
    service: 'Boho Braids — Bas du dos',
    commentaire: 'Mes Boho Braids sont absolument magnifiques. Le travail est précis et soigné, ça a pris quelques heures mais le résultat en vaut vraiment la peine. Beaucoup de compliments depuis !',
    ville: 'Gatineau',
  },
  {
    id: 3,
    prenom: 'Aminata',
    initiale: 'D.',
    note: 5,
    date: '2024-12-01',
    service: 'Marley Twists — Épaules',
    commentaire: 'C\'est difficile de trouver un bon salon de tresses à Ottawa — Glow Room est une vraie perle. Propre, professionnel et les prix sont honnêtes. Je recommande à toutes mes amies.',
    ville: 'Ottawa',
  },
  {
    id: 4,
    prenom: 'Kevin',
    initiale: 'M.',
    note: 5,
    date: '2024-11-15',
    service: 'Box Braids — Hommes',
    commentaire: 'Premier essai pour des box braids et je suis 100% satisfait. Accueil sympa, travail rapide et soigné. Le salon est calme et agréable. Je suis déjà en train de planifier mon prochain rendez-vous.',
    ville: 'Ottawa',
  },
  {
    id: 5,
    prenom: 'Fatoumata',
    initiale: 'S.',
    note: 5,
    date: '2024-09-30',
    service: 'French Curls — Mi-dos',
    commentaire: 'Les French Curls sont trop belles ! Exactement ce que je voulais. Elle prend le temps d\'écouter et de bien comprendre ce que tu veux avant de commencer. Résultat impeccable.',
    ville: 'Gatineau',
  },
  {
    id: 6,
    prenom: 'Jade',
    initiale: 'T.',
    note: 4,
    date: '2024-10-05',
    service: 'Fausse Locks — Bas du dos',
    commentaire: 'Très belles fausses locks, je suis contente du résultat. Petit bémol sur le temps d\'attente au départ mais une fois commencé c\'était parfait. Le rapport qualité-prix est excellent pour Ottawa.',
    ville: 'Ottawa',
  },
  {
    id: 7,
    prenom: 'Diane',
    initiale: 'N.',
    note: 5,
    date: '2024-12-10',
    service: 'Knotless Braids — Bas du dos',
    commentaire: 'Ça fait 3 fois que je viens et je ne suis jamais déçue. Les knotless sont toujours parfaites, ça ne tire pas et ça tient longtemps. Glow Room c\'est mon salon de confiance à Ottawa !',
    ville: 'Orléans, Ottawa',
  },
  {
    id: 8,
    prenom: 'Marcus',
    initiale: 'L.',
    note: 5,
    date: '2024-11-28',
    service: 'Retwist & Vanille — 61–80 locks',
    commentaire: 'Excellent travail sur mes locks. Propre, uniforme, exactement ce que je cherchais. Tarif très raisonnable pour la qualité. Bonne ambiance, bonne musique. Je reviendrai régulièrement.',
    ville: 'Gatineau',
  },
];
