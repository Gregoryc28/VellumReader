declare module 'epubjs' {
  export interface EpubJsMetadata {
    title?: string;
    creator?: string;
  }

  export interface EpubJsNavigationItem {
    href: string;
    label: string;
    subitems?: EpubJsNavigationItem[];
  }

  export interface EpubJsNavigation {
    toc: EpubJsNavigationItem[];
  }

  export interface EpubJsSection {
    document?: Document;
    load: (loader: (path: string) => Promise<unknown>) => Promise<void>;
    unload: () => void;
  }

  export interface EpubJsBook {
    ready: Promise<void>;
    loaded: {
      metadata: Promise<EpubJsMetadata>;
      navigation: Promise<EpubJsNavigation>;
    };
    coverUrl?: () => Promise<string | null>;
    section: (href: string) => EpubJsSection | null;
    load: (path: string) => Promise<unknown>;
    destroy?: () => void;
  }

  export default function ePub(input: ArrayBuffer | string): EpubJsBook;
}

export type { EpubJsBook } from 'epubjs';

