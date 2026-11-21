"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import GlassModal from "@/components/ui/GlassModal";
import ImageUploader from "@/components/ui/ImageUploader";
import { useUser } from "@/context/UserContext";
import { signAction } from "@/lib/signAction";
import { distanceMeters } from "@/lib/bountyRules";
import { useToast } from "@/components/ui/Toast";

type Props = {
    open: boolean;
    bountyId: string | null;
    bounty: any | null;
    onClose: () => void;
    onSubmitted?: () => void;
};

export default function HunterSubmissionModal({
    open,
    bountyId,
    bounty,
    onClose,
    onSubmitted,
}: Props) {
    const { user } = useUser();
    const showToast = useToast();

    const [description, setDescription] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [captureLocation, setCaptureLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [capturedAt, setCapturedAt] = useState<number | null>(null);
    const [locationMessage, setLocationMessage] = useState("Check your location before opening the camera.");

    useEffect(() => {
        if (open) {
            setImageUrl("");
            setCaptureLocation(null);
            setCapturedAt(null);
            setLocationMessage("Check your location before opening the camera.");
        }
    }, [open, bountyId]);

    const verifyLocationBeforeCapture = async () => {
        const bountyLat = Number(bounty?.location?.lat);
        const bountyLng = Number(bounty?.location?.lng);
        if (!Number.isFinite(bountyLat) || !Number.isFinite(bountyLng)) {
            setLocationMessage("This bounty does not have a valid location, so camera capture is unavailable.");
            showToast("This bounty does not have a valid location, so camera capture is unavailable.", "error");
            return false;
        }

        if (!navigator.geolocation) {
            setLocationMessage("Location access is required to open the camera for this submission.");
            showToast("Location access is required to open the camera for this submission.", "error");
            return false;
        }

        setLocationMessage("Checking your location...");
        return new Promise<boolean>((resolve) => {
            navigator.geolocation.getCurrentPosition(
                ({ coords }) => {
                    const distance = distanceMeters(coords.latitude, coords.longitude, bountyLat, bountyLng);
                    if (distance > 150) {
                        setLocationMessage("You must be at the location (within 150 meters) to open the camera.");
                        showToast(`You are ${Math.round(distance)} m away. Move within 150 m of the bounty.`, "error");
                        resolve(false);
                        return;
                    }

                    setCaptureLocation({ lat: coords.latitude, lng: coords.longitude });
                    setLocationMessage("Location confirmed.");
                    resolve(true);
                },
                (error) => {
                    const message = error.code === error.PERMISSION_DENIED
                        ? "Location permission is required. Allow location access and try again."
                        : "Could not verify your location. Check location services and try again.";
                    setLocationMessage(message);
                    showToast(message, "error");
                    resolve(false);
                },
                { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
            );
        });
    };

    const submit = async () => {
        if (!user) {
            showToast("Connect your wallet first.", "info");
            return;
        }

        if (!bountyId || !imageUrl || !captureLocation || !capturedAt) {
            showToast("Open the camera and capture a photo at the bounty location first.", "error");
            return;
        }

        try {
            setLoading(true);

            const auth = await signAction("submission/create", bountyId!);

            await axios.post("/api/submission/create", {
                ...auth,
                bountyId,
                description,
                mediaUrl: imageUrl,
                captureLat: captureLocation.lat,
                captureLng: captureLocation.lng,
                capturedAt,
            });

            setDescription("");
            setImageUrl("");
            setCaptureLocation(null);
            setCapturedAt(null);
            onSubmitted?.();
            onClose();

        } catch (err) {
            console.error(err);
            const message = axios.isAxiosError(err) && typeof err.response?.data?.error === "string"
                ? err.response.data.error
                : "Submission failed. Please try again.";
            showToast(message, "error");
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

                <p role="status" className="text-sm text-textMainLight dark:text-textMainDark">
                    {locationMessage}
                </p>

                <ImageUploader
                    key={`${open}:${bountyId}`}
                    active={open}
                    onUpload={setImageUrl}
                    onBeforeCapture={verifyLocationBeforeCapture}
                    onCaptured={setCapturedAt}
                />

                <button
                    onClick={submit}
                    disabled={loading || !imageUrl || !captureLocation || !capturedAt}
                    className="w-full py-3 bg-primary text-white rounded-xl shadow-glow hover:scale-[1.01] transition disabled:opacity-50"
                >
                    {loading ? "Submitting..." : "Submit Proof"}
                </button>
            </div>
        </GlassModal>
    );
}
