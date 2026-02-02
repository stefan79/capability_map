import { view } from '@forge/bridge';

import { loadAllData } from './data/loader/data-loader';
import { ViewManager } from './view-manager/view-manager';
import { CapabilityView } from './views/capability-view/capability-view';
import { View1 } from './views/view1/view1';
import { View2 } from './views/view2/view2';

// Data loading is centralized in data/loader/data-loader.ts

const MACRO_HEIGHT_PADDING = 48;
let resizeFrameId: number | undefined;
let forgeResizeDisabled = false;
let contentResizeObserver: ResizeObserver | undefined;
let forgeViewPromise: Promise<ForgeViewApi | null> | null = null;

type ForgeViewApi = typeof import('@forge/bridge')['view'];

const isRunningInIframe = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
};

const scheduleForgeResize = (): void => {
  if (forgeResizeDisabled || !isRunningInIframe()) return;
  if (typeof document === 'undefined') return;

  if (resizeFrameId !== undefined) {
    cancelAnimationFrame(resizeFrameId);
  }

  resizeFrameId = window.requestAnimationFrame(async () => {
    resizeFrameId = undefined;
    const doc = document.documentElement;
    const body = document.body;
    const contentHeight =
      Math.max(
        doc?.scrollHeight ?? 0,
        doc?.offsetHeight ?? 0,
        body?.scrollHeight ?? 0,
        body?.offsetHeight ?? 0
      ) + MACRO_HEIGHT_PADDING;

    if (contentHeight <= 0) return;

    try {
      const forgeView = await loadForgeView();
      if (!forgeView) return;
      await forgeView.resize(contentHeight);
    } catch (error) {
      forgeResizeDisabled = true;
      console.warn('Forge auto-resize unavailable; skipping further resize attempts.', error);
    }
  });
};

const initializeForgeResize = (): void => {
  if (!isRunningInIframe()) return;

  void loadForgeView();
  window.addEventListener('resize', scheduleForgeResize);

  if (typeof ResizeObserver !== 'undefined') {
    const content = document.getElementById('content');
    if (content) {
      contentResizeObserver?.disconnect();
      contentResizeObserver = new ResizeObserver(() => scheduleForgeResize());
      contentResizeObserver.observe(content);
    }
  }

  scheduleForgeResize();
};

const loadForgeView = async (): Promise<ForgeViewApi | null> => {
  if (forgeResizeDisabled || !isRunningInIframe()) return null;

  if (!forgeViewPromise) {
    forgeViewPromise = import('@forge/bridge')
      .then((mod) => mod.view)
      .catch((error) => {
        forgeResizeDisabled = true;
        console.warn('Forge bridge is unavailable; falling back to fixed macro height.', error);
        return null;
      });
  }

  return forgeViewPromise;
};

/**
 * Initializes the application after all data has been loaded.
 */
