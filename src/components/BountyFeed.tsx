// src\components\BountyFeed.tsx

"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useUser } from "@/context/UserContext";
import BountyCard from "./feed/BountyCard";
import SubmissionCard from "./feed/SubmissionCard";
import HunterSubmissionModal from "./modals/HunterSubmissionModal";
import { useToast } from "@/components/ui/Toast";

export default function BountyFeed() {
    const { user } = useUser();

    const [bounties, setBounties] = useState<any[]>([]);
    const [submissionsMap, setSubmissionsMap] = useState<Record<string, any[]>>(
        {}
    );
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const showToast = useToast();

    // Hunter modal
    const [submitBountyId, setSubmitBountyId] = useState<string | null>(null);

    const fetchSubmissions = async (bountyId: string) => {
        const res = await axios.get(`/api/submission/by-bounty/${bountyId}`);
        return res.data.submissions;
    };

    // Optimized feed loading
    const fetchBounties = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const res = await axios.get("/api/bounty/all");
            const bountiesData = res.data.bounties;

            setBounties(bountiesData);

            // Fetch all submissions in parallel
            const results = await Promise.all(
                bountiesData.map(async (bounty: any) => {
                    const subs = await fetchSubmissions(bounty._id);
                    return { id: bounty._id, subs };
                })
            );

            const map: Record<string, any[]> = {};
            results.forEach((r) => {
                map[r.id] = r.subs;
            });

            setSubmissionsMap(map);
        } catch (err) {
            console.error("Feed load failed:", err);
            setError("We couldn't load the bounty feed. Check your connection and try again.");
        } finally {
            setLoading(false);
        }

    }, []);

    useEffect(() => {
        void fetchBounties();
    }, [fetchBounties]);

    if (loading) {
        return (
            <div className="mx-auto mt-6 max-w-xl space-y-5" aria-label="Loading bounty feed">
                {[0, 1, 2].map((item) => (
                    <div key={item} className="animate-pulse overflow-hidden rounded-2xl border border-primary/10 bg-cardLight p-5 dark:bg-cardDark">
                        <div className="mb-5 flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10" />
                            <div className="space-y-2"><div className="h-3 w-28 rounded bg-primary/10" /><div className="h-2 w-20 rounded bg-primary/10" /></div>
                        </div>
                        <div className="mb-4 h-4 w-3/4 rounded bg-primary/10" />
                        <div className="h-40 rounded-xl bg-primary/10" />
                    </div>
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div role="alert" className="mx-auto mt-8 max-w-xl rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-center">
                <p>{error}</p>
                <button onClick={() => void fetchBounties()} className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white">Retry</button>
            </div>
        );
    }

    if (bounties.length === 0) {
        return (
            <div className="mx-auto mt-8 max-w-xl rounded-2xl border border-primary/15 bg-white/60 p-8 text-center dark:bg-cardDark/60">
                <h2 className="text-lg font-semibold">No bounties yet</h2>
                <p className="mt-2 text-sm text-textMutedDark">New bounties will appear here when someone posts them.</p>
            </div>
        );
    }

    return (
        <div className="max-w-xl mx-auto mt-6 space-y-6">
            {bounties.map((bounty) => (
                <div key={bounty._id} className="space-y-3">
                    {/* Bounty */}
                    <BountyCard
                        bounty={bounty}
                        onAccept={(id: string) => {
                            if (!user) {
                                showToast("Connect your wallet to accept a bounty.", "info");
                                return;
                            }
                            setSubmitBountyId(id);
                        }}
                    />

                    {/* Submissions */}
                    {(submissionsMap[bounty._id] ?? []).length === 0 && (
                        <p className="rounded-xl border border-primary/10 bg-white/50 px-4 py-3 text-sm text-textMutedDark dark:bg-cardDark/50">
                            No submissions yet for this bounty.
                        </p>
                    )}
                    {(submissionsMap[bounty._id] ?? []).map((sub: any) => (
                        <SubmissionCard
                            key={sub._id}
                            submission={sub}
                            bounty={bounty}
                            onApproved={fetchBounties}
                        />
                    ))}
                </div>
            ))}

            {/* Hunter Submission Modal */}
            <HunterSubmissionModal
                open={!!submitBountyId}
                bountyId={submitBountyId}
                bounty={bounties.find((bounty) => bounty._id === submitBountyId) ?? null}
                onClose={() => setSubmitBountyId(null)}
                onSubmitted={fetchBounties}
            />
        </div>
    );
}
