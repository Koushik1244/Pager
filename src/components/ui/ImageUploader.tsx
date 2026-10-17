"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { useToast } from "@/components/ui/Toast";

type Props = {
    onUpload: (url: string) => void;
    onBeforeCapture?: () => Promise<boolean>;
    onCaptured?: (timestamp: number | null) => void;
    active?: boolean;
};

export default function ImageUploader({
    onUpload,
    onBeforeCapture,
    onCaptured,
    active = true,
}: Props) {
    const showToast = useToast();
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const activeRef = useRef(active);
    const [cameraOpen, setCameraOpen] = useState(false);
    const [cameraReady, setCameraReady] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
    const [capturedAt, setCapturedAt] = useState<number | null>(null);
    const [uploading, setUploading] = useState(false);
    const [cameraError, setCameraError] = useState("");

    activeRef.current = active;

    const stopCamera = useCallback(() => {
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        if (videoRef.current) videoRef.current.srcObject = null;
        setCameraOpen(false);
    }, []);

    useEffect(() => {
        if (!active) {
            stopCamera();
            setCameraReady(false);
        }
    }, [active, stopCamera]);

    useEffect(() => {
        return () => {
            activeRef.current = false;
            streamRef.current?.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        };
    }, []);

    useEffect(() => {
        if (cameraOpen && videoRef.current && streamRef.current) {
            videoRef.current.srcObject = streamRef.current;
        }
    }, [cameraOpen]);

    const openCamera = async () => {
        setCameraError("");
        if (!activeRef.current) return;

        if (onBeforeCapture && !cameraReady) {
            if (await onBeforeCapture()) setCameraReady(true);
            return;
        }

        if (!window.isSecureContext) {
            setCameraError("Camera access requires HTTPS or localhost. Open Pager in a secure browser context.");
            setCameraReady(false);
            return;
        }

        if (!navigator.mediaDevices?.getUserMedia) {
            setCameraError("Camera access is unavailable in this browser. Use HTTPS or localhost and try a supported browser.");
            setCameraReady(false);
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment" },
                audio: false,
            });

            if (!activeRef.current) {
                stream.getTracks().forEach((track) => track.stop());
                return;
            }

            streamRef.current?.getTracks().forEach((track) => track.stop());
            streamRef.current = stream;
            setCameraReady(false);
            setCameraOpen(true);
        } catch (error) {
            const name = error instanceof DOMException ? error.name : "";
            if (name === "NotAllowedError" || name === "PermissionDeniedError" || name === "SecurityError") {
                setCameraError("Camera permission was denied. Allow camera access in your browser settings, then try again.");
            } else if (name === "NotFoundError" || name === "DevicesNotFoundError" || name === "OverconstrainedError") {
                setCameraError("No camera was found on this device.");
            } else {
                setCameraError("The camera could not be started. Check that it is available and try again.");
            }
            setCameraReady(false);
        }
    };

    const captureFrame = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas || video.videoWidth === 0 || video.videoHeight === 0) {
            setCameraError("The camera is not ready yet. Please wait a moment and capture again.");
            return;
        }

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext("2d");
        if (!context) {
            setCameraError("Could not capture the camera frame. Please try again.");
            return;
        }

        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
            if (!blob) {
                setCameraError("Could not create a photo from the camera frame. Please try again.");
                return;
            }

            if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
            setCapturedBlob(blob);
            setPreview(URL.createObjectURL(blob));
            const timestamp = Date.now();
            setCapturedAt(timestamp);
            onCaptured?.(timestamp);
            onUpload("");
            setCameraError("");
            setCameraReady(false);
            stopCamera();
        }, "image/jpeg", 0.92);
    };

    const usePhoto = async () => {
        if (!capturedBlob) return;

        const formData = new FormData();
        formData.append("file", capturedBlob, `pager-proof-${capturedAt ?? Date.now()}.jpg`);

        try {
            setUploading(true);
            setCameraError("");
            const response = await axios.post("/api/upload", formData);
            if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
            setPreview(response.data.url);
            setCapturedBlob(null);
            onUpload(response.data.url);
        } catch (error) {
            console.error(error);
            setCameraError("Photo upload failed. Check your connection and try again.");
            showToast("Photo upload failed. Please try again.", "error");
        } finally {
            setUploading(false);
        }
    };

    const retake = () => {
        if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
        setPreview(null);
        setCapturedBlob(null);
        setCapturedAt(null);
        setCameraReady(false);
        setCameraError("");
        onUpload("");
        onCaptured?.(null);
        void openCamera();
    };

    return (
        <div className="space-y-3">
            <canvas ref={canvasRef} className="hidden" />

            {cameraOpen && (
                <div className="space-y-3">
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full max-h-80 rounded-xl bg-black object-cover"
                    />
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={captureFrame}
                            className="flex-1 rounded-xl bg-primary py-3 font-semibold text-white shadow-glow"
                        >
                            Capture
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                stopCamera();
                                setCameraReady(false);
                            }}
                            className="rounded-xl border border-primary/20 px-4 py-3 text-sm"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {!cameraOpen && preview && (
                <img src={preview} alt="Captured submission preview" className="w-full max-h-80 rounded-xl object-cover" />
            )}

            {!cameraOpen && capturedBlob ? (
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={retake}
                        disabled={uploading}
                        className="flex-1 rounded-xl border border-primary/20 py-3 font-semibold disabled:opacity-50"
                    >
                        Retake
                    </button>
                    <button
                        type="button"
                        onClick={usePhoto}
                        disabled={uploading}
                        className="flex-1 rounded-xl bg-primary py-3 font-semibold text-white shadow-glow disabled:opacity-50"
                    >
                        {uploading ? "Uploading..." : "Use photo"}
                    </button>
                </div>
            ) : !cameraOpen && !capturedBlob && (
                <button
                    type="button"
                    onClick={preview ? retake : openCamera}
                    disabled={uploading || !active}
                    className="w-full rounded-xl bg-primary py-3 font-semibold text-white shadow-glow disabled:opacity-50"
                >
                    {uploading ? "Uploading photo..." : preview ? "Retake" : "Open camera"}
                </button>
            )}

            {cameraError && <p role="alert" className="text-sm text-red-500">{cameraError}</p>}
        </div>
    );
}
