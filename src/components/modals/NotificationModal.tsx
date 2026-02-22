"use client";

import GlassModal from "../ui/GlassModal";
import GlassCard from "../ui/GlassCard";

type Props = {
    open: boolean;
    onClose: () => void;
};

export default function NotificationModal({ open, onClose }: Props) {
    return (
        <GlassModal onClose={onClose} open={open} maxWidth="max-w-md">
            <GlassCard className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-textMainLight dark:text-textMainDark">
                        Notifications
                    </h2>

                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-primary p-1"
                    >
                        <span className="material-symbols-outlined text-base">close</span>
                    </button>
                </div>

                {/* Empty state */}
                <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-10">
                    No notifications yet
                </div>
            </GlassCard>
        </GlassModal>
    );
}
