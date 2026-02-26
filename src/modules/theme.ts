export interface ThemeColors {
  bgBase: string;
  bgSurface: string;
  bgElevated: string;
  bgInset: string;
  bgGraph: string;
  bgWaveform: string;
  border: string;
  borderStrong: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textFaint: string;
  accent: string;
  accentHover: string;
  accentRgb: string;
  signal: string;
  signalRgb: string;
  grid: string;
  gridLabel: string;
  knobTrack: string;
  pianoWhite: string;
  pianoBlack: string;
}

export interface ThemeDefinition {
  id: string;
  name: string;
  colors: ThemeColors;
}

const midnight: ThemeDefinition = {
  id: 'midnight',
  name: 'Midnight',
  colors: {
    bgBase: '#111114',
    bgSurface: '#1a1a1f',
    bgElevated: '#1e1e26',
    bgInset: '#141417',
    bgGraph: '#0a1628',
    bgWaveform: '#0f3460',
    border: '#2a2a30',
    borderStrong: '#3a3a44',
    textPrimary: '#c8ccd0',
    textSecondary: '#5a5a65',
    textMuted: '#555',
    textFaint: '#444',
    accent: '#00d2ff',
    accentHover: '#33ddff',
    accentRgb: '0, 210, 255',
    signal: '#e94560',
    signalRgb: '233, 69, 96',
    grid: '#152040',
    gridLabel: '#445',
    knobTrack: '#2a2a34',
    pianoWhite: '#f0f0f0',
    pianoBlack: '#222',
  },
};

const daylight: ThemeDefinition = {
  id: 'daylight',
  name: 'Daylight',
  colors: {
    bgBase: '#e8e8ec',
    bgSurface: '#f2f2f5',
    bgElevated: '#ffffff',
    bgInset: '#dcdce0',
    bgGraph: '#d0d8e8',
    bgWaveform: '#b0c4de',
    border: '#c0c0c8',
    borderStrong: '#a0a0aa',
    textPrimary: '#1a1a2e',
    textSecondary: '#555566',
    textMuted: '#777788',
    textFaint: '#999aaa',
    accent: '#0090b8',
    accentHover: '#00aad8',
    accentRgb: '0, 144, 184',
    signal: '#d03050',
    signalRgb: '208, 48, 80',
    grid: '#bcc4d8',
    gridLabel: '#6670880',
    knobTrack: '#c8c8d0',
    pianoWhite: '#ffffff',
    pianoBlack: '#2a2a35',
  },
};

const neonNoir: ThemeDefinition = {
  id: 'neon-noir',
  name: 'Neon Noir',
  colors: {
    bgBase: '#09090c',
    bgSurface: '#101015',
    bgElevated: '#16161e',
    bgInset: '#0c0c10',
    bgGraph: '#080818',
    bgWaveform: '#180828',
    border: '#222230',
    borderStrong: '#333344',
    textPrimary: '#d0d0e0',
    textSecondary: '#5a5a70',
    textMuted: '#4a4a5a',
    textFaint: '#383848',
    accent: '#ff2eaa',
    accentHover: '#ff5ec0',
    accentRgb: '255, 46, 170',
    signal: '#00e8ff',
    signalRgb: '0, 232, 255',
    grid: '#141428',
    gridLabel: '#334',
    knobTrack: '#222234',
    pianoWhite: '#e8e8f0',
    pianoBlack: '#1a1a24',
  },
};

const amberTerminal: ThemeDefinition = {
  id: 'amber-terminal',
  name: 'Amber Terminal',
  colors: {
    bgBase: '#0e0c08',
    bgSurface: '#161410',
    bgElevated: '#1c1a14',
    bgInset: '#12100c',
    bgGraph: '#141008',
    bgWaveform: '#2a1e08',
    border: '#2a2618',
    borderStrong: '#3a3428',
    textPrimary: '#d4c8a0',
    textSecondary: '#6a6248',
    textMuted: '#5a5240',
    textFaint: '#443e30',
    accent: '#ffaa20',
    accentHover: '#ffbb44',
    accentRgb: '255, 170, 32',
    signal: '#ff6020',
    signalRgb: '255, 96, 32',
    grid: '#1e1a0e',
    gridLabel: '#544',
    knobTrack: '#2a2618',
    pianoWhite: '#e8dcc0',
    pianoBlack: '#1a1810',
  },
};

