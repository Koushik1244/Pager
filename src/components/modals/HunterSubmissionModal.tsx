"use client";

import { useState } from "react";
import axios from "axios";
import GlassModal from "@/components/ui/GlassModal";
import ImageUploader from "@/components/ui/ImageUploader";
import { useUser } from "@/context/UserContext";

type Props = {
    open: boolean;
    bountyId: string | null;
    onClose: () => void;
    onSubmitted?: () => void;
};

export default function HunterSubmissionModal({
    open,
    bountyId,
    onClose,
    onSubmitted,
}: Props) {
    const { user } = useUser();

    const [description, setDescription] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [loading, setLoading] = useState(false);

    const submit = async () => {
        if (!user) {
            alert("Connect wallet first");
            return;
        }

        if (!bountyId || !imageUrl) {
            alert("Image required");
            return;
        }

        try {
            setLoading(true);

            await axios.post("/api/submission/create", {
                walletAddress: user.walletAddress,
                bountyId,
                description,
                mediaUrl: imageUrl,
            });

            setDescription("");
            setImageUrl("");
            onSubmitted?.();
            onClose();

        } catch (err) {
            console.error(err);
            alert("Submission failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <GlassModal open={open} onClose={onClose} maxWidth="max-w-md">
            <div className="glass-modal p-6 space-y-4">

                <h2 className="text-lg font-bold">
                    Submit Proof
                </h2>

                <textarea
                    placeholder="Describe what you verified..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-3 rounded-xl bg-white dark:bg-neutralDark border border-borderLight dark:border-borderDark"
                />

                <ImageUploader onUpload={setImageUrl} />

                <button
                    onClick={submit}
                    disabled={loading}
                    className="w-full py-3 bg-primary text-white rounded-xl shadow-glow hover:scale-[1.01] transition"
                >
                    {loading ? "Submitting..." : "Submit Proof"}
                </button>
            </div>
        </GlassModal>
    );
}
