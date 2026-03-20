import { LandingShell } from "@/components/beforeyousign/landing-shell";
import { LandingClient } from "@/components/beforeyousign/landing-client";

export default function Home() {
  return (
    <LandingShell>
      <LandingClient />
    </LandingShell>
  );
}
