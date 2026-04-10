import { useMemo, type ChangeEvent } from 'react';
import { VellumLayoutEngine } from './components/VellumLayoutEngine';
import { useVellumReflow } from './hooks/useVellumReflow';

const sample = `VellumReader is tuned for elastic typography. Slide controls to resize text and reflow instantly.`;

export function DemoHarness(): JSX.Element {
  const { typography, bindRange } = useVellumReflow({
    content: sample,
    initialTypography: {
      fontSize: 18,
      lineHeight: 1.55,
      containerWidth: 640,
    },
  });

  const size = bindRange('fontSize', 14, 30, 1);
  const leading = bindRange('lineHeight', 1.2, 2, 0.05);

  const onFontSizeChange = (event: ChangeEvent<HTMLInputElement>) => {
    size.onChange(Number(event.target.value));
  };

  const onLineHeightChange = (event: ChangeEvent<HTMLInputElement>) => {
    leading.onChange(Number(event.target.value));
  };

  const controlStyle = useMemo(() => ({ width: 260 }), []);

  return (
    <div>
      <div style={controlStyle}>
        <label htmlFor="font-size">Font Size: {typography.fontSize}</label>
        <input id="font-size" type="range" {...size} onChange={onFontSizeChange} />
      </div>

      <div style={controlStyle}>
        <label htmlFor="line-height">Line Height: {typography.lineHeight.toFixed(2)}</label>
        <input id="line-height" type="range" {...leading} onChange={onLineHeightChange} />
      </div>

      <VellumLayoutEngine content={sample} typography={typography} />
    </div>
  );
}


