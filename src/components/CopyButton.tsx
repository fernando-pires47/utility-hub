import { useState } from 'react';
import { copyToClipboard } from '../utils/clipboard';

export default function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [feedback, setFeedback] = useState({ text: '', message: '' });
  return (
    <div className="flex items-center gap-2">
      <button className="json-tool-button" disabled={!text} onClick={async () => {
        setFeedback({ text, message: await copyToClipboard(text) ? 'Copied!' : 'Unable to copy. Select and copy the text manually.' });
      }}>{label}</button>
      <span role="status" className="text-xs text-muted-foreground">{feedback.text === text ? feedback.message : ''}</span>
    </div>
  );
}
