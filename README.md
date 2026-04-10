# VellumReader

Boilerplate for a canvas-first typography layout engine with React + TypeScript.

## Included

- `VellumLayoutEngine` React component for drawing laid out lines to canvas.
- `useVellumReflow` hook for reactive typography changes (slider-ready).
- `createPretextBridge` adapter that calls `prepare()` and `layout()` from a provided/global Pretext API.
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

- If no Pretext API is provided, a lightweight fallback layout is used for local development.
- Integrate real Pretext by passing a `{ prepare, layout }` implementation into both the hook/component.

