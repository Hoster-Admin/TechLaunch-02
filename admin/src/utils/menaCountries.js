/**
 * Single source of truth for all MENA countries across the platform.
 * Import from here in every component that shows a country list or filter.
 */

export const MENA_COUNTRIES = [
  { code: 'sa', flag: '🇸🇦', name: 'Saudi Arabia', desc: "Kingdom's leading tech hub — Riyadh & Jeddah" },
  { code: 'ae', flag: '🇦🇪', name: 'UAE',          desc: "MENA's most connected startup ecosystem" },
  { code: 'eg', flag: '🇪🇬', name: 'Egypt',        desc: "Africa's largest tech talent pool" },
  { code: 'jo', flag: '🇯🇴', name: 'Jordan',       desc: 'The Silicon Valley of the Middle East' },
  { code: 'qa', flag: '🇶🇦', name: 'Qatar',        desc: "Backed by Qatar's Vision 2030" },
  { code: 'kw', flag: '🇰🇼', name: 'Kuwait',       desc: 'GCC innovation with strong VC support' },
  { code: 'bh', flag: '🇧🇭', name: 'Bahrain',      desc: 'RegTech hub with fintech-friendly laws' },
  { code: 'om', flag: '🇴🇲', name: 'Oman',         desc: 'Vision 2040 driving diversification' },
  { code: 'ma', flag: '🇲🇦', name: 'Morocco',      desc: 'Rising Francophone tech scene' },
  { code: 'tn', flag: '🇹🇳', name: 'Tunisia',      desc: "Africa's first unicorn birthplace" },
  { code: 'dz', flag: '🇩🇿', name: 'Algeria',      desc: 'Growing North African ecosystem' },
  { code: 'lb', flag: '🇱🇧', name: 'Lebanon',      desc: 'Resilient founder community' },
  { code: 'iq', flag: '🇮🇶', name: 'Iraq',         desc: 'Emerging startup ecosystem' },
  { code: 'ps', flag: '🇵🇸', name: 'Palestine',    desc: 'Innovative tech community' },
  { code: 'ly', flag: '🇱🇾', name: 'Libya',        desc: 'Developing tech landscape' },
  { code: 'sd', flag: '🇸🇩', name: 'Sudan',        desc: 'Emerging fintech hub' },
  { code: 'ye', flag: '🇾🇪', name: 'Yemen',        desc: 'Resilient startup community' },
  { code: 'sy', flag: '🇸🇾', name: 'Syria',        desc: 'Talented diaspora founder network' },
];

export const MENA_OTHER = { code: 'other', flag: '🌍', name: 'Other MENA', desc: 'Other MENA region' };

/** [code, flag, name] tuples — used in SubmitProductModal / SubmitProductForm */
export const COUNTRIES_TUPLE = [
  ...MENA_COUNTRIES.map(c => [c.code, c.flag, c.name]),
  [MENA_OTHER.code, MENA_OTHER.flag, MENA_OTHER.name],
];

/** { v, l } objects — used in settingsConstants / ProfileTab SearchDD */
export const COUNTRIES_VL = MENA_COUNTRIES.map(c => ({ v: c.code, l: `${c.flag} ${c.name}` }));

/** { value, label } objects — used in PeoplePage country filter */
export const COUNTRIES_VALUE_LABEL = MENA_COUNTRIES.map(c => ({
  value: c.name,
  label: `${c.flag} ${c.name}`,
}));

/** [code, emoji+name] tuples — used in HomePage filter */
export const COUNTRIES_PAIR = MENA_COUNTRIES.map(c => [c.code, `${c.flag} ${c.name}`]);

/** code → name map — used in AllProductsPage filtering */
export const COUNTRY_MATCH = Object.fromEntries(
  MENA_COUNTRIES.map(c => [c.code, c.name.toLowerCase()])
);

/** code → { flag, name, desc } map — used in DirectoryPage */
export const COUNTRY_META = Object.fromEntries(
  MENA_COUNTRIES.map(c => [c.code, { flag: c.flag, name: c.name, desc: c.desc }])
);
