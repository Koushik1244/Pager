"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useUser } from "@/context/UserContext";
import Link from "next/link";
import MediaViewer from "@/components/feed/MediaViewer";
import { FaBolt, FaEdit } from "react-icons/fa";
import { MdAssignment, MdOutlineAssignmentTurnedIn } from "react-icons/md";
import { signAction } from "@/lib/signAction";

export default function ProfilePage() {
    const { user, setUser } = useUser();

    const [createdBounties, setCreatedBounties] = useState<any[]>([]);
    const [participatedCount, setParticipatedCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [editOpen, setEditOpen] = useState(false);
    const [newUsername, setNewUsername] = useState("");
    const [usernameError, setUsernameError] = useState("");
    const [savingUsername, setSavingUsername] = useState(false);

    const updateUsername = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const username = newUsername.trim();
        if (!user || !username) return;

        try {
            setSavingUsername(true);
            setUsernameError("");
            const auth = await signAction("user/set-username", username);
            const response = await axios.post("/api/user/set-username", { ...auth, username });
            setUser(response.data.user);
            setEditOpen(false);
            setNewUsername("");
        } catch (error) {
            const message = axios.isAxiosError(error) && typeof error.response?.data?.error === "string"
                ? error.response.data.error
                : "Could not update username. Please try again.";
            setUsernameError(message);
        } finally {
            setSavingUsername(false);
        }
    };

    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch all bounties
                const bountyRes = await axios.get("/api/bounty/all");
                const allBounties = bountyRes.data.bounties;

                // Filter created by user
                const mine = allBounties.filter(
                    (b: any) => b.username === user.username
                );

                setCreatedBounties(mine);

                // Count participation (hunter)
                let participation = 0;

                await Promise.all(
                    allBounties.map(async (b: any) => {
                        const res = await axios.get(
                            `/api/submission/by-bounty/${b._id}`
                        );
                        const subs = res.data.submissions;

                        subs.forEach((s: any) => {
                            if (s.hunterWallet === user.walletAddress) {
                                participation++;
                            }
                        });
                    })
                );

                setParticipatedCount(participation);
            } catch (err) {
                console.error(err);
            }

            setLoading(false);
        };

        fetchData();
    }, [user]);

    if (!user) {
        return (
            <div className="text-center mt-20 text-textMainLight dark:text-textMainDark">
                Connect wallet to view profile
            </div>
        );
    }

    if (loading) {
        return (
            <div className="text-center mt-20 text-textMainLight dark:text-textMainDark">
                Loading profile...
            </div>
        );
    }

    return (
        <main className="max-w-5xl mx-auto px-4 py-10 space-y-10">

            {/* Profile Header */}
            <section className="glass-card bg-white/70 dark:bg-cardDark/70 backdrop-blur-md border border-primary/20 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">

                <div className="flex items-center gap-6">
                    {/* Avatar */}
                    <div className="relative">
                        <img
                            src={`https://i.pravatar.cc/150?u=${user.username}`}
                            className="w-24 h-24 rounded-full border-2 border-primary shadow-glow object-cover"
                        />
                        <div className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-1">
                            <span className="text-sm">
                                verified
                            </span>
                        </div>
                    </div>

                    {/* User Info */}
                    <div>
                        <h2 className="text-2xl font-bold text-textMainLight dark:text-textMainDark">
                            {user.username}
                        </h2>

                        <p className="text-xs text-textMutedDark font-mono">
                            {user.walletAddress.slice(0, 6)}...
                            {user.walletAddress.slice(-4)}
                        </p>
                    </div>
                </div>

                <div className="w-full md:w-auto space-y-3">
                    <button
                        onClick={() => {
                            setNewUsername(user.username);
                            setUsernameError("");
                            setEditOpen((value) => !value);
                        }}
                        className="bg-primary text-white px-5 py-2 rounded-xl font-semibold flex items-center gap-2"
                    >
                        <FaEdit size={18} />
                        Edit Profile
                    </button>

                    {editOpen && (
                        <form onSubmit={updateUsername} className="w-full md:w-72 rounded-xl border border-primary/20 bg-white dark:bg-cardDark p-4 space-y-3">
                            <label htmlFor="profile-username" className="block text-sm font-semibold">Username</label>
                            <input
                                id="profile-username"
                                value={newUsername}
                                onChange={(event) => setNewUsername(event.target.value)}
                                maxLength={32}
                                required
                                className="w-full rounded-lg border border-primary/20 bg-transparent px-3 py-2 outline-none focus:border-primary"
                            />
                            {usernameError && <p role="alert" className="text-xs text-red-500">{usernameError}</p>}
                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    disabled={savingUsername || !newUsername.trim() || newUsername.trim() === user.username}
                                    className="flex-1 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                                >
                                    {savingUsername ? "Saving..." : "Save username"}
                                </button>
                                <button type="button" onClick={() => setEditOpen(false)} className="rounded-lg border border-primary/20 px-3 py-2 text-sm">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </section>

            {createdBounties.length === 0 && participatedCount === 0 && (
                <section className="rounded-2xl border border-primary/15 bg-white/60 p-6 text-center dark:bg-cardDark/60">
                    <h3 className="font-semibold">No profile activity yet</h3>
                    <p className="mt-2 text-sm text-textMutedDark">Create a bounty or submit proof to start building your Pager activity.</p>
                </section>
            )}

            {/* Stats */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">

                <div className="bg-white/70 dark:bg-cardDark/70 border border-primary/20 rounded-2xl p-6 flex justify-between items-center">
                    <div>
                        <p className="text-xs uppercase text-textMutedDark mb-1">
                            Bounties Created
                        </p>
                        <p className="text-3xl font-bold">
                            {createdBounties.length}
                        </p>
                    </div>

                    <span className="text-primary text-3xl">
                        <MdOutlineAssignmentTurnedIn size={46} />
                    </span>
                </div>

                <div className="bg-white/70 dark:bg-cardDark/70 border border-primary/20 rounded-2xl p-6 flex justify-between items-center">
                    <div>
                        <p className="text-xs uppercase text-textMutedDark mb-1">
                            Participated (Hunter)
                        </p>
                        <p className="text-3xl font-bold">
                            {participatedCount}
                        </p>
                    </div>

                    <span className="text-primary text-3xl">
                        <FaBolt size={40} />
                    </span>
                </div>

            </section>

            {/* Created Bounties */}
            <section>
                <h3 className="text-lg font-bold mb-4 text-textMainLight dark:text-textMainDark">
                    Your Bounties
                </h3>

                {createdBounties.length === 0 ? (
                    <p className="text-textMutedDark">No bounties created yet</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {createdBounties.map((bounty) => (
                            <div
                                key={bounty._id}
                                className="
                  bg-white dark:bg-cardDark
                  border border-primary/10
                  rounded-2xl
                  overflow-hidden
                  hover:border-primary/40
                  transition
                "
                            >
                                <div className="p-4 space-y-2">
                                    <p className="font-semibold text-sm">
                                        {bounty.description}
                                    </p>

                                    <p className="text-xs text-primary">
                                        {bounty.reward} USDC
                                    </p>
                                </div>

                                <div className="px-4 pb-4">
                                    <MediaViewer
                                        mediaUrl={bounty.mediaUrl}
                                        lat={bounty.location?.lat}
                                        lng={bounty.location?.lng}
                                    />
                                </div>

                                <div className="px-4 py-3 border-t border-primary/10 flex justify-between text-xs text-textMutedDark">
                                    <span>
                                        {bounty.status === "completed"
                                            ? "Completed"
                                            : "Active"}
                                    </span>

                                    <Link
                                        href={`/bounty/${bounty._id}`}
                                        className="text-primary hover:underline"
                                    >
                                        View
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}