const arctic: ThemeDefinition = {
  id: 'arctic',
  name: 'Arctic',
  colors: {
    bgBase: '#0c1018',
    bgSurface: '#121822',
    bgElevated: '#182030',
    bgInset: '#0e1420',
    bgGraph: '#0a1020',
    bgWaveform: '#102040',
    border: '#1e2a3a',
    borderStrong: '#2a3a4e',
    textPrimary: '#b0c8e0',
    textSecondary: '#506880',
    textMuted: '#405060',
    textFaint: '#304050',
    accent: '#44aaff',
    accentHover: '#66bbff',
    accentRgb: '68, 170, 255',
    signal: '#ff5588',
    signalRgb: '255, 85, 136',
    grid: '#142030',
    gridLabel: '#3a5060',
    knobTrack: '#1e2a3a',
    pianoWhite: '#d0dce8',
    pianoBlack: '#141c28',
  },
};

const forestCanopy: ThemeDefinition = {
  id: 'forest-canopy',
  name: 'Forest Canopy',
  colors: {
    bgBase: '#0b1410',
    bgSurface: '#101d17',
    bgElevated: '#15251d',
    bgInset: '#0d1712',
    bgGraph: '#0a1a14',
    bgWaveform: '#103124',
    border: '#1f3329',
    borderStrong: '#2a4739',
    textPrimary: '#c8decf',
    textSecondary: '#6a8a76',
    textMuted: '#567060',
    textFaint: '#425447',
    accent: '#4dd08a',
    accentHover: '#6be1a0',
    accentRgb: '77, 208, 138',
    signal: '#f2b84b',
    signalRgb: '242, 184, 75',
    grid: '#163024',
    gridLabel: '#4f6c59',
    knobTrack: '#1c2f26',
    pianoWhite: '#dce8df',
    pianoBlack: '#152019',
  },
};

const oceanDepth: ThemeDefinition = {
  id: 'ocean-depth',
  name: 'Ocean Depth',
  colors: {
    bgBase: '#070f18',
    bgSurface: '#0d1825',
    bgElevated: '#122235',
    bgInset: '#0a1420',
    bgGraph: '#09162a',
    bgWaveform: '#0a2846',
    border: '#1a2d44',
    borderStrong: '#264161',
    textPrimary: '#c5d8f0',
    textSecondary: '#617da0',
    textMuted: '#4f6784',
    textFaint: '#3d5068',
    accent: '#2fc6ff',
    accentHover: '#58d5ff',
    accentRgb: '47, 198, 255',
    signal: '#ff8a48',
    signalRgb: '255, 138, 72',
    grid: '#12314f',
    gridLabel: '#4f6a85',
    knobTrack: '#1a2b40',
    pianoWhite: '#d8e3ef',
    pianoBlack: '#162332',
  },
};

const roseGold: ThemeDefinition = {
  id: 'rose-gold',
  name: 'Rose Gold',
  colors: {
    bgBase: '#1a1216',
    bgSurface: '#241920',
    bgElevated: '#2d1f28',
    bgInset: '#1e151b',
    bgGraph: '#211923',
    bgWaveform: '#322135',
    border: '#4a303f',
    borderStrong: '#654455',
    textPrimary: '#f1d8df',
    textSecondary: '#b18a97',
    textMuted: '#936f7d',
    textFaint: '#775764',
    accent: '#ff9eb3',
    accentHover: '#ffb4c4',
    accentRgb: '255, 158, 179',
    signal: '#ffd166',
    signalRgb: '255, 209, 102',
    grid: '#3b2a35',
    gridLabel: '#8f6f7c',
    knobTrack: '#412b36',
    pianoWhite: '#f3e4e8',
    pianoBlack: '#2b1f26',
  },
};

