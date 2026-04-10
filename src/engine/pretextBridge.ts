import {
  layoutWithLines as pretextLayoutWithLines,
  prepareWithSegments as pretextPrepareWithSegments,
  type PreparedTextWithSegments,
} from '@chenglou/pretext';
import type { LayoutLine, LayoutResult, PretextAPI, PreparedBook } from '../types/layout';
import type { ResolvedTypographyConfig } from '../types/typography';

function fallbackPrepare(raw: string): PreparedBook {
  return {
    raw,
    words: raw.split(/\s+/).filter(Boolean),
  };
}

function fallbackLayout(
  prepared: PreparedBook,
  typography: ResolvedTypographyConfig,
): LayoutResult {
  const approxGlyphWidth = typography.fontSize * 0.55 + typography.letterSpacing;
  const maxCharsPerLine = Math.max(1, Math.floor(typography.containerWidth / approxGlyphWidth));
  const lines: LayoutLine[] = [];

  let current = '';
  for (const word of prepared.words ?? []) {
    const candidate = current.length === 0 ? word : `${current} ${word}`;
    if (candidate.length <= maxCharsPerLine) {
      current = candidate;
      continue;
    }

    lines.push(buildLine(current, lines.length, typography));
    current = word;
  }

  if (current.length > 0 || lines.length === 0) {
    lines.push(buildLine(current, lines.length, typography));
  }

  const rowHeight = typography.fontSize * typography.lineHeight;
  return {
    width: typography.containerWidth,
    height: Math.max(rowHeight, lines.length * rowHeight + typography.fontSize),
    lines,
    typography,
  };
}

function buildLine(text: string, rowIndex: number, typography: ResolvedTypographyConfig): LayoutLine {
  const baseline = typography.fontSize + rowIndex * typography.fontSize * typography.lineHeight;
  const glyphAdvance = typography.fontSize * 0.55 + typography.letterSpacing;

  return {
    text,
    x: 0,
    y: baseline,
    glyphs: Array.from(text).map((char, charIndex) => ({
      char,
      x: charIndex * glyphAdvance,
      y: baseline,
    })),
  };
}

function buildFont(typography: ResolvedTypographyConfig): string {
  return `${typography.fontSize}px ${typography.fontFamily}`;
}

function prepareWithPretext(raw: string, typography: ResolvedTypographyConfig): PreparedBook {
  const nativeFont = buildFont(typography);
  const native = pretextPrepareWithSegments(raw, nativeFont);
  return { raw, native, nativeFont };
}

function layoutWithPretext(
  prepared: PreparedBook,
  typography: ResolvedTypographyConfig,
): LayoutResult {
  const nativePrepared = prepared.native as PreparedTextWithSegments;
  const lineHeightPx = typography.fontSize * typography.lineHeight;
  const pretextResult = pretextLayoutWithLines(
    nativePrepared,
    typography.containerWidth,
    lineHeightPx,
  );

  const lines: LayoutLine[] = pretextResult.lines.map((line, rowIndex) => {
    const baseline = typography.fontSize + rowIndex * lineHeightPx;
    const glyphAdvance = line.text.length > 0 ? line.width / line.text.length : 0;
    return {
      text: line.text,
      x: 0,
      y: baseline,
      glyphs: Array.from(line.text).map((char, charIndex) => ({
        char,
        x: charIndex * glyphAdvance,
        y: baseline,
      })),
    };
  });

  return {
    width: typography.containerWidth,
    height: pretextResult.height,
    lines,
    typography,
  };
}

function createNativePretextBridge(typographyRef: { current: ResolvedTypographyConfig }): PretextAPI {
  return {
    prepare: (raw: string): PreparedBook => prepareWithPretext(raw, typographyRef.current),
    layout: (prepared: PreparedBook, typography: ResolvedTypographyConfig): LayoutResult => {
      typographyRef.current = typography;
      const expectedFont = buildFont(typography);
      if (!prepared.native || prepared.nativeFont !== expectedFont) {
        prepared = prepareWithPretext(prepared.raw, typography);
      }

      return layoutWithPretext(prepared, typography);
    },
  };
}

export function createPretextBridge(pretext?: PretextAPI): PretextAPI {
  if (pretext) {
    return pretext;
  }

  const typographyRef = {
    current: {
      fontSize: 18,
      lineHeight: 1.55,
      containerWidth: 680,
      letterSpacing: 0,
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Segoe UI", sans-serif',
    } as ResolvedTypographyConfig,
  };

  try {
    return createNativePretextBridge(typographyRef);
  } catch {
    // Fallback keeps local development working even if Pretext cannot initialize in a runtime.
  }

  return {
    prepare: fallbackPrepare,
    layout: fallbackLayout,
  };
}

