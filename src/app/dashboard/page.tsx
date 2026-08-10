"use client";

import { useState } from "react";
import BountyFeed from "@/components/BountyFeed";
import BountyModal from "@/components/BountyModal";
import FloatingActionButton from "@/components/FloatingActionButton";
import { useUser } from "@/context/UserContext";

export default function DashboardPage() {
  const [open, setOpen] = useState(false);
  const { user } = useUser();

  return (
    <main className="min-h-screen bg-backgroundLight dark:bg-backgroundDark">
      <section className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.18em] text-primary">Pager dashboard</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Local work, ready when you are.</h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Browse open bounties or post a verified task for your neighbourhood.</p>
          </div>
          {user && <button onClick={() => setOpen(true)} className="hidden rounded-full bg-primary px-5 py-3 text-sm font-bold text-white shadow-glow sm:block">Post bounty</button>}
        </div>
        {!user && <div className="mb-6 rounded-2xl border border-primary/20 bg-primary/5 px-5 py-4 text-sm text-gray-600 dark:text-gray-300">Connect a wallet from the top right to accept bounties or post one.</div>}
        <BountyFeed />
      </section>
      {user && <FloatingActionButton onClick={() => setOpen(true)} />}
      <BountyModal open={open} onClose={() => setOpen(false)} />
    </main>
  );
}
