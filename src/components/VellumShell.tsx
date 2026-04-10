import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { BookOpenText, FileUp, LoaderCircle, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { VellumLayoutEngine } from './VellumLayoutEngine';
import { useEpub } from '../hooks/useEpub';
import { useVellumReflow } from '../hooks/useVellumReflow';

const shellFont = {
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Segoe UI", sans-serif',
};

function isLikelyEpub(file: File): boolean {
  return file.type === 'application/epub+zip' || file.name.toLowerCase().endsWith('.epub');
}

export function VellumShell(): JSX.Element {
  const [isDragging, setIsDragging] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isContinuousScroll, setIsContinuousScroll] = useState(true);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { book, chapterText, currentChapterHref, isParsing, error, parseFile, loadChapter, reset } = useEpub();

  const { typography, bindRange, setTypography } = useVellumReflow({
    content: chapterText,
    initialTypography: {
      fontSize: 19,
      lineHeight: 1.62,
      containerWidth: 680,
    },
  });

  useEffect(() => {
    const updateContainerWidth = () => {
      const sidebarOffset = sidebarOpen ? 336 : 32;
      const gutter = 120;
      const width = Math.max(320, window.innerWidth - sidebarOffset - gutter);
      setTypography({ containerWidth: width });
    };

    updateContainerWidth();
    window.addEventListener('resize', updateContainerWidth);
    return () => {
      window.removeEventListener('resize', updateContainerWidth);
    };
  }, [setTypography, sidebarOpen]);

  const fontSizeSlider = bindRange('fontSize', 14, 34, 1);
  const lineHeightSlider = bindRange('lineHeight', 1.2, 2.1, 0.05);

  const onPickFile = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const selectedFile = event.target.files?.[0];
      if (!selectedFile || !isLikelyEpub(selectedFile)) {
        return;
      }

      await parseFile(selectedFile);
      event.target.value = '';
    },
    [parseFile],
  );

  const onDrop = useCallback(
    async (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragging(false);
      const droppedFile = event.dataTransfer.files?.[0];
      if (!droppedFile || !isLikelyEpub(droppedFile)) {
        return;
      }

      await parseFile(droppedFile);
    },
    [parseFile],
  );

  const emptyStateClassName = useMemo(
    () =>
      [
        'mx-auto flex w-full max-w-xl flex-col items-center justify-center rounded-3xl border border-white/25',
        'bg-black/35 px-8 py-14 text-center shadow-2xl shadow-black/30 backdrop-blur-xl transition-all duration-300',
        isDragging ? 'scale-[1.015] border-sky-300/80 bg-sky-500/20' : 'border-dashed',
      ].join(' '),
    [isDragging],
  );

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden bg-[#0b0b0d] text-white"
      style={shellFont}
      onDragOver={(event) => event.preventDefault()}
      onDragEnter={() => setIsDragging(true)}
      onDragLeave={() => setIsDragging(false)}
      onDrop={onDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".epub,application/epub+zip"
        className="hidden"
        onChange={onPickFile}
      />

      {!book && (
        <div className="flex min-h-screen items-center justify-center px-6">
          <button
            type="button"
            className={emptyStateClassName}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="mb-6 rounded-2xl border border-white/20 bg-white/10 p-4">
              <FileUp className="h-10 w-10 text-white/85" strokeWidth={1.6} />
            </div>
            <p className="text-2xl font-medium tracking-tight">Drop an EPUB to begin</p>
            <p className="mt-2 text-sm text-white/70">Canvas-first reading with typographic controls and buttery reflow.</p>
            <p className="mt-4 text-xs uppercase tracking-[0.2em] text-white/45">or click to upload</p>
          </button>
        </div>
      )}

      {book && (
        <div className="relative flex min-h-screen w-full">
          <aside
            className={[
              'absolute left-0 top-0 z-20 h-full border-r border-white/20 bg-black/40 backdrop-blur-xl transition-all duration-300 ease-out',
              sidebarOpen ? 'w-80 translate-x-0' : 'w-0 -translate-x-full overflow-hidden',
            ].join(' ')}
          >
            <div className="flex h-full flex-col">
              <div className="border-b border-white/15 px-5 py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-white/55">Now Reading</p>
                <h2 className="mt-2 text-lg font-medium leading-tight text-white">{book.metadata.title}</h2>
                <p className="mt-1 text-sm text-white/70">{book.metadata.author}</p>
              </div>
              <nav className="flex-1 overflow-y-auto px-3 py-3">
                {book.toc.map((item) => (
                  <button
                    key={item.href}
                    type="button"
                    className={[
                      'mb-1 w-full rounded-xl px-3 py-2 text-left text-sm transition-colors',
                      currentChapterHref === item.href ? 'bg-white/20 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white',
                    ].join(' ')}
                    onClick={() => {
                      void loadChapter(item.href);
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>
              <button
                type="button"
                className="m-3 rounded-xl border border-white/20 px-3 py-2 text-xs uppercase tracking-[0.18em] text-white/70 transition hover:bg-white/10"
                onClick={reset}
              >
                Unload Book
              </button>
            </div>
          </aside>

          <button
            type="button"
            className="absolute left-3 top-3 z-30 rounded-xl border border-white/20 bg-black/45 p-2 text-white/80 backdrop-blur-xl transition hover:text-white"
            onClick={() => setSidebarOpen((open) => !open)}
            aria-label={sidebarOpen ? 'Close table of contents' : 'Open table of contents'}
          >
            {sidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
          </button>

          <main
            className={[
              'relative flex min-h-screen w-full items-start justify-center overflow-auto px-6 pb-40 pt-10 transition-all duration-300',
              sidebarOpen ? 'pl-80' : 'pl-0',
            ].join(' ')}
          >
            {isParsing && (
              <div className="pointer-events-none absolute inset-x-0 top-8 z-20 mx-auto flex w-fit items-center gap-2 rounded-full border border-white/15 bg-black/50 px-4 py-2 text-xs text-white/80 backdrop-blur-xl">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Parsing chapter...
              </div>
            )}

            {chapterText ? (
              <VellumLayoutEngine content={chapterText} typography={typography} className="mx-auto" />
            ) : (
              <div className="mt-24 rounded-2xl border border-white/15 bg-white/5 px-6 py-5 text-sm text-white/65 backdrop-blur">
                <BookOpenText className="mb-2 h-5 w-5" />
                Choose a chapter from the sidebar to start reading.
              </div>
            )}
          </main>

          <section className="pointer-events-none fixed inset-x-0 bottom-6 z-30 flex justify-center px-4">
            <div className="pointer-events-auto w-full max-w-xl rounded-2xl border border-white/20 bg-black/45 px-5 py-4 backdrop-blur-xl">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.2em] text-white/60">Typography</p>
                <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-white/75">
                  <span>{isContinuousScroll ? 'Continuous' : 'Paged'}</span>
                  <button
                    type="button"
                    className={[
                      'relative h-6 w-11 rounded-full border transition',
                      isContinuousScroll ? 'border-emerald-300/80 bg-emerald-400/60' : 'border-white/20 bg-white/15',
                    ].join(' ')}
                    onClick={() => setIsContinuousScroll((value) => !value)}
                    aria-label="Toggle reading mode"
                  >
                    <span
                      className={[
                        'absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform',
                        isContinuousScroll ? 'translate-x-5' : 'translate-x-0.5',
                      ].join(' ')}
                    />
                  </button>
                </label>
              </div>

              <label className="mb-3 block text-xs text-white/75">
                Font Size: {fontSizeSlider.value}
                <input
                  type="range"
                  className="mt-1 w-full accent-white"
                  {...fontSizeSlider}
                  onChange={(event) => fontSizeSlider.onChange(Number(event.target.value))}
                />
              </label>

              <label className="block text-xs text-white/75">
                Line Height: {lineHeightSlider.value.toFixed(2)}
                <input
                  type="range"
                  className="mt-1 w-full accent-white"
                  {...lineHeightSlider}
                  onChange={(event) => lineHeightSlider.onChange(Number(event.target.value))}
                />
              </label>
            </div>
          </section>

          {error && (
            <div className="fixed inset-x-0 top-16 z-40 mx-auto w-fit rounded-xl border border-rose-300/45 bg-rose-900/35 px-4 py-2 text-sm text-rose-100 backdrop-blur-xl">
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}



