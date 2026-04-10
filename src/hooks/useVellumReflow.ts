import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPretextBridge } from '../engine/pretextBridge';
import type { LayoutResult, PretextAPI } from '../types/layout';
import {
  defaultTypographyConfig,
  resolveTypographyConfig,
  type TypographyConfig,
} from '../types/typography';

interface UseVellumReflowOptions {
  content: string;
  initialTypography?: TypographyConfig;
  pretext?: PretextAPI;
}

interface SliderBinding {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}

export interface UseVellumReflowResult {
  typography: TypographyConfig;
  setTypography: (patch: Partial<TypographyConfig>) => void;
  bindRange: (
    key: keyof Pick<TypographyConfig, 'fontSize' | 'lineHeight' | 'containerWidth' | 'letterSpacing'>,
    min: number,
    max: number,
    step?: number,
  ) => SliderBinding;
  layout: LayoutResult | null;
  isReflowing: boolean;
}

export function useVellumReflow({
  content,
  initialTypography,
  pretext,
}: UseVellumReflowOptions): UseVellumReflowResult {
  const [typography, setTypographyState] = useState<TypographyConfig>({
    ...defaultTypographyConfig,
    ...initialTypography,
  });
  const [layout, setLayout] = useState<LayoutResult | null>(null);
  const [isReflowing, setIsReflowing] = useState(false);
  const rafRef = useRef<number | null>(null);

  const engine = useMemo(() => createPretextBridge(pretext), [pretext]);

  useEffect(() => {
    if (!initialTypography) {
      return;
    }

    setTypographyState((current) => ({
      ...current,
      ...initialTypography,
    }));
  }, [initialTypography]);

  const setTypography = useCallback((patch: Partial<TypographyConfig>) => {
    setTypographyState((current) => ({ ...current, ...patch }));
  }, []);

  const runReflow = useCallback(() => {
    const resolved = resolveTypographyConfig(typography);
    const prepared = engine.prepare(content);
    const nextLayout = engine.layout(prepared, resolved);
    setLayout(nextLayout);
    setIsReflowing(false);
  }, [content, engine, typography]);

  useEffect(() => {
    setIsReflowing(true);

    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = requestAnimationFrame(() => {
      runReflow();
      rafRef.current = null;
    });

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [runReflow]);

  const bindRange = useCallback(
    (
      key: keyof Pick<TypographyConfig, 'fontSize' | 'lineHeight' | 'containerWidth' | 'letterSpacing'>,
      min: number,
      max: number,
      step = 1,
    ): SliderBinding => ({
      value: typography[key] ?? 0,
      min,
      max,
      step,
      onChange: (value: number) => {
        setTypography({ [key]: value });
      },
    }),
    [setTypography, typography],
  );

  return {
    typography,
    setTypography,
    bindRange,
    layout,
    isReflowing,
  };
}


