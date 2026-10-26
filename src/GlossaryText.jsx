import React, { useEffect, useId, useState } from 'react';
import { chemistryGlossary } from './chemistryGlossary.js';

const entries = chemistryGlossary.flatMap((entry) => [entry.term, ...(entry.aliases || [])].map((match) => ({ match, entry })))
  .sort((a, b) => b.match.length - a.match.length);
const entryByMatch = new Map(entries.map(({ match, entry }) => [match.toLocaleLowerCase('fr'), entry]));
const expression = new RegExp(`(?<![\\p{L}\\p{N}])(${entries.map(({ match }) => match.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')).join('|')})(?![\\p{L}\\p{N}])`, 'giu');

function DefinitionLink({ word, entry }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 80, left: 12 });
  useEffect(() => {
    const dismissOthers = (event) => { if (event.detail !== id) setOpen(false); };
    const keydown = (event) => { if (event.key === 'Escape') setOpen(false); };
    window.addEventListener('chemistry-glossary-open', dismissOthers);
    window.addEventListener('keydown', keydown);
    return () => {
      window.removeEventListener('chemistry-glossary-open', dismissOthers);
      window.removeEventListener('keydown', keydown);
    };
  }, [id]);
  const toggle = (event) => {
    if (open) { setOpen(false); return; }
    window.dispatchEvent(new CustomEvent('chemistry-glossary-open', { detail: id }));
    const rect = event.currentTarget.getBoundingClientRect();
    const width = Math.min(340, window.innerWidth - 24);
    setPosition({
      left: Math.max(12, Math.min(rect.left, window.innerWidth - width - 12)),
      top: rect.bottom + 10 + 210 < window.innerHeight ? rect.bottom + 10 : Math.max(12, rect.top - 210),
    });
    setOpen(true);
  };
  return <span className="glossary-token">
    <button type="button" className="glossary-link" aria-haspopup="dialog" aria-expanded={open} aria-controls={open ? `glossary-${id}` : undefined} onClick={toggle}>{word}</button>
    {open && <span className="glossary-bubble" id={`glossary-${id}`} role="dialog" aria-label={`Définition : ${entry.term}`} style={{ left: position.left, top: position.top }}>
      <span className="glossary-bubble-heading"><strong>{entry.term}</strong><button type="button" className="glossary-close" aria-label="Fermer la définition" onClick={() => setOpen(false)}>×</button></span>
      <span className="glossary-definition">{entry.definition}</span>
      <span className="glossary-example"><b>Exemple</b>{entry.example}</span>
    </span>}
  </span>;
}

export default function GlossaryText({ children }) {
  if (typeof children !== 'string') return children;
  const result = [];
  let lastIndex = 0;
  expression.lastIndex = 0;
  for (const match of children.matchAll(expression)) {
    const word = match[0];
    const index = match.index ?? 0;
    if (index > lastIndex) result.push(children.slice(lastIndex, index));
    const entry = entryByMatch.get(word.toLocaleLowerCase('fr'));
    result.push(entry ? <DefinitionLink key={`${index}-${word}`} word={word} entry={entry}/> : word);
    lastIndex = index + word.length;
  }
  if (!result.length) return children;
  if (lastIndex < children.length) result.push(children.slice(lastIndex));
  return <>{result}</>;
}
