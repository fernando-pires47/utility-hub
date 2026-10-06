import { useEffect, useRef, useState } from 'react';
import { copyToClipboard } from '../utils/clipboard';

export interface JSONDialogData {
  title: string;
  success: boolean;
  message: string;
  formatted?: string;
}

interface JSONDialogProps {
  data: JSONDialogData;
  onClose: () => void;
}

export default function JSONDialog({ data, onClose }: JSONDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copying' | 'copied' | 'error'>('idle');

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  const copy = async () => {
    if (data.formatted === undefined) return;
    setCopyStatus('copying');
    const copied = await copyToClipboard(data.formatted, dialogRef.current ?? undefined);
    setCopyStatus(copied ? 'copied' : 'error');
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={(event) => {
        // StrictMode reopens the dialog after its effect cleanup. Ignore the
        // queued close event from that cleanup when it is already open again.
        if (!event.currentTarget.open) onClose();
      }}
      aria-labelledby="json-dialog-title"
      aria-describedby="json-dialog-message"
      className="json-dialog rounded-lg border border-border bg-card text-card-foreground p-0 shadow-xl"
    >
      <div className="flex items-center justify-between gap-4 border-b border-border px-6 py-4">
        <h2 id="json-dialog-title" className="text-lg font-semibold">{data.title}</h2>
        <form method="dialog">
          <button className="json-tool-button" aria-label="Close dialog">Close</button>
        </form>
      </div>
      <div className="flex min-h-0 flex-col gap-4 p-6">
        <p
          id="json-dialog-message"
          className={`text-sm whitespace-pre-wrap break-words ${data.success ? 'text-foreground' : 'text-red-600 dark:text-red-400'}`}
        >
          {data.message}
        </p>
        {data.formatted !== undefined && (
          <>
            <textarea
              readOnly
              value={data.formatted}
              aria-label="Restructured JSON"
              spellCheck={false}
              className="json-dialog-output w-full resize-none rounded-md border border-border bg-background p-4 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <div className="flex flex-wrap items-center justify-end gap-3">
              <span role="status" className="text-sm text-muted-foreground">
                {copyStatus === 'copied' && 'Copied to clipboard!'}
                {copyStatus === 'error' && 'Copy failed. Select the text and copy manually.'}
              </span>
              <button
                onClick={copy}
                disabled={copyStatus === 'copying'}
                className="json-tool-button bg-primary text-primary-foreground disabled:opacity-50"
              >
                {copyStatus === 'copying' ? 'Copying…' : 'Copy JSON'}
              </button>
            </div>
          </>
        )}
      </div>
    </dialog>
  );
}
