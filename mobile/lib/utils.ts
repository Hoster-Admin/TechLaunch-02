export function timeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  const now = new Date();
  const diff = (now.getTime() - date.getTime()) / 1000;
  if (diff < 60) return 'now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('');
}

export const COUNTRY_CODE_MAP: Record<string, string> = {
  ae: 'UAE', sa: 'KSA', eg: 'Egypt', jo: 'Jordan', lb: 'Lebanon',
  kw: 'Kuwait', qa: 'Qatar', bh: 'Bahrain', om: 'Oman', ma: 'Morocco',
  tn: 'Tunisia', iq: 'Iraq', pk: 'Pakistan', tr: 'Turkey', ir: 'Iran',
  sy: 'Syria', ye: 'Yemen', ly: 'Libya', sd: 'Sudan', dz: 'Algeria',
};

export function formatCountryTag(c: string): string {
  if (!c || c.length === 0) return '';
  const lower = c.toLowerCase();
  if (COUNTRY_CODE_MAP[lower]) return COUNTRY_CODE_MAP[lower];
  if (c.length === 2) return c.toUpperCase();
  return c;
}