async function main(): Promise<void> {
  const globalData = await loadAllData();
  const viewManager = new ViewManager('content');

  // Register views
  viewManager.registerView('view1', new View1('content'));
  viewManager.registerView('view2', new View2('content'));
  viewManager.registerView('capability-view', new CapabilityView('content'));

  // Set up navigation
  document.getElementById('view1-btn')?.addEventListener('click', (): void => {
    viewManager.switchView('view1', globalData);
    scheduleForgeResize();
  });

  document.getElementById('view2-btn')?.addEventListener('click', (): void => {
    viewManager.switchView('view2', globalData);
    scheduleForgeResize();
  });

  document.getElementById('capability-view-btn')?.addEventListener('click', (): void => {
    viewManager.switchView('capability-view', globalData);
    scheduleForgeResize();
  });

  // Download current SVG
  document.getElementById('download-svg-btn')?.addEventListener('click', async (): Promise<void> => {
    const content = document.getElementById('content');
    if (!content) return;
    const svg = content.querySelector('svg');
    if (!svg) {
      console.warn('No SVG found to download.');
      return;
    }
    // Clone to ensure xmlns attributes are present and allow safe mutations
    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
    // Ensure viewBox is present for correct sizing in external viewers
    const widthAttr = clone.getAttribute('width') || (svg as SVGSVGElement).getAttribute('width') || '1600';
    const heightAttr = clone.getAttribute('height') || (svg as SVGSVGElement).getAttribute('height') || '1200';
    const wNum = parseFloat(widthAttr.toString());
    const hNum = parseFloat(heightAttr.toString());
    if (!clone.getAttribute('viewBox') && !Number.isNaN(wNum) && !Number.isNaN(hNum)) {
      clone.setAttribute('viewBox', `0 0 ${wNum} ${hNum}`);
    }
    // As a fallback, set a white background style at the root
    const existingStyle = clone.getAttribute('style') || '';
    if (!/background/i.test(existingStyle)) {
      clone.setAttribute('style', `${existingStyle}; background:#ffffff;`.trim());
    }
    // Ensure a white background so external viewers don't show black/transparent
    try {
      const ns = 'http://www.w3.org/2000/svg';
      const bg = document.createElementNS(ns, 'rect');
      bg.setAttribute('x', '0');
      bg.setAttribute('y', '0');
      // Use numeric width/height (fallback to viewBox) to avoid % issues in some viewers
      const vb = clone.getAttribute('viewBox');
      if (vb) {
        const parts = vb.split(/\s+/).map(Number);
        const vbW = parts[2] || wNum || 1600;
        const vbH = parts[3] || hNum || 1200;
        bg.setAttribute('width', String(vbW));
        bg.setAttribute('height', String(vbH));
      } else {
        bg.setAttribute('width', String(wNum || 1600));
        bg.setAttribute('height', String(hNum || 1200));
      }
      bg.setAttribute('fill', '#ffffff');
      // Insert as the first element so it sits behind everything
      const first = clone.firstChild;
      if (first) {
        clone.insertBefore(bg, first);
      } else {
        clone.appendChild(bg);
      }
    } catch (e) {
      console.warn('Failed to inject SVG background rect', e);
    }

    // Inline critical computed styles so external viewers don't rely on external CSS
    try {
      const srcNodes = svg.querySelectorAll('*');
      const dstNodes = clone.querySelectorAll('*');
      const n = Math.min(srcNodes.length, dstNodes.length);
      for (let i = 0; i < n; i++) {
        const srcEl = srcNodes[i] as Element;
        const dstEl = dstNodes[i] as Element;
        const cs = window.getComputedStyle(srcEl as Element);
        // Fill and stroke
        const fill = cs.fill;
        if (fill && !dstEl.hasAttribute('fill')) dstEl.setAttribute('fill', fill);
        const fillOpacity = cs.fillOpacity;
        if (fillOpacity && !dstEl.hasAttribute('fill-opacity')) dstEl.setAttribute('fill-opacity', fillOpacity);
        const stroke = cs.stroke;
        if (stroke && !dstEl.hasAttribute('stroke')) dstEl.setAttribute('stroke', stroke);
        const strokeWidth = cs.strokeWidth;
        if (strokeWidth && !dstEl.hasAttribute('stroke-width')) dstEl.setAttribute('stroke-width', strokeWidth);
        const strokeOpacity = cs.strokeOpacity;
        if (strokeOpacity && !dstEl.hasAttribute('stroke-opacity')) dstEl.setAttribute('stroke-opacity', strokeOpacity);
        const opacity = cs.opacity;
        if (opacity && !dstEl.hasAttribute('opacity')) dstEl.setAttribute('opacity', opacity);
        // Fonts/colors for text
        const fontFamily = cs.fontFamily;
        if (fontFamily && !dstEl.hasAttribute('font-family')) dstEl.setAttribute('font-family', fontFamily);
        const fontSize = cs.fontSize;
        if (fontSize && !dstEl.hasAttribute('font-size')) dstEl.setAttribute('font-size', fontSize);
        const textFill = cs.color;
        if (dstEl.tagName.toLowerCase() === 'text' && textFill) {
          dstEl.setAttribute('fill', textFill);
        }
      }
    } catch (e) {
      console.warn('Failed to inline SVG styles', e);
    }

    // Explicitly set fills/strokes for known rects to avoid black boxes in some viewers
    try {
      // Cluster borders should be transparent fill with blue stroke
      clone.querySelectorAll('rect.treemap-cluster').forEach((r) => {
        // Ensure a white interior per cluster by inserting a backdrop rect just before the border
        try {
          const parent = r.parentNode as SVGGElement | null;
          if (parent) {
            const ns = 'http://www.w3.org/2000/svg';
            const bg = document.createElementNS(ns, 'rect');
            // Mirror geometry
            const x = (r as SVGRectElement).getAttribute('x') || '0';
            const y = (r as SVGRectElement).getAttribute('y') || '0';
            const w = (r as SVGRectElement).getAttribute('width') || '0';
            const h = (r as SVGRectElement).getAttribute('height') || '0';
            const rx = (r as SVGRectElement).getAttribute('rx') || undefined;
            const ry = (r as SVGRectElement).getAttribute('ry') || undefined;
            bg.setAttribute('x', x);
            bg.setAttribute('y', y);
            bg.setAttribute('width', w);
            bg.setAttribute('height', h);
            if (rx) bg.setAttribute('rx', rx);
            if (ry) bg.setAttribute('ry', ry);
            bg.setAttribute('fill', '#ffffff');
            bg.setAttribute('stroke', 'none');
            // Insert backdrop before the border rect
            parent.insertBefore(bg, r);
          }
        } catch {}
        (r as SVGRectElement).setAttribute('fill', 'none');
        (r as SVGRectElement).setAttribute('stroke', '#003057');
        (r as SVGRectElement).setAttribute('stroke-width', '2');
        (r as SVGRectElement).setAttribute('shape-rendering', 'crispEdges');
      });
      // Capability tiles should be light gray fill with silver stroke
      clone.querySelectorAll('rect.main-rect').forEach((r) => {
        const rect = r as SVGRectElement;
        if (!rect.getAttribute('fill')) {
          rect.setAttribute('fill', '#F9F9F9');
        }
        if (!rect.getAttribute('stroke')) {
          rect.setAttribute('stroke', '#C8C9C7');
        }
        rect.setAttribute('stroke-width', rect.getAttribute('stroke-width') || '1');
        rect.setAttribute('shape-rendering', 'crispEdges');
      });
      // Ensure cluster titles keep their intended style (blue, bold)
      clone.querySelectorAll('.treemap-cluster-group > text').forEach((t) => {
        (t as SVGTextElement).setAttribute('fill', '#003057');
        (t as SVGTextElement).setAttribute('font-weight', '700');
        // default ~1em, keep existing size if present
        if (!(t as SVGTextElement).getAttribute('font-size')) {
          (t as SVGTextElement).setAttribute('font-size', '16px');
        }
      });
      // Guard: make sure no <g> accidentally carries a black fill
      clone.querySelectorAll('g.treemap-cluster-group').forEach((g) => {
        (g as SVGGElement).setAttribute('fill', 'none');
      });
      // Preserve maturity bar segment colors and remove any stroke
      clone.querySelectorAll('.maturity-bar rect').forEach((r) => {
        const el = r as SVGRectElement;
        const currentFill = el.getAttribute('fill');
        if (currentFill) el.setAttribute('fill', currentFill);
        el.setAttribute('stroke', 'none');
      });
    } catch (e) {
      console.warn('Failed to enforce rect styles for export', e);
    }

    // Inject clickable links for documented capabilities so exported SVG retains hyperlinks
    const applyDocumentationLinks = (root: SVGSVGElement): void => {
      const ns = 'http://www.w3.org/2000/svg';
      const xlinkNs = 'http://www.w3.org/1999/xlink';
      const groups = Array.from(root.querySelectorAll('g.treemap-capability[data-doc-url]')) as SVGGElement[];
      groups.forEach((group) => {
        const url = group.getAttribute('data-doc-url');
        if (!url) return;
        const anchor = document.createElementNS(ns, 'a');
        anchor.setAttribute('class', 'svg-doc-link');
        anchor.setAttribute('target', '_blank');
        anchor.setAttribute('rel', 'noopener noreferrer');
        anchor.setAttribute('href', url);
        anchor.setAttributeNS(xlinkNs, 'href', url);
        while (group.firstChild) {
          anchor.appendChild(group.firstChild);
        }
        group.appendChild(anchor);
      });
    };

    applyDocumentationLinks(clone);

    // Inline external images (<image href=...>) as data URIs so converters don't need network
    async function inlineExternalImages(root: SVGSVGElement): Promise<void> {
      const images = Array.from(root.querySelectorAll('image')) as SVGImageElement[];
      await Promise.all(images.map(async (img) => {
        const href = img.getAttribute('href') || img.getAttributeNS('http://www.w3.org/1999/xlink', 'href');
        if (!href) return;
        // Skip if already data URI
        if (href.startsWith('data:')) return;
        try {
          const res = await fetch(href, { mode: 'cors' });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('image/svg')) {
            const text = await res.text();
            // Data URL for inline SVG
            const encoded = encodeURIComponent(text)
              .replace(/%20/g, ' ');
            const dataUrl = `data:image/svg+xml;charset=utf-8,${encoded}`;
            img.setAttribute('href', dataUrl);
            img.setAttributeNS('http://www.w3.org/1999/xlink', 'href', dataUrl);
          } else {
            const blob = await res.blob();
            const reader = new FileReader();
            const dataUrl: string = await new Promise((resolve, reject) => {
              reader.onload = () => resolve(String(reader.result));
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });
            img.setAttribute('href', dataUrl);
            img.setAttributeNS('http://www.w3.org/1999/xlink', 'href', dataUrl);
          }
        } catch (err) {
          console.warn('Failed to inline image', href, err);
        }
      }));
    }

    await inlineExternalImages(clone);

    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(clone);
    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'capabilities.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  // Set initial view
  viewManager.switchView('capability-view', globalData);
  scheduleForgeResize();
}

// Start the application once the DOM is fully loaded.
document.addEventListener('DOMContentLoaded', (): void => {
  initializeForgeResize();
  main().catch((err) => {
    // Ensure unhandled rejections in the async init do not get swallowed
    // and keep the event listener return type as void.
    console.error('Failed to initialize application:', err);
  });
});
