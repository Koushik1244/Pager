"use client";

import Link from "next/link";
import { HiArrowRight, HiCheckBadge, HiMapPin, HiShieldCheck } from "react-icons/hi2";
import LandingBountyPreview from "@/components/LandingBountyPreview";
import GlassmorphismTrustHero from "@/components/ui/glassmorphism-trust-hero";
import { useUser } from "@/context/UserContext";
import ConnectWallet from "@/components/ConnectWallet";

const steps = [
  ["01", "Post a bounty", "Describe the local check you need and set a testnet USDC reward.", HiMapPin],
  ["02", "A local verifies", "Nearby people complete the task and send evidence from the field.", HiCheckBadge],
  ["03", "Release payment", "Review the proof, approve it, and the bounty is paid out.", HiShieldCheck],
];

export default function Home() {
  const { user } = useUser();
  const scrollToHowItWorks = () => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
  const primaryAction = user ? <Link href="/dashboard" className="group inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 active:scale-[.98]">Open dashboard <HiArrowRight className="transition-transform group-hover:translate-x-1" /></Link> : <ConnectWallet showLoginText={false} showUserName={false} showLogoutButton={false} onboardingRedirect="/dashboard" buttonClassName="group inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 active:scale-[.98]" />;

  return <main className="overflow-hidden bg-[#fbfaff] dark:bg-backgroundDark">
    <GlassmorphismTrustHero primaryAction={primaryAction} onSecondaryAction={scrollToHowItWorks} />
    <section id="how-it-works" className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
      <div className="max-w-xl"><p className="text-xs font-bold uppercase tracking-[.18em] text-primary">How it works</p><h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">A clear path from question to proof.</h2></div>
      <div className="mt-10 grid gap-5 md:grid-cols-3">{steps.map(([number, title, description, Icon]: any) => <article key={number} className="rounded-3xl border border-primary/15 bg-white p-7 dark:bg-cardDark"><div className="flex items-center justify-between"><span className="text-sm font-bold text-primary">{number}</span><Icon className="text-2xl text-primary" /></div><h3 className="mt-12 text-xl font-bold">{title}</h3><p className="mt-3 text-sm leading-6 text-gray-500 dark:text-gray-400">{description}</p></article>)}</div>
    </section>
    <section className="border-y border-primary/10 bg-primary/[.035] px-5 py-20 sm:px-8"><div className="mx-auto max-w-6xl"><div className="mb-8 flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-primary">Live from Pager</p><h2 className="mt-3 text-3xl font-bold tracking-tight">Bounties near the feed.</h2></div><Link href="/dashboard" className="hidden text-sm font-bold text-primary sm:block">See all bounties <HiArrowRight className="inline" /></Link></div><LandingBountyPreview /></div></section>
    <footer className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between sm:px-8"><div><p className="font-bold text-textMainLight dark:text-textMainDark">Pager</p><p className="mt-1 text-xs">Testnet only: rewards use testnet USDC and have no real-world value.</p></div><div className="flex gap-5"><Link href="/dashboard">Dashboard</Link><a href="#how-it-works">How it works</a><a href="https://monad.xyz" target="_blank" rel="noreferrer">Monad</a></div></footer>
  </main>;
}
