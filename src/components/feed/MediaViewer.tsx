// src\components\feed\MediaViewer.tsx

"use client";

import { useState } from "react";
import MapPreview from "./MapPreview";
import { GrMapLocation } from "react-icons/gr";
import { IoImageSharp } from "react-icons/io5";

type Props = {
    mediaUrl?: string;
    lat: number;
    lng: number;
};

export default function MediaViewer({ mediaUrl, lat, lng }: Props) {
    const [showMap, setShowMap] = useState(!mediaUrl);

    return (
        <div className="relative rounded-md overflow-hidden aspect-video border border-primary/10 group">

            {/* Content */}
            {showMap ? (
                <MapPreview lat={lat} lng={lng} />
            ) : (
                <img
                    src={mediaUrl}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
            )}

            {/* Toggle Button */}
            <button
                onClick={() => setShowMap(!showMap)}
                className="
        absolute top-3 right-3
        bg-black/50 backdrop-blur-md
        text-white px-3 py-1 rounded-lg
        text-xs flex items-center gap-1
        hover:bg-black/70 transition
        "
            >
                <span className="text-sm">
                    {showMap ? <IoImageSharp /> : <GrMapLocation />}
                </span>
                {showMap ? "Image" : "Map"}
            </button>
        </div>
    );
}
