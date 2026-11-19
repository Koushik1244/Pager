"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import BountyCard from "@/components/feed/BountyCard";
import SubmissionCard from "@/components/feed/SubmissionCard";
import HunterSubmissionModal from "@/components/modals/HunterSubmissionModal";
import { useUser } from "@/context/UserContext";
import { useToast } from "@/components/ui/Toast";

export default function BountyDetailPage() {
    const { id } = useParams<{ id: string }>();
    const { user } = useUser();
    const showToast = useToast();
    const [bounty, setBounty] = useState<any | null>(null);
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [submissionOpen, setSubmissionOpen] = useState(false);

    const loadBounty = useCallback(async () => {
        if (!id) return;
        try {
            setLoading(true);
            setError("");
            const [bountyResponse, submissionResponse] = await Promise.all([
                axios.get(`/api/bounty/${encodeURIComponent(id)}`),
                axios.get(`/api/submission/by-bounty/${encodeURIComponent(id)}`),
            ]);
            setBounty(bountyResponse.data.bounty);
            setSubmissions(submissionResponse.data.submissions ?? []);
        } catch (requestError) {
            setError(axios.isAxiosError(requestError) && requestError.response?.status === 404
                ? "Bounty not found"
                : "Could not load this bounty.");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        void loadBounty();
    }, [loadBounty]);

    if (loading) {
        return <p className="mx-auto mt-16 max-w-3xl px-4 text-center">Loading bounty...</p>;
    }

    if (error || !bounty) {
        return <p role="alert" className="mx-auto mt-16 max-w-3xl px-4 text-center">{error || "Bounty not found"}</p>;
    }

    return (
        <main className="mx-auto max-w-3xl space-y-8 px-4 py-10">
            <section>
                <h1 className="mb-4 text-2xl font-bold">Bounty details</h1>
                <BountyCard
                    bounty={bounty}
                    onAccept={() => {
                        if (!user) {
                            showToast("Connect your wallet to accept a bounty.", "info");
                            return;
                        }
                        setSubmissionOpen(true);
                    }}
                />
            </section>

            <section className="space-y-4">
                <h2 className="text-xl font-bold">Submissions ({submissions.length})</h2>
                {submissions.length === 0 ? (
                    <p className="text-textMutedDark">No submissions yet.</p>
                ) : (
                    submissions.map((submission) => (
                        <SubmissionCard
                            key={submission._id}
                            submission={submission}
                            bounty={bounty}
                            onApproved={loadBounty}
                        />
                    ))
                )}
            </section>

            <HunterSubmissionModal
                open={submissionOpen}
                bountyId={bounty._id}
                bounty={bounty}
                onClose={() => setSubmissionOpen(false)}
                onSubmitted={loadBounty}
            />
        </main>
    );
}
