import type { Metadata } from "next";
import { LoginPage } from "@/components/auth/login-page";

export const metadata: Metadata = {
  title: "Masuk | RESTEX Attendance",
  description: "Masuk ke ruang kerja RESTEX Attendance.",
};

export default function LoginRoute() {
  return <LoginPage />;
}
