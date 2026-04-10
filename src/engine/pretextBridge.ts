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
  for (const word of prepared.words) {
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

function resolveGlobalPretext(): PretextAPI | null {
  const globalValue = globalThis as typeof globalThis & {
    Pretext?: Partial<PretextAPI>;
    pretext?: Partial<PretextAPI>;
  };

  const candidate = globalValue.Pretext ?? globalValue.pretext;
  if (!candidate?.prepare || !candidate?.layout) {
    return null;
  }

  return {
    prepare: candidate.prepare,
    layout: candidate.layout,
  } as PretextAPI;
}

export function createPretextBridge(pretext?: PretextAPI): PretextAPI {
  const api = pretext ?? resolveGlobalPretext();
  if (api) {
    return api;
  }

  return {
    prepare: fallbackPrepare,
    layout: fallbackLayout,
  };
}

