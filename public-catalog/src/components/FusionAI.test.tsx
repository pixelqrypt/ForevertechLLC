
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

  it('renders the trigger button and opens the modal', () => {
    render(<FusionAI prompt="test prompt" onImageGenerated={onImageGenerated} />);
    const triggerButton = screen.getByText('Advanced Fusion Extension');
    expect(triggerButton).toBeInTheDocument();
    fireEvent.click(triggerButton);
    expect(screen.getByText('Image Fusion Studio')).toBeInTheDocument();
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
  });
});
