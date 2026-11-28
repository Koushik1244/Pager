// src\components\feed\SubmissionCard.tsx

"use client";

import { useState } from "react";
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
const approvalInterface = new ethers.Interface(APPROVAL_ABI);

export default function SubmissionCard({ submission, bounty, onApproved }: Props) {
    const { user } = useUser();
    const showToast = useToast();

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [approvalLabel, setApprovalLabel] = useState<string | null>(null);
    const [syncLoading, setSyncLoading] = useState(false);
    const [syncError, setSyncError] = useState<string | null>(null);
    const [rejectLoading, setRejectLoading] = useState(false);
    const [approvalTxHash, setApprovalTxHash] = useState<string | null>(null);
    const approvalStorageKey = `pager:approval:${submission._id}`;

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

    const isMatchingApprovalReceipt = (receipt: ethers.TransactionReceipt | null) => {
        if (receipt?.status !== 1) return false;

        const topics = approvalInterface.encodeFilterTopics("BountyApproved", [
            bounty.onChainId,
            submission.hunterWallet.toLowerCase(),
        ]);
        return receipt.logs.some((log) =>
            log.address.toLowerCase() === ESCROW_ADDRESS.toLowerCase() &&
            topics.every((topic, index) => topic === log.topics[index]?.toLowerCase())
        );
    };

    const recoverApprovalHash = async (escrow: ethers.Contract, provider: ethers.BrowserProvider) => {
        const isValidHash = async (hash: string) => {
            if (!ethers.isHexString(hash, 32)) return false;
            try {
                return isMatchingApprovalReceipt(await provider.getTransactionReceipt(hash));
            } catch {
                return false;
            }
        };

        let savedHash: string | null = null;
        try {
            savedHash = localStorage.getItem(approvalStorageKey);
        } catch {
            // Continue with the event log.
        }
        if (savedHash && await isValidHash(savedHash)) return savedHash;
        if (approvalTxHash && approvalTxHash !== savedHash && await isValidHash(approvalTxHash)) {
            return approvalTxHash;
        }

        try {
            const latestBlock = await provider.getBlockNumber();
            const filter = escrow.filters.BountyApproved(bounty.onChainId, submission.hunterWallet.toLowerCase());
            for (const range of [90_000, 10_000, 1_000]) {
                try {
                    const logs = await escrow.queryFilter(filter, Math.max(0, latestBlock - range));
                    const newestFirst = logs.sort((a, b) => b.blockNumber - a.blockNumber || b.index - a.index);
                    for (const log of newestFirst) {
                        if (await isValidHash(log.transactionHash)) return log.transactionHash;
                    }
                    return null;
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
            setApprovalLabel("Checking approval...");
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
                showToast("Could not verify an on-chain approval for this hunter. Try again.", "error");
                return;
            }
            setApprovalTxHash(txHash);
            await syncApproval(txHash);
        } catch (error) {
            console.error(error);
            showToast("Approval sync failed.", "error");
        } finally {
            setApprovalLabel(null);
        }
    };

    const syncInactiveApproval = async (escrow: ethers.Contract, provider: ethers.BrowserProvider) => {
        setApprovalLabel("Checking approval...");
        const txHash = await recoverApprovalHash(escrow, provider);
        if (!txHash) {
            showToast(
                "This bounty is already finished on-chain, but no approval for this hunter was found. It may have been refunded or paid to someone else. Reload to see its current status.",
                "error"
            );
            return;
        }
        showToast("Already paid on-chain, syncing", "success");
        setApprovalTxHash(txHash);
        await syncApproval(txHash);
    };

    // 🔐 On-chain approval, followed by a retryable database sync
    const approve = async () => {
        let sentHash: string | null = null;
        try {
            setApprovalLabel("Checking bounty...");
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
                setApprovalLabel("Confirm in wallet...");
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
            sentHash = tx.hash;
            setApprovalTxHash(sentHash);
            setApprovalLabel("Waiting for confirmation...");
            try {
                localStorage.setItem(approvalStorageKey, sentHash);
            } catch {
                // The event log can recover the hash after a reload.
            }

            const receipt = await tx.wait();
            if (!isMatchingApprovalReceipt(receipt)) {
                throw new Error("Approval receipt did not confirm payment for this bounty and hunter");
            }

            await syncApproval(sentHash);

        } catch (err) {
            console.error(err);
            showToast(sentHash
                ? `Approval failed after transaction ${sentHash}`
                : "Approval failed", "error");
        } finally {
            setApprovalLabel(null);
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
relative mt-3 w-full min-w-0 max-w-full md:ml-10 md:w-auto
before:hidden md:before:block before:absolute before:left-[-14px] before:top-4
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
                <div className="flex min-w-0 items-center justify-between gap-2 p-3">
                    <div className="flex min-w-0 items-center gap-2">
                        <img
                            src={`https://i.pravatar.cc/40?u=${submission.username}`}
                            className="h-8 w-8 shrink-0 rounded-full border border-primary/20"
                        />

                        <div className="min-w-0 [overflow-wrap:anywhere]">
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
                        <p className="break-words text-xs">{submission.description}</p>
                    </div>
                )}

                {submission.status === "rejected" && (
                    <p className="px-3 pb-2 text-xs text-textMutedDark">
                        This submission was not selected for the bounty.
                    </p>
                )}

                {/* Media */}
                <div className="min-w-0 max-w-full px-3 pb-3">
                    <MediaViewer
                        mediaUrl={submission.mediaUrl}
                        lat={bounty.location.lat}
                        lng={bounty.location.lng}
                    />
                </div>

                {/* Actions */}
                <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 border-t border-primary/10 px-3 py-2">
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
                        <div className="flex w-full min-w-0 max-w-full flex-col gap-2 sm:ml-auto sm:w-auto sm:flex-row">
                            <button
                                onClick={reject}
                                disabled={rejectLoading}
                                className="
                                min-h-11 min-w-11 bg-primary text-white text-sm
                                px-3 py-2 rounded-md
                                hover:bg-primary/80 transition
                            "
                            >
                                {rejectLoading ? "Processing..." : "Reject"}
                            </button>

                            <button
                                onClick={() => setConfirmOpen(true)}
                                className="
                                min-h-11 min-w-11 bg-primary text-white text-sm
                                px-3 py-2 rounded-md
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
                                    disabled={approvalLabel !== null || syncLoading}
                                    className="flex-1 py-2 rounded-lg bg-primary text-white shadow-glow disabled:opacity-50"
                                >
                                    {syncLoading ? "Syncing..." : approvalLabel ?? "Retry sync"}
                                </button>
                            ) : (
                                <button
                                    onClick={approve}
                                    disabled={approvalLabel !== null || syncLoading}
                                    className="flex-1 py-2 rounded-lg bg-primary text-white shadow-glow disabled:opacity-50"
                                >
                                    {syncLoading ? "Syncing..." : approvalLabel ?? "Confirm"}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
