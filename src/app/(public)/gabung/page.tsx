import { permanentRedirect } from "next/navigation";

export default function LegacyRegistrationRoute() {
  permanentRedirect("/pendaftaran");
}
