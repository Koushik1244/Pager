// src\components\BountyFeed.tsx

"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useUser } from "@/context/UserContext";
import BountyCard from "./feed/BountyCard";
import SubmissionCard from "./feed/SubmissionCard";
import HunterSubmissionModal from "./modals/HunterSubmissionModal";

export default function BountyFeed() {
    const { user } = useUser();

    const [bounties, setBounties] = useState<any[]>([]);
    const [submissionsMap, setSubmissionsMap] = useState<Record<string, any[]>>(
        {}
    );
    const [loading, setLoading] = useState(true);

    // Hunter modal
    const [submitBountyId, setSubmitBountyId] = useState<string | null>(null);

    useEffect(() => {
        fetchBounties();
    }, []);

    const fetchSubmissions = async (bountyId: string) => {
        const res = await axios.get(`/api/submission/by-bounty/${bountyId}`);
        return res.data.submissions;
    };

    // Optimized feed loading
    const fetchBounties = async () => {
        setLoading(true);

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
        }

        setLoading(false);
    };

    if (loading) {
        return (
            <p className="text-center mt-6 text-textMainLight dark:text-textMainDark">
                Loading feed...
            </p>
        );
    }

    if (bounties.length === 0) {
        return (
            <p className="text-center mt-6 text-textMainLight dark:text-textMainDark">
                No bounties yet
            </p>
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
                                alert("Connect wallet first");
                                return;
                            }
                            setSubmitBountyId(id);
                        }}
                    />

                    {/* Submissions */}
                    {submissionsMap[bounty._id]?.map((sub: any) => (
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
                onClose={() => setSubmitBountyId(null)}
                onSubmitted={fetchBounties}
            />
        </div>
    );
}
