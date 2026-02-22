"use client";

import { useEffect, useState } from "react";
import ModalPortal from "@/components/ModalPortal";

type Props = {
    children: React.ReactNode;
    open: boolean;  // ✅ ADD THIS
    onClose?: () => void;
    maxWidth?: string;
};

export default function GlassModal({
    children,
    open,
    onClose,
    maxWidth = "max-w-md",
}: Props) {
    const [mounted, setMounted] = useState(false);

    // Handle mount/unmount + scroll lock
    useEffect(() => {
        if (typeof window === "undefined") return;

        if (open) {
            setMounted(true);
            document.body.style.overflow = "hidden";
        } else {
            const t = setTimeout(() => setMounted(false), 250);
            document.body.style.overflow = "auto";
            return () => clearTimeout(t);
        }
    }, [open]);

    if (!mounted) return null;

    return (
        <ModalPortal>
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                {/* Overlay */}
                <div
                    onClick={onClose}
                    className="absolute inset-0 bg-black/40 backdrop-blur-md"
                />

                {/* Modal */}
                <div
                    className={`
            relative w-full ${maxWidth}
            transform transition-all duration-300 ease-out
            ${open ? "scale-100 opacity-100" : "scale-95 opacity-0"}
          `}
                >
                    {children}
                </div>
            </div>
        </ModalPortal>
    );
}
