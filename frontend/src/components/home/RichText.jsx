import React from 'react';

const LINK_RE = /(\[([^\]]+)\]\((https?:\/\/[^)]+)\))|(https?:\/\/[^\s<>"{}|\\^`[\]]+)|(\*\*([^*]+)\*\*)|(_([^_]+)_)/g;

export default function RichText({ text, style = {} }) {
  if (!text) return null;

  const lines = text.split('\n');
  const rendered = [];

  lines.forEach((line, li) => {
    const parts = [];
    let lastIdx = 0;
    let m;
    LINK_RE.lastIndex = 0;

    while ((m = LINK_RE.exec(line)) !== null) {
      if (m.index > lastIdx) {
        parts.push(line.slice(lastIdx, m.index));
      }

      if (m[1]) {
        parts.push(
          <a key={m.index} href={m[3]} target="_blank" rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            style={{ color: 'var(--orange)', textDecoration: 'underline', wordBreak: 'break-all' }}>
            {m[2]}
          </a>
        );
      } else if (m[4]) {
        parts.push(
          <a key={m.index} href={m[4]} target="_blank" rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            style={{ color: 'var(--orange)', textDecoration: 'underline', wordBreak: 'break-all' }}>
            {m[4]}
          </a>
        );
      } else if (m[5]) {
        parts.push(<strong key={m.index}>{m[6]}</strong>);
      } else if (m[7]) {
        parts.push(<em key={m.index}>{m[8]}</em>);
      }

      lastIdx = m.index + m[0].length;
    }

    if (lastIdx < line.length) {
      parts.push(line.slice(lastIdx));
    }

    const numMatch = line.match(/^(\d+)\.\s(.*)$/);
    const bulletMatch = line.match(/^[-*]\s(.*)$/);

    if (numMatch && parts.length === 1 && typeof parts[0] === 'string') {
      rendered.push(
        <div key={li} style={{ display: 'flex', gap: 6 }}>
          <span style={{ minWidth: 18, fontWeight: 700, color: 'var(--orange)', flexShrink: 0 }}>{numMatch[1]}.</span>
          <span>{numMatch[2]}</span>
        </div>
      );
    } else if (bulletMatch && parts.length === 1 && typeof parts[0] === 'string') {
      rendered.push(
        <div key={li} style={{ display: 'flex', gap: 6 }}>
          <span style={{ minWidth: 14, color: 'var(--orange)', flexShrink: 0 }}>•</span>
          <span>{bulletMatch[1]}</span>
        </div>
      );
    } else {
      rendered.push(
        <React.Fragment key={li}>
          {parts.length > 0 ? parts : line}
          {li < lines.length - 1 && '\n'}
        </React.Fragment>
      );
    }
  });

  return (
    <span style={{ whiteSpace: 'pre-wrap', display: 'block', ...style }}>
      {rendered}
    </span>
  );
}
