export interface TypographyConfig {
  fontSize: number;
  lineHeight: number;
  containerWidth: number;
  letterSpacing?: number;
  fontFamily?: string;
}

export interface ResolvedTypographyConfig {
  fontSize: number;
  lineHeight: number;
  containerWidth: number;
  letterSpacing: number;
  fontFamily: string;
}

export const defaultTypographyConfig: ResolvedTypographyConfig = {
  fontSize: 18,
  lineHeight: 1.55,
  containerWidth: 680,
  letterSpacing: 0,
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Segoe UI", sans-serif',
};

export function resolveTypographyConfig(
  config: TypographyConfig,
): ResolvedTypographyConfig {
  return {
    ...defaultTypographyConfig,
    ...config,
  };
}

