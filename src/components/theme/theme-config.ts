import { Moon, Sun } from "lucide-react";

export const themeOptions = [
  { name: "light", label: "Terang", icon: Sun },
  { name: "dark", label: "Gelap", icon: Moon },
] as const;

export type AppTheme = (typeof themeOptions)[number]["name"];
