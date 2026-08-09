"use client";

import { useEffect, useState } from "react";
import GlassModal from "../ui/GlassModal";
import GlassCard from "../ui/GlassCard";

type Props = {
    open: boolean;
    username: string;
    setUsername: (v: string) => void;
    onSave: () => void;
    onClose?: () => void;
};

export default function CreateUsernameModal({
    open,
    username,
    setUsername,
    onSave,
    onClose,
}: Props) {
    const suggestions = ["pager_0x", "explorer_nyc", "web3_local"];

    return (
        <GlassModal onClose={onClose} open={open} maxWidth="max-w-md">
            <GlassCard className="p-8 text-center">
                {/* Icon */}
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
                    <div className="h-6 w-6 rounded-full bg-primary" />
                </div>

                <h2 className="text-2xl font-bold text-textMainLight dark:text-textMainDark mb-2">
                    Choose your username
                </h2>

                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                    This is how you will be identified on Pager.
                </p>

                {/* Input */}
                <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g., satoshi_pager"
                    className="
            w-full rounded-xl
            bg-white dark:bg-neutralDark
            border border-borderLight dark:border-borderDark
            px-4 py-3 text-sm outline-none
            focus:ring-2 focus:ring-primary/40
          "
                />

                {/* Suggestions */}
                <p className="mt-4 mb-2 text-[10px] tracking-widest text-gray-400">
                    SUGGESTIONS
                </p>

                <div className="flex flex-wrap justify-center gap-2 mb-6">
                    {suggestions.map((name) => (
                        <button
                            key={name}
                            type="button"
                            onClick={() => setUsername(name)}
                            className="
                px-3 py-1 rounded-full text-xs
                bg-gray-100 dark:bg-neutralDark
                hover:bg-primary/10 dark:hover:bg-primary/20
              "
                        >
                            {name}
                        </button>
                    ))}
                </div>

                <button
                    onClick={onSave}
                    disabled={!username.trim()}
                    className="
            w-full py-3 rounded-xl
            bg-primary text-white font-semibold
            shadow-glow
            hover:scale-[1.02] active:scale-95
            transition-all duration-200
            disabled:opacity-50
          "
                >
                    Continue to Feed
                </button>
            </GlassCard>
        </GlassModal>
    );
}
