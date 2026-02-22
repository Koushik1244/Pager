"use client";

import { useTheme } from "@/context/ThemeContext";

export default function ThemeToggle() {
    const { dark, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="px-3 py-1 rounded-lg border border-borderLight dark:border-borderDark"
        >
            {dark ? "Light" : "Dark"}
        </button>
    );
}
