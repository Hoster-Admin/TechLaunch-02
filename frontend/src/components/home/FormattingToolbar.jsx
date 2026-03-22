import React, { useState, useRef, useEffect } from 'react';

function saveScroll(el) {
  return el ? el.scrollTop : 0;
}
function restoreScroll(el, top) {
  if (el) el.scrollTop = top;
}

function insertFormatting(textareaRef, value, setValue, before, after, placeholder) {
  const el = textareaRef.current;
  if (!el) return;
  const scroll = saveScroll(el);
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
    restoreScroll(el, scroll);
  }, 0);
}

function insertNumberedList(textareaRef, value, setValue) {
  const el = textareaRef.current;
  if (!el) return;
  const scroll = saveScroll(el);
  const start = el.selectionStart;
  const end = el.selectionEnd;
  const selected = value.slice(start, end);
  if (selected) {
    const lines = selected.split('\n');
    const numbered = lines.map((line, i) => `${i + 1}. ${line}`).join('\n');
    const newValue = value.slice(0, start) + numbered + value.slice(end);
    setValue(newValue);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start, start + numbered.length);
      restoreScroll(el, scroll);
    }, 0);
  } else {
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const lineEnd = value.indexOf('\n', start);
    const lineText = value.slice(lineStart, lineEnd === -1 ? value.length : lineEnd);
    const numbered = /^\d+\.\s/.test(lineText);
    if (numbered) {
      const stripped = lineText.replace(/^\d+\.\s/, '');
      const newValue = value.slice(0, lineStart) + stripped + (lineEnd === -1 ? '' : value.slice(lineEnd));
      setValue(newValue);
      setTimeout(() => {
        el.focus();
        el.setSelectionRange(lineStart + stripped.length, lineStart + stripped.length);
        restoreScroll(el, scroll);
      }, 0);
    } else {
      const newLine = `1. ${lineText || 'List item'}`;
      const newValue = value.slice(0, lineStart) + newLine + (lineEnd === -1 ? '' : value.slice(lineEnd));
      setValue(newValue);
      setTimeout(() => {
        el.focus();
        el.setSelectionRange(lineStart + 3, lineStart + newLine.length);
        restoreScroll(el, scroll);
      }, 0);
    }
  }
}

function isActiveFormat(value, textareaRef, before, after) {
  const el = textareaRef?.current;
  if (!el) return false;
  const start = el.selectionStart;
  const end = el.selectionEnd;
  if (start !== end) {
    const sel = value.slice(start, end);
    return sel.startsWith(before) && sel.endsWith(after);
  }
  const around = value.slice(Math.max(0, start - before.length - 20), start + after.length + 20);
  return new RegExp(`\\${before}[^${before}]+\\${after}`).test(around);
}

function isInNumberedList(value, textareaRef) {
  const el = textareaRef?.current;
  if (!el) return false;
  const start = el.selectionStart;
  const lineStart = value.lastIndexOf('\n', start - 1) + 1;
  const lineEnd = value.indexOf('\n', start);
  const lineText = value.slice(lineStart, lineEnd === -1 ? value.length : lineEnd);
  return /^\d+\.\s/.test(lineText);
}

const BTN = (active) => ({
  background: active ? '#fff3ee' : 'none',
  border: `1px solid ${active ? 'var(--orange)' : '#e8e8e8'}`,
  borderRadius: 6, cursor: 'pointer',
  padding: '4px 8px', fontSize: 12, fontWeight: 700,
  color: active ? 'var(--orange)' : '#555', lineHeight: 1.5,
  fontFamily: 'Inter, sans-serif', transition: 'all .12s',
});

