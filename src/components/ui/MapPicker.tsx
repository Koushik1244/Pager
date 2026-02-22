"use client";

import mapboxgl from "mapbox-gl";
import { useEffect, useRef } from "react";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

type Props = {
    onLocationSelect: (lat: number, lng: number) => void;
};

export default function MapPicker({ onLocationSelect }: Props) {
    const mapContainer = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<mapboxgl.Map | null>(null);
    const markerRef = useRef<mapboxgl.Marker | null>(null);

    useEffect(() => {
        if (!mapContainer.current || mapRef.current) return;

        const isDark = document.documentElement.classList.contains("dark");

        mapRef.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: isDark
                ? "mapbox://styles/mapbox/dark-v11"
                : "mapbox://styles/mapbox/light-v11",
            center: [77.209, 28.6139], // Default: India
            zoom: 3,
        });

        // Click to place marker
        mapRef.current.on("click", (e) => {
            const { lng, lat } = e.lngLat;

            if (markerRef.current) {
                markerRef.current.remove();
            }

            markerRef.current = new mapboxgl.Marker({
                color: "#866bff",
            })
                .setLngLat([lng, lat])
                .addTo(mapRef.current!);

            onLocationSelect(lat, lng);
        });
    }, [onLocationSelect]);

    return (
        <div className="w-full h-56 rounded-lg overflow-hidden border border-primary/20 shadow-inner">
            <div ref={mapContainer} className="w-full h-full" />
        </div>
    );
}
