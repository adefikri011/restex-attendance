"use client";

import { Suspense } from "react";
import { ThemeProvider as NextThemeProvider } from "next-themes";
import type { ReactNode } from "react";
import { NotificationViewport } from "@/lib/notifications";
import { FloatingMascot } from "@/components/mascot/floating-mascot";
import { themeOptions } from "./theme-config";

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemeProvider
      attribute="data-theme"
      defaultTheme="light"
      enableSystem={false}
      themes={themeOptions.map(({ name }) => name)}
    >
      {children}
      <NotificationViewport />
      <Suspense fallback={null}>
        <FloatingMascot />
      </Suspense>
    </NextThemeProvider>
  );
}
