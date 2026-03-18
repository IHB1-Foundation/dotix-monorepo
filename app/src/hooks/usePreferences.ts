"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "dotix_preferences_v1";

export type Preferences = {
  defaultSlippage: string; // e.g. "0.5"
};

const DEFAULT_PREFERENCES: Preferences = {
  defaultSlippage: "0.5",
};

function loadPreferences(): Preferences {
  if (typeof window === "undefined") return DEFAULT_PREFERENCES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function usePreferences() {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFERENCES);

  useEffect(() => {
    setPrefs(loadPreferences());
  }, []);

  const updatePrefs = useCallback((update: Partial<Preferences>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...update };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  return { prefs, updatePrefs };
}
