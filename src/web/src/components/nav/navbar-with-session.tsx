import { auth } from "@/app/auth";
import { LandingNavbar } from "./landing-navbar";

export async function NavbarWithSession() {
  const session = await auth();
  return <LandingNavbar session={session || undefined} />;
}
