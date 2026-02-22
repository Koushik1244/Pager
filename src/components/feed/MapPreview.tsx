// src\components\feed\MapPreview.tsx

"use client";

import mapboxgl from "mapbox-gl";
import { useEffect, useRef } from "react";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

type Props = {
    lat: number;
    lng: number;
};

export default function MapPreview({ lat, lng }: Props) {
    const mapRef = useRef<HTMLDivElement | null>(null);
    const mapInstance = useRef<mapboxgl.Map | null>(null);

    useEffect(() => {
        if (!mapRef.current || mapInstance.current) return;

        const isDark = document.documentElement.classList.contains("dark");

        mapInstance.current = new mapboxgl.Map({
            container: mapRef.current,
            style: isDark
                ? "mapbox://styles/mapbox/dark-v11"
                : "mapbox://styles/mapbox/light-v11",
            center: [lng, lat],
            zoom: 12,
            interactive: false,
        });

        new mapboxgl.Marker({ color: "#866bff" })
            .setLngLat([lng, lat])
            .addTo(mapInstance.current);
    }, [lat, lng]);

    return (
        <div className="w-full h-full rounded-md overflow-hidden">
            <div ref={mapRef} className="w-full h-full" />
        </div>
    );
}
