"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { IoMdArrowRoundForward, IoMdCloseCircle } from "react-icons/io";
import { FaSearch } from "react-icons/fa";
import { ImSearch } from "react-icons/im";

export default function SearchPage() {
    const [query, setQuery] = useState("");
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const searchUsers = async (value: string) => {
        if (!value.trim()) {
            setUsers([]);
            return;
        }

        setLoading(true);
        try {
            const res = await axios.get(`/api/user/search?q=${value}`);
            setUsers(res.data.users || []);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    useEffect(() => {
        const delay = setTimeout(() => {
            searchUsers(query);
        }, 400);

        return () => clearTimeout(delay);
    }, [query]);

    return (
        <main className="min-h-screen bg-backgroundLight dark:bg-backgroundDark transition-colors duration-300">

            <div className="max-w-2xl mx-auto px-4 py-10">

                {/* Title */}
                <h1 className="text-3xl font-bold mb-6 text-textMainLight dark:text-textMainDark">
                    Search Users
                </h1>

                {/* Search Box */}
                <div
                    className="
                    flex items-center gap-3
                    px-4 h-14
                    rounded-xl
                    border border-primary/20
                    bg-white dark:bg-cardDark
                    backdrop-blur-md
                    focus-within:shadow-glow
                    transition
                    "
                >
                    <span className="text-primary">
                        <FaSearch size={20} />
                    </span>

                    <input
                        type="text"
                        placeholder="Search username..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="
                        w-full bg-transparent outline-none
                        text-textMainLight dark:text-textMainDark
                        placeholder:text-textMutedDark
                        "
                    />

                    {query && (
                        <button
                            onClick={() => setQuery("")}
                            className="text-textMutedDark hover:text-primary"
                        >
                            <span className="material-symbols-outlined">
                                <IoMdCloseCircle size={20} />
                            </span>
                        </button>
                    )}
                </div>

                {/* Results */}
                <div className="mt-8 space-y-3">

                    {loading && (
                        <p className="text-textMutedDark text-sm">
                            Searching...
                        </p>
                    )}

                    {!loading && query && users.length === 0 && (
                        <p className="text-textMutedDark text-sm">
                            No users found
                        </p>
                    )}

                    {users.map((user) => (
                        <div
                            key={user._id}
                            onClick={() => router.push(`/profile/${user.username}`)}
                            className="
                            flex items-center justify-between
                            p-4
                            rounded-xl
                            border border-primary/10
                            bg-white dark:bg-cardDark
                            hover:border-primary/40
                            hover:shadow-lg
                            cursor-pointer
                            transition-all
                            "
                        >
                            <div className="flex items-center gap-4">
                                {/* Mock Avatar */}
                                <img
                                    src={`https://i.pravatar.cc/60?u=${user.username}`}
                                    className="w-12 h-12 rounded-full border border-primary/20"
                                />

                                <div>
                                    <p className="font-semibold text-textMainLight dark:text-textMainDark">
                                        @{user.username}
                                    </p>

                                    <p className="text-xs text-textMutedDark font-mono">
                                        {user.walletAddress.slice(0, 6)}...
                                        {user.walletAddress.slice(-4)}
                                    </p>
                                </div>
                            </div>

                            <div className="text-primary flex items-center gap-1 text-sm font-semibold">
                                View
                                <span className="text-sm">
                                    <IoMdArrowRoundForward size={20} />
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </main>
    );
}
