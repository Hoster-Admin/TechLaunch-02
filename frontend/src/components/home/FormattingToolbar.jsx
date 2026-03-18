import React from 'react';

function insertFormatting(textareaRef, value, setValue, before, after, placeholder) {
  const el = textareaRef.current;
  if (!el) return;
  const start = el.selectionStart;
  const end = el.selectionEnd;
  const selected = value.slice(start, end) || placeholder;
  const newValue = value.slice(0, start) + before + selected + after + value.slice(end);
  setValue(newValue);
  setTimeout(() => {
    el.focus();
    const newStart = start + before.length;
    const newEnd = newStart + selected.length;
    el.setSelectionRange(newStart, newEnd);
  }, 0);
}

function insertNumberedList(textareaRef, value, setValue) {
  const el = textareaRef.current;
  if (!el) return;
  const start = el.selectionStart;
  const end = el.selectionEnd;
  const selected = value.slice(start, end);
  if (selected) {
    const lines = selected.split('\n');
    const numbered = lines.map((line, i) => `${i + 1}. ${line}`).join('\n');
    const newValue = value.slice(0, start) + numbered + value.slice(end);
    setValue(newValue);
    setTimeout(() => { el.focus(); el.setSelectionRange(start, start + numbered.length); }, 0);
  } else {
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const lineEnd = value.indexOf('\n', start);
    const lineText = value.slice(lineStart, lineEnd === -1 ? value.length : lineEnd);
    const newLine = `1. ${lineText || 'List item'}`;
    const newValue = value.slice(0, lineStart) + newLine + (lineEnd === -1 ? '' : value.slice(lineEnd));
    setValue(newValue);
    setTimeout(() => { el.focus(); el.setSelectionRange(lineStart + 3, lineStart + newLine.length); }, 0);
  }
}

function insertLink(textareaRef, value, setValue) {
  const el = textareaRef.current;
  if (!el) return;
  const start = el.selectionStart;
  const end = el.selectionEnd;
  const selected = value.slice(start, end) || 'Link text';
  const url = window.prompt('Enter URL:', 'https://');
  if (!url) return;
  const formatted = `[${selected}](${url})`;
  const newValue = value.slice(0, start) + formatted + value.slice(end);
  setValue(newValue);
  setTimeout(() => { el.focus(); el.setSelectionRange(start, start + formatted.length); }, 0);
}

const BTN_STYLE = {
  background: 'none', border: '1px solid #e8e8e8', borderRadius: 6, cursor: 'pointer',
  padding: '4px 8px', fontSize: 12, fontWeight: 700, color: '#555', lineHeight: 1.5,
  fontFamily: 'Inter, sans-serif', transition: 'all .12s',
};

export default function FormattingToolbar({ textareaRef, value, setValue }) {
  const bold   = () => insertFormatting(textareaRef, value, setValue, '**', '**', 'bold text');
  const italic = () => insertFormatting(textareaRef, value, setValue, '_', '_', 'italic text');
  const list   = () => insertNumberedList(textareaRef, value, setValue);
  const link   = () => insertLink(textareaRef, value, setValue);

  return (
    <div style={{ display: 'flex', gap: 4, marginBottom: 6, flexWrap: 'wrap' }}>
      <button type="button" onClick={bold} style={BTN_STYLE} title="Bold — wrap selection in **bold**"
        onMouseOver={e => { e.currentTarget.style.background='#f5f5f5'; e.currentTarget.style.borderColor='#ccc'; }}
        onMouseOut={e => { e.currentTarget.style.background='none'; e.currentTarget.style.borderColor='#e8e8e8'; }}>
        <strong>B</strong>
      </button>
      <button type="button" onClick={italic} style={BTN_STYLE} title="Italic — wrap selection in _italic_"
        onMouseOver={e => { e.currentTarget.style.background='#f5f5f5'; e.currentTarget.style.borderColor='#ccc'; }}
        onMouseOut={e => { e.currentTarget.style.background='none'; e.currentTarget.style.borderColor='#e8e8e8'; }}>
        <em>I</em>
      </button>
      <button type="button" onClick={link} style={BTN_STYLE} title="Add hyperlink — [text](url)"
        onMouseOver={e => { e.currentTarget.style.background='#f5f5f5'; e.currentTarget.style.borderColor='#ccc'; }}
        onMouseOut={e => { e.currentTarget.style.background='none'; e.currentTarget.style.borderColor='#e8e8e8'; }}>
        🔗
      </button>
      <button type="button" onClick={list} style={BTN_STYLE} title="Numbered list"
        onMouseOver={e => { e.currentTarget.style.background='#f5f5f5'; e.currentTarget.style.borderColor='#ccc'; }}
        onMouseOut={e => { e.currentTarget.style.background='none'; e.currentTarget.style.borderColor='#e8e8e8'; }}>
        1. List
      </button>
    </div>
  );
}
