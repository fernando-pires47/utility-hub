import React, { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { diffContent, type DiffLine } from '../utils/diff';
import { formatPasted } from '../utils/formatters';
import { restructureJSON, validateJSON } from '../utils/json';
import JSONDialog, { type JSONDialogData } from './JSONDialog';
import { editorDiffLines, type TextDiffLine } from '../utils/textDiff';
import { loadFormatterPreferences, saveFormatterPreferences } from '../utils/formatterPreferences';

interface TabViewProps {
  left: string;
  right: string;
  onLeftChange: (value: string) => void;
  onRightChange: (value: string) => void;
  onClearAll: () => void;
}

const placeholder = 'Paste JSON or XML here...\n\nIt will be formatted automatically.';

const handlePaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
  const pasted = event.clipboardData.getData('text');
  if (!pasted) return;
  const result = formatPasted(pasted);
  if (!result?.success || result.formatted === undefined || result.formatted === pasted) return;

  // An editing command preserves the browser's undo/redo history and selection,
  // unlike assigning a new controlled value. Its input event also updates React.
  // If unsupported, leave the default paste intact (unformatted but undoable).
  if (typeof document.execCommand === 'function' && document.execCommand('insertText', false, result.formatted)) {
    event.preventDefault();
  }
};

const DiffLineView: React.FC<{ line: DiffLine }> = ({ line }) => (
  <div className={`diff-line diff-${line.type}`}>
    <span className="diff-sign">
      {line.type === 'add' ? '+' : line.type === 'del' ? '-' : ' '}
    </span>
    <span className="diff-text">{'  '.repeat(line.indent)}{line.text}</span>
  </div>
);

const Pane: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  highlights?: TextDiffLine[];
}> = ({ label, value, onChange, highlights }) => {
  const [dialog, setDialog] = useState<JSONDialogData | null>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    if (highlightRef.current && editorRef.current) {
      highlightRef.current.style.transform = `translate(${-editorRef.current.scrollLeft}px, ${-editorRef.current.scrollTop}px)`;
    }
  }, [highlights]);

  const restructure = () => {
    const result = restructureJSON(value);
    setDialog({
      title: `Restructure JSON — ${label}`,
      success: result.success,
      message: result.success
        ? 'Converted to strict JSON. Your original text has not been changed.'
        : result.error ?? 'Unable to restructure JSON.',
      formatted: result.formatted,
    });
  };

  const validate = () => {
    const result = validateJSON(value);
    setDialog({
      title: `Validate JSON — ${label}`,
      success: result.valid,
      message: result.valid ? 'Valid JSON.' : `Invalid JSON: ${result.error}`,
    });
  };

  return (
    <div className="flex h-full min-w-0 flex-col overflow-hidden">
      <div className="px-4 py-2 flex flex-wrap gap-2 justify-between items-center">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <button className="json-tool-button" onClick={restructure}>Restructure JSON</button>
          <button className="json-tool-button" onClick={validate}>Validate JSON</button>
          {value && (
            <button
              className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              onClick={() => onChange('')}
            >
              Clear
            </button>
          )}
        </div>
      </div>
      <div className="diff-editor">
        {highlights && (
          <div className="diff-editor-highlights" aria-hidden="true">
            <div ref={highlightRef} className="diff-editor-highlight-content">
              {highlights.map((line, index) => <div key={index} className={`diff-editor-line diff-${line.type}`}>{line.text || '\u00a0'}</div>)}
            </div>
          </div>
        )}
        <textarea
          ref={editorRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onPaste={handlePaste}
          onScroll={(event) => {
            if (!highlightRef.current) return;
            highlightRef.current.style.transform = `translate(${-event.currentTarget.scrollLeft}px, ${-event.currentTarget.scrollTop}px)`;
          }}
          placeholder={placeholder}
          aria-label={`${label} content`}
          spellCheck={false}
          wrap="off"
          className="diff-editor-input"
        />
      </div>
      {dialog && <JSONDialog data={dialog} onClose={() => setDialog(null)} />}
    </div>
  );
};

