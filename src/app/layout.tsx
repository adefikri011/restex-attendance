import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme/theme-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dashboard | RESTEX Attendance",
  description: "Dashboard administrasi kehadiran anggota RESTEX.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `if(typeof window!=='undefined'&&window.matchMedia('(prefers-reduced-motion: no-preference)').matches&&'IntersectionObserver'in window){document.documentElement.classList.add('reveal-ready');}`,
          }}
        />
        <noscript>
          <style
            dangerouslySetInnerHTML={{
              __html: `[data-reveal]{opacity:1!important;translate:none!important;rotate:none!important;scale:none!important;clip-path:none!important}`,
            }}
          />
        </noscript>
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
