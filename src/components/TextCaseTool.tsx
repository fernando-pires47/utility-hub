import { useState } from 'react';
import CopyButton from './CopyButton';

export default function TextCaseTool() {
  const [text, setText] = useState('');
  return (
    <div className="utility-page">
      <p className="text-sm text-muted-foreground">Convert your text to lowercase or uppercase, including accented characters.</p>
      <div className="flex flex-wrap items-center gap-2">
        <button className="utility-primary-button" disabled={!text} onClick={() => setText(text.toLowerCase())}>lower case</button>
        <button className="utility-primary-button" disabled={!text} onClick={() => setText(text.toUpperCase())}>UPPER CASE</button>
        <CopyButton text={text} />
        <button className="json-tool-button" disabled={!text} onClick={() => setText('')}>Clear</button>
      </div>
      <label className="utility-editor-label" htmlFor="text-case-input">Text</label>
      <textarea id="text-case-input" className="utility-editor flex-1" value={text} onChange={(event) => setText(event.target.value)} placeholder="Type or paste your text here..." />
      <span className="text-xs text-muted-foreground">{text.length} characters</span>
    </div>
  );
}