const desertDusk: ThemeDefinition = {
  id: 'desert-dusk',
  name: 'Desert Dusk',
  colors: {
    bgBase: '#1b120d',
    bgSurface: '#261a13',
    bgElevated: '#332219',
    bgInset: '#20150f',
    bgGraph: '#281b14',
    bgWaveform: '#3d291a',
    border: '#4b3324',
    borderStrong: '#664731',
    textPrimary: '#f0dac0',
    textSecondary: '#b38d6e',
    textMuted: '#957257',
    textFaint: '#7a5c45',
    accent: '#ff9f43',
    accentHover: '#ffb36b',
    accentRgb: '255, 159, 67',
    signal: '#ffd56a',
    signalRgb: '255, 213, 106',
    grid: '#3a281d',
    gridLabel: '#8d715a',
    knobTrack: '#412c1f',
    pianoWhite: '#efdfcf',
    pianoBlack: '#2b1f17',
  },
};

const cyberMint: ThemeDefinition = {
  id: 'cyber-mint',
  name: 'Cyber Mint',
  colors: {
    bgBase: '#09110f',
    bgSurface: '#0f1c19',
    bgElevated: '#142822',
    bgInset: '#0b1512',
    bgGraph: '#0b1718',
    bgWaveform: '#0d2d2f',
    border: '#1f3b37',
    borderStrong: '#2c544f',
    textPrimary: '#c8f3eb',
    textSecondary: '#6ea69a',
    textMuted: '#5a8b81',
    textFaint: '#476e67',
    accent: '#2df5c8',
    accentHover: '#63f9d7',
    accentRgb: '45, 245, 200',
    signal: '#35b6ff',
    signalRgb: '53, 182, 255',
    grid: '#1a3335',
    gridLabel: '#5c8a8a',
    knobTrack: '#1e3834',
    pianoWhite: '#daf3ed',
    pianoBlack: '#162623',
  },
};

const monochromeStudio: ThemeDefinition = {
  id: 'monochrome-studio',
  name: 'Monochrome Studio',
  colors: {
    bgBase: '#101010',
    bgSurface: '#161616',
    bgElevated: '#1d1d1d',
    bgInset: '#131313',
    bgGraph: '#151515',
    bgWaveform: '#1f1f1f',
    border: '#2f2f2f',
    borderStrong: '#444444',
    textPrimary: '#ececec',
    textSecondary: '#a0a0a0',
    textMuted: '#818181',
    textFaint: '#666666',
    accent: '#f2f2f2',
    accentHover: '#ffffff',
    accentRgb: '242, 242, 242',
    signal: '#9ad0ff',
    signalRgb: '154, 208, 255',
    grid: '#2a2a2a',
    gridLabel: '#7b7b7b',
    knobTrack: '#323232',
    pianoWhite: '#f8f8f8',
    pianoBlack: '#1b1b1b',
  },
};

const lavaForge: ThemeDefinition = {
  id: 'lava-forge',
  name: 'Lava Forge',
  colors: {
    bgBase: '#110907',
    bgSurface: '#1a0f0c',
    bgElevated: '#251410',
    bgInset: '#140b09',
    bgGraph: '#1b0f0c',
    bgWaveform: '#2d140f',
    border: '#3e2219',
    borderStrong: '#5a3022',
    textPrimary: '#f0d2c8',
    textSecondary: '#b18474',
    textMuted: '#936a5d',
    textFaint: '#775347',
    accent: '#ff5b2e',
    accentHover: '#ff7a55',
    accentRgb: '255, 91, 46',
    signal: '#ffb347',
    signalRgb: '255, 179, 71',
    grid: '#311910',
    gridLabel: '#8c6557',
    knobTrack: '#381e16',
    pianoWhite: '#eeded8',
    pianoBlack: '#24140f',
  },
};

const violetHaze: ThemeDefinition = {
  id: 'violet-haze',
  name: 'Violet Haze',
  colors: {
    bgBase: '#120d1c',
    bgSurface: '#1a1228',
    bgElevated: '#231938',
    bgInset: '#150f22',
    bgGraph: '#1a1330',
    bgWaveform: '#281949',
    border: '#332650',
    borderStrong: '#4a3570',
    textPrimary: '#ddcff5',
    textSecondary: '#8d7cb3',
    textMuted: '#76669a',
    textFaint: '#60527f',
    accent: '#b78cff',
    accentHover: '#c9a6ff',
    accentRgb: '183, 140, 255',
    signal: '#59d7ff',
    signalRgb: '89, 215, 255',
    grid: '#2b2144',
    gridLabel: '#7a6b9c',
    knobTrack: '#30254a',
    pianoWhite: '#ebe2f8',
    pianoBlack: '#1f1730',
  },
};

