import { useEffect, useMemo, useRef } from 'react';
import { useVellumReflow } from '../hooks/useVellumReflow';
import type { PretextAPI } from '../types/layout';
import { resolveTypographyConfig, type TypographyConfig } from '../types/typography';

export interface VellumLayoutEngineProps {
  content: string;
  typography: TypographyConfig;
  pretext?: PretextAPI;
  className?: string;
}

export function VellumLayoutEngine({
  content,
  typography,
  pretext,
  className,
}: VellumLayoutEngineProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  const { layout } = useVellumReflow({
    content,
    initialTypography: typography,
    pretext,
  });

  const resolvedTypography = useMemo(() => resolveTypographyConfig(typography), [typography]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !layout) {
      return;
    }

    const paint = (): void => {
      const context = canvas.getContext('2d');
      if (!context) {
        return;
      }

      const ratio = Math.max(1, window.devicePixelRatio || 1);
      const cssWidth = resolvedTypography.containerWidth;
      const cssHeight = Math.ceil(layout.height);

      canvas.style.width = `${cssWidth}px`;
      canvas.style.height = `${cssHeight}px`;
      canvas.width = Math.floor(cssWidth * ratio);
      canvas.height = Math.floor(cssHeight * ratio);

      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, cssWidth, cssHeight);
      context.fillStyle = '#111111';
      context.textBaseline = 'alphabetic';
      context.font = `${resolvedTypography.fontSize}px ${resolvedTypography.fontFamily}`;

      for (const line of layout.lines) {
        context.fillText(line.text, line.x, line.y);
      }
    };

    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = requestAnimationFrame(() => {
      paint();
      rafRef.current = null;
    });

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [layout, resolvedTypography]);

  return <canvas ref={canvasRef} className={className} aria-label="Vellum layout canvas" />;
}

