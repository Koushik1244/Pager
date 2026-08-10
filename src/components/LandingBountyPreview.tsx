"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Bounty = { _id: string; username: string; description: string; reward: number; location?: { address?: string }; status: string };

export default function LandingBountyPreview() {
  const [bounties, setBounties] = useState<Bounty[]>([]);
  useEffect(() => {
    fetch("/api/bounty/all").then((r) => r.json()).then((data) => setBounties(data.bounties?.slice(0, 3) || [])).catch(() => setBounties([]));
  }, []);
  const samples = [
    { _id: "sample-1", username: "maya", description: "Verify a new community garden sign is installed.", reward: 12, location: { address: "Downtown" }, status: "open" },
    { _id: "sample-2", username: "pixel", description: "Capture the opening hours at the new café.", reward: 8, location: { address: "Westside" }, status: "open" },
    { _id: "sample-3", username: "leo", description: "Check whether this pedestrian route is accessible.", reward: 15, location: { address: "Riverside" }, status: "open" },
  ];
  const shown = bounties.length ? bounties : samples;
  return <div className="grid gap-4 md:grid-cols-3">{shown.map((bounty) => <article key={bounty._id} className="rounded-2xl border border-primary/15 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:bg-cardDark">
    <div className="flex items-center justify-between text-xs"><span className="font-bold text-primary">OPEN BOUNTY</span><span className="rounded-full bg-primary/10 px-2 py-1 font-bold text-primary">{bounty.reward} tUSDC</span></div>
    <p className="mt-5 line-clamp-2 min-h-12 font-semibold leading-relaxed">{bounty.description}</p>
    <div className="mt-5 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400"><span>by @{bounty.username}</span><span>{bounty.location?.address || "Near you"}</span></div>
  </article>)}</div>;
}
