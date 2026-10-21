'use client';

import { useEffect, useRef, useState } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  applyTheme,
  readThemePreference,
  SYSTEM_THEME_QUERY,
  THEME_STORAGE_KEY,
  type ThemePreference,
} from '@/lib/theme';

const options = [
  { value: 'system', label: 'Follow system theme', Icon: Monitor },
  { value: 'light', label: 'Light theme', Icon: Sun },
  { value: 'dark', label: 'Dark theme', Icon: Moon },
] as const;

export function ThemeSwitcher() {
  const [preference, setPreference] = useState<ThemePreference>('system');
  const preferenceRef = useRef<ThemePreference>('system');

  useEffect(() => {
    function syncPreference() {
      const saved = readThemePreference();
      preferenceRef.current = saved;
      setPreference(saved);
      applyTheme(saved);
    }
    syncPreference();
    const media = window.matchMedia(SYSTEM_THEME_QUERY);
    const onSystemChange = () => applyTheme(preferenceRef.current);
    const onStorage = (event: StorageEvent) => {
      if (event.key === THEME_STORAGE_KEY || event.key === null)
        syncPreference();
    };
    media.addEventListener('change', onSystemChange);
    window.addEventListener('storage', onStorage);
    return () => {
      media.removeEventListener('change', onSystemChange);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  function selectTheme(next: ThemePreference) {
    preferenceRef.current = next;
    setPreference(next);
    applyTheme(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Manual switching still works when browser storage is unavailable.
    }
  }

  return (
    <fieldset className="theme-switcher" aria-label="Color theme">
      {options.map(({ value, label, Icon }) => (
        <Button
          key={value}
          type="button"
          variant="ghost"
          size="icon-sm"
          className="theme-option"
          aria-label={label}
          aria-pressed={preference === value}
          title={label}
          onClick={() => selectTheme(value)}
        >
          <Icon size={15} strokeWidth={1.6} aria-hidden="true" />
        </Button>
      ))}
    </fieldset>
  );
}
