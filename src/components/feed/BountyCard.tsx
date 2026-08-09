// src\components\feed\BountyCard.tsx

"use client";

import { formatTimeAgo } from "@/lib/utils";
import MediaViewer from "./MediaViewer";
import { useUser } from "@/context/UserContext";
import { AiFillLike } from "react-icons/ai";
import { HiChatBubbleLeft, HiChatBubbleOvalLeft } from "react-icons/hi2";
import { MdChatBubble } from "react-icons/md";
import { FaShare } from "react-icons/fa";

type Props = {
    bounty: any;
    onAccept?: (bountyId: string) => void;
};

export default function BountyCard({ bounty, onAccept }: Props) {
    const { user } = useUser();

    const isCreator = user?.username === bounty.username;
    const isCompleted = bounty.status === "completed";

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

                            {isCompleted && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-500 font-semibold">
                                    Completed
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

                    <button
                        onClick={() => {
                            navigator.clipboard.writeText(
                                `${window.location.origin}/bounty/${bounty._id}`
                            );
                            alert("Link copied");
                        }}
                        className="flex items-center gap-1 hover:text-green-400 transition"
                    >
                        <span className="text-[20px]">
                            <FaShare size={24} />
                        </span>
                    </button>
                </div>

                {/* Right Action */}
                {!isCreator && !isCompleted && (
                    <button
                        onClick={() => onAccept?.(bounty._id)}
                        className="
    bg-primary hover:bg-primary/80
    text-white text-xs font-bold
    px-4 py-2 rounded-lg
    transition shadow-glow
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
            </div>
        </article>
    );
}
