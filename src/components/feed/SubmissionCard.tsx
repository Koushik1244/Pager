// src\components\feed\SubmissionCard.tsx

"use client";

import { useEffect, useState } from "react";
import MediaViewer from "./MediaViewer";
import { useUser } from "@/context/UserContext";
import axios from "axios";
import { ethers } from "ethers";
import { ESCROW_ADDRESS, ESCROW_ABI } from "@/lib/contracts";
import { formatTimeAgo } from "@/lib/utils";
import { signAction } from "@/lib/signAction";
import { useToast } from "@/components/ui/Toast";
import { HiChatBubbleLeft } from "react-icons/hi2";
import { AiFillLike } from "react-icons/ai";

type Props = {
    submission: any;
    bounty: any;
    onApproved?: () => void;
};

const APPROVAL_ABI = [
    ...ESCROW_ABI,
    "function bounties(uint256) view returns (address creator, uint256 amount, bool active, uint256 deadline)",
    "event BountyApproved(uint256 indexed bountyId, address indexed hunter, uint256 amount)",
];

export default function SubmissionCard({ submission, bounty, onApproved }: Props) {
    const { user } = useUser();
    const showToast = useToast();

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [syncLoading, setSyncLoading] = useState(false);
    const [syncError, setSyncError] = useState<string | null>(null);
    const [rejectLoading, setRejectLoading] = useState(false);
    const [approvalTxHash, setApprovalTxHash] = useState<string | null>(null);
    const approvalStorageKey = `pager:approval:${submission._id}`;

    useEffect(() => {
        try {
            const savedHash = localStorage.getItem(approvalStorageKey);
            if (savedHash) {
                setApprovalTxHash(savedHash);
                setSyncError("Approval transaction found. Retry the database sync.");
            }
        } catch {
            // Approval can still be recovered from the chain.
        }
    }, [approvalStorageKey]);

    const isCreator = user?.username === bounty.username;
    const isPending = submission.status === "pending";

    const ensureMonadTestnet = async () => {
        try {
            await (window as any).ethereum.request({
                method: "wallet_switchEthereumChain",
                params: [{ chainId: "0x279F" }],
            });
        } catch (switchError: any) {
            if (switchError.code === 4902) {
                await (window as any).ethereum.request({
                    method: "wallet_addEthereumChain",
                    params: [{
                        chainId: "0x279F",
                        chainName: "Monad Testnet",
                        rpcUrls: [process.env.NEXT_PUBLIC_MONAD_RPC],
                        nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
                        blockExplorerUrls: ["https://explorer.monad.xyz"],
                    }],
                });
            } else {
                throw switchError;
            }
        }

        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const confirmedNetwork = await provider.getNetwork();
        if (confirmedNetwork.chainId !== 10143n) {
            showToast("Please switch to Monad Testnet.", "error");
            return null;
        }

        return provider;
    };

    const syncApproval = async (txHash: string) => {
        setSyncLoading(true);
        setSyncError(null);

        try {
            const auth = await signAction("submission/approve", submission._id);
            await axios.post("/api/submission/approve", {
                submissionId: submission._id,
                bountyId: bounty._id,
                ...auth,
                txHash,
            });
            try {
                localStorage.removeItem(approvalStorageKey);
            } catch {
                // The database sync already succeeded.
            }

            setConfirmOpen(false);
            onApproved?.();
            showToast("Funds released successfully.", "success");
        } catch (error) {
            console.error("Approval confirmed on-chain, but database sync failed", error);
            const apiMessage = axios.isAxiosError(error)
                ? error.response?.data?.error
                : null;
            setSyncError(
                typeof apiMessage === "string"
                    ? `Pager could not sync the approval: ${apiMessage}`
                    : "Funds were released on-chain, but Pager could not sync the approval. Retry the database sync."
            );
        } finally {
            setSyncLoading(false);
        }
    };

    const recoverApprovalHash = async (escrow: ethers.Contract, provider: ethers.BrowserProvider) => {
        try {
            const savedHash = localStorage.getItem(approvalStorageKey);
            if (savedHash) return savedHash;
        } catch {
            // Continue with the event log.
        }

        if (approvalTxHash) return approvalTxHash;

        try {
            const latestBlock = await provider.getBlockNumber();
            const filter = escrow.filters.BountyApproved(bounty.onChainId);
            for (const range of [90_000, 10_000, 1_000]) {
                try {
                    const logs = await escrow.queryFilter(filter, Math.max(0, latestBlock - range));
                    const latest = logs.sort(
                        (a, b) => b.blockNumber - a.blockNumber || b.index - a.index
                    )[0];
                    return latest?.transactionHash ?? null;
                } catch {
                    // Retry with a smaller block range when the RPC rejects the query.
                }
            }
        } catch {
            // A missing provider response is reported to the user below.
        }
        return null;
    };

    const retryApprovalSync = async () => {
        try {
            if (!(window as any).ethereum) {
                showToast("No browser wallet was found.", "error");
                return;
            }
            const provider = await ensureMonadTestnet();
            if (!provider) return;
            const signer = await provider.getSigner();
            const escrow = new ethers.Contract(ESCROW_ADDRESS, APPROVAL_ABI, signer);
            const txHash = await recoverApprovalHash(escrow, provider);
            if (!txHash) {
                showToast("Payment found on-chain but the approval transaction hash could not be located.", "error");
                return;
            }
            setApprovalTxHash(txHash);
            await syncApproval(txHash);
        } catch (error) {
            console.error(error);
            showToast("Approval sync failed.", "error");
        }
    };

    const syncInactiveApproval = async (escrow: ethers.Contract, provider: ethers.BrowserProvider) => {
        showToast("Already paid on-chain, syncing", "success");
        const txHash = await recoverApprovalHash(escrow, provider);
        if (!txHash) {
            showToast("Payment found on-chain but the approval transaction hash could not be located.", "error");
            return;
        }
        setApprovalTxHash(txHash);
        await syncApproval(txHash);
    };

    // 🔐 On-chain approval, followed by a retryable database sync
    const approve = async () => {
        try {
            setLoading(true);
            setSyncError(null);

            if (!(window as any).ethereum) {
                showToast("No browser wallet was found.", "error");
                return;
            }

            const provider = await ensureMonadTestnet();
            if (!provider) return;
            const signer = await provider.getSigner();

            const escrow = new ethers.Contract(
                ESCROW_ADDRESS,
                APPROVAL_ABI,
                signer
            );

            let onChainBounty: { active: boolean } | null = null;
            try {
                onChainBounty = await escrow.bounties(bounty.onChainId);
            } catch {
                // Preserve the transaction path if the on-chain read fails.
            }
            if (onChainBounty?.active === false) {
                await syncInactiveApproval(escrow, provider);
                return;
            }

            // Release funds on-chain first so the transaction can be independently verified.
            let tx: ethers.ContractTransactionResponse;
            try {
                tx = await escrow.approveBounty(
                    bounty.onChainId,
                    submission.hunterWallet
                );
            } catch (error) {
                if (ethers.isError(error, "CALL_EXCEPTION") && error.reason === "Inactive") {
                    await syncInactiveApproval(escrow, provider);
                    return;
                }
                throw error;
            }
            setApprovalTxHash(tx.hash);
            try {
                localStorage.setItem(approvalStorageKey, tx.hash);
            } catch {
                // The event log can recover the hash after a reload.
            }

            const receipt = await tx.wait();
            if (!receipt || receipt.status !== 1) {
                throw new Error("Approval transaction was not confirmed successfully");
            }

            await syncApproval(tx.hash);

        } catch (err) {
            console.error(err);
            showToast(approvalTxHash
                ? `Approval failed after transaction ${approvalTxHash}`
                : "Approval failed", "error");
        } finally {
            setLoading(false);
        }
    };

    const reject = async () => {
        try {
            setRejectLoading(true);

            if (!(window as any).ethereum) {
                showToast("No browser wallet was found.", "error");
                return;
            }

            const provider = await ensureMonadTestnet();
            if (!provider) return;
            const signer = await provider.getSigner();

            const escrow = new ethers.Contract(
                ESCROW_ADDRESS,
                ESCROW_ABI,
                signer
            );

            const tx = await escrow.reject(bounty.onChainId, submission.hunterWallet);

            await tx.wait();

            const auth = await signAction("submission/reject", submission._id);

            await axios.post("/api/submission/reject", {
                submissionId: submission._id,
                bountyId: bounty._id,
                ...auth,
            });

            onApproved?.();

            showToast("Submission rejected successfully.", "success");
        } catch (err) {
            console.error(err);
            showToast("Rejection failed.", "error");
        } finally {
            setRejectLoading(false);
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
                    {submission.status === "rejected" && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-500">
                            Not selected
                        </span>
                    )}
                </div>

                {/* Description */}
                {submission.description && (
                    <div className="px-3 pb-2">
                        <p className="text-xs">{submission.description}</p>
                    </div>
                )}

                {submission.status === "rejected" && (
                    <p className="px-3 pb-2 text-xs text-textMutedDark">
                        This submission was not selected for the bounty.
                    </p>
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
                        <button className="flex items-center gap-1 hover:text-red-400 active:scale-90 transition">
                            <span className="text-[20px]">
                                <AiFillLike size={24} />
                            </span>
                            <span className="text-xs font-semibold">0</span>
                        </button>

                        <button className="flex items-center gap-1 hover:text-primary transition">
                            <span className="text-[20px]">
                                <HiChatBubbleLeft size={24} />
                            </span>
                            <span className="text-xs font-semibold">0</span>
                        </button>

                    </div>

                    {/* Creator Approve */}
                    {isCreator && isPending && bounty.status !== "completed" && (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={reject}
                                disabled={rejectLoading}
                                className="
                                bg-primary text-white text-[10px]
                                px-3 py-1 rounded-md
                                hover:bg-primary/80 transition
                            "
                            >
                                {rejectLoading ? "Processing..." : "Reject"}
                            </button>

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
                        </div>
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

                        {approvalTxHash && (
                            <a
                                href={`https://testnet.monadscan.com/tx/${approvalTxHash}`}
                                target="_blank"
                                rel="noreferrer"
                                className="block text-xs text-primary underline"
                            >
                                Transaction: {approvalTxHash}
                            </a>
                        )}

                        {syncError && (
                            <p role="alert" className="text-xs text-red-500">
                                {syncError}
                            </p>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmOpen(false)}
                                className="flex-1 py-2 rounded-lg border border-borderLight dark:border-borderDark"
                            >
                                Cancel
                            </button>

                            {syncError && approvalTxHash ? (
                                <button
                                    onClick={retryApprovalSync}
                                    disabled={syncLoading}
                                    className="flex-1 py-2 rounded-lg bg-primary text-white shadow-glow disabled:opacity-50"
                                >
                                    {syncLoading ? "Syncing..." : "Retry sync"}
                                </button>
                            ) : (
                                <button
                                    onClick={approve}
                                    disabled={loading || syncLoading}
                                    className="flex-1 py-2 rounded-lg bg-primary text-white shadow-glow disabled:opacity-50"
                                >
                                    {loading ? "Processing..." : "Confirm"}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
