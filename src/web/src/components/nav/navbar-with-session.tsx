import { auth } from "@/app/auth";
import { AuthErrorToast } from "./auth-error-toast";
import { LandingNavbar } from "./landing-navbar";

export async function NavbarWithSession() {
    let session = null;
    let hasError = false;

    try {
        session = await auth();
    } catch (error) {
        hasError = true;
        console.error("Failed to fetch user data:", error);
    }

    return (
        <>
            <LandingNavbar session={session || undefined} />
            {hasError && <AuthErrorToast />}
        </>
    );
}
