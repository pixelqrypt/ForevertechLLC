
'use client';

import { useEffect, useRef, useState } from 'react';
import { Sparkles, Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import {
  buildDeathpunkPhrase,
  createDefaultFusionShirtState,
  getFocusSettings,
  type FusionFocusMode,
  type FusionShirtSide,
  type FusionSideSettings,
} from '@/lib/fusion-shirt-composer';

interface FusionAIProps {
  prompt: string;
  baseImageUrl?: string | null;
  onImageGenerated: (url: string) => void;
}

export function FusionAI({ prompt, baseImageUrl, onImageGenerated }: FusionAIProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isFusing, setIsFusing] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [useUploadedOnly, setUseUploadedOnly] = useState(false);
  const [shirtState, setShirtState] = useState(() => createDefaultFusionShirtState());
  const triggerButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const activeSide = shirtState.activeSide;
  const sideSettings = shirtState[activeSide];
  const previewImageSrc = previews[0] ?? null;
  const activeTextLayers = getActiveTextLayers(sideSettings);
  const editorPanelId = 'fusion-editor-panel';

  useEffect(() => {
    setShirtState((prev) => ({
      ...prev,
      front: {
        ...prev.front,
        autoText: buildDeathpunkPhrase(prompt),
      },
      back: {
        ...prev.back,
        autoText: buildDeathpunkPhrase(`${prompt} back`),
      },
    }));
  }, [prompt]);

  useEffect(() => {
    if (!isOpen) {
      if (restoreFocusRef.current && restoreFocusRef.current.isConnected) {
        restoreFocusRef.current.focus();
      }
      restoreFocusRef.current = null;
      return;
    }

    restoreFocusRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : triggerButtonRef.current;
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const dialog = dialogRef.current;
      if (!dialog) return;

      const focusableElements = getFocusableElements(dialog);
      if (focusableElements.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const firstFocusable = focusableElements[0];
      const lastFocusable = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;

      if (event.shiftKey) {
        if (!activeElement || activeElement === firstFocusable || !dialog.contains(activeElement)) {
          event.preventDefault();
          lastFocusable.focus();
        }
        return;
      }

      if (activeElement === lastFocusable) {
        event.preventDefault();
        firstFocusable.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const updateActiveSide = (nextSide: FusionShirtSide) => {
    setShirtState((prev) => ({ ...prev, activeSide: nextSide }));
  };

  const updateSideSettings = <K extends keyof FusionSideSettings>(
    key: K,
    value: FusionSideSettings[K],
  ) => {
    setShirtState((prev) => ({
      ...prev,
      [prev.activeSide]: {
        ...prev[prev.activeSide],
        [key]: value,
      },
    }));
  };

  const updateFocusMode = (focusMode: FusionFocusMode) => {
    setShirtState((prev) => ({
      ...prev,
      [prev.activeSide]: {
        ...prev[prev.activeSide],
        ...getFocusSettings(prev.activeSide, focusMode),
      },
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    addFiles(selectedFiles);
  };

  const addFiles = (selectedFiles: File[]) => {
    const validFiles = selectedFiles.filter(file => {
      const isValidSize = file.size <= 20 * 1024 * 1024;
      const isValidType = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
      return isValidSize && isValidType;
    });

    if (validFiles.length !== selectedFiles.length) {
      setError('Some files were rejected (must be ≤20MB JPG/PNG/WebP)');
    } else {
      setError(null);
    }

    setFiles(prev => [...prev, ...validFiles]);
    
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviews(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const finalizeImage = async (imageUrl: string) => {
    onImageGenerated(imageUrl);
    const didSave = await saveFusionImageToAccount(imageUrl, prompt);
    if (didSave) setSaveMessage('Saved to your account');
    setIsFusing(false);
    setIsOpen(false);
  };

  const startFusion = async () => {
    if (files.length === 0) return;

    setIsFusing(true);
    setStatus('Initializing...');
    setProgress(0);
    setError(null);
    setSaveMessage(null);

    if (useUploadedOnly) {
      try {
        setStatus('Processing uploaded image...');
        setProgress(0.15);
        const firstFile = files[0];
        const userBitmap = await createImageBitmap(firstFile);
        const size = 1024;
        
        const out = document.createElement('canvas');
        out.width = size;
        out.height = size;
        const octx = out.getContext('2d');
        if (!octx) throw new Error('canvas_unavailable');
        octx.imageSmoothingEnabled = true;
        octx.imageSmoothingQuality = 'high';

        const printW = Math.round(size * 0.64);
        const printH = Math.round(size * 0.64);
        const px = Math.round((size - printW) / 2);
        const py = Math.round(size * 0.16);

        octx.save();
        clipRoundRect(octx, px, py, printW, printH, Math.round(size * 0.03));
        drawCover(octx, userBitmap, px, py, printW, printH, userBitmap.width, userBitmap.height);
        octx.restore();

        octx.save();
        octx.globalCompositeOperation = 'source-over';
        octx.globalAlpha = 0.22;
        octx.strokeStyle = 'rgba(0,0,0,0.35)';
        octx.lineWidth = Math.max(2, Math.round(size * 0.004));
        octx.beginPath();
        octx.rect(px + 1, py + 1, printW - 2, printH - 2);
        octx.stroke();
        octx.restore();

        const dataUrl = await canvasToDataUrl(out);
        setProgress(1);
        setStatus('done');
        await finalizeImage(dataUrl);
        return;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to process uploaded image');
        setIsFusing(false);
        return;
      }
    }

    if (!prompt) {
      setError('Please enter a prompt');
      setIsFusing(false);
      return;
    }

    if (!baseImageUrl) {
      setError('Generate an asset first, then add your image to fuse with it.');
      setIsFusing(false);
      return;
    }

    try {
      setStatus('Blending with generated asset...');
      setProgress(0.15);
      const fused = await fuseClientSide({ baseImageUrl, files, prompt, settings: sideSettings });
      setProgress(1);
      setStatus('done');
      await finalizeImage(fused);
      return;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fusion failed');
    }

    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    formData.append('payload', JSON.stringify({ prompt, strength: 0.75, steps: 50, baseImageUrl }));

    try {
      const res = await fetch('/api/fuse', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: 'Unknown server error' }));
        const errorMessage = typeof errorData.detail === 'string' 
          ? errorData.detail 
          : (errorData.detail ? JSON.stringify(errorData.detail) : `Server returned ${res.status}`);
        throw new Error(errorMessage);
      }
      
      const { jobId } = await res.json();
      connectWebSocket(jobId);
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          setError('Request timed out. Please check if the Fusion service is running.');
        } else if (err.message === 'Failed to fetch' || err.message.includes('network')) {
          setError('Could not connect to Fusion service. Ensure it is running on port 8000.');
        } else {
          setError(err.message);
        }
      } else {
        setError('An unexpected error occurred');
      }
      setIsFusing(false);
    }
  };

  const connectWebSocket = (jobId: string) => {
    if (jobId === 'mock-job') {
      setStatus('Simulating Fusion...');
      setProgress(50);
      setTimeout(() => {
        setProgress(100);
        setStatus('done');
        const mockSvg = `data:image/svg+xml;base64,${btoa(
          '<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">' +
            '<rect width="100%" height="100%" fill="#1a1a2e"/>' +
            '<text x="50%" y="50%" font-family="system-ui" font-size="24" fill="#60a5fa" text-anchor="middle">' +
              'Mock Fused Image' +
            '</text>' +
            '<text x="50%" y="60%" font-family="system-ui" font-size="16" fill="#9ca3af" text-anchor="middle">' +
              '(Fusion Service Offline)' +
            '</text>' +
          '</svg>'
        )}`;
        void finalizeImage(mockSvg);
      }, 2000);
      return;
    }
    const ws = new WebSocket(`ws://127.0.0.1:8000/progress/${jobId}`);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setStatus(data.status);
      setProgress(data.progress);

      if (data.status === 'done') {
        const imageUrl = `http://127.0.0.1:8000${data.result}`;
        void finalizeImage(imageUrl);
        ws.close();
      } else if (data.status === 'error') {
        const err = data.error;
        setError(typeof err === 'string' ? err : (err ? JSON.stringify(err) : 'Unknown backend error'));
        setIsFusing(false);
        ws.close();
      }
    };

    ws.onerror = () => {
      setError('WebSocket connection error');
      setIsFusing(false);
    };
  };

  return (
    <div className="mt-6">
      <button
        ref={triggerButtonRef}
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-controls={editorPanelId}
        onClick={() => !isFusing && setIsOpen(true)}
        className="w-full py-4 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 group border border-blue-400/20"
      >
        <Sparkles className="w-5 h-5 group-hover:animate-pulse" />
        Advanced Fusion Extension
      </button>

      {saveMessage ? (
        <div className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
          {saveMessage}
        </div>
      ) : null}

      {isOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4">
          <div
            ref={dialogRef}
            id={editorPanelId}
            role="dialog"
            aria-modal="true"
            aria-labelledby="fusion-modal-title"
            tabIndex={-1}
            className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-gray-700 bg-gray-900 shadow-2xl shadow-blue-950/20"
          >
            <div className="shrink-0 border-b border-gray-800 px-4 py-4 sm:px-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-600/20 p-2">
                  <Sparkles className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 id="fusion-modal-title" className="text-lg font-bold text-white sm:text-xl">Image Fusion Studio</h3>
                  <p className="text-xs text-gray-400">Compact same-page shirt composer with front/back phrase control.</p>
                </div>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                aria-label="Close fusion modal"
                onClick={() => !isFusing && setIsOpen(false)}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm font-medium text-gray-300 transition-colors hover:border-blue-500/40 hover:text-white"
              >
                <X className="w-4 h-4" />
                Close
              </button>
              </div>
            </div>

            <div data-testid="fusion-modal-body" className="min-h-0 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
              <div
                data-testid="fusion-editor-grid"
                className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]"
              >
              <div className="space-y-5">
              {baseImageUrl && (
                <div className="rounded-xl border border-gray-800 bg-gray-950/40 p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-gray-300">
                    <ImageIcon className="w-4 h-4 text-blue-400" />
                    Using Generated Asset
                  </div>
                  <div className="mt-3 aspect-video overflow-hidden rounded-lg border border-gray-800 bg-black/40">
                    <img src={normalizeUrl(baseImageUrl)} alt="Generated asset" className="h-full w-full object-contain" />
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-gray-800 bg-gray-950/50 p-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-500">Shirt Side</div>
                    <p className="mt-1 text-sm text-gray-400">Front and back keep separate blend and phrase settings.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      aria-label="Front side"
                      aria-pressed={activeSide === 'front'}
                      onClick={() => updateActiveSide('front')}
                      className={getSegmentedButtonClass(activeSide === 'front')}
                    >
                      Front
                    </button>
                    <button
                      type="button"
                      aria-label="Back side"
                      aria-pressed={activeSide === 'back'}
                      onClick={() => updateActiveSide('back')}
                      className={getSegmentedButtonClass(activeSide === 'back')}
                    >
                      Back
                    </button>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <section aria-label="Blend Panel" className="rounded-xl border border-gray-800 bg-gray-900/70 p-4 space-y-3">
                    <div>
                      <h4 className="text-sm font-semibold text-white">Blend Panel</h4>
                      <p className="text-xs text-gray-500">
                        Keep the subject readable while deciding how much abstract art takes over the shirt area.
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        aria-label="Subject focus"
                        aria-pressed={sideSettings.focusMode === 'subject'}
                        onClick={() => updateFocusMode('subject')}
                        className={getSegmentedButtonClass(sideSettings.focusMode === 'subject')}
                      >
                        Subject
                      </button>
                      <button
                        type="button"
                        aria-label="Balanced focus"
                        aria-pressed={sideSettings.focusMode === 'balanced'}
                        onClick={() => updateFocusMode('balanced')}
                        className={getSegmentedButtonClass(sideSettings.focusMode === 'balanced')}
                      >
                        Balanced
                      </button>
                      <button
                        type="button"
                        aria-label="Background focus"
                        aria-pressed={sideSettings.focusMode === 'background'}
                        onClick={() => updateFocusMode('background')}
                        className={getSegmentedButtonClass(sideSettings.focusMode === 'background')}
                      >
                        Background
                      </button>
                    </div>
                    <dl className="grid grid-cols-2 gap-2 text-xs text-gray-400">
                      <div className="rounded-lg border border-gray-800 bg-gray-950/60 px-3 py-2">
                        <dt className="text-gray-500">Center protection</dt>
                        <dd className="mt-1 font-semibold text-gray-200">{Math.round(sideSettings.centerProtection * 100)}%</dd>
                      </div>
                      <div className="rounded-lg border border-gray-800 bg-gray-950/60 px-3 py-2">
                        <dt className="text-gray-500">Abstract strength</dt>
                        <dd className="mt-1 font-semibold text-gray-200">{Math.round(sideSettings.abstractStrength * 100)}%</dd>
                      </div>
                    </dl>
                  </section>

                  <section aria-label="Text Panel" className="rounded-xl border border-gray-800 bg-gray-900/70 p-4 space-y-3">
                    <div>
                      <h4 className="text-sm font-semibold text-white">Text Panel</h4>
                      <p className="text-xs text-gray-500">
                        Swap between generated wording, your own phrase, or both for the active side.
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        aria-label="Auto phrase mode"
                        aria-pressed={sideSettings.phraseMode === 'auto'}
                        onClick={() => updateSideSettings('phraseMode', 'auto')}
                        className={getSegmentedButtonClass(sideSettings.phraseMode === 'auto')}
                      >
                        Auto
                      </button>
                      <button
                        type="button"
                        aria-label="Manual phrase mode"
                        aria-pressed={sideSettings.phraseMode === 'manual'}
                        onClick={() => updateSideSettings('phraseMode', 'manual')}
                        className={getSegmentedButtonClass(sideSettings.phraseMode === 'manual')}
                      >
                        Manual
                      </button>
                      <button
                        type="button"
                        aria-label="Both phrase mode"
                        aria-pressed={sideSettings.phraseMode === 'both'}
                        onClick={() => updateSideSettings('phraseMode', 'both')}
                        className={getSegmentedButtonClass(sideSettings.phraseMode === 'both')}
                      >
                        Both
                      </button>
                    </div>

                    {sideSettings.phraseMode !== 'manual' ? (
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-white" htmlFor={`${activeSide}-auto-phrase`}>
                          Auto phrase
                        </label>
                        <input
                          id={`${activeSide}-auto-phrase`}
                          aria-label="Auto phrase"
                          readOnly
                          value={sideSettings.autoText}
                          className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white"
                        />
                      </div>
                    ) : null}

                    {sideSettings.phraseMode !== 'auto' ? (
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-white" htmlFor={`${activeSide}-manual-phrase`}>
                          Manual phrase
                        </label>
                        <input
                          id={`${activeSide}-manual-phrase`}
                          aria-label="Manual phrase"
                          value={sideSettings.manualText}
                          onChange={(e) => updateSideSettings('manualText', e.target.value)}
                          className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white"
                          placeholder="Type a short shirt phrase"
                        />
                      </div>
                    ) : null}

                    <div className="rounded-lg border border-gray-800 bg-gray-950/60 px-3 py-2 text-xs text-gray-400">
                      <span className="font-semibold text-gray-200">Preview mode:</span> {sideSettings.phraseMode}
                    </div>
                  </section>
                </div>
              </div>

              <div
                onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-blue-500'); }}
                onDragLeave={(e) => { e.preventDefault(); e.currentTarget.classList.remove('border-blue-500'); }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove('border-blue-500');
                  addFiles(Array.from(e.dataTransfer.files));
                }}
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-40 border-2 border-dashed border-gray-700 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  multiple
                  accept="image/*"
                  className="hidden"
                />
                <div className="p-3 bg-gray-800 rounded-full mb-3 group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6 text-gray-400 group-hover:text-blue-400" />
                </div>
                <p className="text-sm font-medium text-gray-300">Drag & drop or click to upload</p>
                <p className="text-xs text-gray-500 mt-1">JPG, PNG, WebP (max 20MB per file)</p>
              </div>

              <label className="flex items-center gap-3 rounded-xl border border-gray-800 bg-gray-950/40 p-3 cursor-pointer hover:border-blue-500/30 transition-all">
                <input
                  type="checkbox"
                  className="w-5 h-5 accent-blue-500"
                  checked={useUploadedOnly}
                  onChange={(e) => setUseUploadedOnly(e.target.checked)}
                />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">Use Uploaded Image Only</p>
                  <p className="text-xs text-gray-500">Skip the generated asset and keep the compact editor on the same page.</p>
                </div>
              </label>

              {previews.length > 0 && (
                <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
                  {previews.map((src, i) => (
                    <div key={i} className="relative aspect-square overflow-hidden rounded-lg border border-gray-700 group">
                      <img src={src} alt="Preview" className="object-cover w-full h-full" />
                      {!isFusing && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                          className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {isFusing && (
                <div className="space-y-3">
                  <div className="flex items-end justify-between">
                    <div className="flex items-center gap-2 text-blue-400">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm font-medium capitalize">{status.replace('_', ' ')}</span>
                    </div>
                    <span className="text-xs font-bold text-gray-500">{Math.round(progress * 100)}%</span>
                  </div>
                  <div className="w-full h-2 overflow-hidden rounded-full bg-gray-800">
                    <div
                      className="h-full bg-blue-500 transition-all duration-500 ease-out"
                      style={{ width: `${progress * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                  <X className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="button"
                disabled={isFusing || files.length === 0 || (!useUploadedOnly && (!prompt || !baseImageUrl))}
                onClick={startFusion}
                className="w-full py-4 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed text-white transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
              >
                {isFusing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {useUploadedOnly ? 'Processing Image...' : 'Processing Fusion...'}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    {useUploadedOnly
                      ? 'Use Uploaded Image'
                      : `Fuse ${files.length > 0 ? `${files.length} Image${files.length > 1 ? 's' : ''}` : ''} with Prompt`}
                  </>
                )}
              </button>
              </div>

              <section aria-label="Live Preview" className="rounded-xl border border-gray-800 bg-gray-950/60 p-4 space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-white">Live Preview</h4>
                  <p className="text-xs text-gray-500">
                    Preview the active side, center-safe composition, and phrase treatment before running fusion.
                  </p>
                </div>

                <dl className="grid grid-cols-3 gap-2 text-xs">
                  <div className="rounded-lg border border-gray-800 bg-gray-900/80 px-3 py-2">
                    <dt className="text-gray-500">Current side</dt>
                    <dd className="mt-1 font-semibold capitalize text-gray-100">{activeSide}</dd>
                  </div>
                  <div className="rounded-lg border border-gray-800 bg-gray-900/80 px-3 py-2">
                    <dt className="text-gray-500">Blend focus</dt>
                    <dd className="mt-1 font-semibold capitalize text-gray-100">{sideSettings.focusMode}</dd>
                  </div>
                  <div className="rounded-lg border border-gray-800 bg-gray-900/80 px-3 py-2">
                    <dt className="text-gray-500">Phrase mode</dt>
                    <dd className="mt-1 font-semibold capitalize text-gray-100">{sideSettings.phraseMode}</dd>
                  </div>
                </dl>

                <div className="rounded-2xl border border-gray-800 bg-gradient-to-b from-slate-900 via-gray-950 to-black p-4">
                  <div className="mx-auto flex max-w-[280px] flex-col items-center">
                    <div className="mb-3 inline-flex items-center rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-blue-300">
                      {activeSide} side
                    </div>
                    <div className="relative w-full overflow-hidden rounded-[28px] border border-gray-700 bg-slate-200 px-6 pb-6 pt-5 shadow-[0_18px_50px_rgba(15,23,42,0.45)]">
                      <div className="absolute left-1/2 top-3 h-6 w-20 -translate-x-1/2 rounded-b-2xl border-x border-b border-gray-400 bg-slate-300" />
                      <div className="mx-auto mt-8 aspect-square w-full max-w-[180px] overflow-hidden rounded-[22px] border border-slate-400/70 bg-slate-100 shadow-inner">
                        <div className="relative h-full w-full bg-slate-100">
                          {baseImageUrl && !useUploadedOnly ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={normalizeUrl(baseImageUrl)}
                              alt="Live fusion base preview"
                              className="h-full w-full object-cover opacity-85"
                            />
                          ) : null}
                          {previewImageSrc ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={previewImageSrc}
                              alt="Uploaded subject preview"
                              className="absolute inset-[16%] h-[68%] w-[68%] rounded-[18px] object-cover shadow-[0_0_35px_rgba(255,255,255,0.25)]"
                            />
                          ) : null}
                          {!baseImageUrl && !previewImageSrc ? (
                            <div className="flex h-full items-center justify-center px-4 text-center text-xs text-gray-500">
                              Add a base asset or upload to see the shirt print area fill in.
                            </div>
                          ) : null}
                          {activeTextLayers.length > 0 ? (
                            <div className="pointer-events-none absolute inset-x-3 bottom-3 space-y-1 text-center">
                              {activeTextLayers.slice(0, 2).map((line, index) => (
                                <div
                                  key={`${line}-${index}`}
                                  className={[
                                    'text-[11px] font-semibold uppercase tracking-[0.28em] text-white drop-shadow-[0_0_8px_rgba(15,23,42,0.8)]',
                                    index === 0 ? '' : 'text-[10px] text-blue-100/90',
                                  ].join(' ')}
                                >
                                  {line}
                                </div>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </div>
                      <div className="mt-4 text-center text-[11px] uppercase tracking-[0.24em] text-gray-500">
                        Center-safe print frame
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-2 text-xs text-gray-400 sm:grid-cols-2">
                  <div className="rounded-lg border border-gray-800 bg-gray-900/80 px-3 py-2">
                    <span className="font-semibold text-gray-200">Subject layer:</span>{' '}
                    {previewImageSrc ? 'Uploaded preview loaded' : 'Waiting for upload'}
                  </div>
                  <div className="rounded-lg border border-gray-800 bg-gray-900/80 px-3 py-2">
                    <span className="font-semibold text-gray-200">Background layer:</span>{' '}
                    {useUploadedOnly ? 'Uploaded-only mode' : baseImageUrl ? 'Generated asset ready' : 'Generate asset first'}
                  </div>
                </div>
              </section>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function blobFromDataUrl(dataUrl: string): Blob {
  const comma = dataUrl.indexOf(',');
  if (comma < 0) throw new Error('invalid_data_url');
  const header = dataUrl.slice(0, comma);
  const data = dataUrl.slice(comma + 1);
  const mimeMatch = header.match(/data:([^;]+);base64/i);
  const mime = mimeMatch?.[1] || 'application/octet-stream';
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

function normalizeUrl(url: string): string {
  if (url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) return url;
  return new URL(url, window.location.href).toString();
}

async function loadBitmapFromUrl(url: string): Promise<ImageBitmap> {
  const normalized = normalizeUrl(url);
  if (normalized.startsWith('data:')) {
    const blob = blobFromDataUrl(normalized);
    return await createImageBitmap(blob);
  }
  const fetchUrl = (() => {
    try {
      if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
        const u = new URL(normalized);
        if (u.origin !== window.location.origin) {
          return `/api/proxy-image?url=${encodeURIComponent(normalized)}`;
        }
      }
    } catch {
    }
    return normalized;
  })();
  const res = await fetch(fetchUrl);
  if (!res.ok) throw new Error(`failed_to_fetch_base_image_${res.status}`);
  const blob = await res.blob();
  return await createImageBitmap(blob);
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
  sw: number,
  sh: number,
) {
  const srcAspect = sw / sh;
  const dstAspect = dw / dh;
  let sx = 0;
  let sy = 0;
  let sww = sw;
  let shh = sh;
  if (srcAspect > dstAspect) {
    sww = sh * dstAspect;
    sx = (sw - sww) / 2;
  } else {
    shh = sw / dstAspect;
    sy = (sh - shh) / 2;
  }
  ctx.drawImage(source, sx, sy, sww, shh, dx, dy, dw, dh);
}

function drawContain(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
  sw: number,
  sh: number,
) {
  const srcAspect = sw / sh;
  const dstAspect = dw / dh;
  let w = dw;
  let h = dh;
  if (srcAspect > dstAspect) {
    h = dw / srcAspect;
  } else {
    w = dh * srcAspect;
  }
  const x = dx + (dw - w) / 2;
  const y = dy + (dh - h) / 2;
  ctx.drawImage(source, x, y, w, h);
}

function clipRoundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
  ctx.clip();
}

function makeNoiseCanvas(size: number, seed: number) {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  if (!ctx) return c;
  const img = ctx.createImageData(size, size);
  let s = seed >>> 0;
  for (let i = 0; i < img.data.length; i += 4) {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    const v = (s >>> 0) & 0xff;
    img.data[i] = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function roundToTwo(value: number) {
  return Math.round(value * 100) / 100;
}

function getActiveTextLayers(settings: FusionSideSettings) {
  if (settings.phraseMode === 'auto') return [settings.autoText].filter(Boolean);
  if (settings.phraseMode === 'manual') return [settings.manualText].filter(Boolean);
  return [settings.autoText, settings.manualText].filter(Boolean);
}

function getFontFamily(fontStyle: FusionSideSettings['fontStyle']) {
  switch (fontStyle) {
    case 'chrome-sans':
      return 'system-ui, sans-serif';
    case 'riot-mono':
      return 'ui-monospace, SFMono-Regular, monospace';
    case 'signal-condensed':
    default:
      return '"Arial Narrow", "Helvetica Neue Condensed", system-ui, sans-serif';
  }
}

function measureTextWidth(ctx: CanvasRenderingContext2D, text: string, fontSize: number) {
  if (typeof ctx.measureText === 'function') {
    return ctx.measureText(text).width;
  }

  return text.length * fontSize * 0.62;
}

function wrapTextToWidth(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  fontSize: number,
) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const lines: string[] = [];
  let currentLine = words[0];

  for (const word of words.slice(1)) {
    const candidate = `${currentLine} ${word}`;
    if (measureTextWidth(ctx, candidate, fontSize) <= maxWidth) {
      currentLine = candidate;
      continue;
    }

    lines.push(currentLine);
    currentLine = word;
  }

  lines.push(currentLine);
  return lines;
}

function drawFusionText(
  ctx: CanvasRenderingContext2D,
  settings: FusionSideSettings,
  box: {
    x: number;
    y: number;
    width: number;
    height: number;
  },
) {
  const layers = getActiveTextLayers(settings)
    .map((line) => line.trim())
    .filter(Boolean);

  if (layers.length === 0) return;

  const fontFamily = getFontFamily(settings.fontStyle);
  const maxWidth = box.width * 0.82;
  const maxHeight = box.height * 0.74;
  const minFontSize = 18;
  let fontSize = Math.max(minFontSize, Math.round(box.width * settings.textSize));
  let wrappedLines = layers.map((line) => [line]);
  let lineGap = Math.max(24, Math.round(fontSize * 0.92));
  let sectionGap = Math.max(10, Math.round(fontSize * 0.34));
  let blockHeight = 0;

  while (fontSize >= minFontSize) {
    ctx.font = `700 ${fontSize}px ${fontFamily}`;
    lineGap = Math.max(24, Math.round(fontSize * 0.92));
    sectionGap = Math.max(10, Math.round(fontSize * 0.34));
    wrappedLines = layers.map((line) => wrapTextToWidth(ctx, line, maxWidth, fontSize));

    const lineCount = wrappedLines.reduce((total, layerLines) => total + layerLines.length, 0);
    const layerGapCount = Math.max(0, wrappedLines.length - 1);
    blockHeight = fontSize + Math.max(0, lineCount - 1) * lineGap + layerGapCount * sectionGap;

    const widestLine = Math.max(
      ...wrappedLines.flat().map((line) => measureTextWidth(ctx, line, fontSize)),
      0,
    );
    if (widestLine <= maxWidth && blockHeight <= maxHeight) break;

    fontSize -= 2;
  }

  const topBound = box.y + box.height * 0.08;
  const bottomBound = box.y + box.height * 0.92;
  const availableHeight = bottomBound - topBound;
  const unclampedTop = {
    top: topBound,
    center: topBound + (availableHeight - blockHeight) / 2,
    bottom: bottomBound - blockHeight,
  }[settings.textPlacement];
  const blockTop = clampNumber(unclampedTop, topBound, bottomBound - blockHeight);

  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `700 ${fontSize}px ${fontFamily}`;
  ctx.fillStyle = 'rgba(255,255,255,0.96)';
  let currentY = blockTop + fontSize / 2;

  for (const [layerIndex, lines] of wrappedLines.entries()) {
    for (const line of lines) {
      ctx.fillText(line, box.x + box.width / 2, currentY);
      currentY += lineGap;
    }

    if (layerIndex < wrappedLines.length - 1) {
      currentY += sectionGap;
    }
  }

  ctx.restore();
}

function getFusionBlendProfile(settings: FusionSideSettings, imageCount: number) {
  const abstractLayerAlpha = roundToTwo(
    clampNumber(settings.abstractStrength, imageCount <= 1 ? 0.18 : 0.14, imageCount <= 1 ? 0.9 : 0.82),
  );
  const noiseAlpha = roundToTwo(
    clampNumber(settings.glow * 0.44 + (settings.backgroundBrightness - 1) * 0.8, 0.14, 0.24),
  );
  const toneAlpha = roundToTwo(
    clampNumber(0.08 + (settings.backgroundBrightness - 1) * 0.3 + settings.glow * 0.05, 0.1, 0.14),
  );
  const brightness = Math.max(100, Math.round(settings.backgroundBrightness * 100));
  const centerBlendAlpha = roundToTwo(
    clampNumber(settings.abstractStrength * 0.1 + settings.glow * 0.12 - settings.centerProtection * 0.05, 0.1, 0.18),
  );
  const foregroundAlpha = roundToTwo(
    clampNumber(0.40875 + settings.centerProtection * 0.40625, 0.52, 0.78),
  );
  const glowBlur = Math.round(settings.glow * 60);
  const glowColor = `rgba(255,255,255,${settings.glow})`;

  return {
    abstractLayerAlpha,
    noiseAlpha,
    toneAlpha,
    brightness,
    centerBlendAlpha,
    foregroundAlpha,
    glowBlur,
    glowColor,
  };
}

async function canvasToDataUrl(canvas: HTMLCanvasElement): Promise<string> {
  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob_failed'))), 'image/png');
  });
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('read_failed'));
    reader.onload = () => resolve(String(reader.result || ''));
    reader.readAsDataURL(blob);
  });
}

async function saveFusionImageToAccount(imageUrl: string, prompt: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const storedUserRaw = window.localStorage.getItem('user');
  if (!storedUserRaw) return false;

  let storedUser: { email?: string; name?: string } | null = null;
  try {
    storedUser = JSON.parse(storedUserRaw) as { email?: string; name?: string };
  } catch {
    return false;
  }

  const userName = storedUser?.name || storedUser?.email;
  if (!userName) return false;

  let deviceId = window.localStorage.getItem('device_id');
  if (!deviceId) {
    deviceId = `dev_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    window.localStorage.setItem('device_id', deviceId);
  }

  const catalogName = `${userName.split(' ')[0]}'s Catalog`;
  const res = await fetch('/api/gallery', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      imageUrl,
      prompt: prompt || 'Fusion Image',
      userName,
      catalogName,
      deviceId,
    }),
  }).catch(() => null);

  return Boolean(res?.ok);
}

async function fuseClientSide({
  baseImageUrl,
  files,
  prompt,
  settings,
}: {
  baseImageUrl: string;
  files: File[];
  prompt: string;
  settings: FusionSideSettings;
}) {
  const size = 1024;
  const baseBitmap = await loadBitmapFromUrl(baseImageUrl);
  const userBitmaps = await Promise.all(files.map(async (f) => await createImageBitmap(f)));
  const blendProfile = getFusionBlendProfile(settings, userBitmaps.length);

  const design = document.createElement('canvas');
  design.width = size;
  design.height = size;
  const dctx = design.getContext('2d');
  if (!dctx) throw new Error('canvas_unavailable');
  dctx.imageSmoothingEnabled = true;
  dctx.imageSmoothingQuality = 'high';

  dctx.filter = `brightness(${blendProfile.brightness}%)`;
  drawCover(dctx, baseBitmap, 0, 0, size, size, baseBitmap.width, baseBitmap.height);
  dctx.filter = 'none';

  for (let i = 0; i < userBitmaps.length; i++) {
    const bm = userBitmaps[i];
    dctx.save();
    dctx.globalAlpha = blendProfile.abstractLayerAlpha * (0.9 ** i);
    dctx.globalCompositeOperation = i === 0 ? 'soft-light' : 'overlay';
    const pad = size * 0.04;
    drawContain(dctx, bm, pad, pad, size - pad * 2, size - pad * 2, bm.width, bm.height);
    dctx.restore();
  }

  const seed = (() => {
    let h = 2166136261;
    for (let i = 0; i < prompt.length; i++) h = (h ^ prompt.charCodeAt(i)) * 16777619;
    return h >>> 0;
  })();

  const noise = makeNoiseCanvas(160, seed);
  dctx.save();
  dctx.globalAlpha = blendProfile.noiseAlpha;
  dctx.globalCompositeOperation = 'soft-light';
  drawCover(dctx, noise, 0, 0, size, size, noise.width, noise.height);
  dctx.restore();

  dctx.save();
  dctx.globalCompositeOperation = 'multiply';
  dctx.globalAlpha = blendProfile.toneAlpha;
  const grad = dctx.createLinearGradient(0, 0, 0, size);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.6, 'rgba(235,235,235,1)');
  grad.addColorStop(1, 'rgba(210,210,210,1)');
  dctx.fillStyle = grad;
  dctx.fillRect(0, 0, size, size);
  dctx.restore();

  const out = document.createElement('canvas');
  out.width = size;
  out.height = size;
  const octx = out.getContext('2d');
  if (!octx) throw new Error('canvas_unavailable');
  octx.imageSmoothingEnabled = true;
  octx.imageSmoothingQuality = 'high';

  const printW = Math.round(size * 0.64);
  const printH = Math.round(size * 0.64);
  const px = Math.round((size - printW) / 2);
  const py = Math.round(size * 0.16);

  octx.save();
  clipRoundRect(octx, px, py, printW, printH, Math.round(size * 0.03));
  octx.shadowColor = blendProfile.glowColor;
  octx.shadowBlur = blendProfile.glowBlur;
  drawCover(octx, design, px, py, printW, printH, size, size);
  const centerFade = octx.createRadialGradient(
    px + printW / 2,
    py + printH / 2,
    Math.min(printW, printH) * Math.max(0.04, (1 - settings.edgeFade) * 0.45),
    px + printW / 2,
    py + printH / 2,
    Math.max(printW, printH) * Math.max(0.42, settings.centerProtection * 0.62),
  );
  centerFade.addColorStop(0, 'rgba(255,255,255,0.28)');
  centerFade.addColorStop(0.55, 'rgba(255,255,255,0.12)');
  centerFade.addColorStop(1, 'rgba(255,255,255,0)');
  octx.globalCompositeOperation = 'screen';
  octx.globalAlpha = blendProfile.centerBlendAlpha;
  octx.fillStyle = centerFade;
  octx.fillRect(px, py, printW, printH);
  octx.restore();

  // Keep the uploaded image visible in front while letting the abstract background show through the edges.
  const foregroundPad = Math.round(size * 0.02);
  const baseFgW = printW - foregroundPad * 2;
  const baseFgH = printH - foregroundPad * 2;
  const fgW = baseFgW * settings.scale;
  const fgH = baseFgH * settings.scale;
  const fgX = px + (printW - fgW) / 2;
  const fgY = py + (printH - fgH) / 2 + printH * settings.verticalOffset;
  const fadeInner = Math.min(fgW, fgH) * (1 - settings.edgeFade);
  const fadeOuter = Math.max(fgW, fgH) * settings.edgeFade;
  const foregroundAlpha = userBitmaps.length <= 1
    ? blendProfile.foregroundAlpha
    : Math.min(0.92, blendProfile.foregroundAlpha + 0.07);

  for (let i = 0; i < userBitmaps.length; i++) {
    const bm = userBitmaps[i];
    octx.save();
    clipRoundRect(octx, fgX, fgY, fgW, fgH, Math.round(size * 0.025));
    octx.globalCompositeOperation = 'source-over';
    octx.globalAlpha = foregroundAlpha * (0.92 ** i);
    drawContain(octx, bm, fgX, fgY, fgW, fgH, bm.width, bm.height);

    const fade = octx.createRadialGradient(
      fgX + fgW / 2,
      fgY + fgH / 2,
      fadeInner,
      fgX + fgW / 2,
      fgY + fgH / 2,
      fadeOuter,
    );
    fade.addColorStop(0, 'rgba(0,0,0,1)');
    fade.addColorStop(Math.min(0.82, settings.centerProtection), 'rgba(0,0,0,0.9)');
    fade.addColorStop(1, 'rgba(0,0,0,0.42)');
    octx.globalCompositeOperation = 'destination-in';
    octx.fillStyle = fade;
    octx.fillRect(fgX, fgY, fgW, fgH);

    const unionRing = octx.createRadialGradient(
      fgX + fgW / 2,
      fgY + fgH / 2,
      Math.min(fgW, fgH) * 0.08,
      fgX + fgW / 2,
      fgY + fgH / 2,
      Math.max(fgW, fgH) * 0.62,
    );
    unionRing.addColorStop(0, 'rgba(255,255,255,0)');
    unionRing.addColorStop(0.5, 'rgba(255,255,255,0.08)');
    unionRing.addColorStop(1, 'rgba(255,255,255,0.24)');
    octx.globalCompositeOperation = 'soft-light';
    octx.globalAlpha = settings.glow * (0.92 ** i);
    drawCover(octx, design, fgX, fgY, fgW, fgH, size, size);
    octx.fillStyle = unionRing;
    octx.fillRect(fgX, fgY, fgW, fgH);
    octx.restore();
  }

  drawFusionText(octx, settings, {
    x: px,
    y: py,
    width: printW,
    height: printH,
  });

  octx.save();
  octx.globalCompositeOperation = 'source-over';
  octx.globalAlpha = 0.22;
  octx.strokeStyle = 'rgba(0,0,0,0.35)';
  octx.lineWidth = Math.max(2, Math.round(size * 0.004));
  octx.beginPath();
  octx.rect(px + 1, py + 1, printW - 2, printH - 2);
  octx.stroke();
  octx.restore();

  return await canvasToDataUrl(out);
}

function getSegmentedButtonClass(selected: boolean) {
  return [
    'rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
    selected
      ? 'border-blue-400 bg-blue-500/20 text-white'
      : 'border-gray-700 bg-gray-900 text-gray-300 hover:border-blue-500/40 hover:text-white',
  ].join(' ');
}

function getFocusableElements(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((element) => !element.hasAttribute('disabled') && element.getAttribute('aria-hidden') !== 'true');
}
