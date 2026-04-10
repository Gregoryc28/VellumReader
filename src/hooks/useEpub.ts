import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ePub from 'epubjs';
import type { EpubBook, EpubMetadata, EpubTocItem } from '../types/epub';
import type { EpubJsBook } from '../types/epubjs';

interface UseEpubResult {
  book: EpubBook | null;
  chapterText: string;
  currentChapterHref: string | null;
  isParsing: boolean;
  error: string | null;
  parseFile: (file: File) => Promise<void>;
  loadChapter: (href: string) => Promise<string>;
  reset: () => void;
}

function flattenToc(items: EpubTocItem[]): EpubTocItem[] {
  return items.flatMap((item) => {
    if (!item.children?.length) {
      return [item];
    }

    return [
      {
        href: item.href,
        label: item.label,
      },
      ...flattenToc(item.children),
    ];
  });
}

function normalizeMetadata(input: Partial<EpubMetadata> | null | undefined): EpubMetadata {
  return {
    title: input?.title?.trim() || 'Untitled Book',
    author: input?.author?.trim() || 'Unknown Author',
    coverUrl: input?.coverUrl,
  };
}

function normalizeToc(items: EpubTocItem[] | undefined): EpubTocItem[] {
  if (!items?.length) {
    return [];
  }

  return items
    .filter((item) => Boolean(item.href && item.label))
    .map((item) => ({
      href: item.href,
      label: item.label,
      children: normalizeToc(item.children),
    }));
}

export function useEpub(): UseEpubResult {
  const [book, setBook] = useState<EpubBook | null>(null);
  const [chapterText, setChapterText] = useState('');
  const [currentChapterHref, setCurrentChapterHref] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeBookRef = useRef<EpubJsBook | null>(null);
  const parseRequestRef = useRef(0);

  const destroyActiveBook = useCallback(() => {
    const activeBook = activeBookRef.current;
    if (!activeBook) {
      return;
    }

    if (typeof activeBook.destroy === 'function') {
      activeBook.destroy();
    }

    activeBookRef.current = null;
  }, []);

  const loadChapter = useCallback(async (href: string): Promise<string> => {
    const activeBook = activeBookRef.current;
    if (!activeBook) {
      throw new Error('No EPUB is loaded yet.');
    }

    setError(null);
    setIsParsing(true);

    try {
      const section = activeBook.section(href);
      if (!section) {
        throw new Error(`Chapter not found: ${href}`);
      }

      await section.load(activeBook.load.bind(activeBook));

      const rawText = section.document?.body?.textContent || '';
      const cleaned = rawText.replace(/\s+/g, ' ').trim();

      section.unload();

      setCurrentChapterHref(href);
      setChapterText(cleaned);
      return cleaned;
    } catch (chapterError) {
      const message = chapterError instanceof Error ? chapterError.message : 'Failed to load chapter text.';
      setError(message);
      throw chapterError;
    } finally {
      setIsParsing(false);
    }
  }, []);

  const parseFile = useCallback(
    async (file: File): Promise<void> => {
      const requestId = ++parseRequestRef.current;
      setError(null);
      setIsParsing(true);

      try {
        destroyActiveBook();

        const fileBuffer = await file.arrayBuffer();
        const epubBook = ePub(fileBuffer) as EpubJsBook;
        activeBookRef.current = epubBook;

        await epubBook.ready;

        const [metadataRaw, navigationRaw, coverUrl] = await Promise.all([
          epubBook.loaded.metadata,
          epubBook.loaded.navigation,
          epubBook.coverUrl?.(),
        ]);

        if (parseRequestRef.current !== requestId) {
          return;
        }

        const metadata = normalizeMetadata({
          title: metadataRaw?.title,
          author: metadataRaw?.creator,
          coverUrl: coverUrl || undefined,
        });

        const toc = normalizeToc(
          (navigationRaw?.toc || []).map((item) => ({
            href: item.href,
            label: item.label,
            children: (item.subitems || []).map((subitem) => ({
              href: subitem.href,
              label: subitem.label,
            })),
          })),
        );

        const parsedBook: EpubBook = {
          fileName: file.name,
          metadata,
          toc,
        };

        setBook(parsedBook);

        const firstChapter = flattenToc(toc)[0];
        if (firstChapter?.href) {
          await loadChapter(firstChapter.href);
        } else {
          setCurrentChapterHref(null);
          setChapterText('');
        }
      } catch (parseError) {
        const message = parseError instanceof Error ? parseError.message : 'Failed to parse EPUB file.';
        setError(message);
        setBook(null);
        setCurrentChapterHref(null);
        setChapterText('');
      } finally {
        if (parseRequestRef.current === requestId) {
          setIsParsing(false);
        }
      }
    },
    [destroyActiveBook, loadChapter],
  );

  const reset = useCallback(() => {
    parseRequestRef.current += 1;
    destroyActiveBook();
    setBook(null);
    setChapterText('');
    setCurrentChapterHref(null);
    setError(null);
    setIsParsing(false);
  }, [destroyActiveBook]);

  useEffect(() => {
    return () => {
      destroyActiveBook();
    };
  }, [destroyActiveBook]);

  return useMemo(
    () => ({
      book,
      chapterText,
      currentChapterHref,
      isParsing,
      error,
      parseFile,
      loadChapter,
      reset,
    }),
    [book, chapterText, currentChapterHref, error, isParsing, loadChapter, parseFile, reset],
  );
}

