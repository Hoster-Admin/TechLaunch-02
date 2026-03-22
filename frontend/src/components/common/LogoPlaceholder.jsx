import React from 'react';

const PALETTE = [
  { bg:'#FFF0EC', color:'#C94922' },
  { bg:'#EFF6FF', color:'#1D4ED8' },
  { bg:'#F0FDF4', color:'#15803D' },
  { bg:'#FDF4FF', color:'#7E22CE' },
  { bg:'#FFFBEB', color:'#B45309' },
  { bg:'#FFF1F2', color:'#BE123C' },
  { bg:'#F0F9FF', color:'#0369A1' },
  { bg:'#F7FEE7', color:'#3F6212' },
];

function pickColor(name) {
  if (!name) return PALETTE[0];
  let code = 0;
  for (let i = 0; i < name.length; i++) code += name.charCodeAt(i);
  return PALETTE[code % PALETTE.length];
}

function getInitials(name) {
  if (!name) return '?';
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export default function LogoPlaceholder({ name, size = 56, radius = 16, fontSize }) {
  const { bg, color } = pickColor(name);
  const initials = getInitials(name);
  const fs = fontSize || Math.round(size * 0.38);
  return (
    <div style={{
      width: size, height: size, borderRadius: radius,
      background: bg, color, flexShrink: 0,
      display: 'grid', placeItems: 'center',
      fontSize: fs, fontWeight: 800,
      fontFamily: "'DM Sans', sans-serif",
      letterSpacing: '-0.02em',
      userSelect: 'none',
    }}>
      {initials}
    </div>
  );
}
