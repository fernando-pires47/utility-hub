export interface FormatterPreferences {
  diffVisible: boolean;
  rightCollapsed: boolean;
}

// Preserve the saved Formatter layout from before the Utility Hub rename.
const STORAGE_KEY = 'text-formatter:layout';

export function loadFormatterPreferences(): FormatterPreferences {
  const defaults = { diffVisible: false, rightCollapsed: false };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return defaults;
    const preferences = parsed as Record<string, unknown>;
    return {
      diffVisible: typeof preferences.diffVisible === 'boolean' ? preferences.diffVisible : defaults.diffVisible,
      rightCollapsed: typeof preferences.rightCollapsed === 'boolean' ? preferences.rightCollapsed : defaults.rightCollapsed,
    };
  } catch {
    // Storage unavailable or invalid: keep the default layout usable.
    return defaults;
  }
}

export function saveFormatterPreferences(preferences: FormatterPreferences): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch {
    // Storage full or unavailable: the controls still work in memory.
  }
}
