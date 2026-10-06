import { useRef, useState } from 'react';
import { decodeBase64Image, readImageFile, validateImage } from '../utils/image';
import CopyButton from './CopyButton';

type DecodedImage = ReturnType<typeof decodeBase64Image>;

export default function ImageTool() {
  const [base64, setBase64] = useState('');
  const [image, setImage] = useState<DecodedImage | null>(null);
  const [fileName, setFileName] = useState('image');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const request = useRef(0);

  const invalidate = () => {
    request.current++;
    setImage(null);
    setError('');
    setBusy(false);
  };

  const convert = async (file?: File) => {
    const id = ++request.current;
    setBusy(true);
    setError('');
    setImage(null);
    try {
      const decoded = decodeBase64Image(file ? await readImageFile(file) : base64);
      await validateImage(decoded.dataUrl);
      if (id !== request.current) return;
      setImage(decoded);
      setFileName(file ? file.name.replace(/\.[^.]+$/, '') : 'image');
      if (file) setBase64(decoded.dataUrl);
    } catch (cause) {
      if (id === request.current) setError(cause instanceof Error ? cause.message : 'Unable to convert the image.');
    } finally {
      if (id === request.current) setBusy(false);
    }
  };

  return (
    <div className="utility-page">
      <p className="text-sm text-muted-foreground">Upload an image to get its Base64, or paste Base64 (with or without a data URL prefix) to preview and download an image.</p>
      <div className="flex flex-wrap items-center gap-3">
        <label className="utility-editor-label" htmlFor="image-upload">Upload image</label>
        <input id="image-upload" className="utility-file-input" type="file" accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml,image/bmp,image/x-icon,image/avif" onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) { setBase64(''); void convert(file); }
          event.target.value = '';
        }} />
        <button className="json-tool-button" onClick={() => { invalidate(); setBase64(''); }}>Clear</button>
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="utility-columns flex-1">
        <div className="utility-editor-pane">
          <label className="utility-editor-label" htmlFor="image-base64">Base64</label>
          <textarea id="image-base64" className="utility-editor flex-1" spellCheck={false} value={base64} onChange={(event) => { invalidate(); setBase64(event.target.value); }} placeholder="data:image/png;base64,... or raw Base64" />
          <div className="flex flex-wrap items-center gap-2">
            <button className="utility-primary-button" disabled={!base64.trim() || busy} onClick={() => void convert()}>{busy ? 'Converting...' : 'Base64 → Image'}</button>
            <CopyButton text={image?.base64 ?? base64} label="Copy Base64" />
            {image && <CopyButton text={image.dataUrl} label="Copy data URL" />}
          </div>
        </div>
        <div className="utility-editor-pane">
          <span className="utility-editor-label">Image preview</span>
          <div className="image-preview flex-1" aria-busy={busy}>
            {image ? <img src={image.dataUrl} alt="Converted image preview" /> : <p className="text-sm text-muted-foreground" role="status">{busy ? 'Loading image...' : 'Upload an image or convert Base64 to see a preview.'}</p>}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button className="utility-primary-button" disabled={!image} onClick={() => {
              if (!image) return;
              const url = URL.createObjectURL(image.blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `${fileName}.${image.extension}`;
              link.click();
              window.setTimeout(() => URL.revokeObjectURL(url), 1000);
            }}>Download image</button>
            {image && <span className="text-xs text-muted-foreground">{image.blob.type} · {image.blob.size.toLocaleString()} bytes</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
