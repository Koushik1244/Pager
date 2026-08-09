"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import axios from "axios";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

export default function BountyMap() {
    const mapContainer = useRef<HTMLDivElement>(null);
    const mapRef = useRef<mapboxgl.Map | null>(null);
    const markersRef = useRef<mapboxgl.Marker[]>([]);
    const [bounties, setBounties] = useState<any[]>([]);

    // Fetch bounties
    useEffect(() => {
        const fetchBounties = async () => {
            try {
                const res = await axios.get("/api/bounty/all");
                setBounties(res.data.bounties);
            } catch (err) {
                console.error("Failed to load bounties");
            }
        };

        fetchBounties();
    }, []);

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

            if (!lat || !lng) return;

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
        <div
            ref={mapContainer}
            className="w-full h-[75vh]"
        />
    );
}
