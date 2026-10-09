
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FusionAI } from './FusionAI';
import React from 'react';

// Mock fetch and WebSocket
const fetchMock = vi.fn();
global.fetch = fetchMock as unknown as typeof fetch;

const webSocketSpy = vi.fn();
class WebSocketMock {
  url: string;
  close = vi.fn();
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  constructor(url: string) {
    this.url = url;
    webSocketSpy(url);
  }
}
global.WebSocket = WebSocketMock as unknown as typeof WebSocket;

describe('FusionAI Component', () => {
  const onImageGenerated = vi.fn();
  let canvasQueue: Array<{
    label: string;
    canvas: HTMLCanvasElement & { __label?: string };
    operations: Array<Record<string, unknown>>;
  }> = [];

  global.FileReader = class FileReaderMock {
    result: string | ArrayBuffer | null = null;
    onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => unknown) | null = null;
    readAsDataURL() {
      this.result = 'data:image/png;base64,AAAA';
      if (this.onload) this.onload.call(this as unknown as FileReader, {} as ProgressEvent<FileReader>);
    }
  } as unknown as typeof FileReader;

  beforeEach(() => {
    onImageGenerated.mockReset();
    fetchMock.mockReset();
    webSocketSpy.mockReset();
    canvasQueue = [];
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('moves focus into the Fusion modal and restores it to the trigger when closed', async () => {
    render(<FusionAI prompt="test prompt" onImageGenerated={onImageGenerated} />);
    const triggerButton = screen.getByRole('button', { name: 'Advanced Fusion Extension' });
    triggerButton.focus();

    expect(screen.queryByRole('dialog', { name: /image fusion studio/i })).not.toBeInTheDocument();

    fireEvent.click(triggerButton);

    expect(screen.getByRole('dialog', { name: /image fusion studio/i })).toBeInTheDocument();
    expect(screen.getByText('Image Fusion Studio')).toBeInTheDocument();
    const closeButton = screen.getByRole('button', { name: /close fusion modal/i });

    await waitFor(() => {
      expect(closeButton).toHaveFocus();
    });

    fireEvent.click(closeButton);

    expect(screen.queryByRole('dialog', { name: /image fusion studio/i })).not.toBeInTheDocument();
    expect(triggerButton).toHaveFocus();
  });

  it('keeps tab focus trapped inside the Fusion modal', async () => {
    render(
      <FusionAI
        prompt="a valid prompt"
        onImageGenerated={onImageGenerated}
        baseImageUrl="http://example.com/base.png"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Advanced Fusion Extension' }));

    const closeButton = screen.getByRole('button', { name: /close fusion modal/i });
    await waitFor(() => {
      expect(closeButton).toHaveFocus();
    });

    const file = new File(['(⌐□_□)'], 'tab-test.png', { type: 'image/png' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement | null;
    expect(fileInput).not.toBeNull();

    await waitFor(() => {
      fireEvent.change(fileInput as HTMLInputElement, { target: { files: [file] } });
    });

    const fuseButton = screen.getByRole('button', { name: /Fuse 1 Image with Prompt/i });
    expect(fuseButton).not.toBeDisabled();

    fuseButton.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(closeButton).toHaveFocus();

    closeButton.focus();
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(fuseButton).toHaveFocus();
  });

  it('disables the fuse button when no prompt or files are provided', () => {
    render(<FusionAI prompt="" onImageGenerated={onImageGenerated} />);
    fireEvent.click(screen.getByText('Advanced Fusion Extension'));
    const fuseButton = screen.getByRole('button', { name: /Fuse/i });
    expect(fuseButton).toBeDisabled();
  });

  it('handles file uploads and displays previews', async () => {
    render(<FusionAI prompt="a valid prompt" onImageGenerated={onImageGenerated} baseImageUrl="http://example.com/base.png" />);
    fireEvent.click(screen.getByText('Advanced Fusion Extension'));

    const file = new File(['(⌐□_□)'], 'chuck.png', { type: 'image/png' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement | null;
    expect(fileInput).not.toBeNull();

    await waitFor(() => {
        fireEvent.change(fileInput as HTMLInputElement, { target: { files: [file] } });
    });

    expect(screen.getByAltText('Preview')).toBeInTheDocument();
    expect(screen.getByText(/Fuse 1 Image with Prompt/i)).not.toBeDisabled();
  });

  it('shows an error for invalid file types or sizes', async () => {
    render(<FusionAI prompt="a valid prompt" onImageGenerated={onImageGenerated} />);
    fireEvent.click(screen.getByText('Advanced Fusion Extension'));

    const largeFile = new File([new ArrayBuffer(21 * 1024 * 1024)], 'large.png', { type: 'image/png' });
    const invalidTypeFile = new File(['test'], 'text.txt', { type: 'text/plain' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement | null;
    expect(fileInput).not.toBeNull();

    await waitFor(() => {
        fireEvent.change(fileInput as HTMLInputElement, { target: { files: [largeFile, invalidTypeFile] } });
    });

    expect(screen.getByText(/Some files were rejected/i)).toBeInTheDocument();
  });

  it('keeps only the trigger inline until the modal opens and renders the editor inside a scrollable body', () => {
    render(
      <FusionAI
        prompt="violet ghost"
        onImageGenerated={onImageGenerated}
        baseImageUrl="http://example.com/base.png"
      />
    );

    expect(screen.queryByText('Blend Panel')).not.toBeInTheDocument();
    expect(screen.queryByText('Text Panel')).not.toBeInTheDocument();
    expect(screen.queryByText('Live Preview')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Advanced Fusion Extension'));

    expect(screen.getByText('Blend Panel')).toBeInTheDocument();
    expect(screen.getByText('Text Panel')).toBeInTheDocument();
    expect(screen.getByText('Live Preview')).toBeInTheDocument();
    expect(screen.getByText('Current side')).toBeInTheDocument();

    const modalBody = screen.getByTestId('fusion-modal-body');
    expect(modalBody).toHaveClass('overflow-y-auto');
    expect(screen.getByTestId('fusion-editor-grid')).toBeInTheDocument();
  });

  it('closes the Fusion modal on Escape and backdrop click when idle', () => {
    render(<FusionAI prompt="test prompt" onImageGenerated={onImageGenerated} />);

    fireEvent.click(screen.getByText('Advanced Fusion Extension'));
    expect(screen.getByRole('dialog', { name: /image fusion studio/i })).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: /image fusion studio/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Advanced Fusion Extension'));
    fireEvent.click(screen.getByTestId('fusion-modal-backdrop'));
    expect(screen.queryByRole('dialog', { name: /image fusion studio/i })).not.toBeInTheDocument();
  });

  it('supports auto, manual, and both phrase modes', async () => {
    render(
      <FusionAI
        prompt="violet ghost"
        onImageGenerated={onImageGenerated}
        baseImageUrl="http://example.com/base.png"
      />
    );

    fireEvent.click(screen.getByText('Advanced Fusion Extension'));

    expect(screen.getByRole('button', { name: 'Auto phrase mode' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByLabelText('Auto phrase')).toHaveValue('Midnight Cathedral');
    expect(screen.queryByLabelText('Manual phrase')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Manual phrase mode' }));
    expect(screen.getByRole('button', { name: 'Manual phrase mode' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByLabelText('Manual phrase')).toBeInTheDocument();
    expect(screen.queryByLabelText('Auto phrase')).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Manual phrase'), { target: { value: 'Front Signal' } });
    expect(screen.getByLabelText('Manual phrase')).toHaveValue('Front Signal');

    fireEvent.click(screen.getByRole('button', { name: 'Both phrase mode' }));
    expect(screen.getByRole('button', { name: 'Both phrase mode' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByLabelText('Auto phrase')).toBeInTheDocument();
    expect(screen.getByLabelText('Manual phrase')).toHaveValue('Front Signal');
  });

  it('defaults focus control to subject on front and balanced on back', () => {
    render(
      <FusionAI
        prompt="violet ghost"
        onImageGenerated={onImageGenerated}
        baseImageUrl="http://example.com/base.png"
      />
    );

    fireEvent.click(screen.getByText('Advanced Fusion Extension'));

    expect(screen.getByRole('button', { name: 'Front side' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Subject focus' })).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(screen.getByRole('button', { name: 'Back side' }));
    expect(screen.getByRole('button', { name: 'Back side' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Balanced focus' })).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(screen.getByRole('button', { name: 'Background focus' }));
    expect(screen.getByRole('button', { name: 'Background focus' })).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(screen.getByRole('button', { name: 'Front side' }));
    expect(screen.getByRole('button', { name: 'Subject focus' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Background focus' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('initiates fusion process and shows progress', async () => {
    fetchMock.mockReset();
    fetchMock.mockImplementation((input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : (input as Request).url;
      if (url.startsWith('/api/fuse')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ jobId: 'test-job-123' }) } as Response);
      }
      return Promise.resolve({ ok: false, status: 500 } as Response);
    });

    render(<FusionAI prompt="a valid prompt" onImageGenerated={onImageGenerated} baseImageUrl="http://example.com/base.png" />);
    fireEvent.click(screen.getByText('Advanced Fusion Extension'));

    const file = new File(['(⌐□_□)'], 'test.png', { type: 'image/png' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement | null;
    expect(fileInput).not.toBeNull();
    await waitFor(() => {
        fireEvent.change(fileInput as HTMLInputElement, { target: { files: [file] } });
    });

    const fuseButton = screen.getByText(/Fuse 1 Image with Prompt/i);
    fireEvent.click(fuseButton);

    await waitFor(() => {
        expect(webSocketSpy).toHaveBeenCalledWith('ws://127.0.0.1:8000/progress/test-job-123');
    });
  });

  it('keeps the uploaded image in front while adding a center merge pass with the abstract layer', async () => {
    const makeCanvasRecord = (label: string) => {
      const operations: Array<Record<string, unknown>> = [];
      let currentAlpha = 1;
      let currentComposite = 'source-over';
      const makeGradient = (kind: 'linear' | 'radial') => ({
        addColorStop: vi.fn((offset: number, color: string) => {
          operations.push({ type: 'gradientStop', kind, offset, color });
        }),
      });
      const ctx = {
        operations,
        save: vi.fn(() => operations.push({ type: 'save' })),
        restore: vi.fn(() => operations.push({ type: 'restore' })),
        drawImage: vi.fn((source: unknown) => operations.push({
          type: 'drawImage',
          source,
          alpha: currentAlpha,
          composite: currentComposite,
        })),
        fillText: vi.fn((text: string, x: number, y: number) => operations.push({
          type: 'fillText',
          text,
          x,
          y,
          alpha: currentAlpha,
          composite: currentComposite,
        })),
        createImageData: vi.fn((width: number, height: number) => ({
          data: new Uint8ClampedArray(width * height * 4),
        })),
        putImageData: vi.fn(),
        createLinearGradient: vi.fn(() => {
          operations.push({ type: 'createGradient', kind: 'linear' });
          return makeGradient('linear');
        }),
        createRadialGradient: vi.fn(() => {
          operations.push({ type: 'createGradient', kind: 'radial' });
          return makeGradient('radial');
        }),
        fillRect: vi.fn(() => operations.push({ type: 'fillRect', alpha: currentAlpha, composite: currentComposite })),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        arcTo: vi.fn(),
        closePath: vi.fn(),
        clip: vi.fn(),
        rect: vi.fn(),
        stroke: vi.fn(),
      } as unknown as CanvasRenderingContext2D & { operations: Array<Record<string, unknown>> };

      Object.defineProperties(ctx, {
        globalAlpha: {
          get: () => currentAlpha,
          set: (value: number) => {
            currentAlpha = value;
            operations.push({ type: 'setAlpha', value });
          },
        },
        globalCompositeOperation: {
          get: () => currentComposite,
          set: (value: string) => {
            currentComposite = value;
            operations.push({ type: 'setComposite', value });
          },
        },
        fillStyle: {
          get: () => undefined,
          set: (value: unknown) => operations.push({ type: 'setFillStyle', value }),
        },
        font: {
          get: () => '',
          set: (value: string) => operations.push({ type: 'setFont', value }),
        },
        textAlign: {
          get: () => 'start',
          set: (value: CanvasTextAlign) => operations.push({ type: 'setTextAlign', value }),
        },
        textBaseline: {
          get: () => 'alphabetic',
          set: (value: CanvasTextBaseline) => operations.push({ type: 'setTextBaseline', value }),
        },
        strokeStyle: {
          get: () => undefined,
          set: (value: unknown) => operations.push({ type: 'setStrokeStyle', value }),
        },
        lineWidth: {
          get: () => 0,
          set: (value: number) => operations.push({ type: 'setLineWidth', value }),
        },
        imageSmoothingEnabled: {
          get: () => true,
          set: () => undefined,
        },
        imageSmoothingQuality: {
          get: () => 'high',
          set: () => undefined,
        },
      });

      const canvas = {
        __label: label,
        width: 0,
        height: 0,
        getContext: vi.fn(() => ctx),
        toBlob: vi.fn((callback: BlobCallback) => callback(new Blob(['png'], { type: 'image/png' }))),
      } as unknown as HTMLCanvasElement & { __label?: string };

      return { label, canvas, operations };
    };

    const canvasRecords = ['design', 'noise', 'out'].map(makeCanvasRecord);
    canvasQueue = [...canvasRecords];

    const realCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation(((...args: Parameters<typeof document.createElement>) => {
      const [tagName] = args;
      if (tagName === 'canvas') {
        const nextCanvas = canvasQueue.shift();
        if (!nextCanvas) {
          throw new Error('unexpected_canvas_request');
        }
        return nextCanvas.canvas;
      }
      return realCreateElement(...args);
    }) as typeof document.createElement);

    const createImageBitmapMock = vi.fn()
      .mockResolvedValueOnce({ width: 1024, height: 1024, __label: 'base' } as ImageBitmap)
      .mockResolvedValueOnce({ width: 700, height: 900, __label: 'user' } as ImageBitmap);
    vi.stubGlobal('createImageBitmap', createImageBitmapMock);

    fetchMock.mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(new Blob(['base'], { type: 'image/png' })),
    } as Response);

    render(
      <FusionAI
        prompt="quantum aura portrait"
        onImageGenerated={onImageGenerated}
        baseImageUrl="http://example.com/base.png"
      />
    );
    fireEvent.click(screen.getByText('Advanced Fusion Extension'));

    const file = new File(['portrait'], 'portrait.png', { type: 'image/png' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement | null;
    expect(fileInput).not.toBeNull();

    await waitFor(() => {
      fireEvent.change(fileInput as HTMLInputElement, { target: { files: [file] } });
    });

    fireEvent.click(screen.getByText(/Fuse 1 Image with Prompt/i));

    await waitFor(() => {
      expect(onImageGenerated).toHaveBeenCalledWith('data:image/png;base64,AAAA');
    });

    const outOperations = canvasRecords.find((record) => record.label === 'out')?.operations ?? [];
    const foregroundDraws = outOperations.filter((operation) =>
      operation.type === 'drawImage' && (operation.source as { __label?: string } | undefined)?.__label === 'user'
    );

    expect(foregroundDraws).toHaveLength(1);
    expect(foregroundDraws[0]).toMatchObject({
      composite: 'source-over',
    });
    expect(foregroundDraws[0].alpha).toBe(0.75);
    expect(outOperations.filter((operation) =>
      operation.type === 'createGradient' && operation.kind === 'radial'
    ).length).toBeGreaterThanOrEqual(2);
    expect(outOperations).toContainEqual(expect.objectContaining({
      type: 'setComposite',
      value: 'destination-in',
    }));
    expect(outOperations).toContainEqual(expect.objectContaining({
      type: 'setComposite',
      value: 'soft-light',
    }));
    expect(outOperations).toContainEqual(expect.objectContaining({
      type: 'setComposite',
      value: 'screen',
    }));
    expect(outOperations).toContainEqual(expect.objectContaining({
      type: 'setAlpha',
      value: 0.1,
    }));
  });

  it('uses back side background focus settings in the compositor path', async () => {
    const makeCanvasRecord = (label: string) => {
      const operations: Array<Record<string, unknown>> = [];
      let currentAlpha = 1;
      let currentComposite = 'source-over';
      let currentFilter = 'none';
      const makeGradient = (kind: 'linear' | 'radial') => ({
        addColorStop: vi.fn((offset: number, color: string) => {
          operations.push({ type: 'gradientStop', kind, offset, color });
        }),
      });
      const ctx = {
        operations,
        save: vi.fn(() => operations.push({ type: 'save' })),
        restore: vi.fn(() => operations.push({ type: 'restore' })),
        drawImage: vi.fn((source: unknown, ...args: unknown[]) => operations.push({
          type: 'drawImage',
          source,
          args,
          alpha: currentAlpha,
          composite: currentComposite,
          filter: currentFilter,
        })),
        fillText: vi.fn((text: string, x: number, y: number) => operations.push({
          type: 'fillText',
          text,
          x,
          y,
          alpha: currentAlpha,
          composite: currentComposite,
          filter: currentFilter,
        })),
        createImageData: vi.fn((width: number, height: number) => ({
          data: new Uint8ClampedArray(width * height * 4),
        })),
        putImageData: vi.fn(),
        createLinearGradient: vi.fn((...args: number[]) => {
          operations.push({ type: 'createGradient', kind: 'linear', args });
          return makeGradient('linear');
        }),
        createRadialGradient: vi.fn((...args: number[]) => {
          operations.push({ type: 'createGradient', kind: 'radial', args });
          return makeGradient('radial');
        }),
        fillRect: vi.fn(() => operations.push({ type: 'fillRect', alpha: currentAlpha, composite: currentComposite })),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        arcTo: vi.fn(),
        closePath: vi.fn(),
        clip: vi.fn(),
        rect: vi.fn(),
        stroke: vi.fn(),
      } as unknown as CanvasRenderingContext2D & { operations: Array<Record<string, unknown>> };

      Object.defineProperties(ctx, {
        globalAlpha: {
          get: () => currentAlpha,
          set: (value: number) => {
            currentAlpha = value;
            operations.push({ type: 'setAlpha', value });
          },
        },
        globalCompositeOperation: {
          get: () => currentComposite,
          set: (value: string) => {
            currentComposite = value;
            operations.push({ type: 'setComposite', value });
          },
        },
        fillStyle: {
          get: () => undefined,
          set: (value: unknown) => operations.push({ type: 'setFillStyle', value }),
        },
        font: {
          get: () => '',
          set: (value: string) => operations.push({ type: 'setFont', value }),
        },
        textAlign: {
          get: () => 'start',
          set: (value: CanvasTextAlign) => operations.push({ type: 'setTextAlign', value }),
        },
        textBaseline: {
          get: () => 'alphabetic',
          set: (value: CanvasTextBaseline) => operations.push({ type: 'setTextBaseline', value }),
        },
        filter: {
          get: () => currentFilter,
          set: (value: string) => {
            currentFilter = value;
            operations.push({ type: 'setFilter', value });
          },
        },
        strokeStyle: {
          get: () => undefined,
          set: (value: unknown) => operations.push({ type: 'setStrokeStyle', value }),
        },
        shadowBlur: {
          get: () => 0,
          set: (value: number) => operations.push({ type: 'setShadowBlur', value }),
        },
        shadowColor: {
          get: () => undefined,
          set: (value: string) => operations.push({ type: 'setShadowColor', value }),
        },
        lineWidth: {
          get: () => 0,
          set: (value: number) => operations.push({ type: 'setLineWidth', value }),
        },
        imageSmoothingEnabled: {
          get: () => true,
          set: () => undefined,
        },
        imageSmoothingQuality: {
          get: () => 'high',
          set: () => undefined,
        },
      });

      const canvas = {
        __label: label,
        width: 0,
        height: 0,
        getContext: vi.fn(() => ctx),
        toBlob: vi.fn((callback: BlobCallback) => callback(new Blob(['png'], { type: 'image/png' }))),
      } as unknown as HTMLCanvasElement & { __label?: string };

      return { label, canvas, operations };
    };

    const canvasRecords = ['design', 'noise', 'out'].map(makeCanvasRecord);
    canvasQueue = [...canvasRecords];

    const realCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation(((...args: Parameters<typeof document.createElement>) => {
      const [tagName] = args;
      if (tagName === 'canvas') {
        const nextCanvas = canvasQueue.shift();
        if (!nextCanvas) {
          throw new Error('unexpected_canvas_request');
        }
        return nextCanvas.canvas;
      }
      return realCreateElement(...args);
    }) as typeof document.createElement);

    const createImageBitmapMock = vi.fn()
      .mockResolvedValueOnce({ width: 1024, height: 1024, __label: 'base' } as ImageBitmap)
      .mockResolvedValueOnce({ width: 700, height: 900, __label: 'user' } as ImageBitmap);
    vi.stubGlobal('createImageBitmap', createImageBitmapMock);

    fetchMock.mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(new Blob(['base'], { type: 'image/png' })),
    } as Response);

    render(
      <FusionAI
        prompt="quantum aura portrait"
        onImageGenerated={onImageGenerated}
        baseImageUrl="http://example.com/base.png"
      />
    );
    fireEvent.click(screen.getByText('Advanced Fusion Extension'));
    fireEvent.click(screen.getByRole('button', { name: 'Back side' }));
    fireEvent.click(screen.getByRole('button', { name: 'Background focus' }));

    const file = new File(['portrait'], 'portrait.png', { type: 'image/png' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement | null;
    expect(fileInput).not.toBeNull();

    await waitFor(() => {
      fireEvent.change(fileInput as HTMLInputElement, { target: { files: [file] } });
    });

    fireEvent.click(screen.getByText(/Fuse 1 Image with Prompt/i));

    await waitFor(() => {
      expect(onImageGenerated).toHaveBeenCalledWith('data:image/png;base64,AAAA');
    });

    const designOperations = canvasRecords.find((record) => record.label === 'design')?.operations ?? [];
    const outOperations = canvasRecords.find((record) => record.label === 'out')?.operations ?? [];
    const foregroundDraw = outOperations.find((operation) =>
      operation.type === 'drawImage' && (operation.source as { __label?: string } | undefined)?.__label === 'user'
    );
    const edgeFadeGradient = outOperations.find((operation) =>
      operation.type === 'createGradient' &&
      operation.kind === 'radial' &&
      Array.isArray(operation.args) &&
      Math.abs(Number(operation.args[2]) - 79.7) < 0.1
    );

    expect(designOperations).toContainEqual(expect.objectContaining({
      type: 'setAlpha',
      value: 0.82,
    }));
    expect(designOperations).toContainEqual(expect.objectContaining({
      type: 'setFilter',
      value: 'brightness(118%)',
    }));
    expect(designOperations).toContainEqual(expect.objectContaining({
      type: 'setAlpha',
      value: 0.24,
    }));
    expect(foregroundDraw).toMatchObject({
      composite: 'source-over',
      alpha: 0.62,
      args: [254.2, 211.79999999999998, 516.6, 664.2],
    });
    expect(outOperations).toContainEqual(expect.objectContaining({
      type: 'setShadowBlur',
      value: 28,
    }));
    expect(outOperations).toContainEqual(expect.objectContaining({
      type: 'setShadowColor',
      value: 'rgba(255,255,255,0.46)',
    }));
    expect(edgeFadeGradient).toBeDefined();
    expect(outOperations).toContainEqual(expect.objectContaining({
      type: 'setAlpha',
      value: 0.46,
    }));
    expect(outOperations).toContainEqual(expect.objectContaining({
      type: 'gradientStop',
      kind: 'radial',
      offset: 0.52,
      color: 'rgba(0,0,0,0.9)',
    }));
  });

  it('renders text overlays into the fusion output', async () => {
    const makeCanvasRecord = (label: string) => {
      const operations: Array<Record<string, unknown>> = [];
      let currentAlpha = 1;
      let currentComposite = 'source-over';
      let currentFilter = 'none';
      let currentFont = '16px system-ui';
      const makeGradient = (kind: 'linear' | 'radial') => ({
        addColorStop: vi.fn((offset: number, color: string) => {
          operations.push({ type: 'gradientStop', kind, offset, color });
        }),
      });
      const ctx = {
        operations,
        save: vi.fn(() => operations.push({ type: 'save' })),
        restore: vi.fn(() => operations.push({ type: 'restore' })),
        drawImage: vi.fn((source: unknown, ...args: unknown[]) => operations.push({
          type: 'drawImage',
          source,
          args,
          alpha: currentAlpha,
          composite: currentComposite,
          filter: currentFilter,
        })),
        fillText: vi.fn((text: string, x: number, y: number) => operations.push({
          type: 'fillText',
          text,
          x,
          y,
          alpha: currentAlpha,
          composite: currentComposite,
          filter: currentFilter,
        })),
        createImageData: vi.fn((width: number, height: number) => ({
          data: new Uint8ClampedArray(width * height * 4),
        })),
        putImageData: vi.fn(),
        createLinearGradient: vi.fn((...args: number[]) => {
          operations.push({ type: 'createGradient', kind: 'linear', args });
          return makeGradient('linear');
        }),
        createRadialGradient: vi.fn((...args: number[]) => {
          operations.push({ type: 'createGradient', kind: 'radial', args });
          return makeGradient('radial');
        }),
        fillRect: vi.fn(() => operations.push({ type: 'fillRect', alpha: currentAlpha, composite: currentComposite })),
        measureText: vi.fn((text: string) => {
          const fontSizeMatch = currentFont.match(/(\d+)px/);
          const fontSize = fontSizeMatch ? Number(fontSizeMatch[1]) : 16;
          return {
            width: text.length * fontSize * 0.62,
          } as TextMetrics;
        }),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        arcTo: vi.fn(),
        closePath: vi.fn(),
        clip: vi.fn(),
        rect: vi.fn(),
        stroke: vi.fn(),
      } as unknown as CanvasRenderingContext2D & { operations: Array<Record<string, unknown>> };

      Object.defineProperties(ctx, {
        globalAlpha: {
          get: () => currentAlpha,
          set: (value: number) => {
            currentAlpha = value;
            operations.push({ type: 'setAlpha', value });
          },
        },
        globalCompositeOperation: {
          get: () => currentComposite,
          set: (value: string) => {
            currentComposite = value;
            operations.push({ type: 'setComposite', value });
          },
        },
        fillStyle: {
          get: () => undefined,
          set: (value: unknown) => operations.push({ type: 'setFillStyle', value }),
        },
        font: {
          get: () => currentFont,
          set: (value: string) => {
            currentFont = value;
            operations.push({ type: 'setFont', value });
          },
        },
        textAlign: {
          get: () => 'start',
          set: (value: CanvasTextAlign) => operations.push({ type: 'setTextAlign', value }),
        },
        textBaseline: {
          get: () => 'alphabetic',
          set: (value: CanvasTextBaseline) => operations.push({ type: 'setTextBaseline', value }),
        },
        filter: {
          get: () => currentFilter,
          set: (value: string) => {
            currentFilter = value;
            operations.push({ type: 'setFilter', value });
          },
        },
        strokeStyle: {
          get: () => undefined,
          set: (value: unknown) => operations.push({ type: 'setStrokeStyle', value }),
        },
        shadowBlur: {
          get: () => 0,
          set: (value: number) => operations.push({ type: 'setShadowBlur', value }),
        },
        shadowColor: {
          get: () => undefined,
          set: (value: string) => operations.push({ type: 'setShadowColor', value }),
        },
        lineWidth: {
          get: () => 0,
          set: (value: number) => operations.push({ type: 'setLineWidth', value }),
        },
        imageSmoothingEnabled: {
          get: () => true,
          set: () => undefined,
        },
        imageSmoothingQuality: {
          get: () => 'high',
          set: () => undefined,
        },
      });

      const canvas = {
        __label: label,
        width: 0,
        height: 0,
        getContext: vi.fn(() => ctx),
        toBlob: vi.fn((callback: BlobCallback) => callback(new Blob(['png'], { type: 'image/png' }))),
      } as unknown as HTMLCanvasElement & { __label?: string };

      return { label, canvas, operations };
    };

    const canvasRecords = ['design', 'noise', 'out'].map(makeCanvasRecord);
    canvasQueue = [...canvasRecords];

    const realCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation(((...args: Parameters<typeof document.createElement>) => {
      const [tagName] = args;
      if (tagName === 'canvas') {
        const nextCanvas = canvasQueue.shift();
        if (!nextCanvas) {
          throw new Error('unexpected_canvas_request');
        }
        return nextCanvas.canvas;
      }
      return realCreateElement(...args);
    }) as typeof document.createElement);

    const createImageBitmapMock = vi.fn()
      .mockResolvedValueOnce({ width: 1024, height: 1024, __label: 'base' } as ImageBitmap)
      .mockResolvedValueOnce({ width: 700, height: 900, __label: 'user' } as ImageBitmap);
    vi.stubGlobal('createImageBitmap', createImageBitmapMock);

    fetchMock.mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(new Blob(['base'], { type: 'image/png' })),
    } as Response);

    render(
      <FusionAI
        prompt="quantum aura portrait"
        onImageGenerated={onImageGenerated}
        baseImageUrl="http://example.com/base.png"
      />
    );
    fireEvent.click(screen.getByText('Advanced Fusion Extension'));
    fireEvent.click(screen.getByRole('button', { name: 'Manual phrase mode' }));
    fireEvent.change(screen.getByLabelText('Manual phrase'), {
      target: { value: 'Front Signal Cathedral Bloom Horizon' },
    });

    const file = new File(['portrait'], 'portrait.png', { type: 'image/png' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement | null;
    expect(fileInput).not.toBeNull();

    await waitFor(() => {
      fireEvent.change(fileInput as HTMLInputElement, { target: { files: [file] } });
    });

    fireEvent.click(screen.getByText(/Fuse 1 Image with Prompt/i));

    await waitFor(() => {
      expect(onImageGenerated).toHaveBeenCalledWith('data:image/png;base64,AAAA');
    });

    const outOperations = canvasRecords.find((record) => record.label === 'out')?.operations ?? [];
    const textOperations = outOperations.filter((operation) => operation.type === 'fillText');
    const printLeft = Math.round((1024 - Math.round(1024 * 0.64)) / 2);
    const printCenterX = printLeft + Math.round(1024 * 0.64) / 2;
    const printTop = Math.round(1024 * 0.16);
    const printBottom = printTop + Math.round(1024 * 0.64);

    expect(textOperations.length).toBeGreaterThan(1);
    expect(
      textOperations.every((operation) => Math.abs(Number(operation.x) - printCenterX) < 0.01),
    ).toBe(true);
    expect(
      textOperations.every((operation) => Number(operation.y) >= printTop && Number(operation.y) <= printBottom),
    ).toBe(true);
  });

  it('auto-saves the fused image to the signed-in account gallery', async () => {
    localStorage.setItem('user', JSON.stringify({
      id: 'user_123',
      email: 'artist@example.com',
      name: 'Fusion Artist',
    }));
    localStorage.setItem('device_id', 'device_123');

    const makeCanvasRecord = (label: string) => {
      const operations: Array<Record<string, unknown>> = [];
      let currentFont = '16px system-ui';
      const ctx = {
        save: vi.fn(),
        restore: vi.fn(),
        drawImage: vi.fn(),
        fillText: vi.fn(),
        createImageData: vi.fn((width: number, height: number) => ({
          data: new Uint8ClampedArray(width * height * 4),
        })),
        putImageData: vi.fn(),
        createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
        createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
        fillRect: vi.fn(),
        measureText: vi.fn((text: string) => {
          const fontSizeMatch = currentFont.match(/(\d+)px/);
          const fontSize = fontSizeMatch ? Number(fontSizeMatch[1]) : 16;
          return {
            width: text.length * fontSize * 0.62,
          } as TextMetrics;
        }),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        arcTo: vi.fn(),
        closePath: vi.fn(),
        clip: vi.fn(),
        rect: vi.fn(),
        stroke: vi.fn(),
      } as unknown as CanvasRenderingContext2D & { operations: Array<Record<string, unknown>> };

      Object.defineProperties(ctx, {
        globalAlpha: {
          get: () => 1,
          set: () => undefined,
        },
        globalCompositeOperation: {
          get: () => 'source-over',
          set: () => undefined,
        },
        fillStyle: {
          get: () => undefined,
          set: () => undefined,
        },
        font: {
          get: () => currentFont,
          set: (value: string) => {
            currentFont = value;
          },
        },
        textAlign: {
          get: () => 'start',
          set: () => undefined,
        },
        textBaseline: {
          get: () => 'alphabetic',
          set: () => undefined,
        },
        strokeStyle: {
          get: () => undefined,
          set: () => undefined,
        },
        lineWidth: {
          get: () => 0,
          set: () => undefined,
        },
        imageSmoothingEnabled: {
          get: () => true,
          set: () => undefined,
        },
        imageSmoothingQuality: {
          get: () => 'high',
          set: () => undefined,
        },
      });

      const canvas = {
        __label: label,
        width: 0,
        height: 0,
        getContext: vi.fn(() => ctx),
        toBlob: vi.fn((callback: BlobCallback) => callback(new Blob(['png'], { type: 'image/png' }))),
      } as unknown as HTMLCanvasElement & { __label?: string };

      return { label, canvas, operations };
    };

    const canvasRecords = ['design', 'noise', 'out'].map(makeCanvasRecord);
    canvasQueue = [...canvasRecords];

    const realCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation(((...args: Parameters<typeof document.createElement>) => {
      const [tagName] = args;
      if (tagName === 'canvas') {
        const nextCanvas = canvasQueue.shift();
        if (!nextCanvas) throw new Error('unexpected_canvas_request');
        return nextCanvas.canvas;
      }
      return realCreateElement(...args);
    }) as typeof document.createElement);

    const createImageBitmapMock = vi.fn()
      .mockResolvedValueOnce({ width: 1024, height: 1024, __label: 'base' } as ImageBitmap)
      .mockResolvedValueOnce({ width: 700, height: 900, __label: 'user' } as ImageBitmap);
    vi.stubGlobal('createImageBitmap', createImageBitmapMock);

    fetchMock.mockImplementation((input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : (input as Request).url;
      if (url.startsWith('/api/proxy-image')) {
        return Promise.resolve({
          ok: true,
          blob: () => Promise.resolve(new Blob(['base'], { type: 'image/png' })),
        } as Response);
      }
      if (url === '/api/gallery') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, item: { id: 'gallery_1' } }),
        } as Response);
      }
      return Promise.reject(new Error(`Unexpected fetch: ${url}`));
    });

    render(
      <FusionAI
        prompt="signed in fusion"
        onImageGenerated={onImageGenerated}
        baseImageUrl="http://example.com/base.png"
      />
    );
    fireEvent.click(screen.getByText('Advanced Fusion Extension'));

    const file = new File(['portrait'], 'portrait.png', { type: 'image/png' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement | null;
    expect(fileInput).not.toBeNull();

    await waitFor(() => {
      fireEvent.change(fileInput as HTMLInputElement, { target: { files: [file] } });
    });

    fireEvent.click(screen.getByText(/Fuse 1 Image with Prompt/i));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/gallery',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    const saveCall = fetchMock.mock.calls.find(([url]) => url === '/api/gallery');
    expect(saveCall).toBeDefined();
    const body = JSON.parse(String(saveCall?.[1]?.body));
    expect(body).toMatchObject({
      imageUrl: 'data:image/png;base64,AAAA',
      prompt: 'signed in fusion',
      userName: 'Fusion Artist',
      catalogName: "Fusion's Catalog",
      deviceId: 'device_123',
    });
  });
});
