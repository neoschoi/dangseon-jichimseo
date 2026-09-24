import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Set worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

// Memory cache for rendered page data URLs
const highPageCache = new Map();
const thumbPageCache = new Map();

/**
 * Load a PDF document from File, ArrayBuffer, or URL string
 */
export async function loadPdfDocument(source) {
  let loadingTask;

  if (source instanceof File) {
    const arrayBuffer = await source.arrayBuffer();
    loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  } else if (source instanceof ArrayBuffer) {
    loadingTask = pdfjsLib.getDocument({ data: source });
  } else if (typeof source === 'string') {
    loadingTask = pdfjsLib.getDocument(source);
  } else {
    throw new Error('Unsupported PDF source type');
  }

  const pdfDoc = await loadingTask.promise;
  let title = 'PDF 문서';

  try {
    const meta = await pdfDoc.getMetadata();
    if (meta?.info?.Title) {
      title = meta.info.Title;
    } else if (source instanceof File) {
      title = source.name.replace(/\.[^/.]+$/, "");
    }
  } catch {
    if (source instanceof File) {
      title = source.name.replace(/\.[^/.]+$/, "");
    }
  }

  // Clear previous caches when loading a new document
  highPageCache.clear();
  thumbPageCache.clear();

  return {
    pdfDoc,
    numPages: pdfDoc.numPages,
    title
  };
}

/**
 * Render a specific page to a high-resolution data URL
 */
export async function renderPdfPage(pdfDoc, pageNum, scale = 2.0) {
  const cacheKey = `${pageNum}_${scale}`;
  if (highPageCache.has(cacheKey)) {
    return highPageCache.get(cacheKey);
  }

  const page = await pdfDoc.getPage(pageNum);
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  const context = canvas.getContext('2d');

  await page.render({
    canvasContext: context,
    viewport: viewport
  }).promise;

  const dataUrl = canvas.toDataURL('image/webp', 0.88);
  highPageCache.set(cacheKey, dataUrl);
  return dataUrl;
}

/**
 * Render a small thumbnail for the filmstrip
 */
export async function renderPdfThumb(pdfDoc, pageNum) {
  if (thumbPageCache.has(pageNum)) {
    return thumbPageCache.get(pageNum);
  }

  const page = await pdfDoc.getPage(pageNum);
  // Calculate scale so width is ~200px
  const baseViewport = page.getViewport({ scale: 1.0 });
  const scale = 200 / baseViewport.width;
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  const context = canvas.getContext('2d');

  await page.render({
    canvasContext: context,
    viewport: viewport
  }).promise;

  const dataUrl = canvas.toDataURL('image/webp', 0.7);
  thumbPageCache.set(pageNum, dataUrl);
  return dataUrl;
}

/**
 * Extract Outline / Bookmarks if present in the PDF
 */
export async function extractPdfOutline(pdfDoc) {
  try {
    const outline = await pdfDoc.getOutline();
    if (!outline || outline.length === 0) return [];

    const result = [];
    for (const item of outline) {
      let pageNum = 1;
      if (item.dest) {
        let dest = item.dest;
        if (typeof dest === 'string') {
          dest = await pdfDoc.getDestination(dest);
        }
        if (Array.isArray(dest) && dest[0]) {
          const pageRef = dest[0];
          const pageIndex = await pdfDoc.getPageIndex(pageRef);
          pageNum = pageIndex + 1;
        }
      }
      result.push({
        title: item.title,
        page: pageNum
      });
    }
    return result;
  } catch {
    return [];
  }
}
