export interface EpubMetadata {
  title: string;
  author: string;
  coverUrl?: string;
}

export interface EpubTocItem {
  href: string;
  label: string;
  children?: EpubTocItem[];
}

export interface EpubBook {
  fileName: string;
  metadata: EpubMetadata;
  toc: EpubTocItem[];
}

