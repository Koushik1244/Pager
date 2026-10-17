"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import axios from "axios";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

export default function BountyMap() {
    const mapContainer = useRef<HTMLDivElement>(null);
    const mapRef = useRef<mapboxgl.Map | null>(null);
    const markersRef = useRef<mapboxgl.Marker[]>([]);
    const [bounties, setBounties] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Fetch bounties
    const fetchBounties = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const res = await axios.get("/api/bounty/all");
            setBounties(res.data.bounties ?? []);
        } catch (err) {
            console.error("Failed to load bounties:", err);
            setError("We couldn't load map bounties. Check your connection and try again.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchBounties();
    }, [fetchBounties]);

    // Initialize map
    useEffect(() => {
        if (!mapContainer.current || mapRef.current) return;

        mapRef.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: "mapbox://styles/mapbox/dark-v11", // Better for dark mode
            center: [78.9629, 20.5937], // India center
            zoom: 3,
        });

        mapRef.current.addControl(new mapboxgl.NavigationControl(), "top-right");
    }, []);

    // Add markers
    useEffect(() => {
        if (!mapRef.current) return;

        // Remove old markers
        markersRef.current.forEach(marker => marker.remove());
        markersRef.current = [];

        bounties.forEach((bounty) => {
            const lat = bounty.location?.lat;
            const lng = bounty.location?.lng;

            if (lat == null || lng == null) return;

            // Marker element (purple glow)
            const el = document.createElement("div");
            el.className = `
                w-4 h-4 rounded-full cursor-pointer
                ${bounty.status === "completed"
                    ? "bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.8)]"
                    : "bg-primary shadow-[0_0_14px_rgba(134,107,255,0.9)]"}
                border-2 border-white
            `;

            // Popup HTML (Pager styled)
            const popup = new mapboxgl.Popup({ offset: 20 }).setHTML(`
                <div style="
                    font-family: system-ui;
                    padding: 6px;
                    max-width: 220px;
                ">
                    <strong>@${bounty.username}</strong><br/>
                    <span style="font-size:12px;">
                        ${bounty.description.slice(0, 80)}...
                    </span>
                    <br/>
                    <span style="
                        color:#866bff;
                        font-weight:600;
                        font-size:12px;
                    ">
                        ${bounty.reward} USDC
                    </span>
                    <br/>
                    <span style="
                        font-size:11px;
                        color:${bounty.status === "completed" ? "#22c55e" : "#998dce"};
                    ">
                        ${bounty.status === "completed" ? "Completed" : "Active"}
                    </span>
                </div>
            `);

            const marker = new mapboxgl.Marker(el)
                .setLngLat([lng, lat])
                .setPopup(popup)
                .addTo(mapRef.current!);

            markersRef.current.push(marker);
        });
    }, [bounties]);

    return (
        <div className="relative">
            <div ref={mapContainer} className="h-[75vh] w-full" />
            {loading && (
                <div className="absolute inset-0 z-10 animate-pulse space-y-4 bg-backgroundLight/90 p-6 dark:bg-backgroundDark/90" aria-label="Loading map">
                    <div className="h-8 w-48 rounded-lg bg-primary/10" />
                    <div className="h-4 w-64 max-w-full rounded bg-primary/10" />
                    <div className="flex h-[calc(75vh-5rem)] items-center justify-center rounded-xl bg-primary/10">
                        <span className="rounded-full bg-white/80 px-4 py-2 text-sm font-medium dark:bg-cardDark/80">Loading map and bounties...</span>
                    </div>
                </div>
            )}
            {!loading && error && (
                <div role="alert" className="absolute inset-x-4 top-4 z-10 rounded-xl border border-red-500/30 bg-white/95 p-5 text-center shadow-lg dark:bg-cardDark/95">
                    <p className="text-sm">{error}</p>
                    <button onClick={() => void fetchBounties()} className="mt-3 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white">Retry</button>
                </div>
            )}
            {!loading && !error && bounties.length === 0 && (
                <div className="absolute inset-x-4 top-4 z-10 rounded-xl border border-primary/20 bg-white/95 p-5 text-center shadow-lg dark:bg-cardDark/95">
                    <p className="font-semibold">No bounties to show yet</p>
                    <p className="mt-1 text-sm text-textMutedDark">Posted bounties with locations will appear on the map.</p>
                </div>
            )}
        </div>
    );
}
