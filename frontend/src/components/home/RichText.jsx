import React from 'react';

const URL_REGEX = /https?:\/\/[^\s<>"{}|\\^`[\]]+/g;

function parseInline(text) {
  const segments = [];
  let i = 0;
  while (i < text.length) {
    const boldIdx = text.indexOf('**', i);
    const italicIdx = text.indexOf('_', i);
    const linkIdx = text.indexOf('[', i);
    const urlIdx = (() => { URL_REGEX.lastIndex = i; const m = URL_REGEX.exec(text); return m ? m.index : -1; })();

    const candidates = [
      boldIdx > -1 ? boldIdx : Infinity,
      italicIdx > -1 ? italicIdx : Infinity,
      linkIdx > -1 ? linkIdx : Infinity,
      urlIdx > -1 ? urlIdx : Infinity,
    ];
    const minIdx = Math.min(...candidates);

    if (minIdx === Infinity) {
      segments.push(text.slice(i));
      break;
    }

    if (i < minIdx) segments.push(text.slice(i, minIdx));

    if (minIdx === boldIdx) {
      const endIdx = text.indexOf('**', minIdx + 2);
      if (endIdx > -1) {
        segments.push({ type: 'bold', text: text.slice(minIdx + 2, endIdx) });
        i = endIdx + 2;
      } else {
        segments.push(text[minIdx]);
        i = minIdx + 1;
      }
    } else if (minIdx === italicIdx) {
      const endIdx = text.indexOf('_', minIdx + 1);
      if (endIdx > -1 && endIdx !== minIdx + 1) {
        segments.push({ type: 'italic', text: text.slice(minIdx + 1, endIdx) });
        i = endIdx + 1;
      } else {
        segments.push(text[minIdx]);
        i = minIdx + 1;
      }
    } else if (minIdx === linkIdx) {
      const bracketClose = text.indexOf(']', minIdx + 1);
      const parenOpen = bracketClose > -1 ? text.indexOf('(', bracketClose) : -1;
      const parenClose = parenOpen === bracketClose + 1 ? text.indexOf(')', parenOpen + 1) : -1;
      if (bracketClose > -1 && parenClose > -1) {
        const label = text.slice(minIdx + 1, bracketClose);
        const url = text.slice(parenOpen + 1, parenClose);
        segments.push({ type: 'link', label, url });
        i = parenClose + 1;
      } else {
        segments.push(text[minIdx]);
        i = minIdx + 1;
      }
    } else if (minIdx === urlIdx) {
      URL_REGEX.lastIndex = minIdx;
      const m = URL_REGEX.exec(text);
      if (m) {
        segments.push({ type: 'url', url: m[0] });
        i = minIdx + m[0].length;
      } else {
        segments.push(text[minIdx]);
        i = minIdx + 1;
      }
    } else {
      segments.push(text[minIdx]);
      i = minIdx + 1;
    }
  }
  return segments;
}

function renderSegment(seg, idx) {
  if (typeof seg === 'string') return <React.Fragment key={idx}>{seg}</React.Fragment>;
  if (seg.type === 'bold') return <strong key={idx}>{seg.text}</strong>;
  if (seg.type === 'italic') return <em key={idx}>{seg.text}</em>;
  if (seg.type === 'link') return (
    <a key={idx} href={seg.url} target="_blank" rel="noopener noreferrer"
      onClick={e => e.stopPropagation()}
      style={{ color: 'var(--orange)', textDecoration: 'underline', wordBreak: 'break-all' }}>
      {seg.label || seg.url}
    </a>
  );
  if (seg.type === 'url') return (
    <a key={idx} href={seg.url} target="_blank" rel="noopener noreferrer"
      onClick={e => e.stopPropagation()}
      style={{ color: 'var(--orange)', textDecoration: 'underline', wordBreak: 'break-all' }}>
      {seg.url}
    </a>
  );
  return null;
}

export default function RichText({ text, style = {} }) {
  if (!text) return null;
  const lines = text.split('\n');
  const elements = [];
  let numListCounter = 0;

  lines.forEach((line, lineIdx) => {
    const numMatch = line.match(/^(\d+)\.\s(.*)$/);
    const bulletMatch = line.match(/^[-*]\s(.*)$/);

    if (numMatch) {
      numListCounter++;
      const segments = parseInline(numMatch[2]);
      elements.push(
        <div key={lineIdx} style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
          <span style={{ minWidth: 18, fontWeight: 700, color: 'var(--orange)', flexShrink: 0 }}>{numMatch[1]}.</span>
          <span>{segments.map(renderSegment)}</span>
        </div>
      );
    } else if (bulletMatch) {
      numListCounter = 0;
      const segments = parseInline(bulletMatch[1]);
      elements.push(
        <div key={lineIdx} style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
          <span style={{ minWidth: 14, color: 'var(--orange)', flexShrink: 0 }}>•</span>
          <span>{segments.map(renderSegment)}</span>
        </div>
      );
    } else {
      numListCounter = 0;
      const segments = parseInline(line);
      elements.push(
        <React.Fragment key={lineIdx}>
          {segments.map(renderSegment)}
          {lineIdx < lines.length - 1 && '\n'}
        </React.Fragment>
      );
    }
  });

  return (
    <span style={{ whiteSpace: 'pre-wrap', display: 'block', ...style }}>
      {elements}
    </span>
  );
}
