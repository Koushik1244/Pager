"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function ModalPortal({
    children,
}: {
    children: React.ReactNode;
}) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = "auto";
        };
    }, []);

    if (!mounted) return null;

    return createPortal(children, document.body);
}
