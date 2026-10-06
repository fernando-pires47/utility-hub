import { useState } from 'react';
import { formatSQL, sqlDialects, type SqlDialect } from '../utils/sql';
import CopyButton from './CopyButton';

export default function SQLTool() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [dialect, setDialect] = useState<SqlDialect>('sql');
  const [error, setError] = useState('');

  const resetOutput = () => { setOutput(''); setError(''); };

  return (
    <div className="utility-page">
      <p className="text-sm text-muted-foreground">Format SQL with indentation and uppercase keywords. Queries are never executed.</p>
      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor="sql-dialect" className="text-sm">Dialect</label>
        <select id="sql-dialect" className="utility-select" value={dialect} onChange={(event) => { setDialect(event.target.value as SqlDialect); resetOutput(); }}>
          {sqlDialects.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
        </select>
        <button className="utility-primary-button" disabled={!input.trim()} onClick={() => {
          const result = formatSQL(input, dialect);
          setOutput(result.success ? result.formatted : '');
          setError(result.success ? '' : result.error);
        }}>Format SQL</button>
        <button className="json-tool-button" onClick={() => { setInput(''); resetOutput(); }}>Clear</button>
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="utility-columns sql-columns flex-1">
        <div className="utility-editor-pane">
          <div className="sql-editor-header">
            <label className="utility-editor-label" htmlFor="sql-input">SQL input</label>
          </div>
          <textarea id="sql-input" className="utility-editor flex-1" spellCheck={false} value={input} onChange={(event) => { setInput(event.target.value); resetOutput(); }} placeholder="select id, name from users where active = true order by name;" />
        </div>
        <div className="utility-editor-pane">
          <div className="sql-editor-header">
            <label className="utility-editor-label" htmlFor="sql-output">Formatted SQL</label>
            <CopyButton text={output} />
          </div>
          <textarea id="sql-output" className="utility-editor flex-1" spellCheck={false} readOnly value={output} placeholder="Your formatted SQL will appear here..." />
        </div>
      </div>
    </div>
  );
}
