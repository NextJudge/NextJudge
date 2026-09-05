"use client";

import { Button } from "@/components/ui/button";
import { ArrowUpToLine } from "lucide-react";
import { useEffect, useState } from "react";

const isDemoSectionVisible = (): boolean => {
  const demoSection = document.getElementById("try-it");
  if (!demoSection) {
    return false;
  }

  const rect = demoSection.getBoundingClientRect();
  return rect.top < window.innerHeight * 0.85 && rect.bottom > window.innerHeight * 0.15;
};

export const ScrollToTop = () => {
  const [showTopBtn, setShowTopBtn] = useState(false);

  useEffect(() => {
    const updateVisibility = () => {
      const scrolledDown = window.scrollY > 400;
      setShowTopBtn(scrolledDown && !isDemoSectionVisible());
    };

    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });
    window.addEventListener("resize", updateVisibility);

    return () => {
      window.removeEventListener("scroll", updateVisibility);
      window.removeEventListener("resize", updateVisibility);
    };
  }, []);

  const handleGoToTop = () => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  };

  return (
    <>
      {showTopBtn && (
        <Button
          onClick={handleGoToTop}
          className="fixed bottom-4 right-4 z-30 opacity-90 shadow-md"
          size="icon"
          aria-label="Scroll to top"
        >
          <ArrowUpToLine className="h-4 w-4" />
        </Button>
      )}
    </>
  );
};
