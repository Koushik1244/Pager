"use client";

import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  CircleDollarSign,
  MapPin,
  Play,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";
import type { ReactNode } from "react";

type TrustHeroProps = {
  onPrimaryAction?: () => void;
  onSecondaryAction: () => void;
  primaryAction?: ReactNode;
};

const StatItem = ({ value, label }: { value: string; label: string }) => (
  <div className="flex flex-col items-center justify-center">
    <span className="text-xl font-bold text-white sm:text-2xl">{value}</span>
    <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400 sm:text-xs">{label}</span>
  </div>
);

export default function GlassmorphismTrustHero({ onPrimaryAction, onSecondaryAction, primaryAction }: TrustHeroProps) {
  return (
    <section className="relative isolate w-full overflow-hidden bg-zinc-950 text-white">
      <style>{`
        @keyframes pager-fade-slide-in { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .pager-fade-in { animation: pager-fade-slide-in .8s ease-out both; }
        .pager-delay-1 { animation-delay: .1s; } .pager-delay-2 { animation-delay: .2s; }
        .pager-delay-3 { animation-delay: .3s; } .pager-delay-4 { animation-delay: .4s; }
        @media (prefers-reduced-motion: reduce) { .pager-fade-in { animation: none; } }
      `}</style>
      <div
        className="absolute inset-0 -z-20 bg-cover bg-center opacity-35"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1444723121867-7a241cacace9?auto=format&fit=crop&w=1800&q=85')",
          maskImage: "linear-gradient(180deg, transparent 0%, black 12%, black 75%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(180deg, transparent 0%, black 12%, black 75%, transparent 100%)",
        }}
      />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_75%_30%,rgba(134,107,255,.3),transparent_28%),linear-gradient(180deg,rgba(9,9,11,.25),#09090b_85%)]" />

      <div className="mx-auto grid max-w-7xl items-start gap-12 px-5 pb-16 pt-20 sm:px-8 md:pb-24 md:pt-28 lg:grid-cols-12 lg:gap-8">
        <div className="flex flex-col justify-center space-y-8 lg:col-span-7 lg:pt-8">
          <div className="pager-fade-in pager-delay-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[.07] px-3 py-1.5 backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-[#ffcd75]" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-200 sm:text-xs">Built for real-world proof</span>
            </div>
          </div>
          <h1 className="pager-fade-in pager-delay-2 text-5xl font-medium leading-[.92] tracking-tighter sm:text-6xl lg:text-7xl xl:text-8xl">
            Local answers.<br />
            <span className="bg-gradient-to-br from-white via-white to-[#ffcd75] bg-clip-text text-transparent">Verified fast.</span><br />
            Paid fairly.
          </h1>
          <p className="pager-fade-in pager-delay-3 max-w-xl text-lg leading-relaxed text-zinc-300">
            Post a local bounty, have a nearby person verify it, and approve the proof. Pager makes every step visible on Monad testnet.
          </p>
          <div className="pager-fade-in pager-delay-4 flex flex-col gap-4 sm:flex-row">
            {primaryAction || <button onClick={onPrimaryAction} className="group inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 active:scale-[.98]">
              Start verifying <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>}
            <button onClick={onSecondaryAction} className="group inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[.07] px-8 py-4 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:border-white/25 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950">
              <Play className="h-4 w-4 fill-current" /> How Pager works
            </button>
          </div>
          <p className="text-xs text-zinc-500">Testnet only — rewards use testnet USDC, never real money.</p>
        </div>

        <div className="pager-fade-in pager-delay-4 space-y-5 lg:col-span-5 lg:mt-12">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[.07] p-7 shadow-2xl backdrop-blur-xl sm:p-8">
            <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
            <div className="relative">
              <div className="mb-8 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20"><Target className="h-6 w-6" /></div>
                <div><div className="text-3xl font-bold tracking-tight">3 simple steps</div><div className="text-sm text-zinc-400">from task to trusted proof</div></div>
              </div>
              <div className="space-y-3">
                {[['1', 'Post a local bounty', MapPin], ['2', 'A local sends proof', BadgeCheck], ['3', 'Approve & release tUSDC', CircleDollarSign]].map(([number, label, Icon]: any) => <div key={number} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/15 px-4 py-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-zinc-950">{number}</span><span className="text-sm font-medium text-zinc-200">{label}</span><Icon className="ml-auto h-4 w-4 text-[#ffcd75]" /></div>)}
              </div>
              <div className="my-7 h-px bg-white/10" />
              <div className="grid grid-cols-3 divide-x divide-white/10"><StatItem value="Open" label="Bounties" /><StatItem value="Local" label="Proof" /><StatItem value="tUSDC" label="Rewards" /></div>
              <div className="mt-7 flex flex-wrap gap-2"><span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-medium tracking-wide text-zinc-300"><span className="h-2 w-2 rounded-full bg-green-400" /> MONAD TESTNET</span><span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-medium tracking-wide text-zinc-300"><ShieldCheck className="h-3 w-3 text-[#ffcd75]" /> PROOF FIRST</span></div>
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[.07] px-6 py-5 backdrop-blur-xl"><p className="text-sm font-medium text-zinc-300">A transparent path for every bounty.</p><div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-800/70"><div className="h-full w-[96%] rounded-full bg-gradient-to-r from-primary via-white to-[#ffcd75]" /></div></div>
        </div>
      </div>
    </section>
  );
}
