import * as pdfjsLib from 'pdfjs-dist';
// Use standard worker URL bundled by Vite
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
}

export interface PageRenderResult {
  width: number;
  height: number;
  scale: number;
  hasText: boolean;
  textCount: number;
  cancelled?: boolean;
  error?: string;
}

function getResourceUrls() {
  const origin = typeof window !== 'undefined' && window.location ? window.location.origin : '';
  const base = typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL ? import.meta.env.BASE_URL : '/';
  const prefix = origin + (base.endsWith('/') ? base : `${base}/`);
  return {
    cMapUrl: `${prefix}cmaps/`,
    standardFontDataUrl: `${prefix}standard_fonts/`,
  };
}

export async function loadPdfDocument(blob: Blob): Promise<pdfjsLib.PDFDocumentProxy> {
  const arrayBuffer = await blob.arrayBuffer();
  const { cMapUrl, standardFontDataUrl } = getResourceUrls();

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    cMapUrl,
    cMapPacked: true,
    standardFontDataUrl,
    enableXfa: true,
    isEvalSupported: true,
    useSystemFonts: true,
  });

  return await loadingTask.promise;
}

const activeRenderTasks = new Map<HTMLCanvasElement, pdfjsLib.RenderTask>();

export function cancelAllRenderTasks() {
  activeRenderTasks.forEach((task) => {
    try {
      task.cancel();
    } catch {
      // Ignore cancellation exceptions
    }
  });
  activeRenderTasks.clear();
}

/**
 * Renders a PDF page cleanly with off-screen double-buffering.
 * Prevents canvas clearing or flashing blank white screens during page navigation or rapid scrolling.
 */
export async function renderPdfPageComplete(
  pdfDoc: pdfjsLib.PDFDocumentProxy,
  pageNumber: number,
  canvas: HTMLCanvasElement,
  textLayerContainer: HTMLDivElement | null,
  targetWidth: number,
  _zoomScale = 1.0,
  userRotation = 0
): Promise<PageRenderResult> {
  // Cancel any previous render task targeted for this canvas
  const existingTask = activeRenderTasks.get(canvas);
  if (existingTask) {
    try {
      existingTask.cancel();
    } catch {
      // Ignore cancellation
    }
    activeRenderTasks.delete(canvas);
  }

  const page = await pdfDoc.getPage(pageNumber);

  const intrinsicRotation = typeof page.rotate === 'number' ? page.rotate : 0;
  const rotation = ((intrinsicRotation + (userRotation || 0)) % 360 + 360) % 360;

  const unscaledViewport = page.getViewport({ scale: 1.0, rotation });
  const safeTargetWidth = targetWidth > 0 ? targetWidth : (unscaledViewport.width || 600);
  const scale = safeTargetWidth / (unscaledViewport.width || 1);
  const viewport = page.getViewport({ scale, rotation });

  const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;
  const displayWidth = Math.max(1, Math.floor(viewport.width));
  const displayHeight = Math.max(1, Math.floor(viewport.height));
  const pixelWidth = Math.max(1, Math.floor(viewport.width * dpr));
  const pixelHeight = Math.max(1, Math.floor(viewport.height * dpr));

  // 1. Double-Buffering: Render to an off-screen canvas first
  // This guarantees the onscreen canvas is NEVER cleared prematurely or left blank if rendering is interrupted
  let offscreenCanvas: HTMLCanvasElement;
  if (typeof document !== 'undefined') {
    offscreenCanvas = document.createElement('canvas');
  } else {
    offscreenCanvas = canvas;
  }
  offscreenCanvas.width = pixelWidth;
  offscreenCanvas.height = pixelHeight;

  const offscreenCtx = offscreenCanvas.getContext('2d', { alpha: true });
  if (!offscreenCtx) {
    throw new Error('Could not get 2D canvas context for rendering');
  }

  offscreenCtx.clearRect(0, 0, pixelWidth, pixelHeight);

  const transform = dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : undefined;
  const renderContext = {
    canvasContext: offscreenCtx,
    viewport: viewport,
    transform: transform,
    background: 'rgba(0, 0, 0, 0)',
    intent: 'display',
  };

  const renderTask = page.render(renderContext);
  activeRenderTasks.set(canvas, renderTask);

  try {
    await renderTask.promise;
  } catch (err: any) {
    activeRenderTasks.delete(canvas);
    if (err?.name === 'RenderingCancelledException') {
      return {
        width: displayWidth,
        height: displayHeight,
        scale: viewport.scale,
        hasText: false,
        textCount: 0,
        cancelled: true,
      };
    }
    console.error(`Page ${pageNumber} render error:`, err);
    return {
      width: displayWidth,
      height: displayHeight,
      scale: viewport.scale,
      hasText: false,
      textCount: 0,
      error: err.message || 'Page render error',
    };
  } finally {
    activeRenderTasks.delete(canvas);
  }

  // 2. Atomic Swap: Copy completed off-screen rendering to visible canvas in 1 frame
  if (canvas !== offscreenCanvas) {
    if (canvas.width !== pixelWidth) canvas.width = pixelWidth;
    if (canvas.height !== pixelHeight) canvas.height = pixelHeight;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.backgroundColor = 'transparent';

    const onScreenCtx = canvas.getContext('2d', { alpha: true });
    if (onScreenCtx) {
      onScreenCtx.clearRect(0, 0, pixelWidth, pixelHeight);
      onScreenCtx.drawImage(offscreenCanvas, 0, 0);
    }
  }

  // 3. Render Selectable Text Layer
  let hasText = false;
  let textCount = 0;
  if (textLayerContainer) {
    textLayerContainer.innerHTML = '';
    textLayerContainer.style.width = '100%';
    textLayerContainer.style.height = '100%';

    try {
      const textContent = await page.getTextContent({
        includeMarkedContent: true,
      });
      textCount = textContent.items.length;
      hasText = textCount > 0;

      if (hasText) {
        const textLayer = new pdfjsLib.TextLayer({
          textContentSource: textContent,
          container: textLayerContainer,
          viewport: viewport,
        });
        await textLayer.render();
      }
    } catch (textErr) {
      console.warn(`Text layer extraction warning on page ${pageNumber}:`, textErr);
    }
  }

  return {
    width: displayWidth,
    height: displayHeight,
    scale: viewport.scale,
    hasText,
    textCount,
  };
}
