"use client";

import { useState, useEffect } from "react";
import BountyFeed from "@/components/BountyFeed";
import BountyModal from "@/components/BountyModal";
import FloatingActionButton from "@/components/FloatingActionButton";

export default function Home() {
  const [open, setOpen] = useState(false);
  const [bgImage, setBgImage] = useState("/light-mode.png");

  // Detect theme and switch wallpaper
  useEffect(() => {
    const updateTheme = () => {
      const isDark = document.documentElement.classList.contains("dark");
      setBgImage(isDark ? "/dark-mode.png" : "/light-mode.png");
    };

    updateTheme();

    // Observe theme changes
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  return (
    <main
      className="relative min-h-screen"
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      {/* Overlay for readability */}
      <div className="absolute inset-0 bg-white/60 dark:bg-backgroundDark/80" />

      {/* Content */}
      <div className="relative max-w-2xl mx-auto px-4 py-6">
        <FloatingActionButton onClick={() => setOpen(true)} />
        <BountyModal open={open} onClose={() => setOpen(false)} />

        <BountyFeed />
      </div>
    </main>
  );
}