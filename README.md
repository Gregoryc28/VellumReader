# VellumReader

Boilerplate for a canvas-first typography layout engine with React + TypeScript.

## Included

- `VellumLayoutEngine` React component for drawing laid out lines to canvas.
- `useVellumReflow` hook for reactive typography changes (slider-ready).
- `createPretextBridge` adapter that calls `prepare()` and `layout()` from a provided/global Pretext API.
- Native integration with `@chenglou/pretext` for `prepareWithSegments` + `layoutWithLines`.
- Retina/high-DPI canvas scaling in the render loop.

## Quick Start

```powershell
npm install
npm run typecheck
npm run build
```

## Core API

- `TypographyConfig`: `fontSize`, `lineHeight`, `containerWidth`, optional `letterSpacing`, `fontFamily`.
- `useVellumReflow({ content, initialTypography, pretext })`
- `<VellumLayoutEngine content typography pretext />`

## Notes

- The bridge uses `@chenglou/pretext` by default; pass a custom `{ prepare, layout }` only if you need to override behavior.
- A lightweight fallback layout remains as a runtime safety net for environments where Pretext cannot initialize.

