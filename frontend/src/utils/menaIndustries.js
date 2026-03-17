/**
 * Single source of truth for all industries across the platform.
 * Import from here in every component that shows an industry list or filter.
 */

export const MENA_INDUSTRIES = [
  { name: 'Fintech',       icon: '💳' },
  { name: 'Edtech',        icon: '📚' },
  { name: 'AI & ML',       icon: '🤖' },
  { name: 'Healthtech',    icon: '🏥' },
  { name: 'E-Commerce',    icon: '🛒' },
  { name: 'Logistics',     icon: '🚚' },
  { name: 'Foodtech',      icon: '🍔' },
  { name: 'Proptech',      icon: '🏠' },
  { name: 'Traveltech',    icon: '✈️' },
  { name: 'Cleantech',     icon: '♻️' },
  { name: 'Cybersecurity', icon: '🔒' },
  { name: 'HR & Work',     icon: '👔' },
  { name: 'Media',         icon: '📱' },
  { name: 'Dev Tools',     icon: '⚙️' },
  { name: 'Web3',          icon: '⛓️' },
];

/** Plain array of names — drop-in replacement for any const INDUSTRIES = [...] */
export const INDUSTRIES = MENA_INDUSTRIES.map(i => i.name);

/** name → icon map — drop-in replacement for any const INDUSTRY_ICONS = {...} */
export const INDUSTRY_ICONS = Object.fromEntries(MENA_INDUSTRIES.map(i => [i.name, i.icon]));