const beitarYerushalayim: ThemeDefinition = {
  id: 'beitar-yerushalayim',
  name: 'Beitar Yerushalayim',
  colors: {
    bgBase: '#090909',
    bgSurface: '#121212',
    bgElevated: '#1a1a1a',
    bgInset: '#0d0d0d',
    bgGraph: '#111111',
    bgWaveform: '#1a1a12',
    border: '#2b2b2b',
    borderStrong: '#3a3a3a',
    textPrimary: '#f6d95b',
    textSecondary: '#c7b159',
    textMuted: '#9f8e52',
    textFaint: '#776a42',
    accent: '#f2c300',
    accentHover: '#ffd43a',
    accentRgb: '242, 195, 0',
    signal: '#ffe066',
    signalRgb: '255, 224, 102',
    grid: '#27231a',
    gridLabel: '#a7924a',
    knobTrack: '#2a2a20',
    pianoWhite: '#f3e6ad',
    pianoBlack: '#111111',
  },
};

export const themes: ThemeDefinition[] = [
  midnight,
  daylight,
  neonNoir,
  amberTerminal,
  arctic,
  forestCanopy,
  oceanDepth,
  roseGold,
  desertDusk,
  cyberMint,
  monochromeStudio,
  lavaForge,
  violetHaze,
  beitarYerushalayim,
];

const STORAGE_KEY = 'psynth-theme';

/** Mutable singleton — canvas modules read this every frame. */
export const activeTheme: ThemeColors = { ...midnight.colors };

export function getThemeById(id: string): ThemeDefinition | undefined {
  return themes.find((t) => t.id === id);
}

export function applyTheme(theme: ThemeDefinition): void {
  // Mutate the shared singleton in-place
  Object.assign(activeTheme, theme.colors);

  // Set CSS custom properties on :root
  const s = document.documentElement.style;
  s.setProperty('--th-bg-base', theme.colors.bgBase);
  s.setProperty('--th-bg-surface', theme.colors.bgSurface);
  s.setProperty('--th-bg-elevated', theme.colors.bgElevated);
  s.setProperty('--th-bg-inset', theme.colors.bgInset);
  s.setProperty('--th-bg-graph', theme.colors.bgGraph);
  s.setProperty('--th-bg-waveform', theme.colors.bgWaveform);
  s.setProperty('--th-border', theme.colors.border);
  s.setProperty('--th-border-strong', theme.colors.borderStrong);
  s.setProperty('--th-text-primary', theme.colors.textPrimary);
  s.setProperty('--th-text-secondary', theme.colors.textSecondary);
  s.setProperty('--th-text-muted', theme.colors.textMuted);
  s.setProperty('--th-text-faint', theme.colors.textFaint);
  s.setProperty('--th-accent', theme.colors.accent);
  s.setProperty('--th-accent-hover', theme.colors.accentHover);
  s.setProperty('--th-accent-rgb', theme.colors.accentRgb);
  s.setProperty('--th-signal', theme.colors.signal);
  s.setProperty('--th-signal-rgb', theme.colors.signalRgb);
  s.setProperty('--th-grid', theme.colors.grid);
  s.setProperty('--th-grid-label', theme.colors.gridLabel);
  s.setProperty('--th-knob-track', theme.colors.knobTrack);
  s.setProperty('--th-piano-white', theme.colors.pianoWhite);
  s.setProperty('--th-piano-black', theme.colors.pianoBlack);

  // Persist
  localStorage.setItem(STORAGE_KEY, theme.id);
}

export function loadSavedTheme(): void {
  const id = localStorage.getItem(STORAGE_KEY);
  const theme = (id && getThemeById(id)) || midnight;
  applyTheme(theme);
}

// Self-initialize on import
loadSavedTheme();
