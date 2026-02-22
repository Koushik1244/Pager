// src\app\page.tsx

"use client";

import { useState } from "react";
import BountyFeed from "@/components/BountyFeed";
import Link from "next/link";
import BountyModal from "@/components/BountyModal";
import FloatingActionButton from "@/components/FloatingActionButton";
import { FiMapPin } from "react-icons/fi";

export default function Home() {
  const [open, setOpen] = useState(false);

  return (
    <main className="min-h-screen bg-backgroundLight dark:bg-backgroundDark transition-colors duration-300">

      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* Header */}



        <FloatingActionButton onClick={() => setOpen(true)} />
        <BountyModal open={open} onClose={() => setOpen(false)} />

        <BountyFeed />

      </div>
    </main>
  );
}
