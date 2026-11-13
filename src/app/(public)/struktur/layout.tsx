import type { ReactNode } from "react";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingNavbar } from "@/components/landing/landing-navbar";

export default function StructureLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <LandingNavbar />
      {children}
      <LandingFooter />
    </>
  );
}
