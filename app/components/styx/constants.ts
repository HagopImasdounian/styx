export const STYX = {
  bone: '#EFEAE0',
  paper: '#F5F2EA',
  parchment: '#E8E1D2',
  ink: '#1A1815',
  graphite: '#2D2A24',
  silt: '#4A443B',
  silt2: '#6B6459',
  gold: '#B8924A',
  goldDeep: '#8A6A32',
  goldLight: '#D4B478',
  taupe: '#6B4423',
  taupeDeep: '#4A2E18',
  taupeLight: '#8B5E3C',
  line: 'rgba(26,24,21,0.12)',
  lineSoft: 'rgba(26,24,21,0.06)',
} as const;

export type CollectionNode = {
  id: string;
  title: string;
  handle: string;
  description?: string;
  image?: {
    url: string;
    altText?: string | null;
    width?: number | null;
    height?: number | null;
  } | null;
};

export const FONT = {
  cinzel: "'Cinzel', serif",
  cormorant: "'Cormorant Garamond', serif",
  inter: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
} as const;
