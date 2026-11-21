"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import BountyCard from "@/components/feed/BountyCard";
import SubmissionCard from "@/components/feed/SubmissionCard";
import HunterSubmissionModal from "@/components/modals/HunterSubmissionModal";
import { useUser } from "@/context/UserContext";

type ProfileUser = { _id: string; username?: string | null; walletAddress: string };
type SubmissionEntry = { submission: any; bounty: any };

export default function PublicProfilePage() {
    const { username } = useParams<{ username: string }>();
    const { user } = useUser();
    const [profile, setProfile] = useState<ProfileUser | null>(null);
    const [createdBounties, setCreatedBounties] = useState<any[]>([]);
    const [submissions, setSubmissions] = useState<SubmissionEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedBounty, setSelectedBounty] = useState<any | null>(null);

    const loadProfile = useCallback(async () => {
        if (!username) return;
        try {
            setLoading(true);
            setError("");
            const rawRouteParam = window.location.pathname.split("/").filter(Boolean).at(-1) ?? username;
            let identifier = rawRouteParam;
            try {
                identifier = decodeURIComponent(rawRouteParam);
            } catch {
                // Keep the raw segment if it contains malformed percent encoding.
            }
            const isWalletAddress = /^0x[0-9a-f]{40}$/i.test(identifier);
            const [userResponse, bountyResponse] = await Promise.all([
                axios.get(`/api/user/search?q=${encodeURIComponent(identifier)}&exact=1`),
                axios.get("/api/bounty/all"),
            ]);

            const returnedUser = userResponse.data.users?.[0] as ProfileUser | undefined;

            if (!returnedUser) {
                setProfile(null);
                setCreatedBounties([]);
                setSubmissions([]);
                setError("Profile not found");
                return;
            }

            const foundUser = isWalletAddress
                ? returnedUser.walletAddress.toLowerCase() === identifier.toLowerCase() ? returnedUser : undefined
                : returnedUser.username?.toLowerCase() === identifier.toLowerCase() ? returnedUser : undefined;

            if (!foundUser) {
                setProfile(null);
                setCreatedBounties([]);
                setSubmissions([]);
                setError("Could not load this profile.");
                return;
            }

            const allBounties = bountyResponse.data.bounties ?? [];
            const ownedBounties = allBounties.filter((bounty: any) =>
                String(bounty.creator?._id ?? bounty.creator) === String(foundUser._id)
            );
            const wallet = foundUser.walletAddress.toLowerCase();
            const submissionGroups = await Promise.all(
                allBounties.map(async (bounty: any) => {
                    const response = await axios.get(`/api/submission/by-bounty/${encodeURIComponent(bounty._id)}`);
                    return (response.data.submissions ?? [])
                        .filter((submission: any) => submission.hunterWallet?.toLowerCase() === wallet)
                        .map((submission: any) => ({ submission, bounty }));
                })
            );

            setProfile(foundUser);
            setCreatedBounties(ownedBounties);
            setSubmissions(submissionGroups.flat());
        } catch (requestError) {
            console.error(requestError);
            setError("Could not load this profile.");
        } finally {
            setLoading(false);
        }
    }, [username]);

    useEffect(() => {
        void loadProfile();
    }, [loadProfile]);

    if (loading) {
        return <p className="mx-auto mt-16 max-w-4xl px-4 text-center">Loading profile...</p>;
    }

    if (!profile) {
        return <p role="alert" className="mx-auto mt-16 max-w-4xl px-4 text-center">{error || "Profile not found"}</p>;
    }

    return (
        <main className="mx-auto max-w-5xl space-y-10 px-4 py-10">
            <section className="glass-card flex flex-col items-center gap-5 rounded-2xl border border-primary/20 bg-white/70 p-6 dark:bg-cardDark/70 md:flex-row">
                <img
                    src={`https://i.pravatar.cc/150?u=${encodeURIComponent(profile.username?.trim() || profile.walletAddress)}`}
                    alt={`${profile.username || profile.walletAddress} profile`}
                    className="h-20 w-20 rounded-full border-2 border-primary object-cover"
                />
                <div>
                    <h1 className="text-2xl font-bold">{profile.username ? `@${profile.username}` : profile.walletAddress}</h1>
                    <p className="break-all font-mono text-sm text-textMutedDark">{profile.walletAddress}</p>
                </div>
            </section>

            {createdBounties.length === 0 && submissions.length === 0 && (
                <section className="rounded-2xl border border-primary/15 bg-white/60 p-6 text-center dark:bg-cardDark/60">
                    <h2 className="font-semibold">No profile activity yet</h2>
                    <p className="mt-2 text-sm text-textMutedDark">This profile has no bounties or submissions yet.</p>
                </section>
            )}

            <section className="space-y-4">
                <h2 className="text-xl font-bold">Bounties created ({createdBounties.length})</h2>
                {createdBounties.length ? (
                    <div className="grid gap-5 md:grid-cols-2">
                        {createdBounties.map((bounty) => (
                            <BountyCard
                                key={bounty._id}
                                bounty={bounty}
                                onAccept={() => user && setSelectedBounty(bounty)}
                            />
                        ))}
                    </div>
                ) : <p className="text-textMutedDark">No bounties created yet.</p>}
            </section>

            <section className="space-y-4">
                <h2 className="text-xl font-bold">Submissions ({submissions.length})</h2>
                {submissions.length ? (
                    submissions.map(({ submission, bounty }) => (
                        <div key={submission._id} className="space-y-2">
                            <Link href={`/bounty/${bounty._id}`} className="text-sm font-semibold text-primary hover:underline">
                                Submission for: {bounty.description}
                            </Link>
                            <SubmissionCard submission={submission} bounty={bounty} onApproved={loadProfile} />
                        </div>
                    ))
                ) : <p className="text-textMutedDark">No submissions yet.</p>}
            </section>

            <HunterSubmissionModal
                open={Boolean(selectedBounty)}
                bountyId={selectedBounty?._id ?? null}
                bounty={selectedBounty}
                onClose={() => setSelectedBounty(null)}
                onSubmitted={loadProfile}
            />
        </main>
    );
}
