const DEFAULT_SETTINGS = {
  mode: 'curl',
  theme: 'paper',
  fontFamily: 'serif',
  fontSize: 20,
  fontWeight: 400,
  lineHeight: 1.72,
  paragraphSpacing: 0.72,
  letterSpacing: 0,
  margin: 44,
  columns: 1,
  textAlign: 'justify',
  brightness: 1,
  autoHideUi: !0,
  reduceMotion: !1,
  ttsRate: 1,
  ttsPitch: 1,
};
const DEFAULT_LIBRARY = {
  version: 1,
  books: [],
  appTheme: 'light',
  settings: DEFAULT_SETTINGS,
};
const VALID_THEMES = new Set(['paper', 'sepia', 'sage', 'night']);
export { DEFAULT_SETTINGS, DEFAULT_LIBRARY, VALID_THEMES };
