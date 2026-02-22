"use client";

import { useState } from "react";
import MediaViewer from "./MediaViewer";
import { useUser } from "@/context/UserContext";
import axios from "axios";
import { ethers } from "ethers";
import { ESCROW_ADDRESS, ESCROW_ABI } from "@/lib/contracts";
import { formatTimeAgo } from "@/lib/utils";

type Props = {
    submission: any;
    bounty: any;
    onApproved?: () => void;
};

export default function SubmissionCard({ submission, bounty, onApproved }: Props) {
    const { user } = useUser();

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const isCreator = user?.username === bounty.username;
    const isPending = submission.status === "pending";

    // 🔐 On-chain approval + DB update
    const approve = async () => {
        try {
            setLoading(true);

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

            // 1️⃣ Release funds on-chain
            const tx = await escrow.approveBounty(
                bounty.onChainId,
                submission.hunterWallet
            );

            await tx.wait();

            // 2️⃣ Update DB
            await axios.post("/api/submission/approve", {
                submissionId: submission._id,
                bountyId: bounty._id,
            });

            setConfirmOpen(false);
            onApproved?.();

            alert("Funds released successfully!");

        } catch (err) {
            console.error(err);
            alert("Approval failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div
                className="
mt-3 ml-10 left-32 relative
before:absolute before:left-[-14px] before:top-4
before:w-2 before:h-2 before:rounded-full
before:bg-primary/40

bg-primary/5
dark:bg-[linear-gradient(135deg,rgba(134,107,255,0.18),rgba(255,120,180,0.10))]

border border-primary/20
dark:border-primary/30
rounded-2xl
shadow-md
"           >
                {/* Header */}
                <div className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <img
                            src={`https://i.pravatar.cc/40?u=${submission.username}`}
                            className="w-8 h-8 rounded-full border border-primary/20"
                        />

                        <div>
                            <p className="text-xs font-semibold">
                                {submission.username}
                            </p>

                            <p className="text-[10px] text-textMutedDark">
                                {new Date(submission.createdAt).toLocaleString()}
                                {/* {formatTimeAgo(submission.createdAt)} */}
                            </p>
                        </div>
                    </div>

                    {submission.status === "approved" && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-500">
                            Approved
                        </span>
                    )}
                </div>

                {/* Description */}
                {submission.description && (
                    <div className="px-3 pb-2">
                        <p className="text-xs">{submission.description}</p>
                    </div>
                )}

                {/* Media */}
                <div className="px-3 pb-3">
                    <MediaViewer
                        mediaUrl={submission.mediaUrl}
                        lat={bounty.location.lat}
                        lng={bounty.location.lng}
                    />
                </div>

                {/* Actions */}
                <div className="px-3 py-2 border-t border-primary/10 flex items-center justify-between">
                    <div className="flex items-center gap-5 text-textMutedDark">
                        <button className="flex items-center gap-1 hover:text-red-400 transition">
                            <span className="material-symbols-outlined text-[18px]">
                                favorite
                            </span>
                            <span className="text-[10px]">0</span>
                        </button>

                        <button className="flex items-center gap-1 hover:text-primary transition">
                            <span className="material-symbols-outlined text-[18px]">
                                chat_bubble
                            </span>
                            <span className="text-[10px]">0</span>
                        </button>

                        <button
                            onClick={() =>
                                navigator.clipboard.writeText(
                                    `${window.location.origin}/submission/${submission._id}`
                                )
                            }
                            className="hover:text-green-400"
                        >
                            <span className="material-symbols-outlined text-[18px]">
                                share
                            </span>
                        </button>
                    </div>

                    {/* Creator Approve */}
                    {isCreator && isPending && bounty.status !== "completed" && (
                        <button
                            onClick={() => setConfirmOpen(true)}
                            className="
                                bg-primary text-white text-[10px]
                                px-3 py-1 rounded-md
                                hover:bg-primary/80 transition
                            "
                        >
                            Approve
                        </button>
                    )}
                </div>
            </div>

            {/* Confirmation Modal */}
            {confirmOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="glass-modal p-6 w-[320px] space-y-4 text-center">
                        <h3 className="font-semibold text-textMainLight dark:text-textMainDark">
                            Release funds to hunter?
                        </h3>

                        <p className="text-xs text-textMutedDark">
                            {bounty.reward} USDC will be released.
                            Platform fee: 2%
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmOpen(false)}
                                className="flex-1 py-2 rounded-lg border border-borderLight dark:border-borderDark"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={approve}
                                disabled={loading}
                                className="flex-1 py-2 rounded-lg bg-primary text-white shadow-glow"
                            >
                                {loading ? "Processing..." : "Confirm"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