export default function FormattingToolbar({ textareaRef, value, setValue }) {
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkText, setLinkText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [selStart, setSelStart] = useState(0);
  const [selEnd, setSelEnd] = useState(0);
  const [cursorPos, setCursorPos] = useState(0);
  const urlRef = useRef(null);

  const updateCursor = () => {
    const el = textareaRef?.current;
    if (el) setCursorPos(el.selectionStart);
  };

  const boldActive   = isActiveFormat(value, textareaRef, '**', '**');
  const italicActive = isActiveFormat(value, textareaRef, '_', '_');
  const listActive   = isInNumberedList(value, textareaRef);

  const bold   = () => insertFormatting(textareaRef, value, setValue, '**', '**', 'bold text');
  const italic = () => insertFormatting(textareaRef, value, setValue, '_', '_', 'italic text');
  const list   = () => insertNumberedList(textareaRef, value, setValue);

  const openLink = () => {
    const el = textareaRef?.current;
    if (el) {
      setSelStart(el.selectionStart);
      setSelEnd(el.selectionEnd);
      setLinkText(value.slice(el.selectionStart, el.selectionEnd) || '');
    }
    setLinkUrl('https://');
    setShowLinkDialog(true);
    setTimeout(() => urlRef.current?.select(), 50);
  };

  const insertLinkFromDialog = () => {
    if (!linkUrl || linkUrl === 'https://') { setShowLinkDialog(false); return; }
    const el = textareaRef?.current;
    const scroll = el ? saveScroll(el) : 0;
    const text = linkText || 'Link text';
    const formatted = `[${text}](${linkUrl})`;
    const newValue = value.slice(0, selStart) + formatted + value.slice(selEnd);
    setValue(newValue);
    setShowLinkDialog(false);
    setTimeout(() => {
      if (el) {
        el.focus();
        el.setSelectionRange(selStart + formatted.length, selStart + formatted.length);
        restoreScroll(el, scroll);
      }
    }, 0);
  };

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 6, flexWrap: 'wrap' }}
        onMouseUp={updateCursor} onKeyUp={updateCursor}>

        <button type="button" onClick={bold} style={BTN(boldActive)}
          title="Bold — wrap selection in **bold**"
          onMouseOver={e => { if (!boldActive) { e.currentTarget.style.background='#f5f5f5'; e.currentTarget.style.borderColor='#ccc'; }}}
          onMouseOut={e => { if (!boldActive) { e.currentTarget.style.background='none'; e.currentTarget.style.borderColor='#e8e8e8'; }}}>
          <strong>B</strong>
        </button>

        <button type="button" onClick={italic} style={BTN(italicActive)}
          title="Italic — wrap selection in _italic_"
          onMouseOver={e => { if (!italicActive) { e.currentTarget.style.background='#f5f5f5'; e.currentTarget.style.borderColor='#ccc'; }}}
          onMouseOut={e => { if (!italicActive) { e.currentTarget.style.background='none'; e.currentTarget.style.borderColor='#e8e8e8'; }}}>
          <em>I</em>
        </button>

        <button type="button" onClick={openLink} style={BTN(false)}
          title="Add hyperlink — [text](url)"
          onMouseOver={e => { e.currentTarget.style.background='#f5f5f5'; e.currentTarget.style.borderColor='#ccc'; }}
          onMouseOut={e => { e.currentTarget.style.background='none'; e.currentTarget.style.borderColor='#e8e8e8'; }}>
          🔗
        </button>

        <button type="button" onClick={list} style={BTN(listActive)}
          title="Numbered list — prefix line with 1."
          onMouseOver={e => { if (!listActive) { e.currentTarget.style.background='#f5f5f5'; e.currentTarget.style.borderColor='#ccc'; }}}
          onMouseOut={e => { if (!listActive) { e.currentTarget.style.background='none'; e.currentTarget.style.borderColor='#e8e8e8'; }}}>
          1. List
        </button>
      </div>

      {showLinkDialog && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, zIndex: 500,
          background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,.12)', padding: '14px 16px', minWidth: 280,
          animation: 'slideDown .15s ease',
        }}
          onClick={e => e.stopPropagation()}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 8 }}>Insert Link</div>
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 3 }}>Display text</label>
            <input
              value={linkText}
              onChange={e => setLinkText(e.target.value)}
              placeholder="Link text"
              style={{ width: '100%', padding: '7px 10px', border: '1.5px solid #e8e8e8', borderRadius: 8, fontSize: 13, fontFamily: 'Inter,sans-serif', outline: 'none', boxSizing: 'border-box' }}
              onFocus={e => e.target.style.borderColor = 'var(--orange)'}
              onBlur={e => e.target.style.borderColor = '#e8e8e8'}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 3 }}>URL</label>
            <input
              ref={urlRef}
              value={linkUrl}
              onChange={e => setLinkUrl(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') insertLinkFromDialog(); if (e.key === 'Escape') setShowLinkDialog(false); }}
              placeholder="https://"
              style={{ width: '100%', padding: '7px 10px', border: '1.5px solid #e8e8e8', borderRadius: 8, fontSize: 13, fontFamily: 'Inter,sans-serif', outline: 'none', boxSizing: 'border-box' }}
              onFocus={e => e.target.style.borderColor = 'var(--orange)'}
              onBlur={e => e.target.style.borderColor = '#e8e8e8'}
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setShowLinkDialog(false)}
              style={{ flex: 1, padding: '7px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', fontSize: 12, color: '#64748b', cursor: 'pointer', fontFamily: 'Inter,sans-serif', fontWeight: 600 }}>
              Cancel
            </button>
            <button onClick={insertLinkFromDialog}
              style={{ flex: 1, padding: '7px', borderRadius: 8, border: 'none', background: 'var(--orange)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>
              Insert Link
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
