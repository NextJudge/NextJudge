"use client";

import { useEffect } from "react";
import { toast } from "sonner";

export function AuthErrorToast() {
  useEffect(() => {
    toast.error("Authentication service unavailable", {
      description: "Unable to connect to the authentication service. Some features may be limited.",
      duration: 5000,
    });
  }, []);

  return null;
}
