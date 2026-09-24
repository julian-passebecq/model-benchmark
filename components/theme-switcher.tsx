"use client";

import { useEffect, useState } from "react";
import { MoonStar, Palette, Sun, WandSparkles } from "lucide-react";

type ThemeId = "fluent" | "fluent-dark" | "midnight" | "graphite";

const themes: Array<{ id: ThemeId; label: string; icon: typeof Palette }> = [
  { id: "fluent", label: "Fluent", icon: Sun },
  { id: "fluent-dark", label: "Fluent Dark", icon: MoonStar },
  { id: "midnight", label: "Midnight", icon: WandSparkles },
  { id: "graphite", label: "Graphite", icon: Palette }
];

const STORAGE_KEY = "benchmark-observatory.theme.v1";

export function ThemeSwitcher() {
  const [theme, setTheme] = useState<ThemeId>("fluent");

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY) as ThemeId | null;
    if (saved && themes.some((item) => item.id === saved)) {
      setTheme(saved);
      document.documentElement.dataset.theme = saved;
      return;
    }
    document.documentElement.dataset.theme = "fluent";
  }, []);

  const updateTheme = (nextTheme: ThemeId) => {
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem(STORAGE_KEY, nextTheme);
  };

  const active = themes.find((item) => item.id === theme) ?? themes[0];
  const ActiveIcon = active.icon;

  return (
    <label className="theme-switcher" title="Change visual theme">
      <ActiveIcon size={15} aria-hidden="true" />
      <span className="sr-only">Theme</span>
      <select
        value={theme}
        onChange={(event) => updateTheme(event.target.value as ThemeId)}
        aria-label="Application theme"
      >
        {themes.map((item) => (
          <option value={item.id} key={item.id}>{item.label}</option>
        ))}
      </select>
    </label>
  );
}
