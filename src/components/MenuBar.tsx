"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { LayoutDashboard, Map, Search, UserRound } from "lucide-react";
import ConnectWallet from "@/components/ConnectWallet";

const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/search", label: "Search", icon: Search },
    { href: "/map", label: "Map", icon: Map },
    { href: "/profile", label: "Profile", icon: UserRound },
];

export default function MenuBar() {
    const pathname = usePathname();
    const router = useRouter();

    const [isDark, setIsDark] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [visible, setVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0); // ✅ NEW

    const isMapPage = pathname === "/map";
    const isLanding = pathname === "/";

    // Theme init
    useEffect(() => {
        const stored = localStorage.getItem("theme");

        if (stored === "dark") {
            document.documentElement.classList.add("dark");
            setIsDark(true);
        } else {
            document.documentElement.classList.remove("dark");
            setIsDark(false);
        }

        setMounted(true);
    }, []);

    // ✅ NEW: Scroll hide/show (all pages)
    useEffect(() => {
        const handleScroll = () => {
            const currentY = window.scrollY;

            // Scroll down → hide
            if (currentY > lastScrollY && currentY > 80) {
                setVisible(false);
            } else {
                // Scroll up → show
                setVisible(true);
            }

            setLastScrollY(currentY);
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, [lastScrollY]);

    // ✅ UPDATED: Map page special behavior
    useEffect(() => {
        if (!isMapPage) return;

        setVisible(false); // hidden by default

        const handleMouseMove = (e: MouseEvent) => {
            if (e.clientY < 80) {
                setVisible(true);
            } else if (window.scrollY === 0) {
                setVisible(false);
            }
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, [isMapPage]);

    if (!mounted) return null;

    const header = (
        <header
            className={`
        sticky top-0 z-[1000]  // ✅ CHANGED: sticky NOT fixed
        transition-transform duration-300 ease-out
        ${visible ? "translate-y-0" : "-translate-y-full"}
        ${isMapPage ? "max-md:translate-y-0" : ""}
        max-md:pt-[calc(0.75rem+env(safe-area-inset-top))]
        bg-white/90 dark:bg-[#1a1530]/95
        backdrop-blur-md
        border-b border-borderLight/50 dark:border-borderDark/50
        px-5 py-3 lg:px-12
      `}
        >
            <div className="mx-auto flex max-w-6xl items-center justify-between">
                {/* Logo */}
                <button
                    type="button"
                    onClick={() => router.push("/")}
                    className="flex items-center hover:scale-105 transition-transform duration-200"
                >
                    <div className="relative h-9 w-28">
                        <Image
                            src="/pager-logo.svg"
                            alt="Pager logo"
                            fill
                            sizes="40px"
                            className="object-contain"
                            priority
                        />
                    </div>
                </button>

                {/* Nav */}
                <nav className="hidden md:flex items-center gap-7">
                    {isLanding && <a href="#how-it-works" className="text-sm font-semibold text-gray-500 transition hover:text-primary dark:text-gray-400">How it works</a>}
                    {navItems.map((item) => {
                        const isActive = pathname.startsWith(item.href);

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`group relative px-1 py-1 text-md font-semibold transition-colors ${isActive
                                        ? "text-primary"
                                        : "text-gray-500 dark:text-gray-400 hover:text-primary"
                                    }`}
                            >
                                {item.label}

                                <span
                                    className={`absolute -bottom-1 left-1/2 -translate-x-1/2 h-0.5 rounded-full transition-all duration-300 ${isActive
                                            ? "w-8 bg-primary shadow-glow"
                                            : "w-0 group-hover:w-6 group-hover:bg-primary/70"
                                        }`}
                                />
                            </Link>
                        );
                    })}
                </nav>

                {/* Right */}
                <div className="flex items-center gap-3">
                    <ConnectWallet
                        showLoginText={false}
                        showUserName={true}
                        showLogoutButton={false}
                        showAvatarDropdown={true}
                    />
                </div>
            </div>
        </header>
    );

    return (
        <>
            {header}
            <nav
                aria-label="Mobile navigation"
                className="fixed inset-x-0 bottom-0 z-40 h-[var(--mobile-tab-bar-height)] border-t border-borderLight/50 bg-white dark:border-borderDark/50 dark:bg-[#1a1530] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] md:hidden"
            >
                <div className="mx-auto grid h-full max-w-lg grid-cols-4 gap-1 px-2 py-1">
                    {navItems.map(({ href, label, icon: Icon }) => {
                        const isActive = pathname.startsWith(href);

                        return (
                            <Link
                                key={href}
                                href={href}
                                aria-current={isActive ? "page" : undefined}
                                className={`flex min-h-11 min-w-0 flex-col items-center justify-center gap-1 rounded-lg px-1 text-xs transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${isActive
                                    ? "bg-primary/15 font-semibold text-textMainLight dark:text-textMainDark"
                                    : "font-medium text-gray-600 hover:bg-primary/10 dark:text-gray-300"
                                }`}
                            >
                                <Icon aria-hidden="true" className="size-5" />
                                <span>{label}</span>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </>
    );
}