const TabView: React.FC<TabViewProps> = ({ left, right, onLeftChange, onRightChange, onClearAll }) => {
  const result = useMemo(() => diffContent(left, right), [left, right]);
  const [initialPreferences] = useState(loadFormatterPreferences);
  const [leftWidth, setLeftWidth] = useState(initialPreferences.rightCollapsed ? 100 : 50);
  const [diffVisible, setDiffVisible] = useState(initialPreferences.diffVisible);
  const diffId = useId();
  const [editorShare, setEditorShare] = useState(50);
  const comparisonRef = useRef<HTMLDivElement>(null);
  const heightDragging = useRef(false);
  const inputsRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const expandedWidth = useRef(50);
  const rightCollapsed = leftWidth === 100;
  const highlights = useMemo(() => left && right && !rightCollapsed ? editorDiffLines(left, right) : null, [left, right, rightCollapsed]);

  useEffect(() => {
    saveFormatterPreferences({ diffVisible, rightCollapsed });
  }, [diffVisible, rightCollapsed]);

  const resize = (width: number) => setLeftWidth(Math.min(100, Math.max(20, width)));

  const toggleRight = () => {
    if (rightCollapsed) {
      setLeftWidth(expandedWidth.current);
    } else {
      expandedWidth.current = leftWidth;
      setLeftWidth(100);
    }
  };

  const resizeFromPointer = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current || !inputsRef.current) return;
    const bounds = inputsRef.current.getBoundingClientRect();
    const availableWidth = bounds.width - event.currentTarget.getBoundingClientRect().width;
    if (availableWidth <= 0) return;
    resize(((event.clientX - bounds.left) / availableWidth) * 100);
  };

  const resizeHeight = (share: number) => {
    if (!comparisonRef.current || !inputsRef.current) return;
    const availableHeight = comparisonRef.current.getBoundingClientRect().height - 10;
    if (availableHeight <= 0) return;
    const minimumEditorHeight = Number.parseFloat(getComputedStyle(inputsRef.current).minHeight);
    const minimum = Math.min(100, (minimumEditorHeight / availableHeight) * 100);
    const maximum = Math.max(minimum, 100 - (80 / availableHeight) * 100);
    setEditorShare(Math.min(maximum, Math.max(minimum, share)));
  };

  const changeCount = result.lines.filter((line) => line.type !== 'same').length;
  const hasError = Boolean(result.leftError || result.rightError || result.error);

  const status = result.error
    ? result.error
    : result.lines.length === 0
      ? 'Paste content on both sides to compare.'
      : result.changed
        ? `${changeCount} difference${changeCount === 1 ? '' : 's'} found`
        : 'Contents are identical';

  return (
    <div className="min-h-0 flex-1 flex flex-col overflow-hidden bg-background">
      <div className="flex flex-wrap items-center justify-end gap-2 border-b border-border px-4 py-2">
        {highlights && <span className="mr-auto text-xs text-muted-foreground">Line differences: <span className="text-red-700 dark:text-red-300">− Left</span> / <span className="text-green-700 dark:text-green-300">+ Right</span></span>}
        <button
          className="json-tool-button"
          onClick={() => setDiffVisible((visible) => !visible)}
          aria-expanded={diffVisible}
          aria-controls={diffId}
        >
          {diffVisible ? 'Hide differences' : 'Show differences'}
        </button>
        <button className="json-tool-button" onClick={toggleRight} aria-expanded={!rightCollapsed}>
          {rightCollapsed ? 'Show right panel' : 'Hide right panel'}
        </button>
        <button className="json-tool-button" onClick={onClearAll}>Clear all</button>
      </div>
      <div ref={comparisonRef} className="min-h-0 flex flex-1 flex-col overflow-hidden">
      <div
        ref={inputsRef}
        className={`diff-inputs border-b border-border ${rightCollapsed ? 'right-collapsed' : ''} ${!diffVisible ? 'diff-hidden' : ''}`}
        style={{
          '--left-pane-width': `${leftWidth}fr`,
          '--right-pane-width': `${100 - leftWidth}fr`,
          '--inputs-height': `calc(${editorShare}% - ${editorShare / 10}px)`,
        } as React.CSSProperties}
      >
        <div className="min-w-0 overflow-hidden">
          <Pane label="Left (A)" value={left} onChange={onLeftChange} highlights={highlights?.left} />
        </div>
        <div
          role="separator"
          aria-label="Resize right panel"
          aria-orientation="vertical"
          aria-valuemin={20}
          aria-valuemax={100}
          aria-valuenow={leftWidth}
          aria-valuetext={`Left panel ${Math.round(leftWidth)}%, right panel ${Math.round(100 - leftWidth)}%`}
          tabIndex={0}
          className="pane-resizer"
          title="Drag to resize. Use arrow keys or End to hide the right panel."
          onPointerDown={(event) => {
            if (event.button !== 0) return;
            event.preventDefault();
            event.currentTarget.focus();
            dragging.current = true;
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerMove={resizeFromPointer}
          onPointerUp={(event) => {
            dragging.current = false;
            if (event.currentTarget.hasPointerCapture(event.pointerId)) {
              event.currentTarget.releasePointerCapture(event.pointerId);
            }
          }}
          onPointerCancel={() => { dragging.current = false; }}
          onLostPointerCapture={() => { dragging.current = false; }}
          onKeyDown={(event) => {
            const widths: Record<string, number> = {
              ArrowLeft: leftWidth - 5,
              ArrowRight: leftWidth + 5,
              Home: 20,
              End: 100,
            };
            if (event.key in widths) {
              event.preventDefault();
              resize(widths[event.key]);
            }
          }}
          onDoubleClick={() => setLeftWidth(50)}
        />
        <div className="diff-pane-right min-w-0 overflow-hidden" hidden={rightCollapsed}>
          <Pane label="Right (B)" value={right} onChange={onRightChange} highlights={highlights?.right} />
        </div>
      </div>

      {diffVisible && (
        <div
          role="separator"
          aria-label="Resize differences panel"
          aria-orientation="horizontal"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(100 - editorShare)}
          aria-valuetext={`Differences panel ${Math.round(100 - editorShare)}%`}
          aria-controls={diffId}
          tabIndex={0}
          className="diff-height-resizer"
          title="Drag to resize differences. Use up/down arrow keys or double-click to reset."
          onPointerDown={(event) => {
            if (event.button !== 0) return;
            event.preventDefault();
            event.currentTarget.focus();
            heightDragging.current = true;
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerMove={(event) => {
            if (!heightDragging.current || !comparisonRef.current) return;
            const bounds = comparisonRef.current.getBoundingClientRect();
            if (bounds.height <= 10) return;
            resizeHeight(((event.clientY - bounds.top - 5) / (bounds.height - 10)) * 100);
          }}
          onPointerUp={(event) => {
            heightDragging.current = false;
            if (event.currentTarget.hasPointerCapture(event.pointerId)) {
              event.currentTarget.releasePointerCapture(event.pointerId);
            }
          }}
          onPointerCancel={() => { heightDragging.current = false; }}
          onLostPointerCapture={() => { heightDragging.current = false; }}
          onKeyDown={(event) => {
            const shares: Record<string, number> = {
              ArrowUp: editorShare - 5,
              ArrowDown: editorShare + 5,
              Home: 0,
              End: 100,
            };
            if (event.key in shares) {
              event.preventDefault();
              resizeHeight(shares[event.key]);
            }
          }}
          onDoubleClick={() => resizeHeight(50)}
        />
      )}

      <section
        id={diffId}
        aria-label="Content differences"
        hidden={!diffVisible}
        className={diffVisible ? 'flex min-h-20 flex-1 flex-col overflow-auto' : undefined}
      >
        <div className="border-b border-border px-6 py-2">
          <span
            className={`text-xs font-medium uppercase tracking-wide ${
              hasError
                ? 'text-destructive'
                : result.changed
                  ? 'text-yellow-600 dark:text-yellow-400'
                  : 'text-primary'
            }`}
          >
            {status}
          </span>
        </div>

        {result.leftError && (
          <div className="px-6 py-3">
            <p className="text-sm text-destructive">Left (A): {result.leftError}</p>
          </div>
        )}
        {result.rightError && (
          <div className="px-6 py-3">
            <p className="text-sm text-destructive">Right (B): {result.rightError}</p>
          </div>
        )}

        {!hasError && result.lines.length > 0 && (
          <div className="flex-1 overflow-auto py-4">
            {result.lines.map((line, index) => (
              <DiffLineView key={index} line={line} />
            ))}
          </div>
        )}
      </section>
      </div>
    </div>
  );
};

export default TabView;
