export type ThemePreference = 'system' | 'light' | 'dark';

export const THEME_STORAGE_KEY = 'zezhouyang-theme';
export const SYSTEM_THEME_QUERY = '(prefers-color-scheme: dark)';

export function readThemePreference(): ThemePreference {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    return saved === 'light' || saved === 'dark' ? saved : 'system';
  } catch {
    return 'system';
  }
}

export function applyTheme(preference: ThemePreference) {
  const dark =
    preference === 'dark' ||
    (preference === 'system' && window.matchMedia(SYSTEM_THEME_QUERY).matches);
  document.documentElement.classList.toggle('dark', dark);
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
}

// Runs before the page is painted, so a saved theme does not flash the opposite color.
export const themeInitScript = `(() => {
  let preference = 'system';
  try {
    const saved = localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
    if (saved === 'light' || saved === 'dark') preference = saved;
  } catch {}
  const dark = preference === 'dark' ||
    (preference === 'system' && window.matchMedia(${JSON.stringify(SYSTEM_THEME_QUERY)}).matches);
  document.documentElement.classList.toggle('dark', dark);
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
})();`;
