import type { ResolvedTypographyConfig } from './typography';

export interface LayoutGlyph {
  char: string;
  x: number;
  y: number;
}

export interface LayoutLine {
  text: string;
  x: number;
  y: number;
  glyphs: LayoutGlyph[];
}

export interface LayoutResult {
  width: number;
  height: number;
  lines: LayoutLine[];
  typography: ResolvedTypographyConfig;
}

export interface PreparedBook {
  raw: string;
  words?: string[];
  native?: unknown;
  nativeFont?: string;
}

export interface PretextAPI {
  prepare: (raw: string) => PreparedBook;
  layout: (prepared: PreparedBook, typography: ResolvedTypographyConfig) => LayoutResult;
}

