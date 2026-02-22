"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useUser } from "@/context/UserContext";
import { ethers } from "ethers";
import { ESCROW_ADDRESS, ESCROW_ABI } from "@/lib/contracts";

export default function BountyFeed() {
    const [bounties, setBounties] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useUser();
    const [selectedBounty, setSelectedBounty] = useState<string | null>(null);
    const [proofText, setProofText] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [viewBounty, setViewBounty] = useState<string | null>(null);
    const [submissions, setSubmissions] = useState<any[]>([]);

    const openSubmission = (id: string) => {
        if (!user) {
            alert("Connect wallet first");
            return;
        }
        setSelectedBounty(id);
    };

    const submitProof = async () => {
        if (!selectedBounty) return;

        await axios.post("/api/submission/create", {
            walletAddress: user?.walletAddress,
            bountyId: selectedBounty,
            description: proofText,
            mediaUrl: imageUrl,
        });

        alert("Proof submitted!");
        setSelectedBounty(null);
        setProofText("");
        setImageUrl("");
    };

    const openSubmissions = async (bountyId: string) => {
        if (!user) return;

        // Only creator can view
        const bounty = bounties.find(b => b._id === bountyId);
        if (bounty.username !== user.username) {
            alert("Only creator can view submissions");
            return;
        }

        const res = await axios.get(`/api/submission/by-bounty/${bountyId}`);
        setSubmissions(res.data.submissions);
        setViewBounty(bountyId);
    };

    const approveSubmission = async (submission: any) => {
        try {
            if (!(window as any).ethereum) {
                alert("MetaMask not found");
                return;
            }

            const provider = new ethers.BrowserProvider((window as any).ethereum);
            const signer = await provider.getSigner();

            const escrow = new ethers.Contract(
                ESCROW_ADDRESS,
                ESCROW_ABI,
                signer
            );

            // Find bounty to get onChainId
            const bounty = bounties.find(b => b._id === viewBounty);

            if (!bounty?.onChainId) {
                alert("On-chain ID missing");
                return;
            }

            // Step 1 — Release funds
            const tx = await escrow.approveBounty(
                bounty.onChainId,
                submission.hunterWallet
            );

            await tx.wait();

            // Step 2 — Update DB
            await axios.post("/api/submission/approve", {
                submissionId: submission._id,
                bountyId: viewBounty,
            });

            alert("Funds released successfully!");
            setViewBounty(null);

        } catch (err) {
            console.error(err);
            alert("Approval failed");
        }
    };

    useEffect(() => {
        fetchBounties();
    }, []);

    const fetchBounties = async () => {
        try {
            const res = await axios.get("/api/bounty/all");
            setBounties(res.data.bounties);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <p className="text-center mt-6">Loading feed...</p>;

    if (bounties.length === 0)
        return <p className="text-center mt-6">No bounties yet</p>;

    return (
        <div className="max-w-xl mx-auto mt-6 space-y-4">
            {bounties.map((bounty) => (
                <div
                    key={bounty._id}
                    className="bg-white shadow-md rounded-xl p-4 border"
                >
                    <div className="flex justify-between mb-2">
                        <p className="font-semibold">@{bounty.username}</p>
                        <p className="text-green-600 font-medium">
                            ${bounty.reward} USDC
                        </p>
                    </div>

                    <p className="mb-3 text-gray-800">{bounty.description}</p>

                    <div className="text-sm text-gray-500">
                        📍 {bounty.location?.address || "Location not provided"}
                    </div>

                    <div className="text-xs text-gray-400 mt-2">
                        {new Date(bounty.createdAt).toLocaleString()}
                    </div>

                    <button
                        className="mt-3 bg-blue-600 text-white px-3 py-1 rounded"
                        onClick={() => openSubmission(bounty._id)}
                    >
                        Submit Proof
                    </button>

                    <button
                        className="mt-2 bg-gray-800 text-white px-3 py-1 rounded ml-2"
                        onClick={() => openSubmissions(bounty._id)}
                    >
                        View Submissions
                    </button>
                </div>
            ))}

            {/* Global Modal */}
            {selectedBounty && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg w-96 shadow-lg">
                        <h2 className="font-bold mb-3">Submit Proof</h2>

                        <input
                            placeholder="Image URL"
                            value={imageUrl}
                            onChange={(e) => setImageUrl(e.target.value)}
                            className="border w-full p-2 mb-2"
                        />

                        <textarea
                            placeholder="Description"
                            value={proofText}
                            onChange={(e) => setProofText(e.target.value)}
                            className="border w-full p-2 mb-3"
                        />

                        <button
                            onClick={submitProof}
                            className="bg-green-600 text-white px-4 py-2 rounded w-full"
                        >
                            Submit
                        </button>

                        <button
                            onClick={() => setSelectedBounty(null)}
                            className="mt-2 text-gray-500 w-full"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {viewBounty && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg w-[500px] max-h-[80vh] overflow-y-auto">
                        <h2 className="font-bold mb-4">Submissions</h2>

                        {submissions.length === 0 && (
                            <p>No submissions yet</p>
                        )}

                        {submissions.map((sub) => (
                            <div key={sub._id} className="border p-3 mb-3 rounded">
                                <p className="font-semibold">@{sub.username}</p>
                                <p className="text-sm mb-2">{sub.description}</p>

                                <img
                                    src={sub.mediaUrl}
                                    alt="proof"
                                    className="w-full h-40 object-cover rounded mb-2"
                                />

                                {sub.status === "pending" && (
                                    <button
                                        onClick={() => approveSubmission(sub)}
                                        className="bg-green-600 text-white px-3 py-1 rounded"
                                    >
                                        Approve
                                    </button>
                                )}

                                {sub.status === "approved" && (
                                    <p className="text-green-600 font-semibold">Approved</p>
                                )}
                            </div>
                        ))}

                        <button
                            onClick={() => setViewBounty(null)}
                            className="mt-3 text-gray-500 w-full"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
