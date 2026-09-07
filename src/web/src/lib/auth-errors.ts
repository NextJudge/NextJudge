import { AuthError, CredentialsSignin } from "next-auth";

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  CredentialsSignin: "Invalid email or password.",
  AccessDenied: "Sign-in was denied. Try another method or contact support.",
  Configuration: "Sign-in is temporarily unavailable. Please try again later.",
  OAuthAccountNotLinked:
    "This email is linked to another sign-in method. Use the original provider.",
};

export const getAuthFailureMessage = (error: unknown): string => {
  if (error instanceof CredentialsSignin) {
    return AUTH_ERROR_MESSAGES.CredentialsSignin;
  }

  if (error instanceof AuthError) {
    return AUTH_ERROR_MESSAGES[error.type] ?? "Sign-in failed. Please try again.";
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return "Sign-in failed. Please try again.";
};

export const getAuthRedirectErrorMessage = (redirectTarget: string): string | null => {
  try {
    const url = new URL(redirectTarget, "https://nextjudge.net");
    const errorParam = url.searchParams.get("error");
    if (!errorParam) {
      return null;
    }
    return AUTH_ERROR_MESSAGES[errorParam] ?? "Sign-in failed. Please try again.";
  } catch {
    if (redirectTarget.includes("error=CredentialsSignin")) {
      return AUTH_ERROR_MESSAGES.CredentialsSignin;
    }
    if (redirectTarget.includes("error=")) {
      return "Sign-in failed. Please try again.";
    }
    return null;
  }
};
