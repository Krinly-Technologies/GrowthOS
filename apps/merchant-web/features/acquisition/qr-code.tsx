'use client';

import { Button } from '@krinly/ui/components/button';
import { useMemo } from 'react';
import { encodeQr, qrPath } from './qr-encode';

const QUIET = 2;

/** A real, scannable QR code for `value`, drawn as one SVG path so it stays crisp at any size. */
export function QrCode({
  value,
  label,
  size = 160,
  className,
}: {
  value: string;
  /** What the code is for; becomes the image's accessible name. */
  label: string;
  size?: number;
  className?: string;
}) {
  const svg = useMemo(() => {
    try {
      const matrix = encodeQr(value);
      return { path: qrPath(matrix, QUIET), span: matrix.size + QUIET * 2 };
    } catch {
      return null;
    }
  }, [value]);

  if (!svg) {
    return (
      <p className={className} role="img" aria-label={`${label}: too long for a QR code`}>
        Too long for a QR code.
      </p>
    );
  }
  return (
    <svg
      role="img"
      aria-label={label}
      width={size}
      height={size}
      viewBox={`0 0 ${svg.span} ${svg.span}`}
      className={className}
      shapeRendering="crispEdges"
    >
      <rect width={svg.span} height={svg.span} fill="#ffffff" />
      <path d={svg.path} fill="#111c2d" />
    </svg>
  );
}

function qrSvgMarkup(value: string, pixels: number): string | null {
  try {
    const matrix = encodeQr(value);
    const span = matrix.size + QUIET * 2;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${pixels}" height="${pixels}" viewBox="0 0 ${span} ${span}" shape-rendering="crispEdges"><rect width="${span}" height="${span}" fill="#ffffff"/><path d="${qrPath(matrix, QUIET)}" fill="#111c2d"/></svg>`;
  } catch {
    return null;
  }
}

function download(href: string, filename: string): void {
  const link = document.createElement('a');
  link.href = href;
  link.download = filename;
  link.click();
}

/** Saves the code as a vector file (for print) or a PNG (for messaging apps). */
export function QrDownloads({
  value,
  filename,
  onDone,
}: {
  value: string;
  /** Without an extension. */
  filename: string;
  onDone?: (format: 'SVG' | 'PNG') => void;
}) {
  const saveSvg = () => {
    const markup = qrSvgMarkup(value, 1024);
    if (!markup) return;
    const url = URL.createObjectURL(new Blob([markup], { type: 'image/svg+xml' }));
    download(url, `${filename}.svg`);
    URL.revokeObjectURL(url);
    onDone?.('SVG');
  };

  const savePng = () => {
    let matrix;
    try {
      matrix = encodeQr(value);
    } catch {
      return;
    }
    const span = matrix.size + QUIET * 2;
    const scale = Math.max(4, Math.floor(1024 / span));
    const canvas = document.createElement('canvas');
    canvas.width = span * scale;
    canvas.height = span * scale;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#111c2d';
    for (let y = 0; y < matrix.size; y++) {
      const row = matrix.modules[y];
      if (!row) continue;
      for (let x = 0; x < matrix.size; x++) {
        if (row[x]) context.fillRect((x + QUIET) * scale, (y + QUIET) * scale, scale, scale);
      }
    }
    download(canvas.toDataURL('image/png'), `${filename}.png`);
    onDone?.('PNG');
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" shape="pill" onClick={savePng}>
        Download PNG
      </Button>
      <Button variant="outline" size="sm" shape="pill" onClick={saveSvg}>
        Download SVG
      </Button>
    </div>
  );
}
