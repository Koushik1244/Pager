// src\components\feed\BountyCard.tsx

"use client";

import { useState } from "react";
import { formatTimeAgo } from "@/lib/utils";
import MediaViewer from "./MediaViewer";
import { useUser } from "@/context/UserContext";
import { AiFillLike } from "react-icons/ai";
import { HiChatBubbleLeft, HiChatBubbleOvalLeft } from "react-icons/hi2";
import { MdChatBubble } from "react-icons/md";
import axios from "axios";
import { ethers } from "ethers";
import { ESCROW_ABI, ESCROW_ADDRESS } from "@/lib/contracts";
import { signAction } from "@/lib/signAction";
import Link from "next/link";
import { FaShareAlt } from "react-icons/fa";
import { useToast } from "@/components/ui/Toast";

const REFUND_ABI = [
    ...ESCROW_ABI,
    "function bounties(uint256) view returns (address creator, uint256 amount, bool active, uint256 deadline)",
];

const BOUNTY_FINISHED_MESSAGE = "This bounty is already finished on-chain. Reload to see its current status.";
const REFUND_REVERT_MESSAGES = new Map([
    ["Inactive", BOUNTY_FINISHED_MESSAGE],
    ["Not creator", "Only the bounty creator can request a refund."],
    ["Not expired", "This bounty has not expired yet."],
]);

type Props = {
    bounty: any;
    onAccept?: (bountyId: string) => void;
};

export default function BountyCard({ bounty, onAccept }: Props) {
    const { user } = useUser();
    const showToast = useToast();

    const isCreator = Boolean(user?.walletAddress && user._id === bounty.creator);
    const isCompleted = bounty.status === "completed";
    const isRefunded = bounty.status === "refunded";
    const hasExpiredStatus = bounty.status === "expired";
    const isExpired = bounty.deadline && new Date(bounty.deadline).getTime() < Date.now();
    const canRefund = isCreator && isExpired && (bounty.status === "open" || hasExpiredStatus);
    const isAcceptDisabled = Boolean(isExpired) || bounty.status !== "open";
    const [refundLoading, setRefundLoading] = useState(false);

    const shareBounty = async () => {
        const url = `${window.location.origin}/bounty/${bounty._id}`;
        try {
            if (navigator.share) {
                await navigator.share({
                    title: `Pager bounty: ${bounty.reward} USDC`,
                    text: bounty.description,
                    url,
                });
            } else {
                await navigator.clipboard.writeText(url);
                showToast("Bounty link copied.", "success");
            }
        } catch (error) {
            if (!(error instanceof DOMException && error.name === "AbortError")) {
                console.error(error);
                showToast("Could not share the bounty link.", "error");
            }
        }
    };

    const refund = async () => {
        if (!user?.walletAddress || !bounty.onChainId) return;

        try {
            setRefundLoading(true);

            if (!(window as any).ethereum) {
                showToast("No browser wallet was found.", "error");
                return;
            }

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
            const network = await provider.getNetwork();
            if (network.chainId !== 10143n) {
                showToast("Please switch to Monad Testnet.", "error");
                return;
            }

            const signer = await provider.getSigner();
            const escrow = new ethers.Contract(ESCROW_ADDRESS, REFUND_ABI, signer);

            let isInactive = false;
            try {
                const onChainBounty = await escrow.bounties(bounty.onChainId);
                isInactive = onChainBounty.active === false;
            } catch {
                // If the read fails, let the contract validate the refund.
            }

            if (isInactive) {
                showToast(BOUNTY_FINISHED_MESSAGE, "error");
                return;
            }

            const tx = await escrow.refundExpired(bounty.onChainId);
            await tx.wait();

            const auth = await signAction("bounty/refund", bounty._id);

            await axios.post("/api/bounty/refund", {
                bountyId: bounty._id,
                ...auth,
                txHash: tx.hash,
            });

            showToast("Bounty refunded successfully.", "success");
            window.location.reload();
        } catch (error) {
            console.error(error);
            const message = ethers.isError(error, "CALL_EXCEPTION") && error.reason
                ? REFUND_REVERT_MESSAGES.get(error.reason)
                : undefined;
            showToast(message ?? "Refund failed.", "error");
        } finally {
            setRefundLoading(false);
        }
    };

    return (
        <article
            className="
      bounty-card
      bg-cardLight dark:bg-cardDark
      rounded-2xl overflow-hidden
      shadow-xl
      border border-primary/10
      hover:border-primary/40
      transition-all
      "
        >
            {/* Header */}
            <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {/* Avatar (mock) */}
                    <img
                        src={`https://i.pravatar.cc/40?u=${bounty.username}`}
                        className="w-10 h-10 rounded-full object-cover border border-primary/20"
                    />

                    <div>
                        <div className="flex items-center gap-2">
                            <p className="font-semibold text-textMainLight dark:text-textMainDark text-sm">
                                {bounty.username}
                            </p>

                            {hasExpiredStatus && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 font-semibold">
                                    Expired
                                </span>
                            )}
                            {(isCompleted || isRefunded) && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-500 font-semibold">
                                    {isRefunded ? "Refunded" : "Completed"}
                                </span>
                            )}
                        </div>

                        <p className="text-xs text-primary font-medium">
                            Bounty: {bounty.reward} USDC
                        </p>
                    </div>
                </div>

                <span className="text-xs text-textMutedDark">
                    {/* {new Date(bounty.createdAt).toLocaleString()} */}
                    {formatTimeAgo(bounty.createdAt)}
                </span>
            </div>

            {/* Description */}
            <div className="px-4 pb-3">
                <p className="text-sm leading-relaxed text-textMainLight dark:text-textMainDark">
                    {bounty.description}
                </p>
            </div>

            {/* Media */}
            <div className="px-4 pb-4">
                <MediaViewer
                    mediaUrl={bounty.mediaUrl}
                    lat={bounty.location?.lat}
                    lng={bounty.location?.lng}
                />
            </div>

            {/* Actions */}
            <div className="px-4 py-3 border-t border-primary/10 flex items-center justify-between">
                <div className="flex items-center gap-6 text-textMutedDark">
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

                <div className="flex items-center gap-4">
                    <Link href={`/bounty/${bounty._id}`} className="text-xs font-semibold text-primary hover:underline">
                        View
                    </Link>
                    <button onClick={shareBounty} className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                        <FaShareAlt aria-hidden="true" />
                        Share
                    </button>

                {/* Right Action */}
                {canRefund && (
                    <button
                        onClick={refund}
                        disabled={refundLoading}
                        className="bg-primary hover:bg-primary/80 text-white text-xs font-bold px-4 py-2 rounded-lg transition shadow-glow"
                    >
                        {refundLoading ? "Refunding..." : "Refund"}
                    </button>
                )}
                {!isCreator && !isCompleted && !isRefunded && (
                    <button
                        onClick={() => onAccept?.(bounty._id)}
                        disabled={isAcceptDisabled}
                        className="
    bg-primary hover:bg-primary/80
    text-white text-xs font-bold
    px-4 py-2 rounded-lg
    transition shadow-glow
    disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-primary
    "
                    >
                        Accept
                    </button>

                )}
                {isCompleted && (
                    <span className="text-xs font-semibold text-green-500">
                        Closed
                    </span>
                )}
                {isRefunded && (
                    <span className="text-xs font-semibold text-green-500">
                        Refunded
                    </span>
                )}
                </div>
            </div>
        </article>
    );
}
